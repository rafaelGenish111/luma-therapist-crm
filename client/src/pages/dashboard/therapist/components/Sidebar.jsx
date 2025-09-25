import React, { useState } from 'react';
import { Box, List, ListItem, ListItemText, Button, Divider, IconButton, Drawer, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import EmailIcon from '@mui/icons-material/Email';
import { useAuth } from '../../../../context/AuthContext';
import FeatureGate from '../../../../components/FeatureGate';
import Logo from '../../../../components/common/Logo';

const links = [
    { to: '/dashboard', label: 'לוח בקרה', title: 'סקירה כללית של הפעילות ומדדים' },
    { to: '/dashboard/appointments', label: 'תורים', title: 'ניהול תורים ופגישות' },
    { to: '/dashboard/clients', label: 'לקוחות', title: 'ניהול פרטי לקוחות' },
    { to: '/dashboard/campaigns', label: 'קמפיינים', title: 'יצירה וניהול קמפיינים שיווקיים', icon: <EmailIcon /> },
    { to: '/dashboard/treatment-types', label: 'סוגי טיפולים', title: 'ניהול סוגי טיפולים ומחירים' },
    { to: '/dashboard/important-info', label: 'מידע חשוב', title: 'ניהול מידע חשוב ללקוחות' },
    { to: '/dashboard/gallery', label: 'גלריה', title: 'ניהול תמונות וגלריה' },
    { to: '/dashboard/design', label: 'אתר אישי', title: 'עיצוב ועריכת האתר האישי' },
    { to: '/dashboard/calendly', label: 'Calendly', title: 'הגדרת שילוב Calendly לקביעת תורים' },
    { to: '/dashboard/articles', label: 'מאמרים', title: 'יצירה וניהול מאמרים' },
    { to: '/dashboard/health-declarations', label: 'הצהרות בריאות', title: 'ניהול טפסי הצהרת בריאות' },
    { to: '/dashboard/profile', label: 'פרופיל', title: 'ניהול פרופיל אישי' },
    { to: '/dashboard/settings', label: 'הגדרות', title: 'הגדרות חשבון ומערכת' },
];

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleNavClick = () => {
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    const sidebarContent = (
        <Box
            width={isMobile ? '100%' : 220}
            minWidth={isMobile ? 'auto' : 220}
            maxWidth={isMobile ? 'auto' : 220}
            bgcolor="#fff"
            minHeight="100vh"
            boxShadow={isMobile ? 0 : 2}
            display="flex"
            flexDirection="column"
            sx={{
                '@media (max-width: 768px)': {
                    width: '100%',
                    minWidth: 'auto',
                    maxWidth: 'auto',
                    minHeight: 'auto'
                },
                '@media (min-width: 769px)': {
                    width: '220px !important',
                    minWidth: '220px !important',
                    maxWidth: '220px !important',
                    flexShrink: 0
                }
            }}
        >
            <Box
                p={2}
                borderBottom="1px solid"
                borderColor="divider"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ minWidth: 0 }} // מאפשר לתוכן להתכווץ
            >
                <Box display="flex" justifyContent="center" flex={1} sx={{ minWidth: 0 }}>
                    <Logo variant="small" />
                </Box>
                {isMobile && (
                    <IconButton onClick={handleDrawerToggle}>
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>
            <Box flex={1} sx={{ overflowY: 'auto', minWidth: 0 }}>
                <List sx={{ width: '100%', padding: 0 }}>
                    {links.map(link => {
                        const item = (
                            <ListItem
                                button
                                key={link.to}
                                component={Link}
                                to={link.to}
                                selected={location.pathname === link.to}
                                title={link.title}
                                onClick={handleNavClick}
                                sx={{
                                    width: '100%',
                                    minWidth: 0,
                                    '@media (max-width: 768px)': {
                                        py: 2,
                                        px: 3
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={link.label}
                                    sx={{
                                        width: '100%',
                                        minWidth: 0,
                                        '& .MuiListItemText-primary': {
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        },
                                        '@media (max-width: 768px)': {
                                            '& .MuiListItemText-primary': {
                                                fontSize: '1.1rem'
                                            }
                                        }
                                    }}
                                />
                            </ListItem>
                        );

                        // Wrap Calendly menu item with FeatureGate
                        if (link.to === '/dashboard/calendly') {
                            return (
                                <FeatureGate feature="calendly" key={link.to}>
                                    {item}
                                </FeatureGate>
                            );
                        }

                        return item;
                    })}
                </List>
            </Box>
            <Box p={2} sx={{ minWidth: 0 }}>
                <Divider sx={{ mb: 2 }} />
                <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{
                        minWidth: 0,
                        '@media (max-width: 768px)': {
                            py: 1.5,
                            fontSize: '1rem'
                        }
                    }}
                >
                    התנתקות
                </Button>
            </Box>
        </Box>
    );

    if (isMobile) {
        return (
            <>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{
                        mr: 2,
                        display: { md: 'none' },
                        position: 'fixed',
                        top: 10,
                        right: 10,
                        zIndex: 1300,
                        bgcolor: 'background.paper',
                        boxShadow: 2
                    }}
                >
                    <MenuIcon />
                </IconButton>
                <Drawer
                    variant="temporary"
                    anchor="right"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: '100%',
                            maxWidth: 320,
                            minWidth: 280
                        },
                    }}
                >
                    {sidebarContent}
                </Drawer>
            </>
        );
    }

    return sidebarContent;
};

export default Sidebar; 