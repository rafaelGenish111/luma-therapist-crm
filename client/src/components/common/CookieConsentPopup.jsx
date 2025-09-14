import React, { useState, useEffect } from 'react';
import { professionalTokens } from '../../theme/professionalTokens';

const CookieConsentPopup = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // בדיקה אם המשתמש כבר הסכים לקוקיז
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // עיכוב קצר כדי שהאתר ייטען קודם
            setTimeout(() => {
                setIsVisible(true);
            }, 1500);
        }
    }, []);

    const handleAccept = () => {
        setIsAnimating(true);
        localStorage.setItem('cookie-consent', 'accepted');

        setTimeout(() => {
            setIsVisible(false);
            setIsAnimating(false);
        }, 300);
    };

    const handleDecline = () => {
        setIsAnimating(true);
        localStorage.setItem('cookie-consent', 'declined');

        setTimeout(() => {
            setIsVisible(false);
            setIsAnimating(false);
        }, 300);
    };

    const handleLearnMore = () => {
        // כאן אפשר להוסיף ניווט לדף מדיניות פרטיות
        window.open('/privacy', '_blank');
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            width: '100%',
            background: professionalTokens.colors.background,
            borderTop: `2px solid ${professionalTokens.colors.primary}`,
            boxShadow: '0 -5px 20px rgba(0, 0, 0, 0.1)',
            padding: `${professionalTokens.spacing.md} ${professionalTokens.spacing.lg}`,
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating ? 'translateY(100%)' : 'translateY(0)',
            transition: 'all 0.3s ease',
            fontFamily: professionalTokens.typography.fontFamily,
            direction: 'rtl'
        }}>
            {/* Content Row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                maxWidth: '1200px',
                margin: '0 auto',
                gap: professionalTokens.spacing.lg,
                flexWrap: 'wrap'
            }}>
                {/* Left Side - Icon and Text */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: professionalTokens.spacing.md,
                    flex: 1,
                    minWidth: '300px'
                }}>
                    <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${professionalTokens.colors.primary}, ${professionalTokens.colors.primaryLight})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>🍪</span>
                    </div>

                    <span style={{
                        fontSize: professionalTokens.typography.fontSize.body,
                        color: professionalTokens.colors.textPrimary,
                        fontWeight: professionalTokens.typography.fontWeight.medium,
                        whiteSpace: 'nowrap'
                    }}>
                        אנו משתמשים בקובצי Cookie כדי לשפר את החוויה שלכם באתר
                    </span>
                </div>

                {/* Right Side - Buttons */}
                <div style={{
                    display: 'flex',
                    gap: professionalTokens.spacing.sm,
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={handleAccept}
                        style={{
                            ...professionalTokens.buttons.primary,
                            fontSize: professionalTokens.typography.fontSize.small,
                            padding: '8px 16px',
                            minWidth: '100px',
                            borderRadius: professionalTokens.borderRadius.sm
                        }}
                        onMouseEnter={(e) => {
                            Object.assign(e.target.style, professionalTokens.buttons.primary.hover);
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 10px rgba(43, 90, 135, 0.3)';
                        }}
                    >
                        מקבל
                    </button>

                    <button
                        onClick={handleDecline}
                        style={{
                            ...professionalTokens.buttons.secondary,
                            fontSize: professionalTokens.typography.fontSize.small,
                            padding: '8px 16px',
                            minWidth: '80px',
                            borderRadius: professionalTokens.borderRadius.sm
                        }}
                        onMouseEnter={(e) => {
                            Object.assign(e.target.style, professionalTokens.buttons.secondary.hover);
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.background = 'transparent';
                            e.target.style.color = professionalTokens.colors.primary;
                        }}
                    >
                        דוחה
                    </button>

                    <button
                        onClick={handleLearnMore}
                        style={{
                            background: 'transparent',
                            color: professionalTokens.colors.primaryLight,
                            border: 'none',
                            fontSize: professionalTokens.typography.fontSize.small,
                            padding: '8px 12px',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            transition: professionalTokens.transitions.normal,
                            minWidth: '80px'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.color = professionalTokens.colors.primary;
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.color = professionalTokens.colors.primaryLight;
                        }}
                    >
                        מידע נוסף
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsentPopup;
