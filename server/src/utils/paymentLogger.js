const winston = require('winston');

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'payment-service' },
    transports: [
        // Write all logs with importance level of `error` or less to `error.log`
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // Write all logs with importance level of `info` or less to `combined.log`
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Redact sensitive information
const redactSensitiveData = (data) => {
    if (typeof data !== 'object' || data === null) {
        return data;
    }

    const sensitiveFields = [
        'password', 'token', 'secret', 'key', 'authorization',
        'creditCard', 'cardNumber', 'cvv', 'expiry',
        'phone', 'email', 'nationalId', 'idNumber'
    ];

    const redacted = { ...data };

    for (const field of sensitiveFields) {
        if (redacted[field]) {
            redacted[field] = '[REDACTED]';
        }
    }

    // Recursively redact nested objects
    for (const key in redacted) {
        if (typeof redacted[key] === 'object' && redacted[key] !== null) {
            redacted[key] = redactSensitiveData(redacted[key]);
        }
    }

    return redacted;
};

// Payment-specific logging methods
const paymentLogger = {
    // Log payment creation
    logPaymentCreated: (paymentData, therapistId) => {
        logger.info('Payment link created', {
            action: 'payment_created',
            therapistId,
            clientId: paymentData.clientId,
            amount: paymentData.amount,
            currency: paymentData.currency,
            paymentLinkId: paymentData.paymentLinkId,
            provider: paymentData.provider,
            timestamp: new Date().toISOString()
        });
    },

    // Log payment status change
    logPaymentStatusChange: (paymentLinkId, oldStatus, newStatus, providerTxnId) => {
        logger.info('Payment status changed', {
            action: 'payment_status_change',
            paymentLinkId,
            oldStatus,
            newStatus,
            providerTxnId,
            timestamp: new Date().toISOString()
        });
    },

    // Log payment callback
    logPaymentCallback: (provider, paymentLinkId, status, callbackData) => {
        logger.info('Payment callback received', {
            action: 'payment_callback',
            provider,
            paymentLinkId,
            status,
            callbackData: redactSensitiveData(callbackData),
            timestamp: new Date().toISOString()
        });
    },

    // Log payment errors
    logPaymentError: (error, context) => {
        logger.error('Payment error occurred', {
            action: 'payment_error',
            error: error.message,
            stack: error.stack,
            context: redactSensitiveData(context),
            timestamp: new Date().toISOString()
        });
    },

    // Log security events
    logSecurityEvent: (event, details) => {
        logger.warn('Security event', {
            action: 'security_event',
            event,
            details: redactSensitiveData(details),
            timestamp: new Date().toISOString()
        });
    },

    // Log rate limit hits
    logRateLimitHit: (endpoint, ip, userAgent) => {
        logger.warn('Rate limit hit', {
            action: 'rate_limit_hit',
            endpoint,
            ip,
            userAgent,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = {
    logger,
    paymentLogger,
    redactSensitiveData
};
