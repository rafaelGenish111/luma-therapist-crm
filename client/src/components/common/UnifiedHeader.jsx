import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { professionalTokens } from '../../theme/professionalTokens';

const UnifiedHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const navigationItems = [
        { key: 'about', label: 'אודות', path: '/about' },
        { key: 'services', label: 'תוכניות', path: '/services' },
        { key: 'contact', label: 'צור קשר', path: '/contact' }
    ];

    const handleNavigation = (path) => {
        navigate(path);
        setIsHeaderExpanded(false);
    };

    const handleHeaderToggle = () => {
        if (isAnimating) return;

        setIsAnimating(true);
        setIsHeaderExpanded(!isHeaderExpanded);

        setTimeout(() => {
            setIsAnimating(false);
        }, 600);
    };

    const isActiveRoute = (path) => {
        return location.pathname === path;
    };

    return (
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
                    cursor: 'pointer',
                    transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    boxShadow: professionalTokens.header.boxShadow,
                    overflow: 'hidden',
                    position: 'relative',
                    minWidth: isHeaderExpanded
                        ? (window.innerWidth > 768 ? '500px' : '90vw')
                        : (window.innerWidth > 768 ? '160px' : '50px'),
                    maxWidth: isHeaderExpanded
                        ? (window.innerWidth > 768 ? '500px' : '90vw')
                        : (window.innerWidth > 768 ? '160px' : '50px'),
                    height: isHeaderExpanded
                        ? (window.innerWidth > 768 ? '60px' : '45px')
                        : (window.innerWidth > 768 ? '60px' : '45px'),
                    padding: isHeaderExpanded
                        ? (window.innerWidth > 768 ? '12px 24px' : '6px 12px')
                        : (window.innerWidth > 768 ? '12px 24px' : '6px 12px')
                }}
                onClick={handleHeaderToggle}
                onMouseEnter={() => {
                    if (!isAnimating) {
                        setIsHeaderExpanded(true);
                    }
                }}
                onMouseLeave={() => {
                    if (!isAnimating) {
                        setIsHeaderExpanded(false);
                    }
                }}
            >
                {/* Logo Section - Always Visible */}
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
                        cursor: 'pointer'
                    }}
                >
                    <div style={{
                        width: window.innerWidth > 768 ? '36px' : '28px',
                        height: window.innerWidth > 768 ? '36px' : '28px',
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

                {/* Navigation Section - Appears on Expansion */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    height: '100%',
                    transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    opacity: isHeaderExpanded ? 1 : 0,
                    transform: isHeaderExpanded ? 'translateY(0)' : 'translateY(-10px)'
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
                            transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            transform: isHeaderExpanded ? 'scale(1)' : 'scale(0.8)',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{
                            width: window.innerWidth > 768 ? '36px' : '24px',
                            height: window.innerWidth > 768 ? '36px' : '24px',
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
                        {window.innerWidth > 768 && (
                            <span style={{
                                fontSize: '18px',
                                fontWeight: professionalTokens.typography.fontWeight.bold,
                                color: professionalTokens.colors.headerText
                            }}>
                                LUMA
                            </span>
                        )}
                    </div>

                    {/* Navigation Items */}
                    <div style={{
                        display: 'flex',
                        gap: window.innerWidth > 768 ? professionalTokens.spacing.lg : '2px',
                        alignItems: 'center',
                        flexWrap: 'nowrap',
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitScrollbar: { display: 'none' }
                    }}
                        className="no-scrollbar">
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
                                    fontSize: window.innerWidth > 768 ? '14px' : '9px',
                                    fontWeight: isActiveRoute(item.path)
                                        ? professionalTokens.typography.fontWeight.semibold
                                        : professionalTokens.typography.fontWeight.medium,
                                    cursor: 'pointer',
                                    padding: window.innerWidth > 768 ? '8px 16px' : '3px 6px',
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnifiedHeader;
