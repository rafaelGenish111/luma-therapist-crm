const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const Client = require('../models/Client');
const Therapist = require('../models/Therapist');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

/**
 * Reminder Jobs
 * מערכת תזכורות אוטומטיות לפגישות
 */
class ReminderJobs {
    constructor() {
        this.jobs = new Map();
        this.isRunning = false;
    }

    /**
     * התחלת כל ה-jobs
     */
    start() {
        if (this.isRunning) {
            console.log('Reminder jobs are already running');
            return;
        }

        console.log('Starting reminder jobs...');

        // Job 1: תזכורת יומית (24 שעות לפני הפגישה)
        this.startDailyReminderJob();

        // Job 2: תזכורת שעתית (שעה לפני הפגישה)
        this.startHourlyReminderJob();

        // Job 3: Follow-up אחרי פגישה
        this.startFollowUpJob();

        // Job 4: תזכורות מותאמות אישית
        this.startCustomReminderJob();

        this.isRunning = true;
        console.log('All reminder jobs started successfully');
    }

    /**
     * עצירת כל ה-jobs
     */
    stop() {
        if (!this.isRunning) {
            console.log('Reminder jobs are not running');
            return;
        }

        console.log('Stopping reminder jobs...');

        this.jobs.forEach((job, name) => {
            job.stop();
            console.log(`Stopped job: ${name}`);
        });

        this.jobs.clear();
        this.isRunning = false;
        console.log('All reminder jobs stopped');
    }

    /**
     * תזכורת יומית - כל יום ב-9:00 AM
     */
    startDailyReminderJob() {
        const job = cron.schedule('0 9 * * *', async () => {
            try {
                console.log('Starting daily reminder job...');
                
                const results = await this.sendDailyReminders();
                
                console.log(`Daily reminder job completed: ${results.sent}/${results.total} reminders sent`);
                
                if (results.errors.length > 0) {
                    console.error(`Daily reminder job errors:`, results.errors);
                }
            } catch (error) {
                console.error('Error in daily reminder job:', error);
            }
        }, {
            scheduled: false,
            timezone: 'Asia/Jerusalem'
        });

        this.jobs.set('dailyReminder', job);
        job.start();
        console.log('Daily reminder job started (daily at 9:00 AM)');
    }

    /**
     * תזכורת שעתית - כל שעה
     */
    startHourlyReminderJob() {
        const job = cron.schedule('0 * * * *', async () => {
            try {
                console.log('Starting hourly reminder job...');
                
                const results = await this.sendHourlyReminders();
                
                console.log(`Hourly reminder job completed: ${results.sent}/${results.total} reminders sent`);
                
                if (results.errors.length > 0) {
                    console.error(`Hourly reminder job errors:`, results.errors);
                }
            } catch (error) {
                console.error('Error in hourly reminder job:', error);
            }
        }, {
            scheduled: false,
            timezone: 'Asia/Jerusalem'
        });

        this.jobs.set('hourlyReminder', job);
        job.start();
        console.log('Hourly reminder job started (hourly)');
    }

    /**
     * Follow-up job - כל 6 שעות
     */
    startFollowUpJob() {
        const job = cron.schedule('0 */6 * * *', async () => {
            try {
                console.log('Starting follow-up job...');
                
                const results = await this.sendFollowUpEmails();
                
                console.log(`Follow-up job completed: ${results.sent}/${results.total} follow-ups sent`);
                
                if (results.errors.length > 0) {
                    console.error(`Follow-up job errors:`, results.errors);
                }
            } catch (error) {
                console.error('Error in follow-up job:', error);
            }
        }, {
            scheduled: false,
            timezone: 'Asia/Jerusalem'
        });

        this.jobs.set('followUp', job);
        job.start();
        console.log('Follow-up job started (every 6 hours)');
    }

    /**
     * תזכורות מותאמות אישית - כל 30 דקות
     */
    startCustomReminderJob() {
        const job = cron.schedule('*/30 * * * *', async () => {
            try {
                console.log('Starting custom reminder job...');
                
                const results = await this.sendCustomReminders();
                
                console.log(`Custom reminder job completed: ${results.sent}/${results.total} custom reminders sent`);
                
                if (results.errors.length > 0) {
                    console.error(`Custom reminder job errors:`, results.errors);
                }
            } catch (error) {
                console.error('Error in custom reminder job:', error);
            }
        }, {
            scheduled: false,
            timezone: 'Asia/Jerusalem'
        });

        this.jobs.set('customReminder', job);
        job.start();
        console.log('Custom reminder job started (every 30 minutes)');
    }

