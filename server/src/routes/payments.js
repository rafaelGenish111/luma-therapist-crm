const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const billingService = require('../services/billingService');
const Charge = require('../models/Charge');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Client = require('../models/Client');

/**
 * יצירת תשלום חדש
 * POST /api/clients/:clientId/payments
 */
router.post('/clients/:clientId/payments', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { clientId } = req.params;
        const { appointmentId, amount, currency = 'ILS', method = 'simulated', description } = req.body;
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
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'סכום התשלום חייב להיות חיובי' });
        }

        // אם יש appointmentId, בדיקה שהפגישה קיימת
        if (appointmentId) {
            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                return res.status(404).json({ error: 'פגישה לא נמצאה' });
            }
            if (appointment.client.toString() !== clientId) {
                return res.status(400).json({ error: 'הפגישה לא שייכת ללקוח זה' });
            }
        }

        console.log(`Creating payment for client ${clientId}, amount: ${amount}, method: ${method}`);

        // יצירת התשלום
        const paymentData = {
            clientId,
            appointmentId,
            amount,
            currency,
            method,
            description
        };

        const result = await billingService.createPayment(paymentData, therapistId);

        if (!result.success) {
            console.error(`Payment creation failed for client ${clientId}:`, result.error);
            return res.status(400).json({
                error: 'שגיאה ביצירת התשלום',
                details: result.error
            });
        }

        // עדכון סטטוס חיוב/פגישה אחרי תשלום
        if (result.success && appointmentId) {
            const appointment = await Appointment.findById(appointmentId);
            if (appointment) {
                // עדכון חיוב קיים אם יש
                if (appointment.chargeId) {
                    const charge = await Charge.findById(appointment.chargeId);
                    if (charge) {
                        // סכום ששולם עד כה (כולל התשלום שזה עתה נוצר)
                        const agg = await Payment.aggregate([
                            { $match: { appointmentId: appointment._id, status: 'paid' } },
                            { $group: { _id: null, sum: { $sum: '$amount' } } }
                        ]);
                        const totalPaid = agg[0]?.sum || 0;
                        charge.paidAmount = totalPaid;
                        if (totalPaid >= charge.amount) {
                            charge.status = 'PAID';
                            charge.paidAt = new Date();
                            await Appointment.findByIdAndUpdate(appointmentId, { paymentStatus: 'PAID' });
                        } else if (totalPaid > 0) {
                            charge.status = 'PARTIALLY_PAID';
                            await Appointment.findByIdAndUpdate(appointmentId, { paymentStatus: 'PARTIALLY_PAID' });
                        } else {
                            charge.status = 'PENDING';
                            await Appointment.findByIdAndUpdate(appointmentId, { paymentStatus: 'PENDING' });
                        }
                        await charge.save();
                    }
                }
            }
        }

        console.log(`Payment created successfully: ${result.payment._id}`);

        res.status(201).json({
            success: true,
            payment: result.payment,
            transactionId: result.transactionId
        });

    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

/**
 * קבלת תשלומים של לקוח
 * GET /api/clients/:clientId/payments
 */
router.get('/clients/:clientId/payments', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { clientId } = req.params;
        const { limit = 20, page = 1, status } = req.query;
        const therapistId = req.user.id;

        // בדיקה שהלקוח קיים ושייך למטפלת
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ error: 'לקוח לא נמצא' });
        }

        if (client.therapist.toString() !== therapistId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'אין הרשאה לגשת ללקוח זה' });
        }

        console.log(`Fetching payments for client ${clientId}, page: ${page}, limit: ${limit}`);

        // בניית אפשרויות הסינון
        const options = {
            limit: parseInt(limit),
            page: parseInt(page)
        };

        if (status) {
            options.status = status;
        }

        // קבלת התשלומים
        const payments = await billingService.getClientPayments(clientId, options);

        // חישוב סטטיסטיקות
        const allPayments = await Payment.find({ clientId });
        const stats = {
            total: allPayments.length,
            totalAmount: allPayments.reduce((sum, p) => sum + p.amount, 0),
            paid: allPayments.filter(p => p.status === 'paid').length,
            paidAmount: allPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
            pending: allPayments.filter(p => p.status === 'pending').length,
            failed: allPayments.filter(p => p.status === 'failed').length,
            refunded: allPayments.filter(p => p.status === 'refunded').length
        };

        console.log(`Found ${payments.length} payments for client ${clientId}`);

        res.json({
            success: true,
            payments,
            stats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: allPayments.length
            }
        });

    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

