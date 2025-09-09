import React, { useState } from 'react';
import { Box, List, ListItem, ListItemText, Divider, Button, IconButton, Drawer, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import { useAuth } from '../../../context/AuthContext';
import Logo from '../../../components/common/Logo';

const links = [
    { to: '/admin', label: 'ראשי' },
    { to: '/admin/therapists', label: 'מטפלות' },
    { to: '/admin/plans', label: 'ניהול תוכניות' },
    { to: '/admin/health-declarations', label: 'ניהול הצהרות בריאות' },
    { to: '/admin/settings', label: 'הגדרות' },
];

const AdminSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleNavClick = () => { if (isMobile) setMobileOpen(false); };

    const content = (
        <Box width={isMobile ? '100%' : 240} sx={{ bgcolor: '#fff', borderInlineEnd: isMobile ? 'none' : '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }} minHeight={isMobile ? 'auto' : '100vh'} display="flex" flexDirection="column">
            <Box p={2} borderBottom="1px solid" borderColor="divider" display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" justifyContent="center" flex={1}>
                    <Logo variant="small" />
                </Box>
                {isMobile && (
                    <IconButton onClick={handleDrawerToggle}>
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>
            <Box flex={1} sx={{ overflowY: 'auto' }}>
                <List sx={{ py: 2, px: 1 }}>
                    {links.map(link => (
                        <ListItem
                            button
                            key={link.to}
                            component={Link}
                            to={link.to}
                            selected={location.pathname === link.to}
                            onClick={handleNavClick}
                            sx={{ borderRadius: 1, px: 2, py: 1, my: 0.5, width: '100%' }}
                        >
                            <ListItemText primary={link.label} />
                        </ListItem>
                    ))}
                </List>
            </Box>
            <Box p={2}>
                <Divider sx={{ mb: 2 }} />
                <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
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
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: '100%',
                            maxWidth: 320
                        }
                    }}
                >
                    {content}
                </Drawer>
            </>
        );
    }

    return (
        <Box position="sticky" top={0} flexShrink={0}>
            {content}
        </Box>
    );
};

export default AdminSidebar;


