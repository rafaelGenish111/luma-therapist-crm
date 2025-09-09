import React from 'react';
import { Box } from '@mui/material';

const Logo = ({
    height = 40,
    width = 'auto',
    variant = 'default', // 'default', 'small', 'large', 'footer'
    sx = {}
}) => {
    const getDimensions = () => {
        switch (variant) {
            case 'small':
                return { height: 144, width: 'auto' };
            case 'large':
                return { height: 256, width: 'auto' };
            case 'footer':
                return { height: 160, width: 'auto' };
            default:
                return { height: 176, width: 'auto' };
        }
    };

    const dimensions = getDimensions();

    return (
        <Box
            component="img"
            src="/images/luma_logo.png"
            alt="Luma Logo"
            sx={{
                ...dimensions,
                objectFit: 'contain',
                filter: variant === 'footer' ? 'brightness(0.8)' : 'none',
                ...sx
            }}
        />
    );
};

export default Logo;
