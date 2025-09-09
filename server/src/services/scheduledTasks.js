const cron = require('node-cron');
const { fullCleanup, deleteExpiredAppointments } = require('../utils/appointmentCleanup');

class ScheduledTasks {
    constructor() {
        this.tasks = [];
    }

    /**
     * התחלת כל העבודות המתוזמנות
     */
    startAll() {
        console.log('Starting scheduled tasks...');

        // ניקוי פגישות כל שעה
        this.startHourlyCleanup();

        // ניקוי מלא פעם ביום בחצות
        this.startDailyCleanup();

        // יצירת חיובים אוטומטית לפגישות שהסתיימו
        this.startChargeGeneration();

        console.log(`Started ${this.tasks.length} scheduled tasks`);
    }

    /**
     * ניקוי פגישות שעבר זמנן כל שעה
     */
    startHourlyCleanup() {
        // רץ כל שעה ב-0 דקות
        const task = cron.schedule('0 * * * *', async () => {
            try {
                console.log('Running hourly appointment cleanup...');
                const result = await deleteExpiredAppointments(2); // מחק פגישות שעבר זמנן ב-2 שעות
                console.log(`Hourly cleanup result: ${result.message}`);
            } catch (error) {
                console.error('Error in hourly cleanup:', error);
            }
        }, {
            scheduled: false,
            timezone: "Asia/Jerusalem"
        });

        this.tasks.push({
            name: 'Hourly Appointment Cleanup',
            task: task,
            schedule: '0 * * * *'
        });

        task.start();
        console.log('✓ Hourly appointment cleanup task started');
    }

    /**
     * ניקוי מלא פעם ביום
     */
    startDailyCleanup() {
        // רץ כל יום בחצות
        const task = cron.schedule('0 0 * * *', async () => {
            try {
                console.log('Running daily full cleanup...');
                const result = await fullCleanup(2, 30); // מחק פגישות שעבר זמנן ב-2 שעות, מחק לגמרי אחרי 30 ימים
                console.log(`Daily cleanup result: ${result.message}`);
            } catch (error) {
                console.error('Error in daily cleanup:', error);
            }
        }, {
            scheduled: false,
            timezone: "Asia/Jerusalem"
        });

        this.tasks.push({
            name: 'Daily Full Cleanup',
            task: task,
            schedule: '0 0 * * *'
        });

        task.start();
        console.log('✓ Daily full cleanup task started');
    }

    /**
     * יצירת חיוב לפגישות שהסתיימו ואינן מחויבות
     */
    startChargeGeneration() {
        // כל 5 דקות
        const task = cron.schedule('*/5 * * * *', async () => {
            try {
                console.log('Running charge generation for completed/ended appointments...');
                const now = new Date();
                const Appointment = require('../models/Appointment');
                const { ensureChargeForAppointment } = require('./billingEngine');

                // מאתרים פגישות שעבר זמנן ושיש להן מחיר, ללא חיוב או חיוב פתוח
                const candidates = await Appointment.find({
                    date: { $lt: now },
                    price: { $gt: 0 },
                }).limit(100);

                for (const appt of candidates) {
                    try {
                        await ensureChargeForAppointment(appt);
                    } catch (e) {
                        console.warn('ensureChargeForAppointment failed in cron:', e.message);
                    }
                }

                console.log(`Charge generation processed ${candidates.length} appointments`);
            } catch (error) {
                console.error('Error in charge generation task:', error);
            }
        }, {
            scheduled: false,
            timezone: 'Asia/Jerusalem'
        });

        this.tasks.push({ name: 'Charge Generation', task, schedule: '*/5 * * * *' });
        task.start();
        console.log('✓ Charge generation task started (every 5 minutes)');
    }

    /**
     * עצירת כל העבודות המתוזמנות
     */
    stopAll() {
        console.log('Stopping all scheduled tasks...');
        this.tasks.forEach(({ name, task }) => {
            task.stop();
            console.log(`✓ Stopped ${name}`);
        });
        this.tasks = [];
        console.log('All scheduled tasks stopped');
    }

    /**
     * קבלת סטטוס של כל העבודות
     */
    getStatus() {
        return this.tasks.map(({ name, schedule, task }) => ({
            name,
            schedule,
            running: task.running || false
        }));
    }

    /**
     * הרצה ידנית של ניקוי
     */
    async runCleanupNow() {
        try {
            console.log('Running manual cleanup...');
            const result = await fullCleanup(2, 30);
            console.log(`Manual cleanup result: ${result.message}`);
            return result;
        } catch (error) {
            console.error('Error in manual cleanup:', error);
            throw error;
        }
    }
}

// יצירת instance יחיד
const scheduledTasks = new ScheduledTasks();

module.exports = scheduledTasks;
