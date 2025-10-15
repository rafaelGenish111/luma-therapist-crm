const roles = require('../config/roles');

/**
 * Middleware לבדוק הרשאות לפי תפקיד והרשאה נדרשת
 * @param {string|string[]} permissions - ההרשאות הנדרשות (מחרוזת או מערך)
 */
const authorize = (permissions = []) => {
    // תמיכה במחרוזת בודדת
    if (typeof permissions === 'string') {
        permissions = [permissions];
    }

    return (req, res, next) => {
        try {
            const userRole = (req.user && (req.user.role || req.user.userType)) || 'GUEST';
            const userPermissions = (req.user && req.user.permissions) || [];

            if (process.env.LOG_LEVEL === 'debug' && process.env.NODE_ENV !== 'production') {
                console.log('Authorize middleware - userRole:', userRole);
                console.log('Authorize middleware - required permissions:', permissions);
            }

            if (userPermissions.includes('*')) {
                return next();
            }

            const hasRolePermission = permissions.length === 0 || permissions.some((p) => {
                const roleToCheck = p.toUpperCase();
                const hasPermission = userPermissions.includes(p) || userPermissions.includes(roleToCheck);
                return hasPermission;
            });

            if (!hasRolePermission) {
                return res.status(403).json({ success: false, error: 'Forbidden' });
            }

            return next();
        } catch (e) {
            if (process.env.LOG_LEVEL === 'debug' && process.env.NODE_ENV !== 'production') {
                console.warn('Authorize middleware error:', e.message);
            }
            return res.status(500).json({ success: false, error: 'Internal error' });
        }
    };
};

module.exports = authorize; 