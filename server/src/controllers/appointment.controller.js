const Appointment = require('../models/Appointment');
const Client = require('../models/Client');
const Therapist = require('../models/Therapist');
const BlockedTime = require('../models/BlockedTime');
const TherapistAvailability = require('../models/TherapistAvailability');
const googleCalendarService = require('../services/googleCalendar.service');
const moment = require('moment');

/**
 * Appointment Controller
 * טיפול בכל הפעולות הקשורות לפגישות
 */
class AppointmentController {

    /**
     * קבלת רשימת פגישות
     * GET /api/appointments
     */
    async getAppointments(req, res) {
        try {
            const therapistId = req.user.id;
            const {
                startDate,
                endDate,
                status,
                clientId,
                serviceType,
                page = 1,
                limit = 20,
                sortBy = 'startTime',
                sortOrder = 'asc'
            } = req.query;

            // בניית query
            const query = { therapistId };

            // סינון לפי תאריך
            if (startDate || endDate) {
                query.$or = [];

                if (startDate) {
                    query.$or.push({
                        startTime: { $gte: new Date(startDate) }
                    });
                    query.$or.push({
                        date: { $gte: new Date(startDate) }
                    });
                }

                if (endDate) {
                    if (query.$or) {
                        query.$or.forEach(condition => {
                            if (condition.startTime) {
                                condition.startTime.$lte = new Date(endDate);
                            }
                            if (condition.date) {
                                condition.date.$lte = new Date(endDate);
                            }
                        });
                    }
                }
            }

            // סינון לפי סטטוס
            if (status) {
                query.status = status;
            }

            // סינון לפי לקוח
            if (clientId) {
                query.$or = query.$or || [];
                query.$or.push({ clientId });
                query.$or.push({ client: clientId });
            }

            // סינון לפי סוג שירות
            if (serviceType) {
                query.serviceType = serviceType;
            }

            // חישוב pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // מיון
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // קבלת פגישות
            const appointments = await Appointment.find(query)
                .populate('clientId', 'firstName lastName email phone')
                .populate('client', 'firstName lastName email phone')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            // ספירה כוללת
            const totalCount = await Appointment.countDocuments(query);

            res.json({
                success: true,
                appointments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalCount,
                    totalPages: Math.ceil(totalCount / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Error getting appointments:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת פגישות',
                error: error.message
            });
        }
    }

    /**
     * קבלת פגישה בודדת
     * GET /api/appointments/:id
     */
    async getAppointment(req, res) {
        try {
            const { id } = req.params;
            const therapistId = req.user.id;

            const appointment = await Appointment.findOne({
                _id: id,
                therapistId
            })
                .populate('clientId', 'firstName lastName email phone')
                .populate('client', 'firstName lastName email phone');

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'פגישה לא נמצאה'
                });
            }

