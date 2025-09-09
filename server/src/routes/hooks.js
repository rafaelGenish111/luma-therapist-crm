const express = require('express');
const router = express.Router();

/**
 * Webhook for payment updates - לשימוש עתידי עם n8n
 * POST /api/hooks/payment-updated
 * 
 * נקרא מתוך השרת אחרי שינוי תשלום
 * לשימוש עתידי כ-Webhook ל-n8n להפקת חשבונית אמיתית/שליחת מייל
 */
router.post('/payment-updated', async (req, res) => {
    try {
        const { paymentId, event, paymentData } = req.body;

        console.log(`🔔 Payment webhook triggered: ${event} for payment ${paymentId}`);

        // TODO: בעתיד - שליחה ל-n8n או ספק חשבוניות אמיתי
        // const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         paymentId,
        //         event,
        //         paymentData,
        //         timestamp: new Date().toISOString()
        //     })
        // });

        // Log for development
        console.log('📋 Webhook payload:', {
            paymentId,
            event,
            paymentData,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Webhook received successfully',
            event,
            paymentId
        });

    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({
            success: false,
            error: 'Webhook processing failed'
        });
    }
});

/**
 * Webhook for appointment updates
 * POST /api/hooks/appointment-updated
 */
router.post('/appointment-updated', async (req, res) => {
    try {
        const { appointmentId, event, appointmentData } = req.body;

        console.log(`🔔 Appointment webhook triggered: ${event} for appointment ${appointmentId}`);

        // TODO: בעתיד - שליחה ל-n8n לשליחת תזכורות/הודעות
        // const n8nResponse = await fetch(process.env.N8N_APPOINTMENT_WEBHOOK_URL, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         appointmentId,
        //         event,
        //         appointmentData,
        //         timestamp: new Date().toISOString()
        //     })
        // });

        res.json({
            success: true,
            message: 'Appointment webhook received successfully',
            event,
            appointmentId
        });

    } catch (error) {
        console.error('❌ Appointment webhook error:', error);
        res.status(500).json({
            success: false,
            error: 'Appointment webhook processing failed'
        });
    }
});

/**
 * Webhook for communication events
 * POST /api/hooks/communication-sent
 */
router.post('/communication-sent', async (req, res) => {
    try {
        const { communicationId, event, communicationData } = req.body;

        console.log(`🔔 Communication webhook triggered: ${event} for communication ${communicationId}`);

        // TODO: בעתיד - שליחה ל-n8n לשליחת הודעות אמיתיות
        // const n8nResponse = await fetch(process.env.N8N_COMMUNICATION_WEBHOOK_URL, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         communicationId,
        //         event,
        //         communicationData,
        //         timestamp: new Date().toISOString()
        //     })
        // });

        res.json({
            success: true,
            message: 'Communication webhook received successfully',
            event,
            communicationId
        });

    } catch (error) {
        console.error('❌ Communication webhook error:', error);
        res.status(500).json({
            success: false,
            error: 'Communication webhook processing failed'
        });
    }
});

module.exports = router;


