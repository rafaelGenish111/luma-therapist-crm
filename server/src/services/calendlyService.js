const crypto = require('crypto');
const axios = require('axios');
const Therapist = require('../models/Therapist');
const { encrypt, decrypt } = require('../utils/encryption');
const { calendlyWebhooksService } = require('./calendlyWebhooks');

/**
 * שירות מרכזי לניהול אינטגרציה עם Calendly
 * כולל יצירת URLs, ניהול OAuth, ומעקב אחר סטטוס חיבורים
 */

class CalendlyService {
    constructor() {
        this.authBaseUrl = 'https://auth.calendly.com';
        this.apiBaseUrl = 'https://api.calendly.com';
        this.clientId = process.env.CALENDLY_CLIENT_ID;
        this.clientSecret = process.env.CALENDLY_CLIENT_SECRET;
        this.redirectUri = process.env.CALENDLY_REDIRECT_URI;

        if (!this.clientId || !this.redirectUri) {
            console.warn('Calendly OAuth not configured - missing CLIENT_ID or REDIRECT_URI');
        }
    }

    /**
     * יצירת URL לחיבור OAuth עבור מטפל
     * @param {string} therapistId - מזהה המטפל
     * @param {object} options - אפשרויות נוספות
     * @returns {Promise<object>} אובייקט עם URL ומידע נוסף
     */
    async getConnectUrlForTherapist(therapistId, options = {}) {
        try {
            const {
                returnUrl = '/dashboard/calendly',
                adminInitiated = false,
                adminEmail = null,
                scope = 'default',
                customState = {}
            } = options;

            // וידוא שהמטפל קיים
            const therapist = await Therapist.findById(therapistId);
            if (!therapist) {
                throw new Error('מטפל לא נמצא');
            }

            // בדיקה שהמטפל רשאי לגשת ל-Calendly
            if (!therapist.hasCalendlyAccess()) {
                throw new Error('אין למטפל הרשאה לגשת ל-Calendly');
            }

            // וידוא הגדרות OAuth
            if (!this.clientId || !this.redirectUri) {
                throw new Error('הגדרות Calendly OAuth חסרות');
            }

            // יצירת state מוצפן
            const stateData = {
                therapistId,
                returnUrl,
                adminInitiated,
                adminEmail,
                timestamp: Date.now(),
                nonce: crypto.randomBytes(16).toString('hex'),
                ...customState
            };

            const encryptedState = encrypt(JSON.stringify(stateData));

            // עדכון סטטוס המטפל
            if (!therapist.website.calendly) {
                therapist.website.calendly = {};
            }

            therapist.website.calendly.setupStatus = 'in_progress';
            therapist.website.calendly.lastConnectionAttempt = new Date();

            if (adminInitiated) {
                therapist.website.calendly.adminInitiatedConnection = {
                    adminEmail,
                    timestamp: new Date()
                };
            }

            await therapist.save();

            // בניית URL ל-OAuth
            const authUrl = new URL(`${this.authBaseUrl}/oauth/authorize`);
            authUrl.searchParams.append('client_id', this.clientId);
            authUrl.searchParams.append('response_type', 'code');
            authUrl.searchParams.append('redirect_uri', this.redirectUri);
            authUrl.searchParams.append('scope', scope);
            authUrl.searchParams.append('state', encryptedState);

            console.log(`Generated Calendly connect URL for therapist ${therapistId}`, {
                adminInitiated,
                returnUrl,
                scope
            });

            return {
                success: true,
                data: {
                    connectUrl: authUrl.toString(),
                    state: encryptedState,
                    therapistId,
                    setupStatus: 'in_progress',
                    expiresAt: new Date(Date.now() + 3600000), // שעה
                    metadata: {
                        adminInitiated,
                        returnUrl,
                        scope,
                        therapistName: `${therapist.firstName} ${therapist.lastName}`,
                        therapistEmail: therapist.email
                    }
                }
            };

        } catch (error) {
            console.error(`Error generating connect URL for therapist ${therapistId}:`, error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * טיפול בקוד חזרה מ-OAuth של Calendly
     * @param {string} code - קוד ההרשאה מ-Calendly
     * @param {string} encryptedState - state מוצפן
     * @returns {Promise<object>} תוצאת החיבור
     */
    async handleOAuthCallback(code, encryptedState) {
        try {
            // פענוח ה-state
            const stateJson = decrypt(encryptedState);
            const stateData = JSON.parse(stateJson);

            const { therapistId, returnUrl, adminInitiated, timestamp } = stateData;

            // בדיקת תקפות (שעה)
            if (Date.now() - timestamp > 3600000) {
                throw new Error('קישור החיבור פג תוקף');
            }

            // החלפת קוד בטוקן
            const tokenResponse = await axios.post(`${this.authBaseUrl}/oauth/token`, {
                grant_type: 'authorization_code',
                code,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: this.redirectUri
            });

            const { access_token, refresh_token, scope } = tokenResponse.data;

            // קבלת פרטי המשתמש מ-Calendly
            const userResponse = await axios.get(`${this.apiBaseUrl}/users/me`, {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            const calendlyUser = userResponse.data.resource;

            // עדכון נתוני המטפל
            const therapist = await Therapist.findById(therapistId);
            if (!therapist) {
                throw new Error('מטפל לא נמצא');
            }

            // שמירת טוקנים מוצפנים
            if (!therapist.encryptedData) {
                therapist.encryptedData = {};
            }

            therapist.encryptedData.calendlyAccessToken = encrypt(access_token);
            if (refresh_token) {
                therapist.encryptedData.calendlyRefreshToken = encrypt(refresh_token);
            }

            // עדכון פרטי Calendly
            therapist.website.calendly = {
                ...therapist.website.calendly,
                isEnabled: true,
                isVerified: true,
                setupStatus: 'completed',
                username: calendlyUser.slug,
                userUri: calendlyUser.uri,
                scope: scope,
                lastSyncAt: new Date(),
                connectedAt: new Date(),
                calendlyProfile: {
                    name: calendlyUser.name,
                    email: calendlyUser.email,
                    timezone: calendlyUser.timezone,
                    avatar_url: calendlyUser.avatar_url
                }
            };

            await therapist.save();

            // יצירת webhook subscriptions
            const webhookResult = await calendlyWebhooksService.ensureSubscriptionsForTherapist(therapistId);
            console.log(`Webhook setup result for therapist ${therapistId}:`, webhookResult);

            console.log(`Successfully connected Calendly for therapist ${therapistId}`, {
                username: calendlyUser.slug,
                adminInitiated,
                webhooksCreated: webhookResult.newSubscriptions
            });

            return {
                success: true,
                data: {
                    therapistId,
                    returnUrl,
                    setupStatus: 'completed',
                    username: calendlyUser.slug,
                    schedulingUrl: `https://calendly.com/${calendlyUser.slug}`,
                    connectedAt: new Date(),
                    adminInitiated,
                    webhooks: webhookResult
                }
            };

        } catch (error) {
            console.error('Error handling OAuth callback:', error);

            // ניסיון לעדכן סטטוס שגיאה אם אפשר
            try {
                const stateJson = decrypt(encryptedState);
                const stateData = JSON.parse(stateJson);
                const therapist = await Therapist.findById(stateData.therapistId);

                if (therapist) {
                    therapist.website.calendly.setupStatus = 'error';
                    therapist.website.calendly.lastError = {
                        message: error.message,
                        timestamp: new Date()
                    };
                    await therapist.save();
                }
            } catch (stateError) {
                console.error('Error updating therapist error status:', stateError);
            }

            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * ניתוק חיבור Calendly עבור מטפל
     * @param {string} therapistId - מזהה המטפל
     * @param {object} options - אפשרויות נוספות
     * @returns {Promise<object>} תוצאת הניתוק
     */
    async disconnectTherapist(therapistId, options = {}) {
        try {
            const { keepConfig = false, adminInitiated = false } = options;

            const therapist = await Therapist.findById(therapistId);
            if (!therapist) {
                throw new Error('מטפל לא נמצא');
            }

            // הסרת webhook subscriptions
            const webhookResult = await calendlyWebhooksService.removeSubscriptionsForTherapist(therapistId);

            // ניקוי טוקנים
            if (therapist.encryptedData) {
                delete therapist.encryptedData.calendlyAccessToken;
                delete therapist.encryptedData.calendlyRefreshToken;
            }

            // עדכון סטטוס
            if (therapist.website.calendly) {
                therapist.website.calendly.isEnabled = false;
                therapist.website.calendly.isVerified = false;
                therapist.website.calendly.setupStatus = 'not_started';
                therapist.website.calendly.disconnectedAt = new Date();

                if (!keepConfig) {
                    therapist.website.calendly.username = null;
                    therapist.website.calendly.userUri = null;
                    therapist.website.calendly.calendlyProfile = null;
                    therapist.website.calendly.embedCode = null;
                }
            }

            await therapist.save();

            console.log(`Disconnected Calendly for therapist ${therapistId}`, {
                keepConfig,
                adminInitiated,
                webhooksRemoved: webhookResult.removedSubscriptions
            });

            return {
                success: true,
                data: {
                    therapistId,
                    disconnectedAt: new Date(),
                    configKept: keepConfig,
                    webhooks: webhookResult
                }
            };

        } catch (error) {
            console.error(`Error disconnecting therapist ${therapistId}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * רענון טוקן גישה
     * @param {string} therapistId - מזהה המטפל
     * @returns {Promise<object>} תוצאת הרענון
     */
    async refreshAccessToken(therapistId) {
        try {
            const therapist = await Therapist.findById(therapistId);
            if (!therapist?.encryptedData?.calendlyRefreshToken) {
                throw new Error('אין refresh token');
            }

            const refreshToken = decrypt(therapist.encryptedData.calendlyRefreshToken);

            const response = await axios.post(`${this.authBaseUrl}/oauth/token`, {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: this.clientId,
                client_secret: this.clientSecret
            });

            const { access_token, refresh_token } = response.data;

            // עדכון טוקנים
            therapist.encryptedData.calendlyAccessToken = encrypt(access_token);
            if (refresh_token) {
                therapist.encryptedData.calendlyRefreshToken = encrypt(refresh_token);
            }

            therapist.website.calendly.lastTokenRefresh = new Date();
            await therapist.save();

            return { success: true, refreshed: true };

        } catch (error) {
            console.error(`Error refreshing token for therapist ${therapistId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * קבלת סטטוס חיבור מפורט
     * @param {string} therapistId - מזהה המטפל
     * @returns {Promise<object>} סטטוס החיבור
     */
    async getConnectionStatus(therapistId) {
        try {
            const therapist = await Therapist.findById(therapistId);
            if (!therapist) {
                throw new Error('מטפל לא נמצא');
            }

            const calendlyData = therapist.website?.calendly || {};
            const hasAccessToken = !!therapist.encryptedData?.calendlyAccessToken;
            const hasFeatureAccess = therapist.hasCalendlyAccess();

            // בדיקת webhook status
            const webhookStatus = await calendlyWebhooksService.getSubscriptionStatus(therapistId);

            return {
                success: true,
                data: {
                    therapistId,
                    hasFeatureAccess,
                    setupStatus: calendlyData.setupStatus || 'not_started',
                    isConnected: calendlyData.isVerified && hasAccessToken,
                    isEnabled: calendlyData.isEnabled || false,
                    username: calendlyData.username || null,
                    schedulingUrl: calendlyData.username ?
                        `https://calendly.com/${calendlyData.username}` : null,
                    connectedAt: calendlyData.connectedAt || null,
                    lastSyncAt: calendlyData.lastSyncAt || null,
                    webhooks: webhookStatus,
                    profile: calendlyData.calendlyProfile || null,
                    lastError: calendlyData.lastError || null
                }
            };

        } catch (error) {
            console.error(`Error getting connection status for therapist ${therapistId}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * רשימת כל המטפלים המחוברים ל-Calendly
     * @returns {Promise<object>} רשימת מטפלים
     */
    async getConnectedTherapists() {
        try {
            const therapists = await Therapist.find({
                'website.calendly.isVerified': true,
                'website.calendly.username': { $exists: true, $ne: null }
            }).select('firstName lastName email website.calendly');

            return {
                success: true,
                data: {
                    count: therapists.length,
                    therapists: therapists.map(t => ({
                        id: t._id,
                        name: `${t.firstName} ${t.lastName}`,
                        email: t.email,
                        username: t.website.calendly.username,
                        setupStatus: t.website.calendly.setupStatus,
                        connectedAt: t.website.calendly.connectedAt,
                        lastSyncAt: t.website.calendly.lastSyncAt
                    }))
                }
            };

        } catch (error) {
            console.error('Error getting connected therapists:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * יצירת URL קצר לשיתוף (לשימוש במייל)
     * @param {string} therapistId - מזהה המטפל
     * @param {object} options - אפשרויות נוספות
     * @returns {Promise<object>} URL קצר
     */
    async generateShareableConnectUrl(therapistId, options = {}) {
        try {
            const connectResult = await this.getConnectUrlForTherapist(therapistId, {
                ...options,
                adminInitiated: true
            });

            if (!connectResult.success) {
                return connectResult;
            }

            // יצירת מזהה קצר לשמירה במטמון
            const shortId = crypto.randomBytes(8).toString('hex');
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // יום

            // כאן ניתן להוסיף שמירה במטמון (Redis) או במסד נתונים
            // לדוגמה: await redis.setex(`calendly_connect_${shortId}`, 86400, connectResult.data.connectUrl);

            const shareableUrl = `${process.env.CLIENT_URL}/connect/calendly/${shortId}`;

            return {
                success: true,
                data: {
                    shareableUrl,
                    originalUrl: connectResult.data.connectUrl,
                    shortId,
                    expiresAt,
                    therapistId
                }
            };

        } catch (error) {
            console.error(`Error generating shareable URL for therapist ${therapistId}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// יצירת instance יחיד
const calendlyService = new CalendlyService();

module.exports = {
    CalendlyService,
    calendlyService,

    // פונקציות נוחות
    getConnectUrlForTherapist: (therapistId, options) =>
        calendlyService.getConnectUrlForTherapist(therapistId, options),

    handleOAuthCallback: (code, state) =>
        calendlyService.handleOAuthCallback(code, state),

    disconnectTherapist: (therapistId, options) =>
        calendlyService.disconnectTherapist(therapistId, options),

    getConnectionStatus: (therapistId) =>
        calendlyService.getConnectionStatus(therapistId),

    refreshAccessToken: (therapistId) =>
        calendlyService.refreshAccessToken(therapistId),

    getConnectedTherapists: () =>
        calendlyService.getConnectedTherapists(),

    generateShareableConnectUrl: (therapistId, options) =>
        calendlyService.generateShareableConnectUrl(therapistId, options)
};
