const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const enhancedBillingService = require('../services/enhancedBillingService');

// Process payment
router.post('/payments/process', auth, authorize(['therapist']), async (req, res) => {
    try {
        console.log('💳 Enhanced Payments API - Processing payment request:', {
            clientId: req.body.clientId,
            amount: req.body.amount,
            method: req.body.method
        });

        // Validate payment data
        const validation = await enhancedBillingService.validatePaymentData(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.errors
            });
        }

        // Add therapist ID to payment data
        const paymentData = {
            ...req.body,
            therapistId: req.user.id
        };

        // Process payment
        const result = await enhancedBillingService.processPayment(paymentData);

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Payment processed successfully',
                payment: result.payment,
                transactionId: result.transactionId,
                invoice: result.invoice
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Enhanced Payments API - Payment processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get payment history for client
router.get('/payments/clients/:clientId/history', auth, authorize(['therapist']), async (req, res) => {
    try {
        const { clientId } = req.params;
        const {
            page = 1,
            limit = 20,
            status,
            method,
            startDate,
            endDate
        } = req.query;

        const result = await enhancedBillingService.getPaymentHistory(clientId, {
            page: parseInt(page),
            limit: parseInt(limit),
            status,
            method,
            startDate,
            endDate
        });

        if (result.success) {
            res.json({
                success: true,
                payments: result.payments,
                pagination: result.pagination
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Enhanced Payments API - Get payment history error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get payment summary for client
router.get('/payments/clients/:clientId/summary', auth, authorize(['therapist']), async (req, res) => {
    try {
        const { clientId } = req.params;

        const result = await enhancedBillingService.getPaymentSummary(clientId);

        if (result.success) {
            res.json({
                success: true,
                summary: result.summary
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Enhanced Payments API - Get payment summary error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get available payment methods
router.get('/payments/methods', auth, authorize(['therapist']), async (req, res) => {
    try {
        const result = await enhancedBillingService.getPaymentMethods();

        res.json({
            success: true,
            methods: result.methods
        });
    } catch (error) {
        console.error('Enhanced Payments API - Get payment methods error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get payment status
router.get('/payments/status/:transactionId', auth, authorize(['therapist']), async (req, res) => {
    try {
        const { transactionId } = req.params;

        const result = await enhancedBillingService.getPaymentStatus(transactionId);

        if (result.success) {
            res.json({
                success: true,
                payment: result.payment
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Enhanced Payments API - Get payment status error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Process refund
router.post('/payments/:paymentId/refund', auth, authorize(['therapist']), async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { amount, reason } = req.body;

        const result = await enhancedBillingService.refundPayment(paymentId, {
            amount,
            reason
        });

        if (result.success) {
            res.json({
                success: true,
                message: 'Refund processed successfully',
                refund: result.refund
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Enhanced Payments API - Refund processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// PayPlus webhook callback
router.post('/payments/payplus-callback', async (req, res) => {
    try {
        console.log('💳 PayPlus Webhook - Received callback:', req.body);

        const { transaction_id, status, amount, currency } = req.body;

        // Find payment by transaction ID
        const Payment = require('../models/Payment');
        const payment = await Payment.findOne({ transactionId: transaction_id });

        if (payment) {
            // Update payment status
            payment.status = status === 'approved' ? 'completed' : 'failed';
            payment.processedAt = new Date();
            await payment.save();

            console.log('💳 PayPlus Webhook - Updated payment status:', {
                paymentId: payment._id,
                transactionId: transaction_id,
                status: payment.status
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('PayPlus Webhook error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GreenInvoice webhook callback
router.post('/payments/greeninvoice-callback', async (req, res) => {
    try {
        console.log('💳 GreenInvoice Webhook - Received callback:', req.body);

        const { payment_id, status, amount, currency } = req.body;

        // Find payment by transaction ID
        const Payment = require('../models/Payment');
        const payment = await Payment.findOne({ transactionId: payment_id });

        if (payment) {
            // Update payment status
            payment.status = status === 'paid' ? 'completed' : 'failed';
            payment.processedAt = new Date();
            await payment.save();

            console.log('💳 GreenInvoice Webhook - Updated payment status:', {
                paymentId: payment._id,
                transactionId: payment_id,
                status: payment.status
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('GreenInvoice Webhook error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get payment statistics
router.get('/payments/stats', auth, authorize(['therapist']), async (req, res) => {
    try {
        const { startDate, endDate, clientId } = req.query;

        const Payment = require('../models/Payment');
        const query = {};

        if (startDate || endDate) {
            query.processedAt = {};
            if (startDate) query.processedAt.$gte = new Date(startDate);
            if (endDate) query.processedAt.$lte = new Date(endDate);
        }

        if (clientId) {
            query.client = clientId;
        }

        const payments = await Payment.find(query);
        
        const stats = {
            totalPayments: payments.length,
            totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
            averageAmount: payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0,
            byMethod: {},
            byStatus: {},
            byMonth: {}
        };

        payments.forEach(payment => {
            // Count by method
            stats.byMethod[payment.method] = (stats.byMethod[payment.method] || 0) + 1;
            
            // Count by status
            stats.byStatus[payment.status] = (stats.byStatus[payment.status] || 0) + 1;
            
            // Count by month
            const month = new Date(payment.processedAt).toISOString().substr(0, 7);
            stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
        });

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Enhanced Payments API - Get stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Test payment endpoint (for development)
router.post('/payments/test', auth, authorize(['therapist']), async (req, res) => {
    try {
        if (process.env.NODE_ENV !== 'development') {
            return res.status(403).json({
                success: false,
                error: 'Test endpoint only available in development'
            });
        }

        const testPaymentData = {
            clientId: req.body.clientId,
            amount: req.body.amount || 100,
            currency: 'ILS',
            method: 'simulation',
            description: 'Test payment'
        };

        const result = await enhancedBillingService.processPayment(testPaymentData);

        if (result.success) {
            res.json({
                success: true,
                message: 'Test payment processed successfully',
                payment: result.payment
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Enhanced Payments API - Test payment error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;
