const { google } = require('googleapis');
const moment = require('moment');
const Appointment = require('../models/Appointment');
const BlockedTime = require('../models/BlockedTime');
const GoogleCalendarSync = require('../models/GoogleCalendarSync');
const Therapist = require('../models/Therapist');
const googleAuthService = require('./googleAuth.service');

class GoogleCalendarService {
    constructor() {
        this.calendar = null;
    }

    /**
     * אתחול Google Calendar API
     * @param {string} therapistId - ID של המטפלת
     */
    async initCalendar(therapistId) {
        try {
            const auth = await googleAuthService.getConfiguredClient(therapistId);
            this.calendar = google.calendar({ version: 'v3', auth });
            return this.calendar;
        } catch (error) {
            console.error('Error initializing Google Calendar:', error);
            throw new Error('Failed to initialize Google Calendar');
        }
    }

    /**
     * סנכרון פגישה ל-Google Calendar
     * @param {string} appointmentId - ID של הפגישה
     * @returns {Object} Sync result
     */
    async syncAppointmentToGoogle(appointmentId) {
        try {
            const appointment = await Appointment.findById(appointmentId)
                .populate('clientId', 'firstName lastName email phone')
                .populate('therapistId', 'firstName lastName email');

            if (!appointment) {
                throw new Error('Appointment not found');
            }

            const syncRecord = await GoogleCalendarSync.findOne({ 
                therapistId: appointment.therapistId._id 
            });

            if (!syncRecord || !syncRecord.syncEnabled) {
                return { success: false, reason: 'Google Calendar not connected' };
            }

            await this.initCalendar(appointment.therapistId._id);

            let result;
            if (appointment.googleEventId) {
                // עדכון event קיים
                result = await this.updateGoogleEvent(appointment.googleEventId, appointment, this.calendar);
            } else {
                // יצירת event חדש
                result = await this.createGoogleEvent(appointment, this.calendar);
            }

            if (result.success) {
                // עדכון googleEventId בדאטה בייס
                await Appointment.findByIdAndUpdate(appointmentId, {
                    googleEventId: result.eventId,
                    googleCalendarSynced: true
                });

                // עדכון זמן סנכרון אחרון
                await GoogleCalendarSync.findOneAndUpdate(
                    { therapistId: appointment.therapistId._id },
                    { lastSyncedAt: new Date() }
                );
            }

            return result;
        } catch (error) {
            console.error('Error syncing appointment to Google:', error);
            
            // שמירת שגיאה
            await this.saveSyncError(appointment.therapistId._id, error.message);
            
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
                throw new Error('Google Calendar not connected');
            }

            await this.initCalendar(therapistId);

            // קבלת events מ-Google (3 חודשים אחרונים ועד שנה קדימה)
            const startDate = moment().subtract(3, 'months').toISOString();
            const endDate = moment().add(1, 'year').toISOString();

            const events = await this.getEventsByDateRange(this.calendar, startDate, endDate);
            
            const stats = {
                synced: 0,
                created: 0,
                updated: 0,
                deleted: 0,
                errors: []
            };

            // עיבוד כל event
            for (const event of events) {
                try {
                    const result = await this.processGoogleEvent(event, therapistId);
                    stats[result.action]++;
                    stats.synced++;
                } catch (error) {
                    stats.errors.push({
                        eventId: event.id,
                        error: error.message
                    });
                }
            }

            // עדכון זמן סנכרון אחרון
            await GoogleCalendarSync.findOneAndUpdate(
                { therapistId },
                { lastSyncedAt: new Date() }
            );

            return stats;
        } catch (error) {
            console.error('Error syncing from Google to local:', error);
            await this.saveSyncError(therapistId, error.message);
            throw error;
        }
    }

    /**
     * יצירת Google Event
     * @param {Object} appointment - Appointment object
     * @param {Object} calendar - Google Calendar instance
     * @returns {Object} Result with event ID
     */
    async createGoogleEvent(appointment, calendar) {
        try {
            const event = this.buildGoogleEventObject(appointment);
            
            const response = await calendar.events.insert({
                calendarId: 'primary',
                resource: event,
                sendUpdates: 'none' // לא לשלוח עדכונים למשתתפים
            });

            return {
                success: true,
                eventId: response.data.id,
                event: response.data
            };
        } catch (error) {
            console.error('Error creating Google event:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * עדכון Google Event
     * @param {string} googleEventId - Google Event ID
     * @param {Object} appointment - Appointment object
     * @param {Object} calendar - Google Calendar instance
     * @returns {Object} Result
     */
    async updateGoogleEvent(googleEventId, appointment, calendar) {
        try {
            const event = this.buildGoogleEventObject(appointment);
            
            const response = await calendar.events.update({
                calendarId: 'primary',
                eventId: googleEventId,
                resource: event,
                sendUpdates: 'none'
            });

            return {
                success: true,
                eventId: googleEventId,
                event: response.data
            };
        } catch (error) {
            console.error('Error updating Google event:', error);
            
            // אם ה-event נמחק ב-Google, נצטרך ליצור חדש
            if (error.message.includes('Not Found')) {
                return await this.createGoogleEvent(appointment, calendar);
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * מחיקת Google Event
     * @param {string} googleEventId - Google Event ID
     * @param {Object} calendar - Google Calendar instance
     * @returns {Object} Result
     */
    async deleteGoogleEvent(googleEventId, calendar) {
        try {
            await calendar.events.delete({
                calendarId: 'primary',
                eventId: googleEventId,
                sendUpdates: 'none'
            });

            return { success: true };
        } catch (error) {
            console.error('Error deleting Google event:', error);
            
            // אם ה-event כבר נמחק, זה בסדר
            if (error.message.includes('Not Found')) {
                return { success: true };
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * קבלת events בטווח תאריכים
     * @param {Object} calendar - Google Calendar instance
     * @param {string} startDate - Start date (ISO string)
     * @param {string} endDate - End date (ISO string)
     * @returns {Array} Events array
     */
    async getEventsByDateRange(calendar, startDate, endDate) {
        try {
            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: startDate,
                timeMax: endDate,
                singleEvents: true,
                orderBy: 'startTime',
                maxResults: 1000
            });

            return response.data.items || [];
        } catch (error) {
            console.error('Error getting events by date range:', error);
            throw error;
        }
    }

    /**
     * בניית Google Event Object
     * @param {Object} appointment - Appointment object
     * @returns {Object} Google Event object
     */
    buildGoogleEventObject(appointment) {
        const startTime = moment(appointment.startTime || appointment.date);
        const endTime = moment(startTime).add(appointment.duration, 'minutes');

        // קביעת רמת פרטיות
        const syncRecord = appointment.therapistId?.googleCalendarSync;
        const privacyLevel = syncRecord?.privacyLevel || 'generic';

        let summary, description;

        switch (privacyLevel) {
            case 'busy-only':
                summary = 'פגישה';
                description = '';
                break;
            case 'generic':
                summary = `${appointment.serviceType} - פגישה`;
                description = appointment.notes || '';
                break;
            case 'detailed':
                summary = `${appointment.clientName || 'לקוח'} - ${appointment.serviceType}`;
                description = `
                    סוג שירות: ${appointment.serviceType}
                    מיקום: ${appointment.location}
                    ${appointment.notes ? `הערות: ${appointment.notes}` : ''}
                `.trim();
                break;
        }

        const event = {
            summary,
            description,
            start: {
                dateTime: startTime.toISOString(),
                timeZone: 'Asia/Jerusalem'
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: 'Asia/Jerusalem'
            },
            transparency: 'opaque', // לא "transparent" (זמן פנוי)
            visibility: 'private'
        };

        // הוספת מיקום
        if (appointment.location === 'online' && appointment.meetingUrl) {
            event.location = appointment.meetingUrl;
        } else if (appointment.location === 'clinic') {
            event.location = 'קליניקה';
        } else if (appointment.location === 'home') {
            event.location = 'בית הלקוח';
        }

        // הוספת attendees (רק אם רמת פרטיות מפורטת)
        if (privacyLevel === 'detailed' && appointment.clientId?.email) {
            event.attendees = [{
                email: appointment.clientId.email,
                displayName: appointment.clientName || 'לקוח',
                responseStatus: 'needsAction'
            }];
        }

        return event;
    }

    /**
     * עיבוד Google Event
     * @param {Object} event - Google Event
     * @param {string} therapistId - Therapist ID
     * @returns {Object} Processing result
     */
    async processGoogleEvent(event, therapistId) {
        try {
            // בדיקה אם זה event של פגישה קיימת
            const existingAppointment = await Appointment.findOne({
                googleEventId: event.id,
                therapistId
            });

            if (existingAppointment) {
                // עדכון פגישה קיימת
                await this.updateAppointmentFromGoogleEvent(existingAppointment, event);
                return { action: 'updated' };
            } else {
                // יצירת blocked time חדש
                await this.createBlockedTimeFromGoogleEvent(event, therapistId);
                return { action: 'created' };
            }
        } catch (error) {
            console.error('Error processing Google event:', error);
            throw error;
        }
    }

    /**
     * עדכון פגישה מ-Google Event
     * @param {Object} appointment - Appointment object
     * @param {Object} event - Google Event
     */
    async updateAppointmentFromGoogleEvent(appointment, event) {
        try {
            const startTime = moment(event.start.dateTime || event.start.date);
            const endTime = moment(event.end.dateTime || event.end.date);
            const duration = endTime.diff(startTime, 'minutes');

            await Appointment.findByIdAndUpdate(appointment._id, {
                startTime: startTime.toDate(),
                endTime: endTime.toDate(),
                duration,
                notes: event.description || appointment.notes
            });
        } catch (error) {
            console.error('Error updating appointment from Google event:', error);
            throw error;
        }
    }

    /**
     * יצירת Blocked Time מ-Google Event
     * @param {Object} event - Google Event
     * @param {string} therapistId - Therapist ID
     */
    async createBlockedTimeFromGoogleEvent(event, therapistId) {
        try {
            const startTime = moment(event.start.dateTime || event.start.date);
            const endTime = moment(event.end.dateTime || event.end.date);

            // בדיקה אם כבר קיים blocked time עם אותו Google Event ID
            const existingBlockedTime = await BlockedTime.findOne({
                'metadata.googleEventId': event.id,
                therapistId
            });

            if (existingBlockedTime) {
                return; // כבר קיים
            }

            await BlockedTime.create({
                therapistId,
                startTime: startTime.toDate(),
                endTime: endTime.toDate(),
                reason: 'other',
                notes: `יובא מ-Google Calendar: ${event.summary || 'אירוע'}`,
                metadata: {
                    googleEventId: event.id,
                    importedFromGoogle: true
                }
            });
        } catch (error) {
            console.error('Error creating blocked time from Google event:', error);
            throw error;
        }
    }

    /**
     * הגדרת Webhook
     * @param {string} therapistId - Therapist ID
     * @returns {Object} Webhook details
     */
    async setupWebhook(therapistId) {
        try {
            await this.initCalendar(therapistId);

            const channelId = `channel_${therapistId}_${Date.now()}`;
            const webhookUrl = `${process.env.SERVER_URL}/api/calendar/webhook`;
            const expiration = Date.now() + (7 * 24 * 60 * 60 * 1000); // שבוע

            const response = await this.calendar.events.watch({
                calendarId: 'primary',
                resource: {
                    id: channelId,
                    type: 'web_hook',
                    address: webhookUrl,
                    expiration: expiration.toString()
                }
            });

            // שמירת webhook details בדאטה בייס
            await GoogleCalendarSync.findOneAndUpdate(
                { therapistId },
                {
                    webhookChannelId: channelId,
                    webhookResourceId: response.data.resourceId,
                    webhookExpiration: new Date(expiration)
                }
            );

            return {
                success: true,
                channelId,
                resourceId: response.data.resourceId,
                expiration: new Date(expiration)
            };
        } catch (error) {
            console.error('Error setting up webhook:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * טיפול ב-Webhook Notification
     * @param {string} channelId - Channel ID
     * @param {string} resourceId - Resource ID
     */
    async handleWebhookNotification(channelId, resourceId) {
        try {
            // מציאת המטפלת לפי channel ID
            const syncRecord = await GoogleCalendarSync.findOne({
                webhookChannelId: channelId,
                webhookResourceId: resourceId
            });

            if (!syncRecord) {
                console.log(`No therapist found for channel ${channelId}`);
                return;
            }

            console.log(`Processing webhook notification for therapist ${syncRecord.therapistId}`);

            // סנכרון incremental
            await this.syncFromGoogleToLocal(syncRecord.therapistId);

            console.log(`Webhook processed successfully for therapist ${syncRecord.therapistId}`);
        } catch (error) {
            console.error('Error handling webhook notification:', error);
            throw error;
        }
    }

    /**
     * שמירת שגיאת סנכרון
     * @param {string} therapistId - Therapist ID
     * @param {string} errorMessage - Error message
     */
    async saveSyncError(therapistId, errorMessage) {
        try {
            await GoogleCalendarSync.findOneAndUpdate(
                { therapistId },
                {
                    $push: {
                        syncErrors: {
                            error: errorMessage,
                            occurredAt: new Date(),
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
     * @param {string} therapistId - Therapist ID
     */
    async clearOldSyncErrors(therapistId) {
        try {
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            await GoogleCalendarSync.findOneAndUpdate(
                { therapistId },
                {
                    $pull: {
                        syncErrors: {
                            occurredAt: { $lt: oneWeekAgo }
                        }
                    }
                }
            );
        } catch (error) {
            console.error('Error clearing old sync errors:', error);
        }
    }
}

module.exports = new GoogleCalendarService();
