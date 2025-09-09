const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const scheduledTasks = require('../services/scheduledTasks');
const { deleteExpiredAppointments, permanentlyDeleteOldAppointments, restoreAppointment } = require('../utils/appointmentCleanup');
const Therapist = require('../models/Therapist');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Client = require('../models/Client');
const HealthDeclarationTemplate = require('../models/HealthDeclarationTemplate');
const { calendlyService } = require('../services/calendlyService');
const { calendlyWebhooksService } = require('../services/calendlyWebhooks');
const SiteSettings = require('../models/SiteSettings');

// @route   POST /api/admin/cleanup/appointments
// @desc    ניקוי ידני של פגישות
// @access  Private (Admin only)
router.post('/cleanup/appointments', auth, authorize(['admin']), async (req, res) => {
    try {
        const { type = 'soft', hours = 2, days = 30 } = req.body;

        let result;

        if (type === 'soft') {
            result = await deleteExpiredAppointments(hours);
        } else if (type === 'permanent') {
            result = await permanentlyDeleteOldAppointments(days);
        } else if (type === 'full') {
            result = await scheduledTasks.runCleanupNow();
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid cleanup type. Use: soft, permanent, or full'
            });
        }

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error in manual cleanup:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בניקוי פגישות',
            error: error.message
        });
    }
});

// @route   POST /api/admin/appointments/:id/restore
// @desc    שחזור פגישה מחוקה
// @access  Private (Admin only)
router.post('/appointments/:id/restore', auth, authorize(['admin']), async (req, res) => {
    try {
        const result = await restoreAppointment(req.params.id);

        if (result.success) {
            res.json({
                success: true,
                data: result.appointment,
                message: 'פגישה שוחזרה בהצלחה'
            });
        } else {
            res.status(404).json({
                success: false,
                message: result.message
            });
        }

    } catch (error) {
        console.error('Error restoring appointment:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בשחזור פגישה',
            error: error.message
        });
    }
});

