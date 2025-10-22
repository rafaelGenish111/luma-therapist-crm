import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallButton, setShowInstallButton] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // האזן לאירוע beforeinstallprompt
        const handler = (e) => {
            // מנע את הבאנר האוטומטי
            e.preventDefault();

            // שמור את האירוע לשימוש מאוחר יותר
            setDeferredPrompt(e);

            // הצג כפתור התקנה רק אם המשתמש ב-/dashboard
            if (location.pathname.startsWith('/dashboard')) {
                setShowInstallButton(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [location]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // הצג את prompt ההתקנה
        deferredPrompt.prompt();

        // המתן לתשובת המשתמש
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);

        // נקה את ה-prompt
        setDeferredPrompt(null);
        setShowInstallButton(false);
    };

    if (!showInstallButton) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            backgroundColor: '#3BB9FF',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
        }}
            onClick={handleInstallClick}
            onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2A9DE8';
                e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#3BB9FF';
                e.target.style.transform = 'translateY(0)';
            }}
        >
            📱 התקן אפליקציה
        </div>
    );
};

export default PWAInstallPrompt;
