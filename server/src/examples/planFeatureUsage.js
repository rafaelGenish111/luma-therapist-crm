/**
 * דוגמאות שימוש במערכת תוכניות והרשאות
 * Examples for using the plan and feature system
 */

const express = require('express');
const {
    requirePlanOrFeature,
    requireCalendlyAccess,
    requireCustomDomainAccess,
    checkClientLimit
} = require('../middleware/planFeatures');
const { encrypt, decrypt, generateToken } = require('../utils/encryption');
const Therapist = require('../models/Therapist');

const router = express.Router();

// ========================================
// דוגמאות לשימוש במידלוואר ההרשאות
// ========================================

/**
 * דוגמה 1: הגנה על נתיב Calendly
 * רק משתמשים עם תוכנית Premium+ או עקיפה יכולים לגשת
 */
router.get('/calendly/settings',
    requireCalendlyAccess(),
    async (req, res) => {
        try {
            const therapist = req.therapist; // זמין אחרי המידלוואר

            res.json({
                success: true,
                calendlySettings: therapist.website.calendly,
                message: 'הגדרות Calendly נטענו בהצלחה'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * דוגמה 2: בדיקת מספר פיצ'רים
 * בדיקה שיש גישה גם ל-Calendly וגם לדומיין מותאם
 */
router.post('/premium-setup',
    requirePlanOrFeature(['calendly', 'custom_domain'], {
        customErrorMessage: 'הגדרה מתקדמת דורשת Calendly ודומיין מותאם אישית',
        includeUpgradeInfo: true
    }),
    async (req, res) => {
        try {
            const { calendlyUrl, customDomain } = req.body;
            const therapist = req.therapist;

            // עדכון הגדרות
            therapist.website.calendly.embedCode = calendlyUrl;
            therapist.website.customDomain = customDomain;
            await therapist.save();

            res.json({
                success: true,
                message: 'הגדרות מתקדמות נשמרו בהצלחה'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * דוגמה 3: בדיקת מגבלת לקוחות לפני הוספת לקוח חדש
 */
router.post('/clients',
    checkClientLimit(),
    async (req, res) => {
        try {
            const { clientData } = req.body;
            const therapist = req.therapist;

            // הוספת לקוח חדש
            // (כאן היית מוסיף את הלוגיקה ליצירת לקוח)

            // עדכון מונה הלקוחות
            therapist.stats.totalClients += 1;
            await therapist.save();

            res.json({
                success: true,
                message: 'לקוח נוסף בהצלחה',
                currentClients: therapist.stats.totalClients
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * דוגמה 4: שימוש מותנה בפיצ'ר (לא חובה)
 */
router.get('/analytics',
    requirePlanOrFeature('advanced_analytics', {
        allowFreeUsers: false,
        customErrorMessage: 'דוחות מתקדמים זמינים רק בתוכנית Premium+'
    }),
    async (req, res) => {
        try {
            const therapist = req.therapist;

            // יצירת דוח מתקדם
            const analyticsData = {
                totalRevenue: therapist.stats.totalRevenue,
                monthlyGrowth: '15%',
                topServices: ['טיפול זוגי', 'טיפול אישי'],
                clientRetention: '85%'
            };

            res.json({
                success: true,
                analytics: analyticsData
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ========================================
// דוגמאות להצפנת נתונים רגישים
// ========================================

/**
 * דוגמה 5: הצפנת טוקן Calendly
 */
router.post('/calendly/save-token',
    requireCalendlyAccess(),
    async (req, res) => {
        try {
            const { calendlyApiToken } = req.body;
            const therapist = req.therapist;

            // הצפנת הטוקן הרגיש
            const encryptedToken = encrypt(calendlyApiToken);

            // שמירה במסד הנתונים (לא בשדה ישיר אלא בשדה מוצפן)
            if (!therapist.encryptedData) {
                therapist.encryptedData = {};
            }
            therapist.encryptedData.calendlyToken = encryptedToken;

            await therapist.save();

            res.json({
                success: true,
                message: 'טוקן Calendly נשמר בהצפנה'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * דוגמה 6: שימוש בטוקן מוצפן
 */
router.get('/calendly/sync',
    requireCalendlyAccess(),
    async (req, res) => {
        try {
            const therapist = req.therapist;

            // פענוח הטוקן
            if (!therapist.encryptedData?.calendlyToken) {
                return res.status(400).json({
                    error: 'טוקן Calendly לא נמצא. אנא התחבר למערכת Calendly'
                });
            }

            const calendlyToken = decrypt(therapist.encryptedData.calendlyToken);

            // שימוש בטוקן לסנכרון (דמה)
            const syncResult = await mockCalendlySync(calendlyToken);

            // עדכון סטטוס הסנכרון
            therapist.website.calendly.lastSyncAt = new Date();
            therapist.website.calendly.setupStatus = 'completed';
            await therapist.save();

            res.json({
                success: true,
                message: 'סנכרון Calendly הושלם בהצלחה',
                syncedEvents: syncResult.eventCount
            });
        } catch (error) {
            res.status(500).json({
                error: 'שגיאה בסנכרון Calendly',
                details: error.message
            });
        }
    }
);

// ========================================
// דוגמאות לעבודה עם המודל המורחב
// ========================================

/**
 * דוגמה 7: בדיקת מצב התוכנית ועקיפות
 */
router.get('/my-plan',
    async (req, res) => {
        try {
            const therapist = await Therapist.findById(req.user.id);
            if (!therapist) {
                return res.status(404).json({ error: 'מטפל לא נמצא' });
            }

            const planInfo = {
                currentPlan: therapist.subscription.plan,
                isActive: therapist.subscription.isActive,
                limitations: therapist.getPlanLimitations(),
                features: {
                    calendly: therapist.hasCalendlyAccess(),
                    customDomain: therapist.hasFeature('custom_domain'),
                    advancedAnalytics: therapist.hasFeature('advanced_analytics')
                },
                overrides: therapist.featureOverrides
            };

            res.json({
                success: true,
                plan: planInfo
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * דוגמה 8: עדכון הגדרות Calendly
 */
router.put('/calendly/config',
    requireCalendlyAccess(),
    async (req, res) => {
        try {
            const {
                setupStatus,
                embedConfig,
                username
            } = req.body;

            const therapist = req.therapist;

            // עדכון הגדרות
            if (setupStatus) {
                therapist.website.calendly.setupStatus = setupStatus;
            }

            if (embedConfig) {
                therapist.website.calendly.embedConfig = {
                    ...therapist.website.calendly.embedConfig,
                    ...embedConfig
                };
            }

            if (username) {
                therapist.website.calendly.username = username;
            }

            await therapist.save();

            res.json({
                success: true,
                message: 'הגדרות Calendly עודכנו בהצלחה',
                calendlyConfig: therapist.website.calendly
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ========================================
// פונקציות עזר לדוגמאות
// ========================================

/**
 * סימולציה של סנכרון Calendly
 */
async function mockCalendlySync(token) {
    // כאן היית משתמש בטוקן לגישה ל-API של Calendly
    console.log('Syncing with Calendly using token:', token.substring(0, 10) + '...');

    // סימולציה של תוצאת סנכרון
    return {
        eventCount: 5,
        lastSync: new Date(),
        status: 'success'
    };
}

/**
 * דוגמה ליצירת טוקן מוצפן חדש
 */
router.post('/generate-secure-token',
    async (req, res) => {
        try {
            // יצירת טוקן אקראי
            const randomToken = generateToken(32);

            // הצפנת הטוקן
            const encryptedToken = encrypt(randomToken);

            res.json({
                success: true,
                token: randomToken, // בפרודקשן לא היית מחזיר את הטוקן הגולמי
                encryptedToken: encryptedToken,
                message: 'טוקן בטוח נוצר והוצפן'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

module.exports = router;

/**
 * הוראות שימוש:
 * 
 * 1. הוסף את המשתנה ENCRYPTION_KEY לקובץ .env:
 *    ENCRYPTION_KEY=your-64-character-hex-key
 * 
 * 2. יצור מפתח הצפנה:
 *    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * 
 * 3. הוסף את הראוטר לאפליקציה:
 *    app.use('/api/examples', require('./examples/planFeatureUsage'));
 * 
 * 4. דוגמאות בדיקה:
 *    GET /api/examples/my-plan - בדיקת מצב התוכנית
 *    POST /api/examples/calendly/save-token - שמירת טוקן מוצפן
 *    GET /api/examples/calendly/sync - סנכרון עם הצפנה
 * 
 * 5. טיפול בשגיאות 402/403:
 *    - 402: המשתמש צריך לשדרג את התוכנית
 *    - 403: אין גישה גם עם שדרוג
 */
