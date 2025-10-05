const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const helmet = require('helmet');
const cors = require('cors');

/**
 * Security Middleware
 * הגנה מפני התקפות נפוצות כמו NoSQL injection, XSS, ועוד
 */

/**
 * Input Sanitization Middleware
 * מניעת NoSQL injection ו-XSS attacks
 */
const sanitizeMiddleware = (app) => {
  // Prevent NoSQL injection attacks
  app.use(mongoSanitize({
    replaceWith: '_', // Replace prohibited characters with underscore
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized key: ${key} in request to ${req.path}`);
    }
  }));

  // Prevent XSS attacks
  app.use((req, res, next) => {
    const sanitizeObject = (obj) => {
      if (typeof obj === 'string') {
        return xss(obj, {
          whiteList: {
            p: [],
            br: [],
            strong: [],
            em: [],
            ul: [],
            ol: [],
            li: [],
            h1: [],
            h2: [],
            h3: [],
            h4: [],
            h5: [],
            h6: []
          },
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script']
        });
      }
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          obj[key] = sanitizeObject(obj[key]);
        }
      }
      return obj;
    };

    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  });
};

/**
 * Security Headers Middleware
 * הגדרת headers אבטחה מתקדמים
 */
const securityHeadersMiddleware = (app) => {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "https://js.stripe.com", "https://www.google.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false, // Disable for Stripe compatibility
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
};

/**
 * CORS Configuration
 * הגדרת Cross-Origin Resource Sharing
 */
const corsMiddleware = (app) => {
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'https://localhost:3000',
        'https://localhost:3001'
      ].filter(Boolean);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
      'X-Requested-With'
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset'
    ]
  };

  app.use(cors(corsOptions));
};

/**
 * Request Size Limiter
 * הגבלת גודל בקשות למניעת DoS
 */
const requestSizeLimiter = (app) => {
  const express = require('express');
  
  // Limit JSON payload size
  app.use(express.json({ 
    limit: process.env.REQUEST_SIZE_LIMIT || '10mb',
    verify: (req, res, buf) => {
      // Verify JSON is valid
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid JSON payload',
            code: 'INVALID_JSON'
          }
        });
        throw new Error('Invalid JSON');
      }
    }
  }));

  // Limit URL-encoded payload size
  app.use(express.urlencoded({ 
    limit: process.env.REQUEST_SIZE_LIMIT || '10mb',
    extended: true 
  }));
};

/**
 * IP Whitelist Middleware
 * רשימת IP מורשים (אופציונלי)
 */
const ipWhitelistMiddleware = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No whitelist configured
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.includes(clientIP)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. IP not whitelisted.',
          code: 'IP_NOT_WHITELISTED'
        }
      });
    }
  };
};

/**
 * Request Validation Middleware
 * ולידציה בסיסית של בקשות
 */
const requestValidationMiddleware = (req, res, next) => {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i
  ];

  const checkString = (str) => {
    if (typeof str !== 'string') return false;
    return suspiciousPatterns.some(pattern => pattern.test(str));
  };

  const checkObject = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string' && checkString(value)) {
        console.warn(`Suspicious pattern detected in ${currentPath}: ${value}`);
        return res.status(400).json({
          success: false,
          error: {
            message: 'Suspicious content detected',
            code: 'SUSPICIOUS_CONTENT'
          }
        });
      }
      
      if (typeof value === 'object' && value !== null) {
        const result = checkObject(value, currentPath);
        if (result) return result;
      }
    }
    return false;
  };

  // Check request body
  if (req.body && typeof req.body === 'object') {
    const result = checkObject(req.body);
    if (result) return result;
  }

  // Check query parameters
  if (req.query && typeof req.query === 'object') {
    const result = checkObject(req.query);
    if (result) return result;
  }

  next();
};

/**
 * Security Headers for API responses
 * הוספת headers אבטחה לתגובות API
 */
const responseSecurityHeaders = (req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add API version header
  res.setHeader('X-API-Version', process.env.API_VERSION || '1.0.0');
  
  next();
};

/**
 * Request Logging Middleware
 * רישום בקשות חשודות
 */
const securityLoggingMiddleware = (req, res, next) => {
  const logger = require('../utils/logger');
  
  // Log suspicious requests
  const suspiciousIndicators = [
    req.headers['user-agent']?.includes('bot'),
    req.headers['user-agent']?.includes('crawler'),
    req.headers['user-agent']?.includes('spider'),
    req.path.includes('..'),
    req.path.includes('admin'),
    req.path.includes('php'),
    req.path.includes('asp'),
    req.query?.includes('<script'),
    req.query?.includes('javascript:')
  ];

  if (suspiciousIndicators.some(indicator => indicator)) {
    logger.warn('Suspicious request detected', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
      query: req.query,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Apply all security middleware
 * הפעלת כל middleware האבטחה
 */
const applySecurityMiddleware = (app) => {
  // Apply security middleware in order
  securityHeadersMiddleware(app);
  corsMiddleware(app);
  sanitizeMiddleware(app);
  requestSizeLimiter(app);
  requestValidationMiddleware(app);
  responseSecurityHeaders(app);
  securityLoggingMiddleware(app);
  
  console.log('✅ Security middleware applied successfully');
};

module.exports = {
  applySecurityMiddleware,
  sanitizeMiddleware,
  securityHeadersMiddleware,
  corsMiddleware,
  requestSizeLimiter,
  ipWhitelistMiddleware,
  requestValidationMiddleware,
  responseSecurityHeaders,
  securityLoggingMiddleware
};