    /**
     * שליחת תזכורות יומיות (24 שעות לפני הפגישה)
     */
    async sendDailyReminders() {
        try {
            const tomorrow = moment().add(1, 'day').startOf('day');
            const tomorrowEnd = moment().add(1, 'day').endOf('day');

            // מציאת פגישות למחר שטרם נשלחה תזכורת 24h
            const appointments = await Appointment.find({
                startTime: {
                    $gte: tomorrow.toDate(),
                    $lte: tomorrowEnd.toDate()
                },
                status: 'confirmed',
                'remindersSent.type': { $ne: '24h' }
            }).populate('clientId').populate('therapistId');

            const results = {
                total: appointments.length,
                sent: 0,
                errors: []
            };

            for (const appointment of appointments) {
                try {
                    // בדיקת הגדרות תזכורות של המטפלת
                    const therapist = appointment.therapistId;
                    if (!therapist.reminderSettings?.enableReminders || !therapist.reminderSettings?.reminder24h) {
                        continue;
                    }

                    // שליחת תזכורת
                    await emailService.sendAppointmentReminder(
                        appointment,
                        appointment.clientId,
                        therapist,
                        '24h'
                    );

                    // עדכון remindersSent
                    appointment.remindersSent.push({
                        type: '24h',
                        sentAt: new Date()
                    });
                    await appointment.save();

                    results.sent++;
                    logger.info(`24h reminder sent for appointment ${appointment._id}`);
                } catch (error) {
                    results.errors.push({
                        appointmentId: appointment._id,
                        error: error.message
                    });
                    logger.error(`Failed to send 24h reminder for appointment ${appointment._id}:`, error);
                }
            }

            return results;
        } catch (error) {
            logger.error('Error in sendDailyReminders:', error);
            throw error;
        }
    }

    /**
     * שליחת תזכורות שעתיות (שעה לפני הפגישה)
     */
    async sendHourlyReminders() {
        try {
            const oneHourFromNow = moment().add(1, 'hour');
            const twoHoursFromNow = moment().add(2, 'hours');

            // מציאת פגישות בעוד שעה-שעתיים שטרם נשלחה תזכורת 1h
            const appointments = await Appointment.find({
                startTime: {
                    $gte: oneHourFromNow.toDate(),
                    $lte: twoHoursFromNow.toDate()
                },
                status: 'confirmed',
                'remindersSent.type': { $ne: '1h' }
            }).populate('clientId').populate('therapistId');

            const results = {
                total: appointments.length,
                sent: 0,
                errors: []
            };

            for (const appointment of appointments) {
                try {
                    // בדיקת הגדרות תזכורות של המטפלת
                    const therapist = appointment.therapistId;
                    if (!therapist.reminderSettings?.enableReminders || !therapist.reminderSettings?.reminder1h) {
                        continue;
                    }

                    // שליחת תזכורת
                    await emailService.sendAppointmentReminder(
                        appointment,
                        appointment.clientId,
                        therapist,
                        '1h'
                    );

                    // עדכון remindersSent
                    appointment.remindersSent.push({
                        type: '1h',
                        sentAt: new Date()
                    });
                    await appointment.save();

                    results.sent++;
                    logger.info(`1h reminder sent for appointment ${appointment._id}`);
                } catch (error) {
                    results.errors.push({
                        appointmentId: appointment._id,
                        error: error.message
                    });
                    logger.error(`Failed to send 1h reminder for appointment ${appointment._id}:`, error);
                }
            }

            return results;
        } catch (error) {
            logger.error('Error in sendHourlyReminders:', error);
            throw error;
        }
    }

    /**
     * שליחת Follow-up emails אחרי פגישות
     */
    async sendFollowUpEmails() {
        try {
            const yesterday = moment().subtract(1, 'day').startOf('day');
            const yesterdayEnd = moment().subtract(1, 'day').endOf('day');

            // מציאת פגישות שהסתיימו ב-24 שעות האחרונות
            const appointments = await Appointment.find({
                startTime: {
                    $gte: yesterday.toDate(),
                    $lte: yesterdayEnd.toDate()
                },
                status: 'completed',
                followedUp: { $ne: true }
            }).populate('clientId').populate('therapistId');

            const results = {
                total: appointments.length,
                sent: 0,
                errors: []
            };

            for (const appointment of appointments) {
                try {
                    // בדיקת הגדרות follow-up של המטפלת
                    const therapist = appointment.therapistId;
                    if (!therapist.reminderSettings?.followUpEnabled) {
                        continue;
                    }

                    // שליחת follow-up email
                    await this.sendFollowUpEmail(appointment, appointment.clientId, therapist);

                    // סימון כ-followed up
                    appointment.followedUp = true;
                    appointment.followUpSentAt = new Date();
                    await appointment.save();

                    results.sent++;
                    logger.info(`Follow-up email sent for appointment ${appointment._id}`);
                } catch (error) {
                    results.errors.push({
                        appointmentId: appointment._id,
                        error: error.message
                    });
                    logger.error(`Failed to send follow-up email for appointment ${appointment._id}:`, error);
                }
            }

            return results;
        } catch (error) {
            logger.error('Error in sendFollowUpEmails:', error);
            throw error;
        }
    }

