const Therapist = require('../models/Therapist');

/**
 * Middleware לבדיקת הרשאות לפיצ'רים לפי תוכנית או עקיפות
 * @param {string|string[]} featureKey - שם הפיצ'ר או מערך של פיצ'רים
 * @param {object} options - אפשרויות נוספות
 * @returns {Function} middleware function
 */
const requirePlanOrFeature = (featureKey, options = {}) => {
    const {
        allowFreeUsers = false,
        customErrorMessage = null,
        redirectUrl = null,
        includeUpgradeInfo = true
    } = options;

    return async (req, res, next) => {
        try {
            // בדיקה שהמשתמש מחובר
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    error: 'משתמש לא מחובר',
                    code: 'UNAUTHORIZED'
                });
            }

            // טעינת נתוני המטפל
            const therapist = await Therapist.findById(req.user.id);
            if (!therapist) {
                return res.status(404).json({
                    error: 'מטפל לא נמצא',
                    code: 'THERAPIST_NOT_FOUND'
                });
            }

            // בדיקה אם המשתמש פעיל
            if (!therapist.isActive) {
                return res.status(403).json({
                    error: 'חשבון לא פעיל',
                    code: 'ACCOUNT_INACTIVE'
                });
            }

            // מערך של פיצ'רים לבדיקה
            const features = Array.isArray(featureKey) ? featureKey : [featureKey];

            // בדיקה אם יש גישה לכל הפיצ'רים
            const hasAccess = features.every(feature => {
                // אם מותר למשתמשי free
                if (allowFreeUsers && therapist.subscription.plan === 'free') {
                    return true;
                }

                return therapist.hasFeature(feature);
            });

            if (hasAccess) {
                // הוספת מידע על הפיצ'רים ל-request
                req.therapist = therapist;
                req.userFeatures = therapist.getPlanLimitations();
                return next();
            }

            // אם אין גישה - החזרת שגיאה עם מידע על שדרוג
            const currentPlan = therapist.subscription.plan;
            const missingFeatures = features.filter(feature => !therapist.hasFeature(feature));

            const errorResponse = {
                error: customErrorMessage || `הפיצ'ר ${missingFeatures.join(', ')} אינו זמין בתוכנית הנוכחית`,
                code: 'FEATURE_NOT_AVAILABLE',
                currentPlan,
                missingFeatures,
                requiredFeatures: features
            };

            if (includeUpgradeInfo) {
                errorResponse.upgradeInfo = {
                    availablePlans: getAvailableUpgrades(currentPlan, features),
                    benefits: getPlanBenefits(features),
                    contactSupport: {
                        email: 'support@wellness-platform.com',
                        phone: '+972-50-123-4567',
                        message: 'לפרטים נוספים על שדרוג התוכנית'
                    }
                };
            }

            if (redirectUrl) {
                errorResponse.redirectUrl = redirectUrl;
            }

            // החזרת קוד שגיאה מתאים
            const statusCode = currentPlan === 'free' ? 402 : 403; // 402 Payment Required או 403 Forbidden

            return res.status(statusCode).json(errorResponse);

        } catch (error) {
            console.error('Error in requirePlanOrFeature middleware:', error);
            return res.status(500).json({
                error: 'שגיאה פנימית בשרת',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    };
};

/**
 * מחזיר רשימת תוכניות זמינות לשדרוג
 * @param {string} currentPlan - התוכנית הנוכחית
 * @param {string[]} requiredFeatures - הפיצ'רים הנדרשים
 * @returns {object[]} - רשימת תוכניות לשדרוג
 */
function getAvailableUpgrades(currentPlan, requiredFeatures) {
    const plans = {
        free: {
            name: 'חינם',
            price: 0,
            features: []
        },
        basic: {
            name: 'בסיסית',
            price: 99,
            features: ['website_builder'],
            maxClients: 25,
            maxAppointments: 100
        },
        premium: {
            name: 'פרימיום',
            price: 199,
            features: ['website_builder', 'calendly', 'custom_domain', 'advanced_analytics'],
            maxClients: -1,
            maxAppointments: -1
        },
        extended: {
            name: 'מורחבת',
            price: 299,
            features: ['website_builder', 'calendly', 'custom_domain', 'advanced_analytics', 'priority_support'],
            maxClients: -1,
            maxAppointments: -1
        },
        enterprise: {
            name: 'ארגונית',
            price: 499,
            features: ['website_builder', 'calendly', 'custom_domain', 'advanced_analytics', 'priority_support', 'email_marketing'],
            maxClients: -1,
            maxAppointments: -1
        }
    };

    const planOrder = ['free', 'basic', 'premium', 'extended', 'enterprise'];
    const currentIndex = planOrder.indexOf(currentPlan);

    return planOrder
        .slice(currentIndex + 1)
        .map(planKey => {
            const plan = plans[planKey];
            const hasRequiredFeatures = requiredFeatures.every(feature =>
                plan.features.includes(feature)
            );

            return {
                key: planKey,
                name: plan.name,
                price: plan.price,
                currency: 'ILS',
                period: 'month',
                features: plan.features,
                maxClients: plan.maxClients,
                maxAppointments: plan.maxAppointments,
                hasRequiredFeatures,
                recommended: hasRequiredFeatures
            };
        })
        .filter(plan => plan.hasRequiredFeatures);
}

/**
 * מחזיר תיאור יתרונות הפיצ'רים
 * @param {string[]} features - רשימת הפיצ'רים
 * @returns {object} - תיאור היתרונות
 */
function getPlanBenefits(features) {
    const benefits = {
        calendly: {
            title: 'אינטגרציה עם Calendly',
            description: 'קביעת פגישות אוטומטית ללקוחות',
            icon: 'calendar'
        },
        custom_domain: {
            title: 'דומיין מותאם אישית',
            description: 'אתר מקצועי עם הכתובת שלך',
            icon: 'globe'
        },
        advanced_analytics: {
            title: 'אנליטיקה מתקדמת',
            description: 'דוחות מפורטים וניתוח ביצועים',
            icon: 'chart'
        },
        website_builder: {
            title: 'בונה אתרים',
            description: 'יצירת אתר מקצועי ללא ידע טכני',
            icon: 'website'
        },
        priority_support: {
            title: 'תמיכה מועדפת',
            description: 'תמיכה מהירה ומועדפת 24/7',
            icon: 'support'
        },
        email_marketing: {
            title: 'שיווק באימייל',
            description: 'יצירת ושליחת קמפיינים ללקוחות',
            icon: 'email'
        }
    };

    return features
        .filter(feature => benefits[feature])
        .map(feature => benefits[feature]);
}

/**
 * Middleware מתמחה לבדיקת גישה ל-Calendly
 */
const requireCalendlyAccess = () => {
    return requirePlanOrFeature('calendly', {
        customErrorMessage: 'אינטגרציה עם Calendly זמינה רק בתוכניות Premium ומעלה',
        includeUpgradeInfo: true
    });
};

/**
 * Middleware לבדיקת גישה לדומיין מותאם אישית
 */
const requireCustomDomainAccess = () => {
    return requirePlanOrFeature('custom_domain', {
        customErrorMessage: 'דומיין מותאם אישית זמין רק בתוכניות Premium ומעלה',
        includeUpgradeInfo: true
    });
};

/**
 * Middleware לבדיקת גישה לאנליטיקה מתקדמת
 */
const requireAdvancedAnalytics = () => {
    return requirePlanOrFeature('advanced_analytics', {
        customErrorMessage: 'אנליטיקה מתקדמת זמינה רק בתוכניות Premium ומעלה',
        includeUpgradeInfo: true
    });
};

/**
 * Middleware לבדיקת מספר לקוחות מקסימלי
 */
const checkClientLimit = () => {
    return async (req, res, next) => {
        try {
            const therapist = await Therapist.findById(req.user.id);
            if (!therapist) {
                return res.status(404).json({
                    error: 'מטפל לא נמצא',
                    code: 'THERAPIST_NOT_FOUND'
                });
            }

            const limitations = therapist.getPlanLimitations();

            // אם אין הגבלה על מספר לקוחות
            if (limitations.maxClients === -1) {
                req.therapist = therapist;
                return next();
            }

            // בדיקת מספר הלקוחות הנוכחי
            const currentClientCount = therapist.stats.totalClients || 0;

            if (currentClientCount >= limitations.maxClients) {
                return res.status(402).json({
                    error: `הגעת למגבלת הלקוחות של התוכנית (${limitations.maxClients} לקוחות)`,
                    code: 'CLIENT_LIMIT_REACHED',
                    currentCount: currentClientCount,
                    maxAllowed: limitations.maxClients,
                    upgradeInfo: getAvailableUpgrades(therapist.subscription.plan, ['unlimited_clients'])
                });
            }

            req.therapist = therapist;
            next();
        } catch (error) {
            console.error('Error in checkClientLimit middleware:', error);
            return res.status(500).json({
                error: 'שגיאה פנימית בשרת',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    };
};

module.exports = {
    requirePlanOrFeature,
    requireCalendlyAccess,
    requireCustomDomainAccess,
    requireAdvancedAnalytics,
    checkClientLimit,
    getAvailableUpgrades,
    getPlanBenefits
};
