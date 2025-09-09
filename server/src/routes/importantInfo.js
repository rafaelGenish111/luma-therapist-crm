const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const ImportantInfo = require('../models/ImportantInfo');
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// ולידציה למידע חשוב
const validateImportantInfo = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('כותרת חייב להכיל 2-100 תווים'),
    body('items')
        .optional()
        .isArray()
        .withMessage('פריטים חייבים להיות מערך'),
    body('items.*.text')
        .optional()
        .trim()
        .isLength({ min: 2, max: 500 })
        .withMessage('טקסט פריט חייב להכיל 2-500 תווים')
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
 * GET /api/important-info/therapist/:therapistId
 * קבלת מידע חשוב של מטפל (ציבורי)
 */
router.get('/therapist/:therapistId', async (req, res) => {
    try {
        const { therapistId } = req.params;

        const importantInfo = await ImportantInfo.findOrCreateByTherapist(therapistId);

        res.json({
            success: true,
            data: importantInfo.toPublicJSON()
        });
    } catch (error) {
        console.error('Error fetching important info:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בטעינת מידע חשוב'
        });
    }
});

/**
 * GET /api/important-info
 * קבלת מידע חשוב של המטפל המחובר (פרטי)
 */
router.get('/', auth, authorize(['THERAPIST']), async (req, res) => {
    try {
        const therapistId = req.user.id;

        const importantInfo = await ImportantInfo.findOrCreateByTherapist(therapistId);

        res.json({
            success: true,
            data: importantInfo
        });
    } catch (error) {
        console.error('Error fetching important info:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בטעינת מידע חשוב'
        });
    }
});

/**
 * PUT /api/important-info
 * עדכון מידע חשוב
 */
router.put('/', auth, authorize(['THERAPIST']), validateImportantInfo, handleValidationErrors, async (req, res) => {
    try {
        const therapistId = req.user.id;
        const { title, items } = req.body;

        let importantInfo = await ImportantInfo.findOne({ therapistId });

        if (!importantInfo) {
            importantInfo = new ImportantInfo({ therapistId });
        }

        if (title !== undefined) {
            importantInfo.title = title;
        }

        if (items !== undefined) {
            importantInfo.items = items;
        }

        await importantInfo.save();

        res.json({
            success: true,
            message: 'מידע חשוב עודכן בהצלחה',
            data: importantInfo
        });
    } catch (error) {
        console.error('Error updating important info:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בעדכון מידע חשוב'
        });
    }
});

/**
 * POST /api/important-info/items
 * הוספת פריט חדש למידע חשוב
 */
router.post('/items', auth, authorize(['THERAPIST']), [
    body('text')
        .trim()
        .isLength({ min: 2, max: 500 })
        .withMessage('טקסט חייב להכיל 2-500 תווים')
], handleValidationErrors, async (req, res) => {
    try {
        const therapistId = req.user.id;
        const { text } = req.body;

        let importantInfo = await ImportantInfo.findOne({ therapistId });

        if (!importantInfo) {
            importantInfo = new ImportantInfo({ therapistId });
        }

        const maxSortOrder = importantInfo.items.length > 0
            ? Math.max(...importantInfo.items.map(item => item.sortOrder))
            : 0;

        importantInfo.items.push({
            text,
            sortOrder: maxSortOrder + 1
        });

        await importantInfo.save();

        res.json({
            success: true,
            message: 'פריט נוסף בהצלחה',
            data: importantInfo
        });
    } catch (error) {
        console.error('Error adding important info item:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בהוספת פריט'
        });
    }
});

/**
 * PUT /api/important-info/items/:itemId
 * עדכון פריט במידע חשוב
 */
router.put('/items/:itemId', auth, authorize(['THERAPIST']), [
    body('text')
        .trim()
        .isLength({ min: 2, max: 500 })
        .withMessage('טקסט חייב להכיל 2-500 תווים')
], handleValidationErrors, async (req, res) => {
    try {
        const therapistId = req.user.id;
        const { itemId } = req.params;
        const { text } = req.body;

        const importantInfo = await ImportantInfo.findOne({ therapistId });

        if (!importantInfo) {
            return res.status(404).json({
                success: false,
                error: 'מידע חשוב לא נמצא'
            });
        }

        const item = importantInfo.items.id(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'פריט לא נמצא'
            });
        }

        item.text = text;
        await importantInfo.save();

        res.json({
            success: true,
            message: 'פריט עודכן בהצלחה',
            data: importantInfo
        });
    } catch (error) {
        console.error('Error updating important info item:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בעדכון פריט'
        });
    }
});

/**
 * DELETE /api/important-info/items/:itemId
 * מחיקת פריט ממידע חשוב (לוגית)
 */
router.delete('/items/:itemId', auth, authorize(['THERAPIST']), async (req, res) => {
    try {
        const therapistId = req.user.id;
        const { itemId } = req.params;

        const importantInfo = await ImportantInfo.findOne({ therapistId });

        if (!importantInfo) {
            return res.status(404).json({
                success: false,
                error: 'מידע חשוב לא נמצא'
            });
        }

        const item = importantInfo.items.id(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'פריט לא נמצא'
            });
        }

        item.isActive = false;
        await importantInfo.save();

        res.json({
            success: true,
            message: 'פריט נמחק בהצלחה'
        });
    } catch (error) {
        console.error('Error deleting important info item:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה במחיקת פריט'
        });
    }
});

/**
 * PATCH /api/important-info/items/:itemId/reorder
 * שינוי סדר של פריטים
 */
router.patch('/items/:itemId/reorder', auth, authorize(['THERAPIST']), async (req, res) => {
    try {
        const therapistId = req.user.id;
        const { itemId } = req.params;
        const { sortOrder } = req.body;

        if (typeof sortOrder !== 'number') {
            return res.status(400).json({
                success: false,
                error: 'סדר מיון חייב להיות מספר'
            });
        }

        const importantInfo = await ImportantInfo.findOne({ therapistId });

        if (!importantInfo) {
            return res.status(404).json({
                success: false,
                error: 'מידע חשוב לא נמצא'
            });
        }

        const item = importantInfo.items.id(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'פריט לא נמצא'
            });
        }

        item.sortOrder = sortOrder;
        await importantInfo.save();

        res.json({
            success: true,
            message: 'סדר מיון עודכן בהצלחה',
            data: importantInfo
        });
    } catch (error) {
        console.error('Error reordering important info item:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בעדכון סדר מיון'
        });
    }
});

module.exports = router;


