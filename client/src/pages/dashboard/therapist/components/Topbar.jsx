import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Tooltip, Avatar, useTheme, useMediaQuery } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import Logo from '../../../../components/common/Logo';

const Topbar = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <AppBar
            position="static"
            color="default"
            elevation={1}
            sx={{
                zIndex: 1201,
                width: '100%',
                '@media (max-width: 768px)': {
                    paddingLeft: '60px' // Space for hamburger menu
                }
            }}
        >
            <Toolbar sx={{
                justifyContent: 'space-between',
                width: '100%',
                minWidth: 0,
                '@media (max-width: 768px)': {
                    padding: '8px 16px'
                }
            }}>
                <Box display="flex" alignItems="center" gap={2} flex={1} sx={{ minWidth: 0 }}>
                    {user?.profileImage ? (
                        <Avatar
                            src={user.profileImage.startsWith('/uploads/') ?
                                `http://localhost:5000${user.profileImage}` :
                                user.profileImage}
                            alt={user.fullName || 'תמונת מטפלת'}
                            sx={{
                                width: isMobile ? 35 : 45,
                                height: isMobile ? 35 : 45,
                                border: '2px solid',
                                borderColor: 'primary.main'
                            }}
                        />
                    ) : (
                        <Logo variant="small" />
                    )}
                    <Typography
                        variant={isMobile ? "body1" : "h6"}
                        color="primary"
                        sx={{
                            '@media (max-width: 480px)': {
                                fontSize: '0.9rem'
                            }
                        }}
                    >
                        {isMobile
                            ? (user?.fullName ? `${user.fullName}` : 'לוח בקרה')
                            : (user?.fullName ? `${user.fullName} - לוח בקרה` : 'לוח בקרה - מטפלת')
                        }
                    </Typography>
                </Box>
                <Box>
                    <Tooltip title="מדריך התחלה מהירה" arrow>
                        <IconButton
                            color="primary"
                            onClick={() => navigate('/help/quick-start')}
                            aria-label="עזרה"
                            sx={{
                                '@media (max-width: 768px)': {
                                    padding: '8px'
                                }
                            }}
                        >
                            <HelpOutlineIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Topbar; 