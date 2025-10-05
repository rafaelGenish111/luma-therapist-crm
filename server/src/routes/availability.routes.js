const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availability.controller');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for availability operations
const availabilityRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'יותר מדי בקשות זמינות. נסה שוב בעוד כמה דקות.'
    }
});

/**
 * @route   GET /api/availability
 * @desc    קבלת הגדרות זמינות
 * @access  Private (Therapist only)
 */
router.get('/', auth, availabilityController.getAvailability);

/**
 * @route   PUT /api/availability
 * @desc    עדכון הגדרות זמינות
 * @access  Private (Therapist only)
 */
router.put('/', auth, availabilityRateLimit, availabilityController.updateAvailability);

/**
 * @route   GET /api/availability/slots
 * @desc    קבלת slots זמינים
 * @access  Private (Therapist only)
 * @query   date OR (startDate + endDate), duration
 */
router.get('/slots', auth, availabilityController.getAvailableSlots);

/**
 * @route   POST /api/availability/blocked
 * @desc    יצירת זמן חסום
 * @access  Private (Therapist only)
 */
router.post('/blocked', auth, availabilityRateLimit, availabilityController.createBlockedTime);

/**
 * @route   PUT /api/availability/blocked/:id
 * @desc    עדכון זמן חסום
 * @access  Private (Therapist only)
 */
router.put('/blocked/:id', auth, availabilityRateLimit, availabilityController.updateBlockedTime);

/**
 * @route   DELETE /api/availability/blocked/:id
 * @desc    מחיקת זמן חסום
 * @access  Private (Therapist only)
 */
router.delete('/blocked/:id', auth, availabilityController.deleteBlockedTime);

module.exports = router;
