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

        console.log('Authorize middleware - userRole:', userRole);
        console.log('Authorize middleware - userPermissions:', userPermissions);
        console.log('Authorize middleware - required permissions:', permissions);

        // SUPER_ADMIN יכול הכל
        if (userPermissions.includes('*')) {
            console.log('Authorize middleware - SUPER_ADMIN access granted');
            return next();
        }

        // בדיקה לפי תפקיד או לפי הרשאה ספציפית
        const hasRolePermission = permissions.some(p => {
            const roleToCheck = p.toUpperCase();
            const hasRole = roleToCheck === userRole;
            const hasPermission = userPermissions.includes(p);
            const hasPermissionUpper = userPermissions.includes(roleToCheck);

            console.log(`Authorize middleware - checking permission "${p}":`, {
                roleToCheck,
                hasRole,
                hasPermission,
                hasPermissionUpper,
                result: hasRole || hasPermission || hasPermissionUpper
            });

            return hasRole || hasPermission || hasPermissionUpper;
        });

        console.log('Authorize middleware - hasRolePermission:', hasRolePermission);

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