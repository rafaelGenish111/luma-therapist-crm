const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Gallery = require('../models/Gallery');
const { body, validationResult } = require('express-validator');

// הגדרת multer לעלאת קבצים
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('רק קבצי תמונה מותרים'), false);
        }
    }
});

// ולידציה
const validateGallery = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('כותרת חייבת להכיל 1-100 תווים'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('תיאור לא יכול להיות יותר מ-500 תווים'),
    body('category')
        .isIn(['clinic', 'massage', 'therapy', 'wellness', 'other'])
        .withMessage('קטגוריה לא תקינה'),
    body('altText')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('טקסט חלופי לא יכול להיות יותר מ-200 תווים')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'שגיאות ולידציה',
            details: errors.array()
        });
    }
    next();
};

// @route   GET /api/gallery
// @desc    קבלת כל התמונות של המטפלת
// @access  Private
router.get('/', auth, authorize(['manage_own_gallery']), async (req, res) => {
    try {
        const gallery = await Gallery.findByTherapist(req.user.id);

        res.json({
            success: true,
            data: gallery
        });
    } catch (error) {
        console.error('Gallery fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בטעינת גלריה'
        });
    }
});

// @route   GET /api/gallery/public/:therapistId
// @desc    קבלת גלריה פומבית של מטפלת
// @access  Public
router.get('/public/:therapistId', async (req, res) => {
    try {
        const { therapistId } = req.params;
        const { category } = req.query;

        let query = { therapist: therapistId, isActive: true };
        if (category) {
            query.category = category;
        }

        const gallery = await Gallery.find(query).sort({ order: 1, createdAt: -1 });

        res.json({
            success: true,
            data: gallery.map(item => item.toPublicJSON())
        });
    } catch (error) {
        console.error('Public gallery fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בטעינת גלריה'
        });
    }
});

// @route   POST /api/gallery
// @desc    הוספת תמונה לגלריה
// @access  Private
router.post('/', auth, authorize(['manage_own_gallery']), upload.single('image'), validateGallery, handleValidationErrors, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'קובץ תמונה נדרש'
            });
        }

        // העלאה ל-Cloudinary
        const result = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
            {
                folder: `gallery/${req.user.id}`,
                transformation: [
                    { width: 1200, height: 800, crop: 'limit' },
                    { quality: 'auto' }
                ]
            }
        );

        const galleryData = {
            title: req.body.title,
            description: req.body.description || '',
            imageUrl: result.secure_url,
            imagePublicId: result.public_id,
            category: req.body.category,
            therapist: req.user.id,
            altText: req.body.altText || '',
            tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []
        };

        const gallery = new Gallery(galleryData);
        await gallery.save();

        res.json({
            success: true,
            data: gallery
        });

    } catch (error) {
        console.error('Gallery creation error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה ביצירת תמונה בגלריה'
        });
    }
});

// @route   PUT /api/gallery/:id
// @desc    עדכון תמונה בגלריה
// @access  Private
router.put('/:id', auth, authorize(['manage_own_gallery']), validateGallery, handleValidationErrors, async (req, res) => {
    try {
        const gallery = await Gallery.findOne({ _id: req.params.id, therapist: req.user.id });

        if (!gallery) {
            return res.status(404).json({
                success: false,
                error: 'תמונה לא נמצאה'
            });
        }

        // עדכון השדות
        gallery.title = req.body.title;
        gallery.description = req.body.description || '';
        gallery.category = req.body.category;
        gallery.altText = req.body.altText || '';
        gallery.tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];
        gallery.order = req.body.order || gallery.order;

        await gallery.save();

        res.json({
            success: true,
            data: gallery
        });
    } catch (error) {
        console.error('Gallery update error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בעדכון תמונה'
        });
    }
});

// @route   DELETE /api/gallery/:id
// @desc    מחיקת תמונה מהגלריה
// @access  Private
router.delete('/:id', auth, authorize(['manage_own_gallery']), async (req, res) => {
    try {
        const gallery = await Gallery.findOne({ _id: req.params.id, therapist: req.user.id });

        if (!gallery) {
            return res.status(404).json({
                success: false,
                error: 'תמונה לא נמצאה'
            });
        }

        // מחיקת התמונה מ-Cloudinary
        if (gallery.imagePublicId) {
            await cloudinary.uploader.destroy(gallery.imagePublicId);
        }

        await gallery.remove();

        res.json({
            success: true,
            message: 'תמונה נמחקה בהצלחה'
        });
    } catch (error) {
        console.error('Gallery deletion error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה במחיקת תמונה'
        });
    }
});

// @route   PUT /api/gallery/:id/toggle
// @desc    הפעלה/כיבוי תמונה
// @access  Private
router.put('/:id/toggle', auth, authorize(['manage_own_gallery']), async (req, res) => {
    try {
        const gallery = await Gallery.findOne({ _id: req.params.id, therapist: req.user.id });

        if (!gallery) {
            return res.status(404).json({
                success: false,
                error: 'תמונה לא נמצאה'
            });
        }

        gallery.isActive = !gallery.isActive;
        await gallery.save();

        res.json({
            success: true,
            data: gallery
        });
    } catch (error) {
        console.error('Gallery toggle error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בעדכון סטטוס תמונה'
        });
    }
});

// @route   GET /api/gallery/categories
// @desc    קבלת קטגוריות זמינות
// @access  Public
router.get('/categories', async (req, res) => {
    const categories = [
        { value: 'clinic', label: 'קליניקה' },
        { value: 'massage', label: 'עיסויים' },
        { value: 'therapy', label: 'טיפולים' },
        { value: 'wellness', label: 'בריאות' },
        { value: 'other', label: 'אחר' }
    ];

    res.json({
        success: true,
        data: categories
    });
});

module.exports = router; 