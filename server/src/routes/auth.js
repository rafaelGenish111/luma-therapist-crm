const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { rateLimit } = require('express-rate-limit');
const User = require('../models/User');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const { auth } = require('../middleware/auth');
const legacyEmailService = require('../utils/emailService');
const { sendResetEmail } = require('../services/emailService');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        error: 'יותר מדי ניסיונות התחברות. נסה שוב בעוד 15 דקות.',
        he: 'יותר מדי ניסיונות התחברות. נסה שוב בעוד 15 דקות.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 registration attempts per hour
    message: {
        error: 'יותר מדי ניסיונות הרשמה. נסה שוב בעוד שעה.',
        he: 'יותר מדי ניסיונות הרשמה. נסה שוב בעוד שעה.'
    }
});

// Validation middleware
const validateRegistration = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('כתובת אימייל לא תקינה')
        .custom(async (email) => {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new Error('כתובת אימייל כבר קיימת במערכת');
            }
            return true;
        }),
    body('password')
        .isLength({ min: 8 })
        .withMessage('סיסמה חייבת להכיל לפחות 8 תווים')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('סיסמה חייבת להכיל אות גדולה, אות קטנה, מספר ותו מיוחד'),
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('שם פרטי חייב להכיל 2-50 תווים'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('שם משפחה חייב להכיל 2-50 תווים'),
    body('phone')
        .matches(/^((\+972|972)-?|0)?5\d{8}$/)
        .withMessage('מספר טלפון ישראלי לא תקין'),
    body('userType')
        .isIn(['THERAPIST', 'CLIENT'])
        .withMessage('סוג משתמש חייב להיות therapist או client'),
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('תאריך לידה לא תקין'),
    body('gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('מגדר חייב להיות male, female או other'),
];

const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('כתובת אימייל לא תקינה'),
    body('password')
        .notEmpty()
        .withMessage('סיסמה נדרשת'),
];

const validatePasswordReset = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('כתובת אימייל לא תקינה'),
];

const validatePasswordChange = [
    body('token')
        .notEmpty()
        .withMessage('טוקן נדרש'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('סיסמה חייבת להכיל לפחות 8 תווים')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('סיסמה חייבת להכיל אות גדולה, אות קטנה, מספר ותו מיוחד'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'שגיאות ולידציה',
            he: 'שגיאות ולידציה',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                he: err.msg
            }))
        });
    }
    next();
};

// Helper function to generate JWT tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE }
    );

    return { accessToken, refreshToken };
};

// Helper function to send verification email
const sendVerificationEmail = async (user) => {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await user.save();

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    try {
        await legacyEmailService.sendEmail({
            email: user.email,
            subject: 'אימות כתובת אימייל - Wellness Platform',
            template: 'emailVerification',
            data: {
                name: user.firstName,
                verificationUrl,
                platformName: 'Wellness Platform'
            }
        });
    } catch (error) {
        console.log('שגיאה בשליחת אימייל אימות:', error);
    }
};

