import React from 'react';
import { Box, Typography } from '@mui/material';
import Logo from './Logo';

const Copyright = ({
    variant = 'default', // 'default', 'minimal', 'with-logo'
    sx = {}
}) => {
    const currentYear = new Date().getFullYear();

    const getStyle = () => {
        switch (variant) {
            case 'minimal':
                return {
                    textAlign: 'center',
                    py: 1,
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                };
            case 'with-logo':
                return {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    py: 2,
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                };
            default:
                return {
                    textAlign: 'center',
                    py: 2,
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                };
        }
    };

    if (variant === 'with-logo') {
        return (
            <Box sx={{ ...getStyle(), ...sx }}>
                <Logo variant="footer" />
                <Typography variant="body2">
                    © {currentYear} Luma - כל הזכויות שמורות
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ ...getStyle(), ...sx }}>
            <Typography variant="body2">
                © {currentYear} Luma - כל הזכויות שמורות
            </Typography>
        </Box>
    );
};

export default Copyright;
