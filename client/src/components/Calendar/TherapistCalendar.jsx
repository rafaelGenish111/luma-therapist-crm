import React, { useState, useMemo, useCallback } from 'react';
import {
    Calendar,
    momentLocalizer,
    Views
} from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/he';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import {
    Box,
    Paper,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    InputAdornment,
    Button,
    ButtonGroup,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Skeleton,
    Card,
    CardContent,
    Divider,
    Switch,
    FormControlLabel,
    Autocomplete
} from '@mui/material';

import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Sync as SyncIcon,
    SyncProblem as SyncProblemIcon,
    Event as EventIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
    LocationOn as LocationIcon,
    VideoCall as VideoCallIcon,
    Home as HomeIcon,
    Business as BusinessIcon,
    Refresh as RefreshIcon,
    ViewDay as ViewDayIcon,
    ViewWeek as ViewWeekIcon,
    ViewModule as ViewModuleIcon,
    CalendarToday as CalendarTodayIcon,
    NavigateBefore as NavigateBeforeIcon,
    NavigateNext as NavigateNextIcon,
    Today as TodayIcon
} from '@mui/icons-material';

// הגדרת moment לעברית
moment.locale('he');

const localizer = momentLocalizer(moment);

// צבעים לפי סטטוס
const STATUS_COLORS = {
    pending: '#FFA726',
    confirmed: '#66BB6A',
    completed: '#BDBDBD',
    cancelled: '#EF5350',
    no_show: '#9C27B0'
};

// צבעים לפי סוג שירות
const SERVICE_COLORS = {
    individual: '#2196F3',
    couple: '#FF9800',
    family: '#4CAF50',
    group: '#9C27B0',
    workshop: '#607D8B'
};

// צבעים לפי מיקום
const LOCATION_COLORS = {
    online: '#00BCD4',
    clinic: '#4CAF50',
    home: '#FF9800'
};

