const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Global Error Handler Middleware
 * מטפל שגיאות גלובלי מתקדם
 */

/**
 * Handle async errors
 * מטפל בשגיאות async
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Global error handler
 * מטפל שגיאות גלובלי
 */
const globalErrorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error details
    logger.error('Global error handler triggered', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id,
        body: req.body,
        query: req.query,
        params: req.params,
        timestamp: new Date().toISOString()
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new AppError(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} already exists`;
        error = new AppError(message, 409);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new AppError(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new AppError(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = new AppError(message, 401);
    }

    // Rate limit errors
    if (err.name === 'TooManyRequestsError') {
        const message = 'Too many requests';
        error = new AppError(message, 429);
    }

    // CORS errors
    if (err.message === 'Not allowed by CORS') {
        const message = 'CORS policy violation';
        error = new AppError(message, 403);
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'File too large';
        error = new AppError(message, 413);
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        const message = 'Unexpected file field';
        error = new AppError(message, 400);
    }

    // Send error response
    sendErrorResponse(error, req, res);
};

/**
 * Send error response
 * שליחת תגובת שגיאה
 */
const sendErrorResponse = (err, req, res) => {
    const isDev = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    // Default error response
    let errorResponse = {
        success: false,
        error: {
            message: err.message || 'Internal server error',
            code: err.name || 'INTERNAL_ERROR',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
        }
    };

    // Add additional error details in development
    if (isDev) {
        errorResponse.error.stack = err.stack;
        errorResponse.error.details = {
            statusCode: err.statusCode,
            isOperational: err.isOperational,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        };
    }

    // Add specific error details based on error type
    if (err.field) {
        errorResponse.error.field = err.field;
    }

    if (err.resource) {
        errorResponse.error.resource = err.resource;
    }

    if (err.retryAfter) {
        errorResponse.error.retryAfter = err.retryAfter;
        res.setHeader('Retry-After', err.retryAfter);
    }

    if (err.conflictingResource) {
        errorResponse.error.conflictingResource = err.conflictingResource;
    }

    if (err.operation) {
        errorResponse.error.operation = err.operation;
    }

    if (err.service) {
        errorResponse.error.service = err.service;
    }

    if (err.paymentMethod) {
        errorResponse.error.paymentMethod = err.paymentMethod;
    }

    if (err.transactionId) {
        errorResponse.error.transactionId = err.transactionId;
    }

    if (err.recipient) {
        errorResponse.error.recipient = err.recipient;
    }

    if (err.template) {
        errorResponse.error.template = err.template;
    }

    if (err.calendarId) {
        errorResponse.error.calendarId = err.calendarId;
    }

    if (err.filename) {
        errorResponse.error.filename = err.filename;
    }

    if (err.fileSize) {
        errorResponse.error.fileSize = err.fileSize;
    }

    if (err.configKey) {
        errorResponse.error.configKey = err.configKey;
    }

    if (err.rule) {
        errorResponse.error.rule = err.rule;
    }

    if (err.requestedTime) {
        errorResponse.error.requestedTime = err.requestedTime;
    }

    if (err.timeSlot) {
        errorResponse.error.timeSlot = err.timeSlot;
    }

    if (err.appointmentId) {
        errorResponse.error.appointmentId = err.appointmentId;
    }

    if (err.clientId) {
        errorResponse.error.clientId = err.clientId;
    }

    if (err.therapistId) {
        errorResponse.error.therapistId = err.therapistId;
    }

    if (err.requiredRole) {
        errorResponse.error.requiredRole = err.requiredRole;
    }

    if (err.tokenType) {
        errorResponse.error.tokenType = err.tokenType;
    }

    if (err.sessionId) {
        errorResponse.error.sessionId = err.sessionId;
    }

    if (err.key) {
        errorResponse.error.key = err.key;
    }

    // Set status code
    const statusCode = err.statusCode || 500;

    // Log security-related errors
    if (statusCode === 401 || statusCode === 403 || statusCode === 429) {
        logger.security(`Security event: ${err.message}`, {
            statusCode,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            userId: req.user?.id
        });
    }

    // Log audit events for certain operations
    if (err.name === 'ForbiddenError' || err.name === 'UnauthorizedError') {
        logger.audit('Access denied', req.user?.id, {
            error: err.message,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });
    }

    // Send response
    res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 errors
 * מטפל בשגיאות 404
 */
const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(error);
};

/**
 * Handle uncaught exceptions
 * מטפל בשגיאות לא מטופלות
 */
const uncaughtExceptionHandler = () => {
    process.on('uncaughtException', (err) => {
        logger.error('Uncaught Exception! Shutting down...', {
            error: err.message,
            stack: err.stack
        });
        
        process.exit(1);
    });
};

/**
 * Handle unhandled promise rejections
 * מטפל בדחיות Promise לא מטופלות
 */
const unhandledRejectionHandler = () => {
    process.on('unhandledRejection', (err) => {
        logger.error('Unhandled Rejection! Shutting down...', {
            error: err.message,
            stack: err.stack
        });
        
        process.exit(1);
    });
};

/**
 * Error boundary for async operations
 * גבול שגיאות לפעולות async
 */
const errorBoundary = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Validation error handler
 * מטפל בשגיאות ולידציה
 */
const validationErrorHandler = (errors) => {
    const formattedErrors = errors.map(error => ({
        field: error.path,
        message: error.message,
        value: error.value
    }));

    return new AppError('Validation failed', 400, {
        validationErrors: formattedErrors
    });
};

/**
 * Database error handler
 * מטפל בשגיאות מסד נתונים
 */
const databaseErrorHandler = (error) => {
    if (error.name === 'ValidationError') {
        return validationErrorHandler(error.errors);
    }

    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return new AppError(`${field} already exists`, 409);
    }

    if (error.name === 'CastError') {
        return new AppError('Invalid ID format', 400);
    }

    return new AppError('Database operation failed', 500);
};

/**
 * External service error handler
 * מטפל בשגיאות שירותים חיצוניים
 */
const externalServiceErrorHandler = (error, service) => {
    logger.error(`External service error: ${service}`, {
        error: error.message,
        stack: error.stack,
        service
    });

    return new AppError(`External service ${service} is currently unavailable`, 502);
};

/**
 * Initialize error handlers
 * אתחול מטפלי שגיאות
 */
const initializeErrorHandlers = (app) => {
    // Global error handler
    app.use(globalErrorHandler);
    
    // 404 handler
    app.use(notFoundHandler);
    
    // Uncaught exception handler
    uncaughtExceptionHandler();
    
    // Unhandled rejection handler
    unhandledRejectionHandler();
    
    logger.info('Error handlers initialized');
};

module.exports = {
    globalErrorHandler,
    asyncHandler,
    notFoundHandler,
    uncaughtExceptionHandler,
    unhandledRejectionHandler,
    errorBoundary,
    validationErrorHandler,
    databaseErrorHandler,
    externalServiceErrorHandler,
    initializeErrorHandlers,
    sendErrorResponse
};