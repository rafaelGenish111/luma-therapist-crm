const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware
 * הגבלת קצב בקשות API למניעת התקפות DDoS ו-abuse
 */

// General API rate limiter - 100 requests per 15 minutes
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'יותר מדי בקשות מ-IP זה. אנא נסה שוב מאוחר יותר.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'יותר מדי בקשות מ-IP זה. אנא נסה שוב מאוחר יותר.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

// Booking rate limiter - stricter limits for booking endpoints
exports.bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.BOOKING_RATE_LIMIT_MAX) || 5, // max 5 bookings per hour per IP
  message: {
    success: false,
    error: {
      message: 'יותר מדי ניסיונות הזמנה. אנא נסה שוב בעוד שעה.',
      code: 'BOOKING_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'יותר מדי ניסיונות הזמנה. אנא נסה שוב בעוד שעה.',
        code: 'BOOKING_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  },
  keyGenerator: (req) => {
    // Use IP + email for more granular limiting
    const email = req.body?.clientInfo?.email || req.body?.email || '';
    return `${req.ip}-${email}`;
  }
});

// Google OAuth rate limiter - prevent OAuth abuse
exports.oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.OAUTH_RATE_LIMIT_MAX) || 10, // max 10 OAuth attempts per 15 minutes
  message: {
    success: false,
    error: {
      message: 'יותר מדי ניסיונות חיבור ל-Google. אנא נסה שוב מאוחר יותר.',
      code: 'OAUTH_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'יותר מדי ניסיונות חיבור ל-Google. אנא נסה שוב מאוחר יותר.',
        code: 'OAUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

// Email sending rate limiter - prevent email spam
exports.emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.EMAIL_RATE_LIMIT_MAX) || 50, // max 50 emails per hour per IP
  message: {
    success: false,
    error: {
      message: 'יותר מדי אימיילים נשלחו. אנא נסה שוב מאוחר יותר.',
      code: 'EMAIL_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'יותר מדי אימיילים נשלחו. אנא נסה שוב מאוחר יותר.',
        code: 'EMAIL_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

// Login rate limiter - prevent brute force attacks
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5, // max 5 login attempts per 15 minutes
  message: {
    success: false,
    error: {
      message: 'יותר מדי ניסיונות התחברות. אנא נסה שוב בעוד 15 דקות.',
      code: 'LOGIN_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'יותר מדי ניסיונות התחברות. אנא נסה שוב בעוד 15 דקות.',
        code: 'LOGIN_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req) => {
    // Use IP + email for more granular limiting
    const email = req.body?.email || '';
    return `${req.ip}-${email}`;
  }
});

// Password reset rate limiter
exports.passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX) || 3, // max 3 password reset attempts per hour
  message: {
    success: false,
    error: {
      message: 'יותר מדי ניסיונות איפוס סיסמה. אנא נסה שוב בעוד שעה.',
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'יותר מדי ניסיונות איפוס סיסמה. אנא נסה שוב בעוד שעה.',
        code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  },
  keyGenerator: (req) => {
    const email = req.body?.email || '';
    return `${req.ip}-${email}`;
  }
});

// File upload rate limiter
exports.uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX) || 20, // max 20 uploads per hour
  message: {
    success: false,
    error: {
      message: 'יותר מדי העלאות קבצים. אנא נסה שוב מאוחר יותר.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'יותר מדי העלאות קבצים. אנא נסה שוב מאוחר יותר.',
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

// Strict rate limiter for sensitive operations
exports.strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: parseInt(process.env.STRICT_RATE_LIMIT_MAX) || 3, // max 3 requests per 5 minutes
  message: {
    success: false,
    error: {
      message: 'יותר מדי בקשות לפעולה רגישה. אנא נסה שוב מאוחר יותר.',
      code: 'STRICT_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'יותר מדי בקשות לפעולה רגישה. אנא נסה שוב מאוחר יותר.',
        code: 'STRICT_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

// Dynamic rate limiter based on user type
exports.dynamicLimiter = (req, res, next) => {
  // Different limits for different user types
  let maxRequests;
  let windowMs;

  if (req.user?.role === 'ADMIN') {
    maxRequests = 1000;
    windowMs = 15 * 60 * 1000; // 15 minutes
  } else if (req.user?.role === 'THERAPIST') {
    maxRequests = 500;
    windowMs = 15 * 60 * 1000; // 15 minutes
  } else {
    maxRequests = 100;
    windowMs = 15 * 60 * 1000; // 15 minutes
  }

  const limiter = rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      error: {
        message: 'יותר מדי בקשות. אנא נסה שוב מאוחר יותר.',
        code: 'DYNAMIC_RATE_LIMIT_EXCEEDED'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.user?.id || req.ip;
    }
  });

  limiter(req, res, next);
};

// Rate limiter for specific endpoints
exports.createEndpointLimiter = (endpoint, maxRequests, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      error: {
        message: `יותר מדי בקשות ל-${endpoint}. אנא נסה שוב מאוחר יותר.`,
        code: 'ENDPOINT_RATE_LIMIT_EXCEEDED'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          message: `יותר מדי בקשות ל-${endpoint}. אנא נסה שוב מאוחר יותר.`,
          code: 'ENDPOINT_RATE_LIMIT_EXCEEDED',
          retryAfter: Math.round(req.rateLimit.resetTime / 1000)
        }
      });
    }
  });
};

// Whitelist for trusted IPs (optional)
exports.createWhitelistLimiter = (whitelist = []) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Higher limit for whitelisted IPs
    message: {
      success: false,
      error: {
        message: 'יותר מדי בקשות. אנא נסה שוב מאוחר יותר.',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    },
    skip: (req) => {
      return whitelist.includes(req.ip);
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

module.exports = exports;
