const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Therapist = require('../models/Therapist');
const { validationResult, body } = require('express-validator');

// @route   GET /api/calendly/settings
// @desc    קבלת הגדרות Calendly של המטפלת
// @access  Private (Therapist only)
router.get('/settings', auth, authorize(['manage_own_website']), async (req, res) => {
    try {
        const therapist = await Therapist.findById(req.user.id).select('website.calendly');

        if (!therapist) {
            return res.status(404).json({
                success: false,
                message: 'מטפלת לא נמצאה'
            });
        }

        res.json({
            success: true,
            data: therapist.website.calendly || {
                isEnabled: false,
                username: '',
                embedCode: '',
                eventTypes: [],
                settings: {
                    hideEventTypesDetails: false,
                    hideGdprBanner: true,
                    primaryColor: '#4A90E2',
                    textColor: '#333333',
                    backgroundColor: '#FFFFFF'
                },
                isVerified: false
            }
        });
    } catch (error) {
        console.error('Error fetching Calendly settings:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בקבלת הגדרות Calendly',
            error: error.message
        });
    }
});

// @route   PUT /api/calendly/settings
// @desc    עדכון הגדרות Calendly
// @access  Private (Therapist only)
router.put('/settings', [
    auth,
    authorize(['manage_own_website']),
    body('isEnabled').isBoolean().withMessage('isEnabled חייב להיות true או false'),
    body('username').optional().isLength({ min: 3, max: 50 }).matches(/^[a-z0-9-_]+$/).withMessage('שם משתמש לא תקין'),
    body('embedCode').optional().isLength({ max: 5000 }).withMessage('קוד הטמעה ארוך מדי'),
    body('settings.primaryColor').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('צבע ראשי לא תקין'),
    body('settings.textColor').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('צבע טקסט לא תקין'),
    body('settings.backgroundColor').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('צבע רקע לא תקין')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'נתונים לא תקינים',
                errors: errors.array()
            });
        }

        const { isEnabled, username, embedCode, settings } = req.body;

        const therapist = await Therapist.findById(req.user.id);
        if (!therapist) {
            return res.status(404).json({
                success: false,
                message: 'מטפלת לא נמצאה'
            });
        }

        // עדכון הגדרות Calendly
        if (!therapist.website.calendly) {
            therapist.website.calendly = {};
        }

        therapist.website.calendly.isEnabled = isEnabled;

        if (username !== undefined) {
            therapist.website.calendly.username = username;
        }

        if (embedCode !== undefined) {
            therapist.website.calendly.embedCode = embedCode;
            // אימות אוטומטי אם יש קוד הטמעה תקין
            if (embedCode && embedCode.includes('calendly.com')) {
                therapist.website.calendly.isVerified = true;
                therapist.website.calendly.lastSyncAt = new Date();
            }
        }

        if (settings) {
            therapist.website.calendly.settings = {
                ...therapist.website.calendly.settings,
                ...settings
            };
        }

        await therapist.save();

        res.json({
            success: true,
            data: therapist.website.calendly,
            message: 'הגדרות Calendly עודכנו בהצלחה'
        });

    } catch (error) {
        console.error('Error updating Calendly settings:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בעדכון הגדרות Calendly',
            error: error.message
        });
    }
});

// @route   POST /api/calendly/event-types
// @desc    הוספת סוג אירוע חדש
// @access  Private (Therapist only)
router.post('/event-types', [
    auth,
    authorize(['manage_own_website']),
    body('name').notEmpty().isLength({ min: 2, max: 100 }).withMessage('שם סוג הפגישה חובה (2-100 תווים)'),
    body('duration').isInt({ min: 15, max: 480 }).withMessage('משך פגישה חייב להיות בין 15-480 דקות'),
    body('price').optional().isFloat({ min: 0 }).withMessage('מחיר חייב להיות חיובי'),
    body('description').optional().isLength({ max: 500 }).withMessage('תיאור לא יכול להכיל יותר מ-500 תווים'),
    body('calendlyUrl').optional().matches(/^https:\/\/calendly\.com\/.+/).withMessage('כתובת Calendly לא תקינה')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'נתונים לא תקינים',
                errors: errors.array()
            });
        }

        const { name, duration, price, description, calendlyUrl } = req.body;

        const therapist = await Therapist.findById(req.user.id);
        if (!therapist) {
            return res.status(404).json({
                success: false,
                message: 'מטפלת לא נמצאה'
            });
        }

        if (!therapist.website.calendly) {
            therapist.website.calendly = { eventTypes: [] };
        }

        if (!therapist.website.calendly.eventTypes) {
            therapist.website.calendly.eventTypes = [];
        }

        const newEventType = {
            name,
            duration,
            price: price || 0,
            description: description || '',
            calendlyUrl: calendlyUrl || '',
            isActive: true
        };

        therapist.website.calendly.eventTypes.push(newEventType);
        await therapist.save();

        res.status(201).json({
            success: true,
            data: newEventType,
            message: 'סוג פגישה נוסף בהצלחה'
        });

    } catch (error) {
        console.error('Error adding event type:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בהוספת סוג פגישה',
            error: error.message
        });
    }
});