const TherapistCalendar = ({
    appointments = [],
    onSelectSlot,
    onSelectEvent,
    onEventDrop,
    onDateSelect,
    loading = false,
    view = Views.MONTH,
    onViewChange,
    date = new Date(),
    selectedDate,
    onNavigate,
    clients = [],
    onRefresh,
    onSyncWithGoogle,
    syncStatus = 'idle'
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [serviceFilter, setServiceFilter] = useState('all');
    const [clientFilter, setClientFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showSyncStatus, setShowSyncStatus] = useState(true);

    // סינון פגישות
    const filteredAppointments = useMemo(() => {
        console.log('🔍 Filtering appointments, total:', appointments.length);
        return appointments.filter(appointment => {
            const clientName = appointment.client 
                ? `${appointment.client.firstName || ''} ${appointment.client.lastName || ''}`.trim()
                : appointment.clientName || '';
            
            const matchesSearch = !searchTerm ||
                clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
            const matchesService = serviceFilter === 'all' || appointment.serviceType === serviceFilter;
            const matchesClient = clientFilter === 'all' || 
                appointment.clientId === clientFilter || 
                appointment.client?._id === clientFilter;

            return matchesSearch && matchesStatus && matchesService && matchesClient;
        });
    }, [appointments, searchTerm, statusFilter, serviceFilter, clientFilter]);

    // המרת פגישות לפורמט של react-big-calendar
    const events = useMemo(() => {
        console.log('🗓️ Converting appointments to events:', filteredAppointments.length);
        return filteredAppointments.map(appointment => {
            const clientName = appointment.client 
                ? `${appointment.client.firstName || ''} ${appointment.client.lastName || ''}`.trim()
                : appointment.clientName || 'לקוח לא מוגדר';
            
            const startDate = appointment.startTime || appointment.date;
            const endDate = appointment.endTime || new Date(new Date(startDate).getTime() + (appointment.duration || 60) * 60000);
            
            console.log('📅 Event:', {
                id: appointment._id,
                title: clientName,
                start: startDate,
                end: endDate,
                serviceType: appointment.serviceType
            });
            
            return {
                id: appointment._id,
                title: clientName,
                start: new Date(startDate),
                end: new Date(endDate),
                resource: {
                    ...appointment,
                    clientName,
                    status: appointment.status,
                    serviceType: appointment.serviceType,
                    location: appointment.location,
                    googleCalendarSynced: appointment.googleCalendarSynced,
                    meetingUrl: appointment.meetingUrl,
                    notes: appointment.notes,
                    privateNotes: appointment.privateNotes,
                    paymentStatus: appointment.paymentStatus,
                    paymentAmount: appointment.paymentAmount
                }
            };
        });
    }, [filteredAppointments]);

    // סגנון אירועים
    const eventStyleGetter = useCallback((event) => {
        const { status, serviceType, location, googleCalendarSynced } = event.resource;

        let backgroundColor = STATUS_COLORS[status] || '#2196F3';
        let borderColor = backgroundColor;

        // אם לא סונכרן עם Google, הוסף קו מקווקו
        if (!googleCalendarSynced && status !== 'cancelled') {
            borderColor = '#FF5722';
            backgroundColor = `${backgroundColor}80`; // שקיפות
        }

        return {
            style: {
                backgroundColor,
                borderColor,
                borderWidth: googleCalendarSynced ? '1px' : '2px',
                borderStyle: googleCalendarSynced ? 'solid' : 'dashed',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '500'
            }
        };
    }, []);

    // טיפול בבחירת slot ריק
    const handleSelectSlot = useCallback((slotInfo) => {
        if (onSelectSlot) {
            onSelectSlot(slotInfo);
        }
        // גם עדכן את התאריך הנבחר
        if (onDateSelect) {
            onDateSelect(slotInfo.start);
        }
    }, [onSelectSlot, onDateSelect]);

    // טיפול בבחירת אירוע
    const handleSelectEvent = useCallback((event) => {
        if (onSelectEvent) {
            onSelectEvent(event);
        }
        // גם עדכן את התאריך הנבחר
        if (onDateSelect) {
            onDateSelect(event.start);
        }
    }, [onSelectEvent, onDateSelect]);

    // טיפול בגרירת אירוע
    const handleEventDrop = useCallback((event) => {
        if (onEventDrop) {
            onEventDrop(event);
        }
    }, [onEventDrop]);

    // טיפול בלחיצה על תאריך
    const handleNavigate = useCallback((newDate) => {
        if (onNavigate) {
            onNavigate(newDate);
        }
        // עדכן את התאריך הנבחר
        if (onDateSelect) {
            onDateSelect(newDate);
        }
    }, [onNavigate, onDateSelect]);

    // רכיב Toolbar מותאם אישית
    const CustomToolbar = useCallback(({ label, onNavigate, onView, view }) => (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" component="div">
                    {label}
                </Typography>
                <ButtonGroup size="small">
                    <Button
                        variant={view === Views.DAY ? 'contained' : 'outlined'}
                        onClick={() => onView(Views.DAY)}
                        startIcon={<ViewDayIcon />}
                    >
                        יום
                    </Button>
                    <Button
                        variant={view === Views.WEEK ? 'contained' : 'outlined'}
                        onClick={() => onView(Views.WEEK)}
                        startIcon={<ViewWeekIcon />}
                    >
                        שבוע
                    </Button>
                    <Button
                        variant={view === Views.MONTH ? 'contained' : 'outlined'}
                        onClick={() => onView(Views.MONTH)}
                        startIcon={<ViewModuleIcon />}
                    >
                        חודש
                    </Button>
                </ButtonGroup>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={() => onNavigate('PREV')} size="small">
                    <NavigateBeforeIcon />
                </IconButton>
                <IconButton onClick={() => onNavigate('TODAY')} size="small">
                    <TodayIcon />
                </IconButton>
                <IconButton onClick={() => onNavigate('NEXT')} size="small">
                    <NavigateNextIcon />
                </IconButton>
            </Box>
        </Box>
    ), []);

    // רכיב Event מותאם אישית
    const CustomEvent = useCallback(({ event }) => {
        const { status, serviceType, location, googleCalendarSynced, meetingUrl } = event.resource;

        const getLocationIcon = () => {
            switch (location) {
                case 'online': return <VideoCallIcon sx={{ fontSize: 12 }} />;
                case 'home': return <HomeIcon sx={{ fontSize: 12 }} />;
                case 'clinic': return <BusinessIcon sx={{ fontSize: 12 }} />;
                default: return <LocationIcon sx={{ fontSize: 12 }} />;
            }
        };

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.5 }}>
                {!googleCalendarSynced && (
                    <SyncProblemIcon sx={{ fontSize: 12, color: '#FF5722' }} />
                )}
                {getLocationIcon()}
                <Typography variant="caption" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {event.title}
                </Typography>
            </Box>
        );
    }, []);

    // סטטיסטיקות
    const stats = useMemo(() => {
        const total = filteredAppointments.length;
        const byStatus = filteredAppointments.reduce((acc, apt) => {
            acc[apt.status] = (acc[apt.status] || 0) + 1;
            return acc;
        }, {});
        const synced = filteredAppointments.filter(apt => apt.googleCalendarSynced).length;

        return { total, byStatus, synced };
    }, [filteredAppointments]);

    if (loading) {
        return (
            <Paper sx={{ p: 3 }}>
                <Skeleton variant="rectangular" height={600} />
            </Paper>
        );
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* סרגל כלים עליון */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    {/* חיפוש וסינונים */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <TextField
                            size="small"
                            placeholder="חיפוש פגישות..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ minWidth: 200 }}
                        />

                        <IconButton
                            onClick={() => setShowFilters(!showFilters)}
                            color={showFilters ? 'primary' : 'default'}
                        >
                            <FilterIcon />
                        </IconButton>

                        <IconButton onClick={onRefresh} disabled={loading}>
                            <RefreshIcon />
                        </IconButton>
                    </Box>

                    {/* סטטוס סנכרון */}
                    {showSyncStatus && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={showSyncStatus}
                                        onChange={(e) => setShowSyncStatus(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="הצג סטטוס סנכרון"
                            />
                            {syncStatus === 'syncing' && <CircularProgress size={20} />}
                            {syncStatus === 'error' && (
                                <Tooltip title="שגיאה בסנכרון">
                                    <SyncProblemIcon color="error" />
                                </Tooltip>
                            )}
                        </Box>
                    )}
                </Box>

                {/* סינונים מתקדמים */}
                {showFilters && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>סטטוס</InputLabel>
                            <Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                label="סטטוס"
                            >
                                <MenuItem value="all">הכל</MenuItem>
                                <MenuItem value="pending">ממתין</MenuItem>
                                <MenuItem value="confirmed">מאושר</MenuItem>
                                <MenuItem value="completed">הושלם</MenuItem>
                                <MenuItem value="cancelled">בוטל</MenuItem>
                                <MenuItem value="no_show">לא הגיע</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>סוג שירות</InputLabel>
                            <Select
                                value={serviceFilter}
                                onChange={(e) => setServiceFilter(e.target.value)}
                                label="סוג שירות"
                            >
                                <MenuItem value="all">הכל</MenuItem>
                                <MenuItem value="individual">אישי</MenuItem>
                                <MenuItem value="couple">זוגי</MenuItem>
                                <MenuItem value="family">משפחתי</MenuItem>
                                <MenuItem value="group">קבוצתי</MenuItem>
                                <MenuItem value="workshop">סדנה</MenuItem>
                            </Select>
                        </FormControl>

                        <Autocomplete
                            size="small"
                            options={clients}
                            getOptionLabel={(option) => option.name || option.firstName + ' ' + option.lastName}
                            value={clientFilter === 'all' ? null : clients.find(c => c._id === clientFilter)}
                            onChange={(event, newValue) => {
                                setClientFilter(newValue ? newValue._id : 'all');
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="לקוח"
                                    sx={{ minWidth: 150 }}
                                />
                            )}
                        />
                    </Box>
                )}

                {/* סטטיסטיקות */}
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                        label={`סה"כ: ${stats.total}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                    {Object.entries(stats.byStatus).map(([status, count]) => (
                        <Chip
                            key={status}
                            label={`${status}: ${count}`}
                            size="small"
                            sx={{
                                backgroundColor: STATUS_COLORS[status],
                                color: 'white'
                            }}
                        />
                    ))}
                    <Chip
                        label={`מסונכרן: ${stats.synced}/${stats.total}`}
                        size="small"
                        color={stats.synced === stats.total ? 'success' : 'warning'}
                        variant="outlined"
                    />
                </Box>
            </Paper>

            {/* יומן */}
            <Paper sx={{ flex: 1, overflow: 'hidden' }}>
                <Box sx={{ height: '100%', p: 2 }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        view={view}
                        onView={onViewChange}
                        date={date}
                        onNavigate={handleNavigate}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        onEventDrop={handleEventDrop}
                        selectable
                        resizable
                        draggableAccessor={() => true}
                        eventPropGetter={eventStyleGetter}
                        components={{
                            toolbar: CustomToolbar,
                            event: CustomEvent
                        }}
                        messages={{
                            next: 'הבא',
                            previous: 'הקודם',
                            today: 'היום',
                            month: 'חודש',
                            week: 'שבוע',
                            day: 'יום',
                            agenda: 'סדר יום',
                            date: 'תאריך',
                            time: 'שעה',
                            event: 'אירוע',
                            noEventsInRange: 'אין פגישות בתקופה זו',
                            showMore: (total) => `+${total} נוספות`
                        }}
                        rtl={true}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default TherapistCalendar;
