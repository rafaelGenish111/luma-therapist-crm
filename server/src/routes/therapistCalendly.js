const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { requireCalendlyAccess } = require('../middleware/planFeatures');
const Therapist = require('../models/Therapist');
const { calendlyService } = require('../services/calendlyService');
const { calendlyWebhooksService } = require('../services/calendlyWebhooks');

// Zod validation schemas
const embedConfigSchema = z.object({
    hideEventTypeDetails: z.boolean().optional(),
    hideGdprBanner: z.boolean().optional(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'צבע ראשי לא תקין').optional(),
    textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'צבע טקסט לא תקין').optional(),
    backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'צבע רקע לא תקין').optional(),
    hideGitcamFooter: z.boolean().optional(),
    hideCalendlyFooter: z.boolean().optional(),
    height: z.number().min(400).max(1200).optional(),
    branding: z.boolean().optional(),
    inlineEmbed: z.boolean().optional(),
    popupWidget: z.boolean().optional()
});

const updateEmbedConfigSchema = z.object({
    embedConfig: embedConfigSchema.optional(),
    schedulingLink: z.string().url('קישור לקביעת פגישות לא תקין').optional(),
    username: z.string().min(3).max(50).regex(/^[a-z0-9-_]+$/, 'שם משתמש לא תקין').optional()
});

// מידלוואר לולידציה של Zod
const validateZod = (schema) => {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req.body);
            req.validatedData = validatedData;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'נתונים לא תקינים',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    };
};

// מידלוואר לבדיקת role therapist
const requireTherapistRole = (req, res, next) => {
    if (!req.user || req.user.role !== 'therapist') {
        return res.status(403).json({
            success: false,
            error: 'גישה מותרת למטפלים בלבד',
            code: 'THERAPIST_ONLY'
        });
    }
    next();
};

/**
 * @route   GET /api/therapist/calendly/state
 * @desc    קבלת מצב Calendly של המטפל
 * @access  Private (Therapist only + Calendly feature)
 */
router.get('/state',
    auth,
    requireTherapistRole,
    requireCalendlyAccess(),
    async (req, res) => {
        try {
            const therapist = req.therapist; // זמין מהמידלוואר requireCalendlyAccess
            const calendlyData = therapist.website?.calendly || {};

            // בניית קישור לקביעת פגישות
            let schedulingLink = null;
            if (calendlyData.username) {
                schedulingLink = `https://calendly.com/${calendlyData.username}`;
            }

            // קביעת מצב החיבור
            let connected = false;
            if (calendlyData.username && calendlyData.isVerified) {
                connected = true;
            }

            const response = {
                success: true,
                data: {
                    setupStatus: calendlyData.setupStatus || 'not_started',
                    connected,
                    embedConfig: calendlyData.embedConfig || {
                        hideEventTypeDetails: false,
                        hideGdprBanner: true,
                        primaryColor: '#4A90E2',
                        textColor: '#333333',
                        backgroundColor: '#FFFFFF',
                        hideGitcamFooter: true,
                        hideCalendlyFooter: false,
                        height: 630,
                        branding: true,
                        inlineEmbed: true,
                        popupWidget: false
                    },
                    schedulingLink,
                    username: calendlyData.username || null,
                    isEnabled: calendlyData.isEnabled || false,
                    isVerified: calendlyData.isVerified || false,
                    lastSyncAt: calendlyData.lastSyncAt || null
                }
            };

            res.json(response);
        } catch (error) {
            console.error('Error fetching Calendly state:', error);
            res.status(500).json({
                success: false,
                error: 'שגיאה בקבלת מצב Calendly',
                details: error.message
            });
        }
    }
);

/**
 * @route   POST /api/therapist/calendly/embed-config
 * @desc    עדכון הגדרות embedConfig + מעבר ל-ACTIVE אם יש schedulingLink
 * @access  Private (Therapist only + Calendly feature)
 */
