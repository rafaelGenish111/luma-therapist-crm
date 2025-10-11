import React from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    IconButton,
    Divider,
    Paper,
    Stack,
    Tooltip,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import {
    ArrowBack,
    Add,
    AccessTime,
    Person,
    AttachMoney,
    LocationOn,
    VideoCall,
    Edit,
    Delete,
    CheckCircle
} from '@mui/icons-material';
import moment from 'moment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import api from '../../services/api';
import 'moment/locale/he';

moment.locale('he');

const DayView = ({ selectedDate, appointments = [], onBack, onAddAppointment, onEditAppointment, loading }) => {
    const [availabilityOpen, setAvailabilityOpen] = React.useState(false);
    const [fromTime, setFromTime] = React.useState(moment(selectedDate).hour(9).minute(0));
    const [toTime, setToTime] = React.useState(moment(selectedDate).hour(17).minute(0));
    const [savingAvailability, setSavingAvailability] = React.useState(false);
    const [availabilityError, setAvailabilityError] = React.useState('');
    // Filter appointments for the selected date
    const dayAppointments = appointments.filter(apt => {
        const aptDate = moment(apt.startTime);
        return aptDate.isSame(selectedDate, 'day');
    }).sort((a, b) => moment(a.startTime).diff(moment(b.startTime)));

    // Calculate stats for the day
    const stats = {
        total: dayAppointments.length,
        completed: dayAppointments.filter(a => a.status === 'completed').length,
        confirmed: dayAppointments.filter(a => a.status === 'confirmed').length,
        pending: dayAppointments.filter(a => a.status === 'pending' || a.status === 'scheduled').length,
        cancelled: dayAppointments.filter(a => a.status === 'cancelled').length,
        revenue: dayAppointments
            .filter(a => a.status === 'completed')
            .reduce((sum, a) => sum + (a.paymentAmount || 0), 0)
    };

    // Status colors
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'confirmed': return 'primary';
            case 'pending':
            case 'scheduled': return 'warning';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    // Status labels
    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed': return 'בוצעה';
            case 'confirmed': return 'אושרה';
            case 'pending': return 'ממתינה';
            case 'scheduled': return 'מתוכננת';
            case 'cancelled': return 'בוטלה';
            default: return status;
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Tooltip title="חזרה ליומן">
                            <IconButton onClick={onBack} color="primary">
                                <ArrowBack />
                            </IconButton>
                        </Tooltip>
                        <Box>
                            <Typography variant="h5" fontWeight="bold">
                                {selectedDate.format('dddd')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {selectedDate.format('D בMMMM YYYY')}
                            </Typography>
                        </Box>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            onClick={() => setAvailabilityOpen(true)}
                        >
                            הגדר שעות עבודה ליום זה
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={onAddAppointment}
                            size="large"
                        >
                            הוסף פגישה
                        </Button>
                    </Stack>
                </Box>

                {/* Stats */}
                <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Chip
                        label={`סה"כ: ${stats.total}`}
                        color="default"
                        variant="outlined"
                    />
                    {stats.confirmed > 0 && (
                        <Chip
                            label={`מאושרות: ${stats.confirmed}`}
                            color="primary"
                            variant="outlined"
                        />
                    )}
                    {stats.pending > 0 && (
                        <Chip
                            label={`ממתינות: ${stats.pending}`}
                            color="warning"
                            variant="outlined"
                        />
                    )}
                    {stats.completed > 0 && (
                        <Chip
                            label={`בוצעו: ${stats.completed}`}
                            color="success"
                            variant="outlined"
                        />
                    )}
                    {stats.revenue > 0 && (
                        <Chip
                            icon={<AttachMoney />}
                            label={`הכנסות: ₪${stats.revenue}`}
                            color="success"
                            variant="filled"
                        />
                    )}
                </Stack>
            </Paper>

            {/* Appointments List */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <Alert severity="info">טוען פגישות...</Alert>
                ) : dayAppointments.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            אין פגישות ביום זה
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            לחץ על "הוסף פגישה" כדי ליצור פגישה חדשה
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={onAddAppointment}
                        >
                            הוסף פגישה
                        </Button>
                    </Paper>
                ) : (
                    <Stack spacing={2}>
                        {dayAppointments.map((appointment) => (
                            <Card
                                key={appointment._id}
                                sx={{
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        boxShadow: 4,
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                                onClick={() => onEditAppointment(appointment)}
                            >
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <AccessTime color="action" fontSize="small" />
                                            <Typography variant="h6" fontWeight="bold">
                                                {moment(appointment.startTime).format('HH:mm')} - {moment(appointment.endTime).format('HH:mm')}
                                            </Typography>
                                            <Chip
                                                label={getStatusLabel(appointment.status)}
                                                color={getStatusColor(appointment.status)}
                                                size="small"
                                            />
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditAppointment(appointment);
                                            }}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                    </Box>

                                    <Stack spacing={1}>
                                        {/* Client */}
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Person color="action" fontSize="small" />
                                            <Typography variant="body1">
                                                {appointment.client?.firstName} {appointment.client?.lastName}
                                            </Typography>
                                        </Box>

                                        {/* Service Type */}
                                        {appointment.serviceType && (
                                            <Typography variant="body2" color="text.secondary">
                                                {appointment.serviceType}
                                            </Typography>
                                        )}

                                        {/* Location */}
                                        {appointment.location && (
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <LocationOn color="action" fontSize="small" />
                                                <Typography variant="body2" color="text.secondary">
                                                    {appointment.location}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Meeting URL */}
                                        {appointment.meetingUrl && (
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <VideoCall color="action" fontSize="small" />
                                                <Typography variant="body2" color="primary">
                                                    פגישה מקוונת
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Payment */}
                                        {appointment.paymentAmount > 0 && (
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <AttachMoney color="action" fontSize="small" />
                                                <Typography variant="body2" color="text.secondary">
                                                    ₪{appointment.paymentAmount}
                                                    {appointment.paymentStatus === 'paid' && (
                                                        <CheckCircle
                                                            color="success"
                                                            fontSize="small"
                                                            sx={{ ml: 0.5, verticalAlign: 'middle' }}
                                                        />
                                                    )}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Notes */}
                                        {appointment.notes && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                {appointment.notes}
                                            </Typography>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Box>
            {/* Availability Dialog */}
            <Dialog open={availabilityOpen} onClose={() => setAvailabilityOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>הגדרת שעות עבודה ליום {selectedDate.format('DD/MM/YYYY')}</DialogTitle>
                <DialogContent>
                    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="he">
                        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                            <TimePicker
                                label="שעת התחלה"
                                value={fromTime}
                                onChange={(v) => setFromTime(v)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                            <TimePicker
                                label="שעת סיום"
                                value={toTime}
                                onChange={(v) => setToTime(v)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Stack>
                    </LocalizationProvider>
                    {availabilityError && (
                        <Alert severity="error" sx={{ mt: 2 }}>{availabilityError}</Alert>
                    )}
                    <Alert severity="info" sx={{ mt: 2 }}>
                        נגדיר זמנים חסומים מחוץ לחלון העבודה, כך שלא ניתן יהיה לקבוע שם פגישות.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAvailabilityOpen(false)} disabled={savingAvailability}>ביטול</Button>
                    <Button
                        variant="contained"
                        disabled={savingAvailability}
                        onClick={async () => {
                            try {
                                setAvailabilityError('');
                                if (!fromTime || !toTime) {
                                    setAvailabilityError('נא לבחור שעות התחלה וסיום');
                                    return;
                                }
                                if (!moment(toTime).isAfter(fromTime)) {
                                    setAvailabilityError('שעת הסיום חייבת להיות אחרי שעת ההתחלה');
                                    return;
                                }
                                setSavingAvailability(true);
                                const dayStart = moment(selectedDate).startOf('day');
                                const dayEnd = moment(selectedDate).endOf('day');
                                const workStart = moment(selectedDate)
                                    .hour(fromTime.hour())
                                    .minute(fromTime.minute())
                                    .second(0)
                                    .millisecond(0);
                                const workEnd = moment(selectedDate)
                                    .hour(toTime.hour())
                                    .minute(toTime.minute())
                                    .second(0)
                                    .millisecond(0);

                                const requests = [];
                                // בלוק לפני תחילת העבודה
                                if (workStart.isAfter(dayStart)) {
                                    requests.push(api.post('/availability/blocked', {
                                        startTime: dayStart.toDate(),
                                        endTime: workStart.toDate(),
                                        reason: 'OFF_HOURS',
                                        notes: 'חסום אוטומטית מחוץ לשעות עבודה'
                                    }));
                                }
                                // בלוק אחרי סיום העבודה
                                if (dayEnd.isAfter(workEnd)) {
                                    requests.push(api.post('/availability/blocked', {
                                        startTime: workEnd.toDate(),
                                        endTime: dayEnd.toDate(),
                                        reason: 'OFF_HOURS',
                                        notes: 'חסום אוטומטית מחוץ לשעות עבודה'
                                    }));
                                }
                                await Promise.all(requests);
                                // שדר אירוע גלובלי לריענון רשימת החסימות במסכים אחרים
                                try {
                                    window.dispatchEvent(new CustomEvent('blockedTimes:updated', {
                                        detail: { date: selectedDate?.toISOString?.() }
                                    }));
                                } catch (_) { }
                                setAvailabilityOpen(false);
                            } catch (e) {
                                setAvailabilityError(e.response?.data?.message || 'שגיאה בשמירת השעות');
                            } finally {
                                setSavingAvailability(false);
                            }
                        }}
                    >
                        שמור
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DayView;

