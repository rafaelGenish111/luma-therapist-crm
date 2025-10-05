const Appointment = require('../models/Appointment');
const BlockedTime = require('../models/BlockedTime');
const GoogleCalendarSync = require('../models/GoogleCalendarSync');
const Therapist = require('../models/Therapist');
const googleCalendarService = require('./googleCalendar.service');
const googleAuthService = require('./googleAuth.service');
const moment = require('moment');

/**
 * Sync Service
 * שירות לסנכרון אוטומטי בין המערכת ל-Google Calendar
 */
class SyncService {

    /**
     * סנכרון פגישה ל-Google Calendar
     * @param {string} appointmentId - ID של הפגישה
     * @returns {Object} Sync result
     */
    async syncAppointmentToGoogle(appointmentId) {
        try {
            const appointment = await Appointment.findById(appointmentId)
                .populate('therapistId', 'googleCalendarConnected');

            if (!appointment) {
                throw new Error('Appointment not found');
            }

            // בדיקה אם המטפלת מחוברת ל-Google
            if (!appointment.therapistId.googleCalendarConnected) {
                return {
                    success: false,
                    reason: 'Therapist not connected to Google Calendar'
                };
            }

            const syncRecord = await GoogleCalendarSync.findOne({
                therapistId: appointment.therapistId._id
            });

            if (!syncRecord || !syncRecord.syncEnabled) {
                return {
                    success: false,
                    reason: 'Google Calendar sync not enabled'
                };
            }

            // בדיקת כיוון סנכרון
            if (syncRecord.syncDirection === 'from-google') {
                return {
                    success: false,
                    reason: 'Sync direction is from-google only'
                };
            }

            // סנכרון הפגישה
            const result = await googleCalendarService.syncAppointmentToGoogle(appointmentId);

            // עדכון זמן סנכרון אחרון
            await GoogleCalendarSync.findOneAndUpdate(
                { therapistId: appointment.therapistId._id },
                { lastSyncedAt: new Date() }
            );

            return result;
        } catch (error) {
            console.error('Error in syncAppointmentToGoogle:', error);

            // שמירת שגיאה
            if (appointment?.therapistId?._id) {
                await this.saveSyncError(appointment.therapistId._id, error.message, 'appointment_sync');
            }

            return {
                success: false,
                error: error.message,
                reason: 'Sync failed'
            };
        }
    }

    /**
     * סנכרון מ-Google Calendar למקומי
     * @param {string} therapistId - ID של המטפלת
     * @returns {Object} Sync statistics
     */
    async syncFromGoogleToLocal(therapistId) {
        try {
            const syncRecord = await GoogleCalendarSync.findOne({ therapistId });

            if (!syncRecord || !syncRecord.syncEnabled) {
                throw new Error('Google Calendar sync not enabled');
            }

            // בדיקת כיוון סנכרון
            if (syncRecord.syncDirection === 'to-google') {
                throw new Error('Sync direction is to-google only');
            }

            // סנכרון מ-Google
            const stats = await googleCalendarService.syncFromGoogleToLocal(therapistId);

            // עדכון זמן סנכרון אחרון
            await GoogleCalendarSync.findOneAndUpdate(
                { therapistId },
                { lastSyncedAt: new Date() }
            );

            return stats;
        } catch (error) {
            console.error('Error in syncFromGoogleToLocal:', error);
            await this.saveSyncError(therapistId, error.message, 'google_sync');
            throw error;
        }
    }

    /**
     * סנכרון מלא דו-כיווני
     * @param {string} therapistId - ID של המטפלת
     * @returns {Object} Comprehensive sync statistics
     */
    async fullSync(therapistId) {
        try {
            console.log(`Starting full sync for therapist ${therapistId}`);

            const stats = {
                fromGoogle: { synced: 0, created: 0, updated: 0, deleted: 0, errors: [] },
                toGoogle: { synced: 0, errors: [] },
                totalTime: 0
            };

            const startTime = Date.now();

            // סנכרון מ-Google למקומי
            try {
                stats.fromGoogle = await this.syncFromGoogleToLocal(therapistId);
            } catch (error) {
                stats.fromGoogle.errors.push(error.message);
            }

            // סנכרון פגישות מקומיות ל-Google
            try {
                const unsyncedAppointments = await Appointment.find({
                    therapistId,
                    googleCalendarSynced: false,
                    status: { $in: ['pending', 'confirmed'] }
                });

                for (const appointment of unsyncedAppointments) {
                    try {
                        const result = await this.syncAppointmentToGoogle(appointment._id);
                        if (result.success) {
                            stats.toGoogle.synced++;
                        } else {
                            stats.toGoogle.errors.push({
                                appointmentId: appointment._id,
                                error: result.error || result.reason
                            });
                        }
                    } catch (error) {
                        stats.toGoogle.errors.push({
                            appointmentId: appointment._id,
                            error: error.message
                        });
                    }
                }
            } catch (error) {
                stats.toGoogle.errors.push(error.message);
            }

            stats.totalTime = Date.now() - startTime;

            console.log(`Full sync completed for therapist ${therapistId} in ${stats.totalTime}ms`);

            return stats;
        } catch (error) {
            console.error('Error in fullSync:', error);
            await this.saveSyncError(therapistId, error.message, 'full_sync');
            throw error;
        }
    }

