import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import moment from 'moment';
import 'moment/locale/he';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Chip,
    IconButton,
    Divider,
    Alert,
    CircularProgress,
    Autocomplete,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Card,
    CardContent,
    CardHeader,
    Tooltip,
    Snackbar,
    Collapse,
    FormGroup,
    RadioGroup,
    Radio,
    FormLabel
} from '@mui/material';

import {
    Close as CloseIcon,
    Save as SaveIcon,
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
    Send as SendIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    LocationOn as LocationIcon,
    VideoCall as VideoCallIcon,
    Home as HomeIcon,
    Business as BusinessIcon,
    Notes as NotesIcon,
    Payment as PaymentIcon,
    Sync as SyncIcon,
    SyncProblem as SyncProblemIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    AccessTime as AccessTimeIcon,
    CalendarToday as CalendarTodayIcon,
    Repeat as RepeatIcon,
    Warning as WarningIcon,
    Info as InfoIcon
} from '@mui/icons-material';

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

moment.locale('he');

// סכמת ולידציה
const appointmentSchema = yup.object({
    clientId: yup.string().required('בחירת לקוח היא חובה'),
    serviceType: yup.string().required('סוג שירות הוא חובה'),
    startTime: yup.date().required('תאריך ושעה הם חובה').min(new Date(), 'תאריך חייב להיות בעתיד'),
    duration: yup.number().required('משך פגישה הוא חובה').min(15, 'משך מינימלי: 15 דקות').max(480, 'משך מקסימלי: 8 שעות'),
    location: yup.string().required('מיקום הוא חובה'),
    meetingUrl: yup.string().when('location', {
        is: 'online',
        then: (schema) => schema.required('קישור פגישה נדרש לפגישות אונליין'),
        otherwise: (schema) => schema.notRequired()
    }),
    notes: yup.string().max(2000, 'הערות לא יכולות להכיל יותר מ-2000 תווים'),
    privateNotes: yup.string().max(2000, 'הערות פרטיות לא יכולות להכיל יותר מ-2000 תווים'),
    paymentAmount: yup.number().min(0, 'סכום תשלום לא יכול להיות שלילי'),
    recurringPattern: yup.object({
        isRecurring: yup.boolean(),
        frequency: yup.string().when('isRecurring', {
            is: true,
            then: (schema) => schema.required('תדירות היא חובה לפגישות חוזרות'),
            otherwise: (schema) => schema.notRequired()
        }),
        endDate: yup.date().when('isRecurring', {
            is: true,
            then: (schema) => schema.required('תאריך סיום הוא חובה לפגישות חוזרות'),
            otherwise: (schema) => schema.notRequired()
        })
    })
});

