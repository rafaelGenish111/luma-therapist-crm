const googleAuthService = require('../services/googleAuth.service');
const googleCalendarService = require('../services/googleCalendar.service');
const GoogleCalendarSync = require('../models/GoogleCalendarSync');
const Therapist = require('../models/Therapist');

/**
 * Calendar Controller
 * טיפול בכל הפעולות הקשורות ל-Google Calendar
 */
class CalendarController {
    
    /**
     * התחלת תהליך OAuth עם Google
     * GET /api/calendar/google/auth
     */
    async initiateGoogleAuth(req, res) {
        try {
            const therapistId = req.user.id; // מהטוקן JWT
            
            if (!therapistId) {
                return res.status(401).json({
                    success: false,
                    message: 'לא נמצא מזהה מטפלת'
                });
            }

            // בדיקה אם המטפלת כבר מחוברת
            const existingSync = await GoogleCalendarSync.findOne({ therapistId });
            if (existingSync && existingSync.syncEnabled) {
                return res.status(400).json({
                    success: false,
                    message: 'המטפלת כבר מחוברת ל-Google Calendar'
                });
            }

            const authUrl = await googleAuthService.getAuthUrl(therapistId);
            
            res.json({
                success: true,
                authUrl,
                message: 'הפנייה ל-Google OAuth נוצרה בהצלחה'
            });
        } catch (error) {
            console.error('Error initiating Google auth:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בהתחלת תהליך האימות עם Google',
                error: error.message
            });
        }
    }

    /**
     * טיפול ב-callback מ-Google OAuth
     * GET /api/calendar/google/callback
     */
    async handleGoogleCallback(req, res) {
        try {
            const { code, state, error } = req.query;

            if (error) {
                console.error('Google OAuth error:', error);
                return res.redirect(`${process.env.FRONTEND_URL}/calendar?error=oauth_failed`);
            }

            if (!code || !state) {
                return res.redirect(`${process.env.FRONTEND_URL}/calendar?error=missing_params`);
            }

            // קבלת טוקנים
            const tokens = await googleAuthService.getTokensFromCode(code, state);
            
            // שמירת טוקנים בדאטה בייס
            await googleAuthService.saveTokensToDatabase(tokens.therapistId, tokens);

            // הגדרת webhook
            try {
                await googleCalendarService.setupWebhook(tokens.therapistId);
            } catch (webhookError) {
                console.error('Error setting up webhook:', webhookError);
                // לא נכשל את כל התהליך בגלל webhook
            }

            // redirect ל-frontend עם הצלחה
            res.redirect(`${process.env.FRONTEND_URL}/calendar?success=connected`);
        } catch (error) {
            console.error('Error handling Google callback:', error);
            res.redirect(`${process.env.FRONTEND_URL}/calendar?error=connection_failed`);
        }
    }

    /**
     * ניתוק מ-Google Calendar
     * POST /api/calendar/google/disconnect
     */
    async disconnectGoogle(req, res) {
        try {
            const therapistId = req.user.id;

            if (!therapistId) {
                return res.status(401).json({
                    success: false,
                    message: 'לא נמצא מזהה מטפלת'
                });
            }

            // בדיקה אם המטפלת מחוברת
            const syncRecord = await GoogleCalendarSync.findOne({ therapistId });
            if (!syncRecord) {
                return res.status(400).json({
                    success: false,
                    message: 'המטפלת לא מחוברת ל-Google Calendar'
                });
            }

            // ניתוק מהשירות
            await googleAuthService.disconnectTherapist(therapistId);

            res.json({
                success: true,
                message: 'הניתוק מ-Google Calendar בוצע בהצלחה'
            });
        } catch (error) {
            console.error('Error disconnecting Google:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בניתוק מ-Google Calendar',
                error: error.message
            });
        }
    }

    /**
     * קבלת סטטוס סנכרון
     * GET /api/calendar/sync-status
     */
    async getSyncStatus(req, res) {
        try {
            const therapistId = req.user.id;

            if (!therapistId) {
                return res.status(401).json({
                    success: false,
                    message: 'לא נמצא מזהה מטפלת'
                });
            }

            const syncRecord = await GoogleCalendarSync.findOne({ therapistId });
            
            if (!syncRecord) {
                return res.json({
                    success: true,
                    connected: false,
                    message: 'לא מחובר ל-Google Calendar'
                });
            }

            // ספירת פגישות שלא סונכרנו
            const unsyncedAppointments = await require('../models/Appointment').countDocuments({
                therapistId,
                googleCalendarSynced: false,
                status: { $in: ['pending', 'confirmed'] }
            });

            // ספירת שגיאות סנכרון לא פתורות
            const unresolvedErrors = syncRecord.syncErrors.filter(error => !error.resolved).length;

            res.json({
                success: true,
                connected: syncRecord.syncEnabled,
                syncDirection: syncRecord.syncDirection,
                privacyLevel: syncRecord.privacyLevel,
                lastSyncedAt: syncRecord.lastSyncedAt,
                webhookActive: syncRecord.webhookExpiration > new Date(),
                webhookExpiration: syncRecord.webhookExpiration,
                unsyncedAppointments,
                unresolvedErrors,
                syncErrors: syncRecord.syncErrors.slice(-5) // 5 שגיאות אחרונות
            });
        } catch (error) {
            console.error('Error getting sync status:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת סטטוס סנכרון',
                error: error.message
            });
        }
    }

    /**
     * סנכרון ידני
     * POST /api/calendar/sync
     */
    async manualSync(req, res) {
        try {
            const therapistId = req.user.id;
            const { direction = 'two-way' } = req.body;

            if (!therapistId) {
                return res.status(401).json({
                    success: false,
                    message: 'לא נמצא מזהה מטפלת'
                });
            }

            // בדיקה אם המטפלת מחוברת
            const syncRecord = await GoogleCalendarSync.findOne({ therapistId });
            if (!syncRecord || !syncRecord.syncEnabled) {
                return res.status(400).json({
                    success: false,
                    message: 'המטפלת לא מחוברת ל-Google Calendar'
                });
            }

            let stats = {};

            // סנכרון לפי כיוון
            switch (direction) {
                case 'to-google':
                    // סנכרון פגישות מקומיות ל-Google
                    const appointments = await require('../models/Appointment').find({
                        therapistId,
                        googleCalendarSynced: false,
                        status: { $in: ['pending', 'confirmed'] }
                    });

                    let syncedCount = 0;
                    for (const appointment of appointments) {
                        try {
                            const result = await googleCalendarService.syncAppointmentToGoogle(appointment._id);
                            if (result.success) syncedCount++;
                        } catch (error) {
                            console.error(`Error syncing appointment ${appointment._id}:`, error);
                        }
                    }

                    stats = { syncedToGoogle: syncedCount };
                    break;

                case 'from-google':
                    // סנכרון מ-Google למקומי
                    stats = await googleCalendarService.syncFromGoogleToLocal(therapistId);
                    break;

                case 'two-way':
                default:
                    // סנכרון דו-כיווני
                    const fromGoogleStats = await googleCalendarService.syncFromGoogleToLocal(therapistId);
                    
                    const appointmentsToSync = await require('../models/Appointment').find({
                        therapistId,
                        googleCalendarSynced: false,
                        status: { $in: ['pending', 'confirmed'] }
                    });

                    let syncedToGoogleCount = 0;
                    for (const appointment of appointmentsToSync) {
                        try {
                            const result = await googleCalendarService.syncAppointmentToGoogle(appointment._id);
                            if (result.success) syncedToGoogleCount++;
                        } catch (error) {
                            console.error(`Error syncing appointment ${appointment._id}:`, error);
                        }
                    }

                    stats = {
                        ...fromGoogleStats,
                        syncedToGoogle: syncedToGoogleCount
                    };
                    break;
            }

            res.json({
                success: true,
                message: 'הסנכרון הושלם בהצלחה',
                stats
            });
        } catch (error) {
            console.error('Error in manual sync:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בסנכרון ידני',
                error: error.message
            });
        }
    }

    /**
     * טיפול ב-webhook מ-Google
     * POST /api/calendar/webhook
     */
    async handleWebhook(req, res) {
        try {
            const { channelId, resourceId } = req.headers;

            if (!channelId || !resourceId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing webhook headers'
                });
            }

            // טיפול ב-webhook notification
            await googleCalendarService.handleWebhookNotification(channelId, resourceId);

            res.status(200).json({
                success: true,
                message: 'Webhook processed successfully'
            });
        } catch (error) {
            console.error('Error handling webhook:', error);
            res.status(500).json({
                success: false,
                message: 'Error processing webhook',
                error: error.message
            });
        }
    }

    /**
     * עדכון הגדרות סנכרון
     * PUT /api/calendar/settings
     */
    async updateSyncSettings(req, res) {
        try {
            const therapistId = req.user.id;
            const { syncDirection, privacyLevel, syncEnabled } = req.body;

            if (!therapistId) {
                return res.status(401).json({
                    success: false,
                    message: 'לא נמצא מזהה מטפלת'
                });
            }

            const updateData = {};
            
            if (syncDirection !== undefined) {
                updateData.syncDirection = syncDirection;
            }
            
            if (privacyLevel !== undefined) {
                updateData.privacyLevel = privacyLevel;
            }
            
            if (syncEnabled !== undefined) {
                updateData.syncEnabled = syncEnabled;
            }

            const syncRecord = await GoogleCalendarSync.findOneAndUpdate(
                { therapistId },
                updateData,
                { new: true, upsert: true }
            );

            res.json({
                success: true,
                message: 'הגדרות הסנכרון עודכנו בהצלחה',
                settings: {
                    syncDirection: syncRecord.syncDirection,
                    privacyLevel: syncRecord.privacyLevel,
                    syncEnabled: syncRecord.syncEnabled
                }
            });
        } catch (error) {
            console.error('Error updating sync settings:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בעדכון הגדרות סנכרון',
                error: error.message
            });
        }
    }

    /**
     * ניקוי שגיאות סנכרון ישנות
     * DELETE /api/calendar/sync-errors
     */
    async clearSyncErrors(req, res) {
        try {
            const therapistId = req.user.id;

            if (!therapistId) {
                return res.status(401).json({
                    success: false,
                    message: 'לא נמצא מזהה מטפלת'
                });
            }

            await GoogleCalendarSync.findOneAndUpdate(
                { therapistId },
                { syncErrors: [] }
            );

            res.json({
                success: true,
                message: 'שגיאות הסנכרון נוקו בהצלחה'
            });
        } catch (error) {
            console.error('Error clearing sync errors:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בניקוי שגיאות סנכרון',
                error: error.message
            });
        }
    }
}

module.exports = new CalendarController();
