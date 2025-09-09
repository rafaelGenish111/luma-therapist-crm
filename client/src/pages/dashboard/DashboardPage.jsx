import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Box, Typography, Paper, Grid, Button, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

import ClientList from './therapist/components/ClientList';
import api from '../../services/api';
import appointmentService from '../../services/appointmentService';
import { getTherapistProfile } from '../../services/therapistService';
import { setWebsiteActiveState } from '../../services/therapistService';

const DashboardPage = () => {
    const [metrics, setMetrics] = useState({ activeClients: 0, articles: 0, galleryImages: 0 });
    const [nextAppointment, setNextAppointment] = useState(null);
    const [profile, setProfile] = useState(null);
    const [activating, setActivating] = useState(false);
    const [openNextDialog, setOpenNextDialog] = useState(false);
    const [nextLoading, setNextLoading] = useState(false);

    const fetchNext = useCallback(async () => {
        setNextLoading(true);
        try {
            const res = await appointmentService.getAll({ futureOnly: 1 });
            const list = res.data?.data || [];
            const now = new Date();
            const upcoming = list
                .filter(a => new Date(a.date) >= now && (a.status === 'מתוכננת' || a.status === 'אושרה'))
                .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
            setNextAppointment(upcoming);
        } catch (e) {
            setNextAppointment(null);
        } finally {
            setNextLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await api.get('/therapists/metrics/summary');
                setMetrics(res.data?.data || { activeClients: 0, articles: 0, galleryImages: 0 });
            } catch (e) {
                setMetrics({ activeClients: 0, articles: 0, galleryImages: 0 });
            }
        };
        const fetchProfile = async () => {
            try {
                const res = await getTherapistProfile();
                setProfile(res?.data || null);
            } catch (e) {
                setProfile(null);
            }
        };

        fetchMetrics();
        fetchNext();
        fetchProfile();
        const interval = setInterval(() => {
            fetchMetrics();
            fetchNext();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchNext]);

    const handleActivateWebsite = async () => {
        try {
            setActivating(true);
            await setWebsiteActiveState(true);
            const res = await getTherapistProfile();
            setProfile(res?.data || null);
            // רענון פגישה קרובה לאחר שינוי מצב אתר (ליתר ביטחון)
            try {
                const nextRes = await appointmentService.getAll({ futureOnly: 1 });
                const list = nextRes.data?.data || [];
                const now = new Date();
                const upcoming = list
                    .filter(a => new Date(a.date) >= now && (a.status === 'מתוכננת' || a.status === 'אושרה'))
                    .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
                setNextAppointment(upcoming);
            } catch { }
        } finally {
            setActivating(false);
        }
    };

    return (
        <Box>
            <Box p={4}>
                <Typography variant="h4" mb={2}>ברוכה הבאה ללוח הבקרה</Typography>

                {/* התור הבא שלי */}
                <Grid container spacing={2} mb={3}>
                    <Grid item xs={12}>
                        <Paper elevation={2} sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="h6" gutterBottom>התור הבא שלי</Typography>
                                {nextAppointment ? (
                                    <>
                                        <Typography variant="body1">
                                            {nextAppointment.client ? `${nextAppointment.client.firstName} ${nextAppointment.client.lastName}` : 'לקוח ללא שם'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {new Date(nextAppointment.date).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">אין פגישות קרובות</Typography>
                                )}
                            </Box>
                            <Button
                                variant="outlined"
                                onClick={async () => { await fetchNext(); setOpenNextDialog(true); }}
                                disabled={nextLoading}
                            >
                                {nextLoading ? 'טוען…' : 'צפה'}
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
                <Grid container spacing={2} mb={4}>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6">לקוחות פעילים</Typography>
                            <Typography variant="h3" color="primary">{metrics.activeClients}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6">מאמרים</Typography>
                            <Typography variant="h3" color="primary">{metrics.articles}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6">תמונות בגלריה</Typography>
                            <Typography variant="h3" color="primary">{metrics.galleryImages}</Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* מצב אתר אישי */}
                <Grid container spacing={2} mb={4}>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="h6" gutterBottom>אתר אישי</Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2">מצב:</Typography>
                                    <Chip label={profile?.website?.isActive ? 'פעיל' : 'כבוי'} color={profile?.website?.isActive ? 'success' : 'default'} size="small" />
                                </Stack>
                            </Box>
                            {!profile?.website?.isActive && (
                                <Button variant="contained" color="primary" onClick={handleActivateWebsite} disabled={activating}>
                                    הפעל אתר אישי
                                </Button>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
                {/* מודאל פרטי הפגישה הקרובה */}
                <Dialog open={openNextDialog} onClose={() => setOpenNextDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>פרטי הפגישה הקרובה</DialogTitle>
                    <DialogContent dividers>
                        {nextAppointment ? (
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">לקוח/ה</Typography>
                                <Typography variant="body1" mb={1}>
                                    {nextAppointment.client ? `${nextAppointment.client.firstName} ${nextAppointment.client.lastName}` : '—'}
                                </Typography>
                                <Typography variant="subtitle2" color="text.secondary">תאריך ושעה</Typography>
                                <Typography variant="body1" mb={1}>
                                    {new Date(nextAppointment.date).toLocaleString('he-IL', { dateStyle: 'full', timeStyle: 'short' })}
                                </Typography>
                                <Typography variant="subtitle2" color="text.secondary">סוג</Typography>
                                <Typography variant="body1" mb={1}>{nextAppointment.type || '—'}</Typography>
                                <Typography variant="subtitle2" color="text.secondary">סטטוס</Typography>
                                <Typography variant="body1" mb={1}>{nextAppointment.status || '—'}</Typography>
                                <Typography variant="subtitle2" color="text.secondary">מיקום</Typography>
                                <Typography variant="body1" mb={1}>{nextAppointment.location || '—'}</Typography>
                                <Typography variant="subtitle2" color="text.secondary">משך</Typography>
                                <Typography variant="body1">{nextAppointment.duration ? `${nextAppointment.duration} ד׳` : '—'}</Typography>
                            </Box>
                        ) : (
                            <Typography>{nextLoading ? 'טוען…' : 'אין פגישה קרובה להצגה.'}</Typography>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={async () => { await fetchNext(); }}>רענן</Button>
                        <Button onClick={() => setOpenNextDialog(false)}>סגור</Button>
                        <Button onClick={() => { window.location.href = '/dashboard/appointments'; }} variant="contained" color="primary">נהל פגישות</Button>
                    </DialogActions>
                </Dialog>

                <Typography variant="h5" mb={2}>רשימת לקוחות</Typography>
                <ClientList />
            </Box>
        </Box>
    );
};

export default DashboardPage; 