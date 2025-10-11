import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Grid, MenuItem, Select, Stack, TextField, Typography, Alert } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'moment';
import 'moment/locale/he';
import api from '../../../services/api';

moment.locale('he');

const PublicBooking = () => {
    const { therapistId } = useParams();
    const [date, setDate] = useState(moment());
    const [slots, setSlots] = useState([]);
    const [duration, setDuration] = useState(60);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [form, setForm] = useState({ fullName: '', email: '', phone: '', notes: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const dateIso = useMemo(() => date.clone().startOf('day').toISOString(), [date]);

    useEffect(() => {
        const loadSlots = async () => {
            try {
                setLoading(true);
                setError('');
                const res = await api.get('/public/availability/slots', {
                    params: {
                        therapistId,
                        date: date.format('YYYY-MM-DD'),
                        duration
                    }
                });
                const s = res.data?.slots || [];
                setSlots(s);
                setSelectedSlot('');
            } catch (e) {
                setError('שגיאה בטעינת זמינות');
                setSlots([]);
            } finally {
                setLoading(false);
            }
        };
        if (therapistId) loadSlots();
    }, [therapistId, dateIso, duration]);

    const handleSubmit = async () => {
        try {
            setError('');
            setSuccess('');
            if (!selectedSlot) {
                setError('נא לבחור זמן');
                return;
            }
            if (!form.fullName || !form.email) {
                setError('נא למלא שם מלא ואימייל');
                return;
            }
            const slot = slots.find(s => s.startTime === selectedSlot);
            if (!slot) {
                setError('הזמן שנבחר אינו תקין');
                return;
            }
            const payload = {
                therapistId,
                client: { fullName: form.fullName, email: form.email, phone: form.phone },
                startTime: slot.startTime,
                endTime: slot.endTime,
                duration,
                serviceType: 'individual',
                location: 'online',
                notes: form.notes
            };
            const res = await api.post('/public/appointments', payload);
            setSuccess('התור נקבע בהצלחה! שלחנו אישור למייל.');
            // שדר התראה בזמן אמת לטאבים אחרים (דאשבורד) לרענון היומן
            try {
                if ('BroadcastChannel' in window) {
                    const ch = new BroadcastChannel('appointments');
                    ch.postMessage({ type: 'created', appointment: res.data?.data, ts: Date.now() });
                    ch.close();
                }
            } catch (_) { }
            try {
                localStorage.setItem('appointments:lastCreated', String(Date.now()));
                // מחיקה מהירה כדי לא לפגוע באחסון
                setTimeout(() => localStorage.removeItem('appointments:lastCreated'), 500);
            } catch (_) { }
        } catch (e) {
            setError(e.response?.data?.message || 'שגיאה בקביעת התור');
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="he">
            <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
                <Typography variant="h4" gutterBottom>קביעת תור</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>בחרי תאריך ושעה</Typography>
                                <Stack spacing={2}>
                                    <DatePicker
                                        label="תאריך"
                                        value={date}
                                        onChange={(v) => setDate(v || moment())}
                                    />
                                    <TextField
                                        select
                                        label="משך (דקות)"
                                        value={duration}
                                        onChange={(e) => setDuration(Number(e.target.value))}
                                    >
                                        <MenuItem value={30}>30</MenuItem>
                                        <MenuItem value={45}>45</MenuItem>
                                        <MenuItem value={60}>60</MenuItem>
                                        <MenuItem value={90}>90</MenuItem>
                                    </TextField>
                                    {loading ? (
                                        <Alert severity="info">טוען סלוטים...</Alert>
                                    ) : slots.length === 0 ? (
                                        <Alert severity="warning">אין סלוטים פנויים בתאריך זה</Alert>
                                    ) : (
                                        <TextField
                                            select
                                            label="בחרי שעה"
                                            value={selectedSlot}
                                            onChange={(e) => setSelectedSlot(e.target.value)}
                                        >
                                            {slots.map((s) => (
                                                <MenuItem key={s.startTime} value={s.startTime}>
                                                    {moment(s.startTime).format('HH:mm')} - {moment(s.endTime).format('HH:mm')}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>פרטים</Typography>
                                <Stack spacing={2}>
                                    <TextField label="שם מלא" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                                    <TextField label="אימייל" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                    <TextField label="טלפון" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                    <TextField label="הערות" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} multiline rows={3} />
                                    {error && <Alert severity="error">{error}</Alert>}
                                    {success && <Alert severity="success">{success}</Alert>}
                                    <Button variant="contained" onClick={handleSubmit} disabled={loading || !selectedSlot}>קבעי תור</Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </LocalizationProvider>
    );
};

export default PublicBooking;


