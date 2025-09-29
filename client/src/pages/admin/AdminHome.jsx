import React from 'react';
import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import api from '../../services/api';

const StatCard = ({ title, value }) => (
    <Card>
        <CardContent>
            <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
            <Typography variant="h4">{value}</Typography>
        </CardContent>
    </Card>
);

const AdminHome = () => {
    const [status, setStatus] = React.useState(null);

    React.useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/health');
                setStatus(res);
            } catch (error) {
                console.error('Failed to fetch system status:', error);
                setStatus({ db: 'Error', stats: { therapists: 'Error', clients: 'Error' } });
            }
        })();
    }, []);

    return (
        <Box>
            <Typography variant="h5" mb={2}>סקירה כללית</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} md={3}><StatCard title="מסד נתונים" value={status?.db || '...'} /></Grid>
                <Grid item xs={12} md={3}><StatCard title="מטפלות" value={status?.stats?.therapists ?? '...'} /></Grid>
                <Grid item xs={12} md={3}><StatCard title="לקוחות" value={status?.stats?.clients ?? '...'} /></Grid>
                <Grid item xs={12} md={3}><StatCard title="תוכניות" value={status?.stats?.plans ?? '...'} /></Grid>
            </Grid>
        </Box>
    );
};

export default AdminHome;




