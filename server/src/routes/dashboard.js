const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Client = require('../models/Client');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Charge = require('../models/Charge');

// GET /api/dashboard/stats - סטטיסטיקות לוח בקרה
router.get('/stats', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const therapistId = req.user.id;
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

        console.log(`Fetching dashboard stats for therapist ${therapistId}`);

        // קבלת נתונים במקביל
        const [clients, appointments, payments, charges] = await Promise.all([
            Client.find({ therapist: therapistId }),
            Appointment.find({ therapist: therapistId, deletedAt: null }),
            Payment.find({ createdBy: therapistId }),
            Charge.find({ therapistId: therapistId })
        ]);

        // חישוב מטריקות לקוחות
        const clientMetrics = {
            total: clients.length,
            active: clients.filter(c => c.status === 'active').length,
            newThisWeek: clients.filter(c => new Date(c.createdAt) >= oneWeekAgo).length,
            newThisMonth: clients.filter(c => new Date(c.createdAt) >= oneMonthAgo).length,
            newThisYear: clients.filter(c => new Date(c.createdAt) >= oneYearAgo).length
        };

        // חישוב מטריקות פגישות
        const weeklyAppointments = appointments.filter(a => new Date(a.date) >= oneWeekAgo);
        const monthlyAppointments = appointments.filter(a => new Date(a.date) >= oneMonthAgo);
        const todayAppointments = appointments.filter(a =>
            new Date(a.date).toDateString() === now.toDateString()
        );

        const appointmentMetrics = {
            total: appointments.length,
            weekly: weeklyAppointments.length,
            monthly: monthlyAppointments.length,
            today: todayAppointments.length,
            completed: appointments.filter(a => a.status === 'completed').length,
            cancelled: appointments.filter(a => a.status === 'cancelled').length,
            upcoming: appointments.filter(a =>
                a.status === 'scheduled' && new Date(a.date) > now
            ).length,
            completionRate: appointments.length > 0 ?
                (appointments.filter(a => a.status === 'completed').length / appointments.length) * 100 : 0
        };

        // חישוב מטריקות תשלומים
        console.log(`📊 Total payments found: ${payments.length}`);
        console.log(`📊 oneMonthAgo: ${oneMonthAgo}`);
        console.log(`📊 Recent payments:`, payments.slice(0, 3).map(p => ({
            id: p._id,
            amount: p.amount,
            status: p.status,
            createdAt: p.createdAt,
            isThisMonth: new Date(p.createdAt) >= oneMonthAgo
        })));

        const monthlyPayments = payments.filter(p =>
            p.status === 'paid' && new Date(p.createdAt) >= oneMonthAgo
        );
        const yearlyPayments = payments.filter(p =>
            p.status === 'paid' && new Date(p.createdAt) >= oneYearAgo
        );

        console.log(`📊 Monthly paid payments count: ${monthlyPayments.length}`);
        console.log(`📊 Monthly paid payments:`, monthlyPayments.map(p => ({ amount: p.amount, createdAt: p.createdAt })));

        const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        console.log(`📊 Calculated monthlyRevenue: ${monthlyRevenue}`);

        const paymentMetrics = {
            total: payments.length,
            monthlyRevenue: monthlyRevenue,
            yearlyRevenue: yearlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
            monthlyCount: monthlyPayments.length,
            yearlyCount: yearlyPayments.length,
            averagePayment: payments.length > 0 ?
                payments.reduce((sum, p) => sum + (p.amount || 0), 0) / payments.length : 0,
            pendingPayments: payments.filter(p => p.status === 'pending').length,
            failedPayments: payments.filter(p => p.status === 'failed').length
        };

        // חישוב מגמת הכנסות (6 חודשים אחרונים)
        const revenueTrend = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const monthPayments = payments.filter(p =>
                p.status === 'paid' &&
                new Date(p.createdAt) >= monthStart &&
                new Date(p.createdAt) <= monthEnd
            );

            const revenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

            revenueTrend.push({
                month: monthStart.toLocaleDateString('he-IL', { month: 'short' }),
                value: revenue,
                count: monthPayments.length
            });
        }

        // חישוב התפלגות פגישות לפי סוג
        const appointmentDistribution = appointments.reduce((acc, appointment) => {
            const type = appointment.type || 'כללי';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        const appointmentDistributionArray = Object.entries(appointmentDistribution).map(([type, count]) => ({
            name: type,
            value: count,
            percentage: appointments.length > 0 ? (count / appointments.length) * 100 : 0
        }));

        // יצירת פעילות אחרונה
        const recentActivity = [];

        // פעילויות לקוחות (5 אחרונים)
        clients.slice(0, 5).forEach(client => {
            recentActivity.push({
                id: `client-${client._id}`,
                type: 'client',
                title: 'לקוח חדש',
                description: `${client.firstName} ${client.lastName} נרשם למערכת`,
                timestamp: client.createdAt,
                client: { name: `${client.firstName} ${client.lastName}` },
                status: 'completed'
            });
        });

        // פעילויות פגישות (10 אחרונות)
        appointments.slice(0, 10).forEach(appointment => {
            const client = clients.find(c => c._id.toString() === appointment.client.toString());
            if (client) {
                recentActivity.push({
                    id: `appointment-${appointment._id}`,
                    type: 'appointment',
                    title: 'פגישה חדשה',
                    description: `פגישה עם ${client.firstName} ${client.lastName}`,
                    timestamp: appointment.createdAt,
                    client: { name: `${client.firstName} ${client.lastName}` },
                    status: appointment.status
                });
            }
        });

        // פעילויות תשלומים (10 אחרונים)
        payments.slice(0, 10).forEach(payment => {
            const client = clients.find(c => c._id.toString() === payment.clientId.toString());
            if (client) {
                recentActivity.push({
                    id: `payment-${payment._id}`,
                    type: 'payment',
                    title: 'תשלום חדש',
                    description: `תשלום של ₪${(payment.amount || 0).toLocaleString()} מ${client.firstName} ${client.lastName}`,
                    timestamp: payment.createdAt,
                    client: { name: `${client.firstName} ${client.lastName}` },
                    amount: payment.amount,
                    status: payment.status
                });
            }
        });

        // מיון לפי זמן
        recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // יצירת התראות
        const notifications = [];

        // התראות פגישות קרובות (24 שעות)
        const upcomingAppointments = appointments.filter(a =>
            a.status === 'scheduled' &&
            new Date(a.date) > now &&
            new Date(a.date) <= new Date(now.getTime() + 24 * 60 * 60 * 1000)
        );

        upcomingAppointments.forEach(appointment => {
            const client = clients.find(c => c._id.toString() === appointment.client.toString());
            if (client) {
                notifications.push({
                    id: `appointment-reminder-${appointment._id}`,
                    type: 'reminder',
                    title: 'פגישה קרובה',
                    message: `פגישה עם ${client.firstName} ${client.lastName} ב${new Date(appointment.date).toLocaleDateString('he-IL')}`,
                    timestamp: appointment.createdAt,
                    client: { name: `${client.firstName} ${client.lastName}` },
                    urgent: true,
                    actions: [
                        { label: 'התחל פגישה', onClick: () => console.log('Start appointment') },
                        { label: 'דחה', onClick: () => console.log('Reschedule') }
                    ]
                });
            }
        });

        // התראות תשלומים ממתינים
        const pendingPayments = payments.filter(p => p.status === 'pending');
        pendingPayments.forEach(payment => {
            const client = clients.find(c => c._id.toString() === payment.clientId.toString());
            if (client) {
                notifications.push({
                    id: `payment-pending-${payment._id}`,
                    type: 'payment',
                    title: 'תשלום ממתין',
                    message: `תשלום של ₪${(payment.amount || 0).toLocaleString()} מ${client.firstName} ${client.lastName}`,
                    timestamp: payment.createdAt,
                    client: { name: `${client.firstName} ${client.lastName}` },
                    amount: payment.amount,
                    actions: [
                        { label: 'שלח תזכורת', onClick: () => console.log('Send reminder') },
                        { label: 'צור חשבונית', onClick: () => console.log('Create invoice') }
                    ]
                });
            }
        });

        // מיון התראות לפי זמן
        notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // חישוב יעדים והמלצות - קבלת יעד מהמטפלת
        const therapist = await Therapist.findById(therapistId);
        const monthlyTarget = therapist?.monthlyRevenueTarget || 15000;
        const progressToTarget = (paymentMetrics.monthlyRevenue / monthlyTarget) * 100;

        const recommendations = [];

        if (appointmentMetrics.completionRate < 80) {
            recommendations.push({
                type: 'warning',
                title: 'שיעור השלמת פגישות נמוך',
                description: `שיעור השלמת הפגישות הוא ${appointmentMetrics.completionRate.toFixed(1)}%. נסה לשפר את התקשורת עם הלקוחות.`
            });
        }

        if (paymentMetrics.monthlyRevenue < monthlyTarget * 0.7) {
            recommendations.push({
                type: 'info',
                title: 'הכנסות חודשיות נמוכות',
                description: `ההכנסות החודשיות הן ₪${paymentMetrics.monthlyRevenue.toLocaleString()}. שקול לקדם שירותים נוספים.`
            });
        }

        if (clientMetrics.newThisWeek === 0) {
            recommendations.push({
                type: 'suggestion',
                title: 'אין לקוחות חדשים השבוע',
                description: 'שקול לקדם את השירותים שלך או ליצור קשר עם לקוחות פוטנציאליים.'
            });
        }

        const dashboardData = {
            // מטריקות בסיסיות
            clientMetrics,
            appointmentMetrics,
            paymentMetrics,

            // נתונים לגרפים
            revenueTrend,
            appointmentDistribution: appointmentDistributionArray,

            // פעילות והתראות
            recentActivity: recentActivity.slice(0, 20),
            notifications: notifications.slice(0, 10),

            // יעדים והמלצות
            monthlyTarget,
            progressToTarget,
            recommendations,

            // מטא-דאטה
            lastUpdated: new Date(),
            totalRecords: clients.length + appointments.length + payments.length
        };

        res.json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בטעינת סטטיסטיקות לוח בקרה',
            message: error.message
        });
    }
});

module.exports = router;
