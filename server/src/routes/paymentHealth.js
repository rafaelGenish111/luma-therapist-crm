const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const PaymentProviderFactory = require('../payments/providerFactory');
const paymentConfig = require('../config/payments');

/**
 * בדיקת בריאות מערכת התשלומים
 * GET /api/payment-links/health
 */
router.get('/health', async (req, res) => {
    try {
        const provider = PaymentProviderFactory.getProvider();

        // בדיקת חיבור למסד הנתונים
        const dbStatus = await checkDatabaseConnection();

        // בדיקת קונפיגורציה
        const configStatus = checkConfiguration();

        // בדיקת ספק התשלום
        const providerStatus = checkProviderStatus(provider);

        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: paymentConfig.environment,
            provider: provider.getName(),
            checks: {
                database: dbStatus,
                configuration: configStatus,
                provider: providerStatus
            }
        };

        // אם יש בעיות, החזר סטטוס לא תקין
        const hasIssues = Object.values(healthStatus.checks).some(check => !check.healthy);
        if (hasIssues) {
            healthStatus.status = 'unhealthy';
            return res.status(503).json(healthStatus);
        }

        res.json(healthStatus);
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * יצירת תשלום לדמו
 * POST /api/payment-links/seed
 */
router.post('/seed', async (req, res) => {
    try {
        // מצא מטפל ראשון
        const therapist = await Therapist.findOne();
        if (!therapist) {
            return res.status(404).json({ error: 'לא נמצא מטפל במערכת' });
        }

        // מצא לקוח ראשון של המטפל
        const client = await Client.findOne({ therapist: therapist._id });
        if (!client) {
            return res.status(404).json({ error: 'לא נמצא לקוח למטפל זה' });
        }

        // צור תשלום לדמו
        const { v4: uuidv4 } = require('uuid');
        const paymentLinkId = uuidv4();

        const payment = new Payment({
            therapistId: therapist._id,
            clientId: client._id,
            amount: 150.00,
            currency: 'ILS',
            status: 'pending',
            paymentLinkId,
            provider: paymentConfig.provider,
            description: 'תשלום לדמו - בדיקת מערכת',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        await payment.save();

        // צור checkout URL
        const provider = PaymentProviderFactory.getProvider();
        const checkoutResult = await provider.createCheckout({
            ...payment.toObject(),
            clientName: client.fullName,
            clientEmail: client.email,
            clientPhone: client.phone
        });

        payment.checkoutUrl = checkoutResult.redirectUrl;
        await payment.save();

        const paymentLink = `${paymentConfig.appBaseUrl}/pay/${paymentLinkId}`;

        console.log('🎯 Demo payment created:');
        console.log(`   Payment Link: ${paymentLink}`);
        console.log(`   Checkout URL: ${checkoutResult.redirectUrl}`);
        console.log(`   Amount: ₪${payment.amount}`);
        console.log(`   Client: ${client.fullName}`);
        console.log(`   Therapist: ${therapist.fullName}`);

        res.json({
            success: true,
            message: 'תשלום לדמו נוצר בהצלחה',
            payment: {
                paymentLink,
                checkoutUrl: checkoutResult.redirectUrl,
                paymentLinkId,
                amount: payment.amount,
                currency: payment.currency,
                clientName: client.fullName,
                therapistName: therapist.fullName,
                expiresAt: payment.expiresAt
            }
        });

    } catch (error) {
        console.error('Error creating demo payment:', error);
        res.status(500).json({ error: 'שגיאה ביצירת תשלום לדמו' });
    }
});

/**
 * בדיקת סטטיסטיקות תשלומים
 * GET /api/payment-links/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await Payment.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totalPayments = await Payment.countDocuments();
        const totalAmount = await Payment.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const expiredPayments = await Payment.countDocuments({
            status: 'pending',
            expiresAt: { $lt: new Date() }
        });

        res.json({
            success: true,
            stats: {
                totalPayments,
                totalAmount: totalAmount[0]?.total || 0,
                byStatus: stats,
                expiredPayments,
                provider: paymentConfig.provider,
                environment: paymentConfig.environment
            }
        });

    } catch (error) {
        console.error('Error fetching payment stats:', error);
        res.status(500).json({ error: 'שגיאה בקבלת סטטיסטיקות' });
    }
});

/**
 * ניקוי תשלומים פגי תוקף
 * POST /api/payment-links/cleanup
 */
router.post('/cleanup', async (req, res) => {
    try {
        const result = await Payment.updateMany(
            {
                status: 'pending',
                expiresAt: { $lt: new Date() }
            },
            { status: 'expired' }
        );

        console.log(`Cleaned up ${result.modifiedCount} expired payments`);

        res.json({
            success: true,
            message: `נוקו ${result.modifiedCount} תשלומים פגי תוקף`,
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Error cleaning up payments:', error);
        res.status(500).json({ error: 'שגיאה בניקוי תשלומים' });
    }
});

// Helper functions
async function checkDatabaseConnection() {
    try {
        await Payment.findOne().limit(1);
        return { healthy: true, message: 'Database connected' };
    } catch (error) {
        return { healthy: false, message: `Database error: ${error.message}` };
    }
}

function checkConfiguration() {
    try {
        // בדיקת משתנים נדרשים
        const requiredVars = ['PAYMENT_PROVIDER', 'APP_BASE_URL'];
        const missing = requiredVars.filter(varName => !process.env[varName]);

        if (missing.length > 0) {
            return { healthy: false, message: `Missing env vars: ${missing.join(', ')}` };
        }

        return { healthy: true, message: 'Configuration valid' };
    } catch (error) {
        return { healthy: false, message: `Configuration error: ${error.message}` };
    }
}

function checkProviderStatus(provider) {
    try {
        // בדיקת תמיכה בשיטות תשלום
        const supportedMethods = ['credit', 'bit', 'gpay', 'apay'];
        const unsupported = supportedMethods.filter(method => !provider.supports(method));

        if (unsupported.length > 0) {
            return {
                healthy: false,
                message: `Provider doesn't support: ${unsupported.join(', ')}`
            };
        }

        return { healthy: true, message: 'Provider configured correctly' };
    } catch (error) {
        return { healthy: false, message: `Provider error: ${error.message}` };
    }
}

module.exports = router;
