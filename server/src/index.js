try {
    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');
    const compression = require('compression');
    const morgan = require('morgan');
    const { rateLimit } = require('express-rate-limit');
    const cookieParser = require('cookie-parser');
    require('dotenv').config();
} catch (topLevelError) {
    console.error('🚨 Top-level error loading dependencies:', topLevelError);
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Environment debug (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('===========================================');
  console.log('ENVIRONMENT DEBUG:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('MONGODB_URI length:', process.env.MONGODB_URI?.length || 0);
  console.log('MONGODB_URI first 50 chars:', process.env.MONGODB_URI?.substring(0, 50) || 'MISSING!');
  console.log('PORT:', process.env.PORT);
  console.log('===========================================');
}
// הגדרת Cloudinary
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const connectDB = require('./config/database');

// Routes imports
const authRoutes = require('./routes/auth');
const therapistRoutes = require('./routes/therapists');
const therapistCalendlyRoutes = require('./routes/therapistCalendly');
const calendlyOAuthRoutes = require('./routes/calendlyOAuth');
const clientRoutes = require('./routes/clients');
const appointmentRoutes = require('./routes/appointments');
const websiteRoutes = require('./routes/websites');
const paymentRoutes = require('./routes/payments');
const paymentLinksRoutes = require('./routes/paymentLinks');
const paymentHealthRoutes = require('./routes/paymentHealth');
const chargeRoutes = require('./routes/charges');
const documentRoutes = require('./routes/documents');
const communicationRoutes = require('./routes/communications');
const hookRoutes = require('./routes/hooks');
const campaignRoutes = require('./routes/campaigns');
const bookingRoutes = require('./routes/bookings');
const publicRoutes = require('./routes/public');
const treatmentTypeRoutes = require('./routes/treatmentTypes');
const importantInfoRoutes = require('./routes/importantInfo');
const geoRoutes = require('./routes/geo');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter, securityHeaders, validateRequest, setLongTimeout } = require('./middleware/security');
const healthDeclarationsRouter = require('./routes/healthDeclarations');
const healthDeclarationTemplatesPublic = require('./routes/healthDeclarationTemplates');
const galleryRoutes = require('./routes/gallery');
const articleRoutes = require('./routes/articles');
const esignRoutes = require('./routes/esign');
const treatmentSessionsRoutes = require('./routes/treatmentSessions');
const adminRoutes = require('./routes/admin');
const calendlyRoutes = require('./routes/calendly');
const therapistAdminRoutes = require('./routes/therapistAdmin');
const therapistRegistrationRoutes = require('./routes/therapistRegistration');
const dashboardRoutes = require('./routes/dashboard');
const calendarRoutes = require('./routes/calendar.routes');
const availabilityRoutes = require('./routes/availability.routes');

// Scheduled tasks will be loaded after MongoDB connection
let scheduledTasks = null;

const app = express();
const PORT = process.env.PORT || 5000;

// הגדל timeouts
app.use(setLongTimeout);

// Trust proxy for Vercel deployment
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Security Middleware
app.use(securityHeaders);
app.use(compression());
app.use(morgan('combined'));
app.use(validateRequest);

// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [
        'http://localhost:8000',
        'http://localhost:5000',
        'http://localhost:8004',
        'https://luma-therapist-crm-frontend.vercel.app'
      ];

