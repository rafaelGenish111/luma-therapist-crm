// server/src/middleware/validation.js
const { z } = require('zod');

/**
 * Universal validation middleware using Zod schemas
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {string} [target='body'] - What to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validateRequest = (schema, target = 'body') => {
  return async (req, res, next) => {
    try {
      // בחירת המקור לבדיקה
      let dataToValidate;
      switch (target) {
        case 'query':
          dataToValidate = req.query;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        case 'body':
        default:
          dataToValidate = req.body;
          break;
      }

      // הרצת הvalidation
      const validatedData = await schema.parseAsync(dataToValidate);
      
      // שמירת הנתונים המוולדים
      req.validatedData = validatedData;
      
      // אם זה body, נחליף את req.body בנתונים הנקיים
      if (target === 'body') {
        req.body = validatedData;
      }
      
      next();
    } catch (error) {
      // טיפול בשגיאות Zod
      if (error instanceof z.ZodError) {
        const errorDetails = error.errors.map(err => ({
          field: err.path.join('.') || 'root',
          message: err.message,
          code: err.code,
          received: err.received
        }));

        return res.status(400).json({
          success: false,
          error: 'נתונים לא תקינים',
          message: 'הבקשה כוללת נתונים לא תקינים',
          details: errorDetails,
          timestamp: new Date().toISOString()
        });
      }

      // שגיאות אחרות
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'שגיאה פנימית בשרת',
        message: 'אירעה שגיאה בעת בדיקת הנתונים'
      });
    }
  };
};

/**
 * Middleware for validating query parameters
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
const validateQuery = (schema) => {
  return validateRequest(schema, 'query');
};

/**
 * Middleware for validating URL parameters
 * @param {z.ZodSchema} schema - Zod schema to validate against  
 * @returns {Function} Express middleware function
 */
const validateParams = (schema) => {
  return validateRequest(schema, 'params');
};

/**
 * Middleware for validating request body
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
const validateBody = (schema) => {
  return validateRequest(schema, 'body');
};

/**
 * Helper function to create consistent error responses
 * @param {string} message - Error message
 * @param {Array} details - Detailed error information
 * @returns {Object} Error response object
 */
const createValidationError = (message, details = []) => {
  return {
    success: false,
    error: 'נתונים לא תקינים',
    message,
    details,
    timestamp: new Date().toISOString()
  };
};

/**
 * Security validation middleware - checks for common attack patterns
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const securityValidation = (req, res, next) => {
  try {
    const suspiciousPatterns = [
      // SQL Injection patterns
      /(union|select|insert|delete|drop|create|alter|exec|execute)\s+/gi,
      /(\s|^)(or|and)\s+\d+\s*=\s*\d+/gi,
      /['"];?\s*(or|and|union|select)/gi,
      
      // NoSQL Injection patterns
      /\$where|\$ne|\$gt|\$lt|\$regex|\$in|\$nin/gi,
      
      // XSS patterns
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      
      // Command Injection patterns
      /[;&|`](\s)*(ls|cat|cp|mv|rm|mkdir|chmod|wget|curl)/gi,
      
      // Path Traversal patterns
      /\.\.[\/\\]/gi,
      /(etc\/passwd|boot\.ini|windows\/system32)/gi
    ];

    // בדיקת הBody
    const requestBody = JSON.stringify(req.body || {});
    const requestQuery = JSON.stringify(req.query || {});
    const requestParams = JSON.stringify(req.params || {});
    
    const allData = requestBody + requestQuery + requestParams;

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(allData)) {
        console.warn(`Suspicious request detected from IP: ${req.ip}`, {
          pattern: pattern.toString(),
          url: req.originalUrl,
          method: req.method,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        });

        return res.status(400).json({
          success: false,
          error: 'בקשה לא תקינה',
          message: 'הבקשה כוללת תוכן חשוד'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Security validation error:', error);
    next(); // ממשיכים גם אם יש שגיאה בבדיקת האבטחה
  }
};

/**
 * File upload validation middleware
 * @param {Object} options - Validation options
 * @param {Array} options.allowedTypes - Allowed MIME types
 * @param {number} options.maxSize - Maximum file size in bytes
 * @param {number} options.maxFiles - Maximum number of files
 * @returns {Function} Express middleware function
 */
const validateFileUpload = (options = {}) => {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxSize = 5 * 1024 * 1024, // 5MB
    maxFiles = 5
  } = options;

  return (req, res, next) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return next(); // אין קבצים - ממשיכים
      }

      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      
      // בדיקת מספר קבצים
      if (files.length > maxFiles) {
        return res.status(400).json({
          success: false,
          error: 'יותר מדי קבצים',
          message: `ניתן להעלות עד ${maxFiles} קבצים בבת אחת`
        });
      }

      // בדיקת כל קובץ
      for (const file of files) {
        // בדיקת גודל
        if (file.size > maxSize) {
          return res.status(400).json({
            success: false,
            error: 'קובץ גדול מדי',
            message: `גודל הקובץ לא יכול להיות יותר מ-${Math.round(maxSize / 1024 / 1024)}MB`
          });
        }

        // בדיקת סוג
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            error: 'סוג קובץ לא נתמך',
            message: `סוגי קבצים מותרים: ${allowedTypes.join(', ')}`
          });
        }
      }

      next();
    } catch (error) {
      console.error('File validation error:', error);
      res.status(500).json({
        success: false,
        error: 'שגיאה בבדיקת קבצים'
      });
    }
  };
};

module.exports = {
  validateRequest,
  validateQuery,
  validateParams,
  validateBody,
  securityValidation,
  validateFileUpload,
  createValidationError
};