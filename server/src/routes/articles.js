const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Article = require('../models/Article');
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
const validateArticle = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('כותרת חייבת להכיל 1-200 תווים'),
    body('subtitle')
        .optional()
        .trim()
        .isLength({ max: 300 })
        .withMessage('כותרת משנה לא יכולה להיות יותר מ-300 תווים'),
    body('content')
        .trim()
        .isLength({ min: 50 })
        .withMessage('תוכן המאמר חייב להכיל לפחות 50 תווים'),
    body('excerpt')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('תקציר לא יכול להיות יותר מ-500 תווים'),
    body('category')
        .isIn(['health', 'wellness', 'therapy', 'tips', 'news', 'other'])
        .withMessage('קטגוריה לא תקינה'),
    body('seoTitle')
        .optional()
        .trim()
        .isLength({ max: 60 })
        .withMessage('כותרת SEO לא יכולה להיות יותר מ-60 תווים'),
    body('seoDescription')
        .optional()
        .trim()
        .isLength({ max: 160 })
        .withMessage('תיאור SEO לא יכול להיות יותר מ-160 תווים')
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

// @route   GET /api/articles
// @desc    קבלת כל המאמרים של המטפלת
// @access  Private
router.get('/', auth, authorize(['manage_own_articles']), async (req, res) => {
    try {
        const articles = await Article.findByTherapist(req.user.id);

        res.json({
            success: true,
            data: articles
        });
    } catch (error) {
        console.error('Articles fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בטעינת מאמרים'
        });
    }
});

