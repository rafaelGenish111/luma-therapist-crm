const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const CommunicationLog = require('../models/CommunicationLog');
const Client = require('../models/Client');
const emailService = require('../utils/emailService');
const smsService = require('../services/smsService');

/**
 * שליחת הודעה ללקוח
 * POST /api/clients/:clientId/communications
 */
router.post('/clients/:clientId/communications', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { clientId } = req.params;
        const { channel, subject, body, metadata = {} } = req.body;
        const therapistId = req.user.id;

        // בדיקה שהלקוח קיים ושייך למטפלת
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ error: 'לקוח לא נמצא' });
        }

        if (client.therapist.toString() !== therapistId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'אין הרשאה לגשת ללקוח זה' });
        }

        // בדיקת תקינות הנתונים
        if (!channel || !['email', 'sms', 'whatsapp'].includes(channel)) {
            return res.status(400).json({ error: 'ערוץ תקשורת לא תקין' });
        }

        if (!body || body.trim().length === 0) {
            return res.status(400).json({ error: 'תוכן ההודעה הוא שדה חובה' });
        }

        // בדיקת פרטי קשר לפי הערוץ
        if (channel === 'email' && !client.email) {
            return res.status(400).json({ error: 'ללקוח אין כתובת אימייל' });
        }

        if ((channel === 'sms' || channel === 'whatsapp') && !client.phone) {
            return res.status(400).json({ error: 'ללקוח אין מספר טלפון' });
        }

        console.log(`Sending ${channel} message to client ${clientId}`);

        // יצירת רשומת תקשורת
        const communication = new CommunicationLog({
            clientId,
            channel,
            direction: 'outbound',
            subject,
            body: body.trim(),
            status: 'queued',
            sentBy: therapistId,
            sentAt: new Date(),
            meta: {
                ...metadata,
                therapistId,
                clientName: client.name
            }
        });

        await communication.save();

        let sendResult = null;
        let providerMessageId = null;

        // שליחת ההודעה לפי הערוץ
        try {
            switch (channel) {
                case 'email':
                    sendResult = await emailService.sendEmail({
                        to: client.email,
                        subject: subject || 'הודעה מהמטפלת',
                        html: body,
                        text: body.replace(/<[^>]*>/g, '') // הסרת תגיות HTML
                    });
                    providerMessageId = sendResult.messageId;
                    break;

                case 'sms':
                    sendResult = await smsService.sendSMS({
                        to: client.phone,
                        message: body
                    });
                    providerMessageId = sendResult.messageId;
                    break;

                case 'whatsapp':
                    // בשלב ראשון - רק לוג, ללא שליחה אמיתית
                    sendResult = { success: true, messageId: `wa_${Date.now()}` };
                    providerMessageId = sendResult.messageId;
                    break;
            }

            // עדכון הסטטוס בהצלחה
            await communication.markAsSent(providerMessageId);

            console.log(`Message sent successfully via ${channel}: ${providerMessageId}`);

            res.status(201).json({
                success: true,
                communication,
                providerMessageId
            });

        } catch (sendError) {
            console.error(`Failed to send ${channel} message:`, sendError);

            // עדכון הסטטוס בכשל
            await communication.markAsFailed(sendError.message);

            res.status(400).json({
                success: false,
                error: `שגיאה בשליחת ההודעה: ${sendError.message}`,
                communication
            });
        }

    } catch (error) {
        console.error('Error sending communication:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

/**
 * קבלת היסטוריית תקשורת של לקוח
 * GET /api/clients/:clientId/communications
 */
router.get('/clients/:clientId/communications', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { clientId } = req.params;
        const { channel, direction, status, dateFrom, dateTo, limit = 50, page = 1 } = req.query;
        const therapistId = req.user.id;

        // בדיקה שהלקוח קיים ושייך למטפלת
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ error: 'לקוח לא נמצא' });
        }

        if (client.therapist.toString() !== therapistId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'אין הרשאה לגשת ללקוח זה' });
        }

        console.log(`Fetching communications for client ${clientId}`);

        // בניית אפשרויות הסינון
        const options = {
            limit: parseInt(limit),
            page: parseInt(page)
        };

        if (channel) options.channel = channel;
        if (direction) options.direction = direction;
        if (status) options.status = status;
        if (dateFrom) options.dateFrom = dateFrom;
        if (dateTo) options.dateTo = dateTo;

        // קבלת התקשורת
        const communications = await CommunicationLog.findByClient(clientId, options);

        // חישוב סטטיסטיקות
        const allCommunications = await CommunicationLog.find({ clientId });
        const stats = {
            total: allCommunications.length,
            byChannel: {
                email: allCommunications.filter(c => c.channel === 'email').length,
                sms: allCommunications.filter(c => c.channel === 'sms').length,
                whatsapp: allCommunications.filter(c => c.channel === 'whatsapp').length
            },
            byDirection: {
                outbound: allCommunications.filter(c => c.direction === 'outbound').length,
                inbound: allCommunications.filter(c => c.direction === 'inbound').length
            },
            byStatus: {
                queued: allCommunications.filter(c => c.status === 'queued').length,
                sent: allCommunications.filter(c => c.status === 'sent').length,
                delivered: allCommunications.filter(c => c.status === 'delivered').length,
                failed: allCommunications.filter(c => c.status === 'failed').length
            }
        };

        console.log(`Found ${communications.length} communications for client ${clientId}`);

        res.json({
            success: true,
            communications,
            stats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: allCommunications.length
            }
        });

    } catch (error) {
        console.error('Error fetching communications:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

/**
 * קבלת הודעות שנכשלו
 * GET /api/communications/failed
 */
router.get('/communications/failed', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { channel, dateFrom, dateTo, limit = 50, page = 1 } = req.query;
        const therapistId = req.user.id;

        console.log(`Fetching failed communications for therapist ${therapistId}`);

        // בניית אפשרויות הסינון
        const options = {
            limit: parseInt(limit),
            page: parseInt(page)
        };

        if (channel) options.channel = channel;
        if (dateFrom) options.dateFrom = dateFrom;
        if (dateTo) options.dateTo = dateTo;

        // קבלת הודעות שנכשלו
        const failedCommunications = await CommunicationLog.findFailed(options);

        // סינון לפי מטפלת
        const therapistFailedCommunications = failedCommunications.filter(
            comm => comm.sentBy.toString() === therapistId
        );

        console.log(`Found ${therapistFailedCommunications.length} failed communications`);

        res.json({
            success: true,
            communications: therapistFailedCommunications,
            total: therapistFailedCommunications.length
        });

    } catch (error) {
        console.error('Error fetching failed communications:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

/**
 * ניסיון חוזר לשליחת הודעה שנכשלה
 * POST /api/communications/:id/retry
 */
router.post('/communications/:id/retry', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const therapistId = req.user.id;

        // בדיקה שההודעה קיימת ושייכת למטפלת
        const communication = await CommunicationLog.findById(id);
        if (!communication) {
            return res.status(404).json({ error: 'הודעה לא נמצאה' });
        }

        if (communication.sentBy.toString() !== therapistId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'אין הרשאה לגשת להודעה זו' });
        }

        if (communication.status !== 'failed') {
            return res.status(400).json({ error: 'לא ניתן לנסות שוב שליחה להודעה שלא נכשלה' });
        }

        console.log(`Retrying communication ${id}`);

        // קבלת פרטי הלקוח
        const client = await Client.findById(communication.clientId);
        if (!client) {
            return res.status(404).json({ error: 'לקוח לא נמצא' });
        }

        let sendResult = null;
        let providerMessageId = null;

        // ניסיון שליחה חוזר
        try {
            switch (communication.channel) {
                case 'email':
                    sendResult = await emailService.sendEmail({
                        to: client.email,
                        subject: communication.subject || 'הודעה מהמטפלת',
                        html: communication.body,
                        text: communication.body.replace(/<[^>]*>/g, '')
                    });
                    providerMessageId = sendResult.messageId;
                    break;

                case 'sms':
                    sendResult = await smsService.sendSMS({
                        to: client.phone,
                        message: communication.body
                    });
                    providerMessageId = sendResult.messageId;
                    break;

                case 'whatsapp':
                    sendResult = { success: true, messageId: `wa_retry_${Date.now()}` };
                    providerMessageId = sendResult.messageId;
                    break;
            }

            // עדכון הסטטוס בהצלחה
            await communication.markAsSent(providerMessageId);

            console.log(`Communication retry successful: ${providerMessageId}`);

            res.json({
                success: true,
                communication,
                providerMessageId
            });

        } catch (sendError) {
            console.error(`Communication retry failed:`, sendError);

            // עדכון הסטטוס בכשל
            await communication.markAsFailed(sendError.message);

            res.status(400).json({
                success: false,
                error: `שגיאה בניסיון החוזר: ${sendError.message}`,
                communication
            });
        }

    } catch (error) {
        console.error('Error retrying communication:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

/**
 * קבלת סטטיסטיקות תקשורת
 * GET /api/communications/stats
 */
router.get('/communications/stats', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        const therapistId = req.user.id;

        console.log(`Fetching communication stats for therapist ${therapistId}`);

        // בניית מסננים
        const filters = { sentBy: therapistId };
        if (dateFrom) filters.sentAt = { $gte: new Date(dateFrom) };
        if (dateTo) {
            if (filters.sentAt) {
                filters.sentAt.$lte = new Date(dateTo);
            } else {
                filters.sentAt = { $lte: new Date(dateTo) };
            }
        }

        // קבלת כל התקשורת של המטפלת
        const communications = await CommunicationLog.find(filters);

        // חישוב סטטיסטיקות
        const stats = {
            total: communications.length,
            byChannel: {
                email: communications.filter(c => c.channel === 'email').length,
                sms: communications.filter(c => c.channel === 'sms').length,
                whatsapp: communications.filter(c => c.channel === 'whatsapp').length
            },
            byStatus: {
                queued: communications.filter(c => c.status === 'queued').length,
                sent: communications.filter(c => c.status === 'sent').length,
                delivered: communications.filter(c => c.status === 'delivered').length,
                failed: communications.filter(c => c.status === 'failed').length
            },
            successRate: communications.length > 0
                ? Math.round(((communications.filter(c => c.status === 'sent' || c.status === 'delivered').length) / communications.length) * 100)
                : 0
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Error fetching communication stats:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

module.exports = router;
