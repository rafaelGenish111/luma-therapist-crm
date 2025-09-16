import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Tabs,
    Tab
} from '@mui/material';

import AppointmentList from './components/AppointmentList';
import AppointmentForm from './components/AppointmentForm';
import api, { clientsApi, appointmentsApi, therapistsApi } from '../../../services/api';

const AppointmentsPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editAppointment, setEditAppointment] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [selectedTab, setSelectedTab] = useState(0);
    const [bookingLink, setBookingLink] = useState('');
    const [copied, setCopied] = useState(false);

    // שליפת פגישות מהשרת
    const fetchAppointments = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await appointmentsApi.getAll();
            setAppointments(res.data || []);
        } catch (err) {
            setError('שגיאה בטעינת פגישות');
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    // שליפת לקוחות
    const fetchClients = async () => {
        try {
            const res = await clientsApi.getAll();
            setClients(res.data || []);
        } catch (err) {
            console.error('שגיאה בטעינת לקוחות:', err);
        }
    };

    useEffect(() => {
        fetchAppointments();
        fetchClients();
        // בניית קישור לטופס קביעת תור באתר האישי
        (async () => {
            try {
                const prof = await therapistsApi.getProfile();
                const id = prof.data?._id || prof.data?.id;
                if (id) {
                    setBookingLink(`${window.location.origin}/website/${id}/book`);
                }
            } catch { }
        })();
    }, []);

    const handleCopyBookingLink = async () => {
        if (!bookingLink) return;
        try {
            await navigator.clipboard.writeText(bookingLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
            const el = document.createElement('textarea');
            el.value = bookingLink;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // פתיחת טופס הוספה
    const handleAdd = () => {
        setEditAppointment(null);
        setOpen(true);
    };

    // פתיחת טופס עריכה
    const handleEdit = (appointment) => {
        setEditAppointment(appointment);
        setOpen(true);
    };

    // שמירה (הוספה/עדכון)
    const handleSave = async (data) => {
        setSaving(true);
        setError('');
        try {
            if (editAppointment) {
                // עדכון
                await appointmentsApi.update(editAppointment._id || editAppointment.id, data);
            } else {
                // הוספה
                await appointmentsApi.create(data);
            }
            setOpen(false);
            fetchAppointments();
        } catch (err) {
            setError('שגיאה בשמירת פגישה');
        } finally {
            setSaving(false);
        }
    };

    // מחיקה
    const handleDelete = async (appointment) => {
        if (!window.confirm('האם למחוק את הפגישה?')) return;
        try {
            await appointmentsApi.delete(appointment._id || appointment.id);
            fetchAppointments();
        } catch (err) {
            setError('שגיאה במחיקת פגישה');
        }
    };

    // סינון פגישות לפי סטטוס
    const getFilteredAppointments = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (selectedTab) {
            case 0: // כל הפגישות
                return appointments;
            case 1: // היום
                return appointments.filter(apt => {
                    const aptDate = new Date(apt.date);
                    aptDate.setHours(0, 0, 0, 0);
                    return aptDate.getTime() === today.getTime();
                });
            case 2: // השבוע
                const weekFromNow = new Date(today);
                weekFromNow.setDate(today.getDate() + 7);
                return appointments.filter(apt => {
                    const aptDate = new Date(apt.date);
                    return aptDate >= today && aptDate <= weekFromNow;
                });
            case 3: // מתוכננות
                return appointments.filter(apt => apt.status === 'מתוכננת' || apt.status === 'אושרה');
            case 4: // בוצעו
                return appointments.filter(apt => apt.status === 'בוצעה');
            default:
                return appointments;
        }
    };

    const filteredAppointments = getFilteredAppointments();

    return (
        <Box>
            <Box p={4}>
                <Typography variant="h4" mb={2}>ניהול פגישות</Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Button variant="contained" color="primary" onClick={handleAdd}>
                        הוסף פגישה
                    </Button>
                    <Box display="flex" gap={1} alignItems="center">
                        <Button variant="outlined" onClick={handleCopyBookingLink} disabled={!bookingLink}>
                            שתף טופס תיאום תור
                        </Button>
                        {copied && <Typography variant="body2" color="success.main">הקישור הועתק</Typography>}
                    </Box>
                </Box>

                <Paper elevation={2} sx={{ mb: 2 }}>
                    <Tabs
                        value={selectedTab}
                        onChange={(e, newValue) => setSelectedTab(newValue)}
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab label="כל הפגישות" />
                        <Tab label="היום" />
                        <Tab label="השבוע" />
                        <Tab label="מתוכננות" />
                        <Tab label="בוצעו" />
                    </Tabs>
                </Paper>

                <Paper elevation={2} sx={{ p: 3 }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <AppointmentList
                            appointments={filteredAppointments}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    )}
                </Paper>

                {/* דיאלוג טופס פגישה */}
                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {editAppointment ? 'עריכת פגישה' : 'הוספת פגישה חדשה'}
                    </DialogTitle>
                    <DialogContent>
                        <AppointmentForm
                            initialData={editAppointment}
                            onSubmit={handleSave}
                            onCancel={() => setOpen(false)}
                            clients={clients}
                        />
                    </DialogContent>
                    {saving && (
                        <Box display="flex" justifyContent="center" p={2}>
                            <CircularProgress size={24} />
                        </Box>
                    )}
                    <DialogActions>
                        <Button onClick={() => setOpen(false)} color="secondary">סגור</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default AppointmentsPage; 