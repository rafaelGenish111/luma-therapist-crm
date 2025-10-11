const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Article = require('../models/Article');
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

// ולידציה לעדכון פרופיל
const validateProfileUpdate = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('שם פרטי חייב להכיל 2-50 תווים'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('שם משפחה חייב להכיל 2-50 תווים'),
    body('phone')
        .optional()
        // דרישה: מספר ישראלי שמתחיל ב-05 וכולל 10 ספרות בדיוק (אפשר רווחים/מקפים שננקה)
        .custom((value) => {
            if (typeof value !== 'string') return false;
            const normalized = value.replace(/[\s-]/g, '');
            return /^05\d{8}$/.test(normalized);
        })
        .withMessage('מספר טלפון חייב להתחיל ב-05 ולהכיל 10 ספרות'),
    body('professionalDescription')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('תיאור מקצועי לא יכול להכיל יותר מ-2000 תווים'),
    body('personalStory')
        .optional()
        .trim()
        .isLength({ max: 3000 })
        .withMessage('סיפור אישי לא יכול להכיל יותר מ-3000 תווים'),
    body('aboutMe')
        .optional()
        .trim()
        .isLength({ max: 1500 })
        .withMessage('טקסט "עליי" לא יכול להכיל יותר מ-1500 תווים'),
    body('businessPhone')
        .optional()
        .custom((value) => {
            if (!value) return true; // אופציונלי
            if (typeof value !== 'string') return false;
            const normalized = value.replace(/[\s-]/g, '');
            // תמיכה בפורמטים: 0528553431, 972528553431, 528553431
            return /^(972|0)?5\d{8}$/.test(normalized) || /^(972|0)?\d{8,10}$/.test(normalized);
        })
        .withMessage('מספר טלפון עסקי חייב להתחיל ב-05 ולהכיל 10 ספרות (לדוגמה: 050-1234567)'),
    body('whatsappLink')
        .optional()
        .matches(/^https?:\/\/wa\.me\/\d+/)
        .withMessage('קישור וואטסאפ לא תקין'),
    body('socialMedia.facebook')
        .optional()
        .matches(/^https?:\/\/(www\.)?facebook\.com\/.+/)
        .withMessage('כתובת פייסבוק לא תקינה'),
    body('socialMedia.instagram')
        .optional()
        .matches(/^https?:\/\/(www\.)?instagram\.com\/.+/)
        .withMessage('כתובת אינסטגרם לא תקינה'),
    body('socialMedia.linkedin')
        .optional()
        .matches(/^https?:\/\/(www\.)?linkedin\.com\/.+/)
        .withMessage('כתובת לינקדאין לא תקינה'),
    body('socialMedia.twitter')
        .optional()
        .matches(/^https?:\/\/(www\.)?twitter\.com\/.+/)
        .withMessage('כתובת טוויטר לא תקינה'),
    body('socialMedia.youtube')
        .optional()
        .matches(/^https?:\/\/(www\.)?youtube\.com\/.+/)
        .withMessage('כתובת יוטיוב לא תקינה'),
    body('socialMedia.website')
        .optional()
        .matches(/^https?:\/\/.+/)
        .withMessage('כתובת אתר לא תקינה')
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

// @route   GET /api/therapists/profile
// @desc    קבלת פרופיל המטפלת הנוכחית
// @access  Private
router.get('/profile', auth, authorize(['manage_own_profile']), async (req, res) => {
    try {
        // מניעת cache
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        console.log('Fetching therapist profile for user:', req.user.id);

        const therapist = await Therapist.findById(req.user.id);
        console.log('Therapist found:', !!therapist);

        if (!therapist) {
            console.log('Therapist not found for user ID:', req.user.id);
            return res.status(404).json({
                success: false,
                error: 'מטפלת לא נמצאה'
            });
        }

        console.log('Therapist data loaded successfully');
        res.json({
            success: true,
            data: therapist
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בטעינת פרופיל'
        });
    }
});

// @route   PUT /api/therapists/profile
// @desc    עדכון פרופיל המטפלת
// @access  Private
router.put('/profile', auth, authorize(['manage_own_profile']), validateProfileUpdate, handleValidationErrors, async (req, res) => {
    try {
        const therapist = await Therapist.findById(req.user.id);

        if (!therapist) {
            return res.status(404).json({
                success: false,
                error: 'מטפלת לא נמצאה'
            });
        }

        // עדכון השדות שנשלחו
        const updateFields = [
            'firstName', 'lastName', 'phone', 'dateOfBirth',
            'professionalDescription', 'personalStory', 'aboutMe',
            'whatsappLink', 'socialMedia', 'workingHours', 'languages',
            'businessName', 'businessAddress', 'businessPhone', 'businessEmail',
            'hourlyRate', 'currency', 'paymentMethods',
            'homeSummary', 'clinicImage',
            'website', 'calendlyUrl', 'calendarSettings'
        ];

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'socialMedia') {
                    therapist.socialMedia = { ...therapist.socialMedia, ...req.body[field] };
                } else if (field === 'workingHours') {
                    therapist.workingHours = { ...therapist.workingHours, ...req.body[field] };
                } else if (field === 'phone') {
                    // נרמול טלפון: הסרת רווחים ומקפים
                    therapist.phone = String(req.body[field]).replace(/[\s-]/g, '');
                } else if (field === 'businessPhone') {
                    // נרמול טלפון עסקי: הסרת רווחים ומקפים
                    therapist.businessPhone = String(req.body[field]).replace(/[\s-]/g, '');
                } else if (field === 'website') {
                    therapist.website = { ...therapist.website, ...req.body[field] };
                } else if (field === 'calendarSettings') {
                    therapist.calendarSettings = { ...therapist.calendarSettings, ...req.body[field] };
                } else {
                    therapist[field] = req.body[field];
                }
            }
        });

        // עדכון יעד ההכנסות החודשי אם נשלח
        if (req.body.monthlyRevenueTarget !== undefined) {
            therapist.monthlyRevenueTarget = req.body.monthlyRevenueTarget;
        }

        await therapist.save();

        res.json({
            success: true,
            data: therapist,
            message: 'פרופיל עודכן בהצלחה'
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בעדכון פרופיל'
        });
    }
});