// --- System status ---
// @route   GET /api/admin/system/status
// @desc    סטטוס מערכת בסיסי (DB, תורים, משתני סביבה עיקריים)
// @access  Private (Admin only)
router.get('/system/status', auth, authorize(['admin']), async (req, res) => {
    try {
        const mongoState = require('mongoose').connection.readyState; // 0=disconnected,1=connected
        const scheduled = scheduledTasks.getStatus();
        // basic counts
        const [therapistsCount, clientsCount, plansCount] = await Promise.all([
            Therapist.countDocuments({}),
            Client.countDocuments({}),
            Plan.countDocuments({})
        ]);
        res.json({
            success: true,
            data: {
                serverTime: new Date().toISOString(),
                env: process.env.NODE_ENV || 'development',
                db: mongoState === 1 ? 'connected' : 'disconnected',
                scheduledTasks: scheduled,
                stats: {
                    therapists: therapistsCount,
                    clients: clientsCount,
                    plans: plansCount
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'שגיאה בקבלת סטטוס' });
    }
});

// --- Therapists management ---
// @route   GET /api/admin/therapists
// @desc    רשימת מטפלות (לניהול לקוחות)
// @access  Private (Admin only)
router.get('/therapists', auth, authorize(['admin']), async (req, res) => {
    try {
        const { q = '', plan, limit = 20, page = 1, pendingOnly, approvedOnly } = req.query;
        const criteria = {};
        if (q) criteria.$or = [
            { email: new RegExp(q, 'i') },
            { firstName: new RegExp(q, 'i') },
            { lastName: new RegExp(q, 'i') }
        ];
        if (plan) criteria['subscription.plan'] = plan;
        if (pendingOnly === '1') criteria.isApproved = false;
        if (approvedOnly === '1') criteria.isApproved = true;
        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Therapist.find(criteria)
                .select('firstName lastName email phone subscription featureOverrides website.calendly setupStatus isApproved createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Therapist.countDocuments(criteria)
        ]);
        res.json({ success: true, data: { items, total, page: Number(page), limit: Number(limit) } });
    } catch (error) {
        console.error('therapists list error', error);
        res.status(500).json({ success: false, error: 'שגיאה בטעינת מטפלות' });
    }
});

// @route   PATCH /api/admin/therapists/:id
// @desc    עדכון פרטי מטפלת: אישור, תוכנית, הפעלת פיצ'רים
// @access  Private (Admin only)
router.patch('/therapists/:id', auth, authorize(['admin']), async (req, res) => {
    try {
        const { isApproved, plan, calendlyOverride } = req.body;
        const therapist = await Therapist.findById(req.params.id);
        if (!therapist) return res.status(404).json({ success: false, error: 'מטפלת לא נמצאה' });
        if (typeof isApproved === 'boolean') therapist.isApproved = isApproved;
        if (plan) therapist.subscription = { ...therapist.subscription, plan };
        if (typeof calendlyOverride === 'boolean') {
            therapist.featureOverrides = therapist.featureOverrides || {};
            therapist.featureOverrides.calendly = calendlyOverride;
        }
        await therapist.save();
        res.json({ success: true, data: therapist, message: 'המטפלת עודכנה' });
    } catch (error) {
        console.error('update therapist error', error);
        res.status(500).json({ success: false, error: 'שגיאה בעדכון מטפלת' });
    }
});

// --- Plans management ---
// GET /api/admin/plans
router.get('/plans', auth, authorize(['admin']), async (req, res) => {
    try {
        const items = await Plan.find().sort({ createdAt: -1 });
        res.json({ success: true, data: items });
    } catch (e) {
        res.status(500).json({ success: false, error: 'שגיאה בטעינת תוכניות' });
    }
});

// POST /api/admin/plans
router.post('/plans', auth, authorize(['admin']), async (req, res) => {
    try {
        // ensure base plans exist once
        if (req.body && req.body._seedDefaults) {
            const defaults = [
                { key: 'free', name: 'חינם', price: 0, discountPercent: 0, features: [] },
                { key: 'premium', name: 'פרימיום', price: 79, discountPercent: 0, features: [] },
                { key: 'extended', name: 'מורחב', price: 129, discountPercent: 0, features: [] },
            ];
            for (const p of defaults) {
                await Plan.updateOne({ key: p.key }, { $setOnInsert: p }, { upsert: true });
            }
            const items = await Plan.find().sort({ createdAt: -1 });
            return res.status(201).json({ success: true, data: items });
        }

        const plan = await Plan.create(req.body);
        res.status(201).json({ success: true, data: plan });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// PATCH /api/admin/plans/:id
router.patch('/plans/:id', auth, authorize(['admin']), async (req, res) => {
    try {
        const plan = await Plan.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!plan) return res.status(404).json({ success: false, error: 'תוכנית לא נמצאה' });
        res.json({ success: true, data: plan });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// DELETE /api/admin/plans/:id
router.delete('/plans/:id', auth, authorize(['admin']), async (req, res) => {
    try {
        const plan = await Plan.findByIdAndDelete(req.params.id);
        if (!plan) return res.status(404).json({ success: false, error: 'תוכנית לא נמצאה' });
        res.json({ success: true, data: true });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// --- Health Declaration Templates management ---
// GET /api/admin/health-declaration-templates
router.get('/health-declaration-templates', auth, authorize(['admin']), async (req, res) => {
    const items = await HealthDeclarationTemplate.find().sort({ createdAt: -1 });
    res.json({ success: true, data: items });
});

// POST /api/admin/health-declaration-templates
router.post('/health-declaration-templates', auth, authorize(['admin']), async (req, res) => {
    const doc = await HealthDeclarationTemplate.create(req.body);
    res.status(201).json({ success: true, data: doc });
});

// PATCH /api/admin/health-declaration-templates/:id
router.patch('/health-declaration-templates/:id', auth, authorize(['admin']), async (req, res) => {
    const doc = await HealthDeclarationTemplate.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'תבנית לא נמצאה' });
    res.json({ success: true, data: doc });
});

// DELETE /api/admin/health-declaration-templates/:id
router.delete('/health-declaration-templates/:id', auth, authorize(['admin']), async (req, res) => {
    await HealthDeclarationTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: true });
});

// @route   GET /api/admin/scheduled-tasks/status
// @desc    קבלת סטטוס של עבודות מתוזמנות
// @access  Private (Admin only)
router.get('/scheduled-tasks/status', auth, authorize(['admin']), (req, res) => {
    try {
        const status = scheduledTasks.getStatus();
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Error getting scheduled tasks status:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בקבלת סטטוס',
            error: error.message
        });
    }
});

// @route   POST /api/superadmin/therapists/:id/calendly/enable
// @desc    הפעלת פיצ'ר Calendly למטפל
// @access  Private (Super Admin only)
router.post('/superadmin/therapists/:id/calendly/enable', auth, authorize(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { forceReset = false } = req.body;

        // מציאת המטפל
        const therapist = await Therapist.findById(id);
        if (!therapist) {
            return res.status(404).json({
                success: false,
                error: 'מטפל לא נמצא'
            });
        }

        // הפעלת הפיצ'ר - עקיפה ברמת התוכנית
        if (!therapist.featureOverrides) {
            therapist.featureOverrides = {};
        }
        therapist.featureOverrides.calendly = true;

        // אתחול או איפוס הגדרות Calendly
        if (!therapist.website) {
            therapist.website = {};
        }

        if (!therapist.website.calendly || forceReset) {
            therapist.website.calendly = {
                isEnabled: false,
                setupStatus: 'not_started',
                username: null,
                embedCode: null,
                embedConfig: {
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
                eventTypes: [],
                settings: {
                    hideEventTypesDetails: false,
                    hideGdprBanner: true,
                    primaryColor: '#4A90E2',
                    textColor: '#333333',
                    backgroundColor: '#FFFFFF'
                },
                lastSyncAt: null,
                isVerified: false
            };
        }

        // בדיקה אם יש OAuth קיים - אם אין, הגדר כ-UNCONFIGURED
        const hasOAuth = therapist.website.calendly.username && therapist.website.calendly.isVerified;
        if (!hasOAuth) {
            therapist.website.calendly.setupStatus = 'unconfigured';
        }

        // יצירה/חידוש מנויים באמצעות השירות החדש
        const webhookResult = await calendlyWebhooksService.ensureSubscriptionsForTherapist(id);
        console.log(`Webhook setup result for therapist ${id}:`, webhookResult);

        await therapist.save();

        // יצירת לוג לפעילות מנהל
        console.log(`Super Admin ${req.user.id} enabled Calendly for therapist ${id}`, {
            forceReset,
            hadPreviousSetup: !!therapist.website.calendly,
            currentSetupStatus: therapist.website.calendly.setupStatus
        });

        res.json({
            success: true,
            data: {
                therapistId: id,
                calendlyEnabled: true,
                setupStatus: therapist.website.calendly.setupStatus,
                hasOAuth: hasOAuth,
                featureOverride: therapist.featureOverrides.calendly,
                calendlyConfig: therapist.website.calendly
            },
            message: "פיצ'ר Calendly הופעל בהצלחה למטפל"
        });

    } catch (error) {
        console.error('Error enabling Calendly for therapist:', error);
        res.status(500).json({
            success: false,
            error: "שגיאה בהפעלת פיצ'ר Calendly",
            details: error.message
        });
    }
});

// @route   POST /api/superadmin/therapists/:id/calendly/disable
// @desc    ביטול הפעלת פיצ'ר Calendly למטפל
// @access  Private (Super Admin only)
router.post('/superadmin/therapists/:id/calendly/disable', auth, authorize(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { keepConfig = false } = req.body;

        const therapist = await Therapist.findById(id);
        if (!therapist) {
            return res.status(404).json({
                success: false,
                error: 'מטפל לא נמצא'
            });
        }

        // ביטול עקיפת הפיצ'ר
        if (therapist.featureOverrides) {
            therapist.featureOverrides.calendly = false;
        }

        // ביטול הפעלת Calendly
        if (therapist.website && therapist.website.calendly) {
            therapist.website.calendly.isEnabled = false;
            therapist.website.calendly.setupStatus = 'not_started';

            // מחיקת נתוני חיבור אם לא מבקשים לשמור
            if (!keepConfig) {
                therapist.website.calendly.username = null;
                therapist.website.calendly.embedCode = null;
                therapist.website.calendly.isVerified = false;
                therapist.website.calendly.lastSyncAt = null;
                therapist.website.calendly.eventTypes = [];
            }
        }

        await therapist.save();

        console.log(`Super Admin ${req.user.id} disabled Calendly for therapist ${id}`, {
            keepConfig
        });

        res.json({
            success: true,
            data: {
                therapistId: id,
                calendlyEnabled: false,
                configKept: keepConfig,
                featureOverride: therapist.featureOverrides?.calendly || false
            },
            message: "פיצ'ר Calendly בוטל בהצלחה למטפל"
        });

    } catch (error) {
        console.error('Error disabling Calendly for therapist:', error);
        res.status(500).json({
            success: false,
            error: "שגיאה בביטול פיצ'ר Calendly",
            details: error.message
        });
    }
});

// @route   GET /api/superadmin/therapists/:id/calendly/status
// @desc    קבלת מצב Calendly של מטפל (לשימוש מנהל)
// @access  Private (Super Admin only)
router.get('/superadmin/therapists/:id/calendly/status', auth, authorize(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const therapist = await Therapist.findById(id).select('website.calendly featureOverrides subscription');
        if (!therapist) {
            return res.status(404).json({
                success: false,
                error: 'מטפל לא נמצא'
            });
        }

        const calendlyData = therapist.website?.calendly || {};
        const hasFeatureAccess = therapist.hasCalendlyAccess();

        res.json({
            success: true,
            data: {
                therapistId: id,
                hasFeatureAccess,
                featureOverride: therapist.featureOverrides?.calendly || false,
                currentPlan: therapist.subscription.plan,
                calendly: {
                    ...calendlyData,
                    // הסתרת נתונים רגישים
                    embedCode: calendlyData.embedCode ? '[CONFIGURED]' : null
                }
            }
        });

    } catch (error) {
        console.error('Error getting therapist Calendly status:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בקבלת מצב Calendly',
            details: error.message
        });
    }
});

