const TherapistAvailability = require('../models/TherapistAvailability');
const BlockedTime = require('../models/BlockedTime');
const Appointment = require('../models/Appointment');
const googleCalendarService = require('../services/googleCalendar.service');
const moment = require('moment');

/**
 * Availability Controller
 * טיפול בכל הפעולות הקשורות לזמינות מטפלת
 */
class AvailabilityController {

    /**
     * קבלת הגדרות זמינות
     * GET /api/availability
     */
    async getAvailability(req, res) {
        try {
            const therapistId = req.user.id;

            // קבלת הגדרות זמינות
            const availability = await TherapistAvailability.findOne({ therapistId });

            // קבלת זמנים חסומים
            const blockedTimes = await BlockedTime.find({
                therapistId,
                endTime: { $gte: new Date() } // רק זמנים עתידיים
            }).sort({ startTime: 1 });

            res.json({
                success: true,
                availability: availability || {
                    weeklySchedule: [
                        { dayOfWeek: 0, isAvailable: false, timeSlots: [] }, // ראשון
                        { dayOfWeek: 1, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] }, // שני
                        { dayOfWeek: 2, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] }, // שלישי
                        { dayOfWeek: 3, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] }, // רביעי
                        { dayOfWeek: 4, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] }, // חמישי
                        { dayOfWeek: 5, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '14:00' }] }, // שישי
                        { dayOfWeek: 6, isAvailable: false, timeSlots: [] } // שבת
                    ],
                    bufferTime: 15,
                    maxDailyAppointments: 8,
                    advanceBookingDays: 60,
                    minNoticeHours: 24,
                    timezone: 'Asia/Jerusalem'
                },
                blockedTimes
            });
        } catch (error) {
            console.error('Error getting availability:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת הגדרות זמינות',
                error: error.message
            });
        }
    }

    /**
     * עדכון הגדרות זמינות
     * PUT /api/availability
     */
    async updateAvailability(req, res) {
        try {
            const therapistId = req.user.id;
            const {
                weeklySchedule,
                bufferTime,
                maxDailyAppointments,
                advanceBookingDays,
                minNoticeHours,
                timezone
            } = req.body;

            // ולידציה בסיסית
            if (!weeklySchedule || !Array.isArray(weeklySchedule)) {
                return res.status(400).json({
                    success: false,
                    message: 'לוח זמנים שבועי הוא חובה'
                });
            }

            // עדכון או יצירת הגדרות זמינות
            const availability = await TherapistAvailability.findOneAndUpdate(
                { therapistId },
                {
                    therapistId,
                    weeklySchedule,
                    bufferTime: bufferTime || 15,
                    maxDailyAppointments: maxDailyAppointments || 8,
                    advanceBookingDays: advanceBookingDays || 60,
                    minNoticeHours: minNoticeHours || 24,
                    timezone: timezone || 'Asia/Jerusalem'
                },
                { upsert: true, new: true }
            );

            res.json({
                success: true,
                message: 'הגדרות הזמינות עודכנו בהצלחה',
                availability
            });
        } catch (error) {
            console.error('Error updating availability:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בעדכון הגדרות זמינות',
                error: error.message
            });
        }
    }

    /**
     * קבלת slots זמינים
     * GET /api/availability/slots
     */
    async getAvailableSlots(req, res) {
        try {
            const therapistId = req.user.id;
            const {
                date,
                startDate,
                endDate,
                duration = 60
            } = req.query;

            if (!date && (!startDate || !endDate)) {
                return res.status(400).json({
                    success: false,
                    message: 'תאריך או טווח תאריכים הוא חובה'
                });
            }

            let slots = [];

            if (date) {
                // slots ליום בודד
                slots = await this.calculateAvailableSlots(
                    therapistId,
                    new Date(date),
                    parseInt(duration)
                );
            } else {
                // slots לטווח תאריכים
                const start = new Date(startDate);
                const end = new Date(endDate);
                const current = moment(start);

                while (current.isSameOrBefore(end, 'day')) {
                    const daySlots = await this.calculateAvailableSlots(
                        therapistId,
                        current.toDate(),
                        parseInt(duration)
                    );
                    
                    slots.push({
                        date: current.format('YYYY-MM-DD'),
                        slots: daySlots
                    });
                    
                    current.add(1, 'day');
                }
            }

            res.json({
                success: true,
                slots
            });
        } catch (error) {
            console.error('Error getting available slots:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת slots זמינים',
                error: error.message
            });
        }
    }

    /**
     * יצירת זמן חסום
     * POST /api/availability/blocked
     */
    async createBlockedTime(req, res) {
        try {
            const therapistId = req.user.id;
            const {
                startTime,
                endTime,
                reason,
                notes,
                isRecurring,
                recurringPattern
            } = req.body;

            // ולידציה
            if (!startTime || !endTime || !reason) {
                return res.status(400).json({
                    success: false,
                    message: 'זמן התחלה, זמן סיום וסיבה הם חובה'
                });
            }

            const start = new Date(startTime);
            const end = new Date(endTime);

            if (start >= end) {
                return res.status(400).json({
                    success: false,
                    message: 'זמן התחלה חייב להיות לפני זמן סיום'
                });
            }

            const blockedTimes = [];

            if (isRecurring && recurringPattern) {
                // יצירת זמנים חסומים חוזרים
                const dates = this.calculateRecurringDates(start, recurringPattern.frequency, new Date(recurringPattern.endDate));
                
                for (const date of dates) {
                    const blockedTime = await BlockedTime.create({
                        therapistId,
                        startTime: moment(date).set({
                            hour: moment(start).hour(),
                            minute: moment(start).minute()
                        }).toDate(),
                        endTime: moment(date).set({
                            hour: moment(end).hour(),
                            minute: moment(end).minute()
                        }).toDate(),
                        reason,
                        notes,
                        isRecurring: true,
                        recurringPattern: {
                            frequency: recurringPattern.frequency,
                            endDate: new Date(recurringPattern.endDate),
                            parentBlockedTimeId: null
                        }
                    });

                    // הגדרת parentBlockedTimeId לזמן הראשון
                    if (blockedTimes.length === 0) {
                        blockedTime.recurringPattern.parentBlockedTimeId = blockedTime._id;
                        await blockedTime.save();
                    } else {
                        blockedTime.recurringPattern.parentBlockedTimeId = blockedTimes[0]._id;
                        await blockedTime.save();
                    }

                    blockedTimes.push(blockedTime);
                }
            } else {
                // יצירת זמן חסום בודד
                const blockedTime = await BlockedTime.create({
                    therapistId,
                    startTime: start,
                    endTime: end,
                    reason,
                    notes,
                    isRecurring: false
                });

                blockedTimes.push(blockedTime);
            }

            // סנכרון ל-Google Calendar כ-"Busy" events
            for (const blockedTime of blockedTimes) {
                try {
                    await this.syncBlockedTimeToGoogle(blockedTime, therapistId);
                } catch (error) {
                    console.error('Error syncing blocked time to Google:', error);
                }
            }

            res.status(201).json({
                success: true,
                message: `נוצרו ${blockedTimes.length} זמנים חסומים`,
                blockedTimes
            });
        } catch (error) {
            console.error('Error creating blocked time:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת זמן חסום',
                error: error.message
            });
        }
    }

    /**
     * מחיקת זמן חסום
     * DELETE /api/availability/blocked/:id
     */
    async deleteBlockedTime(req, res) {
        try {
            const { id } = req.params;
            const therapistId = req.user.id;

            const blockedTime = await BlockedTime.findOne({
                _id: id,
                therapistId
            });

            if (!blockedTime) {
                return res.status(404).json({
                    success: false,
                    message: 'זמן חסום לא נמצא'
                });
            }

            // מחיקה מ-Google Calendar אם קיים
            if (blockedTime.metadata?.googleEventId) {
                try {
                    await googleCalendarService.deleteGoogleEvent(blockedTime.metadata.googleEventId);
                } catch (error) {
                    console.error('Error deleting blocked time from Google:', error);
                }
            }

            await BlockedTime.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'הזמן החסום נמחק בהצלחה'
            });
        } catch (error) {
            console.error('Error deleting blocked time:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה במחיקת זמן חסום',
                error: error.message
            });
        }
    }

    /**
     * עדכון זמן חסום
     * PUT /api/availability/blocked/:id
     */
    async updateBlockedTime(req, res) {
        try {
            const { id } = req.params;
            const therapistId = req.user.id;
            const updateData = req.body;

            const blockedTime = await BlockedTime.findOneAndUpdate(
                { _id: id, therapistId },
                updateData,
                { new: true }
            );

            if (!blockedTime) {
                return res.status(404).json({
                    success: false,
                    message: 'זמן חסום לא נמצא'
                });
            }

            // סנכרון ל-Google Calendar
            if (blockedTime.metadata?.googleEventId) {
                try {
                    await this.syncBlockedTimeToGoogle(blockedTime, therapistId);
                } catch (error) {
                    console.error('Error syncing updated blocked time to Google:', error);
                }
            }

            res.json({
                success: true,
                message: 'הזמן החסום עודכן בהצלחה',
                blockedTime
            });
        } catch (error) {
            console.error('Error updating blocked time:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בעדכון זמן חסום',
                error: error.message
            });
        }
    }

    // Helper Methods

    /**
     * חישוב slots זמינים ליום מסוים
     */
    async calculateAvailableSlots(therapistId, date, duration) {
        const availability = await TherapistAvailability.findOne({ therapistId });
        const dayOfWeek = moment(date).day();

        if (!availability) {
            return []; // אם אין הגדרות זמינות, אין slots
        }

        const daySchedule = availability.weeklySchedule.find(schedule => schedule.dayOfWeek === dayOfWeek);
        
        if (!daySchedule || !daySchedule.isAvailable) {
            return []; // יום לא זמין
        }

        // קבלת פגישות קיימות ליום
        const startOfDay = moment(date).startOf('day');
        const endOfDay = moment(date).endOf('day');

        const appointments = await Appointment.find({
            therapistId,
            status: { $in: ['pending', 'confirmed'] },
            $or: [
                {
                    startTime: { $gte: startOfDay.toDate(), $lte: endOfDay.toDate() }
                },
                {
                    date: { $gte: startOfDay.toDate(), $lte: endOfDay.toDate() }
                }
            ]
        }).sort({ startTime: 1, date: 1 });

        // קבלת זמנים חסומים ליום
        const blockedTimes = await BlockedTime.find({
            therapistId,
            startTime: { $gte: startOfDay.toDate(), $lte: endOfDay.toDate() }
        }).sort({ startTime: 1 });

        const slots = [];

        // עיבוד כל time slot
        for (const timeSlot of daySchedule.timeSlots) {
            const slotStart = moment(date).set({
                hour: parseInt(timeSlot.startTime.split(':')[0]),
                minute: parseInt(timeSlot.startTime.split(':')[1])
            });

            const slotEnd = moment(date).set({
                hour: parseInt(timeSlot.endTime.split(':')[0]),
                minute: parseInt(timeSlot.endTime.split(':')[1])
            });

            // חיפוש slots זמינים בתוך ה-time slot
            let currentTime = slotStart.clone();

            while (currentTime.clone().add(duration, 'minutes').isSameOrBefore(slotEnd)) {
                const slotEndTime = currentTime.clone().add(duration, 'minutes');

                // בדיקה אם ה-slot זמין
                const isAvailable = this.isSlotAvailable(
                    currentTime.toDate(),
                    slotEndTime.toDate(),
                    appointments,
                    blockedTimes,
                    availability.bufferTime
                );

                if (isAvailable) {
                    slots.push({
                        startTime: currentTime.toDate(),
                        endTime: slotEndTime.toDate(),
                        duration
                    });
                }

                // מעבר ל-slot הבא (עם buffer time)
                currentTime.add(duration + availability.bufferTime, 'minutes');
            }
        }

        return slots;
    }

    /**
     * בדיקה אם slot זמין
     */
    isSlotAvailable(startTime, endTime, appointments, blockedTimes, bufferTime) {
        const start = moment(startTime).subtract(bufferTime, 'minutes');
        const end = moment(endTime).add(bufferTime, 'minutes');

        // בדיקת התנגשות עם פגישות
        for (const appointment of appointments) {
            const aptStart = moment(appointment.startTime || appointment.date);
            const aptEnd = moment(aptStart).add(appointment.duration, 'minutes');

            if (start.isBefore(aptEnd) && end.isAfter(aptStart)) {
                return false;
            }
        }

        // בדיקת התנגשות עם זמנים חסומים
        for (const blockedTime of blockedTimes) {
            const blockedStart = moment(blockedTime.startTime);
            const blockedEnd = moment(blockedTime.endTime);

            if (start.isBefore(blockedEnd) && end.isAfter(blockedStart)) {
                return false;
            }
        }

        return true;
    }

    /**
     * חישוב תאריכי פגישות חוזרות
     */
    calculateRecurringDates(startDate, frequency, endDate) {
        const dates = [];
        let currentDate = moment(startDate);
        const endMoment = moment(endDate);

        while (currentDate.isSameOrBefore(endMoment)) {
            dates.push(currentDate.toDate());
            
            switch (frequency) {
                case 'daily':
                    currentDate.add(1, 'day');
                    break;
                case 'weekly':
                    currentDate.add(1, 'week');
                    break;
                case 'biweekly':
                    currentDate.add(2, 'weeks');
                    break;
                case 'monthly':
                    currentDate.add(1, 'month');
                    break;
                default:
                    break;
            }
        }

        return dates;
    }

    /**
     * סנכרון זמן חסום ל-Google Calendar
     */
    async syncBlockedTimeToGoogle(blockedTime, therapistId) {
        try {
            const event = {
                summary: `זמן חסום - ${blockedTime.reason}`,
                description: blockedTime.notes || '',
                start: {
                    dateTime: moment(blockedTime.startTime).toISOString(),
                    timeZone: 'Asia/Jerusalem'
                },
                end: {
                    dateTime: moment(blockedTime.endTime).toISOString(),
                    timeZone: 'Asia/Jerusalem'
                },
                transparency: 'transparent', // זמן פנוי
                visibility: 'private'
            };

            // כאן יהיה קריאה ל-Google Calendar API
            // const result = await googleCalendarService.createGoogleEvent(event, calendar);
            
            // עדכון metadata עם Google Event ID
            if (!blockedTime.metadata) {
                blockedTime.metadata = {};
            }
            // blockedTime.metadata.googleEventId = result.eventId;
            // await blockedTime.save();

        } catch (error) {
            console.error('Error syncing blocked time to Google:', error);
        }
    }
}

module.exports = new AvailabilityController();
