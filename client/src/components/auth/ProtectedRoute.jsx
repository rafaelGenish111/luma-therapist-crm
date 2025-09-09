import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
    const { user, loading, hasPermission } = useAuth();

    console.log('ProtectedRoute - User:', user);
    console.log('ProtectedRoute - Required role:', requiredRole);
    console.log('ProtectedRoute - Loading:', loading);

    if (loading) return <div>טוען...</div>;
    if (!user) return <Navigate to="/" replace />;
    // בדיקת תפקיד נדרש (case-insensitive). אם נדרש ADMIN, סופר־אדמין גם מורשה
    if (requiredRole) {
        const role = (user.role || user.userType || '').toUpperCase();
        const need = requiredRole.toUpperCase();
        const roleOk = need === 'ADMIN' ? (role === 'ADMIN' || role === 'SUPER_ADMIN') : role === need;
        console.log('ProtectedRoute - Role check:', { userRole: role, requiredRole: need, roleOk });
        if (!roleOk) {
            console.log('Role check failed:', { userRole: role, requiredRole: need });
            return <div>אין לך הרשאה לצפות בדף זה</div>;
        }
    }
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <div>אין לך הרשאה לצפות בדף זה</div>;
    }
    return children;
};

export default ProtectedRoute; 