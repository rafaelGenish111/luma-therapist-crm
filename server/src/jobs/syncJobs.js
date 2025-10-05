const cron = require('node-cron');
const syncService = require('../services/sync.service');
const GoogleCalendarSync = require('../models/GoogleCalendarSync');
const Appointment = require('../models/Appointment');

/**
 * Sync Jobs
 * Background jobs לסנכרון אוטומטי עם Google Calendar
 */
class SyncJobs {
    constructor() {
        this.jobs = new Map();
        this.isRunning = false;
    }

    /**
     * התחלת כל ה-jobs
     */
    start() {
        if (this.isRunning) {
            console.log('Sync jobs are already running');
            return;
        }

        console.log('Starting sync jobs...');

        // Job 1: סנכרון תקופתי כל 10 דקות
        this.startPeriodicSyncJob();

        // Job 2: חידוש webhooks כל יום ב-2 AM
        this.startWebhookRenewalJob();

        // Job 3: retry פגישות שנכשלו כל שעה
        this.startFailedSyncRetryJob();

        // Job 4: ניקוי שגיאות ישנות כל יום ב-3 AM
        this.startCleanupJob();

        this.isRunning = true;
        console.log('All sync jobs started successfully');
    }

    /**
     * עצירת כל ה-jobs
     */
    stop() {
        if (!this.isRunning) {
            console.log('Sync jobs are not running');
            return;
        }

        console.log('Stopping sync jobs...');

        this.jobs.forEach((job, name) => {
            job.stop();
            console.log(`Stopped job: ${name}`);
        });

        this.jobs.clear();
        this.isRunning = false;
        console.log('All sync jobs stopped');
    }

    /**
     * התחלת סנכרון תקופתי
     * כל 10 דקות
     */
    startPeriodicSyncJob() {
        const job = cron.schedule('*/10 * * * *', async () => {
            try {
                console.log('Starting periodic sync job...');
                
                const results = await syncService.periodicSyncAllTherapists();
                
                console.log(`Periodic sync completed: ${results.successful}/${results.totalTherapists} therapists synced successfully`);
                
                if (results.failed > 0) {
                    console.error(`Periodic sync failed for ${results.failed} therapists:`, results.errors);
                }
            } catch (error) {
                console.error('Error in periodic sync job:', error);
            }
        }, {
            scheduled: false,
            timezone: 'Asia/Jerusalem'
        });

        this.jobs.set('periodicSync', job);
        job.start();
        console.log('Periodic sync job started (every 10 minutes)');
    }

    /**
     * התחלת חידוש webhooks
     * כל יום ב-2:00 AM
     */
    startWebhookRenewalJob() {
        const job = cron.schedule('0 2 * * *', async () => {
            try {
                console.log('Starting webhook renewal job...');
                
                const results = await syncService.renewAllWebhooks();
                
                console.log(`Webhook renewal completed: ${results.renewed} renewed, ${results.skipped} skipped, ${results.failed} failed`);
                
                if (results.failed > 0) {
                    console.error(`Webhook renewal failed for ${results.failed} therapists:`, results.errors);
                }
            } catch (error) {
                console.error('Error in webhook renewal job:', error);
            }
        }, {
            scheduled: false,
            timezone: 'Asia/Jerusalem'
        });

        this.jobs.set('webhookRenewal', job);
        job.start();
        console.log('Webhook renewal job started (daily at 2:00 AM)');
    }

    /**
     * התחלת retry פגישות שנכשלו
     * כל שעה
     */
    startFailedSyncRetryJob() {
        const job = cron.schedule('0 * * * *', async () => {
            try {
                console.log('Starting failed sync retry job...');
                
                const results = await syncService.retryFailedSyncs(3);
                
                console.log(`Failed sync retry completed: ${results.successful}/${results.retried} appointments synced successfully`);
                
                if (results.stillFailed > 0) {
                    console.error(`Still ${results.stillFailed} appointments failed to sync after retry`);
                }
            } catch (error) {
                console.error('Error in failed sync retry job:', error);
            }
        }, {
            scheduled: false,
            timezone: 'Asia/Jerusalem'
        });

        this.jobs.set('failedSyncRetry', job);
        job.start();
        console.log('Failed sync retry job started (hourly)');
    }

