import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { professionalTokens } from '../theme/professionalTokens';
import UnifiedHeader from '../components/common/UnifiedHeader';
import ProfessionalFooter from '../components/common/ProfessionalFooter';
// import CookieConsentPopup from '../components/common/CookieConsentPopup';

const PremiumHomePage = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [backgroundImage, setBackgroundImage] = useState(0);
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Mouse tracking for dynamic background
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Background images rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setBackgroundImage(prev => (prev + 1) % 4);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const backgroundImages = [
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", // Modern clinic
        "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", // Office workspace
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", // Medical office
        "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"  // Modern workspace
    ];

    const benefits = [
        {
            icon: "📈",
            title: "חיסכון עד 15 שעות בשבוע",
            description: "אוטומציה מלאה של תהליכי הניהול - ללא ניהול ידני מיותר",
            color: "#10B981"
        },
        {
            icon: "⚡",
            title: "40% יותר לקוחות חדשים",
            description: "עם אתר מקצועי ונוכחות דיגיטלית - ללא איבוד פניות",
            color: "#3B82F6"
        },
        {
            icon: "💰",
            title: "הגדלת הכנסות ב-25%",
            description: "בזכות ניהול מקצועי ויעיל - ללא קשיים בגביה",
            color: "#F59E0B"
        },
        {
            icon: "🤖",
            title: "תקשורת יעילה ומרכזית",
            description: "מערכת תקשורת מתקדמת עם לקוחות - ללא בלבול ואיבוד מידע",
            color: "#8B5CF6"
        }
    ];

    const testimonials = [
        {
            name: "ד\"ר שרה כהן",
            title: "פסיכולוגית קלינית",
            avatar: "ש",
            rating: 5,
            text: "Luma שינתה לי את החיים המקצועיים. חוסכת לי שעות בשבוע ונותנת שירות מקצועי יותר."
        },
        {
            name: "יעל לוי",
            title: "מטפלת זוגית",
            avatar: "י",
            rating: 5,
            text: "הפלטפורמה הכי מקצועית שיש. הלקוחות שלי מתפעלים מהאתר והתהליכים החלקים."
        },
        {
            name: "ד\"ר מיכל רוזנברג",
            title: "פיזיותרפיסטית",
            avatar: "מ",
            rating: 5,
            text: "סוף סוף פתרון שמבין מטפלים! הצהרות הבריאות הדיגיטליות פשוט הצילו אותי."
        }
    ];

    const faqs = [
        {
            question: "כמה זמן לוקח להקים את המערכת?",
            answer: "בדרך כלל 24-48 שעות. אנחנו מספקים ליווי מלא והדרכה אישית."
        },
        {
            question: "האם המערכת מאובטחת לנתונים רפואיים?",
            answer: "כן, אנחנו עומדים בכל התקנות של משרד הבריאות ו-GDPR עם הצפנה ברמה הגבוהה ביותר."
        },
        {
            question: "האם אפשר לנסות לפני תשלום?",
            answer: "בהחלט! יש תקופת ניסיון של 14 יום חינם עם כל התכונות."
        }
    ];

    const handleNavigation = (section) => {
        switch (section) {
            case 'features':
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                break;
            case 'pricing':
                navigate('/pricing');
                break;
            case 'about':
                navigate('/about');
                break;
            case 'contact':
                navigate('/contact');
                break;
            default:
                break;
        }
        setIsHeaderExpanded(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: professionalTokens.colors.background,
            overflow: 'hidden',
            fontFamily: professionalTokens.typography.fontFamily,
            color: professionalTokens.colors.textPrimary,
            position: 'relative'
        }}>
            <UnifiedHeader />

            {/* Hero Section - Simplified and Centered */}
            <div style={{
                minHeight: '100vh',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                overflow: 'hidden'
            }}>
                {/* Background Images */}
                {backgroundImages.map((img, index) => (
                    <div
                        key={index}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `url(${img})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: backgroundImage === index ? 0.12 : 0,
                            transition: 'opacity 1.5s ease-in-out',
                            filter: 'blur(1px)'
                        }}
                    />
                ))}

                {/* Gradient Overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `
            linear-gradient(135deg, 
              rgba(11, 20, 38, 0.95) 0%, 
              rgba(30, 41, 59, 0.90) 35%, 
              rgba(51, 65, 85, 0.85) 100%),
            radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
              rgba(59, 130, 246, 0.08) 0%, 
              transparent 50%)
          `
                }} />

                <div style={{
                    maxWidth: '900px',
                    margin: '0 auto',
                    padding: '0 24px',
                    position: 'relative',
                    zIndex: 2
                }}>
                    {/* Main Headline */}
                    <div style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'all 1s ease'
                    }}>
                        <h1 style={{
                            fontSize: 'clamp(3rem, 7vw, 6rem)',
                            fontWeight: '800',
                            marginBottom: '40px',
                            lineHeight: 1.1,
                            letterSpacing: '-0.02em'
                        }}>
                            <span style={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                LUMA
                            </span>
                            <br />
                            <span style={{
                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #10b981)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontSize: '0.8em'
                            }}>
                                תהפכו את הזמן שלכם לטיפול
                            </span>
                        </h1>

                        <p style={{
                            color: '#94a3b8',
                            marginBottom: '48px',
                            fontSize: 'clamp(1.25rem, 2.5vw, 1.8rem)',
                            lineHeight: 1.6,
                            fontWeight: '400',
                            maxWidth: '700px',
                            margin: '0 auto 48px'
                        }}>
                            תתמקדו במה שאתם הכי טובים בו -
                            <br />
                            <span style={{ color: '#64748b' }}>
                                אנחנו נעשה עבורכם את השאר
                            </span>
                        </p>

                        <div style={{
                            display: 'flex',
                            gap: '20px',
                            justifyContent: 'center',
                            marginBottom: '48px',
                            flexDirection: window.innerWidth > 480 ? 'row' : 'column',
                            alignItems: 'center'
                        }}>
                            <button
                                onClick={() => navigate('/register')}
                                style={{
                                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                    color: 'white',
                                    padding: '20px 40px',
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    borderRadius: '12px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 6px 25px rgba(59, 130, 246, 0.4)',
                                    letterSpacing: '0.5px'
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
                                התחילו חינם היום →
                            </button>

                            <button
                                onClick={() => navigate('/login')}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    padding: '20px 32px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    backdropFilter: 'blur(10px)'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                התחברו
                            </button>

                            <button style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '20px 32px',
                                fontSize: '16px',
                                fontWeight: '600',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                backdropFilter: 'blur(10px)'
                            }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                }}>
                                ▶ צפו בהדגמה
                            </button>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            color: '#94a3b8',
                            fontSize: '15px'
                        }}>
                            <span style={{
                                color: '#10b981',
                                fontSize: '16px'
                            }}>✓</span>
                            <span>ללא התחייבות • ניסיון 14 יום חינם • ללא כרטיס אשראי</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* App Description Section */}
            <div id="features" style={{
                padding: '120px 0',
                background: '#0B1426',
                position: 'relative'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 24px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{
                            fontSize: 'clamp(2.5rem, 4vw, 4rem)',
                            fontWeight: '800',
                            marginBottom: '24px',
                            letterSpacing: '-0.02em',
                            color: '#ffffff'
                        }}>
                            פלטפורמה דיגיטלית מתקדמת
                        </h2>
                        <p style={{
                            fontSize: '20px',
                            color: '#64748b',
                            maxWidth: '800px',
                            margin: '0 auto',
                            lineHeight: 1.7
                        }}>
                            LUMA היא פלטפורמה מתקדמת שנבנתה במיוחד עבור מטפלים מקצועיים.
                            אנחנו מספקים את כל הכלים הדיגיטליים שאתם צריכים -
                            CRM חכם, בונה אתרים, ניהול תשלומים, ניהול קמפיינים שיווקיים ואוטומציה מתקדמת.
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth > 968 ? '1fr 1fr' : '1fr',
                        gap: '80px',
                        alignItems: 'center'
                    }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '100%',
                                height: '450px',
                                borderRadius: '24px',
                                background: 'linear-gradient(135deg, #1e293b, #334155)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                color: '#94a3b8',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: `
                    radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                    radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)
                  `
                                }} />
                                <div style={{
                                    position: 'relative',
                                    zIndex: 1,
                                    textAlign: 'center',
                                    padding: '40px'
                                }}>
                                    <div style={{
                                        fontSize: '48px',
                                        marginBottom: '20px'
                                    }}>💻</div>
                                    <div style={{ fontSize: '20px', marginBottom: '12px', color: '#ffffff', fontWeight: '600' }}>
                                        Dashboard מטפל מתקדם
                                    </div>
                                    <div style={{ fontSize: '14px', opacity: 0.7, lineHeight: 1.5 }}>
                                        ממשק נקי ואינטואיטיבי<br />
                                        עם כל הכלים שאתם צריכים
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                position: 'absolute',
                                top: '-16px',
                                right: '-16px',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                padding: '12px 20px',
                                borderRadius: '16px',
                                fontSize: '13px',
                                fontWeight: '700',
                                transform: 'rotate(8deg)',
                                boxShadow: '0 12px 35px rgba(16, 185, 129, 0.4)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                🔥 חדש! AI מובנה
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            {benefits.map((benefit, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    gap: '24px',
                                    alignItems: 'flex-start',
                                    padding: '32px',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    transition: 'all 0.3s ease'
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                        e.currentTarget.style.borderColor = `${benefit.color}30`;
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{
                                        minWidth: '70px',
                                        height: '70px',
                                        fontSize: '2.2rem',
                                        background: `linear-gradient(135deg, ${benefit.color}20, ${benefit.color}10)`,
                                        borderRadius: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: `1px solid ${benefit.color}25`,
                                        boxShadow: `0 8px 32px ${benefit.color}15`
                                    }}>
                                        {benefit.icon}
                                    </div>
                                    <div>
                                        <h3 style={{
                                            fontWeight: '700',
                                            marginBottom: '12px',
                                            fontSize: '22px',
                                            color: '#ffffff'
                                        }}>
                                            {benefit.title}
                                        </h3>
                                        <p style={{
                                            color: '#94a3b8',
                                            lineHeight: 1.6,
                                            fontSize: '16px'
                                        }}>
                                            {benefit.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <div style={{
                padding: '100px 0',
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 24px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{
                            fontSize: 'clamp(2.5rem, 4vw, 4rem)',
                            fontWeight: '800',
                            marginBottom: '20px',
                            color: '#ffffff',
                            letterSpacing: '-0.02em'
                        }}>
                            מה אומרים המטפלים
                        </h2>
                        <p style={{
                            fontSize: '20px',
                            color: '#64748b',
                            lineHeight: 1.6
                        }}>
                            אלפי מטפלים כבר משתמשים ב-LUMA ורואים תוצאות
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                        gap: '32px'
                    }}>
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    backdropFilter: 'blur(30px)',
                                    padding: '40px',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    transition: 'all 0.4s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px)';
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                    e.currentTarget.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '3px',
                                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981)',
                                    opacity: 0.6
                                }} />

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '24px'
                                }}>
                                    <div style={{
                                        width: '65px',
                                        height: '65px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '700',
                                        fontSize: '22px',
                                        marginLeft: '16px',
                                        border: '2px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
                                    }}>
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <h4 style={{
                                            fontWeight: '700',
                                            marginBottom: '6px',
                                            color: '#ffffff',
                                            fontSize: '18px'
                                        }}>
                                            {testimonial.name}
                                        </h4>
                                        <p style={{
                                            color: '#94a3b8',
                                            fontSize: '14px',
                                            opacity: 0.8
                                        }}>
                                            {testimonial.title}
                                        </p>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    marginBottom: '20px',
                                    gap: '2px'
                                }}>
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <span key={i} style={{
                                            color: '#fbbf24',
                                            fontSize: '18px',
                                            filter: 'drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3))'
                                        }}>
                                            ★
                                        </span>
                                    ))}
                                </div>

                                <p style={{
                                    fontSize: '16px',
                                    lineHeight: 1.8,
                                    fontStyle: 'italic',
                                    color: '#e2e8f0'
                                }}>
                                    "{testimonial.text}"
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div style={{
                padding: '100px 0',
                background: '#0B1426'
            }}>
                <div style={{
                    maxWidth: '900px',
                    margin: '0 auto',
                    padding: '0 24px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{
                            fontSize: 'clamp(2.5rem, 4vw, 4rem)',
                            fontWeight: '800',
                            color: '#ffffff',
                            letterSpacing: '-0.02em'
                        }}>
                            שאלות נפוצות
                        </h2>
                    </div>

                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            style={{
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '20px',
                                marginBottom: '20px',
                                overflow: 'hidden',
                                background: 'rgba(255, 255, 255, 0.02)',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div
                                onClick={() => setActiveAccordion(activeAccordion === index ? null : index)}
                                style={{
                                    padding: '28px 32px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '18px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    color: '#ffffff',
                                    transition: 'background 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                {faq.question}
                                <span style={{
                                    transform: activeAccordion === index ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease',
                                    color: '#3b82f6',
                                    fontSize: '20px'
                                }}>
                                    ▼
                                </span>
                            </div>
                            <div style={{
                                maxHeight: activeAccordion === index ? '300px' : '0',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{
                                    padding: '0 32px 28px',
                                    fontSize: '16px',
                                    lineHeight: 1.8,
                                    color: '#94a3b8'
                                }}>
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Final CTA Section */}
            <div style={{
                padding: '100px 0',
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
                    maxWidth: '800px',
                    margin: '0 auto',
                    padding: '0 24px',
                    position: 'relative',
                    zIndex: 2
                }}>
                    <h2 style={{
                        fontSize: 'clamp(2.8rem, 4vw, 4.5rem)',
                        fontWeight: '800',
                        marginBottom: '28px',
                        background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1
                    }}>
                        מוכנים להפוך למטפלים הכי יעילים?
                    </h2>

                    <p style={{
                        fontSize: '22px',
                        color: '#94a3b8',
                        marginBottom: '48px',
                        lineHeight: 1.6,
                        maxWidth: '600px',
                        margin: '0 auto 48px'
                    }}>
                        הצטרפו לאלפי המטפלים שכבר חוסכים זמן ומרוויחים יותר
                    </p>

                    <div style={{
                        display: 'flex',
                        gap: '24px',
                        justifyContent: 'center',
                        marginBottom: '48px',
                        flexDirection: window.innerWidth > 480 ? 'row' : 'column'
                    }}>
                        <button
                            onClick={() => navigate('/register')}
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                color: 'white',
                                padding: '20px 40px',
                                fontSize: '18px',
                                fontWeight: '700',
                                borderRadius: '16px',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
                                letterSpacing: '0.5px'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-3px)';
                                e.target.style.boxShadow = '0 16px 48px rgba(59, 130, 246, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.4)';
                            }}
                        >
                            התחילו 14 יום חינם
                        </button>

                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                color: 'white',
                                border: '2px solid rgba(255, 255, 255, 0.25)',
                                background: 'rgba(255, 255, 255, 0.08)',
                                padding: '20px 36px',
                                fontSize: '16px',
                                fontWeight: '600',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                backdropFilter: 'blur(10px)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            התחברו
                        </button>

                        <button style={{
                            color: 'white',
                            border: '2px solid rgba(255, 255, 255, 0.25)',
                            background: 'rgba(255, 255, 255, 0.08)',
                            padding: '20px 36px',
                            fontSize: '16px',
                            fontWeight: '600',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)'
                        }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                                e.target.style.transform = 'translateY(0)';
                            }}>
                            דברו איתנו
                        </button>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '40px',
                        flexWrap: 'wrap',
                        color: '#94a3b8',
                        fontSize: '15px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '20px' }}>💳</span>
                            <span>ללא כרטיס אשראי</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '20px' }}>✅</span>
                            <span>תמיכה בעברית 24/7</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '20px' }}>🔒</span>
                            <span>מאובטח לחלוטין</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Professional Footer */}
            <ProfessionalFooter />

            {/* Cookie Consent Popup */}
            {/* <CookieConsentPopup /> */}
        </div>
    );
};

export default PremiumHomePage;