/**
 * יצירת חשבונית לתשלום
 * POST /api/payments/:paymentId/invoice
 */
router.post('/payments/:paymentId/invoice', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { paymentId } = req.params;
        const therapistId = req.user.id;

        // בדיקה שהתשלום קיים ושייך למטפלת
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'תשלום לא נמצא' });
        }

        if (payment.createdBy.toString() !== therapistId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'אין הרשאה לגשת לתשלום זה' });
        }

        console.log(`Creating invoice for payment ${paymentId}`);

        // יצירת החשבונית
        const result = await billingService.createInvoice(paymentId);

        if (!result.success) {
            console.error(`Invoice creation failed for payment ${paymentId}:`, result.error);
            return res.status(400).json({
                error: 'שגיאה ביצירת החשבונית',
                details: result.error
            });
        }

        console.log(`Invoice created successfully: ${result.invoiceId}`);

        res.json({
            success: true,
            invoiceId: result.invoiceId,
            invoiceUrl: result.invoiceUrl
        });

    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

/**
 * בדיקת סטטוס תשלום
 * GET /api/payments/:paymentId/status
 */
router.get('/payments/:paymentId/status', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { paymentId } = req.params;
        const therapistId = req.user.id;

        // בדיקה שהתשלום קיים ושייך למטפלת
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'תשלום לא נמצא' });
        }

        if (payment.createdBy.toString() !== therapistId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'אין הרשאה לגשת לתשלום זה' });
        }

        console.log(`Checking status for payment ${paymentId}`);

        // בדיקת הסטטוס
        const status = await billingService.checkPaymentStatus(paymentId);

        res.json({
            success: true,
            status: status.status,
            transactionId: status.transactionId,
            lastChecked: status.lastChecked
        });

    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

/**
 * ביטול תשלום
 * POST /api/payments/:paymentId/refund
 */
router.post('/payments/:paymentId/refund', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { reason = '' } = req.body;
        const therapistId = req.user.id;

        // בדיקה שהתשלום קיים ושייך למטפלת
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'תשלום לא נמצא' });
        }

        if (payment.createdBy.toString() !== therapistId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'אין הרשאה לגשת לתשלום זה' });
        }

        if (payment.status !== 'paid') {
            return res.status(400).json({ error: 'לא ניתן לבטל תשלום שלא שולם' });
        }

        console.log(`Refunding payment ${paymentId}, reason: ${reason}`);

        // ביטול התשלום
        const result = await billingService.refundPayment(paymentId, reason);

        if (!result.success) {
            console.error(`Refund failed for payment ${paymentId}:`, result.error);
            return res.status(400).json({
                error: 'שגיאה בביטול התשלום',
                details: result.error
            });
        }

        console.log(`Payment refunded successfully: ${result.refundTransactionId}`);

        res.json({
            success: true,
            refundTransactionId: result.refundTransactionId
        });

    } catch (error) {
        console.error('Error refunding payment:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

/**
 * קבלת סטטיסטיקות תשלומים
 * GET /api/payments/stats
 */
router.get('/payments/stats', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        const therapistId = req.user.id;

        console.log(`Fetching payment stats for therapist ${therapistId}`);

        const filters = {};
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;

        const stats = await billingService.getPaymentStats(therapistId, filters);

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Error fetching payment stats:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

module.exports = router; 