// @route   PUT /api/therapists/calendly-link
// @desc    עדכון קישור Calendly
// @access  Private
router.put('/calendly-link', auth, authorize(['manage_own_profile']), [
    body('calendlyUrl')
        .trim()
        .notEmpty()
        .withMessage('קישור Calendly הוא שדה חובה')
        .matches(/^https:\/\/calendly\.com\/.+/)
        .withMessage('קישור Calendly חייב להתחיל ב-https://calendly.com')
], handleValidationErrors, async (req, res) => {
    try {
        const therapist = await Therapist.findById(req.user.id);

        if (!therapist) {
            return res.status(404).json({
                success: false,
                error: 'מטפלת לא נמצאה'
            });
        }

        // עדכון קישור Calendly
        therapist.calendlyUrl = req.body.calendlyUrl;
        await therapist.save();

        res.json({
            success: true,
            data: {
                calendlyUrl: therapist.calendlyUrl
            },
            message: 'קישור Calendly עודכן בהצלחה'
        });
    } catch (error) {
        console.error('Calendly link update error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בעדכון קישור Calendly'
        });
    }
});

// פונקציית עזר לטיפול בהעלאת תמונות עם גיבוי מקומי
const uploadImageWithFallback = async (file, folder, options = {}) => {
    const fs = require('fs');
    const path = require('path');

    // בדיקה אם Cloudinary מוגדר כראוי
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
        process.env.CLOUDINARY_API_SECRET &&
        process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';

    if (isCloudinaryConfigured) {
        try {
            console.log('🌤️ Using Cloudinary for image upload');
            const result = await cloudinary.uploader.upload(
                `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                {
                    folder,
                    ...options
                }
            );
            return {
                url: result.secure_url,
                publicId: result.public_id,
                provider: 'cloudinary'
            };
        } catch (cloudinaryError) {
            console.error('Cloudinary upload failed, falling back to local storage:', cloudinaryError);
            // המשך לגיבוי מקומי
        }
    }

    // גיבוי מקומי
    console.log('💾 Using local storage for image upload');

    // יצירת תיקיית uploads אם לא קיימת
    const uploadsDir = path.join(__dirname, '../../uploads');
    const folderPath = path.join(uploadsDir, folder);

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    // יצירת שם קובץ ייחודי
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const filename = `${timestamp}_${randomString}${fileExtension}`;
    const filepath = path.join(folderPath, filename);

    // שמירת הקובץ
    fs.writeFileSync(filepath, file.buffer);

    // יצירת URL יחסי
    const relativeUrl = `/uploads/${folder}/${filename}`;

    return {
        url: relativeUrl,
        publicId: filename,
        provider: 'local',
        filepath: filepath
    };
};

// @route   POST /api/therapists/profile/image
// @desc    העלאת תמונת פרופיל
// @access  Private
router.post('/profile/image', auth, authorize(['manage_own_profile']), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'לא נשלחה תמונה'
            });
        }

        const therapist = await Therapist.findById(req.user.id);

        if (!therapist) {
            return res.status(404).json({
                success: false,
                error: 'מטפלת לא נמצאה'
            });
        }

        // מחיקת תמונת פרופיל קיימת
        if (therapist.profileImagePublicId) {
            try {
                // מחיקה מ-Cloudinary אם זה Cloudinary
                if (therapist.profileImageProvider === 'cloudinary') {
                    await cloudinary.uploader.destroy(therapist.profileImagePublicId);
                }
                // מחיקה מקומית אם זה קובץ מקומי
                else if (therapist.profileImageProvider === 'local' && therapist.profileImagePath) {
                    const fs = require('fs');
                    if (fs.existsSync(therapist.profileImagePath)) {
                        fs.unlinkSync(therapist.profileImagePath);
                    }
                }
            } catch (error) {
                console.error('Error deleting old profile image:', error);
            }
        }

        // העלאת תמונה חדשה
        let uploadResult;
        try {
            uploadResult = await uploadImageWithFallback(
                req.file,
                `therapists/${req.user.id}/profile`,
                {
                    transformation: [
                        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                        { quality: 'auto' }
                    ]
                }
            );
        } catch (uploadError) {
            console.error('Image upload error:', uploadError);
            return res.status(500).json({
                success: false,
                error: 'שגיאה בהעלאת התמונה: ' + uploadError.message
            });
        }

        // עדכון הפרופיל
        therapist.profileImage = uploadResult.url;
        therapist.profileImagePublicId = uploadResult.publicId;
        therapist.profileImageProvider = uploadResult.provider;
        if (uploadResult.filepath) {
            therapist.profileImagePath = uploadResult.filepath;
        }

        await therapist.save();

        console.log(`✅ Profile image uploaded successfully using ${uploadResult.provider}:`, uploadResult.url);

        res.json({
            success: true,
            data: {
                profileImage: uploadResult.url,
                profileImagePublicId: uploadResult.publicId,
                provider: uploadResult.provider
            },
            message: `תמונת פרופיל הועלתה בהצלחה באמצעות ${uploadResult.provider === 'cloudinary' ? 'Cloudinary' : 'אחסון מקומי'}`
        });
    } catch (error) {
        console.error('Profile image upload error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בהעלאת תמונת פרופיל: ' + error.message
        });
    }
});

// @route   DELETE /api/therapists/profile/image
// @desc    מחיקת תמונת פרופיל
// @access  Private
router.delete('/profile/image', auth, authorize(['manage_own_profile']), async (req, res) => {
    try {
        const therapist = await Therapist.findById(req.user.id);

        if (!therapist) {
            return res.status(404).json({
                success: false,
                error: 'מטפלת לא נמצאה'
            });
        }

        // מחיקת תמונה (Cloudinary או מקומי)
        if (therapist.profileImagePublicId) {
            try {
                // מחיקה מ-Cloudinary אם זה Cloudinary
                if (therapist.profileImageProvider === 'cloudinary') {
                    await cloudinary.uploader.destroy(therapist.profileImagePublicId);
                }
                // מחיקה מקומית אם זה קובץ מקומי
                else if (therapist.profileImageProvider === 'local' && therapist.profileImagePath) {
                    const fs = require('fs');
                    if (fs.existsSync(therapist.profileImagePath)) {
                        fs.unlinkSync(therapist.profileImagePath);
                    }
                }
            } catch (error) {
                console.error('Error deleting profile image:', error);
            }
        }

        // מחיקת הקישורים מהפרופיל
        therapist.profileImage = null;
        therapist.profileImagePublicId = null;
        therapist.profileImageProvider = 'cloudinary';
        therapist.profileImagePath = null;
        await therapist.save();

        res.json({
            success: true,
            message: 'תמונת פרופיל נמחקה בהצלחה'
        });
    } catch (error) {
        console.error('Profile image deletion error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה במחיקת תמונת פרופיל'
        });
    }
});

// @route   PUT /api/therapists/profile/theme
// @desc    עדכון עיצוב אישי של המטפלת
// @access  Private
router.put('/profile/theme', auth, authorize(['manage_own_profile']), async (req, res) => {
    try {
        const therapist = await Therapist.findById(req.user.id);
        if (!therapist) {
            return res.status(404).json({ success: false, error: 'מטפלת לא נמצאה' });
        }
        therapist.theme = { ...therapist.theme, ...req.body };
        await therapist.save();
        res.json({ success: true, data: therapist.theme, message: 'העיצוב נשמר בהצלחה' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'שגיאה בשמירת עיצוב' });
    }
});

// @route   GET /api/therapists/:id/theme
// @desc    קבלת עיצוב אישי של מטפלת לפי מזהה
// @access  Public
router.get('/:id/theme', async (req, res) => {
    try {
        const therapist = await Therapist.findById(req.params.id).select('theme');
        if (!therapist) {
            return res.status(404).json({ success: false, error: 'מטפלת לא נמצאה' });
        }
        res.json({ success: true, data: therapist.theme });
    } catch (error) {
        res.status(500).json({ success: false, error: 'שגיאה בקבלת עיצוב' });
    }
});

// @route   POST /api/therapists/profile/clinic-image
// @desc    העלאת תמונת קליניקה לאתר האישי
// @access  Private
router.post('/profile/clinic-image', auth, authorize(['manage_own_profile']), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'לא נשלחה תמונה' });
        }
        const therapist = await Therapist.findById(req.user.id);
        if (!therapist) {
            return res.status(404).json({ success: false, error: 'מטפלת לא נמצאה' });
        }
        // העלאה ל-Cloudinary
        const result = await cloudinary.uploader.upload_stream({
            folder: 'clinic_images',
            resource_type: 'image',
            transformation: [{ width: 1200, height: 800, crop: 'limit' }]
        }, async (error, result) => {
            if (error) {
                return res.status(500).json({ success: false, error: 'שגיאה בהעלאת תמונה' });
            }
            therapist.clinicImage = result.secure_url;
            await therapist.save();
            res.json({ success: true, url: result.secure_url });
        });
        result.end(req.file.buffer);
    } catch (error) {
        res.status(500).json({ success: false, error: 'שגיאה בהעלאת תמונה' });
    }
});

// @route   DELETE /api/therapists/profile/clinic-image
// @desc    מחיקת תמונת קליניקה מהפרופיל ומהשרת
// @access  Private
router.delete('/profile/clinic-image', auth, authorize(['manage_own_profile']), async (req, res) => {
    try {
        const therapist = await Therapist.findById(req.user.id);
        if (!therapist) {
            return res.status(404).json({ success: false, error: 'מטפלת לא נמצאה' });
        }
        // אם יש publicId, מחק מ-Cloudinary (לא חובה אם לא נשמר)
        // therapist.clinicImagePublicId
        therapist.clinicImage = '';
        await therapist.save();
        res.json({ success: true, message: 'התמונה נמחקה' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'שגיאה במחיקת תמונה' });
    }
});

// @route   GET /api/therapists/:id
// @desc    קבלת פרופיל ציבורי של מטפלת לפי מזהה
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const therapist = await Therapist.findById(req.params.id).select('-password -email -phone -businessEmail -businessPhone -__v');
        if (!therapist) {
            return res.status(404).json({ success: false, error: 'מטפלת לא נמצאה' });
        }
        res.json({ success: true, data: therapist });
    } catch (error) {
        res.status(500).json({ success: false, error: 'שגיאה בקבלת פרופיל' });
    }
});

// @route   GET /api/therapists/metrics
// @desc    החזרת מונים ללוח הבקרה: לקוחות פעילים, מאמרים, תמונות בגלריה
// @access  Private
router.get('/metrics/summary', auth, authorize(['manage_own_profile']), async (req, res) => {
    try {
        const therapistId = req.user.id;

        // מונֵה לקוחות: כל הלקוחות הפעילים (isActive !== false)
        const [activeClients, articlesCount, galleryCount] = await Promise.all([
            Client.countDocuments({ therapist: therapistId, $or: [{ isActive: { $exists: false } }, { isActive: true }] }),
            Article.countDocuments({ therapist: therapistId }),
            Gallery.countDocuments({ therapist: therapistId, isActive: true })
        ]);

        res.json({
            success: true,
            data: {
                activeClients,
                articles: articlesCount,
                galleryImages: galleryCount
            }
        });
    } catch (error) {
        console.error('Metrics summary error:', error);
        res.status(500).json({ success: false, error: 'שגיאה בטעינת מונים' });
    }
});

// @route   PUT /api/therapists/revenue-target
// @desc    עדכון יעד ההכנסות החודשי
// @access  Private
router.put('/revenue-target', auth, authorize(['manage_own_profile']), [
    body('monthlyRevenueTarget')
        .isNumeric()
        .withMessage('יעד ההכנסות חייב להיות מספר')
        .isFloat({ min: 0, max: 1000000 })
        .withMessage('יעד ההכנסות חייב להיות בין 0 ל-1,000,000')
], handleValidationErrors, async (req, res) => {
    try {
        const { monthlyRevenueTarget } = req.body;

        const therapist = await Therapist.findById(req.user.id);
        if (!therapist) {
            return res.status(404).json({
                success: false,
                error: 'מטפלת לא נמצאה'
            });
        }

        therapist.monthlyRevenueTarget = monthlyRevenueTarget;
        await therapist.save();

        res.json({
            success: true,
            message: 'יעד ההכנסות החודשי עודכן בהצלחה',
            data: {
                monthlyRevenueTarget: therapist.monthlyRevenueTarget
            }
        });
    } catch (error) {
        console.error('Revenue target update error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בעדכון יעד ההכנסות'
        });
    }
});

module.exports = router; 