import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { professionalTokens } from '../../theme/professionalTokens';
import UnifiedHeader from '../../components/common/UnifiedHeader';
import ProfessionalFooter from '../../components/common/ProfessionalFooter';
import CookieConsentPopup from '../../components/common/CookieConsentPopup';

const AboutPage = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const teamMembers = [
        {
            name: 'ד״ר שרה כהן',
            role: 'מנכ״לית ומייסדת',
            image: '👩‍⚕️',
            description: 'מטפלת מומחית עם 15 שנות ניסיון בתחום הפסיכותרפיה'
        },
        {
            name: 'משה לוי',
            role: 'CTO',
            image: '👨‍💻',
            description: 'מומחה טכנולוגיה עם רקע בהתפתחות מערכות רפואיות'
        },
        {
            name: 'רחל אברהם',
            role: 'מנהלת מוצר',
            image: '👩‍💼',
            description: 'מתמחה בחוויית משתמש ופיתוח פתרונות דיגיטליים'
        }
    ];

    const milestones = [
        {
            year: '2020',
            title: 'הקמת החברה',
            description: 'התחלנו עם חזון ליצור פלטפורמה שתעזור למטפלים לנהל את העסק שלהם'
        },
        {
            year: '2021',
            title: 'השקה ראשונית',
            description: 'השקנו את הגרסה הראשונה עם 50 מטפלים ראשונים'
        },
        {
            year: '2022',
            title: 'גידול משמעותי',
            description: 'הגענו ל-500 מטפלים פעילים ופיתחנו תכונות מתקדמות'
        },
        {
            year: '2024',
            title: 'הרחבת השירותים',
            description: 'הוספנו תמיכה בעברית ואינטגרציות עם מערכות מקומיות'
        }
    ];

    const values = [
        {
            icon: '🤝',
            title: 'אמון',
            description: 'אנו מחויבים לשמור על הפרטיות והאבטחה של המטפלים והמטופלים'
        },
        {
            icon: '💡',
            title: 'חדשנות',
            description: 'מתמידים בפיתוח טכנולוגיות מתקדמות לשיפור השירות'
        },
        {
            icon: '❤️',
            title: 'מחויבות',
            description: 'מסורים לתמיכה במטפלים ולסיוע להם להצליח'
        },
        {
            icon: '🎯',
            title: 'מקצועיות',
            description: 'מספקים פתרונות איכותיים ומקצועיים לכל צורך'
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
                            אודות LUMA
                        </h1>

                        <p style={{
                            fontSize: '1.25rem',
                            color: professionalTokens.colors.textSecondary,
                            marginBottom: professionalTokens.spacing.xxl,
                            lineHeight: professionalTokens.typography.lineHeight.normal,
                            maxWidth: '600px',
                            margin: '0 auto 48px auto'
                        }}>
                            הפלטפורמה המובילה בישראל לניהול קליניקות טיפול
                        </p>
                    </div>
                </div>
            </div>

            {/* Our Story Section */}
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
                        gridTemplateColumns: window.innerWidth > 992 ? '1fr 1fr' : '1fr',
                        gap: professionalTokens.spacing.xxxl,
                        alignItems: 'center'
                    }}>
                        <div>
                            <h2 style={{
                                fontSize: professionalTokens.typography.fontSize.h2,
                                fontWeight: professionalTokens.typography.fontWeight.bold,
                                marginBottom: professionalTokens.spacing.lg,
                                color: professionalTokens.colors.textPrimary
                            }}>
                                הסיפור שלנו
                            </h2>

                            <p style={{
                                fontSize: professionalTokens.typography.fontSize.body,
                                color: professionalTokens.colors.textSecondary,
                                lineHeight: professionalTokens.typography.lineHeight.relaxed,
                                marginBottom: professionalTokens.spacing.lg
                            }}>
                                LUMA נוסדה מתוך הבנה עמוקה של האתגרים שעומדים בפני מטפלים בישראל.
                                כמייסדת החברה, ד״ר שרה כהן, עבדה שנים כמטפלת וראתה במו עיניה את
                                הקשיים בניהול הקליניקה.
                            </p>

                            <p style={{
                                fontSize: professionalTokens.typography.fontSize.body,
                                color: professionalTokens.colors.textSecondary,
                                lineHeight: professionalTokens.typography.lineHeight.relaxed,
                                marginBottom: professionalTokens.spacing.lg
                            }}>
                                המטרה שלנו פשוטה: לאפשר למטפלים להתמקד במה שהם עושים הכי טוב -
                                לטפל באנשים - ולהשאיר לנו את הניהול הטכני והמנהלי.
                            </p>
                        </div>

                        <div style={{
                            ...professionalTokens.cards,
                            textAlign: 'center',
                            padding: professionalTokens.spacing.xxxl
                        }}>
                            <div style={{
                                fontSize: '4rem',
                                marginBottom: professionalTokens.spacing.lg
                            }}>
                                🏥
                            </div>
                            <h3 style={{
                                fontSize: professionalTokens.typography.fontSize.h3,
                                fontWeight: professionalTokens.typography.fontWeight.bold,
                                marginBottom: professionalTokens.spacing.md,
                                color: professionalTokens.colors.primary
                            }}>
                                יותר מ-1,000 מטפלים
                            </h3>
                            <p style={{
                                fontSize: professionalTokens.typography.fontSize.body,
                                color: professionalTokens.colors.textSecondary,
                                lineHeight: professionalTokens.typography.lineHeight.normal
                            }}>
                                כבר בחרו ב-LUMA לניהול הקליניקה שלהם
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Values Section */}
            <div style={{
                padding: `${professionalTokens.spacing.xxxl} 0`,
                backgroundColor: professionalTokens.colors.backgroundSecondary
            }}>
                <div style={{
                    maxWidth: professionalTokens.container.maxWidth,
                    margin: '0 auto',
                    padding: professionalTokens.container.padding
                }}>
                    <div style={{ textAlign: 'center', marginBottom: professionalTokens.spacing.xxxl }}>
                        <h2 style={{
                            fontSize: professionalTokens.typography.fontSize.h2,
                            fontWeight: professionalTokens.typography.fontWeight.bold,
                            marginBottom: professionalTokens.spacing.md,
                            color: professionalTokens.colors.textPrimary
                        }}>
                            הערכים שלנו
                        </h2>
                        <p style={{
                            fontSize: '1.125rem',
                            color: professionalTokens.colors.textSecondary,
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}>
                            העקרונות שמנחים אותנו בכל החלטה ופיתוח
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
                        gap: professionalTokens.spacing.lg
                    }}>
                        {values.map((value, index) => (
                            <div
                                key={index}
                                style={{
                                    ...professionalTokens.cards,
                                    textAlign: 'center',
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
                                    fontSize: '3rem',
                                    marginBottom: professionalTokens.spacing.md
                                }}>
                                    {value.icon}
                                </div>
                                <h3 style={{
                                    fontSize: professionalTokens.typography.fontSize.h4,
                                    fontWeight: professionalTokens.typography.fontWeight.bold,
                                    marginBottom: professionalTokens.spacing.sm,
                                    color: professionalTokens.colors.textPrimary
                                }}>
                                    {value.title}
                                </h3>
                                <p style={{
                                    fontSize: professionalTokens.typography.fontSize.body,
                                    color: professionalTokens.colors.textSecondary,
                                    lineHeight: professionalTokens.typography.lineHeight.normal
                                }}>
                                    {value.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Timeline Section */}
            <div style={{
                padding: `${professionalTokens.spacing.xxxl} 0`,
                backgroundColor: professionalTokens.colors.background
            }}>
                <div style={{
                    maxWidth: professionalTokens.container.maxWidth,
                    margin: '0 auto',
                    padding: professionalTokens.container.padding
                }}>
                    <div style={{ textAlign: 'center', marginBottom: professionalTokens.spacing.xxxl }}>
                        <h2 style={{
                            fontSize: professionalTokens.typography.fontSize.h2,
                            fontWeight: professionalTokens.typography.fontWeight.bold,
                            marginBottom: professionalTokens.spacing.md,
                            color: professionalTokens.colors.textPrimary
                        }}>
                            הדרך שלנו
                        </h2>
                        <p style={{
                            fontSize: '1.125rem',
                            color: professionalTokens.colors.textSecondary,
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}>
                            נקודות הציון החשובות בהתפתחות LUMA
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: window.innerWidth > 768 ? 'row' : 'column',
                        gap: professionalTokens.spacing.lg,
                        position: 'relative'
                    }}>
                        {milestones.map((milestone, index) => (
                            <div
                                key={index}
                                style={{
                                    flex: 1,
                                    ...professionalTokens.cards,
                                    position: 'relative',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{
                                    fontSize: professionalTokens.typography.fontSize.h3,
                                    fontWeight: professionalTokens.typography.fontWeight.bold,
                                    color: professionalTokens.colors.primary,
                                    marginBottom: professionalTokens.spacing.sm
                                }}>
                                    {milestone.year}
                                </div>
                                <h3 style={{
                                    fontSize: professionalTokens.typography.fontSize.h4,
                                    fontWeight: professionalTokens.typography.fontWeight.bold,
                                    marginBottom: professionalTokens.spacing.sm,
                                    color: professionalTokens.colors.textPrimary
                                }}>
                                    {milestone.title}
                                </h3>
                                <p style={{
                                    fontSize: professionalTokens.typography.fontSize.body,
                                    color: professionalTokens.colors.textSecondary,
                                    lineHeight: professionalTokens.typography.lineHeight.normal
                                }}>
                                    {milestone.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Team Section */}
            <div style={{
                padding: `${professionalTokens.spacing.xxxl} 0`,
                backgroundColor: professionalTokens.colors.backgroundSecondary
            }}>
                <div style={{
                    maxWidth: professionalTokens.container.maxWidth,
                    margin: '0 auto',
                    padding: professionalTokens.container.padding
                }}>
                    <div style={{ textAlign: 'center', marginBottom: professionalTokens.spacing.xxxl }}>
                        <h2 style={{
                            fontSize: professionalTokens.typography.fontSize.h2,
                            fontWeight: professionalTokens.typography.fontWeight.bold,
                            marginBottom: professionalTokens.spacing.md,
                            color: professionalTokens.colors.textPrimary
                        }}>
                            הצוות שלנו
                        </h2>
                        <p style={{
                            fontSize: '1.125rem',
                            color: professionalTokens.colors.textSecondary,
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}>
                            האנשים שמביאים לכם את הפתרון המושלם
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth > 768 ? 'repeat(3, 1fr)' : '1fr',
                        gap: professionalTokens.spacing.lg
                    }}>
                        {teamMembers.map((member, index) => (
                            <div
                                key={index}
                                style={{
                                    ...professionalTokens.cards,
                                    textAlign: 'center',
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
                                    fontSize: '4rem',
                                    marginBottom: professionalTokens.spacing.md
                                }}>
                                    {member.image}
                                </div>
                                <h3 style={{
                                    fontSize: professionalTokens.typography.fontSize.h4,
                                    fontWeight: professionalTokens.typography.fontWeight.bold,
                                    marginBottom: professionalTokens.spacing.sm,
                                    color: professionalTokens.colors.textPrimary
                                }}>
                                    {member.name}
                                </h3>
                                <p style={{
                                    fontSize: professionalTokens.typography.fontSize.body,
                                    fontWeight: professionalTokens.typography.fontWeight.semibold,
                                    color: professionalTokens.colors.primary,
                                    marginBottom: professionalTokens.spacing.sm
                                }}>
                                    {member.role}
                                </p>
                                <p style={{
                                    fontSize: professionalTokens.typography.fontSize.body,
                                    color: professionalTokens.colors.textSecondary,
                                    lineHeight: professionalTokens.typography.lineHeight.normal
                                }}>
                                    {member.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div style={{
                padding: `${professionalTokens.spacing.xxxl} 0`,
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
                        מוכנים להצטרף אלינו?
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

            <ProfessionalFooter />

            {/* Cookie Consent Popup */}
            {/* <CookieConsentPopup /> */}
        </div>
    );
};

export default AboutPage;