    /**
     * שליחת תזכורות מותאמות אישית
     */
    async sendCustomReminders() {
        try {
            const now = moment();
            const nextHour = moment().add(1, 'hour');

            // מציאת פגישות עם תזכורות מותאמות אישית
            const appointments = await Appointment.find({
                startTime: {
                    $gte: now.toDate(),
                    $lte: nextHour.toDate()
                },
                status: 'confirmed',
                'customReminders': { $exists: true, $ne: [] }
            }).populate('clientId').populate('therapistId');

            const results = {
                total: appointments.length,
                sent: 0,
                errors: []
            };

            for (const appointment of appointments) {
                try {
                    const therapist = appointment.therapistId;
                    if (!therapist.reminderSettings?.enableReminders) {
                        continue;
                    }

                    // בדיקת תזכורות מותאמות אישית
                    for (const customReminder of appointment.customReminders) {
                        const reminderTime = moment(appointment.startTime).subtract(customReminder.hoursBefore, 'hours');
                        
                        if (moment().isBetween(reminderTime.subtract(30, 'minutes'), reminderTime.add(30, 'minutes'))) {
                            // שליחת תזכורת מותאמת אישית
                            await emailService.sendAppointmentReminder(
                                appointment,
                                appointment.clientId,
                                therapist,
                                'custom'
                            );

                            // עדכון remindersSent
                            appointment.remindersSent.push({
                                type: 'custom',
                                hoursBefore: customReminder.hoursBefore,
                                sentAt: new Date()
                            });
                            await appointment.save();

                            results.sent++;
                            logger.info(`Custom reminder sent for appointment ${appointment._id} (${customReminder.hoursBefore}h before)`);
                        }
                    }
                } catch (error) {
                    results.errors.push({
                        appointmentId: appointment._id,
                        error: error.message
                    });
                    logger.error(`Failed to send custom reminder for appointment ${appointment._id}:`, error);
                }
            }

            return results;
        } catch (error) {
            logger.error('Error in sendCustomReminders:', error);
            throw error;
        }
    }

    /**
     * שליחת Follow-up email
     */
    async sendFollowUpEmail(appointment, client, therapist) {
        try {
            const emailData = {
                to: client.email,
                subject: `תודה על הפגישה - ${therapist.name}`,
                html: `
                    <h2>תודה על הפגישה!</h2>
                    <p>שלום ${client.firstName},</p>
                    <p>תודה על הפגישה אתמול. אנו מקווים שהיא הייתה מועילה עבורכם.</p>
                    
                    <h3>פרטי הפגישה:</h3>
                    <ul>
                        <li>מטפלת: ${therapist.name}</li>
                        <li>תאריך: ${moment(appointment.startTime).format('DD/MM/YYYY')}</li>
                        <li>שירות: ${appointment.serviceType}</li>
                    </ul>
                    
                    <h3>בקשה קטנה</h3>
                    <p>אם תרצו לעזור לנו לשפר את השירות, נשמח לקבל את המשוב שלכם:</p>
                    <a href="${process.env.FRONTEND_URL}/feedback/${appointment._id}" style="background-color: #2196f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        שלח משוב
                    </a>
                    
                    <h3>פגישה הבאה</h3>
                    <p>אם תרצו לקבוע פגישה נוספת, אנא צרו קשר:</p>
                    <p>📧 ${therapist.email} | 📞 ${therapist.phone}</p>
                    
                    <p>תודה שבחרת בנו!</p>
                `
            };

            return await emailService.sendWithRetry(emailData);
        } catch (error) {
            logger.error('Failed to send follow-up email:', error);
            throw error;
        }
    }

    /**
     * הרצת job מיד (לא לפי לוח זמנים)
     */
    async runJobNow(jobName) {
        try {
            console.log(`Running reminder job ${jobName} immediately...`);

            switch (jobName) {
                case 'dailyReminder':
                    return await this.sendDailyReminders();
                
                case 'hourlyReminder':
                    return await this.sendHourlyReminders();
                
                case 'followUp':
                    return await this.sendFollowUpEmails();
                
                case 'customReminder':
                    return await this.sendCustomReminders();
                
                default:
                    throw new Error(`Unknown reminder job: ${jobName}`);
            }
        } catch (error) {
            console.error(`Error running reminder job ${jobName}:`, error);
            throw error;
        }
    }

    /**
     * בדיקת תקינות כל ה-jobs
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

            // בדיקת מספר פגישות שדורשות תזכורות
            const tomorrow = moment().add(1, 'day').startOf('day');
            const tomorrowEnd = moment().add(1, 'day').endOf('day');

            const pendingReminders = await Appointment.countDocuments({
                startTime: {
                    $gte: tomorrow.toDate(),
                    $lte: tomorrowEnd.toDate()
                },
                status: 'confirmed',
                'remindersSent.type': { $ne: '24h' }
            });

            health.metrics = {
                pendingReminders24h: pendingReminders
            };

            // אם יש יותר מדי תזכורות ממתינות, זה יכול להצביע על בעיה
            if (pendingReminders > 100) {
                health.status = 'warning';
                health.errors.push(`High number of pending reminders: ${pendingReminders}`);
            }

        } catch (error) {
            health.status = 'unhealthy';
            health.errors.push(`Health check failed: ${error.message}`);
        }

        return health;
    }

    /**
     * קבלת סטטוס כל ה-jobs
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
}

module.exports = new ReminderJobs();
