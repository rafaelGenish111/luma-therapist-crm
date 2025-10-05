const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { paymentLimiter, paymentCallbackLimiter, auditLog } = require('../middleware/security');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Appointment = require('../models/Appointment');
const PaymentProviderFactory = require('../payments/providerFactory');
const { paymentLogger } = require('../utils/paymentLogger');

// Middleware לבדיקת ולידציה
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'נתונים לא תקינים',
            details: errors.array()
        });
    }
    next();
};

/**
 * יצירת לינק תשלום חדש
 * POST /api/payments/create
 */
router.post('/create',
    paymentLimiter,
    auth,
    authorize(['therapist', 'admin']),
    auditLog('payment_link_created'),
    [
        body('clientId').isMongoId().withMessage('מזהה לקוח לא תקין'),
        body('amount').isFloat({ min: 0.01 }).withMessage('סכום חייב להיות חיובי'),
        body('currency').optional().isIn(['ILS']).withMessage('מטבע לא נתמך'),
        body('sessionId').optional().isMongoId().withMessage('מזהה פגישה לא תקין'),
        body('description').optional().isString().isLength({ max: 500 }).withMessage('תיאור ארוך מדי')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { clientId, sessionId, amount, currency = 'ILS', description } = req.body;
            const therapistId = req.user.id; // השתמש ב-ID של המשתמש המחובר

            // בדיקה שהמטפל קיים
            const therapist = await Therapist.findById(therapistId);
            if (!therapist) {
                return res.status(404).json({ error: 'מטפל לא נמצא' });
            }

            // בדיקה שהלקוח קיים ושייך למטפל
            const client = await Client.findById(clientId);
            if (!client) {
                return res.status(404).json({ error: 'לקוח לא נמצא' });
            }

            if (client.therapist.toString() !== therapistId) {
                return res.status(403).json({ error: 'הלקוח לא שייך למטפל זה' });
            }

            // בדיקה שהפגישה קיימת ושייכת ללקוח (אם צוינה)
            if (sessionId) {
                const appointment = await Appointment.findById(sessionId);
                if (!appointment) {
                    return res.status(404).json({ error: 'פגישה לא נמצאה' });
                }
                if (appointment.client.toString() !== clientId) {
                    return res.status(400).json({ error: 'הפגישה לא שייכת ללקוח זה' });
                }
            }

            // יצירת paymentLinkId ייחודי
            const paymentLinkId = uuidv4();

            // קבלת ספק התשלום
            const provider = PaymentProviderFactory.getProvider();

            // יצירת רשומת תשלום
            const payment = new Payment({
                therapistId,
                clientId,
                sessionId,
                amount,
                currency,
                status: 'pending',
                paymentLinkId,
                provider: provider.getName(),
                description,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 ימים
            });

            await payment.save();

            // יצירת checkout URL דרך הספק
            const checkoutResult = await provider.createCheckout({
                ...payment.toObject(),
                clientName: client.fullName,
                clientEmail: client.email,
                clientPhone: client.phone
            });

            // עדכון ה-checkoutUrl ברשומה
            payment.checkoutUrl = checkoutResult.redirectUrl;
            await payment.save();

            // לוג יצירת התשלום
            paymentLogger.logPaymentCreated(payment.toObject(), therapistId);

            console.log(`Payment link created: ${paymentLinkId} for client ${clientId}`);

            res.status(201).json({
                success: true,
                paymentLink: `${process.env.APP_BASE_URL || 'https://luma-crm.com'}/pay/${paymentLinkId}`,
                checkoutUrl: checkoutResult.redirectUrl,
                paymentLinkId,
                expiresAt: payment.expiresAt
            });

        } catch (error) {
            paymentLogger.logPaymentError(error, {
                action: 'create_payment',
                therapistId: req.user.id,
                clientId: req.body.clientId
            });
            res.status(500).json({ error: 'שגיאה פנימית בשרת' });
        }
    }
);

/**
 * קבלת פרטי תשלום לתצוגה בדף הלקוח
 * GET /api/payments/:paymentLinkId
 */