const AppointmentModal = ({
    open,
    onClose,
    mode = 'create', // create, edit, view
    appointment = null,
    clients = [],
    onSave,
    onDelete,
    onDuplicate,
    onSendReminder,
    loading = false,
    conflicts = [],
    availability = null
}) => {
    const [showRecurringSettings, setShowRecurringSettings] = useState(false);
    const [showConflicts, setShowConflicts] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [previewRecurring, setPreviewRecurring] = useState([]);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isDirty }
    } = useForm({
        resolver: yupResolver(appointmentSchema),
        defaultValues: {
            clientId: '',
            serviceType: 'individual',
            startTime: new Date(),
            duration: 60,
            location: 'clinic',
            meetingUrl: '',
            notes: '',
            privateNotes: '',
            paymentAmount: 0,
            paymentStatus: 'unpaid',
            recurringPattern: {
                isRecurring: false,
                frequency: 'weekly',
                endDate: null
            }
        }
    });

    const watchedValues = watch();
    const isRecurring = watch('recurringPattern.isRecurring');

    // עדכון ערכי ברירת מחדל כשהמודל נפתח
    useEffect(() => {
        if (open && appointment) {
            reset({
                clientId: appointment.clientId || appointment.client?._id || '',
                serviceType: appointment.serviceType || 'individual',
                startTime: appointment.startTime ? new Date(appointment.startTime) : new Date(),
                duration: appointment.duration || 60,
                location: appointment.location || 'clinic',
                meetingUrl: appointment.meetingUrl || '',
                notes: appointment.notes || '',
                privateNotes: appointment.privateNotes || '',
                paymentAmount: appointment.paymentAmount || 0,
                paymentStatus: appointment.paymentStatus || 'unpaid',
                recurringPattern: {
                    isRecurring: appointment.recurringPattern?.isRecurring || false,
                    frequency: appointment.recurringPattern?.frequency || 'weekly',
                    endDate: appointment.recurringPattern?.endDate ? new Date(appointment.recurringPattern.endDate) : null
                }
            });
            setShowRecurringSettings(appointment.recurringPattern?.isRecurring || false);
        } else if (open && !appointment) {
            reset({
                clientId: '',
                serviceType: 'individual',
                startTime: new Date(),
                duration: 60,
                location: 'clinic',
                meetingUrl: '',
                notes: '',
                privateNotes: '',
                paymentAmount: 0,
                paymentStatus: 'unpaid',
                recurringPattern: {
                    isRecurring: false,
                    frequency: 'weekly',
                    endDate: null
                }
            });
            setShowRecurringSettings(false);
        }
    }, [open, appointment, reset]);

    // חישוב תצוגה מקדימה של פגישות חוזרות
    useEffect(() => {
        if (isRecurring && watchedValues.recurringPattern?.frequency && watchedValues.recurringPattern?.endDate) {
            const preview = generateRecurringPreview(
                watchedValues.startTime,
                watchedValues.recurringPattern.frequency,
                watchedValues.recurringPattern.endDate
            );
            setPreviewRecurring(preview);
        } else {
            setPreviewRecurring([]);
        }
    }, [isRecurring, watchedValues.recurringPattern, watchedValues.startTime]);

    const generateRecurringPreview = (startDate, frequency, endDate) => {
        const preview = [];
        let currentDate = moment(startDate);
        const endMoment = moment(endDate);

        while (currentDate.isBefore(endMoment) && preview.length < 10) {
            preview.push(currentDate.clone());
            
            switch (frequency) {
                case 'daily':
                    currentDate.add(1, 'day');
                    break;
                case 'weekly':
                    currentDate.add(1, 'week');
                    break;
                case 'biweekly':
                    currentDate.add(2, 'weeks');
                    break;
                case 'monthly':
                    currentDate.add(1, 'month');
                    break;
                default:
                    break;
            }
        }

        return preview;
    };

    const handleSave = async (data) => {
        try {
            const appointmentData = {
                ...data,
                endTime: moment(data.startTime).add(data.duration, 'minutes').toDate(),
                clientId: data.clientId,
                therapistId: appointment?.therapistId || appointment?.therapist?._id
            };

            await onSave(appointmentData);
            setSnackbar({ open: true, message: 'הפגישה נשמרה בהצלחה', severity: 'success' });
            onClose();
        } catch (error) {
            setSnackbar({ open: true, message: 'שגיאה בשמירת הפגישה', severity: 'error' });
        }
    };

    const handleDelete = async () => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק את הפגישה?')) {
            try {
                await onDelete(appointment._id);
                setSnackbar({ open: true, message: 'הפגישה נמחקה בהצלחה', severity: 'success' });
                onClose();
            } catch (error) {
                setSnackbar({ open: true, message: 'שגיאה במחיקת הפגישה', severity: 'error' });
            }
        }
    };

    const handleDuplicate = () => {
        if (appointment) {
            const duplicatedData = {
                ...appointment,
                startTime: moment(appointment.startTime).add(1, 'week').toDate(),
                _id: undefined
            };
            reset(duplicatedData);
            setSnackbar({ open: true, message: 'הפגישה שוכפלה', severity: 'info' });
        }
    };

    const handleSendReminder = async () => {
        try {
            await onSendReminder(appointment._id);
            setSnackbar({ open: true, message: 'תזכורת נשלחה בהצלחה', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'שגיאה בשליחת תזכורת', severity: 'error' });
        }
    };

    const getLocationIcon = (location) => {
        switch (location) {
            case 'online': return <VideoCallIcon />;
            case 'home': return <HomeIcon />;
            case 'clinic': return <BusinessIcon />;
            default: return <LocationIcon />;
        }
    };

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

    return (
        <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="he">
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { minHeight: '80vh' }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon />
                        <Typography variant="h6">
                            {mode === 'create' ? 'פגישה חדשה' : 
                             mode === 'edit' ? 'עריכת פגישה' : 
                             'פרטי פגישה'}
                        </Typography>
                        {appointment?.googleCalendarSynced && (
                            <Tooltip title="מסונכרן עם Google Calendar">
                                <SyncIcon color="success" />
                            </Tooltip>
                        )}
                        {appointment && !appointment.googleCalendarSynced && (
                            <Tooltip title="לא מסונכרן עם Google Calendar">
                                <SyncProblemIcon color="warning" />
                            </Tooltip>
                        )}
                    </Box>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    <form onSubmit={handleSubmit(handleSave)}>
                        <Grid container spacing={3}>
                            {/* מידע בסיסי */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    מידע בסיסי
                                </Typography>
                            </Grid>

                            {/* לקוח */}
                            <Grid item xs={12} md={6}>
                                <Controller
                                    name="clientId"
                                    control={control}
                                    render={({ field }) => (
                                        <Autocomplete
                                            {...field}
                                            options={clients}
                                            getOptionLabel={(option) => 
                                                typeof option === 'string' ? option : 
                                                `${option.firstName} ${option.lastName}`
                                            }
                                            value={clients.find(c => c._id === field.value) || null}
                                            onChange={(event, newValue) => {
                                                field.onChange(newValue?._id || '');
                                            }}
                                            disabled={mode === 'view'}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="לקוח"
                                                    error={!!errors.clientId}
                                                    helperText={errors.clientId?.message}
                                                    required
                                                />
                                            )}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* סוג שירות */}
                            <Grid item xs={12} md={6}>
                                <Controller
                                    name="serviceType"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth error={!!errors.serviceType}>
                                            <InputLabel>סוג שירות</InputLabel>
                                            <Select
                                                {...field}
                                                disabled={mode === 'view'}
                                                label="סוג שירות"
                                            >
                                                <MenuItem value="individual">אישי</MenuItem>
                                                <MenuItem value="couple">זוגי</MenuItem>
                                                <MenuItem value="family">משפחתי</MenuItem>
                                                <MenuItem value="group">קבוצתי</MenuItem>
                                                <MenuItem value="workshop">סדנה</MenuItem>
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            </Grid>

                            {/* תאריך ושעה */}
                            <Grid item xs={12} md={6}>
                                <Controller
                                    name="startTime"
                                    control={control}
                                    render={({ field }) => (
                                        <DateTimePicker
                                            {...field}
                                            label="תאריך ושעה"
                                            disabled={mode === 'view'}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    error: !!errors.startTime,
                                                    helperText: errors.startTime?.message
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* משך */}
                            <Grid item xs={12} md={6}>
                                <Controller
                                    name="duration"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth error={!!errors.duration}>
                                            <InputLabel>משך (דקות)</InputLabel>
                                            <Select
                                                {...field}
                                                disabled={mode === 'view'}
                                                label="משך (דקות)"
                                            >
                                                <MenuItem value={30}>30 דקות</MenuItem>
                                                <MenuItem value={45}>45 דקות</MenuItem>
                                                <MenuItem value={60}>60 דקות</MenuItem>
                                                <MenuItem value={90}>90 דקות</MenuItem>
                                                <MenuItem value={120}>120 דקות</MenuItem>
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            </Grid>

                            {/* מיקום */}
                            <Grid item xs={12} md={6}>
                                <Controller
                                    name="location"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth error={!!errors.location}>
                                            <FormLabel>מיקום</FormLabel>
                                            <RadioGroup
                                                {...field}
                                                row
                                                disabled={mode === 'view'}
                                            >
                                                <FormControlLabel
                                                    value="online"
                                                    control={<Radio />}
                                                    label={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <VideoCallIcon fontSize="small" />
                                                            אונליין
                                                        </Box>
                                                    }
                                                />
                                                <FormControlLabel
                                                    value="clinic"
                                                    control={<Radio />}
                                                    label={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <BusinessIcon fontSize="small" />
                                                            קליניקה
                                                        </Box>
                                                    }
                                                />
                                                <FormControlLabel
                                                    value="home"
                                                    control={<Radio />}
                                                    label={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <HomeIcon fontSize="small" />
                                                            בית
                                                        </Box>
                                                    }
                                                />
                                            </RadioGroup>
                                        </FormControl>
                                    )}
                                />
                            </Grid>

                            {/* קישור פגישה */}
                            {watchedValues.location === 'online' && (
                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="meetingUrl"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="קישור פגישה"
                                                disabled={mode === 'view'}
                                                error={!!errors.meetingUrl}
                                                helperText={errors.meetingUrl?.message}
                                                placeholder="https://zoom.us/j/..."
                                            />
                                        )}
                                    />
                                </Grid>
                            )}

                            {/* תשלום */}
                            <Grid item xs={12} md={6}>
                                <Controller
                                    name="paymentAmount"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            type="number"
                                            label="סכום תשלום"
                                            disabled={mode === 'view'}
                                            error={!!errors.paymentAmount}
                                            helperText={errors.paymentAmount?.message}
                                            InputProps={{
                                                startAdornment: <Typography>₪</Typography>
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Controller
                                    name="paymentStatus"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth>
                                            <InputLabel>סטטוס תשלום</InputLabel>
                                            <Select
                                                {...field}
                                                disabled={mode === 'view'}
                                                label="סטטוס תשלום"
                                            >
                                                <MenuItem value="unpaid">לא שולם</MenuItem>
                                                <MenuItem value="paid">שולם</MenuItem>
                                                <MenuItem value="refunded">הוחזר</MenuItem>
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            </Grid>

                            {/* הערות */}
                            <Grid item xs={12} md={6}>
                                <Controller
                                    name="notes"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="הערות"
                                            disabled={mode === 'view'}
                                            error={!!errors.notes}
                                            helperText={errors.notes?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Controller
                                    name="privateNotes"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="הערות פרטיות (רק למטפלת)"
                                            disabled={mode === 'view'}
                                            error={!!errors.privateNotes}
                                            helperText={errors.privateNotes?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* פגישות חוזרות */}
                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    פגישות חוזרות
                                </Typography>
                                
                                <Controller
                                    name="recurringPattern.isRecurring"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    {...field}
                                                    checked={field.value}
                                                    disabled={mode === 'view'}
                                                    onChange={(e) => {
                                                        field.onChange(e.target.checked);
                                                        setShowRecurringSettings(e.target.checked);
                                                    }}
                                                />
                                            }
                                            label="פגישה חוזרת"
                                        />
                                    )}
                                />

                                <Collapse in={showRecurringSettings}>
                                    <Box sx={{ mt: 2 }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <Controller
                                                    name="recurringPattern.frequency"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <FormControl fullWidth error={!!errors.recurringPattern?.frequency}>
                                                            <InputLabel>תדירות</InputLabel>
                                                            <Select
                                                                {...field}
                                                                disabled={mode === 'view'}
                                                                label="תדירות"
                                                            >
                                                                <MenuItem value="daily">יומי</MenuItem>
                                                                <MenuItem value="weekly">שבועי</MenuItem>
                                                                <MenuItem value="biweekly">דו-שבועי</MenuItem>
                                                                <MenuItem value="monthly">חודשי</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    )}
                                                />
                                            </Grid>

                                            <Grid item xs={12} md={6}>
                                                <Controller
                                                    name="recurringPattern.endDate"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <DateTimePicker
                                                            {...field}
                                                            label="תאריך סיום"
                                                            disabled={mode === 'view'}
                                                            slotProps={{
                                                                textField: {
                                                                    fullWidth: true,
                                                                    error: !!errors.recurringPattern?.endDate,
                                                                    helperText: errors.recurringPattern?.endDate?.message
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                        </Grid>

                                        {/* תצוגה מקדימה */}
                                        {previewRecurring.length > 0 && (
                                            <Card sx={{ mt: 2 }}>
                                                <CardHeader title="תצוגה מקדימה של פגישות חוזרות" />
                                                <CardContent>
                                                    <List dense>
                                                        {previewRecurring.slice(0, 5).map((date, index) => (
                                                            <ListItem key={index}>
                                                                <ListItemIcon>
                                                                    <CalendarTodayIcon />
                                                                </ListItemIcon>
                                                                <ListItemText
                                                                    primary={date.format('dddd, DD/MM/YYYY')}
                                                                    secondary={date.format('HH:mm')}
                                                                />
                                                            </ListItem>
                                                        ))}
                                                        {previewRecurring.length > 5 && (
                                                            <ListItem>
                                                                <ListItemText
                                                                    primary={`ועוד ${previewRecurring.length - 5} פגישות...`}
                                                                />
                                                            </ListItem>
                                                        )}
                                                    </List>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </Box>
                                </Collapse>
                            </Grid>

                            {/* התנגשויות */}
                            {conflicts.length > 0 && (
                                <Grid item xs={12}>
                                    <Alert 
                                        severity="warning" 
                                        action={
                                            <Button 
                                                color="inherit" 
                                                size="small"
                                                onClick={() => setShowConflicts(!showConflicts)}
                                            >
                                                {showConflicts ? 'הסתר' : 'הצג'}
                                            </Button>
                                        }
                                    >
                                        נמצאו {conflicts.length} התנגשויות אפשריות
                                    </Alert>
                                    
                                    <Collapse in={showConflicts}>
                                        <Box sx={{ mt: 1 }}>
                                            {conflicts.map((conflict, index) => (
                                                <Alert key={index} severity="info" sx={{ mb: 1 }}>
                                                    <Typography variant="body2">
                                                        התנגשות עם: {conflict.title} ב-{moment(conflict.start).format('DD/MM/YYYY HH:mm')}
                                                    </Typography>
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Collapse>
                                </Grid>
                            )}

                            {/* מידע נוסף למצב עריכה/צפייה */}
                            {appointment && (
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h6" gutterBottom>
                                        מידע נוסף
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    סטטוס:
                                                </Typography>
                                                <Chip
                                                    label={getStatusLabel(appointment.status)}
                                                    color={getStatusColor(appointment.status)}
                                                    size="small"
                                                />
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12} md={4}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    נוצר:
                                                </Typography>
                                                <Typography variant="body2">
                                                    {moment(appointment.createdAt).format('DD/MM/YYYY HH:mm')}
                                                </Typography>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12} md={4}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    עודכן:
                                                </Typography>
                                                <Typography variant="body2">
                                                    {moment(appointment.updatedAt).format('DD/MM/YYYY HH:mm')}
                                                </Typography>
                                            </Box>
                                        </Grid>

                                        {appointment.remindersSent && appointment.remindersSent.length > 0 && (
                                            <Grid item xs={12}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    תזכורות שנשלחו:
                                                </Typography>
                                                {appointment.remindersSent.map((reminder, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={`${reminder.type} - ${moment(reminder.sentAt).format('DD/MM HH:mm')}`}
                                                        size="small"
                                                        sx={{ mr: 1, mb: 1 }}
                                                    />
                                                ))}
                                            </Grid>
                                        )}
                                    </Grid>
                                </Grid>
                            )}
                        </Grid>
                    </form>
                </DialogContent>

                <DialogActions sx={{ p: 2, gap: 1 }}>
                    {mode === 'edit' && (
                        <>
                            <Button
                                onClick={handleDelete}
                                color="error"
                                startIcon={<DeleteIcon />}
                                disabled={loading}
                            >
                                מחק
                            </Button>
                            <Button
                                onClick={handleDuplicate}
                                startIcon={<CopyIcon />}
                                disabled={loading}
                            >
                                שכפל
                            </Button>
                            <Button
                                onClick={handleSendReminder}
                                startIcon={<SendIcon />}
                                disabled={loading}
                            >
                                שלח תזכורת
                            </Button>
                        </>
                    )}

                    <Box sx={{ flex: 1 }} />

                    <Button onClick={onClose} disabled={loading}>
                        בטל
                    </Button>
                    
                    {mode !== 'view' && (
                        <Button
                            onClick={handleSubmit(handleSave)}
                            variant="contained"
                            startIcon={<SaveIcon />}
                            disabled={loading || !isDirty}
                        >
                            {loading ? <CircularProgress size={20} /> : 'שמור'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

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
        </LocalizationProvider>
    );
};

export default AppointmentModal;
