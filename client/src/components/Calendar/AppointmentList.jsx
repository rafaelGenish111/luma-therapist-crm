import React, { useState, useMemo } from 'react';
import moment from 'moment';
import 'moment/locale/he';

import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TableSortLabel,
    IconButton,
    Button,
    Chip,
    Avatar,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    Tooltip,
    Menu,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Skeleton,
    Stack,
    Divider,
    Card,
    CardContent,
    CardHeader,
    InputAdornment,
    FormControlLabel,
    Switch,
    Badge,
    Snackbar
} from '@mui/material';

import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Cancel as CancelIcon,
    CheckCircle as CheckCircleIcon,
    Send as SendIcon,
    ContentCopy as CopyIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
    LocationOn as LocationIcon,
    VideoCall as VideoCallIcon,
    Home as HomeIcon,
    Business as BusinessIcon,
    Sync as SyncIcon,
    SyncProblem as SyncProblemIcon,
    Payment as PaymentIcon,
    AccessTime as AccessTimeIcon,
    CalendarToday as CalendarTodayIcon,
    Event as EventIcon,
    Warning as WarningIcon,
    Info as InfoIcon
} from '@mui/icons-material';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

moment.locale('he');

const AppointmentList = ({
    appointments = [],
    clients = [],
    loading = false,
    onEdit,
    onDelete,
    onView,
    onCancel,
    onComplete,
    onSendReminder,
    onCopyMeetingLink,
    onBulkAction,
    onExport,
    onRefresh,
    page = 0,
    rowsPerPage = 20,
    totalCount = 0,
    onPageChange,
    onRowsPerPageChange
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [serviceFilter, setServiceFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [syncFilter, setSyncFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [sortBy, setSortBy] = useState('startTime');
    const [sortOrder, setSortOrder] = useState('asc');
    const [selectedAppointments, setSelectedAppointments] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [bulkActionDialog, setBulkActionDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // סינון ומיון פגישות
    const filteredAndSortedAppointments = useMemo(() => {
        let filtered = appointments.filter(appointment => {
            const matchesSearch = !searchTerm ||
                appointment.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
            const matchesService = serviceFilter === 'all' || appointment.serviceType === serviceFilter;
            const matchesPayment = paymentFilter === 'all' || appointment.paymentStatus === paymentFilter;
            const matchesSync = syncFilter === 'all' ||
                (syncFilter === 'synced' && appointment.googleCalendarSynced) ||
                (syncFilter === 'not_synced' && !appointment.googleCalendarSynced);

            const appointmentDate = moment(appointment.startTime || appointment.date);
            const matchesDateRange = (!dateRange.start || appointmentDate.isSameOrAfter(dateRange.start, 'day')) &&
                (!dateRange.end || appointmentDate.isSameOrBefore(dateRange.end, 'day'));

            return matchesSearch && matchesStatus && matchesService && matchesPayment && matchesSync && matchesDateRange;
        });

        // מיון
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'startTime':
                    aValue = new Date(a.startTime || a.date);
                    bValue = new Date(b.startTime || b.date);
                    break;
                case 'clientName':
                    aValue = a.clientName || '';
                    bValue = b.clientName || '';
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'paymentStatus':
                    aValue = a.paymentStatus;
                    bValue = b.paymentStatus;
                    break;
                default:
                    aValue = a[sortBy];
                    bValue = b[sortBy];
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [appointments, searchTerm, statusFilter, serviceFilter, paymentFilter, syncFilter, dateRange, sortBy, sortOrder]);

    // טיפול במיון
    const handleSort = (property) => {
        if (sortBy === property) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(property);
            setSortOrder('asc');
        }
    };

    // טיפול בבחירת פגישות
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedAppointments(filteredAndSortedAppointments.map(apt => apt._id));
        } else {
            setSelectedAppointments([]);
        }
    };

    const handleSelectOne = (appointmentId) => {
        setSelectedAppointments(prev =>
            prev.includes(appointmentId)
                ? prev.filter(id => id !== appointmentId)
                : [...prev, appointmentId]
        );
    };

    // פעולות על פגישה בודדת
    const handleAppointmentAction = (action, appointment) => {
        switch (action) {
            case 'view':
                onView?.(appointment);
                break;
            case 'edit':
                onEdit?.(appointment);
                break;
            case 'delete':
                if (window.confirm('האם אתה בטוח שברצונך למחוק את הפגישה?')) {
                    onDelete?.(appointment._id);
                }
                break;
            case 'cancel':
                if (window.confirm('האם אתה בטוח שברצונך לבטל את הפגישה?')) {
                    onCancel?.(appointment._id);
                }
                break;
            case 'complete':
                onComplete?.(appointment._id);
                break;
            case 'reminder':
                onSendReminder?.(appointment._id);
                break;
            case 'copy_link':
                onCopyMeetingLink?.(appointment);
                break;
        }
        setAnchorEl(null);
    };

    // פעולות על מספר פגישות
    const handleBulkAction = (action) => {
        if (selectedAppointments.length === 0) return;

        setBulkActionDialog(true);
        // כאן יהיה הטיפול בפעולות על מספר פגישות
    };

    // קבלת צבע סטטוס
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'confirmed': return 'success';
            case 'completed': return 'info';
            case 'cancelled': return 'error';
            case 'no_show': return 'secondary';
            default: return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending': return 'ממתין';
            case 'confirmed': return 'מאושר';
            case 'completed': return 'הושלם';
            case 'cancelled': return 'בוטל';
            case 'no_show': return 'לא הגיע';
            default: return status;
        }
    };

    const getServiceTypeLabel = (serviceType) => {
        switch (serviceType) {
            case 'individual': return 'אישי';
            case 'couple': return 'זוגי';
            case 'family': return 'משפחתי';
            case 'group': return 'קבוצתי';
            case 'workshop': return 'סדנה';
            default: return serviceType;
        }
    };

    const getLocationIcon = (location) => {
        switch (location) {
            case 'online': return <VideoCallIcon fontSize="small" />;
            case 'home': return <HomeIcon fontSize="small" />;
            case 'clinic': return <BusinessIcon fontSize="small" />;
            default: return <LocationIcon fontSize="small" />;
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'success';
            case 'unpaid': return 'warning';
            case 'refunded': return 'error';
            default: return 'default';
        }
    };

    const getPaymentStatusLabel = (status) => {
        switch (status) {
            case 'paid': return 'שולם';
            case 'unpaid': return 'לא שולם';
            case 'refunded': return 'הוחזר';
            default: return status;
        }
    };

    // רכיב טעינה
    const LoadingSkeleton = () => (
        <TableRow>
            {Array.from({ length: 8 }).map((_, index) => (
                <TableCell key={index}>
                    <Skeleton variant="text" />
                </TableCell>
            ))}
        </TableRow>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="he">
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    רשימת פגישות
                </Typography>

                {/* סרגל כלים */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                        {/* חיפוש */}
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

                        {/* סינונים */}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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

                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>תשלום</InputLabel>
                                <Select
                                    value={paymentFilter}
                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                    label="תשלום"
                                >
                                    <MenuItem value="all">הכל</MenuItem>
                                    <MenuItem value="paid">שולם</MenuItem>
                                    <MenuItem value="unpaid">לא שולם</MenuItem>
                                    <MenuItem value="refunded">הוחזר</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>סנכרון</InputLabel>
                                <Select
                                    value={syncFilter}
                                    onChange={(e) => setSyncFilter(e.target.value)}
                                    label="סנכרון"
                                >
                                    <MenuItem value="all">הכל</MenuItem>
                                    <MenuItem value="synced">מסונכרן</MenuItem>
                                    <MenuItem value="not_synced">לא מסונכרן</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* פעולות */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton onClick={onRefresh} disabled={loading}>
                                <RefreshIcon />
                            </IconButton>

                            {selectedAppointments.length > 0 && (
                                <Button
                                    onClick={() => handleBulkAction('status')}
                                    startIcon={<EditIcon />}
                                    variant="outlined"
                                    size="small"
                                >
                                    פעולות על {selectedAppointments.length}
                                </Button>
                            )}

                            <Button
                                onClick={onExport}
                                startIcon={<DownloadIcon />}
                                variant="outlined"
                                size="small"
                            >
                                ייצא ל-CSV
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                {/* טבלה */}
                <Paper>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={selectedAppointments.length > 0 && selectedAppointments.length < filteredAndSortedAppointments.length}
                                            checked={filteredAndSortedAppointments.length > 0 && selectedAppointments.length === filteredAndSortedAppointments.length}
                                            onChange={handleSelectAll}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortBy === 'startTime'}
                                            direction={sortBy === 'startTime' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('startTime')}
                                        >
                                            תאריך ושעה
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortBy === 'clientName'}
                                            direction={sortBy === 'clientName' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('clientName')}
                                        >
                                            לקוח
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>סוג שירות</TableCell>
                                    <TableCell>משך</TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortBy === 'status'}
                                            direction={sortBy === 'status' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('status')}
                                        >
                                            סטטוס
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortBy === 'paymentStatus'}
                                            direction={sortBy === 'paymentStatus' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('paymentStatus')}
                                        >
                                            תשלום
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>סנכרון</TableCell>
                                    <TableCell align="center">פעולות</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: rowsPerPage }).map((_, index) => (
                                        <LoadingSkeleton key={index} />
                                    ))
                                ) : filteredAndSortedAppointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <EventIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                                <Typography variant="h6" color="text.secondary">
                                                    אין פגישות
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    לא נמצאו פגישות התואמות את הסינונים
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAndSortedAppointments.map((appointment) => (
                                        <TableRow key={appointment._id} hover>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedAppointments.includes(appointment._id)}
                                                    onChange={() => handleSelectOne(appointment._id)}
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {moment(appointment.startTime || appointment.date).format('DD/MM/YYYY')}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {moment(appointment.startTime || appointment.date).format('HH:mm')}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 32, height: 32 }}>
                                                        <PersonIcon fontSize="small" />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2">
                                                            {appointment.clientName || 'לקוח לא מוגדר'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {appointment.clientPhone || ''}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    label={getServiceTypeLabel(appointment.serviceType)}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <AccessTimeIcon fontSize="small" />
                                                    <Typography variant="body2">
                                                        {appointment.duration} דק'
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    label={getStatusLabel(appointment.status)}
                                                    color={getStatusColor(appointment.status)}
                                                    size="small"
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Chip
                                                        label={getPaymentStatusLabel(appointment.paymentStatus)}
                                                        color={getPaymentStatusColor(appointment.paymentStatus)}
                                                        size="small"
                                                    />
                                                    {appointment.paymentAmount && (
                                                        <Typography variant="caption">
                                                            ₪{appointment.paymentAmount}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    {appointment.googleCalendarSynced ? (
                                                        <Tooltip title="מסונכרן עם Google Calendar">
                                                            <SyncIcon color="success" fontSize="small" />
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip title="לא מסונכרן עם Google Calendar">
                                                            <SyncProblemIcon color="warning" fontSize="small" />
                                                        </Tooltip>
                                                    )}
                                                    {getLocationIcon(appointment.location)}
                                                </Box>
                                            </TableCell>

                                            <TableCell align="center">
                                                <IconButton
                                                    onClick={(e) => setAnchorEl({ [appointment._id]: e.currentTarget })}
                                                    size="small"
                                                >
                                                    <MoreVertIcon />
                                                </IconButton>

                                                <Menu
                                                    anchorEl={anchorEl?.[appointment._id]}
                                                    open={Boolean(anchorEl?.[appointment._id])}
                                                    onClose={() => setAnchorEl(null)}
                                                >
                                                    <MenuItem onClick={() => handleAppointmentAction('view', appointment)}>
                                                        <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
                                                        <ListItemText>צפה</ListItemText>
                                                    </MenuItem>
                                                    <MenuItem onClick={() => handleAppointmentAction('edit', appointment)}>
                                                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                                                        <ListItemText>ערוך</ListItemText>
                                                    </MenuItem>
                                                    <MenuItem onClick={() => handleAppointmentAction('reminder', appointment)}>
                                                        <ListItemIcon><SendIcon fontSize="small" /></ListItemIcon>
                                                        <ListItemText>שלח תזכורת</ListItemText>
                                                    </MenuItem>
                                                    {appointment.meetingUrl && (
                                                        <MenuItem onClick={() => handleAppointmentAction('copy_link', appointment)}>
                                                            <ListItemIcon><CopyIcon fontSize="small" /></ListItemIcon>
                                                            <ListItemText>העתק קישור</ListItemText>
                                                        </MenuItem>
                                                    )}
                                                    {appointment.status === 'confirmed' && (
                                                        <MenuItem onClick={() => handleAppointmentAction('complete', appointment)}>
                                                            <ListItemIcon><CheckCircleIcon fontSize="small" /></ListItemIcon>
                                                            <ListItemText>סמן כהושלם</ListItemText>
                                                        </MenuItem>
                                                    )}
                                                    {appointment.status !== 'cancelled' && (
                                                        <MenuItem onClick={() => handleAppointmentAction('cancel', appointment)}>
                                                            <ListItemIcon><CancelIcon fontSize="small" /></ListItemIcon>
                                                            <ListItemText>בטל</ListItemText>
                                                        </MenuItem>
                                                    )}
                                                    <MenuItem onClick={() => handleAppointmentAction('delete', appointment)}>
                                                        <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
                                                        <ListItemText>מחק</ListItemText>
                                                    </MenuItem>
                                                </Menu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[10, 20, 50, 100]}
                        component="div"
                        count={totalCount}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(event, newPage) => onPageChange?.(newPage)}
                        onRowsPerPageChange={(event) => onRowsPerPageChange?.(parseInt(event.target.value, 10))}
                        labelRowsPerPage="שורות בעמוד:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
                    />
                </Paper>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    <Alert
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default AppointmentList;
