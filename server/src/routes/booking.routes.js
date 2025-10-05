const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    getTherapistInfo,
    getAvailableServices,
    getAvailableSlots,
    createBooking,
    verifyBooking,
    cancelBooking,
    rescheduleBooking,
    resendConfirmation
} = require('../controllers/booking.controller');

const router = express.Router();

// Rate limiting for booking endpoints
const bookingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        error: 'Too many booking attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Public routes (no authentication required)

// Get therapist public information
router.get('/therapist/:id/info', generalLimiter, getTherapistInfo);

// Get available services for therapist
router.get('/therapist/:id/services', generalLimiter, getAvailableServices);

// Get available time slots
router.get('/therapist/:id/slots', generalLimiter, getAvailableSlots);

// Create new booking
router.post('/create', bookingLimiter, createBooking);

// Verify booking exists
router.get('/verify/:code', generalLimiter, verifyBooking);

// Cancel booking
router.post('/:code/cancel', bookingLimiter, cancelBooking);

// Reschedule booking
router.post('/:code/reschedule', bookingLimiter, rescheduleBooking);

// Resend confirmation email
router.post('/:code/resend-confirmation', generalLimiter, resendConfirmation);

module.exports = router;
