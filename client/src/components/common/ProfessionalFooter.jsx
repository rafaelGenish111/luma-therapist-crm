import React from 'react';
import { useNavigate } from 'react-router-dom';
import { professionalTokens } from '../../theme/professionalTokens';

const ProfessionalFooter = () => {
    const navigate = useNavigate();

    const footerSections = [
        {
            title: 'ניווט',
            links: [
                { text: 'בית', path: '/' },
                { text: 'אודות', path: '/about' },
                { text: 'שירותים', path: '/services' },
                { text: 'צור קשר', path: '/contact' }
            ]
        },
        {
            title: 'מוצר',
            links: [
                { text: 'שירותים', path: '/services' },
                { text: 'מחירים', path: '/pricing' },
                { text: 'מדריכים', path: '/guides' },
                { text: 'עדכונים', path: '/updates' }
            ]
        },
        {
            title: 'תמיכה',
            links: [
                { text: 'מרכז עזרה', path: '/help' },
                { text: 'צור קשר', path: '/contact' },
                { text: 'הדרכות', path: '/tutorials' },
                { text: 'סטטוס המערכת', path: '/status' }
            ]
        },
        {
            title: 'חברה',
            links: [
                { text: 'אודותינו', path: '/about' },
                { text: 'הבלוג', path: '/blog' },
                { text: 'משרות', path: '/careers' },
                { text: 'עיתונות', path: '/press' }
            ]
        }
    ];

    const socialLinks = [
        { name: 'Facebook', icon: '📘', url: '#' },
        { name: 'LinkedIn', icon: '💼', url: '#' },
        { name: 'Twitter', icon: '🐦', url: '#' },
        { name: 'Instagram', icon: '📷', url: '#' }
    ];

    return (
        <footer style={{
            background: professionalTokens.colors.primary,
            color: professionalTokens.colors.headerText,
            padding: `${professionalTokens.spacing.xxxl} 0 ${professionalTokens.spacing.lg} 0`,
            marginTop: 'auto'
        }}>
            <div style={{
                maxWidth: professionalTokens.container.maxWidth,
                margin: '0 auto',
                padding: professionalTokens.container.padding
            }}>
                {/* Main Footer Content */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: window.innerWidth > 992 ? 'repeat(4, 1fr)' :
                        window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
                    gap: professionalTokens.spacing.lg,
                    marginBottom: professionalTokens.spacing.xxxl
                }}>
                    {footerSections.map((section, index) => (
                        <div key={index}>
                            <h3 style={{
                                fontSize: professionalTokens.typography.fontSize.h4,
                                fontWeight: professionalTokens.typography.fontWeight.bold,
                                marginBottom: professionalTokens.spacing.md,
                                color: professionalTokens.colors.headerText
                            }}>
                                {section.title}
                            </h3>
                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0
                            }}>
                                {section.links.map((link, linkIndex) => (
                                    <li key={linkIndex} style={{ marginBottom: professionalTokens.spacing.sm }}>
                                        <a
                                            href={link.path}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigate(link.path);
                                            }}
                                            style={{
                                                color: 'rgba(255, 255, 255, 0.8)',
                                                textDecoration: 'none',
                                                fontSize: professionalTokens.typography.fontSize.body,
                                                lineHeight: professionalTokens.typography.lineHeight.normal,
                                                transition: professionalTokens.transitions.normal,
                                                display: 'block',
                                                padding: '4px 0'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.color = professionalTokens.colors.headerText;
                                                e.target.style.transform = 'translateX(-4px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                                                e.target.style.transform = 'translateX(0)';
                                            }}
                                        >
                                            {link.text}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Footer */}
                <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    paddingTop: professionalTokens.spacing.lg,
                    display: 'flex',
                    flexDirection: window.innerWidth > 768 ? 'row' : 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: professionalTokens.spacing.lg
                }}>
                    {/* Logo and Copyright */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: professionalTokens.spacing.sm
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: professionalTokens.borderRadius.md,
                            background: `linear-gradient(135deg, ${professionalTokens.colors.headerText}, rgba(255, 255, 255, 0.8))`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: professionalTokens.typography.fontWeight.bold,
                            color: professionalTokens.colors.primary
                        }}>
                            <img src="/images/luma_logo.png" alt="Luma Logo" style={{ width: '100%', height: '100%' }} />
                        </div>
                        <div>
                            <div style={{
                                fontSize: professionalTokens.typography.fontSize.body,
                                fontWeight: professionalTokens.typography.fontWeight.bold,
                                color: professionalTokens.colors.headerText
                            }}>
                                LUMA
                            </div>
                            <div style={{
                                fontSize: professionalTokens.typography.fontSize.small,
                                color: 'rgba(255, 255, 255, 0.7)'
                            }}>
                                © 2024 כל הזכויות שמורות
                            </div>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div style={{
                        display: 'flex',
                        gap: professionalTokens.spacing.md
                    }}>
                        {socialLinks.map((social, index) => (
                            <a
                                key={index}
                                href={social.url}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '18px',
                                    textDecoration: 'none',
                                    transition: professionalTokens.transitions.normal,
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                }}
                            >
                                {social.icon}
                            </a>
                        ))}
                    </div>

                    {/* Legal Links */}
                    <div style={{
                        display: 'flex',
                        gap: professionalTokens.spacing.lg,
                        fontSize: professionalTokens.typography.fontSize.small
                    }}>
                        <a
                            href="/terms"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/terms');
                            }}
                            style={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                textDecoration: 'none',
                                transition: professionalTokens.transitions.normal
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.color = professionalTokens.colors.headerText;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.color = 'rgba(255, 255, 255, 0.7)';
                            }}
                        >
                            תנאי שימוש
                        </a>
                        <a
                            href="/privacy"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/privacy');
                            }}
                            style={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                textDecoration: 'none',
                                transition: professionalTokens.transitions.normal
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.color = professionalTokens.colors.headerText;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.color = 'rgba(255, 255, 255, 0.7)';
                            }}
                        >
                            מדיניות פרטיות
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default ProfessionalFooter;