// @route   POST /api/auth/register
// @desc    Register new user (therapist/client)
// @access  Public
router.post('/register', registerLimiter, validateRegistration, handleValidationErrors, async (req, res) => {
    try {
        const {
            email,
            password,
            firstName,
            lastName,
            phone,
            userType,
            dateOfBirth,
            gender,
            // Therapist specific fields
            specialization,
            licenseNumber,
            experience,
            education,
            profession,
            // Client specific fields
            medicalHistory,
            emergencyContact
        } = req.body;

        // Create base user data
        const userData = {
            email,
            password,
            firstName,
            lastName,
            phone,
            userType,
            dateOfBirth,
            gender,
            isEmailVerified: false,
            emailVerificationToken: null,
            emailVerificationExpire: null,
            isActive: true,
            lockUntil: null
        };

        let user;

        // Create specific user type
        if ((userType || '').toUpperCase() === 'THERAPIST') {
            user = new Therapist({
                ...userData,
                userType: 'THERAPIST',
                profession,
                specializations: specialization || [],
                licenseNumber,
                experience: experience || 0,
                education: education || [],
                isProfileComplete: false,
                isApproved: false
            });
        } else if ((userType || '').toUpperCase() === 'CLIENT') {
            user = new Client({
                ...userData,
                userType: 'CLIENT',
                medicalHistory: medicalHistory || [],
                emergencyContact: emergencyContact || {},
                isProfileComplete: false
            });
        } else {
            return res.status(400).json({
                success: false,
                error: 'סוג משתמש לא חוקי',
                he: 'סוג משתמש לא חוקי',
                message: 'userType חייב להיות THERAPIST או CLIENT'
            });
        }

        await user.save();

        // טיפול בהתנהגות הרשמה: מטפלות אינן מתחברות אוטומטית, והחשבון דורש אישור אדמין
        if ((userType || '').toUpperCase() === 'THERAPIST') {
            // וידוא דגל אישור
            user.isApproved = false;
            await user.save();
            // לא שולחים טוקנים. רק אישור קבלה
            return res.status(201).json({
                success: true,
                message: 'פרטיך התקבלו, ניצור איתך קשר בהקדם',
                he: 'פרטיך התקבלו, ניצור איתך קשר בהקדם',
                data: { queuedForApproval: true }
            });
        }

        // לקוחות – התנהגות רגילה: אימות אימייל ואוטו-לוגין
        await sendVerificationEmail(user);
        const { accessToken, refreshToken } = generateTokens(user._id);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
            domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
        });
        res.status(201).json({ success: true, message: 'המשתמש נרשם בהצלחה', he: 'המשתמש נרשם בהצלחה', data: { user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, userType: user.userType, isEmailVerified: user.isEmailVerified, isProfileComplete: user.isProfileComplete }, accessToken } });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בהרשמה',
            he: 'שגיאה בהרשמה',
            message: error.message
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, validateLogin, handleValidationErrors, async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Login attempt for:', email);

        // ✅ קריטי: וודא חיבור לפני כל פעולה
        const mongoose = require('mongoose');
        const connectDB = require('../config/database');

        if (mongoose.connection.readyState !== 1) {
            console.log('⚠️ MongoDB not connected, connecting now...');
            await connectDB();
            // חכה שנייה נוספת לוודא שהחיבור יציב
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('✅ MongoDB ready, searching for user...');

        // חפש משתמש עם timeout מפורש

        let user = null;

        // נסה therapist
        try {
            console.log('🔍 Checking Therapist collection...');
            user = await Therapist.findOne({ email })
                .select('+password')
                .maxTimeMS(10000) // timeout של 10 שניות
                .exec();
            if (user) console.log('✅ Found in Therapist');
        } catch (err) {
            console.error('❌ Therapist search failed:', err.message);
        }

        // אם לא מצאנו, נסה client
        if (!user) {
            try {
                console.log('🔍 Checking Client collection...');
                user = await Client.findOne({ email })
                    .select('+password')
                    .maxTimeMS(10000)
                    .exec();
                if (user) console.log('✅ Found in Client');
            } catch (err) {
                console.error('❌ Client search failed:', err.message);
            }
        }

        // אם עדיין לא מצאנו, נסה user
        if (!user) {
            try {
                console.log('🔍 Checking User collection...');
                user = await User.findOne({ email })
                    .select('+password')
                    .maxTimeMS(10000)
                    .exec();
                if (user) console.log('✅ Found in User');
            } catch (err) {
                console.error('❌ User search failed:', err.message);
            }
        }

        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({
                success: false,
                error: 'אימייל או סיסמה שגויים',
                he: 'אימייל או סיסמה שגויים'
            });
        }

        // בדוק אם החשבון פעיל
        if (user.isActive === false) {
            return res.status(401).json({
                success: false,
                error: 'החשבון מושבת',
                he: 'החשבון מושבת'
            });
        }

        // בדוק סיסמה
        console.log('🔑 Checking password...');
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log('❌ Password mismatch');
            return res.status(401).json({
                success: false,
                error: 'אימייל או סיסמה שגויים',
                he: 'אימייל או סיסמה שגויים'
            });
        }

        console.log('✅ Password match, generating tokens...');

        // צור tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        console.log('✅ Login successful');

        res.json({
            success: true,
            message: 'התחברות הצליחה',
            he: 'התחברות הצליחה',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    userType: user.userType,
                    isEmailVerified: user.isEmailVerified,
                    isProfileComplete: user.isProfileComplete
                },
                accessToken
            }
        });

    } catch (error) {
        console.error('💥 Login error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בהתחברות',
            he: 'שגיאה בהתחברות',
            message: error.message
        });
    }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public (requires refresh token in cookie)
