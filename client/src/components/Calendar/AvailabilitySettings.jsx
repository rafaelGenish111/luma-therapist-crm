import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import moment from 'moment';
import 'moment/locale/he';

import {
    Box,
    Paper,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    IconButton,
    Switch,
    FormControlLabel,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Tooltip,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    Slider,
    InputAdornment,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Badge,
    Stack
} from '@mui/material';

import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
    ContentCopy as CopyIcon,
    Schedule as ScheduleIcon,
    AccessTime as AccessTimeIcon,
    LocationOn as LocationIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    ExpandMore as ExpandMoreIcon,
    CalendarToday as CalendarTodayIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Home as HomeIcon,
    FlightTakeoff as VacationIcon,
    Sick as SickIcon,
    School as TrainingIcon,
    MoreVert as MoreVertIcon,
    Info as InfoIcon
} from '@mui/icons-material';

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

moment.locale('he');

// סכמת ולידציה
const availabilitySchema = yup.object({
    weeklySchedule: yup.array().of(
        yup.object({
            dayOfWeek: yup.number().required(),
            isAvailable: yup.boolean().required(),
            timeSlots: yup.array().of(
                yup.object({
                    startTime: yup.string().required('זמן התחלה הוא חובה'),
                    endTime: yup.string().required('זמן סיום הוא חובה')
                })
            )
        })
    ),
    bufferTime: yup.number().min(0).max(120).required(),
    maxDailyAppointments: yup.number().min(1).max(20).required(),
    advanceBookingDays: yup.number().min(1).max(365).required(),
    minNoticeHours: yup.number().min(1).max(168).required(),
    timezone: yup.string().required()
});

