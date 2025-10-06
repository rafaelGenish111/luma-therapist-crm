const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');
const { auth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for calendar operations
const calendarRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'יותר מדי בקשות סנכרון. נסה שוב בעוד כמה דקות.'
    }
});

const webhookRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 webhook requests per minute
    message: {
        success: false,
        message: 'יותר מדי בקשות webhook'
    }
});

/**
 * @route   GET /api/calendar/google/auth
 * @desc    התחלת תהליך OAuth עם Google
 * @access  Private (Therapist only)
 */
router.get('/google/auth', auth, calendarRateLimit, calendarController.initiateGoogleAuth);

/**
 * @route   GET /api/calendar/google/callback
 * @desc    טיפול ב-callback מ-Google OAuth
 * @access  Public (Google redirects here)
 */
router.get('/google/callback', calendarController.handleGoogleCallback);

/**
 * @route   POST /api/calendar/google/disconnect
 * @desc    ניתוק מ-Google Calendar
 * @access  Private (Therapist only)
 */
router.post('/google/disconnect', auth, calendarController.disconnectGoogle);

/**
 * @route   GET /api/calendar/sync-status
 * @desc    קבלת סטטוס סנכרון
 * @access  Private (Therapist only)
 */
router.get('/sync-status', auth, calendarController.getSyncStatus);

/**
 * @route   POST /api/calendar/sync
 * @desc    סנכרון ידני
 * @access  Private (Therapist only)
 */
router.post('/sync', auth, calendarRateLimit, calendarController.manualSync);

/**
 * @route   POST /api/calendar/webhook
 * @desc    טיפול ב-webhook מ-Google
 * @access  Public (Google sends webhooks here)
 */
router.post('/webhook', webhookRateLimit, calendarController.handleWebhook);

/**
 * @route   PUT /api/calendar/settings
 * @desc    עדכון הגדרות סנכרון
 * @access  Private (Therapist only)
 */
router.put('/settings', auth, calendarController.updateSyncSettings);

/**
 * @route   DELETE /api/calendar/sync-errors
 * @desc    ניקוי שגיאות סנכרון ישנות
 * @access  Private (Therapist only)
 */
router.delete('/sync-errors', auth, calendarController.clearSyncErrors);

module.exports = router;
