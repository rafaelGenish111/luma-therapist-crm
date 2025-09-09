const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const TreatmentType = require('../models/TreatmentType');
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// ולידציה ליצירת/עדכון סוג טיפול
const validateTreatmentType = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('שם הטיפול חייב להכיל 2-100 תווים'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('תיאור לא יכול להכיל יותר מ-500 תווים'),
    body('duration')
        .isInt({ min: 15, max: 480 })
        .withMessage('משך זמן חייב להיות בין 15 ל-480 דקות'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('מחיר חייב להיות מספר חיובי'),
    body('currency')
        .optional()
        .isIn(['ILS', 'USD', 'EUR'])
        .withMessage('מטבע לא תקין'),
    body('color')
        .optional()
        .matches(/^#[0-9A-F]{6}$/i)
        .withMessage('צבע חייב להיות בפורמט hex (#RRGGBB)'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('סטטוס פעילות חייב להיות true או false')
];

// פונקציה לטיפול בשגיאות ולידציה
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'נתונים לא תקינים',
            details: errors.array()
        });
    }
    next();
};

/**
 * GET /api/treatment-types/therapist/:therapistId
 * קבלת כל סוגי הטיפולים של מטפל (ציבורי)
 */
router.get('/therapist/:therapistId', async (req, res) => {
    try {
        const { therapistId } = req.params;

        const treatmentTypes = await TreatmentType.findActiveByTherapist(therapistId);

        res.json({
            success: true,
            data: treatmentTypes.map(type => type.toPublicJSON())
        });
    } catch (error) {
        console.error('Error fetching treatment types:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בטעינת סוגי טיפולים'
        });
    }
});

/**
 * GET /api/treatment-types
 * קבלת כל סוגי הטיפולים של המטפל המחובר (פרטי)
 */
router.get('/', auth, authorize(['THERAPIST']), async (req, res) => {
    try {
        const therapistId = req.user.id;

        const treatmentTypes = await TreatmentType.find({ therapistId })
            .sort({ sortOrder: 1, createdAt: 1 });

        res.json({
            success: true,
            data: treatmentTypes
        });
    } catch (error) {
        console.error('Error fetching treatment types:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בטעינת סוגי טיפולים'
        });
    }
});

/**
 * POST /api/treatment-types
 * יצירת סוג טיפול חדש
 */
router.post('/', auth, authorize(['THERAPIST']), validateTreatmentType, handleValidationErrors, async (req, res) => {
    try {
        const therapistId = req.user.id;
        const treatmentTypeData = {
            ...req.body,
            therapistId
        };

        const treatmentType = new TreatmentType(treatmentTypeData);
        await treatmentType.save();

        res.status(201).json({
            success: true,
            message: 'סוג טיפול נוצר בהצלחה',
            data: treatmentType
        });
    } catch (error) {
        console.error('Error creating treatment type:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה ביצירת סוג טיפול'
        });
    }
});

/**
 * PUT /api/treatment-types/:id
 * עדכון סוג טיפול
 */
router.put('/:id', auth, authorize(['THERAPIST']), validateTreatmentType, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;
        const therapistId = req.user.id;

        const treatmentType = await TreatmentType.findOne({ _id: id, therapistId });
        if (!treatmentType) {
            return res.status(404).json({
                success: false,
                error: 'סוג טיפול לא נמצא'
            });
        }

        Object.assign(treatmentType, req.body);
        await treatmentType.save();

        res.json({
            success: true,
            message: 'סוג טיפול עודכן בהצלחה',
            data: treatmentType
        });
    } catch (error) {
        console.error('Error updating treatment type:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בעדכון סוג טיפול'
        });
    }
});

/**
 * DELETE /api/treatment-types/:id
 * מחיקת סוג טיפול (לוגית)
 */
router.delete('/:id', auth, authorize(['THERAPIST']), async (req, res) => {
    try {
        const { id } = req.params;
        const therapistId = req.user.id;

        const treatmentType = await TreatmentType.findOne({ _id: id, therapistId });
        if (!treatmentType) {
            return res.status(404).json({
                success: false,
                error: 'סוג טיפול לא נמצא'
            });
        }

        treatmentType.isActive = false;
        await treatmentType.save();

        res.json({
            success: true,
            message: 'סוג טיפול נמחק בהצלחה'
        });
    } catch (error) {
        console.error('Error deleting treatment type:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה במחיקת סוג טיפול'
        });
    }
});

/**
 * PATCH /api/treatment-types/:id/reorder
 * שינוי סדר של סוגי טיפולים
 */
router.patch('/:id/reorder', auth, authorize(['THERAPIST']), async (req, res) => {
    try {
        const { id } = req.params;
        const { sortOrder } = req.body;
        const therapistId = req.user.id;

        if (typeof sortOrder !== 'number') {
            return res.status(400).json({
                success: false,
                error: 'סדר מיון חייב להיות מספר'
            });
        }

        const treatmentType = await TreatmentType.findOne({ _id: id, therapistId });
        if (!treatmentType) {
            return res.status(404).json({
                success: false,
                error: 'סוג טיפול לא נמצא'
            });
        }

        treatmentType.sortOrder = sortOrder;
        await treatmentType.save();

        res.json({
            success: true,
            message: 'סדר מיון עודכן בהצלחה',
            data: treatmentType
        });
    } catch (error) {
        console.error('Error reordering treatment type:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בעדכון סדר מיון'
        });
    }
});

module.exports = router;
