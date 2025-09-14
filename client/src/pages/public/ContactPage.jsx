import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { professionalTokens } from '../../theme/professionalTokens';
import UnifiedHeader from '../../components/common/UnifiedHeader';
import ProfessionalFooter from '../../components/common/ProfessionalFooter';
import CookieConsentPopup from '../../components/common/CookieConsentPopup';

const ContactPage = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('');

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('');

        // Simulate form submission
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            setSubmitStatus('success');
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: ''
            });
        } catch (error) {
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const contactInfo = [
        {
            icon: "📧",
            title: "אימייל",
            details: "info@luma.com",
            description: "נחזור אליכם תוך 24 שעות"
        },
        {
            icon: "📞",
            title: "טלפון",
            details: "03-1234567",
            description: "זמינים א'-ה' 9:00-18:00"
        },
        {
            icon: "📍",
            title: "כתובת",
            details: "תל אביב, ישראל",
            description: "פגישות בתיאום מראש"
        },
        {
            icon: "🕐",
            title: "שעות פעילות",
            details: "א'-ה' 9:00-18:00",
            description: "תמיכה טכנית 24/7"
        }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: professionalTokens.colors.background,
            fontFamily: professionalTokens.typography.fontFamily,
            color: professionalTokens.colors.textPrimary,
            position: 'relative',
            direction: 'rtl'
        }}>
            <UnifiedHeader />

            {/* Contact Hero Section */}
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
                            צור קשר
                        </h1>

                        <p style={{
                            color: professionalTokens.colors.textSecondary,
                            marginBottom: professionalTokens.spacing.xxl,
                            fontSize: '1.25rem',
                            lineHeight: professionalTokens.typography.lineHeight.normal,
                            maxWidth: '600px',
                            margin: '0 auto 48px auto'
                        }}>
                            נשמח לעזור לכם להפוך את העסק שלכם לדיגיטלי
                            <br />
                            <span style={{ color: professionalTokens.colors.textSecondary }}>
                                הצוות שלנו כאן בשבילכם
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Contact Content */}
            <div style={{
                padding: `${professionalTokens.spacing.xxxl} 0`,
                backgroundColor: professionalTokens.colors.background
            }}>
                <div style={{
                    maxWidth: professionalTokens.container.maxWidth,
                    margin: '0 auto',
                    padding: professionalTokens.container.padding
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth > 968 ? '1fr 1fr' : '1fr',
                        gap: '80px',
                        alignItems: 'flex-start'
                    }}>
                        {/* Contact Info */}
                        <div>
                            <h2 style={{
                                fontSize: professionalTokens.typography.fontSize.h2,
                                fontWeight: professionalTokens.typography.fontWeight.bold,
                                marginBottom: professionalTokens.spacing.lg,
                                color: professionalTokens.colors.textPrimary
                            }}>
                                פרטי קשר
                            </h2>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: professionalTokens.spacing.md
                            }}>
                                {contactInfo.map((info, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            ...professionalTokens.cards,
                                            display: 'flex',
                                            gap: professionalTokens.spacing.md,
                                            alignItems: 'flex-start',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            Object.assign(e.currentTarget.style, professionalTokens.cards.hover);
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = professionalTokens.cards.boxShadow;
                                            e.currentTarget.style.borderColor = 'rgba(43, 90, 135, 0.1)';
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '2.5rem',
                                            minWidth: '60px',
                                            textAlign: 'center'
                                        }}>
                                            {info.icon}
                                        </div>
                                        <div>
                                            <h3 style={{
                                                fontWeight: professionalTokens.typography.fontWeight.bold,
                                                marginBottom: professionalTokens.spacing.xs,
                                                color: professionalTokens.colors.textPrimary,
                                                fontSize: professionalTokens.typography.fontSize.h4
                                            }}>
                                                {info.title}
                                            </h3>
                                            <p style={{
                                                fontWeight: professionalTokens.typography.fontWeight.semibold,
                                                color: professionalTokens.colors.primary,
                                                marginBottom: '4px',
                                                fontSize: professionalTokens.typography.fontSize.body
                                            }}>
                                                {info.details}
                                            </p>
                                            <p style={{
                                                color: professionalTokens.colors.textSecondary,
                                                fontSize: professionalTokens.typography.fontSize.small,
                                                lineHeight: professionalTokens.typography.lineHeight.normal
                                            }}>
                                                {info.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(20px)',
                            padding: '48px',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                            <h3 style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                marginBottom: '32px',
                                color: '#ffffff'
                            }}>
                                שלחו לנו הודעה
                            </h3>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: window.innerWidth > 480 ? '1fr 1fr' : '1fr',
                                    gap: '20px'
                                }}>
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#e2e8f0'
                                        }}>
                                            שם מלא *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '16px',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                color: '#ffffff',
                                                fontSize: '16px',
                                                outline: 'none',
                                                transition: 'all 0.3s ease',
                                                fontFamily: 'inherit'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#3b82f6';
                                                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                            }}
                                            placeholder="הזינו את השם המלא"
                                        />
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#e2e8f0'
                                        }}>
                                            אימייל *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '16px',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                color: '#ffffff',
                                                fontSize: '16px',
                                                outline: 'none',
                                                transition: 'all 0.3s ease',
                                                fontFamily: 'inherit'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#3b82f6';
                                                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                            }}
                                            placeholder="הזינו כתובת אימייל"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#e2e8f0'
                                    }}>
                                        טלפון
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '100%',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            color: '#ffffff',
                                            fontSize: '16px',
                                            outline: 'none',
                                            transition: 'all 0.3s ease',
                                            fontFamily: 'inherit'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#3b82f6';
                                            e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                        }}
                                        placeholder="הזינו מספר טלפון"
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#e2e8f0'
                                    }}>
                                        נושא *
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            color: '#ffffff',
                                            fontSize: '16px',
                                            outline: 'none',
                                            transition: 'all 0.3s ease',
                                            fontFamily: 'inherit'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#3b82f6';
                                            e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                        }}
                                        placeholder="נושא ההודעה"
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#e2e8f0'
                                    }}>
                                        הודעה *
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                        rows={6}
                                        style={{
                                            width: '100%',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            color: '#ffffff',
                                            fontSize: '16px',
                                            outline: 'none',
                                            transition: 'all 0.3s ease',
                                            fontFamily: 'inherit',
                                            resize: 'vertical',
                                            minHeight: '120px'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#3b82f6';
                                            e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                        }}
                                        placeholder="כתבו את ההודעה שלכם כאן..."
                                    />
                                </div>

                                {submitStatus === 'success' && (
                                    <div style={{
                                        padding: '16px',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: '12px',
                                        color: '#10b981',
                                        fontSize: '14px'
                                    }}>
                                        ההודעה נשלחה בהצלחה! נחזור אליכם בהקדם האפשרי.
                                    </div>
                                )}

                                {submitStatus === 'error' && (
                                    <div style={{
                                        padding: '16px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '12px',
                                        color: '#ef4444',
                                        fontSize: '14px'
                                    }}>
                                        שגיאה בשליחת ההודעה. אנא נסו שוב.
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        background: isSubmitting
                                            ? 'rgba(59, 130, 246, 0.5)'
                                            : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                        color: 'white',
                                        padding: '18px 32px',
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        borderRadius: '12px',
                                        border: 'none',
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 6px 25px rgba(59, 130, 246, 0.4)'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSubmitting) {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 10px 35px rgba(59, 130, 246, 0.6)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSubmitting) {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 6px 25px rgba(59, 130, 246, 0.4)';
                                        }
                                    }}
                                >
                                    {isSubmitting ? 'שולח...' : 'שלח הודעה'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Info Section */}
            <div style={{
                padding: '80px 0',
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
            }}>
                <div style={{
                    maxWidth: '1000px',
                    margin: '0 auto',
                    padding: '0 24px',
                    textAlign: 'center'
                }}>
                    <h2 style={{
                        fontSize: 'clamp(2rem, 3vw, 2.5rem)',
                        fontWeight: '800',
                        marginBottom: '32px',
                        color: '#ffffff',
                        letterSpacing: '-0.02em'
                    }}>
                        למה לבחור ב-LUMA?
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '32px',
                        marginTop: '48px'
                    }}>
                        {[
                            {
                                icon: "🚀",
                                title: "הקמה מהירה",
                                description: "מערכת מוכנה לשימוש תוך 24-48 שעות"
                            },
                            {
                                icon: "🛡️",
                                title: "אבטחה מתקדמת",
                                description: "עמידה בכל התקנות משרד הבריאות"
                            },
                            {
                                icon: "📞",
                                title: "תמיכה 24/7",
                                description: "צוות מקצועי זמין בכל עת לעזרה"
                            },
                            {
                                icon: "💡",
                                title: "חדשנות מתמשכת",
                                description: "עדכונים קבועים ופיצ'רים חדשים"
                            }
                        ].map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    backdropFilter: 'blur(20px)',
                                    padding: '32px 24px',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px)';
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                }}
                            >
                                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
                                    {item.icon}
                                </div>
                                <h3 style={{
                                    fontWeight: '700',
                                    marginBottom: '12px',
                                    color: '#ffffff',
                                    fontSize: '18px'
                                }}>
                                    {item.title}
                                </h3>
                                <p style={{
                                    color: '#94a3b8',
                                    lineHeight: 1.6,
                                    fontSize: '14px'
                                }}>
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div style={{
                padding: '80px 0',
                background: '#0B1426'
            }}>
                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    padding: '0 24px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 3vw, 2.5rem)',
                            fontWeight: '800',
                            color: '#ffffff',
                            letterSpacing: '-0.02em'
                        }}>
                            שאלות נפוצות
                        </h2>
                    </div>

                    {[
                        {
                            question: "כמה זמן לוקח להתחיל להשתמש במערכת?",
                            answer: "בדרך כלל 24-48 שעות מרגע ההרשמה. אנחנו מספקים ליווי מלא והדרכה אישית כדי שתוכלו להתחיל במהירות."
                        },
                        {
                            question: "איך אני יכול לקבל תמיכה?",
                            answer: "אנחנו זמינים בטלפון, אימייל וצ'אט חי. הצוות שלנו מגיב תוך שעות בימי עסקים ומספק תמיכה טכנית מקצועית."
                        },
                        {
                            question: "האם יש תקופת ניסיון?",
                            answer: "כן! אנחנו מציעים 14 יום ניסיון חינם עם גישה מלאה לכל התכונות, ללא צורך בכרטיס אשראי."
                        }
                    ].map((faq, index) => (
                        <div
                            key={index}
                            style={{
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '16px',
                                marginBottom: '16px',
                                overflow: 'hidden',
                                background: 'rgba(255, 255, 255, 0.02)',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <div style={{
                                padding: '24px 28px',
                                fontWeight: '600',
                                fontSize: '16px',
                                color: '#ffffff',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                                {faq.question}
                            </div>
                            <div style={{
                                padding: '24px 28px',
                                fontSize: '15px',
                                lineHeight: 1.7,
                                color: '#94a3b8'
                            }}>
                                {faq.answer}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Final CTA */}
            <div style={{
                padding: '80px 0',
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
                position: 'relative',
                textAlign: 'center'
            }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 70%),
            linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)
          `
                }} />

                <div style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    padding: '0 24px',
                    position: 'relative',
                    zIndex: 2
                }}>
                    <h2 style={{
                        fontSize: 'clamp(2rem, 3vw, 2.8rem)',
                        fontWeight: '800',
                        marginBottom: '20px',
                        background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2
                    }}>
                        מוכנים להתחיל?
                    </h2>

                    <p style={{
                        fontSize: '18px',
                        color: '#94a3b8',
                        marginBottom: '32px',
                        lineHeight: 1.6
                    }}>
                        הצטרפו לאלפי המטפלים שכבר משתמשים ב-LUMA
                    </p>

                    <button
                        onClick={() => navigate('/register')}
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                            color: 'white',
                            padding: '18px 36px',
                            fontSize: '16px',
                            fontWeight: '700',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 6px 25px rgba(59, 130, 246, 0.4)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 10px 35px rgba(59, 130, 246, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 6px 25px rgba(59, 130, 246, 0.4)';
                        }}
                    >
                        התחילו 14 יום חינם →
                    </button>
                </div>
            </div>

            {/* Professional Footer */}
            <ProfessionalFooter />

            {/* Cookie Consent Popup */}
            {/* <CookieConsentPopup /> */}
        </div>
    );
};

export default ContactPage;