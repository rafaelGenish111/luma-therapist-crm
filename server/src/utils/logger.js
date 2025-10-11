const winston = require('winston');
const path = require('path');

/**
 * Logger Configuration
 * מערכת רישום מתקדמת עם Winston
 */

// Create logs directory only when not running on serverless (e.g., Vercel)
const fs = require('fs');
const isServerless = !!process.env.VERCEL;
const logsDir = path.join(__dirname, '../../logs');
try {
    if (!isServerless && !fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
} catch (e) {
    // On serverless (read-only FS) ignore mkdir errors gracefully
}

// Custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (stack) {
            log += `\n${stack}`;
        }
        
        if (Object.keys(meta).length > 0) {
            log += `\n${JSON.stringify(meta, null, 2)}`;
        }
        
        return log;
    })
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        let log = `${timestamp} ${level}: ${message}`;
        if (stack) {
            log += `\n${stack}`;
        }
        return log;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: {
        service: 'wellness-platform',
        version: process.env.API_VERSION || '1.0.0'
    },
    transports: isServerless ? [
        new winston.transports.Console({ format: consoleFormat })
    ] : [
        // Error log file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: logFormat
        }),
        // Combined log file
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: logFormat
        }),
        // Audit log file (for security events)
        new winston.transports.File({
            filename: path.join(logsDir, 'audit.log'),
            level: 'warn',
            maxsize: 5242880, // 5MB
            maxFiles: 10,
            format: logFormat
        })
    ],
    
    // Handle exceptions and rejections
    exceptionHandlers: isServerless ? [
        new winston.transports.Console({ format: consoleFormat })
    ] : [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 3
        })
    ],
    
    rejectionHandlers: isServerless ? [
        new winston.transports.Console({ format: consoleFormat })
    ] : [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 3
        })
    ]
});

// Add console transport for non-production environments (and keep console in serverless)
if (process.env.NODE_ENV !== 'production' && !isServerless) {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Custom logging methods
logger.security = (message, meta = {}) => {
    logger.warn(`SECURITY: ${message}`, {
        ...meta,
        category: 'security',
        timestamp: new Date().toISOString()
    });
};

logger.audit = (action, userId, details = {}) => {
    logger.info(`AUDIT: ${action}`, {
        action,
        userId,
        ...details,
        category: 'audit',
        timestamp: new Date().toISOString()
    });
};

logger.performance = (operation, duration, meta = {}) => {
    logger.info(`PERFORMANCE: ${operation}`, {
        operation,
        duration,
        ...meta,
        category: 'performance',
        timestamp: new Date().toISOString()
    });
};

logger.api = (method, url, statusCode, duration, meta = {}) => {
    const level = statusCode >= 400 ? 'warn' : 'info';
    logger[level](`API: ${method} ${url}`, {
        method,
        url,
        statusCode,
        duration,
        ...meta,
        category: 'api',
        timestamp: new Date().toISOString()
    });
};

logger.database = (operation, collection, duration, meta = {}) => {
    logger.info(`DATABASE: ${operation}`, {
        operation,
        collection,
        duration,
        ...meta,
        category: 'database',
        timestamp: new Date().toISOString()
    });
};

logger.email = (action, recipient, status, meta = {}) => {
    const level = status === 'sent' ? 'info' : 'warn';
    logger[level](`EMAIL: ${action}`, {
        action,
        recipient,
        status,
        ...meta,
        category: 'email',
        timestamp: new Date().toISOString()
    });
};

logger.googleCalendar = (action, therapistId, status, meta = {}) => {
    const level = status === 'success' ? 'info' : 'warn';
    logger[level](`GOOGLE_CALENDAR: ${action}`, {
        action,
        therapistId,
        status,
        ...meta,
        category: 'google_calendar',
        timestamp: new Date().toISOString()
    });
};

logger.payment = (action, amount, status, meta = {}) => {
    const level = status === 'success' ? 'info' : 'warn';
    logger[level](`PAYMENT: ${action}`, {
        action,
        amount,
        status,
        ...meta,
        category: 'payment',
        timestamp: new Date().toISOString()
    });
};

// Request logging middleware
logger.requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.api(req.method, req.originalUrl, res.statusCode, duration, {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            userId: req.user?.id,
            contentLength: res.get('content-length')
        });
    });
    
    next();
};

// Error logging middleware
logger.errorLogger = (err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id,
        body: req.body,
        query: req.query,
        params: req.params
    });
    
    next(err);
};

// Performance monitoring
logger.performanceMonitor = (operation) => {
    const start = Date.now();
    
    return {
        end: (meta = {}) => {
            const duration = Date.now() - start;
            logger.performance(operation, duration, meta);
            return duration;
        }
    };
};

// Database query logging
logger.queryLogger = (operation, collection) => {
    const monitor = logger.performanceMonitor(`DB_${operation}`);
    
    return {
        end: (meta = {}) => {
            const duration = monitor.end(meta);
            logger.database(operation, collection, duration, meta);
            return duration;
        }
    };
};

// Log rotation utility
logger.rotateLogs = () => {
    const logFiles = [
        'error.log',
        'combined.log',
        'audit.log',
        'exceptions.log',
        'rejections.log'
    ];
    
    logFiles.forEach(filename => {
        const filePath = path.join(logsDir, filename);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const fileSizeInMB = stats.size / (1024 * 1024);
            
            if (fileSizeInMB > 10) { // Rotate if file is larger than 10MB
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const rotatedFilename = `${filename}.${timestamp}`;
                fs.renameSync(filePath, path.join(logsDir, rotatedFilename));
                logger.info(`Log file rotated: ${filename} -> ${rotatedFilename}`);
            }
        }
    });
};

// Health check for logging system
logger.healthCheck = () => {
    try {
        logger.info('Logger health check');
        return {
            status: 'healthy',
            level: logger.level,
            transports: logger.transports.length,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

// Cleanup old log files
logger.cleanupOldLogs = (daysToKeep = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    fs.readdir(logsDir, (err, files) => {
        if (err) {
            logger.error('Error reading logs directory', { error: err.message });
            return;
        }
        
        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                
                if (stats.mtime < cutoffDate && file.endsWith('.log')) {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            logger.error('Error deleting old log file', { file, error: err.message });
                        } else {
                            logger.info('Deleted old log file', { file });
                        }
                    });
                }
            });
        });
    });
};

// Schedule log cleanup (daily)
if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
        logger.cleanupOldLogs(30); // Keep logs for 30 days
    }, 24 * 60 * 60 * 1000); // Run daily
}

module.exports = logger;
