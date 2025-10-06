const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Appointment, Therapist, TherapistAvailability, BlockedTime } = require('../src/models');

/**
 * Availability API Tests
 * בדיקות מקיפות ל-API של זמינות
 */

let app;
let therapistToken;
let therapist;
let availability;

const mockTherapist = {
    firstName: 'ד"ר',
    lastName: 'מיכל',
    email: 'michal@test.com',
    phone: '0501234567',
    specialties: ['anxiety', 'depression'],
    timezone: 'Asia/Jerusalem',
    isActive: true
};

describe('Availability API', () => {
    beforeAll(async () => {
        // Connect to test database
        const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/wellness_test';
        await mongoose.connect(mongoUri);

        // Import app after database connection
        app = require('../src/app');

        // Create test therapist
        therapist = await Therapist.create(mockTherapist);
        therapistToken = jwt.sign(
            { id: therapist._id, role: 'THERAPIST' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        // Cleanup test data
        await Appointment.deleteMany({});
        await Therapist.deleteMany({});
        await TherapistAvailability.deleteMany({});
        await BlockedTime.deleteMany({});

        // Close database connection
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clean up availability data before each test
        await TherapistAvailability.deleteMany({});
        await BlockedTime.deleteMany({});
        await Appointment.deleteMany({});
    });

    describe('GET /api/availability/slots', () => {
        beforeEach(async () => {
            // Create therapist availability
            availability = await TherapistAvailability.create({
                therapistId: therapist._id,
                weeklySchedule: [
                    {
                        dayOfWeek: 1, // Monday
                        isAvailable: true,
                        timeSlots: [
                            { startTime: '09:00', endTime: '12:00' },
                            { startTime: '14:00', endTime: '17:00' }
                        ]
                    },
                    {
                        dayOfWeek: 2, // Tuesday
                        isAvailable: true,
                        timeSlots: [
                            { startTime: '10:00', endTime: '16:00' }
                        ]
                    }
                ],
                bufferTime: 15,
                maxDailyAppointments: 8,
                timezone: 'Asia/Jerusalem'
            });
        });

        it('should return available time slots for a given date', async () => {
            const res = await request(app)
                .get('/api/availability/slots')
                .query({
                    therapistId: therapist._id,
                    date: '2025-12-15', // Monday
                    duration: 60
                })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.slots)).toBe(true);
            expect(res.body.slots.length).toBeGreaterThan(0);

            // Check that slots are properly formatted
            const slot = res.body.slots[0];
            expect(slot).toHaveProperty('startTime');
            expect(slot).toHaveProperty('endTime');
            expect(slot).toHaveProperty('available');
        });

        it('should exclude booked slots', async () => {
            // Create an appointment
            await Appointment.create({
                therapistId: therapist._id,
                clientId: new mongoose.Types.ObjectId(),
                serviceType: 'individual',
                startTime: new Date('2025-12-15T10:00:00.000Z'),
                endTime: new Date('2025-12-15T11:00:00.000Z'),
                duration: 60,
                status: 'confirmed'
            });

            const res = await request(app)
                .get('/api/availability/slots')
                .query({
                    therapistId: therapist._id,
                    date: '2025-12-15',
                    duration: 60
                })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);

            // Find the booked slot
            const bookedSlot = res.body.slots.find(slot =>
                slot.startTime === '10:00'
            );

            expect(bookedSlot).toBeDefined();
            expect(bookedSlot.available).toBe(false);
            expect(bookedSlot.reason).toBe('Booked');
        });

        it('should exclude blocked time slots', async () => {
            // Create blocked time
            await BlockedTime.create({
                therapistId: therapist._id,
                startTime: new Date('2025-12-15T11:00:00.000Z'),
                endTime: new Date('2025-12-15T12:00:00.000Z'),
                reason: 'vacation',
                isRecurring: false
            });

            const res = await request(app)
                .get('/api/availability/slots')
                .query({
                    therapistId: therapist._id,
                    date: '2025-12-15',
                    duration: 60
                })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);

            // Find the blocked slot
            const blockedSlot = res.body.slots.find(slot =>
                slot.startTime === '11:00'
            );

            expect(blockedSlot).toBeDefined();
            expect(blockedSlot.available).toBe(false);
            expect(blockedSlot.reason).toBe('Blocked');
        });

        it('should respect buffer time between appointments', async () => {
            // Create an appointment
            await Appointment.create({
                therapistId: therapist._id,
                clientId: new mongoose.Types.ObjectId(),
                serviceType: 'individual',
                startTime: new Date('2025-12-15T10:00:00.000Z'),
                endTime: new Date('2025-12-15T11:00:00.000Z'),
                duration: 60,
                status: 'confirmed'
            });

            const res = await request(app)
                .get('/api/availability/slots')
                .query({
                    therapistId: therapist._id,
                    date: '2025-12-15',
                    duration: 60
                })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);

            // Check that slots around the appointment are blocked due to buffer time
            const slotsAroundAppointment = res.body.slots.filter(slot =>
                slot.startTime === '09:45' || slot.startTime === '11:15'
            );

            slotsAroundAppointment.forEach(slot => {
                expect(slot.available).toBe(false);
                expect(slot.reason).toBe('Buffer time');
            });
        });

        it('should return empty slots for unavailable days', async () => {
            const res = await request(app)
                .get('/api/availability/slots')
                .query({
                    therapistId: therapist._id,
                    date: '2025-12-14', // Sunday (not in schedule)
                    duration: 60
                })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.slots.length).toBe(0);
        });

        it('should handle different duration requests', async () => {
            const res = await request(app)
                .get('/api/availability/slots')
                .query({
                    therapistId: therapist._id,
                    date: '2025-12-15',
                    duration: 90 // 90 minutes
                })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.slots.length).toBeGreaterThan(0);

            // Check that slots accommodate the requested duration
            res.body.slots.forEach(slot => {
                if (slot.available) {
                    const startTime = new Date(`2025-12-15T${slot.startTime}:00.000Z`);
                    const endTime = new Date(`2025-12-15T${slot.endTime}:00.000Z`);
                    const duration = (endTime - startTime) / (1000 * 60); // minutes
                    expect(duration).toBeGreaterThanOrEqual(90);
                }
            });
        });

        it('should require therapistId parameter', async () => {
            const res = await request(app)
                .get('/api/availability/slots')
                .query({
                    date: '2025-12-15',
                    duration: 60
                })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should require date parameter', async () => {
            const res = await request(app)
                .get('/api/availability/slots')
                .query({
                    therapistId: therapist._id,
                    duration: 60
                })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should validate date format', async () => {
            const res = await request(app)
                .get('/api/availability/slots')
                .query({
                    therapistId: therapist._id,
                    date: 'invalid-date',
                    duration: 60
                })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should handle past dates', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            const pastDateString = pastDate.toISOString().split('T')[0];

            const res = await request(app)
                .get('/api/availability/slots')
                .query({
                    therapistId: therapist._id,
                    date: pastDateString,
                    duration: 60
                })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.slots.length).toBe(0);
        });

        it('should handle timezone conversion', async () => {
            const res = await request(app)
                .get('/api/availability/slots')
                .query({
                    therapistId: therapist._id,
                    date: '2025-12-15',
                    duration: 60,
                    timezone: 'UTC'
                })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.timezone).toBe('UTC');
        });
    });

    describe('GET /api/availability', () => {
        beforeEach(async () => {
            // Create therapist availability
            availability = await TherapistAvailability.create({
                therapistId: therapist._id,
                weeklySchedule: [
                    {
                        dayOfWeek: 1,
                        isAvailable: true,
                        timeSlots: [
                            { startTime: '09:00', endTime: '17:00' }
                        ]
                    }
                ],
                bufferTime: 15,
                maxDailyAppointments: 8,
                timezone: 'Asia/Jerusalem'
            });
        });

        it('should return therapist availability settings', async () => {
            const res = await request(app)
                .get('/api/availability')
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.availability).toBeDefined();
            expect(res.body.availability.therapistId).toBe(therapist._id.toString());
            expect(res.body.availability.weeklySchedule).toBeDefined();
            expect(res.body.availability.bufferTime).toBe(15);
            expect(res.body.availability.maxDailyAppointments).toBe(8);
        });

        it('should return blocked times', async () => {
            // Create blocked time
            await BlockedTime.create({
                therapistId: therapist._id,
                startTime: new Date('2025-12-20T00:00:00.000Z'),
                endTime: new Date('2025-12-22T00:00:00.000Z'),
                reason: 'vacation',
                isRecurring: false
            });

            const res = await request(app)
                .get('/api/availability')
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.blockedTimes).toBeDefined();
            expect(Array.isArray(res.body.blockedTimes)).toBe(true);
            expect(res.body.blockedTimes.length).toBe(1);
            expect(res.body.blockedTimes[0].reason).toBe('vacation');
        });

        it('should return 404 if therapist has no availability settings', async () => {
            // Delete availability
            await TherapistAvailability.deleteMany({});

            const res = await request(app)
                .get('/api/availability')
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('PUT /api/availability', () => {
        it('should create availability settings', async () => {
            const availabilityData = {
                weeklySchedule: [
                    {
                        dayOfWeek: 1,
                        isAvailable: true,
                        timeSlots: [
                            { startTime: '09:00', endTime: '17:00' }
                        ]
                    }
                ],
                bufferTime: 15,
                maxDailyAppointments: 8,
                timezone: 'Asia/Jerusalem'
            };

            const res = await request(app)
                .put('/api/availability')
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(availabilityData);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.availability).toBeDefined();
            expect(res.body.availability.therapistId).toBe(therapist._id.toString());
        });

        it('should update existing availability settings', async () => {
            // Create initial availability
            await TherapistAvailability.create({
                therapistId: therapist._id,
                weeklySchedule: [
                    {
                        dayOfWeek: 1,
                        isAvailable: true,
                        timeSlots: [
                            { startTime: '09:00', endTime: '17:00' }
                        ]
                    }
                ],
                bufferTime: 15,
                maxDailyAppointments: 8,
                timezone: 'Asia/Jerusalem'
            });

            const updateData = {
                bufferTime: 30,
                maxDailyAppointments: 10
            };

            const res = await request(app)
                .put('/api/availability')
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.availability.bufferTime).toBe(30);
            expect(res.body.availability.maxDailyAppointments).toBe(10);
        });

        it('should validate time slot format', async () => {
            const invalidData = {
                weeklySchedule: [
                    {
                        dayOfWeek: 1,
                        isAvailable: true,
                        timeSlots: [
                            { startTime: '25:00', endTime: '26:00' } // Invalid time
                        ]
                    }
                ]
            };

            const res = await request(app)
                .put('/api/availability')
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(invalidData);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should validate day of week range', async () => {
            const invalidData = {
                weeklySchedule: [
                    {
                        dayOfWeek: 7, // Invalid (should be 0-6)
                        isAvailable: true,
                        timeSlots: [
                            { startTime: '09:00', endTime: '17:00' }
                        ]
                    }
                ]
            };

            const res = await request(app)
                .put('/api/availability')
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(invalidData);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/availability/block-time', () => {
        it('should create blocked time', async () => {
            const blockData = {
                startTime: new Date('2025-12-20T00:00:00.000Z'),
                endTime: new Date('2025-12-22T00:00:00.000Z'),
                reason: 'vacation',
                isRecurring: false
            };

            const res = await request(app)
                .post('/api/availability/block-time')
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(blockData);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.blockedTime).toBeDefined();
            expect(res.body.blockedTime.therapistId).toBe(therapist._id.toString());
            expect(res.body.blockedTime.reason).toBe('vacation');
        });

        it('should create recurring blocked time', async () => {
            const recurringBlockData = {
                startTime: new Date('2025-12-20T00:00:00.000Z'),
                endTime: new Date('2025-12-20T23:59:59.000Z'),
                reason: 'weekly break',
                isRecurring: true,
                recurringPattern: {
                    frequency: 'weekly',
                    endDate: new Date('2025-12-31T00:00:00.000Z')
                }
            };

            const res = await request(app)
                .post('/api/availability/block-time')
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(recurringBlockData);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.blockedTime.isRecurring).toBe(true);
            expect(res.body.blockedTime.recurringPattern.frequency).toBe('weekly');
        });

        it('should reject overlapping blocked times', async () => {
            // Create first blocked time
            await BlockedTime.create({
                therapistId: therapist._id,
                startTime: new Date('2025-12-20T00:00:00.000Z'),
                endTime: new Date('2025-12-22T00:00:00.000Z'),
                reason: 'vacation',
                isRecurring: false
            });

            // Try to create overlapping blocked time
            const overlappingBlockData = {
                startTime: new Date('2025-12-21T00:00:00.000Z'),
                endTime: new Date('2025-12-23T00:00:00.000Z'),
                reason: 'sick leave',
                isRecurring: false
            };

            const res = await request(app)
                .post('/api/availability/block-time')
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(overlappingBlockData);

            expect(res.statusCode).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it('should validate start time is before end time', async () => {
            const invalidBlockData = {
                startTime: new Date('2025-12-22T00:00:00.000Z'),
                endTime: new Date('2025-12-20T00:00:00.000Z'), // Before start time
                reason: 'invalid',
                isRecurring: false
            };

            const res = await request(app)
                .post('/api/availability/block-time')
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(invalidBlockData);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('Authentication and Authorization', () => {
        it('should require authentication for all endpoints', async () => {
            const endpoints = [
                { method: 'GET', path: '/api/availability/slots' },
                { method: 'GET', path: '/api/availability' },
                { method: 'PUT', path: '/api/availability' },
                { method: 'POST', path: '/api/availability/block-time' }
            ];

            for (const endpoint of endpoints) {
                const res = await request(app)[endpoint.method.toLowerCase()](endpoint.path);
                expect(res.statusCode).toBe(401);
            }
        });

        it('should only allow therapists to access their own availability', async () => {
            // Create another therapist
            const otherTherapist = await Therapist.create({
                firstName: 'ד"ר',
                lastName: 'אחר',
                email: 'other@test.com',
                phone: '0507654321',
                specialties: ['anxiety'],
                timezone: 'Asia/Jerusalem',
                isActive: true
            });

            const otherTherapistToken = jwt.sign(
                { id: otherTherapist._id, role: 'THERAPIST' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '1h' }
            );

            const res = await request(app)
                .get('/api/availability')
                .set('Authorization', `Bearer ${otherTherapistToken}`);

            expect(res.statusCode).toBe(404); // No availability settings for this therapist
        });
    });

    describe('Performance Tests', () => {
        it('should handle large number of appointments efficiently', async () => {
            // Create many appointments
            const appointments = [];
            for (let i = 0; i < 100; i++) {
                appointments.push({
                    therapistId: therapist._id,
                    clientId: new mongoose.Types.ObjectId(),
                    serviceType: 'individual',
                    startTime: new Date(`2025-12-15T${10 + (i % 8)}:00:00.000Z`),
                    endTime: new Date(`2025-12-15T${11 + (i % 8)}:00:00.000Z`),
                    duration: 60,
                    status: 'confirmed'
                });
            }

            await Appointment.insertMany(appointments);

            const startTime = Date.now();
            const res = await request(app)
                .get('/api/availability/slots')
                .query({
                    therapistId: therapist._id,
                    date: '2025-12-15',
                    duration: 60
                })
                .set('Authorization', `Bearer ${therapistToken}`);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(res.statusCode).toBe(200);
            expect(duration).toBeLessThan(1000); // Should complete within 1 second
        });
    });
});
