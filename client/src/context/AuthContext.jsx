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

    // בדיקת התחברות ראשונית - עם דחייה
    useEffect(() => {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        // דחה את הבדיקה ב-100ms כדי לא לחסום את הרינדור הראשוני
        const timer = setTimeout(() => {
            const fetchUser = async () => {
                try {
                    // שימוש ב-/auth/me מתאים לכל סוג משתמש (THERAPIST/ADMIN/CLIENT)
                    const res = await api.get('/auth/me');
                    const u = res.data?.data?.user || res.data?.data || null;
                    setUser(u);
                    if (!u) {
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('lastActivity');
                    } else {
                        localStorage.setItem('lastActivity', Date.now().toString());
                    }
                } catch (err) {
                    console.error('Failed to fetch current user:', err);
                    setUser(null);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('lastActivity');
                } finally {
                    setLoading(false);
                }
            };
            fetchUser();
        }, 100);

        return () => clearTimeout(timer);
    }, [accessToken]);

    // התחברות
    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });

            if (res.data?.success) {
                setUser(res.data.data.user);
                setAccessToken(res.data.data.accessToken);
                localStorage.setItem('accessToken', res.data.data.accessToken);
                localStorage.setItem('lastActivity', Date.now().toString());
                return {
                    success: true,
                    data: res.data.data
                };
            } else {
                return {
                    success: false,
                    error: res.data?.error || 'שגיאה בהתחברות'
                };
            }
        } catch (error) {
            console.error('Login error:', error);

            return {
                success: false,
                error: error.response?.data?.error || error.message || 'שגיאה בהתחברות'
            };
        }
    };

    // הרשמה
    const register = async (data) => {
        try {
            const res = await api.post('/auth/register', data);
            if (res.data?.success) {
                setUser(res.data.data?.user);
                setAccessToken(res.data.data?.accessToken);
                localStorage.setItem('accessToken', res.data.data?.accessToken);
                localStorage.setItem('lastActivity', Date.now().toString());
                return {
                    success: true,
                    data: res.data.data
                };
            } else {
                return {
                    success: false,
                    error: res.data?.error || 'שגיאה בהרשמה'
                };
            }
        } catch (err) {
            console.error('Register error:', err);
            // נחזיר את הודעת השגיאה המפורטת מהשרת (כולל details)
            if (err.response && err.response.data) {
                return {
                    success: false,
                    error: err.response.data.error || 'שגיאה בהרשמה'
                };
            }
            return { success: false, error: 'שגיאה בהרשמה' };
        }
    };

    // התנתקות
    const logout = async () => {
        // ניקוי טיימרים
        if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        setShowSessionWarning(false);

        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
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
                const me = await api.get('/auth/me');
                const u = me.data?.data?.user || me.data?.data || null;
                setUser(u);
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