import React, { useState, useEffect } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { brand } from '../../theme/brandTokens';

const SessionIndicator = () => {
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!user) {
            setTimeLeft(null);
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const lastActivity = localStorage.getItem('lastActivity') || now;
            const timeSinceActivity = now - parseInt(lastActivity);
            const sessionTimeout = 5 * 60 * 1000; // 5 דקות
            const remaining = Math.max(0, sessionTimeout - timeSinceActivity);

            if (remaining > 0) {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                setTimeLeft({ minutes, seconds });
            } else {
                setTimeLeft({ minutes: 0, seconds: 0 });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [user]);

    if (!user || !timeLeft) return null;

    const getColor = () => {
        const totalSeconds = timeLeft.minutes * 60 + timeLeft.seconds;
        if (totalSeconds > 240) return brand.success; // יותר מ-4 דקות
        if (totalSeconds > 60) return brand.warning; // יותר מדקה
        return brand.error; // פחות מדקה
    };

    const formatTime = () => {
        if (timeLeft.minutes > 0) {
            return `${timeLeft.minutes}:${timeLeft.seconds.toString().padStart(2, '0')}`;
        }
        return `${timeLeft.seconds}s`;
    };

    return (
        <Tooltip title="זמן פעלה נותר" placement="left">
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 20,
                    left: 20,
                    zIndex: 1000,
                    bgcolor: brand.surface,
                    border: `2px solid ${getColor()}`,
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                    boxShadow: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                }}
            >
                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: getColor(),
                        animation: timeLeft.minutes === 0 && timeLeft.seconds <= 30 ? 'pulse 1s infinite' : 'none',
                        '@keyframes pulse': {
                            '0%': { opacity: 1 },
                            '50%': { opacity: 0.5 },
                            '100%': { opacity: 1 }
                        }
                    }}
                />
                <Typography
                    variant="caption"
                    sx={{
                        color: brand.text,
                        fontWeight: 600,
                        fontSize: '0.75rem'
                    }}
                >
                    {formatTime()}
                </Typography>
            </Box>
        </Tooltip>
    );
};

export default SessionIndicator;