// @route   PUT /api/calendly/event-types/:eventId
// @desc    עדכון סוג אירוע
// @access  Private (Therapist only)
router.put('/event-types/:eventId', [
    auth,
    authorize(['manage_own_website']),
    body('name').optional().isLength({ min: 2, max: 100 }).withMessage('שם סוג הפגישה חובה (2-100 תווים)'),
    body('duration').optional().isInt({ min: 15, max: 480 }).withMessage('משך פגישה חייב להיות בין 15-480 דקות'),
    body('price').optional().isFloat({ min: 0 }).withMessage('מחיר חייב להיות חיובי'),
    body('description').optional().isLength({ max: 500 }).withMessage('תיאור לא יכול להכיל יותר מ-500 תווים'),
    body('calendlyUrl').optional().matches(/^https:\/\/calendly\.com\/.+/).withMessage('כתובת Calendly לא תקינה'),
    body('isActive').optional().isBoolean().withMessage('isActive חייב להיות true או false')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'נתונים לא תקינים',
                errors: errors.array()
            });
        }

        const therapist = await Therapist.findById(req.user.id);
        if (!therapist) {
            return res.status(404).json({
                success: false,
                message: 'מטפלת לא נמצאה'
            });
        }

        if (!therapist.website.calendly || !therapist.website.calendly.eventTypes) {
            return res.status(404).json({
                success: false,
                message: 'סוגי פגישות לא נמצאו'
            });
        }

        const eventType = therapist.website.calendly.eventTypes.id(req.params.eventId);
        if (!eventType) {
            return res.status(404).json({
                success: false,
                message: 'סוג פגישה לא נמצא'
            });
        }

        // עדכון השדות שנשלחו
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                eventType[key] = req.body[key];
            }
        });

        await therapist.save();

        res.json({
            success: true,
            data: eventType,
            message: 'סוג פגישה עודכן בהצלחה'
        });

    } catch (error) {
        console.error('Error updating event type:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בעדכון סוג פגישה',
            error: error.message
        });
    }
});

// @route   DELETE /api/calendly/event-types/:eventId
// @desc    מחיקת סוג אירוע
// @access  Private (Therapist only)
router.delete('/event-types/:eventId', auth, authorize(['manage_own_website']), async (req, res) => {
    try {
        const therapist = await Therapist.findById(req.user.id);
        if (!therapist) {
            return res.status(404).json({
                success: false,
                message: 'מטפלת לא נמצאה'
            });
        }

        if (!therapist.website.calendly || !therapist.website.calendly.eventTypes) {
            return res.status(404).json({
                success: false,
                message: 'סוגי פגישות לא נמצאו'
            });
        }

        const eventType = therapist.website.calendly.eventTypes.id(req.params.eventId);
        if (!eventType) {
            return res.status(404).json({
                success: false,
                message: 'סוג פגישה לא נמצא'
            });
        }

        therapist.website.calendly.eventTypes.pull(req.params.eventId);
        await therapist.save();

        res.json({
            success: true,
            message: 'סוג פגישה נמחק בהצלחה'
        });

    } catch (error) {
        console.error('Error deleting event type:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה במחיקת סוג פגישה',
            error: error.message
        });
    }
});

// @route   POST /api/calendly/verify
// @desc    אימות חיבור Calendly
// @access  Private (Therapist only)
router.post('/verify', auth, authorize(['manage_own_website']), async (req, res) => {
    try {
        const therapist = await Therapist.findById(req.user.id);
        if (!therapist) {
            return res.status(404).json({
                success: false,
                message: 'מטפלת לא נמצאה'
            });
        }

        if (!therapist.website.calendly || !therapist.website.calendly.username) {
            return res.status(400).json({
                success: false,
                message: 'שם משתמש Calendly לא הוגדר'
            });
        }

        // כאן תוכל להוסיף לוגיקה לאימות האמיתי עם Calendly API
        // לעת עתה נעשה אימות פשוט של קיום קוד ההטמעה
        const isValid = therapist.website.calendly.embedCode &&
            therapist.website.calendly.embedCode.includes('calendly.com');

        therapist.website.calendly.isVerified = isValid;
        therapist.website.calendly.lastSyncAt = new Date();
        await therapist.save();

        res.json({
            success: true,
            data: {
                isVerified: isValid,
                lastSyncAt: therapist.website.calendly.lastSyncAt
            },
            message: isValid ? 'Calendly אומת בהצלחה' : 'האימות נכשל - בדקי את הנתונים'
        });

    } catch (error) {
        console.error('Error verifying Calendly:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה באימות Calendly',
            error: error.message
        });
    }
});

