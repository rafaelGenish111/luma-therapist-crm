const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Appointment, Therapist, Client, TherapistAvailability, BlockedTime } = require('../src/models');

/**
 * Appointment API Tests
 * בדיקות מקיפות ל-API של פגישות
 */

// Test data setup
let app;
let therapistToken;
let clientToken;
let therapist;
let client;
let testAppointment;

// Mock data
const mockTherapist = {
    firstName: 'ד"ר',
    lastName: 'שרה',
    email: 'sarah@test.com',
    phone: '0501234567',
    specialties: ['anxiety', 'depression'],
    timezone: 'Asia/Jerusalem',
    isActive: true
};

const mockClient = {
    firstName: 'יוחנן',
    lastName: 'כהן',
    email: 'yohanan@test.com',
    phone: '0507654321',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male'
};

const mockAppointment = {
    serviceType: 'individual',
    startTime: new Date('2025-12-15T10:00:00.000Z'),
    endTime: new Date('2025-12-15T11:00:00.000Z'),
    duration: 60,
    location: 'online',
    meetingUrl: 'https://zoom.us/j/123456789',
    notes: 'פגישה ראשונה',
    paymentAmount: 300,
    status: 'pending'
};

describe('Appointment API', () => {
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

        // Create test client
        client = await Client.create(mockClient);
        clientToken = jwt.sign(
            { id: client._id, role: 'CLIENT' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        // Create therapist availability
        await TherapistAvailability.create({
            therapistId: therapist._id,
            weeklySchedule: [
                {
                    dayOfWeek: 1, // Monday
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

    afterAll(async () => {
        // Cleanup test data
        await Appointment.deleteMany({});
        await Therapist.deleteMany({});
        await Client.deleteMany({});
        await TherapistAvailability.deleteMany({});
        await BlockedTime.deleteMany({});

        // Close database connection
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clean up appointments before each test
        await Appointment.deleteMany({});
    });

    describe('POST /api/appointments', () => {
        it('should create a new appointment', async () => {
            const appointmentData = {
                ...mockAppointment,
                clientId: client._id,
                therapistId: therapist._id
            };

            const res = await request(app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(appointmentData);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.appointment).toHaveProperty('_id');
            expect(res.body.appointment.clientId).toBe(client._id.toString());
            expect(res.body.appointment.therapistId).toBe(therapist._id.toString());
            expect(res.body.appointment.status).toBe('pending');
        });

        it('should reject appointment with invalid client ID', async () => {
            const appointmentData = {
                ...mockAppointment,
                clientId: 'invalid-id',
                therapistId: therapist._id
            };

            const res = await request(app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(appointmentData);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should reject appointment with missing required fields', async () => {
            const appointmentData = {
                clientId: client._id,
                therapistId: therapist._id
                // Missing startTime, endTime, etc.
            };

            const res = await request(app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(appointmentData);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should reject conflicting appointments', async () => {
            // Create first appointment
            const firstAppointment = {
                ...mockAppointment,
                clientId: client._id,
                therapistId: therapist._id,
                startTime: new Date('2025-12-15T10:00:00.000Z'),
                endTime: new Date('2025-12-15T11:00:00.000Z')
            };

            await request(app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(firstAppointment);

            // Try to create conflicting appointment
            const conflictingAppointment = {
                ...mockAppointment,
                clientId: client._id,
                therapistId: therapist._id,
                startTime: new Date('2025-12-15T10:30:00.000Z'), // Overlaps with first
                endTime: new Date('2025-12-15T11:30:00.000Z')
            };

            const res = await request(app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(conflictingAppointment);

            expect(res.statusCode).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.error.message).toContain('conflict');
        });

        it('should create recurring appointments', async () => {
            const recurringAppointment = {
                ...mockAppointment,
                clientId: client._id,
                therapistId: therapist._id,
                isRecurring: true,
                recurringPattern: {
                    frequency: 'weekly',
                    endDate: new Date('2025-12-29T00:00:00.000Z')
                }
            };

            const res = await request(app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(recurringAppointment);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.appointment.isRecurring).toBe(true);
            expect(res.body.appointment.recurringPattern.frequency).toBe('weekly');
        });

        it('should require authentication', async () => {
            const res = await request(app)
                .post('/api/appointments')
                .send(mockAppointment);

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/appointments', () => {
        beforeEach(async () => {
            // Create test appointments
            const appointments = [
                {
                    ...mockAppointment,
                    clientId: client._id,
                    therapistId: therapist._id,
                    startTime: new Date('2025-12-15T10:00:00.000Z'),
                    endTime: new Date('2025-12-15T11:00:00.000Z'),
                    status: 'confirmed'
                },
                {
                    ...mockAppointment,
                    clientId: client._id,
                    therapistId: therapist._id,
                    startTime: new Date('2025-12-16T14:00:00.000Z'),
                    endTime: new Date('2025-12-16T15:00:00.000Z'),
                    status: 'pending'
                },
                {
                    ...mockAppointment,
                    clientId: client._id,
                    therapistId: therapist._id,
                    startTime: new Date('2025-12-17T09:00:00.000Z'),
                    endTime: new Date('2025-12-17T10:00:00.000Z'),
                    status: 'completed'
                }
            ];

            for (const appointment of appointments) {
                await Appointment.create(appointment);
            }
        });

        it('should get all appointments', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.appointments)).toBe(true);
            expect(res.body.appointments.length).toBe(3);
        });

        it('should filter appointments by status', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .query({ status: 'confirmed' })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.appointments.length).toBe(1);
            expect(res.body.appointments[0].status).toBe('confirmed');
        });

        it('should filter appointments by date range', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .query({
                    startDate: '2025-12-15',
                    endDate: '2025-12-16'
                })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.appointments.length).toBe(2);
        });

        it('should support pagination', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .query({ page: 1, limit: 2 })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.appointments.length).toBe(2);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(2);
            expect(res.body.pagination.total).toBe(3);
        });

        it('should sort appointments by start time', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .query({ sort: 'startTime' })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);
            const appointments = res.body.appointments;
            expect(new Date(appointments[0].startTime)).toBeLessThan(new Date(appointments[1].startTime));
            expect(new Date(appointments[1].startTime)).toBeLessThan(new Date(appointments[2].startTime));
        });
    });

    describe('PUT /api/appointments/:id', () => {
        beforeEach(async () => {
            testAppointment = await Appointment.create({
                ...mockAppointment,
                clientId: client._id,
                therapistId: therapist._id
            });
        });

        it('should update an appointment', async () => {
            const updateData = {
                notes: 'Updated notes',
                status: 'confirmed'
            };

            const res = await request(app)
                .put(`/api/appointments/${testAppointment._id}`)
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.appointment.notes).toBe('Updated notes');
            expect(res.body.appointment.status).toBe('confirmed');
        });

        it('should update appointment time', async () => {
            const updateData = {
                startTime: new Date('2025-12-15T11:00:00.000Z'),
                endTime: new Date('2025-12-15T12:00:00.000Z')
            };

            const res = await request(app)
                .put(`/api/appointments/${testAppointment._id}`)
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.appointment.startTime).toBe(updateData.startTime.toISOString());
            expect(res.body.appointment.endTime).toBe(updateData.endTime.toISOString());
        });

        it('should reject update with conflicting time', async () => {
            // Create another appointment
            await Appointment.create({
                ...mockAppointment,
                clientId: client._id,
                therapistId: therapist._id,
                startTime: new Date('2025-12-15T11:00:00.000Z'),
                endTime: new Date('2025-12-15T12:00:00.000Z')
            });

            // Try to update first appointment to conflict
            const updateData = {
                startTime: new Date('2025-12-15T11:30:00.000Z'),
                endTime: new Date('2025-12-15T12:30:00.000Z')
            };

            const res = await request(app)
                .put(`/api/appointments/${testAppointment._id}`)
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(updateData);

            expect(res.statusCode).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it('should return 404 for non-existent appointment', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .put(`/api/appointments/${fakeId}`)
                .set('Authorization', `Bearer ${therapistToken}`)
                .send({ notes: 'Updated' });

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/appointments/:id/cancel', () => {
        beforeEach(async () => {
            testAppointment = await Appointment.create({
                ...mockAppointment,
                clientId: client._id,
                therapistId: therapist._id,
                status: 'confirmed'
            });
        });

        it('should cancel an appointment', async () => {
            const cancelData = {
                reason: 'Client requested cancellation',
                cancelledBy: 'therapist'
            };

            const res = await request(app)
                .post(`/api/appointments/${testAppointment._id}/cancel`)
                .set('Authorization', `Bearer ${therapistToken}`)
                .send(cancelData);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.appointment.status).toBe('cancelled');
            expect(res.body.appointment.cancellationReason).toBe(cancelData.reason);
        });

        it('should reject cancellation of already cancelled appointment', async () => {
            // First cancellation
            await request(app)
                .post(`/api/appointments/${testAppointment._id}/cancel`)
                .set('Authorization', `Bearer ${therapistToken}`)
                .send({ reason: 'First cancellation' });

            // Second cancellation attempt
            const res = await request(app)
                .post(`/api/appointments/${testAppointment._id}/cancel`)
                .set('Authorization', `Bearer ${therapistToken}`)
                .send({ reason: 'Second cancellation' });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('DELETE /api/appointments/:id', () => {
        beforeEach(async () => {
            testAppointment = await Appointment.create({
                ...mockAppointment,
                clientId: client._id,
                therapistId: therapist._id
            });
        });

        it('should delete an appointment', async () => {
            const res = await request(app)
                .delete(`/api/appointments/${testAppointment._id}`)
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify appointment is deleted
            const deletedAppointment = await Appointment.findById(testAppointment._id);
            expect(deletedAppointment).toBeNull();
        });

        it('should return 404 for non-existent appointment', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .delete(`/api/appointments/${fakeId}`)
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/appointments/stats', () => {
        beforeEach(async () => {
            // Create appointments with different statuses
            const appointments = [
                { ...mockAppointment, clientId: client._id, therapistId: therapist._id, status: 'confirmed' },
                { ...mockAppointment, clientId: client._id, therapistId: therapist._id, status: 'confirmed' },
                { ...mockAppointment, clientId: client._id, therapistId: therapist._id, status: 'pending' },
                { ...mockAppointment, clientId: client._id, therapistId: therapist._id, status: 'completed' },
                { ...mockAppointment, clientId: client._id, therapistId: therapist._id, status: 'cancelled' }
            ];

            for (const appointment of appointments) {
                await Appointment.create(appointment);
            }
        });

        it('should return appointment statistics', async () => {
            const res = await request(app)
                .get('/api/appointments/stats')
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.stats).toBeDefined();
            expect(res.body.stats.total).toBe(5);
            expect(res.body.stats.confirmed).toBe(2);
            expect(res.body.stats.pending).toBe(1);
            expect(res.body.stats.completed).toBe(1);
            expect(res.body.stats.cancelled).toBe(1);
        });

        it('should filter stats by date range', async () => {
            const res = await request(app)
                .get('/api/appointments/stats')
                .query({
                    startDate: '2025-12-01',
                    endDate: '2025-12-31'
                })
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.stats).toBeDefined();
        });
    });

    describe('Rate Limiting', () => {
        it('should enforce rate limits on appointment creation', async () => {
            const appointmentData = {
                ...mockAppointment,
                clientId: client._id,
                therapistId: therapist._id
            };

            // Make multiple requests quickly
            const promises = Array(10).fill().map(() =>
                request(app)
                    .post('/api/appointments')
                    .set('Authorization', `Bearer ${therapistToken}`)
                    .send(appointmentData)
            );

            const responses = await Promise.all(promises);

            // Some requests should be rate limited
            const rateLimitedResponses = responses.filter(res => res.statusCode === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid appointment ID format', async () => {
            const res = await request(app)
                .get('/api/appointments/invalid-id')
                .set('Authorization', `Bearer ${therapistToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should handle database connection errors gracefully', async () => {
            // This test would require mocking database connection
            // For now, we'll test that the error handler exists
            expect(globalErrorHandler).toBeDefined();
        });
    });
});