router.post('/embed-config',
    auth,
    requireTherapistRole,
    requireCalendlyAccess(),
    validateZod(updateEmbedConfigSchema),
    async (req, res) => {
        try {
            const therapist = req.therapist;
            const { embedConfig, schedulingLink, username } = req.validatedData;

            // אתחול calendly object אם לא קיים
            if (!therapist.website.calendly) {
                therapist.website.calendly = {};
            }

            // עדכון embedConfig
            if (embedConfig) {
                therapist.website.calendly.embedConfig = {
                    ...therapist.website.calendly.embedConfig,
                    ...embedConfig
                };
            }

            // עדכון שם משתמש אם סופק
            if (username) {
                therapist.website.calendly.username = username;
            }

            // עדכון setupStatus לפי נוכחות schedulingLink
            if (schedulingLink) {
                // בדיקה שהקישור תואם לשם המשתמש
                const extractedUsername = schedulingLink.replace('https://calendly.com/', '').split('/')[0];
                if (extractedUsername) {
                    therapist.website.calendly.username = extractedUsername;
                }

                // מעבר ל-ACTIVE אם יש קישור תקין
                therapist.website.calendly.setupStatus = 'completed';
                therapist.website.calendly.isEnabled = true;
                therapist.website.calendly.isVerified = true;
                therapist.website.calendly.lastSyncAt = new Date();
            } else if (therapist.website.calendly.username) {
                // אם יש username אבל לא נשלח schedulingLink, בדוק אם צריך לעדכן סטטוס
                const currentStatus = therapist.website.calendly.setupStatus;
                if (currentStatus === 'not_started') {
                    therapist.website.calendly.setupStatus = 'in_progress';
                }
            }

            await therapist.save();

            // בניית תגובה עם מצב עדכני
            const response = {
                success: true,
                data: {
                    setupStatus: therapist.website.calendly.setupStatus,
                    embedConfig: therapist.website.calendly.embedConfig,
                    username: therapist.website.calendly.username,
                    schedulingLink: therapist.website.calendly.username ?
                        `https://calendly.com/${therapist.website.calendly.username}` : null,
                    isEnabled: therapist.website.calendly.isEnabled,
                    connected: therapist.website.calendly.isVerified && therapist.website.calendly.username
                },
                message: 'הגדרות Calendly עודכנו בהצלחה'
            };

            res.json(response);
        } catch (error) {
            console.error('Error updating Calendly embed config:', error);
            res.status(500).json({
                success: false,
                error: 'שגיאה בעדכון הגדרות Calendly',
                details: error.message
            });
        }
    }
);

/**
 * @route   POST /api/therapist/calendly/connect
 * @desc    החזרת URL לחיבור OAuth עם Calendly (Self-service)
 * @access  Private (Therapist only + Calendly feature)
 */
router.post('/connect',
    auth,
    requireTherapistRole,
    requireCalendlyAccess(),
    async (req, res) => {
        try {
            const therapist = req.therapist;
            const { returnUrl } = req.body;

            // שימוש בשירות החדש
            const connectResult = await calendlyService.getConnectUrlForTherapist(
                therapist._id.toString(),
                {
                    returnUrl: returnUrl || '/dashboard/calendly',
                    adminInitiated: false
                }
            );

            if (!connectResult.success) {
                return res.status(400).json({
                    success: false,
                    error: connectResult.error
                });
            }

            res.json({
                success: true,
                data: {
                    redirectUrl: connectResult.data.connectUrl,
                    state: connectResult.data.state,
                    setupStatus: connectResult.data.setupStatus,
                    expiresAt: connectResult.data.expiresAt
                },
                message: 'URL להתחברות ל-Calendly נוצר בהצלחה'
            });
        } catch (error) {
            console.error('Error creating Calendly connect URL:', error);
            res.status(500).json({
                success: false,
                error: 'שגיאה ביצירת קישור להתחברות',
                details: error.message
            });
        }
    }
);