app.use(cors({
    origin: function (origin, callback) {
        // אפשר בקשות ללא origin (mobile apps, curl)
        if (!origin) return callback(null, true);

        const isAllowed =
            allowedOrigins.indexOf(origin) !== -1 ||
            allowedOrigins.includes('*') ||
            // אפשרות מבוקרת: לאפשר כל דומיין תחת vercel.app אם צוין במשתנה סביבה
            (process.env.ALLOW_VERCEL_WILDCARD === 'true' && /\.vercel\.app$/.test(origin));

        if (isAllowed) {
            callback(null, true);
        } else {
            if (process.env.NODE_ENV === 'development') {
                console.log('❌ Blocked origin:', origin);
                console.log('✅ Allowed origins:', allowedOrigins);
            }
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
        'X-File-Name'
    ],
    exposedHeaders: ['set-cookie'],
    maxAge: 86400 // 24 hours - cache preflight requests
}));


app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 200 : 100 // יותר requests בפרודקשן
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files - serve uploaded images
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MongoDB connection will be handled in initializeApp()

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/calendly', calendlyOAuthRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/therapist', therapistCalendlyRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment-links', paymentLinksRoutes);
app.use('/api/payment-health', paymentHealthRoutes);
app.use('/api/charges', chargeRoutes);
app.use('/api', require('./routes/enhancedPayments'));
app.use('/api/documents', documentRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/hooks', hookRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/treatment-types', treatmentTypeRoutes);
app.use('/api/important-info', importantInfoRoutes);
app.use('/api/health-declarations', healthDeclarationsRouter);
app.use('/api/health-declaration-templates', healthDeclarationTemplatesPublic);
app.use('/api/gallery', galleryRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/esign', generalLimiter, esignRoutes);
app.use('/api/treatment-sessions', treatmentSessionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/therapists', therapistAdminRoutes);
app.use('/api/therapists', therapistRegistrationRoutes);
app.use('/api/calendly', calendlyRoutes);
app.use('/api/integrations/calendly', calendlyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/availability', availabilityRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// MongoDB Connection Status
app.get('/api/db-status', async (req, res) => {
    const mongoose = require('mongoose');

    const status = {
        state: mongoose.connection.readyState,
        stateName: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
        host: mongoose.connection.host || 'not connected',
        name: mongoose.connection.name || 'not connected',
        mongooseVersion: mongoose.version
    };

    res.json({
        success: true,
        mongodb: status,
        env: {
            hasMongoUri: !!process.env.MONGODB_URI,
            mongoUriStart: process.env.MONGODB_URI ?
                process.env.MONGODB_URI.substring(0, 20) + '...' :
                'NOT SET'
        }
    });
});

// Root route for Vercel
app.get('/', (req, res) => {
    res.json({
        message: 'Wellness Platform API',
        status: 'running',
        environment: process.env.NODE_ENV || 'development'
    });
});

// DEV test email route (protect/remove in production)
if (process.env.NODE_ENV !== 'production') {
    app.get('/__test_email', async (req, res) => {
        try {
            const { sendEmail } = require('./services/emailService');
            const to = req.query.to || process.env.TEST_EMAIL_TO || 'test@example.com';
            await sendEmail({
                to,
                subject: 'בדיקת שליחת מייל',
                html: '<p>זהו מייל בדיקה מ‑Luma</p>'
            });
            res.json({ ok: true });
        } catch (e) {
            console.error(e);
            res.status(500).json({ ok: false, error: e.message });
        }
    });
}

// Error handling
// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// Initialize database connection
let isConnected = false;
let initPromise = null;

const initializeApp = async () => {
    if (!isConnected) {
        try {
            await connectDB();
            isConnected = true;
            console.log('📦 Database connected successfully');

            // טעינת והפעלת עבודות מתוזמנות
            if (!process.env.VERCEL) {
                try {
                    scheduledTasks = require('./services/scheduledTasks');
                    scheduledTasks.startAll();
                    console.log('⏰ Scheduled tasks started');
                } catch (error) {
                    console.log('⚠️ Failed to load scheduled tasks:', error.message);
                }
            } else {
                console.log('⏰ Scheduled tasks disabled in serverless environment');
            }
        } catch (error) {
            console.error('❌ Failed to connect to database:', error);
            throw error; // Throw the error so we can catch it
        }
    }
};

// For Vercel - initialize on first request (OPTIMIZED)
app.use(async (req, res, next) => {
    // דלג על נתיבים שלא צריכים אתחול
    const skipPaths = ['/api/test', '/health', '/', '/favicon.ico', '/manifest.json'];
    if (skipPaths.includes(req.url) || req.url.startsWith('/icons/')) {
        return next();
    }

    if (!isConnected) {
        // אם כבר יש אתחול בתהליך, חכה לו
        if (!initPromise) {
            console.log('Starting initialization...');
            initPromise = initializeApp()
                .then(() => {
                    console.log('Initialization completed successfully');
                    isConnected = true;
                })
                .catch(error => {
                    console.error('Initialization failed:', error);
                    initPromise = null; // אפשר ניסיון נוסף
                    throw error;
                });
        }
        
        try {
            await initPromise;
        } catch (error) {
            console.error('Failed to initialize app:', error);
            return res.status(500).json({
                error: 'Server initialization failed',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
    
    next();
});

// Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit - log and continue
});

// Global uncaught exception handler
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    // Don't exit immediately - give time to log
    setTimeout(() => process.exit(1), 1000);
});

if (process.env.NODE_ENV === 'development') {
  console.log('📝 Checking if should start server...');
  console.log('📝 require.main === module:', require.main === module);
  console.log('📝 NODE_ENV:', process.env.NODE_ENV);
}

// For local development
if (require.main === module || process.env.NODE_ENV === 'development') {
    console.log('✅ Starting server in local/development mode');
    const startServer = async () => {
        try {
            console.log('🔄 Starting server...');
            console.log('📊 Environment:', process.env.NODE_ENV || 'development');
            console.log('🔌 MongoDB URI exists:', !!process.env.MONGODB_URI);

            // Wait for MongoDB connection with timeout
            console.log('⏳ Connecting to MongoDB...');
            await connectDB();
            console.log('✅ MongoDB connected successfully');

            // טעינת והפעלת עבודות מתוזמנות
            if (!process.env.VERCEL) {
                try {
                    scheduledTasks = require('./services/scheduledTasks');
                    scheduledTasks.startAll();
                    console.log('⏰ Scheduled tasks started');
                } catch (error) {
                    console.log('⚠️ Failed to load scheduled tasks:', error.message);
                }
            }

            const server = app.listen(PORT, '0.0.0.0', () => {
                console.log(`🚀 Server running on port ${PORT}`);
                console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
                console.log('⏰ Scheduled tasks are running');
            });

            // Graceful shutdown
            const gracefulShutdown = () => {
                console.log('🛑 Shutting down gracefully...');
                if (scheduledTasks) {
                    scheduledTasks.stopAll();
                }
                server.close(() => {
                    console.log('💤 Server closed');
                    process.exit(0);
                });
            };

            process.on('SIGTERM', gracefulShutdown);
            process.on('SIGINT', gracefulShutdown);

        } catch (error) {
            console.error('❌ Failed to start server:', error.message);
            console.error('Stack:', error.stack);

            // In production, try to start anyway (Vercel will handle restart)
            if (process.env.NODE_ENV === 'production') {
                console.log('⚠️ Starting server without MongoDB in production mode');
                const server = app.listen(PORT, '0.0.0.0', () => {
                    console.log(`🚀 Server running on port ${PORT} (MongoDB connection failed)`);
                });

                // Graceful shutdown for production
                const gracefulShutdown = () => {
                    console.log('🛑 Shutting down gracefully...');
                    server.close(() => {
                        console.log('💤 Server closed');
                        process.exit(0);
                    });
                };

                process.on('SIGTERM', gracefulShutdown);
                process.on('SIGINT', gracefulShutdown);
            } else {
                process.exit(1);
            }
        }
    };

    startServer();
}

// Simple test endpoint for Vercel
app.get('/api/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is working',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        mongodb: !!process.env.MONGODB_URI,
        jwt: !!process.env.JWT_SECRET
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Luma Therapist CRM API',
        status: 'running',
        endpoints: ['/api/test', '/health', '/api/auth/login']
    });
});

// For Vercel - initialize on first request
let isInitialized = false;
app.use(async (req, res, next) => {
    console.log('Vercel request received:', req.method, req.url);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Vercel:', process.env.VERCEL);

    // Skip initialization for test endpoints
    if (req.url === '/api/test' || req.url === '/health' || req.url === '/') {
        return next();
    }

    if (!isInitialized) {
        try {
            console.log('Initializing app for first time...');
            console.log('Environment variables check:');
            console.log('- MONGODB_URI:', !!process.env.MONGODB_URI);
            console.log('- JWT_SECRET:', !!process.env.JWT_SECRET);
            console.log('- NODE_ENV:', process.env.NODE_ENV);

            await initializeApp();
            isInitialized = true;
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            console.error('Error stack:', error.stack);
            return res.status(500).json({
                error: 'Server initialization failed',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
    next();
});

// Export for Vercel
module.exports = app;

// Add error handling for Vercel
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit in serverless environment
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit in serverless environment
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
        process.exit(1);
    }
});