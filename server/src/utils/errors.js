/**
 * Custom Error Classes
 * מחלקות שגיאה מותאמות אישית
 */

/**
 * Base Application Error
 * שגיאה בסיסית של האפליקציה
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.timestamp = new Date().toISOString();
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation Error
 * שגיאת ולידציה
 */
class ValidationError extends AppError {
    constructor(message, field = null) {
        super(message, 400);
        this.name = 'ValidationError';
        this.field = field;
    }
}

/**
 * Not Found Error
 * שגיאת משאב לא נמצא
 */
class NotFoundError extends AppError {
    constructor(message = 'Resource not found', resource = null) {
        super(message, 404);
        this.name = 'NotFoundError';
        this.resource = resource;
    }
}

/**
 * Unauthorized Error
 * שגיאת הרשאה
 */
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}

/**
 * Forbidden Error
 * שגיאת גישה אסורה
 */
class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden') {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}

/**
 * Conflict Error
 * שגיאת התנגשות
 */
class ConflictError extends AppError {
    constructor(message, conflictingResource = null) {
        super(message, 409);
        this.name = 'ConflictError';
        this.conflictingResource = conflictingResource;
    }
}

/**
 * Rate Limit Error
 * שגיאת הגבלת קצב
 */
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded', retryAfter = null) {
        super(message, 429);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

/**
 * Database Error
 * שגיאת מסד נתונים
 */
class DatabaseError extends AppError {
    constructor(message, operation = null) {
        super(message, 500);
        this.name = 'DatabaseError';
        this.operation = operation;
    }
}

/**
 * External Service Error
 * שגיאת שירות חיצוני
 */
class ExternalServiceError extends AppError {
    constructor(message, service = null, originalError = null) {
        super(message, 502);
        this.name = 'ExternalServiceError';
        this.service = service;
        this.originalError = originalError;
    }
}

/**
 * Payment Error
 * שגיאת תשלום
 */
class PaymentError extends AppError {
    constructor(message, paymentMethod = null, transactionId = null) {
        super(message, 402);
        this.name = 'PaymentError';
        this.paymentMethod = paymentMethod;
        this.transactionId = transactionId;
    }
}

/**
 * Email Error
 * שגיאת אימייל
 */
class EmailError extends AppError {
    constructor(message, recipient = null, template = null) {
        super(message, 500);
        this.name = 'EmailError';
        this.recipient = recipient;
        this.template = template;
    }
}

/**
 * Google Calendar Error
 * שגיאת Google Calendar
 */
class GoogleCalendarError extends AppError {
    constructor(message, operation = null, calendarId = null) {
        super(message, 502);
        this.name = 'GoogleCalendarError';
        this.operation = operation;
        this.calendarId = calendarId;
    }
}

/**
 * File Upload Error
 * שגיאת העלאת קובץ
 */
class FileUploadError extends AppError {
    constructor(message, filename = null, fileSize = null) {
        super(message, 413);
        this.name = 'FileUploadError';
        this.filename = filename;
        this.fileSize = fileSize;
    }
}

/**
 * Configuration Error
 * שגיאת הגדרות
 */
class ConfigurationError extends AppError {
    constructor(message, configKey = null) {
        super(message, 500);
        this.name = 'ConfigurationError';
        this.configKey = configKey;
    }
}

/**
 * Business Logic Error
 * שגיאת לוגיקה עסקית
 */
class BusinessLogicError extends AppError {
    constructor(message, rule = null) {
        super(message, 422);
        this.name = 'BusinessLogicError';
        this.rule = rule;
    }
}

/**
 * Time Conflict Error
 * שגיאת התנגשות זמן
 */
class TimeConflictError extends ConflictError {
    constructor(message, conflictingAppointment = null, requestedTime = null) {
        super(message, conflictingAppointment);
        this.name = 'TimeConflictError';
        this.requestedTime = requestedTime;
    }
}

/**
 * Availability Error
 * שגיאת זמינות
 */
class AvailabilityError extends BusinessLogicError {
    constructor(message, timeSlot = null) {
        super(message, 'availability');
        this.name = 'AvailabilityError';
        this.timeSlot = timeSlot;
    }
}

/**
 * Appointment Error
 * שגיאת פגישה
 */
class AppointmentError extends BusinessLogicError {
    constructor(message, appointmentId = null, operation = null) {
        super(message, 'appointment');
        this.name = 'AppointmentError';
        this.appointmentId = appointmentId;
        this.operation = operation;
    }
}

/**
 * Client Error
 * שגיאת לקוח
 */
class ClientError extends BusinessLogicError {
    constructor(message, clientId = null) {
        super(message, 'client');
        this.name = 'ClientError';
        this.clientId = clientId;
    }
}

/**
 * Therapist Error
 * שגיאת מטפלת
 */
