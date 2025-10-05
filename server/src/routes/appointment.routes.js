const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for appointment operations
const appointmentRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    message: {
        success: false,
        message: 'יותר מדי בקשות פגישות. נסה שוב בעוד כמה דקות.'
    }
});

const reminderRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 reminder requests per minute
    message: {
        success: false,
        message: 'יותר מדי בקשות תזכורות. נסה שוב בעוד דקה.'
    }
});

/**
 * @route   GET /api/appointments
 * @desc    קבלת רשימת פגישות
 * @access  Private (Therapist only)
 * @query   startDate, endDate, status, clientId, serviceType, page, limit, sortBy, sortOrder
 */
router.get('/', auth, appointmentRateLimit, appointmentController.getAppointments);

/**
 * @route   GET /api/appointments/:id
 * @desc    קבלת פגישה בודדת
 * @access  Private (Therapist only)
 */
router.get('/:id', auth, appointmentController.getAppointment);

/**
 * @route   POST /api/appointments
 * @desc    יצירת פגישה חדשה
 * @access  Private (Therapist only)
 */
router.post('/', auth, appointmentRateLimit, appointmentController.createAppointment);

/**
 * @route   PUT /api/appointments/:id
 * @desc    עדכון פגישה
 * @access  Private (Therapist only)
 */
router.put('/:id', auth, appointmentRateLimit, appointmentController.updateAppointment);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    מחיקת פגישה (soft delete - ביטול)
 * @access  Private (Therapist only)
 */
router.delete('/:id', auth, appointmentController.deleteAppointment);

/**
 * @route   POST /api/appointments/bulk
 * @desc    יצירת פגישות חוזרות
 * @access  Private (Therapist only)
 */
router.post('/bulk', auth, appointmentRateLimit, appointmentController.createRecurringAppointments);

/**
 * @route   GET /api/appointments/conflicts
 * @desc    בדיקת התנגשויות
 * @access  Private (Therapist only)
 * @query   therapistId, startTime, endTime, excludeId
 */
router.get('/conflicts', auth, appointmentController.checkConflicts);

/**
 * @route   POST /api/appointments/:id/confirm
 * @desc    אישור פגישה
 * @access  Private (Therapist only)
 */
router.post('/:id/confirm', auth, appointmentController.confirmAppointment);

/**
 * @route   POST /api/appointments/:id/cancel
 * @desc    ביטול פגישה
 * @access  Private (Therapist only)
 * @body    reason, cancelledBy
 */
router.post('/:id/cancel', auth, appointmentController.cancelAppointment);

/**
 * @route   POST /api/appointments/:id/complete
 * @desc    סימון פגישה כהושלמה
 * @access  Private (Therapist only)
 * @body    summary (optional)
 */
router.post('/:id/complete', auth, appointmentController.completeAppointment);

/**
 * @route   POST /api/appointments/:id/reminder
 * @desc    שליחת תזכורת
 * @access  Private (Therapist only)
 * @body    type (email/sms)
 */
router.post('/:id/reminder', auth, reminderRateLimit, appointmentController.sendReminder);

module.exports = router;