// @route   POST /api/superadmin/therapists/:id/calendly/connect-url
// @desc    יצירת URL לחיבור Calendly (לשליחה במייל)
// @access  Private (Super Admin only)
router.post('/superadmin/therapists/:id/calendly/connect-url', auth, authorize(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { adminEmail, returnUrl, sendEmail = false } = req.body;

        const therapist = await Therapist.findById(id);
        if (!therapist) {
            return res.status(404).json({
                success: false,
                error: 'מטפל לא נמצא'
            });
        }

        // יצירת URL עבור המטפל באמצעות השירות
        const connectResult = await calendlyService.getConnectUrlForTherapist(id, {
            returnUrl: returnUrl || '/dashboard/calendly',
            adminInitiated: true,
            adminEmail: adminEmail || req.user.email,
            scope: 'default'
        });

        if (!connectResult.success) {
            return res.status(400).json({
                success: false,
                error: connectResult.error
            });
        }

        // אופציה לשליחת מייל (להוסיף בעתיד)
        if (sendEmail) {
            // TODO: שליחת מייל עם הקישור למטפל
            console.log(`Should send email to therapist ${therapist.email} with connect URL`);
        }

        res.json({
            success: true,
            data: {
                therapistId: id,
                therapistName: `${therapist.firstName} ${therapist.lastName}`,
                therapistEmail: therapist.email,
                connectUrl: connectResult.data.connectUrl,
                expiresAt: connectResult.data.expiresAt,
                state: connectResult.data.state,
                adminInitiated: true,
                adminEmail: adminEmail || req.user.email
            },
            message: 'קישור חיבור ל-Calendly נוצר בהצלחה'
        });

    } catch (error) {
        console.error('Error creating admin connect URL:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה ביצירת קישור חיבור',
            details: error.message
        });
    }
});

