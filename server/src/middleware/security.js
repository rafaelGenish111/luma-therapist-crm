const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting configurations for different endpoints
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message: message || 'יותר מדי בקשות. נסה שוב מאוחר יותר.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        // Store rate limit info in headers
        skip: (req, res) => false, // Apply to all requests
        handler: (req, res) => {
            console.log(`Rate limit reached for IP: ${req.ip}, endpoint: ${req.path}`);
            res.status(429).json({
                success: false,
                message: message || 'יותר מדי בקשות. נסה שוב מאוחר יותר.'
            });
        }
    });
};

// General API rate limiting - relaxed for development
const generalLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    process.env.NODE_ENV === 'production' ? 100 : 1000, // More requests in development
    'יותר מדי בקשות. נסה שוב בעוד 15 דקות.'
);

// Strict rate limiting for authentication endpoints
const authLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // 5 login attempts per window
    'יותר מדי ניסיונות התחברות. נסה שוב בעוד 15 דקות.'
);

// Very strict rate limiting for password reset
const passwordResetLimiter = createRateLimiter(
    60 * 60 * 1000, // 1 hour
    3, // 3 password reset attempts per hour
    'יותר מדי בקשות לאיפוס סיסמה. נסה שוב בעוד שעה.'
);

// Rate limiting for OTP requests
const otpLimiter = createRateLimiter(
    10 * 60 * 1000, // 10 minutes
    5, // 5 OTP requests per window
    'יותר מדי בקשות לקוד אימות. נסה שוב בעוד 10 דקות.'
);

// Rate limiting for digital signature operations
const signatureLimiter = createRateLimiter(
    30 * 60 * 1000, // 30 minutes
    10, // 10 signature operations per window
    'יותר מדי פעולות חתימה. נסה שוב בעוד 30 דקות.'
);

// HTTPS enforcement middleware
const enforceHTTPS = (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.status(400).json({
            success: false,
            message: 'HTTPS נדרש עבור פעולות רגישות'
        });
    }
    next();
};

// Security headers configuration
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// Audit log middleware
const auditLog = (action) => {
    return (req, res, next) => {
        // Log security-sensitive actions
        const logData = {
            timestamp: new Date().toISOString(),
            action,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
            path: req.path,
            method: req.method
        };

        console.log('Security Audit:', JSON.stringify(logData));

        // Store in database if needed
        // await AuditLog.create(logData);

        next();
    };
};

// IP whitelist validation (for admin operations)
const validateIPWhitelist = (whitelist = []) => {
    return (req, res, next) => {
        if (whitelist.length === 0) {
            return next(); // No whitelist configured
        }

        const clientIP = req.ip;
        if (!whitelist.includes(clientIP)) {
            console.log(`Blocked request from non-whitelisted IP: ${clientIP}`);
            return res.status(403).json({
                success: false,
                message: 'גישה מכתובת IP זו אינה מורשית'
            });
        }

        next();
    };
};

// Request validation middleware
const validateRequest = (req, res, next) => {
    // Check for common attack patterns
    const suspiciousPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /(union|select|insert|delete|drop|create|alter)\s+/gi
    ];

    const requestBody = JSON.stringify(req.body);
    const requestQuery = JSON.stringify(req.query);

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(requestBody) || pattern.test(requestQuery)) {
            console.log(`Suspicious request detected from IP: ${req.ip}`);
            return res.status(400).json({
                success: false,
                message: 'בקשה לא תקינה זוהתה'
            });
        }
    }

    next();
};

module.exports = {
    generalLimiter,
    authLimiter,
    passwordResetLimiter,
    otpLimiter,
    signatureLimiter,
    enforceHTTPS,
    securityHeaders,
    auditLog,
    validateIPWhitelist,
    validateRequest,
    createRateLimiter
};