// @route   GET /api/calendly/public/:therapistId
// @desc    קבלת הגדרות Calendly לתצוגה באתר האישי
// @access  Public
router.get('/public/:therapistId', async (req, res) => {
    try {
        const therapist = await Therapist.findById(req.params.therapistId).select('website.calendly');

        if (!therapist) {
            return res.status(404).json({
                success: false,
                message: 'מטפלת לא נמצאה'
            });
        }

        const calendlyData = therapist.website.calendly;

        if (!calendlyData || !calendlyData.isEnabled) {
            return res.json({
                success: true,
                data: {
                    isEnabled: false,
                    message: 'Calendly לא מופעל עבור מטפלת זו'
                }
            });
        }

        // החזרת נתונים ציבוריים בלבד
        res.json({
            success: true,
            data: {
                isEnabled: calendlyData.isEnabled,
                isVerified: calendlyData.isVerified,
                embedCode: calendlyData.embedCode,
                eventTypes: calendlyData.eventTypes.filter(event => event.isActive),
                settings: calendlyData.settings
            }
        });

    } catch (error) {
        console.error('Error fetching public Calendly data:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בקבלת נתוני Calendly',
            error: error.message
        });
    }
});

// @route   POST /api/integrations/calendly/webhook
// @desc    Webhook לקבלת עדכונים מ-Calendly
// @access  Public (Calendly webhook)
router.post('/webhook', async (req, res) => {
    try {
        const { event, payload } = req.body;

        // וידוא שזה webhook של Calendly
        const calendlySignature = req.headers['calendly-webhook-signature'];
        if (!calendlySignature) {
            return res.status(401).json({
                success: false,
                error: 'Missing Calendly signature'
            });
        }

        // TODO: אימות חתימת ה-webhook
        // const isValidSignature = validateCalendlyWebhook(req.body, calendlySignature);
        // if (!isValidSignature) {
        //     return res.status(401).json({ success: false, error: 'Invalid signature' });
        // }

        console.log('Calendly webhook received:', { event, payload });

        // טיפול באירוע של הזמנה חדשה
        if (event === 'invitee.created' && payload?.invitee) {
            const { event_uri, uri } = payload.invitee;

            // חילוץ שם המשתמש מה-URI
            const eventMatch = event_uri?.match(/calendly\.com\/([^\/]+)\//);
            if (!eventMatch) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid event URI format'
                });
            }

            const username = eventMatch[1];

            // חיפוש המטפל לפי שם המשתמש ב-Calendly
            const therapist = await Therapist.findOne({
                'website.calendly.username': username
            });

            if (!therapist) {
                console.log(`Therapist not found for Calendly username: ${username}`);
                return res.status(404).json({
                    success: false,
                    error: 'Therapist not found'
                });
            }

            // עדכון סטטוס בהתאם לכללים החדשים
            if (!therapist.website.calendly) {
                therapist.website.calendly = {};
            }

            const currentStatus = therapist.website.calendly.setupStatus;

            // אם זו ההזמנה הראשונה והסטטוס אינו ACTIVE - השאר CONNECTED
            if (currentStatus !== 'completed') {
                therapist.website.calendly.setupStatus = 'connected';
                therapist.website.calendly.isVerified = true;
                therapist.website.calendly.lastSyncAt = new Date();

                // לא לשנות אוטומטית ל-ACTIVE - רק ל-CONNECTED
                console.log(`Updated therapist ${therapist._id} Calendly status to CONNECTED`);
            }

            // עדכון מונה ההזמנות (אופציונלי)
            if (!therapist.stats.calendlyBookings) {
                therapist.stats.calendlyBookings = 0;
            }
            therapist.stats.calendlyBookings += 1;

            await therapist.save();

            console.log(`Processed Calendly booking for therapist ${therapist._id}, username: ${username}`);
        }

        // החזרת תגובה חיובית ל-Calendly
        res.status(200).json({
            success: true,
            message: 'Webhook processed successfully'
        });

    } catch (error) {
        console.error('Error processing Calendly webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;