router.post('/refresh', async (req, res) => {
    try {
        // קבל refresh token מה-cookies
        const refreshToken = req.cookies.refreshToken;
        
        console.log('🔄 Refresh token request');
        console.log('Has refresh token cookie:', !!refreshToken);
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token לא נמצא',
                he: 'Refresh token לא נמצא'
            });
        }

        // אמת את ה-refresh token
        const jwt = require('jsonwebtoken');
        let decoded;
        
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            console.log('✅ Refresh token valid, userId:', decoded.userId);
        } catch (err) {
            console.error('❌ Invalid refresh token:', err.message);
            return res.status(401).json({
                success: false,
                error: 'Refresh token לא תקין',
                he: 'Refresh token לא תקין'
            });
        }

        // וודא חיבור MongoDB
        const mongoose = require('mongoose');
        const connectDB = require('../config/database');
        
        if (mongoose.connection.readyState !== 1) {
            await connectDB();
        }

        // מצא את המשתמש
        const User = require('../models/User');
        const Client = require('../models/Client');
        const Therapist = require('../models/Therapist');
        
        let user = await Therapist.findById(decoded.userId).select('-password');
        if (!user) user = await Client.findById(decoded.userId).select('-password');
        if (!user) user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            console.error('❌ User not found for refresh');
            return res.status(401).json({
                success: false,
                error: 'משתמש לא נמצא',
                he: 'משתמש לא נמצא'
            });
        }

        // צור access token חדש
        const { accessToken } = generateTokens(user._id);

        console.log('✅ New access token generated');

        res.json({
            success: true,
            data: { accessToken }
        });

    } catch (error) {
        console.error('💥 Refresh token error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה ברענון token',
            he: 'שגיאה ברענון token'
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, async (req, res) => {
    try {
        // Clear refresh token cookie
        res.clearCookie('refreshToken');

        res.json({
            success: true,
            message: 'התנתקות מוצלחת',
            he: 'התנתקות מוצלחת'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בהתנתקות',
            he: 'שגיאה בהתנתקות'
        });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', authLimiter, validatePasswordReset, handleValidationErrors, async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists or not
            return res.json({
                success: true,
                message: 'אם כתובת האימייל קיימת במערכת, תקבל הודעת אימייל לאיפוס סיסמה',
                he: 'אם כתובת האימייל קיימת במערכת, תקבל הודעת אימייל לאיפוס סיסמה'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.passwordResetExpire = Date.now() + 60 * 60 * 1000; // 1 hour

        await user.save();

        // Send reset email
        const resetUrl = `${process.env.APP_BASE_URL || process.env.CLIENT_URL}/reset-password?token=${resetToken}&uid=${user._id}`;

        // שימוש בשירות החדש (SendGrid/DEV)
        await sendResetEmail({ to: user.email, link: resetUrl });

        res.json({
            success: true,
            message: 'אם כתובת האימייל קיימת במערכת, תקבל הודעת אימייל לאיפוס סיסמה',
            he: 'אם כתובת האימייל קיימת במערכת, תקבל הודעת אימייל לאיפוס סיסמה'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בשליחת אימייל איפוס סיסמה',
            he: 'שגיאה בשליחת אימייל איפוס סיסמה'
        });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', validatePasswordChange, handleValidationErrors, async (req, res) => {
    try {
        const { token, password } = req.body;

        // Hash the token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'טוקן איפוס סיסמה לא תקין או פג תוקף',
                he: 'טוקן איפוס סיסמה לא תקין או פג תוקף'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS));
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear reset token
        user.password = hashedPassword;
        user.passwordResetToken = null;
        user.passwordResetExpire = null;
        user.passwordChangedAt = Date.now();

        await user.save();

        res.json({
            success: true,
            message: 'סיסמה שונתה בהצלחה',
            he: 'סיסמה שונתה בהצלחה'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה באיפוס סיסמה',
            he: 'שגיאה באיפוס סיסמה'
        });
    }
});

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email with token
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Hash the token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid verification token
        let user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpire: { $gt: Date.now() }
        });
        if (!user) {
            user = await Therapist.findOne({
                emailVerificationToken: hashedToken,
                emailVerificationExpire: { $gt: Date.now() }
            });
        }
        if (!user) {
            user = await Client.findOne({
                emailVerificationToken: hashedToken,
                emailVerificationExpire: { $gt: Date.now() }
            });
        }

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'טוקן אימות אימייל לא תקין או פג תוקף',
                he: 'טוקן אימות אימייל לא תקין או פג תוקף'
            });
        }

        // Verify email
        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpire = null;
        user.emailVerifiedAt = Date.now();

        await user.save();

        res.json({
            success: true,
            message: 'כתובת האימייל אומתה בהצלחה',
            he: 'כתובת האימייל אומתה בהצלחה'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה באימות כתובת אימייל',
            he: 'שגיאה באימות כתובת אימייל'
        });
    }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Private
router.post('/resend-verification', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                error: 'כתובת האימייל כבר אומתה',
                he: 'כתובת האימייל כבר אומתה'
            });
        }

        // Check if we can resend (not too frequent)
        if (user.emailVerificationExpire && user.emailVerificationExpire > Date.now()) {
            return res.status(429).json({
                success: false,
                error: 'נשלח כבר אימייל אימות. נסה שוב בעוד שעה',
                he: 'נשלח כבר אימייל אימות. נסה שוב בעוד שעה'
            });
        }

        // Send verification email
        await sendVerificationEmail(user);

        res.json({
            success: true,
            message: 'אימייל אימות נשלח בהצלחה',
            he: 'אימייל אימות נשלח בהצלחה'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בשליחת אימייל אימות',
            he: 'שגיאה בשליחת אימייל אימות'
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user.id).select('-password');
        if (!user) {
            user = await Client.findById(req.user.id).select('-password');
        }
        if (!user) {
            user = await Therapist.findById(req.user.id).select('-password');
        }
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'משתמש לא נמצא',
                he: 'משתמש לא נמצא'
            });
        }

        console.log('req.user:', req.user);

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בקבלת פרטי משתמש',
            he: 'שגיאה בקבלת פרטי משתמש'
        });
    }
});

module.exports = router; 