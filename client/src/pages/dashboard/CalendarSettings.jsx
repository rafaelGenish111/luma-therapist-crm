import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Tabs,
    Tab,
    Grid,
    Switch,
    FormControl,
    FormLabel,
    FormGroup,
    FormControlLabel,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    Chip,
    IconButton,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Paper,
    InputAdornment,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    QRCode,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    CalendarToday,
    Sync,
    Notifications,
    Public,
    Policy,
    Add,
    Remove,
    ContentCopy as Copy,
    QrCode,
    CheckCircle,
    Error,
    Warning,
    Refresh,
    Save,
    ArrowBack
} from '@mui/icons-material';
import axios from 'axios';

const CalendarSettings = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        availability: {
            weeklySchedule: [],
            bufferTime: 15,
            maxDailyAppointments: 8,
            advanceBookingDays: 60,
            minNoticeHours: 24,
            timezone: 'Asia/Jerusalem'
        },
        googleCalendar: {
            connected: false,
            email: null,
            lastSynced: null,
            syncDirection: 'two-way',
            privacyLevel: 'generic',
            autoSync: true,
            syncFrequency: 'realtime'
        },
        notifications: {
            email: {
                newBooking: true,
                cancellation: true,
                changes: true
            },
            reminders: {
                enabled: true,
                reminder24h: true,
                reminder1h: true,
                customReminders: []
            },
            followUp: {
                enabled: true,
                delayHours: 24
            }
        },
        bookingPage: {
            publicUrl: '',
            headerImage: '',
            welcomeText: 'ברוכים הבאים! קבעו פגישה בקלות',
            instructions: 'אנא בחרו תאריך ושעה המתאימים לכם',
            policies: 'ניתן לבטל פגישה עד 24 שעות מראש'
        },
        policies: {
            cancellation: {
                minNoticeHours: 24,
                cancellationFee: 0,
                policyText: 'ניתן לבטל פגישה עד 24 שעות מראש ללא תשלום נוסף'
            },
            booking: {
                maxAdvanceDays: 90,
                minAdvanceHours: 2,
                maxDailyAppointments: 8,
                bufferMinutes: 15
            },
            payment: {
                requireUpfront: false,
                paymentMethods: ['cash', 'card'],
                depositAmount: 0
            }
        }
    });

    // Load settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/calendar/settings');
                setSettings(response.data);
            } catch (err) {
                setError('שגיאה בטעינת ההגדרות');
                console.error('Error loading settings:', err);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    // Handle tab change with unsaved changes warning
    const handleTabChange = (event, newValue) => {
        if (hasUnsavedChanges) {
            if (window.confirm('יש לכם שינויים שלא נשמרו. האם אתם בטוחים שברצונכם לעזוב?')) {
                setActiveTab(newValue);
                setHasUnsavedChanges(false);
            }
        } else {
            setActiveTab(newValue);
        }
    };

    // Save settings
    const handleSave = async () => {
        try {
            setSaving(true);
            await axios.put('/api/calendar/settings', settings);
            setSuccess('ההגדרות נשמרו בהצלחה');
            setHasUnsavedChanges(false);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('שגיאה בשמירת ההגדרות');
            console.error('Error saving settings:', err);
        } finally {
            setSaving(false);
        }
    };

    // Handle setting change
    const handleSettingChange = (path, value) => {
        setSettings(prev => {
            const newSettings = { ...prev };
            const keys = path.split('.');
            let current = newSettings;

            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            setHasUnsavedChanges(true);
            return newSettings;
        });
    };

    // Google Calendar connection
    const handleGoogleConnect = async () => {
        try {
            const response = await axios.get('/api/calendar/google/auth');
            window.location.href = response.data.authUrl;
        } catch (err) {
            setError('שגיאה בחיבור ל-Google Calendar');
        }
    };

    const handleGoogleDisconnect = async () => {
        try {
            await axios.post('/api/calendar/google/disconnect');
            setSettings(prev => ({
                ...prev,
                googleCalendar: {
                    ...prev.googleCalendar,
                    connected: false,
                    email: null,
                    lastSynced: null
                }
            }));
            setSuccess('ניתוק מ-Google Calendar בוצע בהצלחה');
        } catch (err) {
            setError('שגיאה בניתוק מ-Google Calendar');
        }
    };

    // Add custom reminder
    const addCustomReminder = () => {
        const newReminder = {
            id: Date.now(),
            hoursBefore: 2,
            enabled: true
        };

        setSettings(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                reminders: {
                    ...prev.notifications.reminders,
                    customReminders: [...prev.notifications.reminders.customReminders, newReminder]
                }
            }
        }));
        setHasUnsavedChanges(true);
    };

    // Remove custom reminder
    const removeCustomReminder = (id) => {
        setSettings(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                reminders: {
                    ...prev.notifications.reminders,
                    customReminders: prev.notifications.reminders.customReminders.filter(r => r.id !== id)
                }
            }
        }));
        setHasUnsavedChanges(true);
    };

    // Copy public URL
    const copyPublicUrl = () => {
        navigator.clipboard.writeText(settings.bookingPage.publicUrl);
        setSuccess('הקישור הועתק ללוח');
    };

    // Generate QR code
    const generateQRCode = () => {
        // This would typically use a QR code library
        console.log('Generating QR code for:', settings.bookingPage.publicUrl);
    };

    const tabs = [
        { label: 'זמינות', icon: <CalendarToday /> },
        { label: 'Google Calendar', icon: <Sync /> },
        { label: 'התראות', icon: <Notifications /> },
        { label: 'עמוד הזמנה', icon: <Public /> },
        { label: 'מדיניות', icon: <Policy /> }
    ];

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 2 }}>
            {/* Header */}
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <IconButton onClick={() => navigate('/dashboard/calendar')}>
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4">
                    הגדרות יומן
                </Typography>
                {hasUnsavedChanges && (
                    <Chip label="יש שינויים שלא נשמרו" color="warning" size="small" />
                )}
            </Box>

            {/* Success/Error Messages */}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Tabs */}
            <Card>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant={isMobile ? 'scrollable' : 'standard'}
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    {tabs.map((tab, index) => (
                        <Tab
                            key={index}
                            label={tab.label}
                            icon={tab.icon}
                            iconPosition="start"
                        />
                    ))}
                </Tabs>

                <CardContent>
                    {/* Availability Tab */}
                    {activeTab === 0 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                הגדרות זמינות
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="זמן חיץ בין פגישות (דקות)"
                                        type="number"
                                        value={settings.availability.bufferTime}
                                        onChange={(e) => handleSettingChange('availability.bufferTime', parseInt(e.target.value))}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="מקסימום פגישות ליום"
                                        type="number"
                                        value={settings.availability.maxDailyAppointments}
                                        onChange={(e) => handleSettingChange('availability.maxDailyAppointments', parseInt(e.target.value))}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="הזמנה מראש מקסימלית (ימים)"
                                        type="number"
                                        value={settings.availability.advanceBookingDays}
                                        onChange={(e) => handleSettingChange('availability.advanceBookingDays', parseInt(e.target.value))}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="הודעה מינימלית מראש (שעות)"
                                        type="number"
                                        value={settings.availability.minNoticeHours}
                                        onChange={(e) => handleSettingChange('availability.minNoticeHours', parseInt(e.target.value))}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>אזור זמן</InputLabel>
                                        <Select
                                            value={settings.availability.timezone}
                                            onChange={(e) => handleSettingChange('availability.timezone', e.target.value)}
                                        >
                                            <MenuItem value="Asia/Jerusalem">אסיה/ירושלים</MenuItem>
                                            <MenuItem value="Europe/London">אירופה/לונדון</MenuItem>
                                            <MenuItem value="America/New_York">אמריקה/ניו יורק</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* Google Calendar Tab */}
                    {activeTab === 1 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                חיבור ל-Google Calendar
                            </Typography>

                            {settings.googleCalendar.connected ? (
                                <Box>
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <CheckCircle />
                                            <Typography>
                                                מחובר ל-Google Calendar: {settings.googleCalendar.email}
                                            </Typography>
                                        </Box>
                                    </Alert>

                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="סנכרון אחרון"
                                                value={settings.googleCalendar.lastSynced ?
                                                    new Date(settings.googleCalendar.lastSynced).toLocaleString('he-IL') :
                                                    'לא ידוע'
                                                }
                                                InputProps={{ readOnly: true }}
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>כיוון סנכרון</InputLabel>
                                                <Select
                                                    value={settings.googleCalendar.syncDirection}
                                                    onChange={(e) => handleSettingChange('googleCalendar.syncDirection', e.target.value)}
                                                >
                                                    <MenuItem value="two-way">דו-כיווני</MenuItem>
                                                    <MenuItem value="to-google">ל-Google בלבד</MenuItem>
                                                    <MenuItem value="from-google">מ-Google בלבד</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>רמת פרטיות</InputLabel>
                                                <Select
                                                    value={settings.googleCalendar.privacyLevel}
                                                    onChange={(e) => handleSettingChange('googleCalendar.privacyLevel', e.target.value)}
                                                >
                                                    <MenuItem value="busy-only">עסוק בלבד</MenuItem>
                                                    <MenuItem value="generic">כללי</MenuItem>
                                                    <MenuItem value="detailed">מפורט</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={settings.googleCalendar.autoSync}
                                                        onChange={(e) => handleSettingChange('googleCalendar.autoSync', e.target.checked)}
                                                    />
                                                }
                                                label="סנכרון אוטומטי"
                                            />
                                        </Grid>
                                    </Grid>

                                    <Box display="flex" gap={2} mt={3}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<Refresh />}
                                            onClick={() => axios.post('/api/calendar/sync')}
                                        >
                                            סנכרון עכשיו
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={handleGoogleDisconnect}
                                        >
                                            נתק מ-Google
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                <Box>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        <Typography>
                                            חיבור ל-Google Calendar מאפשר סנכרון אוטומטי של הפגישות שלכם
                                        </Typography>
                                    </Alert>

                                    <Button
                                        variant="contained"
                                        startIcon={<Sync />}
                                        onClick={handleGoogleConnect}
                                    >
                                        התחבר ל-Google Calendar
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 2 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                הגדרות התראות
                            </Typography>

                            {/* Email Notifications */}
                            <Paper sx={{ p: 2, mb: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    התראות אימייל
                                </Typography>

                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.notifications.email.newBooking}
                                                onChange={(e) => handleSettingChange('notifications.email.newBooking', e.target.checked)}
                                            />
                                        }
                                        label="הזמנה חדשה"
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.notifications.email.cancellation}
                                                onChange={(e) => handleSettingChange('notifications.email.cancellation', e.target.checked)}
                                            />
                                        }
                                        label="ביטול פגישה"
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.notifications.email.changes}
                                                onChange={(e) => handleSettingChange('notifications.email.changes', e.target.checked)}
                                            />
                                        }
                                        label="שינויי פגישה"
                                    />
                                </FormGroup>
                            </Paper>

                            {/* Reminder Settings */}
                            <Paper sx={{ p: 2, mb: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    הגדרות תזכורות
                                </Typography>

                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.notifications.reminders.enabled}
                                                onChange={(e) => handleSettingChange('notifications.reminders.enabled', e.target.checked)}
                                            />
                                        }
                                        label="הפעל תזכורות"
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.notifications.reminders.reminder24h}
                                                onChange={(e) => handleSettingChange('notifications.reminders.reminder24h', e.target.checked)}
                                                disabled={!settings.notifications.reminders.enabled}
                                            />
                                        }
                                        label="תזכורת 24 שעות מראש"
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.notifications.reminders.reminder1h}
                                                onChange={(e) => handleSettingChange('notifications.reminders.reminder1h', e.target.checked)}
                                                disabled={!settings.notifications.reminders.enabled}
                                            />
                                        }
                                        label="תזכורת שעה מראש"
                                    />
                                </FormGroup>

                                {/* Custom Reminders */}
                                <Box mt={2}>
                                    <Typography variant="body2" gutterBottom>
                                        תזכורות מותאמות אישית:
                                    </Typography>

                                    {settings.notifications.reminders.customReminders.map((reminder) => (
                                        <Box key={reminder.id} display="flex" alignItems="center" gap={1} mb={1}>
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={reminder.hoursBefore}
                                                onChange={(e) => {
                                                    const newReminders = settings.notifications.reminders.customReminders.map(r =>
                                                        r.id === reminder.id ? { ...r, hoursBefore: parseInt(e.target.value) } : r
                                                    );
                                                    handleSettingChange('notifications.reminders.customReminders', newReminders);
                                                }}
                                                sx={{ width: 100 }}
                                            />
                                            <Typography variant="body2">שעות מראש</Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => removeCustomReminder(reminder.id)}
                                            >
                                                <Remove />
                                            </IconButton>
                                        </Box>
                                    ))}

                                    <Button
                                        size="small"
                                        startIcon={<Add />}
                                        onClick={addCustomReminder}
                                    >
                                        הוסף תזכורת
                                    </Button>
                                </Box>
                            </Paper>

                            {/* Follow-up Settings */}
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    מעקב אחר פגישה
                                </Typography>

                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.notifications.followUp.enabled}
                                                onChange={(e) => handleSettingChange('notifications.followUp.enabled', e.target.checked)}
                                            />
                                        }
                                        label="הפעל מעקב אחר פגישה"
                                    />
                                </FormGroup>

                                <TextField
                                    fullWidth
                                    label="עיכוב מעקב (שעות)"
                                    type="number"
                                    value={settings.notifications.followUp.delayHours}
                                    onChange={(e) => handleSettingChange('notifications.followUp.delayHours', parseInt(e.target.value))}
                                    disabled={!settings.notifications.followUp.enabled}
                                    sx={{ mt: 2 }}
                                />
                            </Paper>
                        </Box>
                    )}

                    {/* Booking Page Tab */}
                    {activeTab === 3 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                עמוד הזמנה ציבורי
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="קישור ציבורי"
                                        value={settings.bookingPage.publicUrl}
                                        InputProps={{
                                            readOnly: true,
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={copyPublicUrl}>
                                                        <Copy />
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="תמונת כותרת"
                                        value={settings.bookingPage.headerImage}
                                        onChange={(e) => handleSettingChange('bookingPage.headerImage', e.target.value)}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="טקסט ברכה"
                                        value={settings.bookingPage.welcomeText}
                                        onChange={(e) => handleSettingChange('bookingPage.welcomeText', e.target.value)}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="הוראות"
                                        value={settings.bookingPage.instructions}
                                        onChange={(e) => handleSettingChange('bookingPage.instructions', e.target.value)}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        label="מדיניות"
                                        value={settings.bookingPage.policies}
                                        onChange={(e) => handleSettingChange('bookingPage.policies', e.target.value)}
                                    />
                                </Grid>
                            </Grid>

                            <Box display="flex" gap={2} mt={3}>
                                <Button
                                    variant="outlined"
                                    startIcon={<QrCode />}
                                    onClick={generateQRCode}
                                >
                                    צור QR Code
                                </Button>

                                <Button
                                    variant="outlined"
                                    onClick={() => window.open(settings.bookingPage.publicUrl, '_blank')}
                                >
                                    תצוגה מקדימה
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {/* Policies Tab */}
                    {activeTab === 4 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                מדיניות וכללים
                            </Typography>

                            {/* Cancellation Policy */}
                            <Paper sx={{ p: 2, mb: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    מדיניות ביטול
                                </Typography>

                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="הודעה מינימלית מראש (שעות)"
                                            type="number"
                                            value={settings.policies.cancellation.minNoticeHours}
                                            onChange={(e) => handleSettingChange('policies.cancellation.minNoticeHours', parseInt(e.target.value))}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="עמלת ביטול (%)"
                                            type="number"
                                            value={settings.policies.cancellation.cancellationFee}
                                            onChange={(e) => handleSettingChange('policies.cancellation.cancellationFee', parseInt(e.target.value))}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="טקסט מדיניות"
                                            value={settings.policies.cancellation.policyText}
                                            onChange={(e) => handleSettingChange('policies.cancellation.policyText', e.target.value)}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Booking Rules */}
                            <Paper sx={{ p: 2, mb: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    כללי הזמנה
                                </Typography>

                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="הזמנה מראש מקסימלית (ימים)"
                                            type="number"
                                            value={settings.policies.booking.maxAdvanceDays}
                                            onChange={(e) => handleSettingChange('policies.booking.maxAdvanceDays', parseInt(e.target.value))}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="הודעה מינימלית מראש (שעות)"
                                            type="number"
                                            value={settings.policies.booking.minAdvanceHours}
                                            onChange={(e) => handleSettingChange('policies.booking.minAdvanceHours', parseInt(e.target.value))}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="מקסימום פגישות ליום"
                                            type="number"
                                            value={settings.policies.booking.maxDailyAppointments}
                                            onChange={(e) => handleSettingChange('policies.booking.maxDailyAppointments', parseInt(e.target.value))}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="זמן חיץ בין פגישות (דקות)"
                                            type="number"
                                            value={settings.policies.booking.bufferMinutes}
                                            onChange={(e) => handleSettingChange('policies.booking.bufferMinutes', parseInt(e.target.value))}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Payment Settings */}
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    הגדרות תשלום
                                </Typography>

                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.policies.payment.requireUpfront}
                                                onChange={(e) => handleSettingChange('policies.payment.requireUpfront', e.target.checked)}
                                            />
                                        }
                                        label="דרוש תשלום מראש"
                                    />
                                </FormGroup>

                                <TextField
                                    fullWidth
                                    label="סכום מקדמה (%)"
                                    type="number"
                                    value={settings.policies.payment.depositAmount}
                                    onChange={(e) => handleSettingChange('policies.payment.depositAmount', parseInt(e.target.value))}
                                    disabled={!settings.policies.payment.requireUpfront}
                                    sx={{ mt: 2 }}
                                />
                            </Paper>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Save Button */}
            <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSave}
                    disabled={saving || !hasUnsavedChanges}
                >
                    {saving ? 'שומר...' : 'שמור הגדרות'}
                </Button>
            </Box>
        </Container>
    );
};

export default CalendarSettings;