/**
 * @route   POST /api/therapist/calendly/disconnect
 * @desc    ניתוק חיבור Calendly
 * @access  Private (Therapist only + Calendly feature)
 */
router.post('/disconnect',
    auth,
    requireTherapistRole,
    requireCalendlyAccess(),
    async (req, res) => {
        try {
            const therapist = req.therapist;
            const { keepConfig = true } = req.body;

            // שימוש בשירות החדש
            const disconnectResult = await calendlyService.disconnectTherapist(
                therapist._id.toString(),
                {
                    keepConfig,
                    adminInitiated: false
                }
            );

            if (!disconnectResult.success) {
                return res.status(400).json({
                    success: false,
                    error: disconnectResult.error
                });
            }

            res.json({
                success: true,
                data: {
                    setupStatus: 'not_started',
                    connected: false,
                    configKept: keepConfig,
                    disconnectedAt: disconnectResult.data.disconnectedAt,
                    webhooks: disconnectResult.data.webhooks
                },
                message: 'חיבור Calendly נותק בהצלחה'
            });
        } catch (error) {
            console.error('Error disconnecting Calendly:', error);
            res.status(500).json({
                success: false,
                error: 'שגיאה בניתוק Calendly',
                details: error.message
            });
        }
    }
);

/**
 * @route   GET /api/therapist/calendly/event-types
 * @desc    קבלת סוגי אירועים מ-Calendly
 * @access  Private (Therapist only + Calendly feature)
 */
router.get('/event-types',
    auth,
    requireTherapistRole,
    requireCalendlyAccess(),
    async (req, res) => {
        try {
            const therapist = req.therapist;
            const calendlyData = therapist.website?.calendly || {};

            if (!calendlyData.isVerified || !calendlyData.username) {
                return res.status(400).json({
                    success: false,
                    error: 'Calendly לא מחובר או לא מאומת'
                });
            }

            res.json({
                success: true,
                data: {
                    eventTypes: calendlyData.eventTypes || [],
                    username: calendlyData.username,
                    schedulingLink: `https://calendly.com/${calendlyData.username}`
                }
            });
        } catch (error) {
            console.error('Error fetching Calendly event types:', error);
            res.status(500).json({
                success: false,
                error: 'שגיאה בקבלת סוגי אירועים',
                details: error.message
            });
        }
    }
);

/**
 * @route   PUT /api/therapist/calendly/settings
 * @desc    עדכון הגדרות כלליות של Calendly
 * @access  Private (Therapist only + Calendly feature)
 */
router.put('/settings',
    auth,
    requireTherapistRole,
    requireCalendlyAccess(),
    async (req, res) => {
        try {
            const therapist = req.therapist;
            const { isEnabled, embedCode } = req.body;

            if (!therapist.website.calendly) {
                therapist.website.calendly = {};
            }

            // עדכון הגדרות
            if (typeof isEnabled === 'boolean') {
                therapist.website.calendly.isEnabled = isEnabled;
            }

            if (embedCode !== undefined) {
                therapist.website.calendly.embedCode = embedCode;

                // אימות אוטומטי אם יש קוד הטמעה תקין
                if (embedCode && embedCode.includes('calendly.com')) {
                    therapist.website.calendly.isVerified = true;
                    therapist.website.calendly.lastSyncAt = new Date();
                }
            }

            await therapist.save();

            res.json({
                success: true,
                data: {
                    isEnabled: therapist.website.calendly.isEnabled,
                    embedCode: therapist.website.calendly.embedCode,
                    isVerified: therapist.website.calendly.isVerified,
                    setupStatus: therapist.website.calendly.setupStatus
                },
                message: 'הגדרות Calendly עודכנו בהצלחה'
            });
        } catch (error) {
            console.error('Error updating Calendly settings:', error);
            res.status(500).json({
                success: false,
                error: 'שגיאה בעדכון הגדרות Calendly',
                details: error.message
            });
        }
    }
);

module.exports = router;