// @route   GET /api/articles/public
// @desc    קבלת מאמרים פומביים
// @access  Public
router.get('/public', async (req, res) => {
    try {
        const { page = 1, limit = 10, category, therapistId } = req.query;

        let query = { isPublished: true, publishedAt: { $lte: new Date() } };

        if (category) {
            query.category = category;
        }

        if (therapistId) {
            query.therapist = therapistId;
        }

        const articles = await Article.find(query)
            .sort({ publishedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('therapist', 'firstName lastName');

        const total = await Article.countDocuments(query);

        res.json({
            success: true,
            data: articles.map(article => article.toPublicJSON()),
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Public articles fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בטעינת מאמרים'
        });
    }
});

// @route   GET /api/articles/categories
// @desc    קבלת קטגוריות זמינות
// @access  Public
router.get('/categories', async (req, res) => {
    const categories = [
        { value: 'health', label: 'בריאות' },
        { value: 'wellness', label: 'בריאות כללית' },
        { value: 'therapy', label: 'טיפולים' },
        { value: 'tips', label: 'טיפים' },
        { value: 'news', label: 'חדשות' },
        { value: 'other', label: 'אחר' }
    ];

    res.json({
        success: true,
        data: categories
    });
});

// @route   GET /api/articles/:slug
// @desc    קבלת מאמר לפי slug
// @access  Public
router.get('/:slug', async (req, res) => {
    try {
        const article = await Article.findOne({
            slug: req.params.slug,
            isPublished: true,
            publishedAt: { $lte: new Date() }
        }).populate('therapist', 'firstName lastName');

        if (!article) {
            return res.status(404).json({
                success: false,
                error: 'מאמר לא נמצא'
            });
        }

        // הגדלת מספר הצפיות
        await article.incrementViews();

        res.json({
            success: true,
            data: article.toPublicJSON()
        });
    } catch (error) {
        console.error('Article fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בטעינת מאמר'
        });
    }
});

// @route   POST /api/articles
// @desc    יצירת מאמר חדש
// @access  Private
router.post('/', auth, authorize(['manage_own_articles']), upload.single('image'), validateArticle, handleValidationErrors, async (req, res) => {
    try {
        let imageUrl = null;
        let imagePublicId = null;

        // העלאת תמונה אם נשלחה
        if (req.file) {
            const result = await cloudinary.uploader.upload(
                `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
                {
                    folder: `articles/${req.user.id}`,
                    transformation: [
                        { width: 1200, height: 630, crop: 'limit' },
                        { quality: 'auto' }
                    ]
                }
            );

            imageUrl = result.secure_url;
            imagePublicId = result.public_id;
        }

        const articleData = {
            title: req.body.title,
            subtitle: req.body.subtitle || '',
            content: req.body.content,
            excerpt: req.body.excerpt || '',
            imageUrl,
            imagePublicId,
            category: req.body.category,
            therapist: req.user.id,
            tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
            seoTitle: req.body.seoTitle || req.body.title,
            seoDescription: req.body.seoDescription || req.body.excerpt || req.body.content.substring(0, 160),
            isPublished: req.body.isPublished === 'true',
            isFeatured: req.body.isFeatured === 'true',
            readTime: Math.ceil(req.body.content.split(' ').length / 200) // כ-200 מילים לדקה
        };

        if (articleData.isPublished) {
            articleData.publishedAt = new Date();
        }

        const article = new Article(articleData);
        await article.save();

        res.json({
            success: true,
            data: article
        });
    } catch (error) {
        console.error('Article creation error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה ביצירת מאמר'
        });
    }
});

// @route   PUT /api/articles/:id
// @desc    עדכון מאמר
// @access  Private
router.put('/:id', auth, authorize(['manage_own_articles']), validateArticle, handleValidationErrors, async (req, res) => {
    try {
        const article = await Article.findOne({ _id: req.params.id, therapist: req.user.id });

        if (!article) {
            return res.status(404).json({
                success: false,
                error: 'מאמר לא נמצא'
            });
        }

        // עדכון השדות
        article.title = req.body.title;
        article.subtitle = req.body.subtitle || '';
        article.content = req.body.content;
        article.excerpt = req.body.excerpt || '';
        article.category = req.body.category;
        article.tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];
        article.seoTitle = req.body.seoTitle || req.body.title;
        article.seoDescription = req.body.seoDescription || req.body.excerpt || req.body.content.substring(0, 160);
        article.isFeatured = req.body.isFeatured === 'true';
        article.readTime = Math.ceil(req.body.content.split(' ').length / 200);

        // עדכון סטטוס פרסום
        const wasPublished = article.isPublished;
        article.isPublished = req.body.isPublished === 'true';

        if (article.isPublished && !wasPublished) {
            article.publishedAt = new Date();
        } else if (!article.isPublished && wasPublished) {
            article.publishedAt = null;
        }

        // עדכון slug אם הוא ריק
        if (!article.slug || article.slug === '') {
            article.slug = article.title
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        await article.save();

        res.json({
            success: true,
            data: article
        });
    } catch (error) {
        console.error('Article update error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בעדכון מאמר'
        });
    }
});

// @route   DELETE /api/articles/:id
// @desc    מחיקת מאמר
// @access  Private
router.delete('/:id', auth, authorize(['manage_own_articles']), async (req, res) => {
    try {
        const article = await Article.findOne({ _id: req.params.id, therapist: req.user.id });

        if (!article) {
            return res.status(404).json({
                success: false,
                error: 'מאמר לא נמצא'
            });
        }

        // מחיקת התמונה מ-Cloudinary
        if (article.imagePublicId) {
            await cloudinary.uploader.destroy(article.imagePublicId);
        }

        await article.remove();

        res.json({
            success: true,
            message: 'מאמר נמחק בהצלחה'
        });
    } catch (error) {
        console.error('Article deletion error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה במחיקת מאמר'
        });
    }
});

// @route   PUT /api/articles/:id/publish
// @desc    פרסום/ביטול פרסום מאמר
// @access  Private
router.put('/:id/publish', auth, authorize(['manage_own_articles']), async (req, res) => {
    try {
        console.log('===> toggle publish start', req.params.id, req.user.id);
        const article = await Article.findOne({ _id: req.params.id, therapist: req.user.id });
        console.log('===> found article:', article);

        if (!article) {
            console.log('===> article not found');
            return res.status(404).json({
                success: false,
                error: 'מאמר לא נמצא'
            });
        }

        if (article.isPublished) {
            console.log('===> unpublishing');
            await article.unpublish();
        } else {
            console.log('===> publishing');
            await article.publish();
        }

        console.log('===> after publish/unpublish', article);
        res.json({
            success: true,
            data: article
        });
    } catch (error) {
        console.error('Article publish toggle error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בעדכון סטטוס פרסום'
        });
    }
});

module.exports = router; 