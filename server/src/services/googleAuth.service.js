const { google } = require('googleapis');
const crypto = require('crypto-js');
const GoogleCalendarSync = require('../models/GoogleCalendarSync');
const Therapist = require('../models/Therapist');

class GoogleAuthService {
    constructor() {
        this.oauth2Client = null;
        this.encryptionKey = process.env.ENCRYPTION_KEY;

        if (!this.encryptionKey) {
            console.warn('⚠️ ENCRYPTION_KEY not configured - Google OAuth will not work');
            // Don't throw - allow server to start without Google OAuth
        }
    }

    /**
     * אתחול Google OAuth2 client
     */
    initOAuth2Client() {
        try {
            this.oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );

            console.log('Google OAuth2 client initialized successfully');
            return this.oauth2Client;
        } catch (error) {
            console.error('Error initializing Google OAuth2 client:', error);
            throw new Error('Failed to initialize Google OAuth2 client');
        }
    }

    /**
     * יצירת authorization URL
     * @param {string} therapistId - ID של המטפלת
     * @returns {string} Authorization URL
     */
    async getAuthUrl(therapistId) {
        try {
            if (!this.oauth2Client) {
                this.initOAuth2Client();
            }

            // יצירת state token לאבטחה
            const stateToken = this.generateStateToken(therapistId);

            const scopes = [
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/calendar.readonly',
                'https://www.googleapis.com/auth/calendar.settings.readonly'
            ];

            const authUrl = this.oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: scopes,
                state: stateToken,
                prompt: 'consent', // כפה consent כדי לקבל refresh token
                include_granted_scopes: true
            });

            console.log(`Generated auth URL for therapist ${therapistId}`);
            return authUrl;
        } catch (error) {
            console.error('Error generating auth URL:', error);
            throw new Error('Failed to generate authorization URL');
        }
    }

    /**
     * קבלת טוקנים מקוד authorization
     * @param {string} code - Authorization code מ-Google
     * @param {string} state - State token לאימות
     * @returns {Object} Tokens object
     */
    async getTokensFromCode(code, state) {
        try {
            if (!this.oauth2Client) {
                this.initOAuth2Client();
            }

            // אימות state token
            const therapistId = this.verifyStateToken(state);
            if (!therapistId) {
                throw new Error('Invalid state token');
            }

            const { tokens } = await this.oauth2Client.getToken(code);

            if (!tokens.access_token || !tokens.refresh_token) {
                throw new Error('Missing required tokens from Google');
            }

            console.log(`Successfully obtained tokens for therapist ${therapistId}`);
            return {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date,
                scope: tokens.scope,
                therapistId
            };
        } catch (error) {
            console.error('Error getting tokens from code:', error);
            if (error.message.includes('invalid_grant')) {
                throw new Error('Authorization code expired or invalid');
            }
            throw new Error('Failed to obtain tokens from Google');
        }
    }

    /**
     * רענון access token
     * @param {string} refreshToken - Refresh token
     * @param {string} therapistId - ID של המטפלת
     * @returns {Object} New tokens
     */
    async refreshAccessToken(refreshToken, therapistId) {
        try {
            if (!this.oauth2Client) {
                this.initOAuth2Client();
            }

            this.oauth2Client.setCredentials({
                refresh_token: refreshToken
            });

            const { credentials } = await this.oauth2Client.refreshAccessToken();

            if (!credentials.access_token) {
                throw new Error('Failed to refresh access token');
            }

            // עדכון בדאטה בייס
            await this.updateTokensInDatabase(therapistId, {
                accessToken: credentials.access_token,
                refreshToken: credentials.refresh_token || refreshToken,
                expiryDate: credentials.expiry_date
            });

            console.log(`Successfully refreshed tokens for therapist ${therapistId}`);
            return {
                accessToken: credentials.access_token,
                refreshToken: credentials.refresh_token || refreshToken,
                expiryDate: credentials.expiry_date
            };
        } catch (error) {
            console.error('Error refreshing access token:', error);

            // אם refresh token לא תקין, נצטרך לנתק את החיבור
            if (error.message.includes('invalid_grant')) {
                await this.disconnectTherapist(therapistId);
                throw new Error('Refresh token expired - reconnection required');
            }

            throw new Error('Failed to refresh access token');
        }
    }

    /**
     * הצפנת טוקן
     * @param {string} token - Token להצפנה
     * @returns {string} Encrypted token
     */
    encryptToken(token) {
        try {
            if (!token) return null;
            return crypto.AES.encrypt(token, this.encryptionKey).toString();
        } catch (error) {
            console.error('Error encrypting token:', error);
            throw new Error('Failed to encrypt token');
        }
    }

    /**
     * פענוח טוקן
     * @param {string} encryptedToken - Encrypted token
     * @returns {string} Decrypted token
     */
    decryptToken(encryptedToken) {
        try {
            if (!encryptedToken) return null;
            const bytes = crypto.AES.decrypt(encryptedToken, this.encryptionKey);
            return bytes.toString(crypto.enc.Utf8);
        } catch (error) {
            console.error('Error decrypting token:', error);
            throw new Error('Failed to decrypt token');
        }
    }

    /**
     * שמירת טוקנים בדאטה בייס
     * @param {string} therapistId - ID של המטפלת
     * @param {Object} tokens - Tokens object
     */
    async saveTokensToDatabase(therapistId, tokens) {
        try {
            const encryptedAccessToken = this.encryptToken(tokens.accessToken);
            const encryptedRefreshToken = this.encryptToken(tokens.refreshToken);

            // עדכון או יצירת GoogleCalendarSync record
            await GoogleCalendarSync.findOneAndUpdate(
                { therapistId },
                {
                    therapistId,
                    googleAccessToken: encryptedAccessToken,
                    googleRefreshToken: encryptedRefreshToken,
                    lastSyncedAt: new Date(),
                    syncEnabled: true,
                    syncDirection: 'two-way',
                    privacyLevel: 'generic'
                },
                { upsert: true, new: true }
            );

            // עדכון Therapist record
            await Therapist.findByIdAndUpdate(therapistId, {
                googleCalendarConnected: true,
                'calendarSettings.showClientNames': false,
                'calendarSettings.defaultAppointmentColor': '#4A90E2',
                'calendarSettings.autoConfirmBookings': false
            });

            console.log(`Tokens saved to database for therapist ${therapistId}`);
        } catch (error) {
            console.error('Error saving tokens to database:', error);
            throw new Error('Failed to save tokens to database');
        }
    }

    /**
     * עדכון טוקנים בדאטה בייס
     * @param {string} therapistId - ID של המטפלת
     * @param {Object} tokens - New tokens
     */
    async updateTokensInDatabase(therapistId, tokens) {
        try {
            const updateData = {
                lastSyncedAt: new Date()
            };

            if (tokens.accessToken) {
                updateData.googleAccessToken = this.encryptToken(tokens.accessToken);
            }

            if (tokens.refreshToken) {
                updateData.googleRefreshToken = this.encryptToken(tokens.refreshToken);
            }

            await GoogleCalendarSync.findOneAndUpdate(
                { therapistId },
                updateData
            );

            console.log(`Tokens updated in database for therapist ${therapistId}`);
        } catch (error) {
            console.error('Error updating tokens in database:', error);
            throw new Error('Failed to update tokens in database');
        }
    }

    /**
     * קבלת טוקנים מהדאטה בייס
     * @param {string} therapistId - ID של המטפלת
     * @returns {Object} Decrypted tokens
     */
    async getTokensFromDatabase(therapistId) {
        try {
            const syncRecord = await GoogleCalendarSync.findOne({ therapistId }).select('+googleAccessToken +googleRefreshToken');

            if (!syncRecord) {
                return null;
            }

            return {
                accessToken: this.decryptToken(syncRecord.googleAccessToken),
                refreshToken: this.decryptToken(syncRecord.googleRefreshToken),
                expiryDate: syncRecord.lastSyncedAt
            };
        } catch (error) {
            console.error('Error getting tokens from database:', error);
            throw new Error('Failed to get tokens from database');
        }
    }

    /**
     * ניתוק מטפלת מ-Google Calendar
     * @param {string} therapistId - ID של המטפלת
     */
    async disconnectTherapist(therapistId) {
        try {
            // מחיקת GoogleCalendarSync record
            await GoogleCalendarSync.findOneAndDelete({ therapistId });

            // עדכון Therapist record
            await Therapist.findByIdAndUpdate(therapistId, {
                googleCalendarConnected: false
            });

            console.log(`Therapist ${therapistId} disconnected from Google Calendar`);
        } catch (error) {
            console.error('Error disconnecting therapist:', error);
            throw new Error('Failed to disconnect therapist');
        }
    }

    /**
     * בדיקת תקינות טוקן
     * @param {string} therapistId - ID של המטפלת
     * @returns {boolean} Token validity
     */
    async isTokenValid(therapistId) {
        try {
            const tokens = await this.getTokensFromDatabase(therapistId);
            if (!tokens || !tokens.accessToken) {
                return false;
            }

            // בדיקה פשוטה - אם יש access token
            return !!tokens.accessToken;
        } catch (error) {
            console.error('Error checking token validity:', error);
            return false;
        }
    }

    /**
     * יצירת state token לאבטחה
     * @param {string} therapistId - ID של המטפלת
     * @returns {string} State token
     */
    generateStateToken(therapistId) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2);
        const data = `${therapistId}:${timestamp}:${randomString}`;

        return crypto.AES.encrypt(data, this.encryptionKey).toString();
    }

    /**
     * אימות state token
     * @param {string} stateToken - State token
     * @returns {string|null} Therapist ID או null אם לא תקין
     */
    verifyStateToken(stateToken) {
        try {
            const bytes = crypto.AES.decrypt(stateToken, this.encryptionKey);
            const decryptedData = bytes.toString(crypto.enc.Utf8);

            const [therapistId, timestamp, randomString] = decryptedData.split(':');

            // בדיקה שהטוקן לא ישן מדי (5 דקות)
            const tokenAge = Date.now() - parseInt(timestamp);
            if (tokenAge > 5 * 60 * 1000) {
                return null;
            }

            return therapistId;
        } catch (error) {
            console.error('Error verifying state token:', error);
            return null;
        }
    }

    /**
     * קבלת OAuth2 client מוגדר עם טוקנים
     * @param {string} therapistId - ID של המטפלת
     * @returns {Object} Configured OAuth2 client
     */
    async getConfiguredClient(therapistId) {
        try {
            const tokens = await this.getTokensFromDatabase(therapistId);
            if (!tokens) {
                throw new Error('No tokens found for therapist');
            }

            if (!this.oauth2Client) {
                this.initOAuth2Client();
            }

            this.oauth2Client.setCredentials({
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken
            });

            return this.oauth2Client;
        } catch (error) {
            console.error('Error getting configured client:', error);
            throw new Error('Failed to configure OAuth2 client');
        }
    }
}

module.exports = new GoogleAuthService();