router.get('/:paymentLinkId',
    [
        param('paymentLinkId').isUUID().withMessage('מזהה תשלום לא תקין')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { paymentLinkId } = req.params;

            const payment = await Payment.findOne({ paymentLinkId })
                .populate('therapistId', 'firstName lastName businessName logo')
                .populate('clientId', 'firstName lastName email phone')
                .populate('sessionId', 'date time treatmentType');

            if (!payment) {
                return res.status(404).json({ error: 'תשלום לא נמצא' });
            }

            // בדיקה אם התשלום פג תוקף
            if (payment.isExpired()) {
                await payment.markAsExpired();
                return res.status(410).json({
                    error: 'לינק התשלום פג תוקף',
                    expired: true
                });
            }

            // אם התשלום כבר שולם או נכשל
            if (payment.status !== 'pending') {
                return res.status(400).json({
                    error: 'התשלום כבר הושלם או נכשל',
                    status: payment.status
                });
            }

            const response = {
                therapistName: payment.therapistId.businessName || `${payment.therapistId.firstName} ${payment.therapistId.lastName}`,
                therapistLogo: payment.therapistId.logo,
                clientName: `${payment.clientId.firstName} ${payment.clientId.lastName}`,
                clientEmail: payment.clientId.email,
                clientPhone: payment.clientId.phone,
                amount: payment.amount,
                currency: payment.currency,
                description: payment.description || 'תשלום עבור טיפול',
                status: payment.status,
                expiresAt: payment.expiresAt,
                isExpired: payment.isExpired(),
                sessionInfo: payment.sessionId ? {
                    date: payment.sessionId.date,
                    time: payment.sessionId.time,
                    treatmentType: payment.sessionId.treatmentType
                } : null
            };

            res.json(response);

        } catch (error) {
            console.error('Error fetching payment details:', error);
            res.status(500).json({ error: 'שגיאה פנימית בשרת' });
        }
    }
);

/**
 * Callback מספק התשלום
 * POST /api/payments/callback/tranzila
 */
