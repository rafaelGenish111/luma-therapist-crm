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
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                error: 'אין הרשאה - לא מחובר',
                he: 'אין הרשאה - לא מחובר'
            });
        }

        const userRole = req.user.role.toUpperCase();
        const userPermissions = roles[userRole] || [];

        // SUPER_ADMIN יכול הכל
        if (userPermissions.includes('*')) {
            return next();
        }

        // בדיקה לפי תפקיד או לפי הרשאה ספציפית
        const hasRolePermission = permissions.some(p => {
            const roleToCheck = p.toUpperCase();
            return roleToCheck === userRole || userPermissions.includes(p);
        });

        if (!hasRolePermission) {
            return res.status(403).json({
                success: false,
                error: 'אין לך הרשאה לבצע פעולה זו',
                he: 'אין לך הרשאה לבצע פעולה זו',
                required: permissions,
                userRole,
                userPermissions
            });
        }

        next();
    };
};

module.exports = authorize; 