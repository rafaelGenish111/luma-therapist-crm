import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PublicNavigation from '../components/common/PublicNavigation';
import Footer from '../components/common/Footer';

const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    React.useEffect(() => {
        if (user) {
            const role = user.role || user.userType;
            console.log('HomePage useEffect - User:', user);
            console.log('HomePage useEffect - Role:', role);
            if (role === 'admin') {
                console.log('HomePage useEffect - Navigating to /admin');
                navigate('/admin', { replace: true });
            } else {
                console.log('HomePage useEffect - Navigating to /dashboard');
                navigate('/dashboard', { replace: true });
            }
        }
    }, [user, navigate]);

    const features = [
        {
            title: 'CRM מלא',
            description: 'ניהול לקוחות, פגישות ותשלומים במקום אחד',
            icon: '👥'
        },
        {
            title: 'אתרים אישיים',
            description: 'בונה אתרים מותאם אישית למטפלות',
            icon: '🌐'
        },
        {
            title: 'לוח זמנים חכם',
            description: 'ניהול פגישות עם תזכורות אוטומטיות',
            icon: '📅'
        },
        {
            title: 'תשלומים',
            description: 'אינטגרציה עם Stripe לתשלומים מאובטחים',
            icon: '💳'
        }
    ];

    return (
        <div dir="rtl" style={{
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            overflowX: 'hidden',
            width: '100%'
        }}>
            <PublicNavigation />

            {/* Hero Section */}
            <section className="hero" id="home" style={{
                background: 'radial-gradient(1200px 600px at 70% -10%, #F3FBFE 0%, #EAF7FB 45%, #FFFFFF 100%)',
                padding: '96px 0 64px',
                textAlign: 'center',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 20px',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 8vw, 4rem)',
                        fontWeight: '800',
                        margin: '0 0 16px 0',
                        lineHeight: '1.2',
                        color: '#0A3D62',
                        letterSpacing: '0.4px'
                    }}>
                        Luma
                    </h1>
                    <p style={{
                        fontSize: 'clamp(1rem, 4vw, 1.5rem)',
                        margin: '14px auto 26px',
                        lineHeight: '1.4',
                        color: '#5B6B7A',
                        maxWidth: '800px'
                    }}>
                        פתרונות משרד למטפלות ומטפלים
                    </p>
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            className="btn-cta"
                            onClick={() => navigate('/register')}
                            style={{ cursor: 'pointer' }}
                        >
                            פתח/י חשבון חינם
                        </button>
                        <a
                            className="btn-cta"
                            href="#features"
                            style={{
                                background: "#fff",
                                color: "#0A3D62",
                                boxShadow: "0 6px 16px rgba(13,27,42,.08)",
                                border: "1px solid #E8EEF3"
                            }}
                        >
                            צפו בפיצ'רים
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features" id="features" style={{
                background: '#F7FBFD',
                padding: '56px 0',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 20px',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
                        marginBottom: '32px',
                        color: '#0D1B2A',
                        fontWeight: '800',
                        lineHeight: '1.3'
                    }}>
                        תכונות עיקריות
                    </h2>

                    <div className="grid" style={{
                        display: 'grid',
                        gap: '22px',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        marginTop: '32px',
                        width: '100%'
                    }}>
                        {features.map((feature, index) => (
                            <article key={index} className="feature-card" style={{
                                background: '#FFFFFF',
                                border: '1px solid #E8EEF3',
                                borderRadius: '22px',
                                boxShadow: '0 10px 30px rgba(13, 27, 42, 0.08)',
                                padding: '22px 20px',
                                textAlign: 'center',
                                transition: 'transform .12s ease, box-shadow .2s ease',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}>
                                <div className="feature-icon" style={{
                                    width: '64px',
                                    height: '64px',
                                    margin: '2px auto 12px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(145deg, #0BB5CF, #19C7DC)',
                                    display: 'grid',
                                    placeItems: 'center',
                                    color: '#fff',
                                    fontSize: '28px',
                                    fontWeight: '700'
                                }}>
                                    {feature.icon}
                                </div>
                                <div className="feature-title" style={{
                                    fontWeight: '700',
                                    color: '#0D1B2A',
                                    marginBottom: '6px',
                                    fontSize: 'clamp(1.1rem, 4vw, 1.3rem)',
                                    lineHeight: '1.3'
                                }}>
                                    {feature.title}
                                </div>
                                <div className="feature-desc" style={{
                                    color: '#5B6B7A',
                                    lineHeight: '1.5',
                                    fontSize: 'clamp(0.9rem, 3vw, 1rem)'
                                }}>
                                    {feature.description}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                background: '#f8f9fa',
                padding: '40px 16px',
                textAlign: 'center',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    padding: '0 16px',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <h3 style={{
                        fontSize: 'clamp(1.3rem, 6vw, 2rem)',
                        marginBottom: '16px',
                        color: '#0A3D62',
                        fontWeight: '600',
                        lineHeight: '1.3'
                    }}>
                        מוכנים להתחיל?
                    </h3>
                    <p style={{
                        fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                        color: '#5B6B7A',
                        marginBottom: '24px',
                        lineHeight: '1.5'
                    }}>
                        הצטרפו למאות מטפלות שכבר משתמשות בפלטפורמה שלנו
                    </p>
                    <button
                        onClick={() => navigate('/register')}
                        style={{
                            background: 'linear-gradient(135deg, #0BB5CF 0%, #19C7DC 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontSize: 'clamp(1rem, 3vw, 1.1rem)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'transform 0.3s ease',
                            width: '100%',
                            maxWidth: '300px',
                            minHeight: '48px'
                        }}
                    >
                        הרשמה חינם
                    </button>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default HomePage; 