class TherapistError extends BusinessLogicError {
    constructor(message, therapistId = null) {
        super(message, 'therapist');
        this.name = 'TherapistError';
        this.therapistId = therapistId;
    }
}

/**
 * Authentication Error
 * שגיאת אימות
 */
class AuthenticationError extends UnauthorizedError {
    constructor(message = 'Authentication failed', reason = null) {
        super(message);
        this.name = 'AuthenticationError';
        this.reason = reason;
    }
}

/**
 * Authorization Error
 * שגיאת הרשאה
 */
class AuthorizationError extends ForbiddenError {
    constructor(message = 'Insufficient permissions', requiredRole = null) {
        super(message);
        this.name = 'AuthorizationError';
        this.requiredRole = requiredRole;
    }
}

/**
 * Token Error
 * שגיאת token
 */
class TokenError extends UnauthorizedError {
    constructor(message = 'Invalid token', tokenType = null) {
        super(message);
        this.name = 'TokenError';
        this.tokenType = tokenType;
    }
}

/**
 * Session Error
 * שגיאת session
 */
class SessionError extends UnauthorizedError {
    constructor(message = 'Invalid session', sessionId = null) {
        super(message);
        this.name = 'SessionError';
        this.sessionId = sessionId;
    }
}

/**
 * Cache Error
 * שגיאת cache
 */
class CacheError extends AppError {
    constructor(message, operation = null, key = null) {
        super(message, 500);
        this.name = 'CacheError';
        this.operation = operation;
        this.key = key;
    }
}

/**
 * Encryption Error
 * שגיאת הצפנה
 */
class EncryptionError extends AppError {
    constructor(message, operation = null) {
        super(message, 500);
        this.name = 'EncryptionError';
        this.operation = operation;
    }
}

/**
 * Validation Helper Functions
 * פונקציות עזר לוולידציה
 */

const createValidationError = (field, message) => {
    return new ValidationError(message, field);
};

const createNotFoundError = (resource, id) => {
    return new NotFoundError(`${resource} with ID ${id} not found`, resource);
};

const createConflictError = (resource, conflictingValue) => {
    return new ConflictError(`${resource} already exists`, conflictingValue);
};

const createTimeConflictError = (requestedTime, conflictingAppointment) => {
    return new TimeConflictError(
        `Time slot ${requestedTime} is already booked`,
        conflictingAppointment,
        requestedTime
    );
};

const createAvailabilityError = (timeSlot, reason) => {
    return new AvailabilityError(
        `Time slot ${timeSlot} is not available: ${reason}`,
        timeSlot
    );
};

/**
 * Error Factory
 * מפעל שגיאות
 */
class ErrorFactory {
    static validation(field, message) {
        return createValidationError(field, message);
    }
    
    static notFound(resource, id) {
        return createNotFoundError(resource, id);
    }
    
    static conflict(resource, conflictingValue) {
        return createConflictError(resource, conflictingValue);
    }
    
    static timeConflict(requestedTime, conflictingAppointment) {
        return createTimeConflictError(requestedTime, conflictingAppointment);
    }
    
    static availability(timeSlot, reason) {
        return createAvailabilityError(timeSlot, reason);
    }
    
    static unauthorized(message = 'Unauthorized') {
        return new UnauthorizedError(message);
    }
    
    static forbidden(message = 'Access forbidden') {
        return new ForbiddenError(message);
    }
    
    static rateLimit(retryAfter = null) {
        return new RateLimitError('Rate limit exceeded', retryAfter);
    }
    
    static database(operation, originalError = null) {
        return new DatabaseError(`Database operation failed: ${operation}`, operation);
    }
    
    static externalService(service, originalError = null) {
        return new ExternalServiceError(`External service error: ${service}`, service, originalError);
    }
    
    static payment(paymentMethod, transactionId = null) {
        return new PaymentError(`Payment failed`, paymentMethod, transactionId);
    }
    
    static email(recipient, template = null) {
        return new EmailError(`Email sending failed`, recipient, template);
    }
    
    static googleCalendar(operation, calendarId = null) {
        return new GoogleCalendarError(`Google Calendar operation failed: ${operation}`, operation, calendarId);
    }
}

module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    RateLimitError,
    DatabaseError,
    ExternalServiceError,
    PaymentError,
    EmailError,
    GoogleCalendarError,
    FileUploadError,
    ConfigurationError,
    BusinessLogicError,
    TimeConflictError,
    AvailabilityError,
    AppointmentError,
    ClientError,
    TherapistError,
    AuthenticationError,
    AuthorizationError,
    TokenError,
    SessionError,
    CacheError,
    EncryptionError,
    ErrorFactory,
    createValidationError,
    createNotFoundError,
    createConflictError,
    createTimeConflictError,
    createAvailabilityError
};