    /**
     * טיפול בשינוי פגישה
     * @param {string} appointmentId - ID של הפגישה
     * @param {string} changeType - סוג השינוי: 'created', 'updated', 'deleted'
     */
    async handleAppointmentChange(appointmentId, changeType) {
        try {
            const appointment = await Appointment.findById(appointmentId)
                .populate('therapistId', 'googleCalendarConnected');

            if (!appointment) {
                console.log(`Appointment ${appointmentId} not found for change type ${changeType}`);
                return;
            }

            // בדיקה אם המטפלת מחוברת ל-Google
            if (!appointment.therapistId.googleCalendarConnected) {
                console.log(`Therapist ${appointment.therapistId._id} not connected to Google Calendar`);
                return;
            }

            const syncRecord = await GoogleCalendarSync.findOne({
                therapistId: appointment.therapistId._id
            });

            if (!syncRecord || !syncRecord.syncEnabled) {
                console.log(`Google Calendar sync not enabled for therapist ${appointment.therapistId._id}`);
                return;
            }

            // סנכרון לפי סוג השינוי
            switch (changeType) {
                case 'created':
                case 'updated':
                    await this.syncAppointmentToGoogle(appointmentId);
                    break;

                case 'deleted':
                    if (appointment.googleEventId) {
                        await googleCalendarService.deleteGoogleEvent(appointment.googleEventId);
                    }
                    break;
            }

            console.log(`Handled ${changeType} for appointment ${appointmentId}`);
        } catch (error) {
            console.error(`Error handling appointment change ${changeType} for ${appointmentId}:`, error);
            await this.saveSyncError(appointment?.therapistId?._id, error.message, 'appointment_change');
        }
    }

    /**
     * חידוש webhook
     * @param {string} therapistId - ID של המטפלת
     * @returns {Object} Renewal result
     */
    async renewWebhook(therapistId) {
        try {
            const syncRecord = await GoogleCalendarSync.findOne({ therapistId });

            if (!syncRecord) {
                throw new Error('Sync record not found');
            }

            // בדיקה אם ה-webhook קרוב לפוג (פחות מ-24 שעות)
            const expirationTime = moment(syncRecord.webhookExpiration);
            const now = moment();
            const hoursUntilExpiration = expirationTime.diff(now, 'hours');

            if (hoursUntilExpiration > 24) {
                return {
                    success: true,
                    message: 'Webhook still valid',
                    hoursUntilExpiration
                };
            }

            console.log(`Renewing webhook for therapist ${therapistId} (expires in ${hoursUntilExpiration} hours)`);

            // חידוש ה-webhook
            const result = await googleCalendarService.setupWebhook(therapistId);

            if (result.success) {
                console.log(`Webhook renewed successfully for therapist ${therapistId}`);
                return {
                    success: true,
                    message: 'Webhook renewed successfully',
                    newExpiration: result.expiration
                };
            } else {
                throw new Error(result.error || 'Failed to renew webhook');
            }
        } catch (error) {
            console.error('Error renewing webhook:', error);
            await this.saveSyncError(therapistId, error.message, 'webhook_renewal');
            throw error;
        }
    }

    /**
     * סנכרון תקופתי לכל המטפלות המחוברות
     * @returns {Object} Sync statistics for all therapists
     */
    async periodicSyncAllTherapists() {
        try {
            console.log('Starting periodic sync for all connected therapists');

            const connectedTherapists = await GoogleCalendarSync.find({
                syncEnabled: true,
                googleAccessToken: { $exists: true },
                googleRefreshToken: { $exists: true }
            });

            const results = {
                totalTherapists: connectedTherapists.length,
                successful: 0,
                failed: 0,
                errors: []
            };

            for (const syncRecord of connectedTherapists) {
                try {
                    await this.fullSync(syncRecord.therapistId);
                    results.successful++;
                    console.log(`Periodic sync successful for therapist ${syncRecord.therapistId}`);
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        therapistId: syncRecord.therapistId,
                        error: error.message
                    });
                    console.error(`Periodic sync failed for therapist ${syncRecord.therapistId}:`, error);
                }
            }

