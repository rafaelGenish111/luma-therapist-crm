const axios = require('axios');
const Therapist = require('../models/Therapist');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * שירות לניהול webhook subscriptions של Calendly
 * מטפל ביצירה, עדכון ומחיקה של מנויים לאירועי Calendly
 */

class CalendlyWebhooksService {
    constructor() {
        this.baseUrl = 'https://api.calendly.com';
        this.webhookEndpoint = process.env.CALENDLY_WEBHOOK_ENDPOINT ||
            `${process.env.SERVER_URL}/api/integrations/calendly/webhook`;
    }

    /**
     * יצירת headers לבקשות API של Calendly
     * @param {string} accessToken - טוקן הגישה המוצפן של המטפל
     * @returns {object} headers
     */
    getApiHeaders(accessToken) {
        return {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * וידוא קיום webhook subscriptions עבור מטפל
     * @param {string} therapistId - מזהה המטפל
     * @returns {Promise<object>} תוצאת הפעולה
     */
    async ensureSubscriptionsForTherapist(therapistId) {
        try {
            console.log(`Ensuring webhook subscriptions for therapist ${therapistId}`);

            const therapist = await Therapist.findById(therapistId);
            if (!therapist) {
                throw new Error('מטפל לא נמצא');
            }

            // בדיקה שיש טוקן מוצפן
            const tokenField = therapist.encryptedData?.calendlyAccessToken || therapist.encryptedData?.calendlyToken;
            if (!tokenField) {
                console.log(`No Calendly token found for therapist ${therapistId}`);
                return {
                    success: false,
                    error: 'אין טוקן Calendly למטפל',
                    subscriptions: []
                };
            }

            // פענוח הטוקן
            const accessToken = decrypt(tokenField);

            // קבלת המשתמש הנוכחי מ-Calendly
            const userResponse = await axios.get(`${this.baseUrl}/users/me`, {
                headers: this.getApiHeaders(accessToken)
            });

            const userUri = userResponse.data.resource.uri;

            // בדיקת webhook subscriptions קיימים
            const existingSubscriptions = await this.getExistingSubscriptions(accessToken, userUri);
            console.log(`Found ${existingSubscriptions.length} existing subscriptions for therapist ${therapistId}`);

            // אירועים שאנחנו רוצים להירשם אליהם
            const requiredEvents = [
                'invitee.created',
                'invitee.canceled',
                'invitee_no_show.created'
            ];

            const newSubscriptions = [];
            const existingUrls = existingSubscriptions.map(sub => sub.callback_url);

            // יצירת subscription חדש אם לא קיים
            if (!existingUrls.includes(this.webhookEndpoint)) {
                const subscriptionData = {
                    url: this.webhookEndpoint,
                    events: requiredEvents,
                    organization: userUri.replace('/users/', '/organizations/'),
                    scope: 'user'
                };

                try {
                    const response = await axios.post(
                        `${this.baseUrl}/webhook_subscriptions`,
                        subscriptionData,
                        { headers: this.getApiHeaders(accessToken) }
                    );

                    newSubscriptions.push(response.data.resource);
                    console.log(`Created new webhook subscription for therapist ${therapistId}`);
                } catch (error) {
                    console.error(`Error creating webhook subscription:`, error.response?.data || error.message);

                    // אם השגיאה היא subscription כפול, זה בסדר
                    if (error.response?.status !== 409) {
                        throw error;
                    }
                }
            }

            // עדכון נתוני המטפל
            if (!therapist.website.calendly.webhookSubscriptions) {
                therapist.website.calendly.webhookSubscriptions = [];
            }

            // הוספת subscriptions חדשים
            newSubscriptions.forEach(sub => {
                therapist.website.calendly.webhookSubscriptions.push({
                    uri: sub.uri,
                    callback_url: sub.callback_url,
                    events: sub.events,
                    state: sub.state,
                    createdAt: new Date()
                });
            });

            therapist.website.calendly.lastWebhookSync = new Date();
            await therapist.save();

            return {
                success: true,
                newSubscriptions: newSubscriptions.length,
                existingSubscriptions: existingSubscriptions.length,
                totalSubscriptions: existingSubscriptions.length + newSubscriptions.length,
                subscriptions: [...existingSubscriptions, ...newSubscriptions]
            };

        } catch (error) {
            console.error(`Error ensuring subscriptions for therapist ${therapistId}:`, error);
            return {
                success: false,
                error: error.message,
                subscriptions: []
            };
        }
    }

    /**
     * הסרת webhook subscriptions עבור מטפל
     * @param {string} therapistId - מזהה המטפל
     * @param {boolean} keepInactive - השאר subscriptions לא פעילים במקום מחיקה
     * @returns {Promise<object>} תוצאת הפעולה
     */
    async removeSubscriptionsForTherapist(therapistId, keepInactive = false) {
        try {
            console.log(`Removing webhook subscriptions for therapist ${therapistId}`);

            const therapist = await Therapist.findById(therapistId);
            if (!therapist) {
                throw new Error('מטפל לא נמצא');
            }

            const tokenField = therapist.encryptedData?.calendlyAccessToken || therapist.encryptedData?.calendlyToken;
            if (!tokenField) {
                console.log(`No Calendly token found for therapist ${therapistId}`);
                return {
                    success: true,
                    message: 'אין טוקן Calendly למטפל',
                    removedSubscriptions: 0
                };
            }

            const accessToken = decrypt(tokenField);

            // קבלת משתמש נוכחי
            const userResponse = await axios.get(`${this.baseUrl}/users/me`, {
                headers: this.getApiHeaders(accessToken)
            });

            const userUri = userResponse.data.resource.uri;

            // קבלת subscriptions קיימים
            const existingSubscriptions = await this.getExistingSubscriptions(accessToken, userUri);
            let removedCount = 0;

            // מחיקת או ביטול subscriptions
            for (const subscription of existingSubscriptions) {
                if (subscription.callback_url === this.webhookEndpoint) {
                    try {
                        if (keepInactive) {
                            // ביטול במקום מחיקה
                            await axios.delete(
                                `${this.baseUrl}/webhook_subscriptions/${subscription.uuid}`,
                                { headers: this.getApiHeaders(accessToken) }
                            );
                        } else {
                            // מחיקה מלאה
                            await axios.delete(
                                `${this.baseUrl}/webhook_subscriptions/${subscription.uuid}`,
                                { headers: this.getApiHeaders(accessToken) }
                            );
                        }
                        removedCount++;
                        console.log(`Removed subscription ${subscription.uuid} for therapist ${therapistId}`);
                    } catch (error) {
                        console.error(`Error removing subscription ${subscription.uuid}:`, error.response?.data || error.message);
                    }
                }
            }

            // עדכון נתוני המטפל
            if (therapist.website.calendly) {
                therapist.website.calendly.webhookSubscriptions = [];
                therapist.website.calendly.lastWebhookSync = new Date();
                await therapist.save();
            }

            return {
                success: true,
                removedSubscriptions: removedCount,
                message: `הוסרו ${removedCount} webhook subscriptions`
            };

        } catch (error) {
            console.error(`Error removing subscriptions for therapist ${therapistId}:`, error);
            return {
                success: false,
                error: error.message,
                removedSubscriptions: 0
            };
        }
    }

    /**
     * קבלת webhook subscriptions קיימים
     * @param {string} accessToken - טוקן גישה
     * @param {string} userUri - URI של המשתמש
     * @returns {Promise<Array>} רשימת subscriptions
     */
    async getExistingSubscriptions(accessToken, userUri) {
        try {
            const response = await axios.get(`${this.baseUrl}/webhook_subscriptions`, {
                headers: this.getApiHeaders(accessToken),
                params: {
                    organization: userUri.replace('/users/', '/organizations/'),
                    scope: 'user'
                }
            });

            return response.data.collection || [];
        } catch (error) {
            console.error('Error fetching existing subscriptions:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * בדיקת סטטוס webhook subscription
     * @param {string} therapistId - מזהה המטפל
     * @returns {Promise<object>} סטטוס ה-subscriptions
     */
    async getSubscriptionStatus(therapistId) {
        try {
            const therapist = await Therapist.findById(therapistId);
            if (!therapist) {
                throw new Error('מטפל לא נמצא');
            }

            const tokenField = therapist.encryptedData?.calendlyAccessToken || therapist.encryptedData?.calendlyToken;
            if (!tokenField) {
                return {
                    success: false,
                    error: 'אין טוקן Calendly',
                    hasSubscriptions: false,
                    subscriptions: []
                };
            }

            const accessToken = decrypt(tokenField);

            const userResponse = await axios.get(`${this.baseUrl}/users/me`, {
                headers: this.getApiHeaders(accessToken)
            });

            const userUri = userResponse.data.resource.uri;
            const subscriptions = await this.getExistingSubscriptions(accessToken, userUri);

            const ourSubscriptions = subscriptions.filter(
                sub => sub.callback_url === this.webhookEndpoint
            );

            return {
                success: true,
                hasSubscriptions: ourSubscriptions.length > 0,
                subscriptions: ourSubscriptions,
                totalSubscriptions: subscriptions.length,
                lastSync: therapist.website.calendly?.lastWebhookSync || null
            };

        } catch (error) {
            console.error(`Error getting subscription status for therapist ${therapistId}:`, error);
            return {
                success: false,
                error: error.message,
                hasSubscriptions: false,
                subscriptions: []
            };
        }
    }

    /**
     * סנכרון מחדש של כל ה-subscriptions למטפל
     * @param {string} therapistId - מזהה המטפל
     * @returns {Promise<object>} תוצאת הסנכרון
     */
    async resyncSubscriptionsForTherapist(therapistId) {
        try {
            console.log(`Resyncing webhook subscriptions for therapist ${therapistId}`);

            // הסרת subscriptions קיימים
            const removeResult = await this.removeSubscriptionsForTherapist(therapistId);

            // יצירת subscriptions חדשים
            const ensureResult = await this.ensureSubscriptionsForTherapist(therapistId);

            return {
                success: true,
                removed: removeResult.removedSubscriptions,
                created: ensureResult.newSubscriptions,
                message: 'סנכרון webhooks הושלם בהצלחה'
            };

        } catch (error) {
            console.error(`Error resyncing subscriptions for therapist ${therapistId}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * ניקוי subscriptions לא פעילים או כפולים
     * @param {string} therapistId - מזהה המטפל
     * @returns {Promise<object>} תוצאת הניקוי
     */
    async cleanupSubscriptionsForTherapist(therapistId) {
        try {
            const therapist = await Therapist.findById(therapistId);
            const tokenField = therapist?.encryptedData?.calendlyAccessToken || therapist?.encryptedData?.calendlyToken;
            if (!tokenField) {
                return { success: false, error: 'אין טוקן Calendly' };
            }

            const accessToken = decrypt(tokenField);

            const userResponse = await axios.get(`${this.baseUrl}/users/me`, {
                headers: this.getApiHeaders(accessToken)
            });

            const userUri = userResponse.data.resource.uri;
            const subscriptions = await this.getExistingSubscriptions(accessToken, userUri);

            // מציאת subscriptions כפולים או לא פעילים
            const ourSubscriptions = subscriptions.filter(
                sub => sub.callback_url === this.webhookEndpoint
            );

            let cleanedCount = 0;

            // אם יש יותר מ-subscription אחד - מחק את העודפים
            if (ourSubscriptions.length > 1) {
                // השאר רק את החדש ביותר
                const sortedSubs = ourSubscriptions.sort((a, b) =>
                    new Date(b.created_at) - new Date(a.created_at)
                );

                for (let i = 1; i < sortedSubs.length; i++) {
                    try {
                        await axios.delete(
                            `${this.baseUrl}/webhook_subscriptions/${sortedSubs[i].uuid}`,
                            { headers: this.getApiHeaders(accessToken) }
                        );
                        cleanedCount++;
                    } catch (error) {
                        console.error(`Error cleaning up subscription:`, error.response?.data);
                    }
                }
            }

            return {
                success: true,
                cleanedSubscriptions: cleanedCount,
                remainingSubscriptions: ourSubscriptions.length - cleanedCount
            };

        } catch (error) {
            console.error(`Error cleaning up subscriptions:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// יצירת instance יחיד
const calendlyWebhooksService = new CalendlyWebhooksService();

module.exports = {
    CalendlyWebhooksService,
    calendlyWebhooksService,

    // פונקציות נוחות
    ensureSubscriptionsForTherapist: (therapistId) =>
        calendlyWebhooksService.ensureSubscriptionsForTherapist(therapistId),

    removeSubscriptionsForTherapist: (therapistId, keepInactive = false) =>
        calendlyWebhooksService.removeSubscriptionsForTherapist(therapistId, keepInactive),

    getSubscriptionStatus: (therapistId) =>
        calendlyWebhooksService.getSubscriptionStatus(therapistId),

    resyncSubscriptionsForTherapist: (therapistId) =>
        calendlyWebhooksService.resyncSubscriptionsForTherapist(therapistId),

    cleanupSubscriptionsForTherapist: (therapistId) =>
        calendlyWebhooksService.cleanupSubscriptionsForTherapist(therapistId)
};
