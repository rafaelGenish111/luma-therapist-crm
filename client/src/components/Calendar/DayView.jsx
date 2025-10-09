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
    Alert
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
import 'moment/locale/he';

moment.locale('he');

const DayView = ({ selectedDate, appointments = [], onBack, onAddAppointment, onEditAppointment, loading }) => {
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
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={onAddAppointment}
                        size="large"
                    >
                        הוסף פגישה
                    </Button>
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
        </Box>
    );
};

export default DayView;