    /**
     * התחלת ניקוי שגיאות ישנות
     * כל יום ב-3:00 AM
     */
    startCleanupJob() {
        const job = cron.schedule('0 3 * * *', async () => {
            try {
                console.log('Starting cleanup job...');
                
                // ניקוי שגיאות ישנות לכל המטפלות
                const connectedTherapists = await GoogleCalendarSync.find({
                    syncEnabled: true
                });

                let cleanedCount = 0;
                for (const syncRecord of connectedTherapists) {
                    try {
                        await syncService.clearOldSyncErrors(syncRecord.therapistId, 7);
                        cleanedCount++;
                    } catch (error) {
                        console.error(`Error cleaning sync errors for therapist ${syncRecord.therapistId}:`, error);
                    }
                }

                console.log(`Cleanup completed: cleaned sync errors for ${cleanedCount} therapists`);
            } catch (error) {
                console.error('Error in cleanup job:', error);
            }
        }, {
            scheduled: false,
            timezone: 'Asia/Jerusalem'
        });

        this.jobs.set('cleanup', job);
        job.start();
        console.log('Cleanup job started (daily at 3:00 AM)');
    }

    /**
     * התחלת job מותאם אישית
     * @param {string} name - שם ה-job
     * @param {string} schedule - לוח זמנים (cron format)
     * @param {Function} task - פונקציה להרצה
     */
    startCustomJob(name, schedule, task) {
        if (this.jobs.has(name)) {
            console.log(`Job ${name} already exists`);
            return;
        }

        const job = cron.schedule(schedule, async () => {
            try {
                console.log(`Starting custom job: ${name}`);
                await task();
                console.log(`Custom job ${name} completed successfully`);
            } catch (error) {
                console.error(`Error in custom job ${name}:`, error);
            }
        }, {
            scheduled: false,
            timezone: 'Asia/Jerusalem'
        });

        this.jobs.set(name, job);
        job.start();
        console.log(`Custom job ${name} started with schedule: ${schedule}`);
    }

    /**
     * עצירת job ספציפי
     * @param {string} name - שם ה-job
     */
    stopJob(name) {
        const job = this.jobs.get(name);
        if (job) {
            job.stop();
            this.jobs.delete(name);
            console.log(`Job ${name} stopped`);
        } else {
            console.log(`Job ${name} not found`);
        }
    }

    /**
     * קבלת סטטוס כל ה-jobs
     * @returns {Object} Jobs status
     */
    getJobsStatus() {
        const status = {
            isRunning: this.isRunning,
            jobs: {}
        };

        this.jobs.forEach((job, name) => {
            status.jobs[name] = {
                running: job.running,
                scheduled: job.scheduled
            };
        });

        return status;
    }

    /**
     * הרצת job מיד (לא לפי לוח זמנים)
     * @param {string} jobName - שם ה-job
     */
    async runJobNow(jobName) {
        try {
            console.log(`Running job ${jobName} immediately...`);

            switch (jobName) {
                case 'periodicSync':
                    await syncService.periodicSyncAllTherapists();
                    break;
                
                case 'webhookRenewal':
                    await syncService.renewAllWebhooks();
                    break;
                
                case 'failedSyncRetry':
                    await syncService.retryFailedSyncs();
                    break;
                
                case 'cleanup':
                    // ניקוי שגיאות ישנות
                    const connectedTherapists = await GoogleCalendarSync.find({
                        syncEnabled: true
                    });
                    
                    for (const syncRecord of connectedTherapists) {
                        await syncService.clearOldSyncErrors(syncRecord.therapistId, 7);
                    }
                    break;
                
                default:
                    throw new Error(`Unknown job: ${jobName}`);
            }

            console.log(`Job ${jobName} completed successfully`);
        } catch (error) {
            console.error(`Error running job ${jobName}:`, error);
            throw error;
        }
    }

    /**
     * בדיקת תקינות כל ה-jobs
     * @returns {Object} Health check results
     */
    async healthCheck() {
        const health = {
            status: 'healthy',
            jobs: {},
            errors: []
        };

        try {
            // בדיקת סטטוס כל job
            this.jobs.forEach((job, name) => {
                health.jobs[name] = {
                    running: job.running,
                    scheduled: job.scheduled,
                    status: job.running ? 'healthy' : 'stopped'
                };
            });

            // בדיקת מספר מטפלות מחוברות
            const connectedCount = await GoogleCalendarSync.countDocuments({
                syncEnabled: true
            });

            // בדיקת מספר פגישות שלא סונכרנו
            const unsyncedCount = await Appointment.countDocuments({
                googleCalendarSynced: false,
                status: { $in: ['pending', 'confirmed'] },
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // שבוע אחרון
            });

            health.metrics = {
                connectedTherapists: connectedCount,
                unsyncedAppointments: unsyncedCount
            };

            // אם יש יותר מדי פגישות שלא סונכרנו, זה יכול להצביע על בעיה
            if (unsyncedCount > 100) {
                health.status = 'warning';
                health.errors.push(`High number of unsynced appointments: ${unsyncedCount}`);
            }

        } catch (error) {
            health.status = 'unhealthy';
            health.errors.push(`Health check failed: ${error.message}`);
        }

        return health;
    }
}

module.exports = new SyncJobs();
