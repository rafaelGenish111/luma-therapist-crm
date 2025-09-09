const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Client = require('../models/Client');
const Therapist = require('../models/Therapist');

/**
 * Middleware to authenticate JWT token
 */
const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No or bad Authorization header');
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded JWT:', decoded);
        let user = await User.findById(decoded.userId).select('-password');
        console.log('User found:', user ? 'YES' : 'NO');
        if (user) console.log('User role:', user.role);
        if (!user) {
            user = await Client.findById(decoded.userId).select('-password');
            console.log('Client found:', user ? 'YES' : 'NO');
            if (user) console.log('Client role:', user.role);
        }
        if (!user) {
            user = await Therapist.findById(decoded.userId).select('-password');
            console.log('Therapist found:', user ? 'YES' : 'NO');
            if (user) console.log('Therapist role:', user.role);
        }
        if (!user) {
            console.log('User not found in any collection');
            return res.status(401).json({ success: false, error: 'User not found' });
        }
        req.user = user;
        console.log('Before normalization - user.role:', req.user.role);
        console.log('Before normalization - user.userType:', req.user.userType);
        // נרמול role ו-userType לאותיות גדולות
        const normalizedUserType = (req.user.userType || req.user.role || '').toString().toUpperCase();
        req.user.role = normalizedUserType;
        req.user.userType = normalizedUserType;
        console.log('After normalization - user.role:', req.user.role);
        console.log('After normalization - user.userType:', req.user.userType);
        next();
    } catch (err) {
        console.error('JWT error:', err.message);
        return res.status(401).json({ success: false, error: 'Invalid token', message: err.message });
    }
};

/**
 * Middleware to check if user is verified
 */
const requireEmailVerification = async (req, res, next) => {
    try {
        if (!req.user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                error: 'נדרש אימות כתובת אימייל',
                he: 'נדרש אימות כתובת אימייל'
            });
        }
        next();
    } catch (error) {
        console.error('Email verification middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בשרת',
            he: 'שגיאה בשרת'
        });
    }
};

/**
 * Middleware to check if user is a therapist
 */
const requireTherapist = async (req, res, next) => {
    try {
        if ((req.user.userType || '').toUpperCase() !== 'THERAPIST') {
            return res.status(403).json({
                success: false,
                error: 'גישה מוגבלת למטפלות בלבד',
                he: 'גישה מוגבלת למטפלות בלבד'
            });
        }
        next();
    } catch (error) {
        console.error('Therapist middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בשרת',
            he: 'שגיאה בשרת'
        });
    }
};

/**
 * Middleware to check if user is a client
 */
const requireClient = async (req, res, next) => {
    try {
        if ((req.user.userType || '').toUpperCase() !== 'CLIENT') {
            return res.status(403).json({
                success: false,
                error: 'גישה מוגבלת ללקוחות בלבד',
                he: 'גישה מוגבלת ללקוחות בלבד'
            });
        }
        next();
    } catch (error) {
        console.error('Client middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בשרת',
            he: 'שגיאה בשרת'
        });
    }
};

/**
 * Middleware to check if therapist is approved
 */
const requireApprovedTherapist = async (req, res, next) => {
    try {
        if ((req.user.userType || '').toUpperCase() !== 'THERAPIST') {
            return res.status(403).json({
                success: false,
                error: 'גישה מוגבלת למטפלות בלבד',
                he: 'גישה מוגבלת למטפלות בלבד'
            });
        }

        if (!req.user.isApproved) {
            return res.status(403).json({
                success: false,
                error: 'החשבון ממתין לאישור מנהל',
                he: 'החשבון ממתין לאישור מנהל'
            });
        }

        next();
    } catch (error) {
        console.error('Approved therapist middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בשרת',
            he: 'שגיאה בשרת'
        });
    }
};

/**
 * Middleware to check if user has complete profile
 */
const requireCompleteProfile = async (req, res, next) => {
    try {
        if (!req.user.isProfileComplete) {
            return res.status(403).json({
                success: false,
                error: 'נדרש להשלים את הפרופיל',
                he: 'נדרש להשלים את הפרופיל'
            });
        }
        next();
    } catch (error) {
        console.error('Complete profile middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בשרת',
            he: 'שגיאה בשרת'
        });
    }
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Check for token in cookies (fallback)
        else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (token) {
            try {
                // Verify token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Check if user exists and is active
                const user = await User.findById(decoded.userId).select('-password');

                if (user && user.isActive) {
                    // Check if password was changed after token was issued
                    if (user.passwordChangedAt) {
                        const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);

                        if (decoded.iat >= changedTimestamp) {
                            req.user = user;
                        }
                    } else {
                        req.user = user;
                    }
                }
            } catch (jwtError) {
                // Token is invalid, but we don't fail the request
                console.log('Optional auth: Invalid token');
            }
        }

        next();

    } catch (error) {
        console.error('Optional auth middleware error:', error);
        // Don't fail the request, just continue without user
        next();
    }
};

module.exports = {
    auth,
    requireEmailVerification,
    requireTherapist,
    requireClient,
    requireApprovedTherapist,
    requireCompleteProfile,
    optionalAuth
}; 