import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from '../pages/dashboard/therapist/components/Sidebar';
import Topbar from '../pages/dashboard/therapist/components/Topbar';

const DashboardLayout = () => {
    return (
        <Box display="flex" minHeight="100vh" bgcolor="#f5f5f5">
            <Sidebar />
            <Box
                flex={1}
                display="flex"
                flexDirection="column"
                sx={{
                    minWidth: 0, // מאפשר לתוכן להתכווץ אם צריך
                    overflow: 'hidden' // מונע overflow
                }}
            >
                <Topbar />
                <Box p={3} flex={1} sx={{ overflow: 'auto' }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default DashboardLayout;