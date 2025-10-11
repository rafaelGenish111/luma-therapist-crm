import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Card, CardContent, Grid, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    Alert, CircularProgress, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Divider, Tabs, Tab, Badge
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Event as EventIcon, Schedule as ScheduleIcon, CheckCircle as CheckIcon,
    Cancel as CancelIcon, Payment as PaymentIcon
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';

import appointmentService from '../../../../../services/appointmentService';

const AppointmentsTab = ({ client }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [form, setForm] = useState({
        date: null,
        time: null,
        duration: 60,
        type: 'individual',
        location: 'clinic',
        price: '',
        notes: ''
    });

    useEffect(() => {
        loadAppointments();
    }, [client._id]);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const response = await appointmentService.getByClient(client._id);
            console.log('📅 Full API response:', response);

            // השרת מחזיר את הנתונים ישירות ב-response.appointments
            const appointmentsData = response.appointments || [];
            console.log('📅 Loaded appointments:', appointmentsData);
            setAppointments(appointmentsData);
        } catch (err) {
            console.error('❌ Error loading appointments:', err);
            setError('שגיאה בטעינת פגישות');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (appointment = null) => {
        if (appointment) {
            setSelectedAppointment(appointment);
            const appointmentDate = new Date(appointment.startTime || appointment.date);
            setForm({
                date: appointmentDate,
                time: appointmentDate,
                duration: appointment.duration || 60,
                type: appointment.serviceType || 'individual',
                location: appointment.location || 'clinic',
                price: (appointment.paymentAmount ?? appointment.price)?.toString() || '',
                notes: appointment.notes || ''
            });
        } else {
            setSelectedAppointment(null);
            setForm({
                date: null,
                time: null,
                duration: 60,
                type: 'individual',
                location: 'clinic',
                price: '',
                notes: ''
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
            setDialogOpen(false);
        setSelectedAppointment(null);
        setForm({
            date: null,
            time: null,
            duration: 60,
                type: 'individual',
                location: 'clinic',
            price: '',
            notes: ''
        });
    };

    const handleSubmit = async () => {
        if (!form.date || !form.time) {
            setError('נא לבחור תאריך ושעה');
            return;
        }

        try {
            const appointmentDate = new Date(form.date);
            appointmentDate.setHours(form.time.getHours());
            appointmentDate.setMinutes(form.time.getMinutes());

            // Align with server payload (same as CalendarPage)
            const appointmentData = {
                clientId: client._id,
                serviceType: form.type,
                startTime: appointmentDate,
                endTime: new Date(appointmentDate.getTime() + Number(form.duration || 60) * 60000),
                duration: Number(form.duration || 60),
                location: form.location,
                notes: form.notes,
                paymentAmount: form.price ? parseFloat(form.price) : 0,
                paymentStatus: 'unpaid',
                recurringPattern: { isRecurring: false }
            };

            if (selectedAppointment) {
                await appointmentService.update(selectedAppointment._id, appointmentData);
                setSuccess('הפגישה עודכנה בהצלחה');
            } else {
                await appointmentService.create(appointmentData);
                setSuccess('הפגישה נוצרה בהצלחה');
            }

            loadAppointments();
            handleCloseDialog();
        } catch (err) {
            setError('שגיאה בשמירת הפגישה');
        }
    };

    const handleDelete = async (appointmentId) => {
        if (!window.confirm('האם את בטוחה שברצונך למחוק פגישה זו?')) {
            return;
        }

        try {
            await appointmentService.delete(appointmentId);
            setSuccess('הפגישה נמחקה בהצלחה');
            loadAppointments();
        } catch (err) {
            setError('שגיאה במחיקת הפגישה');
        }
    };

    const handleStatusChange = async (appointmentId, newStatus) => {
        try {
            await appointmentService.update(appointmentId, { status: newStatus });
            setSuccess('סטטוס הפגישה עודכן בהצלחה');
            loadAppointments();
        } catch (err) {
            setError('שגיאה בעדכון סטטוס הפגישה');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled':
                return 'primary';
            case 'confirmed':
                return 'info';
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'error';
            case 'no_show':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'scheduled':
                return 'מתוכננת';
            case 'confirmed':
                return 'אושרה';
            case 'completed':
                return 'בוצעה';
            case 'cancelled':
                return 'בוטלה';
            case 'no_show':
                return 'לא הופיעה';
            default:
                return status;
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return 'success';
            case 'unpaid':
                return 'error';
            case 'partial':
                return 'warning';
            case 'waived':
                return 'info';
            default:
                return 'default';
        }
    };

    const getPaymentStatusLabel = (status) => {
        switch (status) {
            case 'paid':
                return 'שולם';
            case 'unpaid':
                return 'לא שולם';
            case 'partial':
                return 'חלקי';
            case 'waived':
                return 'פטור';
            default:
                return status;
        }
    };

    const formatDateTime = (date) => {
        return new Date(date).toLocaleString('he-IL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('he-IL');
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFutureAppointments = () => {
        const now = new Date();
        const futureAppointments = appointments.filter(apt => {
            const appointmentDate = new Date(apt.date);
            const isFuture = appointmentDate > now;
            const isActiveStatus = ['scheduled', 'confirmed', 'מתוכננת', 'אושרה'].includes(apt.status);
            console.log(`🔍 Appointment ${apt._id}:`, {
                date: apt.date,
                status: apt.status,
                isFuture,
                isActiveStatus,
                willShow: isFuture && isActiveStatus
            });
            return isFuture && isActiveStatus;
        });
        console.log('📅 Future appointments count:', futureAppointments.length);
        return futureAppointments;
    };

    const getPastAppointments = () => {
        const now = new Date();
        return appointments.filter(apt => {
            const appointmentDate = new Date(apt.date);
            const isPast = appointmentDate <= now;
            const isCompletedStatus = ['completed', 'cancelled', 'no_show', 'בוצעה', 'בוטלה', 'לא הופיעה'].includes(apt.status);
            return isPast || isCompletedStatus;
        });
    };

    const futureAppointments = getFutureAppointments();
    const pastAppointments = getPastAppointments();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            <Alert severity="info" sx={{ mb: 2 }}>
                💡 לאחר סיום פגישה, עבור לטאב "היסטוריית טיפול" כדי לתעד את הפגישה
            </Alert>

            {/* סיכום פגישות */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="primary">
                                סה"כ פגישות
                            </Typography>
                            <Typography variant="h4">
                                {appointments.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="info.main">
                                פגישות עתידיות
                            </Typography>
                            <Typography variant="h4">
                                {futureAppointments.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="success.main">
                                פגישות שהושלמו
                            </Typography>
                            <Typography variant="h4">
                                {appointments.filter(apt => apt.status === 'completed').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="warning.main">
                                פגישות שבוטלו
                            </Typography>
                            <Typography variant="h4">
                                {appointments.filter(apt => apt.status === 'cancelled').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* טאבים */}
            <Paper sx={{ mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab
                        label={
                            <Badge badgeContent={futureAppointments.length} color="primary">
                                פגישות עתידיות
                            </Badge>
                        }
                    />
                    <Tab
                        label={
                            <Badge badgeContent={pastAppointments.length} color="secondary">
                                היסטוריית פגישות
                            </Badge>
                        }
                    />
                </Tabs>
                <Divider />

                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        {tabValue === 0 ? 'פגישות עתידיות' : 'היסטוריית פגישות'}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        פגישה חדשה
                    </Button>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>תאריך ושעה</TableCell>
                                <TableCell>סוג</TableCell>
                                <TableCell>משך</TableCell>
                                <TableCell>סטטוס</TableCell>
                                <TableCell>תשלום</TableCell>
                                <TableCell>פעולות</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(tabValue === 0 ? futureAppointments : pastAppointments).length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography color="textSecondary">
                                            {tabValue === 0 ? 'אין פגישות עתידיות' : 'אין היסטוריית פגישות'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                (tabValue === 0 ? futureAppointments : pastAppointments).map((appointment) => (
                                    <TableRow key={appointment._id}>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {formatDate(appointment.date)}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {formatTime(appointment.date)}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{appointment.type}</TableCell>
                                        <TableCell>{appointment.duration} דקות</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusLabel(appointment.status)}
                                                color={getStatusColor(appointment.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" flexDirection="column" gap={0.5}>
                                                <Chip
                                                    label={getPaymentStatusLabel(appointment.paymentStatus)}
                                                    color={getPaymentStatusColor(appointment.paymentStatus)}
                                                    size="small"
                                                />
                                                {appointment.price && (
                                                    <Typography variant="caption">
                                                        ₪{appointment.price}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" gap={1}>
                                                {appointment.status === 'scheduled' && (
                                                    <>
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            onClick={() => handleStatusChange(appointment._id, 'completed')}
                                                            title="סמן כבוצע"
                                                        >
                                                            <CheckIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                                                            title="בטל פגישה"
                                                        >
                                                            <CancelIcon />
                                                        </IconButton>
                                                    </>
                                                )}
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDialog(appointment)}
                                                    title="ערוך"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(appointment._id)}
                                                    title="מחק"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* דיאלוג יצירה/עריכה */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedAppointment ? 'עריכת פגישה' : 'פגישה חדשה'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                                    <DatePicker
                                        label="תאריך"
                                        value={form.date}
                                        onChange={(newValue) => setForm({ ...form, date: newValue })}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                                    <TimePicker
                                        label="שעה"
                                        value={form.time}
                                        onChange={(newValue) => setForm({ ...form, time: newValue })}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    label="משך (דקות)"
                                    value={form.duration}
                                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                    fullWidth
                                >
                                    <MenuItem value={30}>30 דקות</MenuItem>
                                    <MenuItem value={45}>45 דקות</MenuItem>
                                    <MenuItem value={60}>60 דקות</MenuItem>
                                    <MenuItem value={90}>90 דקות</MenuItem>
                                    <MenuItem value={120}>120 דקות</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    label="סוג פגישה"
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    fullWidth
                                >
                                    <MenuItem value="פגישה ראשונה">פגישה ראשונה</MenuItem>
                                    <MenuItem value="טיפול רגיל">טיפול רגיל</MenuItem>
                                    <MenuItem value="מעקב">מעקב</MenuItem>
                                    <MenuItem value="ייעוץ">ייעוץ</MenuItem>
                                    <MenuItem value="אחר">אחר</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="מיקום"
                                    value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="מחיר"
                                    type="number"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    fullWidth
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }}>₪</Typography>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="הערות"
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    fullWidth
                                    multiline
                                    rows={3}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>ביטול</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedAppointment ? 'עדכן' : 'צור'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AppointmentsTab;