            console.log(`Periodic sync completed: ${results.successful} successful, ${results.failed} failed`);
            return results;
        } catch (error) {
            console.error('Error in periodic sync for all therapists:', error);
            throw error;
        }
    }

    /**
     * חידוש webhooks לכל המטפלות
     * @returns {Object} Renewal statistics
     */
    async renewAllWebhooks() {
        try {
            console.log('Starting webhook renewal for all connected therapists');

            const connectedTherapists = await GoogleCalendarSync.find({
                syncEnabled: true,
                webhookChannelId: { $exists: true },
                webhookResourceId: { $exists: true }
            });

            const results = {
                totalTherapists: connectedTherapists.length,
                renewed: 0,
                skipped: 0,
                failed: 0,
                errors: []
            };

            for (const syncRecord of connectedTherapists) {
                try {
                    const result = await this.renewWebhook(syncRecord.therapistId);

                    if (result.success) {
                        if (result.message === 'Webhook renewed successfully') {
                            results.renewed++;
                        } else {
                            results.skipped++;
                        }
                    }
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        therapistId: syncRecord.therapistId,
                        error: error.message
                    });
                    console.error(`Webhook renewal failed for therapist ${syncRecord.therapistId}:`, error);
                }
            }

            console.log(`Webhook renewal completed: ${results.renewed} renewed, ${results.skipped} skipped, ${results.failed} failed`);
            return results;
        } catch (error) {
            console.error('Error renewing all webhooks:', error);
            throw error;
        }
    }

    /**
     * retry פגישות שנכשלו בסנכרון
     * @param {number} maxRetries - מספר מקסימלי של ניסיונות
     * @returns {Object} Retry statistics
     */
    async retryFailedSyncs(maxRetries = 3) {
        try {
            console.log('Starting retry for failed syncs');

            // מציאת פגישות שלא סונכרנו
            const failedAppointments = await Appointment.find({
                googleCalendarSynced: false,
                status: { $in: ['pending', 'confirmed'] },
                createdAt: { $gte: moment().subtract(7, 'days').toDate() } // רק פגישות מהשבוע האחרון
            }).populate('therapistId', 'googleCalendarConnected');

            const results = {
                totalAppointments: failedAppointments.length,
                retried: 0,
                successful: 0,
                stillFailed: 0,
                errors: []
            };

            for (const appointment of failedAppointments) {
                try {
                    if (!appointment.therapistId.googleCalendarConnected) {
                        continue; // דלג אם המטפלת לא מחוברת
                    }

                    results.retried++;
                    const result = await this.syncAppointmentToGoogle(appointment._id);

                    if (result.success) {
                        results.successful++;
                    } else {
                        results.stillFailed++;
                        results.errors.push({
                            appointmentId: appointment._id,
                            error: result.error || result.reason
                        });
                    }
                } catch (error) {
                    results.stillFailed++;
                    results.errors.push({
                        appointmentId: appointment._id,
                        error: error.message
                    });
                }
            }

            console.log(`Retry completed: ${results.successful} successful, ${results.stillFailed} still failed`);
            return results;
        } catch (error) {
            console.error('Error retrying failed syncs:', error);
            throw error;
        }
    }

    /**
     * שמירת שגיאת סנכרון
     * @param {string} therapistId - ID של המטפלת
     * @param {string} errorMessage - הודעת שגיאה
     * @param {string} syncType - סוג הסנכרון
     */
    async saveSyncError(therapistId, errorMessage, syncType = 'unknown') {
        try {
            if (!therapistId) return;

            await GoogleCalendarSync.findOneAndUpdate(
                { therapistId },
                {
                    $push: {
                        syncErrors: {
                            error: errorMessage,
                            occurredAt: new Date(),
                            syncType,
                            resolved: false
                        }
                    }
                }
            );
        } catch (error) {
            console.error('Error saving sync error:', error);
        }
    }

    /**
     * ניקוי שגיאות ישנות
     * @param {string} therapistId - ID של המטפלת
     * @param {number} daysOld - מספר ימים לשמירת שגיאות
     */
    async clearOldSyncErrors(therapistId, daysOld = 7) {
        try {
            const cutoffDate = moment().subtract(daysOld, 'days').toDate();

            await GoogleCalendarSync.findOneAndUpdate(
                { therapistId },
                {
                    $pull: {
                        syncErrors: {
                            occurredAt: { $lt: cutoffDate }
                        }
                    }
                }
            );
        } catch (error) {
            console.error('Error clearing old sync errors:', error);
        }
    }

    /**
     * קבלת סטטיסטיקות סנכרון
     * @param {string} therapistId - ID של המטפלת
     * @returns {Object} Sync statistics
     */
    async getSyncStats(therapistId) {
        try {
            const syncRecord = await GoogleCalendarSync.findOne({ therapistId });

            if (!syncRecord) {
                return {
                    connected: false,
                    message: 'Not connected to Google Calendar'
                };
            }

            // ספירת פגישות שלא סונכרנו
            const unsyncedCount = await Appointment.countDocuments({
                therapistId,
                googleCalendarSynced: false,
                status: { $in: ['pending', 'confirmed'] }
            });

            // ספירת שגיאות לא פתורות
            const unresolvedErrors = syncRecord.syncErrors.filter(error => !error.resolved).length;

            return {
                connected: syncRecord.syncEnabled,
                syncDirection: syncRecord.syncDirection,
                privacyLevel: syncRecord.privacyLevel,
                lastSyncedAt: syncRecord.lastSyncedAt,
                webhookActive: syncRecord.webhookExpiration > new Date(),
                webhookExpiration: syncRecord.webhookExpiration,
                unsyncedAppointments: unsyncedCount,
                unresolvedErrors,
                totalSyncErrors: syncRecord.syncErrors.length
            };
        } catch (error) {
            console.error('Error getting sync stats:', error);
            throw error;
        }
    }
}

module.exports = new SyncService();
