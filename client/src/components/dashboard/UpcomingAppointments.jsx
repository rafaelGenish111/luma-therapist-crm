import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardHeader,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Button,
    Box,
    Avatar,
    Divider,
    CircularProgress,
    Alert,
    Tooltip
} from '@mui/material';
import {
    CalendarToday,
    AccessTime,
    Person,
    MoreVert,
    ArrowForward,
    CheckCircle,
    Pending,
    Cancel,
    Schedule
} from '@mui/icons-material';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { he } from 'date-fns/locale';
import axios from 'axios';

const UpcomingAppointments = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadUpcomingAppointments = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/appointments', {
                    params: {
                        limit: 5,
                        sort: 'startTime',
                        status: ['pending', 'confirmed']
                    }
                });
                setAppointments(response.data.data || []);
            } catch (err) {
                setError('שגיאה בטעינת הפגישות הקרובות');
                console.error('Error loading upcoming appointments:', err);
            } finally {
                setLoading(false);
            }
        };

        loadUpcomingAppointments();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'confirmed':
                return 'success';
            case 'completed':
                return 'info';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'ממתין';
            case 'confirmed':
                return 'מאושר';
            case 'completed':
                return 'הושלם';
            case 'cancelled':
                return 'בוטל';
            default:
                return status;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <Pending />;
            case 'confirmed':
                return <CheckCircle />;
            case 'completed':
                return <CheckCircle />;
            case 'cancelled':
                return <Cancel />;
            default:
                return <Schedule />;
        }
    };

    const formatAppointmentTime = (startTime) => {
        const date = new Date(startTime);
        const now = new Date();

        if (isToday(date)) {
            return `היום ${format(date, 'HH:mm', { locale: he })}`;
        } else if (isTomorrow(date)) {
            return `מחר ${format(date, 'HH:mm', { locale: he })}`;
        } else if (isYesterday(date)) {
            return `אתמול ${format(date, 'HH:mm', { locale: he })}`;
        } else {
            return format(date, 'dd/MM HH:mm', { locale: he });
        }
    };

    const handleViewAll = () => {
        navigate('/dashboard/calendar');
    };

    const handleAppointmentClick = (appointment) => {
        navigate(`/dashboard/calendar?appointment=${appointment._id}`);
    };

    if (loading) {
        return (
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                        <CircularProgress />
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent>
                    <Alert severity="error">{error}</Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader
                title="פגישות קרובות"
                action={
                    <Button
                        size="small"
                        endIcon={<ArrowForward />}
                        onClick={handleViewAll}
                    >
                        הצג הכל
                    </Button>
                }
            />
            <CardContent>
                {appointments.length === 0 ? (
                    <Box textAlign="center" py={3}>
                        <CalendarToday sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                            אין פגישות קרובות
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate('/dashboard/calendar')}
                            sx={{ mt: 2 }}
                        >
                            קבע פגישה חדשה
                        </Button>
                    </Box>
                ) : (
                    <List disablePadding>
                        {appointments.map((appointment, index) => (
                            <React.Fragment key={appointment._id}>
                                <ListItem
                                    button
                                    onClick={() => handleAppointmentClick(appointment)}
                                    sx={{
                                        borderRadius: 1,
                                        mb: 1,
                                        '&:hover': {
                                            backgroundColor: 'action.hover'
                                        }
                                    }}
                                >
                                    <ListItemIcon>
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: getStatusColor(appointment.status) + '.main',
                                                color: 'white'
                                            }}
                                        >
                                            {getStatusIcon(appointment.status)}
                                        </Avatar>
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography variant="subtitle2" noWrap>
                                                    {appointment.clientId?.firstName} {appointment.clientId?.lastName}
                                                </Typography>
                                                <Chip
                                                    label={getStatusText(appointment.status)}
                                                    size="small"
                                                    color={getStatusColor(appointment.status)}
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <AccessTime sx={{ fontSize: 14 }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatAppointmentTime(appointment.startTime)}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {appointment.serviceType}
                                                </Typography>
                                            </Box>
                                        }
                                    />

                                    <ListItemSecondaryAction>
                                        <Tooltip title="פתח פגישה">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAppointmentClick(appointment);
                                                }}
                                            >
                                                <MoreVert />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>

                                {index < appointments.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};

export default UpcomingAppointments;