const AvailabilitySettings = ({
    availability = null,
    blockedTimes = [],
    onSave,
    onSaveBlockedTime,
    onDeleteBlockedTime,
    loading = false
}) => {
    const [showBlockedTimeDialog, setShowBlockedTimeDialog] = useState(false);
    const [editingBlockedTime, setEditingBlockedTime] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [previewWeek, setPreviewWeek] = useState([]);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isDirty }
    } = useForm({
        resolver: yupResolver(availabilitySchema),
        defaultValues: {
            weeklySchedule: [
                { dayOfWeek: 0, isAvailable: false, timeSlots: [] }, // ראשון
                { dayOfWeek: 1, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] }, // שני
                { dayOfWeek: 2, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] }, // שלישי
                { dayOfWeek: 3, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] }, // רביעי
                { dayOfWeek: 4, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] }, // חמישי
                { dayOfWeek: 5, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '14:00' }] }, // שישי
                { dayOfWeek: 6, isAvailable: false, timeSlots: [] } // שבת
            ],
            bufferTime: 15,
            maxDailyAppointments: 8,
            advanceBookingDays: 60,
            minNoticeHours: 24,
            timezone: 'Asia/Jerusalem'
        }
    });

    const { fields: scheduleFields, append: appendSchedule, remove: removeSchedule } = useFieldArray({
        control,
        name: 'weeklySchedule'
    });

    const watchedValues = watch();

    // עדכון ערכי ברירת מחדל
    useEffect(() => {
        if (availability) {
            reset({
                weeklySchedule: availability.weeklySchedule || [],
                bufferTime: availability.bufferTime || 15,
                maxDailyAppointments: availability.maxDailyAppointments || 8,
                advanceBookingDays: availability.advanceBookingDays || 60,
                minNoticeHours: availability.minNoticeHours || 24,
                timezone: availability.timezone || 'Asia/Jerusalem'
            });
        }
    }, [availability, reset]);

    // חישוב תצוגה מקדימה
    useEffect(() => {
        const preview = generateWeekPreview(watchedValues.weeklySchedule);
        setPreviewWeek(preview);
    }, [watchedValues.weeklySchedule]);

    const generateWeekPreview = (schedule) => {
        const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        const nextWeek = moment().add(1, 'week').startOf('week');

        return schedule.map((daySchedule, index) => {
            const dayDate = nextWeek.clone().add(index, 'days');
            const totalMinutes = daySchedule.timeSlots.reduce((total, slot) => {
                const start = moment(slot.startTime, 'HH:mm');
                const end = moment(slot.endTime, 'HH:mm');
                return total + end.diff(start, 'minutes');
            }, 0);

            return {
                dayName: days[index],
                date: dayDate.format('DD/MM'),
                isAvailable: daySchedule.isAvailable,
                timeSlots: daySchedule.timeSlots,
                totalMinutes,
                totalHours: Math.round(totalMinutes / 60 * 10) / 10
            };
        });
    };

    const handleSave = async (data) => {
        try {
            await onSave(data);
            setSnackbar({ open: true, message: 'הגדרות הזמינות נשמרו בהצלחה', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'שגיאה בשמירת הגדרות הזמינות', severity: 'error' });
        }
    };

    const handleResetToDefault = () => {
        if (window.confirm('האם אתה בטוח שברצונך לאפס את הגדרות הזמינות לברירת המחדל?')) {
            reset({
                weeklySchedule: [
                    { dayOfWeek: 0, isAvailable: false, timeSlots: [] },
                    { dayOfWeek: 1, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
                    { dayOfWeek: 2, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
                    { dayOfWeek: 3, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
                    { dayOfWeek: 4, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
                    { dayOfWeek: 5, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '14:00' }] },
                    { dayOfWeek: 6, isAvailable: false, timeSlots: [] }
                ],
                bufferTime: 15,
                maxDailyAppointments: 8,
                advanceBookingDays: 60,
                minNoticeHours: 24,
                timezone: 'Asia/Jerusalem'
            });
        }
    };

    const handleCopyToAllDays = (sourceDayIndex) => {
        const sourceDay = watchedValues.weeklySchedule[sourceDayIndex];
        const updatedSchedule = watchedValues.weeklySchedule.map((day, index) => {
            if (index !== sourceDayIndex) {
                return {
                    ...day,
                    isAvailable: sourceDay.isAvailable,
                    timeSlots: [...sourceDay.timeSlots]
                };
            }
            return day;
        });
        setValue('weeklySchedule', updatedSchedule);
    };

    const addTimeSlot = (dayIndex) => {
        const updatedSchedule = [...watchedValues.weeklySchedule];
        updatedSchedule[dayIndex].timeSlots.push({ startTime: '09:00', endTime: '17:00' });
        setValue('weeklySchedule', updatedSchedule);
    };

    const removeTimeSlot = (dayIndex, slotIndex) => {
        const updatedSchedule = [...watchedValues.weeklySchedule];
        updatedSchedule[dayIndex].timeSlots.splice(slotIndex, 1);
        setValue('weeklySchedule', updatedSchedule);
    };

    const updateTimeSlot = (dayIndex, slotIndex, field, value) => {
        const updatedSchedule = [...watchedValues.weeklySchedule];
        updatedSchedule[dayIndex].timeSlots[slotIndex][field] = value;
        setValue('weeklySchedule', updatedSchedule);
    };

    const getDayName = (dayOfWeek) => {
        const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        return days[dayOfWeek];
    };

    const getBlockedTimeIcon = (reason) => {
        switch (reason) {
            case 'vacation': return <VacationIcon />;
            case 'sick': return <SickIcon />;
            case 'training': return <TrainingIcon />;
            case 'personal': return <PersonIcon />;
            default: return <ScheduleIcon />;
        }
    };

    const getBlockedTimeLabel = (reason) => {
        switch (reason) {
            case 'vacation': return 'חופשה';
            case 'sick': return 'מחלה';
            case 'training': return 'הדרכה';
            case 'personal': return 'אישי';
            case 'other': return 'אחר';
            default: return reason;
        }
    };

    const BlockedTimeDialog = () => (
        <Dialog
            open={showBlockedTimeDialog}
            onClose={() => {
                setShowBlockedTimeDialog(false);
                setEditingBlockedTime(null);
            }}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                {editingBlockedTime ? 'עריכת זמן חסום' : 'זמן חסום חדש'}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                        <DateTimePicker
                            label="תאריך ושעה התחלה"
                            value={editingBlockedTime?.startTime || null}
                            onChange={(date) => setEditingBlockedTime({ ...editingBlockedTime, startTime: date })}
                            slotProps={{
                                textField: { fullWidth: true }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <DateTimePicker
                            label="תאריך ושעה סיום"
                            value={editingBlockedTime?.endTime || null}
                            onChange={(date) => setEditingBlockedTime({ ...editingBlockedTime, endTime: date })}
                            slotProps={{
                                textField: { fullWidth: true }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>סיבה</InputLabel>
                            <Select
                                value={editingBlockedTime?.reason || ''}
                                onChange={(e) => setEditingBlockedTime({ ...editingBlockedTime, reason: e.target.value })}
                                label="סיבה"
                            >
                                <MenuItem value="vacation">חופשה</MenuItem>
                                <MenuItem value="sick">מחלה</MenuItem>
                                <MenuItem value="personal">אישי</MenuItem>
                                <MenuItem value="training">הדרכה</MenuItem>
                                <MenuItem value="other">אחר</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="הערות"
                            value={editingBlockedTime?.notes || ''}
                            onChange={(e) => setEditingBlockedTime({ ...editingBlockedTime, notes: e.target.value })}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    setShowBlockedTimeDialog(false);
                    setEditingBlockedTime(null);
                }}>
                    בטל
                </Button>
                <Button
                    onClick={() => {
                        if (editingBlockedTime) {
                            onSaveBlockedTime(editingBlockedTime);
                        }
                        setShowBlockedTimeDialog(false);
                        setEditingBlockedTime(null);
                    }}
                    variant="contained"
                >
                    שמור
                </Button>
            </DialogActions>
        </Dialog>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="he">
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    הגדרות זמינות
                </Typography>

                <form onSubmit={handleSubmit(handleSave)}>
                    <Grid container spacing={3}>
                        {/* לוח זמנים שבועי */}
                        <Grid item xs={12}>
                            <Card>
                                <CardHeader
                                    title="לוח זמנים שבועי"
                                    action={
                                        <Button
                                            onClick={handleResetToDefault}
                                            startIcon={<RefreshIcon />}
                                            variant="outlined"
                                        >
                                            איפוס לברירת מחדל
                                        </Button>
                                    }
                                />
                                <CardContent>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>יום</TableCell>
                                                    <TableCell align="center">זמין</TableCell>
                                                    <TableCell>שעות עבודה</TableCell>
                                                    <TableCell align="center">פעולות</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {scheduleFields.map((field, dayIndex) => (
                                                    <TableRow key={field.id}>
                                                        <TableCell>
                                                            <Typography variant="subtitle2">
                                                                {getDayName(field.dayOfWeek)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Controller
                                                                name={`weeklySchedule.${dayIndex}.isAvailable`}
                                                                control={control}
                                                                render={({ field: checkboxField }) => (
                                                                    <Checkbox
                                                                        {...checkboxField}
                                                                        checked={checkboxField.value}
                                                                        onChange={(e) => {
                                                                            checkboxField.onChange(e.target.checked);
                                                                            if (!e.target.checked) {
                                                                                setValue(`weeklySchedule.${dayIndex}.timeSlots`, []);
                                                                            }
                                                                        }}
                                                                    />
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {field.isAvailable ? (
                                                                <Box>
                                                                    {field.timeSlots.map((slot, slotIndex) => (
                                                                        <Box key={slotIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                                            <TextField
                                                                                size="small"
                                                                                type="time"
                                                                                value={slot.startTime}
                                                                                onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'startTime', e.target.value)}
                                                                                sx={{ width: 100 }}
                                                                            />
                                                                            <Typography>-</Typography>
                                                                            <TextField
                                                                                size="small"
                                                                                type="time"
                                                                                value={slot.endTime}
                                                                                onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'endTime', e.target.value)}
                                                                                sx={{ width: 100 }}
                                                                            />
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                                                                                disabled={field.timeSlots.length === 1}
                                                                            >
                                                                                <DeleteIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Box>
                                                                    ))}
                                                                    <Button
                                                                        size="small"
                                                                        startIcon={<AddIcon />}
                                                                        onClick={() => addTimeSlot(dayIndex)}
                                                                    >
                                                                        הוסף זמן
                                                                    </Button>
                                                                </Box>
                                                            ) : (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    לא זמין
                                                                </Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Tooltip title="העתק לכל הימים">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleCopyToAllDays(dayIndex)}
                                                                >
                                                                    <CopyIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* הגדרות נוספות */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardHeader title="הגדרות נוספות" />
                                <CardContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography gutterBottom>
                                                זמן חיץ בין פגישות: {watchedValues.bufferTime} דקות
                                            </Typography>
                                            <Controller
                                                name="bufferTime"
                                                control={control}
                                                render={({ field }) => (
                                                    <Slider
                                                        {...field}
                                                        min={0}
                                                        max={60}
                                                        step={5}
                                                        marks={[
                                                            { value: 0, label: '0' },
                                                            { value: 15, label: '15' },
                                                            { value: 30, label: '30' },
                                                            { value: 60, label: '60' }
                                                        ]}
                                                    />
                                                )}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Controller
                                                name="maxDailyAppointments"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        fullWidth
                                                        type="number"
                                                        label="מספר מקסימלי של פגישות ביום"
                                                        error={!!errors.maxDailyAppointments}
                                                        helperText={errors.maxDailyAppointments?.message}
                                                    />
                                                )}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Controller
                                                name="advanceBookingDays"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        fullWidth
                                                        type="number"
                                                        label="ימים מראש לקביעת פגישות"
                                                        error={!!errors.advanceBookingDays}
                                                        helperText={errors.advanceBookingDays?.message}
                                                    />
                                                )}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Controller
                                                name="minNoticeHours"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        fullWidth
                                                        type="number"
                                                        label="הודעה מינימלית מראש (שעות)"
                                                        error={!!errors.minNoticeHours}
                                                        helperText={errors.minNoticeHours?.message}
                                                    />
                                                )}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Controller
                                                name="timezone"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControl fullWidth error={!!errors.timezone}>
                                                        <InputLabel>אזור זמן</InputLabel>
                                                        <Select
                                                            {...field}
                                                            label="אזור זמן"
                                                        >
                                                            <MenuItem value="Asia/Jerusalem">ישראל</MenuItem>
                                                            <MenuItem value="UTC">UTC</MenuItem>
                                                            <MenuItem value="America/New_York">ניו יורק</MenuItem>
                                                            <MenuItem value="Europe/London">לונדון</MenuItem>
                                                            <MenuItem value="Europe/Paris">פריז</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                )}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* תצוגה מקדימה */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardHeader title="תצוגה מקדימה - השבוע הבא" />
                                <CardContent>
                                    <List dense>
                                        {previewWeek.map((day, index) => (
                                            <ListItem key={index}>
                                                <ListItemIcon>
                                                    <CalendarTodayIcon />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={`${day.dayName} ${day.date}`}
                                                    secondary={
                                                        day.isAvailable ? (
                                                            <Box>
                                                                <Typography variant="body2">
                                                                    {day.timeSlots.map(slot => `${slot.startTime}-${slot.endTime}`).join(', ')}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    סה"כ: {day.totalHours} שעות
                                                                </Typography>
                                                            </Box>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">
                                                                לא זמין
                                                            </Typography>
                                                        )
                                                    }
                                                />
                                                <ListItemSecondaryAction>
                                                    <Chip
                                                        label={day.isAvailable ? 'זמין' : 'לא זמין'}
                                                        color={day.isAvailable ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* זמנים חסומים */}
                        <Grid item xs={12}>
                            <Card>
                                <CardHeader
                                    title="זמנים חסומים"
                                    action={
                                        <Button
                                            onClick={() => {
                                                setEditingBlockedTime({});
                                                setShowBlockedTimeDialog(true);
                                            }}
                                            startIcon={<AddIcon />}
                                            variant="outlined"
                                        >
                                            הוסף זמן חסום
                                        </Button>
                                    }
                                />
                                <CardContent>
                                    {blockedTimes.length === 0 ? (
                                        <Alert severity="info">
                                            אין זמנים חסומים מוגדרים
                                        </Alert>
                                    ) : (
                                        <List>
                                            {blockedTimes.map((blockedTime, index) => (
                                                <ListItem key={index}>
                                                    <ListItemIcon>
                                                        {getBlockedTimeIcon(blockedTime.reason)}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={`${moment(blockedTime.startTime).format('DD/MM/YYYY HH:mm')} - ${moment(blockedTime.endTime).format('DD/MM/YYYY HH:mm')}`}
                                                        secondary={
                                                            <Box>
                                                                <Typography variant="body2">
                                                                    {getBlockedTimeLabel(blockedTime.reason)}
                                                                </Typography>
                                                                {blockedTime.notes && (
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {blockedTime.notes}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <IconButton
                                                            onClick={() => {
                                                                setEditingBlockedTime(blockedTime);
                                                                setShowBlockedTimeDialog(true);
                                                            }}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            onClick={() => onDeleteBlockedTime(blockedTime._id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            ))}
                                        </List>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* כפתורי פעולה */}
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            onClick={handleResetToDefault}
                            variant="outlined"
                            disabled={loading}
                        >
                            איפוס לברירת מחדל
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={<SaveIcon />}
                            disabled={loading || !isDirty}
                        >
                            {loading ? <CircularProgress size={20} /> : 'שמור הגדרות'}
                        </Button>
                    </Box>
                </form>

                <BlockedTimeDialog />

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

export default AvailabilitySettings;