router.post('/callback/tranzila',
    paymentCallbackLimiter,
    auditLog('payment_callback_tranzila'),
    async (req, res) => {
        try {
            console.log('Tranzila callback received:', req.body);

            const provider = PaymentProviderFactory.getProviderByName('tranzila');
            const verificationResult = await provider.verifyCallback(req);

            if (!verificationResult.ok) {
                paymentLogger.logSecurityEvent('callback_verification_failed', {
                    provider: 'tranzila',
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
                console.error('Tranzila callback verification failed');
                return res.status(400).json({ error: 'Callback verification failed' });
            }

            const { paymentLinkId, status, providerTxnId, metadata } = verificationResult;

            // לוג callback
            paymentLogger.logPaymentCallback('tranzila', paymentLinkId, status, req.body);

            // מציאת התשלום ועדכון הסטטוס
            const payment = await Payment.findOne({ paymentLinkId });
            if (!payment) {
                paymentLogger.logSecurityEvent('payment_not_found', {
                    paymentLinkId,
                    provider: 'tranzila'
                });
                console.error(`Payment not found for linkId: ${paymentLinkId}`);
                return res.status(404).json({ error: 'Payment not found' });
            }

            // עדכון התשלום
            const oldStatus = payment.status;
            payment.status = status;
            payment.providerTxnId = providerTxnId;
            payment.callbackData = metadata;
            await payment.save();

            // לוג שינוי סטטוס
            paymentLogger.logPaymentStatusChange(paymentLinkId, oldStatus, status, providerTxnId);

            console.log(`Payment ${paymentLinkId} updated to status: ${status}`);

            // Side effects - יצירת תיעוד ב-CRM
            if (status === 'paid') {
                // כאן ניתן להוסיף יצירת Interaction/Transaction
                console.log(`Payment ${paymentLinkId} completed successfully`);

                // עדכון סטטוס פגישה אם יש
                if (payment.sessionId) {
                    await Appointment.findByIdAndUpdate(payment.sessionId, {
                        paymentStatus: 'PAID',
                        paidAt: new Date()
                    });
                }
            }

            res.status(200).json({ ok: true });

        } catch (error) {
            paymentLogger.logPaymentError(error, {
                action: 'tranzila_callback',
                provider: 'tranzila',
                ip: req.ip
            });
            res.status(500).json({ error: 'Internal server error' });
        }
    });

/**
 * Callback מספק Mock לבדיקות
 * POST /api/payments/callback/mock
 */
router.post('/callback/mock',
    paymentCallbackLimiter,
    auditLog('payment_callback_mock'),
    async (req, res) => {
        try {
            console.log('Mock callback received:', req.body);

            const provider = PaymentProviderFactory.getProviderByName('mock');
            const verificationResult = await provider.verifyCallback(req);

            if (!verificationResult.ok) {
                console.error('Mock callback verification failed');
                return res.status(400).json({ error: 'Callback verification failed' });
            }

            const { paymentLinkId, status, providerTxnId, metadata } = verificationResult;

            const payment = await Payment.findOne({ paymentLinkId });
            if (!payment) {
                console.error(`Payment not found for linkId: ${paymentLinkId}`);
                return res.status(404).json({ error: 'Payment not found' });
            }

            payment.status = status;
            payment.providerTxnId = providerTxnId;
            payment.callbackData = metadata;
            await payment.save();

            console.log(`Mock payment ${paymentLinkId} updated to status: ${status}`);

            res.status(200).json({ ok: true });

        } catch (error) {
            console.error('Error processing Mock callback:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

/**
 * ביטול לינק תשלום
 * POST /api/payments/cancel
 */
router.post('/cancel',
    auth,
    authorize(['therapist', 'admin']),
    [
        body('paymentLinkId').isUUID().withMessage('מזהה תשלום לא תקין')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { paymentLinkId } = req.body;
            const currentUserId = req.user.id;

            const payment = await Payment.findOne({ paymentLinkId });
            if (!payment) {
                return res.status(404).json({ error: 'תשלום לא נמצא' });
            }

            // בדיקת הרשאות
            if (payment.therapistId.toString() !== currentUserId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'אין הרשאה לבטל תשלום זה' });
            }

            // בדיקה שהתשלום עדיין pending
            if (payment.status !== 'pending') {
                return res.status(400).json({
                    error: 'לא ניתן לבטל תשלום שכבר הושלם או נכשל',
                    currentStatus: payment.status
                });
            }

            payment.status = 'canceled';
            await payment.save();

            console.log(`Payment ${paymentLinkId} canceled by user ${currentUserId}`);

            res.json({
                success: true,
                message: 'לינק התשלום בוטל בהצלחה'
            });

        } catch (error) {
            console.error('Error canceling payment:', error);
            res.status(500).json({ error: 'שגיאה פנימית בשרת' });
        }
    }
);

/**
 * התחלת תשלום - קבלת checkout URL
 * POST /api/payment-links/start
 */
router.post('/start',
    [
        body('paymentLinkId').isUUID().withMessage('מזהה תשלום לא תקין'),
        body('paymentMethod').optional().isIn(['credit', 'bit', 'gpay', 'apay', 'all']).withMessage('אמצעי תשלום לא נתמך')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { paymentLinkId, paymentMethod = 'all' } = req.body;

            const payment = await Payment.findOne({ paymentLinkId });
            if (!payment) {
                return res.status(404).json({ error: 'תשלום לא נמצא' });
            }

            // בדיקה אם התשלום פג תוקף
            if (payment.isExpired()) {
                await payment.markAsExpired();
                return res.status(410).json({
                    error: 'לינק התשלום פג תוקף',
                    expired: true
                });
            }

            // אם התשלום כבר שולם או נכשל
            if (payment.status !== 'pending') {
                return res.status(400).json({
                    error: 'התשלום כבר הושלם או נכשל',
                    status: payment.status
                });
            }

            // אם יש כבר checkoutUrl ואותו paymentMethod, החזר אותו
            if (payment.checkoutUrl && payment.paymentMethod === paymentMethod) {
                return res.json({
                    success: true,
                    checkoutUrl: payment.checkoutUrl
                });
            }

            // אחרת, צור חדש
            const provider = PaymentProviderFactory.getProvider();
            const checkoutResult = await provider.createCheckout({
                ...payment.toObject(),
                clientName: payment.clientId?.fullName || 'לקוח',
                clientEmail: payment.clientId?.email || '',
                clientPhone: payment.clientId?.phone || '',
                paymentMethod: paymentMethod
            });

            // עדכון ה-checkoutUrl וה-paymentMethod ברשומה
            payment.checkoutUrl = checkoutResult.redirectUrl;
            payment.paymentMethod = paymentMethod;
            await payment.save();

            res.json({
                success: true,
                checkoutUrl: checkoutResult.redirectUrl
            });

        } catch (error) {
            console.error('Error starting payment:', error);
            res.status(500).json({ error: 'שגיאה פנימית בשרת' });
        }
    }
);

/**
 * בדיקת בריאות מערכת התשלומים
 * GET /api/payments/health
 */
router.get('/health', async (req, res) => {
    try {
        const provider = PaymentProviderFactory.getProvider();

        res.json({
            provider: provider.getName(),
            ok: true,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('Payment health check failed:', error);
        res.status(500).json({
            provider: 'unknown',
            ok: false,
            error: error.message
        });
    }
});

module.exports = router;
