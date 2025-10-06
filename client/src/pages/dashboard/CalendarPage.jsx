import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    IconButton,
    Paper,
    Grid,
    Card,
    CardContent,
    Chip,
    TextField,
    InputAdornment,
    FormControl,
    FormLabel,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Divider,
    Tooltip,
    Badge,
    CircularProgress,
    Alert,
    useTheme,
    useMediaQuery,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemButton
} from '@mui/material';
import {
    CalendarToday,
    Add,
    Sync,
    Settings,
    FilterList,
    Today,
    NavigateBefore,
    NavigateNext,
    Today as ViewDay,
    CalendarViewWeek as ViewWeek,
    CalendarMonth as ViewMonth,
    List as ViewList,
    AccessTime,
    Person,
    AttachMoney,
    CheckCircle,
    Pending,
    Cancel,
    Block,
    Schedule,
    TrendingUp,
    Refresh,
    KeyboardArrowDown,
    KeyboardArrowUp
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import 'moment/locale/he';

// Set Hebrew as default locale
moment.locale('he');
// Remove date-fns imports - using moment instead
import api from '../../services/api';

// Import existing components
import TherapistCalendar from '../../components/Calendar/TherapistCalendar';
import AppointmentModal from '../../components/Calendar/AppointmentModal';
import AvailabilitySettings from '../../components/Calendar/AvailabilitySettings';
import MiniCalendar from '../../components/Calendar/MiniCalendar';
import '../../styles/calendar.css';

const CalendarPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // State management
    const [appointments, setAppointments] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentDate, setCurrentDate] = useState(moment());
    const [view, setView] = useState('month');
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);
    const [showSyncStatus, setShowSyncStatus] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

    // Filters
    const [filters, setFilters] = useState({
        status: {
            pending: true,
            confirmed: true,
            completed: true,
            cancelled: false
        },
        serviceType: {
            individual: true,
            couple: true,
            family: true,
            group: true,
            consultation: true
        },
        clientSearch: ''
    });

    // Stats
    const [stats, setStats] = useState({
        totalToday: 0,
        completed: 0,
        pending: 0,
        cancelled: 0,
        revenueToday: 0
    });

    // Sync status
    const [syncStatus, setSyncStatus] = useState({
        connected: false,
        lastSynced: null,
        syncing: false
    });

    // Load appointments
    const loadAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const startDate = moment(currentDate).startOf('day').toDate();
            const endDate = moment(currentDate).endOf('day').toDate();

            const response = await api.get('/appointments', {
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    ...filters
                }
            });

            setAppointments(response.data.data || []);
        } catch (err) {
            setError('שגיאה בטעינת הפגישות');
            console.error('Error loading appointments:', err);
        } finally {
            setLoading(false);
        }
    }, [currentDate, filters]);

    // Load stats
    const loadStats = useCallback(async () => {
        try {
            const today = moment().startOf('day').toDate();
            const response = await api.get('/appointments/stats', {
                params: { date: today.toISOString() }
            });

            setStats(response.data);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    }, []);

    // Load sync status
    const loadSyncStatus = useCallback(async () => {
        try {
            const response = await api.get('/calendar/sync-status');
            setSyncStatus(response.data);
        } catch (err) {
            console.error('Error loading sync status:', err);
        }
    }, []);

    // Effects
    useEffect(() => {
        loadAppointments();
        // טען לקוחות להצגת רשימה נפתחת בטופס
        (async () => {
            try {
                const res = await api.get('/clients');
                const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.clients || []);
                setClients(list);
            } catch (e) {
                console.error('שגיאה בטעינת לקוחות:', e);
                setClients([]);
            }
        })();
    }, [loadAppointments]);

    useEffect(() => {
        loadStats();
        loadSyncStatus();
    }, [loadStats, loadSyncStatus]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            loadAppointments();
            loadStats();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [loadAppointments, loadStats]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key.toLowerCase()) {
                case 'n':
                    handleNewAppointment();
                    break;
                case 't':
                    setCurrentDate(moment());
                    break;
                case 'arrowleft':
                    handlePreviousDate();
                    break;
                case 'arrowright':
                    handleNextDate();
                    break;
                case 's':
                    handleSyncNow();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    // Event handlers
    const handleNewAppointment = () => {
        setSelectedAppointment(null);
        setShowAppointmentModal(true);
    };

    const handleSelectSlot = (slotInfo) => {
        setSelectedAppointment({
            startTime: slotInfo.start,
            endTime: slotInfo.end
        });
        setShowAppointmentModal(true);
    };

    const handleSelectEvent = (event) => {
        setSelectedAppointment(event);
        setShowAppointmentModal(true);
    };

    const handleEventDrop = async (event) => {
        try {
            await api.put(`/appointments/${event._id}`, {
                startTime: event.startTime,
                endTime: event.endTime
            });
            loadAppointments();
        } catch (err) {
            setError('שגיאה בעדכון הפגישה');
        }
    };

    const handleSyncNow = async () => {
        try {
            setSyncStatus(prev => ({ ...prev, syncing: true }));
            await api.post('/calendar/sync');
            await loadSyncStatus();
            await loadAppointments();
        } catch (err) {
            setError('שגיאה בסנכרון');
        } finally {
            setSyncStatus(prev => ({ ...prev, syncing: false }));
        }
    };

    const handlePreviousDate = () => {
        if (view === 'day') {
            setCurrentDate(moment(currentDate).subtract(1, 'day'));
        } else if (view === 'week') {
            setCurrentDate(moment(currentDate).subtract(1, 'week'));
        } else {
            setCurrentDate(moment(currentDate).subtract(1, 'month'));
        }
    };

    const handleNextDate = () => {
        if (view === 'day') {
            setCurrentDate(moment(currentDate).add(1, 'day'));
        } else if (view === 'week') {
            setCurrentDate(moment(currentDate).add(1, 'week'));
        } else {
            setCurrentDate(moment(currentDate).add(1, 'month'));
        }
    };

    const handleFilterChange = (filterType, key, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: {
                ...prev[filterType],
                [key]: value
            }
        }));
    };

    const clearFilters = () => {
        setFilters({
            status: {
                pending: true,
                confirmed: true,
                completed: true,
                cancelled: false
            },
            serviceType: {
                individual: true,
                couple: true,
                family: true,
                group: true,
                consultation: true
            },
            clientSearch: ''
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'confirmed': return 'success';
            case 'completed': return 'info';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'ממתין';
            case 'confirmed': return 'מאושר';
            case 'completed': return 'הושלם';
            case 'cancelled': return 'בוטל';
            default: return status;
        }
    };

    const Sidebar = () => (
        <Box sx={{ width: 250, p: 2 }}>
            {/* Mini Calendar */}
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        יומן קטן
                    </Typography>
                    <MiniCalendar
                        currentDate={currentDate}
                        onDateChange={setCurrentDate}
                        appointments={appointments}
                    />
                </CardContent>
            </Card>

            {/* Filters */}
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                            סינון
                        </Typography>
                        <Button size="small" onClick={clearFilters}>
                            נקה הכל
                        </Button>
                    </Box>

                    {/* Status Filters */}
                    <FormControl component="fieldset" sx={{ mb: 2 }}>
                        <FormLabel component="legend">סטטוס</FormLabel>
                        <FormGroup>
                            {Object.entries(filters.status).map(([key, value]) => (
                                <FormControlLabel
                                    key={key}
                                    control={
                                        <Checkbox
                                            checked={value}
                                            onChange={(e) => handleFilterChange('status', key, e.target.checked)}
                                            size="small"
                                        />
                                    }
                                    label={getStatusText(key)}
                                />
                            ))}
                        </FormGroup>
                    </FormControl>

                    {/* Service Type Filters */}
                    <FormControl component="fieldset" sx={{ mb: 2 }}>
                        <FormLabel component="legend">סוג שירות</FormLabel>
                        <FormGroup>
                            {Object.entries(filters.serviceType).map(([key, value]) => (
                                <FormControlLabel
                                    key={key}
                                    control={
                                        <Checkbox
                                            checked={value}
                                            onChange={(e) => handleFilterChange('serviceType', key, e.target.checked)}
                                            size="small"
                                        />
                                    }
                                    label={key}
                                />
                            ))}
                        </FormGroup>
                    </FormControl>

                    {/* Client Search */}
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="חיפוש לקוח..."
                        value={filters.clientSearch}
                        onChange={(e) => setFilters(prev => ({ ...prev, clientSearch: e.target.value }))}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Person />
                                </InputAdornment>
                            )
                        }}
                    />
                </CardContent>
            </Card>

            {/* Today's Stats */}
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        סטטיסטיקות היום
                    </Typography>

                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">סה"כ פגישות:</Typography>
                        <Typography variant="body2" fontWeight="bold">{stats.totalToday}</Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="success.main">הושלמו:</Typography>
                        <Typography variant="body2" fontWeight="bold">{stats.completed}</Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="warning.main">ממתינים:</Typography>
                        <Typography variant="body2" fontWeight="bold">{stats.pending}</Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="error.main">בוטלו:</Typography>
                        <Typography variant="body2" fontWeight="bold">{stats.cancelled}</Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="primary.main">הכנסות היום:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                            ₪{stats.revenueToday}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        פעולות מהירות
                    </Typography>

                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Schedule />}
                        onClick={() => setShowAvailabilityModal(true)}
                        sx={{ mb: 1 }}
                    >
                        הגדר זמינות
                    </Button>

                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Block />}
                        onClick={() => setShowBlockTimeModal(true)}
                        sx={{ mb: 1 }}
                    >
                        חסום זמן
                    </Button>

                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<TrendingUp />}
                        onClick={() => navigate('/dashboard/waitlist')}
                    >
                        רשימת המתנה
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="he">
            <Container maxWidth="xl" sx={{ py: 3 }}>
                {/* Header */}
                <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="h4">
                                היומן שלי
                            </Typography>

                            {/* Quick Actions */}
                            <Box display="flex" gap={1}>
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={handleNewAppointment}
                                >
                                    פגישה חדשה
                                </Button>

                                <Tooltip title="סנכרון עם Google Calendar">
                                    <Button
                                        variant="outlined"
                                        startIcon={syncStatus.syncing ? <CircularProgress size={20} /> : <Sync />}
                                        onClick={handleSyncNow}
                                        disabled={syncStatus.syncing}
                                    >
                                        סנכרון
                                    </Button>
                                </Tooltip>

                                <IconButton onClick={() => navigate('/dashboard/calendar/settings')}>
                                    <Settings />
                                </IconButton>
                            </Box>
                        </Box>

                        {/* View Switcher */}
                        <Box display="flex" gap={1}>
                            <Button
                                variant={view === 'day' ? 'contained' : 'outlined'}
                                onClick={() => setView('day')}
                                startIcon={<ViewDay />}
                            >
                                יום
                            </Button>
                            <Button
                                variant={view === 'week' ? 'contained' : 'outlined'}
                                onClick={() => setView('week')}
                                startIcon={<ViewWeek />}
                            >
                                שבוע
                            </Button>
                            <Button
                                variant={view === 'month' ? 'contained' : 'outlined'}
                                onClick={() => setView('month')}
                                startIcon={<ViewMonth />}
                            >
                                חודש
                            </Button>
                            <Button
                                variant={view === 'list' ? 'contained' : 'outlined'}
                                onClick={() => setView('list')}
                                startIcon={<ViewList />}
                            >
                                רשימה
                            </Button>
                        </Box>
                    </Box>

                    {/* Date Navigator */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <IconButton onClick={handlePreviousDate}>
                                <NavigateBefore />
                            </IconButton>

                            <Typography variant="h6">
                                {moment(currentDate).format('MMMM YYYY')}
                            </Typography>

                            <IconButton onClick={handleNextDate}>
                                <NavigateNext />
                            </IconButton>

                            <Button
                                variant="outlined"
                                startIcon={<Today />}
                                onClick={() => setCurrentDate(moment())}
                            >
                                היום
                            </Button>
                        </Box>

                        {/* Sync Status */}
                        <Box display="flex" alignItems="center" gap={1}>
                            {syncStatus.connected ? (
                                <Chip
                                    icon={<CheckCircle />}
                                    label={`מחובר ל-Google • עודכן לפני ${syncStatus.lastSynced ? '5 דקות' : 'לא ידוע'}`}
                                    color="success"
                                    size="small"
                                />
                            ) : (
                                <Chip
                                    label="לא מחובר ל-Google"
                                    color="warning"
                                    size="small"
                                />
                            )}
                        </Box>
                    </Box>
                </Paper>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Main Content */}
                <Grid container spacing={2}>
                    {/* Main Calendar */}
                    <Grid item xs={12} md={9} order={{ xs: 2, md: 1 }}>
                        <Paper sx={{ height: 'calc(100vh - 280px)', minHeight: 500, p: 2 }}>
                            <TherapistCalendar
                                appointments={appointments}
                                currentDate={currentDate}
                                view={view}
                                onSelectSlot={handleSelectSlot}
                                onSelectEvent={handleSelectEvent}
                                onEventDrop={handleEventDrop}
                                loading={loading}
                                onViewChange={setView}
                                onNavigate={setCurrentDate}
                            />
                        </Paper>
                    </Grid>

                    {/* Sidebar */}
                    <Grid item xs={12} md={3} order={{ xs: 1, md: 2 }}>
                        {isMobile ? (
                            <Drawer
                                anchor="left"
                                open={sidebarOpen}
                                onClose={() => setSidebarOpen(false)}
                            >
                                <Box sx={{ width: 280, p: 2 }}>
                                    <Sidebar />
                                </Box>
                            </Drawer>
                        ) : (
                            <Sidebar />
                        )}
                    </Grid>
                </Grid>

                {/* Mobile Sidebar Toggle */}
                {isMobile && (
                    <Box position="fixed" bottom={16} right={16}>
                        <Tooltip title="פתח סינון">
                            <IconButton
                                color="primary"
                                onClick={() => setSidebarOpen(true)}
                                sx={{
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '&:hover': {
                                        bgcolor: 'primary.dark'
                                    }
                                }}
                            >
                                <FilterList />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}

                {/* Modals */}
                <AppointmentModal
                    open={showAppointmentModal}
                    onClose={() => setShowAppointmentModal(false)}
                    appointment={selectedAppointment}
                                clients={clients}
                                onSave={async (appointmentData) => {
                                    try {
                                        const payload = {
                                            clientId: appointmentData.clientId,
                                            serviceType: appointmentData.serviceType,
                                            startTime: appointmentData.startTime,
                                            endTime: appointmentData.endTime,
                                            duration: appointmentData.duration,
                                            location: appointmentData.location,
                                            meetingUrl: appointmentData.meetingUrl,
                                            notes: appointmentData.notes || '',
                                            privateNotes: appointmentData.privateNotes || '',
                                            paymentAmount: appointmentData.paymentAmount || 0,
                                            paymentStatus: appointmentData.paymentStatus || 'unpaid',
                                            recurringPattern: appointmentData.recurringPattern || { isRecurring: false }
                                        };

                                        await api.post('/appointments', payload);
                                        setShowAppointmentModal(false);
                                        await loadAppointments();
                                    } catch (e) {
                                        console.error('שגיאה ביצירת פגישה:', e);
                                        alert('שגיאה ביצירת פגישה');
                                    }
                                }}
                            />

                            <AvailabilitySettings
                                open={showAvailabilityModal}
                                onClose={() => setShowAvailabilityModal(false)}
                                onSave={() => {
                                    setShowAvailabilityModal(false);
                                    loadAppointments();
                                }}
                            />

                            {/* Block Time Modal - placeholder */}
                            {showBlockTimeModal && (
                                <Alert severity="info" sx={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
                                    פונקציונליות חסימת זמן תתווסף בקרוב
                                </Alert>
                            )}
                        </Container>
                    </LocalizationProvider>
                );
};

                export default CalendarPage;
