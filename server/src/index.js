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
const scheduledTasks = require('./services/scheduledTasks');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(securityHeaders);
app.use(compression());
app.use(morgan('combined'));
app.use(validateRequest);
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:8000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
app.use('/api/documents', documentRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/hooks', hookRoutes);
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
app.use('/api/calendly', calendlyRoutes);
app.use('/api/integrations/calendly', calendlyRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
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

// Start server
const startServer = async () => {
    try {
        await connectDB();

        // הפעלת עבודות מתוזמנות
        scheduledTasks.startAll();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Access from other devices: http://192.168.150.133:${PORT}`);
            console.log('⏰ Scheduled tasks are running');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    scheduledTasks.stopAll();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received. Shutting down gracefully...');
    scheduledTasks.stopAll();
    process.exit(0);
});

module.exports = app; 