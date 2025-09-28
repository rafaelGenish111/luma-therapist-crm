const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// הגדרת Cloudinary
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const therapistRoutes = require('./routes/therapists');
const therapistCalendlyRoutes = require('./routes/therapistCalendly');
const calendlyOAuthRoutes = require('./routes/calendlyOAuth');
const clientRoutes = require('./routes/clients');
const appointmentRoutes = require('./routes/appointments');
const websiteRoutes = require('./routes/websites');
const paymentRoutes = require('./routes/payments');
const chargeRoutes = require('./routes/charges');
const documentRoutes = require('./routes/documents');
const communicationRoutes = require('./routes/communications');
const hookRoutes = require('./routes/hooks');
const campaignRoutes = require('./routes/campaigns');
const bookingRoutes = require('./routes/bookings');
const treatmentTypeRoutes = require('./routes/treatmentTypes');
const importantInfoRoutes = require('./routes/importantInfo');
const geoRoutes = require('./routes/geo');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter, securityHeaders, validateRequest } = require('./middleware/security');
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
const scheduledTasks = require('./services/scheduledTasks');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(securityHeaders);
app.use(compression());
app.use(morgan('combined'));
app.use(validateRequest);

// עדכון CORS לתמיכה בפרודקשן
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = process.env.NODE_ENV === 'production'
            ? [
                process.env.CLIENT_URL,
                process.env.FRONTEND_URL,
                'https://luma-therapist-crm-frontend.vercel.app',
                'https://luma-therapist-crm.vercel.app',
                'https://luma-therapist-crm-frontend-git-main-rafaelgenish111s-projects.vercel.app',
                'https://luma-therapist-crm-git-main-rafaelgenish111s-projects.vercel.app'
            ].filter(Boolean) // מסנן undefined values
            : [
                'http://localhost:8000',
                'http://localhost:3000',
                'http://127.0.0.1:8000',
                'http://127.0.0.1:3000'
            ];

        console.log('CORS check - Origin:', origin);
        console.log('CORS check - Allowed origins:', allowedOrigins);
        console.log('CORS check - NODE_ENV:', process.env.NODE_ENV);

        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('CORS allowed:', origin);
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma', 'Expires'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests manually
app.options('*', (req, res) => {
    console.log('OPTIONS request for:', req.url);
    console.log('Origin:', req.headers.origin);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, Expires');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
});

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/calendly', calendlyOAuthRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/therapist', therapistCalendlyRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/charges', chargeRoutes);
app.use('/api', require('./routes/enhancedPayments'));
app.use('/api/documents', documentRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/hooks', hookRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/bookings', bookingRoutes);
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

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
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
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Initialize database connection
let isConnected = false;

const initializeApp = async () => {
    if (!isConnected) {
        try {
            await connectDB();
            isConnected = true;
            console.log('📦 Database connected successfully');

            // הפעלת עבודות מתוזמנות רק אם לא ב-Vercel
            if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
                try {
                    scheduledTasks.startAll();
                    console.log('⏰ Scheduled tasks started');
                } catch (error) {
                    console.log('⚠️ Failed to start scheduled tasks:', error.message);
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

// For local development
if (require.main === module || process.env.NODE_ENV === 'development') {
    const startServer = async () => {
        try {
            await initializeApp();

            const server = app.listen(PORT, '0.0.0.0', () => {
                console.log(`🚀 Server running on port ${PORT}`);
                console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`🌐 Access from other devices: http://192.168.150.133:${PORT}`);
                }
            });

            // Graceful shutdown
            const gracefulShutdown = () => {
                console.log('🛑 Shutting down gracefully...');
                scheduledTasks.stopAll();
                server.close(() => {
                    console.log('💤 Server closed');
                    process.exit(0);
                });
            };

            process.on('SIGTERM', gracefulShutdown);
            process.on('SIGINT', gracefulShutdown);

        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
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