            res.json({
                success: true,
                appointment
            });
        } catch (error) {
            console.error('Error getting appointment:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת פגישה',
                error: error.message
            });
        }
    }

    /**
     * יצירת פגישה חדשה
     * POST /api/appointments
     */
    async createAppointment(req, res) {
        try {
            const therapistId = req.user.id;
            const appointmentData = {
                ...req.body,
                therapistId
            };

            // ולידציה בסיסית
            if (!appointmentData.clientId || !appointmentData.startTime) {
                return res.status(400).json({
                    success: false,
                    message: 'לקוח ותאריך התחלה הם שדות חובה'
                });
            }

            // בדיקת התנגשויות
            const conflicts = await this.checkConflicts({
                therapistId,
                startTime: appointmentData.startTime,
                endTime: appointmentData.endTime || moment(appointmentData.startTime).add(appointmentData.duration || 60, 'minutes').toDate(),
                excludeId: null
            });

            if (conflicts.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'נמצאו התנגשויות עם פגישות אחרות',
                    conflicts
                });
            }

            // בדיקת זמינות
            const isAvailable = await this.checkAvailability(
                therapistId,
                appointmentData.startTime,
                appointmentData.endTime || moment(appointmentData.startTime).add(appointmentData.duration || 60, 'minutes').toDate()
            );

            if (!isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: 'הזמן לא זמין לפי הגדרות הזמינות'
                });
            }

            // יצירת הפגישה
            const appointment = new Appointment(appointmentData);
            await appointment.save();

            // טעינת הפגישה עם פרטי הלקוח
            const populatedAppointment = await Appointment.findById(appointment._id)
                .populate('clientId', 'firstName lastName email phone')
                .populate('client', 'firstName lastName email phone');

            // סנכרון ל-Google Calendar (אסינכרוני)
            if (appointmentData.syncToGoogle !== false) {
                googleCalendarService.syncAppointmentToGoogle(appointment._id)
                    .catch(error => {
                        console.error('Error syncing appointment to Google:', error);
                    });
            }

            res.status(201).json({
                success: true,
                message: 'הפגישה נוצרה בהצלחה',
                appointment: populatedAppointment
            });
        } catch (error) {
            console.error('Error creating appointment:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת פגישה',
                error: error.message
            });
        }
    }

    /**
     * עדכון פגישה
     * PUT /api/appointments/:id
     */
    async updateAppointment(req, res) {
        try {
            const { id } = req.params;
            const therapistId = req.user.id;
            const updateData = req.body;

            // מציאת הפגישה
            const appointment = await Appointment.findOne({
                _id: id,
                therapistId
            });

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'פגישה לא נמצאה'
                });
            }

            // בדיקת התנגשויות אם שונה הזמן
            if (updateData.startTime || updateData.endTime || updateData.duration) {
                const newStartTime = updateData.startTime || appointment.startTime;
                const newEndTime = updateData.endTime ||
                    moment(newStartTime).add(updateData.duration || appointment.duration, 'minutes').toDate();

                const conflicts = await this.checkConflicts({
                    therapistId,
                    startTime: newStartTime,
                    endTime: newEndTime,
                    excludeId: id
                });

                if (conflicts.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'נמצאו התנגשויות עם פגישות אחרות',
                        conflicts
                    });
                }
            }

            // עדכון הפגישה
            const updatedAppointment = await Appointment.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            ).populate('clientId', 'firstName lastName email phone')
                .populate('client', 'firstName lastName email phone');

            // סנכרון ל-Google Calendar
            if (appointment.googleEventId) {
                googleCalendarService.syncAppointmentToGoogle(id)
                    .catch(error => {
                        console.error('Error syncing updated appointment to Google:', error);
                    });
            }

            res.json({
                success: true,
                message: 'הפגישה עודכנה בהצלחה',
                appointment: updatedAppointment
            });
        } catch (error) {
            console.error('Error updating appointment:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בעדכון פגישה',
                error: error.message
            });
        }
    }

    /**
     * מחיקת פגישה
     * DELETE /api/appointments/:id
     */
    async deleteAppointment(req, res) {
        try {
            const { id } = req.params;
            const therapistId = req.user.id;

            // מציאת הפגישה
            const appointment = await Appointment.findOne({
                _id: id,
                therapistId
            });

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'פגישה לא נמצאה'
                });
            }

            // מחיקה מ-Google Calendar אם קיים
            if (appointment.googleEventId) {
                try {
                    await googleCalendarService.deleteGoogleEvent(appointment.googleEventId);
                } catch (error) {
                    console.error('Error deleting Google event:', error);
                }
            }

            // מחיקה רכה - עדכון סטטוס לבוטל
            await Appointment.findByIdAndUpdate(id, {
                status: 'cancelled',
                cancelledAt: new Date(),
                cancelledBy: 'therapist',
                cancellationReason: 'נמחק על ידי המטפלת'
            });

            res.json({
                success: true,
                message: 'הפגישה בוטלה בהצלחה'
            });
        } catch (error) {
            console.error('Error deleting appointment:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה במחיקת פגישה',
                error: error.message
            });
        }
    }

    /**
     * יצירת פגישות חוזרות
     * POST /api/appointments/bulk
     */
    async createRecurringAppointments(req, res) {
        try {
            const therapistId = req.user.id;
            const {
                baseAppointment,
                recurringPattern,
                endDate
            } = req.body;

            if (!baseAppointment || !recurringPattern || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'נתונים חסרים ליצירת פגישות חוזרות'
                });
            }

            // חישוב תאריכי הפגישות
            const appointmentDates = this.calculateRecurringDates(
                baseAppointment.startTime,
                recurringPattern,
                endDate
            );

            const createdAppointments = [];
            const errors = [];

            // יצירת כל פגישה
            for (const date of appointmentDates) {
                try {
                    const appointmentData = {
                        ...baseAppointment,
                        therapistId,
                        startTime: date,
                        endTime: moment(date).add(baseAppointment.duration || 60, 'minutes').toDate(),
                        recurringPattern: {
                            isRecurring: true,
                            frequency: recurringPattern,
                            endDate: new Date(endDate),
                            parentAppointmentId: null // יוגדר אחרי יצירת הפגישה הראשונה
                        }
                    };

                    // בדיקת התנגשויות
                    const conflicts = await this.checkConflicts({
                        therapistId,
                        startTime: appointmentData.startTime,
                        endTime: appointmentData.endTime,
                        excludeId: null
                    });

                    if (conflicts.length > 0) {
                        errors.push({
                            date,
                            error: 'התנגשות עם פגישה אחרת'
                        });
                        continue;
                    }

                    const appointment = new Appointment(appointmentData);
                    await appointment.save();

                    // הגדרת parentAppointmentId לפגישה הראשונה
                    if (createdAppointments.length === 0) {
                        appointment.recurringPattern.parentAppointmentId = appointment._id;
                        await appointment.save();
                    } else {
                        appointment.recurringPattern.parentAppointmentId = createdAppointments[0]._id;
                        await appointment.save();
                    }

                    createdAppointments.push(appointment);

                    // סנכרון ל-Google Calendar
                    googleCalendarService.syncAppointmentToGoogle(appointment._id)
                        .catch(error => {
                            console.error('Error syncing recurring appointment to Google:', error);
                        });

                } catch (error) {
                    errors.push({
                        date,
                        error: error.message
                    });
                }
            }

            res.status(201).json({
                success: true,
                message: `נוצרו ${createdAppointments.length} פגישות חוזרות`,
                appointments: createdAppointments,
                errors
            });
        } catch (error) {
            console.error('Error creating recurring appointments:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת פגישות חוזרות',
                error: error.message
            });
        }
    }

    /**
     * בדיקת התנגשויות
     * GET /api/appointments/conflicts
     */
    async checkConflicts(req, res) {
        try {
            const {
                therapistId = req.user.id,
                startTime,
                endTime,
                excludeId
            } = req.query;

            const conflicts = await this.checkConflicts({
                therapistId,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                excludeId
            });

            res.json({
                success: true,
                conflicts
            });
        } catch (error) {
            console.error('Error checking conflicts:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בבדיקת התנגשויות',
                error: error.message
            });
        }
    }

    /**
     * אישור פגישה
     * POST /api/appointments/:id/confirm
     */
    async confirmAppointment(req, res) {
        try {
            const { id } = req.params;
            const therapistId = req.user.id;

            const appointment = await Appointment.findOneAndUpdate(
                { _id: id, therapistId },
                {
                    status: 'confirmed',
                    confirmedAt: new Date()
                },
                { new: true }
            ).populate('clientId', 'firstName lastName email phone')
                .populate('client', 'firstName lastName email phone');

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'פגישה לא נמצאה'
                });
            }

            // סנכרון ל-Google Calendar
            if (appointment.googleEventId) {
                googleCalendarService.syncAppointmentToGoogle(id)
                    .catch(error => {
                        console.error('Error syncing confirmed appointment to Google:', error);
                    });
            }

            res.json({
                success: true,
                message: 'הפגישה אושרה בהצלחה',
                appointment
            });
        } catch (error) {
            console.error('Error confirming appointment:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה באישור פגישה',
                error: error.message
            });
        }
    }

    /**
     * ביטול פגישה
     * POST /api/appointments/:id/cancel
     */
    async cancelAppointment(req, res) {
        try {
            const { id } = req.params;
            const therapistId = req.user.id;
            const { reason, cancelledBy = 'therapist' } = req.body;

            const appointment = await Appointment.findOneAndUpdate(
                { _id: id, therapistId },
                {
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    cancelledBy,
                    cancellationReason: reason || 'בוטל על ידי המטפלת'
                },
                { new: true }
            ).populate('clientId', 'firstName lastName email phone')
                .populate('client', 'firstName lastName email phone');

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'פגישה לא נמצאה'
                });
            }

            // מחיקה מ-Google Calendar
            if (appointment.googleEventId) {
                try {
                    await googleCalendarService.deleteGoogleEvent(appointment.googleEventId);
                } catch (error) {
                    console.error('Error deleting cancelled appointment from Google:', error);
                }
            }

            res.json({
                success: true,
                message: 'הפגישה בוטלה בהצלחה',
                appointment
            });
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בביטול פגישה',
                error: error.message
            });
        }
    }

    /**
     * סימון פגישה כהושלמה
     * POST /api/appointments/:id/complete
     */
    async completeAppointment(req, res) {
        try {
            const { id } = req.params;
            const therapistId = req.user.id;
            const { summary } = req.body;

            const appointment = await Appointment.findOneAndUpdate(
                { _id: id, therapistId },
                {
                    status: 'completed',
                    completedAt: new Date(),
                    summary: summary || appointment.summary
                },
                { new: true }
            ).populate('clientId', 'firstName lastName email phone')
                .populate('client', 'firstName lastName email phone');

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'פגישה לא נמצאה'
                });
            }

            // סנכרון ל-Google Calendar
            if (appointment.googleEventId) {
                googleCalendarService.syncAppointmentToGoogle(id)
                    .catch(error => {
                        console.error('Error syncing completed appointment to Google:', error);
                    });
            }

            res.json({
                success: true,
                message: 'הפגישה סומנה כהושלמה',
                appointment
            });
        } catch (error) {
            console.error('Error completing appointment:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בסימון פגישה כהושלמה',
                error: error.message
            });
        }
    }

    /**
     * שליחת תזכורת
     * POST /api/appointments/:id/reminder
     */
    async sendReminder(req, res) {
        try {
            const { id } = req.params;
            const therapistId = req.user.id;
            const { type = 'email' } = req.body;

            const appointment = await Appointment.findOne({
                _id: id,
                therapistId
            }).populate('clientId', 'firstName lastName email phone')
                .populate('client', 'firstName lastName email phone');

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'פגישה לא נמצאה'
                });
            }

            // הוספת תזכורת לרשימה
            appointment.remindersSent.push({
                type,
                sentAt: new Date()
            });
            await appointment.save();

            // כאן יהיה שליחת האימייל או SMS בפועל
            // emailService.sendAppointmentReminder(appointment, type);

            res.json({
                success: true,
                message: 'תזכורת נשלחה בהצלחה',
                appointment
            });
        } catch (error) {
            console.error('Error sending reminder:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בשליחת תזכורת',
                error: error.message
            });
        }
    }

    // Helper Methods

    /**
     * בדיקת התנגשויות פנימית
     */
    async checkConflicts({ therapistId, startTime, endTime, excludeId }) {
        const conflicts = [];

        // בדיקת פגישות חופפות
        const overlappingAppointments = await Appointment.find({
            therapistId,
            _id: { $ne: excludeId },
            status: { $in: ['pending', 'confirmed'] },
            $or: [
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                },
                {
                    date: { $lt: endTime },
                    $expr: {
                        $gt: [
                            { $add: ['$date', { $multiply: ['$duration', 60000] }] },
                            startTime
                        ]
                    }
                }
            ]
        }).populate('clientId', 'firstName lastName');

        conflicts.push(...overlappingAppointments.map(apt => ({
            type: 'appointment',
            id: apt._id,
            title: `${apt.clientId?.firstName || 'לקוח'} ${apt.clientId?.lastName || ''}`,
            startTime: apt.startTime || apt.date,
            endTime: apt.endTime || moment(apt.startTime || apt.date).add(apt.duration, 'minutes').toDate()
        })));

        // בדיקת זמנים חסומים
        const blockedTimes = await BlockedTime.find({
            therapistId,
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
        });

        conflicts.push(...blockedTimes.map(blocked => ({
            type: 'blocked_time',
            id: blocked._id,
            title: `זמן חסום - ${blocked.reason}`,
            startTime: blocked.startTime,
            endTime: blocked.endTime
        })));

        return conflicts;
    }

    /**
     * בדיקת זמינות
     */
    async checkAvailability(therapistId, startTime, endTime) {
        const availability = await TherapistAvailability.findOne({ therapistId });

        if (!availability) {
            return true; // אם אין הגדרות זמינות, נניח שזמין
        }

        const dayOfWeek = moment(startTime).day();
        const daySchedule = availability.weeklySchedule.find(schedule => schedule.dayOfWeek === dayOfWeek);

        if (!daySchedule || !daySchedule.isAvailable) {
            return false;
        }

        const startTimeStr = moment(startTime).format('HH:mm');
        const endTimeStr = moment(endTime).format('HH:mm');

        return daySchedule.timeSlots.some(slot =>
            startTimeStr >= slot.startTime && endTimeStr <= slot.endTime
        );
    }

    /**
     * חישוב תאריכי פגישות חוזרות
     */
    calculateRecurringDates(startDate, frequency, endDate) {
        const dates = [];
        let currentDate = moment(startDate);
        const endMoment = moment(endDate);

        while (currentDate.isBefore(endMoment)) {
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
}

module.exports = new AppointmentController();