// @route   GET /api/superadmin/calendly/connected-therapists
// @desc    רשימת כל המטפלים המחוברים ל-Calendly
// @access  Private (Super Admin only)
router.get('/superadmin/calendly/connected-therapists', auth, authorize(['admin']), async (req, res) => {
    try {
        const result = await calendlyService.getConnectedTherapists();

        res.json({
            success: true,
            data: result.data,
            message: `נמצאו ${result.data.count} מטפלים מחוברים ל-Calendly`
        });

    } catch (error) {
        console.error('Error getting connected therapists:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בקבלת רשימת מטפלים',
            details: error.message
        });
    }
});

// @route   POST /api/superadmin/therapists/:id/calendly/webhooks/resync
// @desc    סנכרון מחדש של webhook subscriptions
// @access  Private (Super Admin only)
router.post('/superadmin/therapists/:id/calendly/webhooks/resync', auth, authorize(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const therapist = await Therapist.findById(id);
        if (!therapist) {
            return res.status(404).json({
                success: false,
                error: 'מטפל לא נמצא'
            });
        }

        const resyncResult = await calendlyWebhooksService.resyncSubscriptionsForTherapist(id);

        res.json({
            success: true,
            data: {
                therapistId: id,
                removed: resyncResult.removed,
                created: resyncResult.created,
                result: resyncResult
            },
            message: resyncResult.message || 'סנכרון webhooks הושלם'
        });

    } catch (error) {
        console.error('Error resyncing webhooks:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בסנכרון webhooks',
            details: error.message
        });
    }
});

module.exports = router;

// ---- Site Settings (Super Admin) ----
// GET /api/admin/site-settings
router.get('/site-settings', auth, authorize(['admin']), async (req, res) => {
    try {
        const settings = await SiteSettings.getSingleton();
        res.json({ success: true, data: settings });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Failed to load site settings' });
    }
});

// PUT /api/admin/site-settings
router.put('/site-settings', auth, authorize(['admin']), async (req, res) => {
    try {
        const settings = await SiteSettings.getSingleton();
        const { contact } = req.body || {};
        if (contact && typeof contact === 'object') {
            settings.contact = { ...settings.contact, ...contact };
        }
        settings.updatedBy = req.user.id;
        await settings.save();
        res.json({ success: true, data: settings });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Failed to update site settings' });
    }
});