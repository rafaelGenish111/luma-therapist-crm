import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

// קבועים לניהול טוקנים
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 דקות
const WARNING_TIMEOUT = 30 * 1000; // 30 שניות לפני logout

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
    const [showSessionWarning, setShowSessionWarning] = useState(false);

    // refs לניהול טיימרים
    const sessionTimerRef = useRef(null);
    const warningTimerRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    // פונקציות לניהול פעילות משתמש
    const resetSessionTimer = useCallback(() => {
        if (!user) return;

        // ניקוי טיימרים קיימים
        if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

        setShowSessionWarning(false);
        lastActivityRef.current = Date.now();
        localStorage.setItem('lastActivity', Date.now().toString());

        // הגדרת טיימר חדש
        sessionTimerRef.current = setTimeout(() => {
            setShowSessionWarning(true);
            warningTimerRef.current = setTimeout(() => {
                logout();
            }, WARNING_TIMEOUT);
        }, SESSION_TIMEOUT);
    }, [user]);

    const extendSession = useCallback(() => {
        resetSessionTimer();
    }, [resetSessionTimer]);

    // האזנה לפעילות משתמש
    useEffect(() => {
        if (!user) return;

        const handleActivity = () => {
            resetSessionTimer();
        };

        // אירועים לזיהוי פעילות
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        events.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });

        // התחלת הטיימר הראשוני
        resetSessionTimer();

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity, true);
            });
            if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        };
    }, [user, resetSessionTimer]);

    // בדיקת התחברות ראשונית
    useEffect(() => {
        if (!accessToken) {
            setLoading(false);
            return;
        }
        const fetchUser = async () => {
            try {
                const res = await api.get('/therapists/profile');
                setUser(res.data?.data?.user || null);
                if (!res.data?.data?.user) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('lastActivity');
                } else {
                    localStorage.setItem('lastActivity', Date.now().toString());
                }
            } catch (err) {
                console.error('Failed to fetch user profile:', err);
                setUser(null);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('lastActivity');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [accessToken]);

    // התחברות
    const login = async (email, password) => {
        try {
            console.log('Login function called with:', { email, password });
            const res = await api.post('/auth/login', { email, password });
            console.log('Raw response:', res);
            console.log('Login response:', res.data);

            if (res.data?.success) {
                console.log('Login successful');
                setUser(res.data.data.user);
                setAccessToken(res.data.data.accessToken);
                localStorage.setItem('accessToken', res.data.data.accessToken);
                localStorage.setItem('lastActivity', Date.now().toString());
            }

            return res.data;
        } catch (error) {
            console.error('Login error:', error);
            console.error('Error response:', error.response?.data);

            return {
                success: false,
                error: error.response?.data?.error || error.message || 'שגיאה בהתחברות'
            };
        }
    };

    // הרשמה
    const register = async (data) => {
        try {
            const res = await api.register(data);
            console.log('Register response:', res);
            if (res.success) {
                console.log('Setting user:', res.data?.user);
                console.log('Setting accessToken:', res.data?.accessToken);
                setUser(res.data?.user);
                setAccessToken(res.data?.accessToken);
                localStorage.setItem('accessToken', res.data?.accessToken);
                localStorage.setItem('lastActivity', Date.now().toString());
                console.log('accessToken saved to localStorage:', localStorage.getItem('accessToken'));
            }
            return res;
        } catch (err) {
            // נחזיר את הודעת השגיאה המפורטת מהשרת (כולל details)
            if (err.response && err.response.data) {
                return err.response.data;
            }
            return { success: false, error: 'שגיאה לא ידועה', details: [] };
        }
    };

    // התנתקות
    const logout = async () => {
        // ניקוי טיימרים
        if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        setShowSessionWarning(false);

        try {
            await api.logout();
        } catch (error) {
            console.log('Logout error:', error);
        }

        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('lastActivity');
    };

    // רענון טוקן
    const refresh = async () => {
        try {
            const res = await api.post('/auth/refresh');
            if (res.data?.success && res.data?.data?.accessToken) {
                const newToken = res.data.data.accessToken;
                setAccessToken(newToken);
                localStorage.setItem('accessToken', newToken);
                localStorage.setItem('lastActivity', Date.now().toString());
                // למשוך את המשתמש מחדש
                const me = await api.get('/therapists/profile');
                setUser(me.data?.data?.user || null);
                return true;
            }
        } catch {
            setUser(null);
            setAccessToken(null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('lastActivity');
        }
        return false;
    };

    // עדכון משתמש
    const updateUser = (updatedUser) => {
        setUser(updatedUser);
    };

    // בדיקת הרשאה
    const hasPermission = (permission) => {
        if (!user || !user.role) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        // אפשר להרחיב כאן לפי roles.js
        if (!user.permissions) return false;
        return user.permissions.includes(permission);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            register,
            refresh,
            hasPermission,
            accessToken,
            updateUser,
            showSessionWarning,
            extendSession
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext); 