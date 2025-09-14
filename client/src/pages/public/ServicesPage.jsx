import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { professionalTokens } from '../../theme/professionalTokens';
import UnifiedHeader from '../../components/common/UnifiedHeader';
import CookieConsentPopup from '../../components/common/CookieConsentPopup';

const ServicesPage = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const plans = [
        {
            name: 'מסלול בסיסי',
            price: '₪99',
            period: '/חודש',
            description: 'מתאים למטפלים מתחילים',
            popular: false,
            features: [
                'CRM בסיסי - עד 50 לקוחות',
                'לוח שנה פשוט',
                'ניהול פגישות בסיסי',
                'תמיכה במייל',
                'אתר בסיסי עם תבנית אחת'
            ],
            buttonText: 'התחל חינם',
            buttonStyle: 'secondary'
        },
        {
            name: 'מסלול מורחב',
            price: '₪199',
            period: '/חודש',
            description: 'הכי פופולרי - מתאים למטפלים מקצועיים',
            popular: true,
            features: [
                'CRM מלא - לקוחות ללא הגבלה',
                'לוח שנה מתקדם + סינכרון',
                'ניהול תשלומים',
                'הצהרות בריאות דיגיטליות',
                'אתר מקצועי + 5 תבניות',
                'דוחות ואנליטיקה',
                'תמיכה טלפונית'
            ],
            buttonText: 'התחל חינם',
            buttonStyle: 'primary'
        },
        {
            name: 'מסלול פרימיום',
            price: '₪299',
            period: '/חודש',
            description: 'מתאים לקליניקות ומטפלים מתקדמים',
            popular: false,
            features: [
                'כל התכונות של המורחב +',
                'אוטומציה מתקדמת',
                'AI לניהול לקוחות',
                'אינטגרציה עם מערכות חיצוניות',
                'תבניות אתר ללא הגבלה',
                'מנהל לקוחות ייעודי',
                'הדרכות 1:1',
                'תמיכה VIP 24/7'
            ],
            buttonText: 'התחל חינם',
            buttonStyle: 'secondary'
        }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: professionalTokens.colors.background,
            fontFamily: professionalTokens.typography.fontFamily,
            color: professionalTokens.colors.textPrimary,
            direction: 'rtl'
        }}>
            <UnifiedHeader />

            {/* Hero Section */}
            <div style={{
                paddingTop: '120px',
                paddingBottom: professionalTokens.spacing.xxxl,
                background: `linear-gradient(135deg, ${professionalTokens.colors.background} 0%, ${professionalTokens.colors.backgroundSecondary} 100%)`,
                textAlign: 'center'
            }}>
                <div style={{
                    maxWidth: professionalTokens.container.maxWidth,
                    margin: '0 auto',
                    padding: professionalTokens.container.padding
                }}>
                    <div style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'all 1s ease'
                    }}>
                        <h1 style={{
                            fontSize: professionalTokens.typography.fontSize.h1,
                            fontWeight: professionalTokens.typography.fontWeight.extrabold,
                            marginBottom: professionalTokens.spacing.md,
                            color: professionalTokens.colors.textPrimary,
                            lineHeight: professionalTokens.typography.lineHeight.tight
                        }}>
                            בחרו את החבילה המתאימה לכם
                        </h1>

                        <p style={{
                            fontSize: '1.25rem',
                            color: professionalTokens.colors.textSecondary,
                            marginBottom: professionalTokens.spacing.xxl,
                            lineHeight: professionalTokens.typography.lineHeight.normal,
                            maxWidth: '600px',
                            margin: '0 auto 48px auto'
                        }}>
                            כל מסלול מותאם לצרכים השונים של מטפלים מקצועיים
                        </p>
                    </div>
                </div>
            </div>

            {/* Plans Section */}
            <div style={{
                paddingBottom: professionalTokens.spacing.xxxl,
                background: professionalTokens.colors.background
            }}>
                <div style={{
                    maxWidth: professionalTokens.container.maxWidth,
                    margin: '0 auto',
                    padding: professionalTokens.container.padding
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth > 992 ? 'repeat(3, 1fr)' : '1fr',
                        gap: professionalTokens.spacing.lg,
                        marginTop: professionalTokens.spacing.xl
                    }}>
                        {plans.map((plan, index) => (
                            <div
                                key={index}
                                style={{
                                    ...professionalTokens.cards,
                                    position: 'relative',
                                    transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                                    border: plan.popular ? `2px solid ${professionalTokens.colors.primary}` : professionalTokens.cards.border,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%'
                                }}
                                onMouseEnter={(e) => {
                                    Object.assign(e.currentTarget.style, professionalTokens.cards.hover);
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = plan.popular ? 'scale(1.05)' : 'translateY(0)';
                                    e.currentTarget.style.boxShadow = professionalTokens.cards.boxShadow;
                                    e.currentTarget.style.borderColor = plan.popular ? professionalTokens.colors.primary : 'rgba(43, 90, 135, 0.1)';
                                }}
                            >
                                {plan.popular && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-12px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: professionalTokens.colors.primary,
                                        color: professionalTokens.colors.headerText,
                                        padding: '6px 16px',
                                        borderRadius: professionalTokens.borderRadius.full,
                                        fontSize: professionalTokens.typography.fontSize.small,
                                        fontWeight: professionalTokens.typography.fontWeight.semibold
                                    }}>
                                        הכי פופולרי
                                    </div>
                                )}

                                {/* Header Section */}
                                <div style={{ textAlign: 'center', marginBottom: professionalTokens.spacing.lg }}>
                                    <h3 style={{
                                        fontSize: professionalTokens.typography.fontSize.h3,
                                        fontWeight: professionalTokens.typography.fontWeight.bold,
                                        marginBottom: professionalTokens.spacing.sm,
                                        color: professionalTokens.colors.textPrimary
                                    }}>
                                        {plan.name}
                                    </h3>

                                    <div style={{ marginBottom: professionalTokens.spacing.sm }}>
                                        <span style={{
                                            fontSize: '3rem',
                                            fontWeight: professionalTokens.typography.fontWeight.extrabold,
                                            color: professionalTokens.colors.primary
                                        }}>
                                            {plan.price}
                                        </span>
                                        <span style={{
                                            fontSize: professionalTokens.typography.fontSize.body,
                                            color: professionalTokens.colors.textSecondary
                                        }}>
                                            {plan.period}
                                        </span>
                                    </div>

                                    <p style={{
                                        fontSize: professionalTokens.typography.fontSize.body,
                                        color: professionalTokens.colors.textSecondary,
                                        lineHeight: professionalTokens.typography.lineHeight.normal
                                    }}>
                                        {plan.description}
                                    </p>
                                </div>

                                {/* Features Section - Flexible height */}
                                <div style={{ flex: 1, marginBottom: professionalTokens.spacing.lg }}>
                                    {plan.features.map((feature, featureIndex) => (
                                        <div
                                            key={featureIndex}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                marginBottom: professionalTokens.spacing.sm,
                                                fontSize: professionalTokens.typography.fontSize.body,
                                                lineHeight: professionalTokens.typography.lineHeight.normal
                                            }}
                                        >
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                background: professionalTokens.colors.success,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginLeft: professionalTokens.spacing.sm,
                                                marginTop: '2px',
                                                flexShrink: 0
                                            }}>
                                                <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                                            </div>
                                            <span style={{ color: professionalTokens.colors.textPrimary }}>
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Button Section - Always at bottom */}
                                <div style={{ marginTop: 'auto' }}>
                                    <button
                                        onClick={() => navigate('/register')}
                                        style={{
                                            width: '100%',
                                            ...(plan.buttonStyle === 'primary' ? professionalTokens.buttons.primary : professionalTokens.buttons.secondary)
                                        }}
                                        onMouseEnter={(e) => {
                                            Object.assign(e.target.style,
                                                plan.buttonStyle === 'primary' ? professionalTokens.buttons.primary.hover : professionalTokens.buttons.secondary.hover
                                            );
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = plan.buttonStyle === 'primary' ? '0 2px 10px rgba(43, 90, 135, 0.3)' : 'none';
                                            if (plan.buttonStyle === 'secondary') {
                                                e.target.style.background = 'transparent';
                                                e.target.style.color = professionalTokens.colors.primary;
                                            }
                                        }}
                                    >
                                        {plan.buttonText}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div style={{
                padding: professionalTokens.spacing.xxxl + ' 0',
                background: `linear-gradient(135deg, ${professionalTokens.colors.primary} 0%, ${professionalTokens.colors.primaryLight} 100%)`,
                textAlign: 'center'
            }}>
                <div style={{
                    maxWidth: professionalTokens.container.maxWidth,
                    margin: '0 auto',
                    padding: professionalTokens.container.padding
                }}>
                    <h2 style={{
                        fontSize: professionalTokens.typography.fontSize.h2,
                        fontWeight: professionalTokens.typography.fontWeight.bold,
                        marginBottom: professionalTokens.spacing.md,
                        color: professionalTokens.colors.headerText
                    }}>
                        מוכנים להתחיל?
                    </h2>

                    <p style={{
                        fontSize: '1.125rem',
                        color: 'rgba(255, 255, 255, 0.9)',
                        marginBottom: professionalTokens.spacing.lg,
                        maxWidth: '600px',
                        margin: '0 auto 32px auto'
                    }}>
                        הצטרפו לאלפי המטפלים שכבר משתמשים ב-LUMA
                    </p>

                    <button
                        onClick={() => navigate('/register')}
                        style={{
                            ...professionalTokens.buttons.secondary,
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: professionalTokens.colors.headerText,
                            border: `2px solid ${professionalTokens.colors.headerText}`,
                            fontSize: '1.125rem',
                            padding: '16px 32px'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = professionalTokens.colors.headerText;
                            e.target.style.color = professionalTokens.colors.primary;
                            e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.color = professionalTokens.colors.headerText;
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        התחילו 14 יום חינם →
                    </button>
                </div>
            </div>

            {/* Cookie Consent Popup */}
            <CookieConsentPopup />
        </div>
    );
};

export default ServicesPage;
