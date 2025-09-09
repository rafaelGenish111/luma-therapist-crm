import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, useMediaQuery } from '@mui/material';
import AdminSidebar from '../pages/admin/components/AdminSidebar';
import Logo from '../components/common/Logo';
import Footer from '../components/common/Footer';

const AdminLayout = () => {
    const isMobile = useMediaQuery('(max-width: 900px)');
    return (
        <Box display="flex" minHeight="100vh" sx={{ bgcolor: (t) => t.palette.grey[100] }}>
            {!isMobile && <AdminSidebar />}
            <Box flex={1} display="flex" flexDirection="column">
                <AppBar position="sticky" color="primary" elevation={0} sx={{ boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                    <Toolbar sx={{ minHeight: 64, justifyContent: 'space-between' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Logo variant="small" />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>אזור ניהול</Typography>
                        </Box>
                        {isMobile && (
                            <Box>
                                {/* הסיידבר מגיב בנייד מתוך הקומפוננטה עצמה */}
                                <AdminSidebar />
                            </Box>
                        )}
                    </Toolbar>
                </AppBar>
                <Box flex={1} sx={{ p: { xs: 2, md: 3 }, maxWidth: '1400px', width: '100%', mx: 'auto' }}>
                    <Outlet />
                </Box>
                <Footer variant="admin" />
            </Box>
        </Box>
    );
};

export default AdminLayout;


