import React from 'react';
import { Button, Box } from '@mui/material';
import { brand, shadows, transitions } from '../../theme/brandTokens';

const CTAButton = ({
    children,
    variant = 'contained',
    size = 'large',
    fullWidth = false,
    onClick,
    disabled = false,
    startIcon,
    endIcon,
    sx = {},
    ...props
}) => {
    const getButtonStyles = () => {
        const baseStyles = {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: size === 'large' ? '1.125rem' : size === 'medium' ? '1rem' : '0.875rem',
            padding: size === 'large' ? '12px 32px' : size === 'medium' ? '10px 24px' : '8px 20px',
            transition: transitions.normal,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                transition: 'left 0.5s',
            },
            '&:hover::before': {
                left: '100%',
            },
        };

        if (variant === 'contained') {
            return {
                ...baseStyles,
                backgroundColor: brand.primary,
                color: '#FFFFFF',
                boxShadow: shadows.small,
                '&:hover': {
                    backgroundColor: brand.primaryDark,
                    boxShadow: shadows.medium,
                    transform: 'translateY(-2px)',
                },
                '&:active': {
                    transform: 'translateY(0)',
                },
                '&:disabled': {
                    backgroundColor: brand.textMuted,
                    color: '#FFFFFF',
                    boxShadow: 'none',
                    transform: 'none',
                },
            };
        }

        if (variant === 'outlined') {
            return {
                ...baseStyles,
                border: `2px solid ${brand.primary}`,
                color: brand.primary,
                backgroundColor: 'transparent',
                '&:hover': {
                    backgroundColor: brand.primarySoft,
                    borderColor: brand.primaryDark,
                    transform: 'translateY(-1px)',
                },
                '&:disabled': {
                    borderColor: brand.textMuted,
                    color: brand.textMuted,
                    backgroundColor: 'transparent',
                    transform: 'none',
                },
            };
        }

        if (variant === 'gradient') {
            return {
                ...baseStyles,
                background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 100%)`,
                color: '#FFFFFF',
                boxShadow: shadows.medium,
                '&:hover': {
                    background: `linear-gradient(135deg, ${brand.primaryDark} 0%, ${brand.primary} 100%)`,
                    boxShadow: shadows.large,
                    transform: 'translateY(-3px)',
                },
                '&:disabled': {
                    background: `linear-gradient(135deg, ${brand.textMuted} 0%, ${brand.textSecondary} 100%)`,
                    color: '#FFFFFF',
                    boxShadow: 'none',
                    transform: 'none',
                },
            };
        }

        return baseStyles;
    };

    return (
        <Box sx={{ display: 'inline-block' }}>
            <Button
                variant={variant === 'gradient' ? 'contained' : variant}
                size={size}
                fullWidth={fullWidth}
                onClick={onClick}
                disabled={disabled}
                startIcon={startIcon}
                endIcon={endIcon}
                sx={{
                    ...getButtonStyles(),
                    ...sx,
                }}
                {...props}
            >
                {children}
            </Button>
        </Box>
    );
};

export default CTAButton;


