import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { professionalTokens } from '../../theme/professionalTokens';

const UnifiedHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // בדיקת מובייל
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const navigationItems = [
        { key: 'about', label: 'אודות', path: '/about' },
        { key: 'services', label: 'תוכניות', path: '/services' },
        { key: 'contact', label: 'צור קשר', path: '/contact' }
    ];

    const handleNavigation = (path) => {
        navigate(path);
        setIsHeaderExpanded(false);
        setMobileMenuOpen(false);
    };

    const handleHeaderToggle = () => {
        if (isAnimating) return;

        setIsAnimating(true);
        setIsHeaderExpanded(!isHeaderExpanded);

        setTimeout(() => {
            setIsAnimating(false);
        }, 600);
    };

    // במובייל - רק לחיצה מפתחת/סוגרת
    const handleMobileToggle = () => {
        if (isMobile) {
            handleHeaderToggle();
        }
    };

    const isActiveRoute = (path) => {
        return location.pathname === path;
    };

    return (
        <>
            <div style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}>
                <div
                    style={{
                        background: professionalTokens.header.background,
                        backdropFilter: professionalTokens.header.backdropFilter,
                        borderRadius: professionalTokens.borderRadius.full,
                        border: professionalTokens.header.border,
                        cursor: isMobile ? 'default' : 'pointer',
                        transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        boxShadow: professionalTokens.header.boxShadow,
                        overflow: 'hidden',
                        position: 'relative',
                        minWidth: isMobile ? '140px' : (isHeaderExpanded ? '500px' : '160px'),
                        maxWidth: isMobile ? '140px' : (isHeaderExpanded ? '500px' : '160px'),
                        height: isMobile ? '50px' : '60px',
                        padding: isMobile ? '8px 16px' : (isHeaderExpanded ? '12px 24px' : '12px 24px'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                    onClick={!isMobile ? handleHeaderToggle : undefined}
                    onMouseEnter={() => {
                        if (!isMobile && !isAnimating) {
                            setIsHeaderExpanded(true);
                        }
                    }}
                    onMouseLeave={() => {
                        if (!isMobile && !isAnimating) {
                            setIsHeaderExpanded(false);
                        }
                    }}
                >
                    {/* Logo Section - Mobile: Always visible on left, Desktop: Center when closed */}
                    {isMobile ? (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/');
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: professionalTokens.spacing.sm,
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: professionalTokens.borderRadius.md,
                                background: `linear-gradient(135deg, ${professionalTokens.colors.primary}, ${professionalTokens.colors.primaryLight})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: professionalTokens.typography.fontWeight.extrabold
                            }}>
                                <img
                                    src="/images/luma_logo.png"
                                    alt="Luma Logo"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div style={{
                                    display: 'none',
                                    width: '100%',
                                    height: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: professionalTokens.colors.headerText,
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}>
                                    L
                                </div>
                            </div>
                            <span style={{
                                fontSize: '16px',
                                fontWeight: professionalTokens.typography.fontWeight.bold,
                                color: professionalTokens.colors.headerText
                            }}>
                                LUMA
                            </span>
                        </div>
                    ) : (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/');
                            }}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: professionalTokens.spacing.sm,
                                transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                opacity: isHeaderExpanded ? 0 : 1,
                                transform: isHeaderExpanded ? 'translate(-50%, -50%) scale(0.8)' : 'translate(-50%, -50%) scale(1)',
                                cursor: 'pointer',
                                zIndex: 1
                            }}
                        >
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: professionalTokens.borderRadius.md,
                                background: `linear-gradient(135deg, ${professionalTokens.colors.primary}, ${professionalTokens.colors.primaryLight})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: professionalTokens.typography.fontWeight.extrabold,
                                transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                            }}>
                                <img
                                    src="/images/luma_logo.png"
                                    alt="Luma Logo"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div style={{
                                    display: 'none',
                                    width: '100%',
                                    height: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: professionalTokens.colors.headerText,
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}>
                                    L
                                </div>
                            </div>
                            <span style={{
                                fontSize: '18px',
                                fontWeight: professionalTokens.typography.fontWeight.bold,
                                color: professionalTokens.colors.headerText,
                                transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                            }}>
                                LUMA
                            </span>
                        </div>
                    )}

                    {/* Hamburger Menu Button for Mobile */}
                    {isMobile && (
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <div style={{
                                width: '20px',
                                height: '2px',
                                background: professionalTokens.colors.headerText,
                                borderRadius: '2px',
                                transition: 'all 0.3s ease'
                            }} />
                            <div style={{
                                width: '20px',
                                height: '2px',
                                background: professionalTokens.colors.headerText,
                                borderRadius: '2px',
                                transition: 'all 0.3s ease'
                            }} />
                            <div style={{
                                width: '20px',
                                height: '2px',
                                background: professionalTokens.colors.headerText,
                                borderRadius: '2px',
                                transition: 'all 0.3s ease'
                            }} />
                        </button>
                    )}

                    {/* Navigation Section - Desktop Only: Appears on Expansion */}
                    {!isMobile && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            height: '100%',
                            transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            opacity: isHeaderExpanded ? 1 : 0,
                            transform: isHeaderExpanded ? 'translateY(0)' : 'translateY(-10px)',
                            padding: isHeaderExpanded ? '0 16px' : '0'
                        }}>

                            {/* Logo in Expanded State */}
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/');
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: professionalTokens.spacing.sm,
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    width: isMobile ? '28px' : '32px',
                                    height: isMobile ? '28px' : '32px',
                                    borderRadius: professionalTokens.borderRadius.md,
                                    background: `linear-gradient(135deg, ${professionalTokens.colors.primary}, ${professionalTokens.colors.primaryLight})`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: professionalTokens.typography.fontWeight.extrabold
                                }}>
                                    <img
                                        src="/images/luma_logo.png"
                                        alt="Luma Logo"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain'
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <div style={{
                                        display: 'none',
                                        width: '100%',
                                        height: '100%',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: professionalTokens.colors.headerText,
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                    }}>
                                        L
                                    </div>
                                </div>
                                {!isMobile && (
                                    <span style={{
                                        fontSize: '16px',
                                        fontWeight: professionalTokens.typography.fontWeight.bold,
                                        color: professionalTokens.colors.headerText
                                    }}>
                                        LUMA
                                    </span>
                                )}
                            </div>

                            {/* Navigation Items - Desktop Only */}
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center',
                                flexWrap: 'nowrap'
                            }}>
                                {navigationItems.map((item, index) => (
                                    <button
                                        key={item.key}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNavigation(item.path);
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: isActiveRoute(item.path)
                                                ? professionalTokens.colors.primaryLight
                                                : 'rgba(255, 255, 255, 0.8)',
                                            fontSize: '14px',
                                            fontWeight: isActiveRoute(item.path)
                                                ? professionalTokens.typography.fontWeight.semibold
                                                : professionalTokens.typography.fontWeight.medium,
                                            cursor: 'pointer',
                                            padding: '8px 16px',
                                            borderRadius: professionalTokens.borderRadius.md,
                                            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActiveRoute(item.path)) {
                                                e.target.style.color = professionalTokens.colors.headerText;
                                                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                                e.target.style.transform = 'translateY(-1px)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActiveRoute(item.path)) {
                                                e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                                                e.target.style.background = 'transparent';
                                                e.target.style.transform = 'translateY(0)';
                                            }
                                        }}
                                    >
                                        {item.label}
                                        {isActiveRoute(item.path) && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '0',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                width: '20px',
                                                height: '2px',
                                                background: professionalTokens.colors.primaryLight,
                                                borderRadius: '1px'
                                            }} />
                                        )}
                                    </button>
                                ))}

                                {/* Login Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNavigation('/login');
                                    }}
                                    style={{
                                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                        border: 'none',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: professionalTokens.typography.fontWeight.semibold,
                                        cursor: 'pointer',
                                        padding: '10px 20px',
                                        borderRadius: professionalTokens.borderRadius.md,
                                        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                                        marginLeft: '16px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                                    }}
                                >
                                    התחברו
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            {isMobile && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setMobileMenuOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 999,
                            opacity: mobileMenuOpen ? 1 : 0,
                            visibility: mobileMenuOpen ? 'visible' : 'hidden',
                            transition: 'opacity 0.3s ease, visibility 0.3s ease'
                        }}
                    />

                    {/* Menu Drawer */}
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        width: '280px',
                        height: '100vh',
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        zIndex: 1000,
                        transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
                        transition: 'transform 0.3s ease',
                        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '24px'
                    }}>
                        {/* Close Button */}
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                                alignSelf: 'flex-end',
                                background: 'transparent',
                                border: 'none',
                                color: professionalTokens.colors.headerText,
                                fontSize: '24px',
                                cursor: 'pointer',
                                padding: '8px',
                                marginBottom: '32px'
                            }}
                        >
                            ✕
                        </button>

                        {/* Logo */}
                        <div
                            onClick={(e) => {
                                handleNavigation('/');
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: professionalTokens.spacing.sm,
                                cursor: 'pointer',
                                marginBottom: '40px',
                                paddingBottom: '24px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: professionalTokens.borderRadius.md,
                                background: `linear-gradient(135deg, ${professionalTokens.colors.primary}, ${professionalTokens.colors.primaryLight})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: professionalTokens.typography.fontWeight.extrabold
                            }}>
                                <img
                                    src="/images/luma_logo.png"
                                    alt="Luma Logo"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>
                            <span style={{
                                fontSize: '20px',
                                fontWeight: professionalTokens.typography.fontWeight.bold,
                                color: professionalTokens.colors.headerText
                            }}>
                                LUMA
                            </span>
                        </div>

                        {/* Navigation Items */}
                        <nav style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            marginBottom: '32px'
                        }}>
                            {navigationItems.map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => handleNavigation(item.path)}
                                    style={{
                                        background: isActiveRoute(item.path)
                                            ? 'rgba(59, 130, 246, 0.15)'
                                            : 'transparent',
                                        border: 'none',
                                        color: isActiveRoute(item.path)
                                            ? professionalTokens.colors.primaryLight
                                            : professionalTokens.colors.headerText,
                                        fontSize: '16px',
                                        fontWeight: isActiveRoute(item.path)
                                            ? professionalTokens.typography.fontWeight.semibold
                                            : professionalTokens.typography.fontWeight.medium,
                                        cursor: 'pointer',
                                        padding: '16px 20px',
                                        borderRadius: professionalTokens.borderRadius.md,
                                        transition: 'all 0.3s ease',
                                        textAlign: 'right',
                                        width: '100%'
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        {/* Login Button */}
                        <button
                            onClick={() => handleNavigation('/login')}
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                border: 'none',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: professionalTokens.typography.fontWeight.semibold,
                                cursor: 'pointer',
                                padding: '16px 24px',
                                borderRadius: professionalTokens.borderRadius.md,
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                                width: '100%'
                            }}
                        >
                            התחברו
                        </button>
                    </div>
                </>
            )}
        </>
    );
};

export default UnifiedHeader;
