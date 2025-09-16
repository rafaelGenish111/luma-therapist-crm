import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Button,
    Grid,
    TextField,
    MenuItem,
    Alert,
    CircularProgress,
    FormControlLabel,
    Switch,
    Divider,
    Stack,
    Chip,
    Checkbox
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers';
import api, { clientsApi, appointmentsApi } from '../../services/api';
import { updateTherapistProfile, updateOwnTheme } from '../../services/therapistService';

const steps = ['פרטים מקצועיים', 'שעות עבודה', 'עיצוב אתר אישי', 'יצירת תור ראשון'];

const professionOptions = [
    'פסיכולוגית', 'פסיכולוגית קלינית', 'פסיכולוגית חינוכית', 'פסיכולוגית התפתחותית',
    'עובדת סוציאלית', 'עובדת סוציאלית קלינית',
    'מטפלת זוגית', 'מטפלת משפחתית',
    'מטפלת באמנות', 'מטפלת בתנועה', 'מטפלת במוזיקה', 'מטפלת בדרמה',
    'מטפלת הוליסטית', 'רפלקסולוגית', 'קוסמטיקאית',
    'מטפלת ברפואה משלימה',
    'יועצת חינוכית', 'יועצת זוגית',
    'מאמנת אישית', 'מאמנת עסקית',
    'אחר'
];

const languageOptions = ['עברית', 'אנגלית', 'ערבית', 'רוסית', 'צרפתית', 'ספרדית', 'גרמנית', 'אחר'];
const themeOptions = ['default', 'modern', 'classic', 'minimal', 'colorful'];

const defaultWorkingHours = {
    sunday: { start: '09:00', end: '17:00', isWorking: false },
    monday: { start: '09:00', end: '17:00', isWorking: true },
    tuesday: { start: '09:00', end: '17:00', isWorking: true },
    wednesday: { start: '09:00', end: '17:00', isWorking: true },
    thursday: { start: '09:00', end: '17:00', isWorking: true },
    friday: { start: '09:00', end: '14:00', isWorking: true },
    saturday: { start: '09:00', end: '17:00', isWorking: false }
};

const dayLabels = {
    sunday: 'ראשון',
    monday: 'שני',
    tuesday: 'שלישי',
    wednesday: 'רביעי',
    thursday: 'חמישי',
    friday: 'שישי',
    saturday: 'שבת'
};

const OnboardingWizard = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // מרכז נתוני האון-בורדינג
    const [onboardingData, setOnboardingData] = useState({
        firstName: '',
        lastName: '',
        profession: 'פסיכולוגית',
        experience: 0,
        specializations: [],
        workingHours: defaultWorkingHours,
        themeName: 'default',
        primaryColor: '#4A90E2',
        secondaryColor: '#F5A623',
    });

    // Step 1 - professional details
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profession, setProfession] = useState('פסיכולוגית');
    const [experience, setExperience] = useState(0);
    const [specializationsText, setSpecializationsText] = useState('');

    // Step 2 - working hours
    const [workingHours, setWorkingHours] = useState(defaultWorkingHours);

    // Step 3 - website design
    const [primaryColor, setPrimaryColor] = useState('#4A90E2');
    const [secondaryColor, setSecondaryColor] = useState('#F5A623');
    const [theme, setTheme] = useState('default');
    const [logoPreview, setLogoPreview] = useState('');

    // Step 4 - first appointment
    const [clients, setClients] = useState([]);
    const [aptClient, setAptClient] = useState('');
    const [aptDate, setAptDate] = useState(new Date());
    const [aptDuration, setAptDuration] = useState(60);

    useEffect(() => {
        // נטען לקוחות עבור שלב 4
        const loadClients = async () => {
            try {
                const res = await clientsApi.getAll();
                setClients(res.data || []);
            } catch { }
        };
        loadClients();
    }, []);

    const handleNext = async () => {
        setError('');
        setSaving(true);
        try {
            if (activeStep === 3) {
                const specializations = specializationsText
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);

                // עדכון עיצוב (צבעים)
                await updateOwnTheme({ primaryColor, secondaryColor });

                // עדכון פרופיל ושעות + הפעלת אתר אישי עם תבנית
                await updateTherapistProfile({
                    firstName,
                    lastName,
                    profession,
                    experience: Number(experience) || 0,
                    specializations,
                    workingHours,
                    website: { isActive: true, theme }
                });

                if (aptClient) {
                    await appointmentsApi.create({
                        client: aptClient,
                        date: aptDate,
                        duration: Number(aptDuration),
                        type: 'טיפול רגיל',
                        status: 'מתוכננת'
                    });
                }
                navigate('/dashboard', { replace: true });
                return;
            }
            setActiveStep((s) => Math.min(s + 1, steps.length - 1));
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || 'שגיאה בשמירה');
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

    const renderStep = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField label="שם פרטי" fullWidth value={firstName} onChange={e => { setFirstName(e.target.value); setOnboardingData(d => ({ ...d, firstName: e.target.value })); }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField label="שם משפחה" fullWidth value={lastName} onChange={e => { setLastName(e.target.value); setOnboardingData(d => ({ ...d, lastName: e.target.value })); }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="מקצוע" fullWidth value={profession} onChange={e => { setProfession(e.target.value); setOnboardingData(d => ({ ...d, profession: e.target.value })); }}>
                                {professionOptions.map(p => (
                                    <MenuItem key={p} value={p}>{p}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField label="שנות ניסיון" type="number" fullWidth value={experience} onChange={e => { setExperience(e.target.value); setOnboardingData(d => ({ ...d, experience: Number(e.target.value) || 0 })); }} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="התמחויות (הפרידו בפסיקים)"
                                fullWidth
                                value={specializationsText}
                                onChange={e => { setSpecializationsText(e.target.value); setOnboardingData(d => ({ ...d, specializations: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })); }}
                                helperText="לדוגמה: CBT, חרדה, דיכאון"
                            />
                        </Grid>
                    </Grid>
                );
            case 1:
                return (
                    <Grid container spacing={2}>
                        {Object.keys(workingHours).map((dayKey) => (
                            <Grid item xs={12} key={dayKey}>
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={!!workingHours[dayKey].isWorking}
                                                    onChange={(e) => { const next = { ...workingHours, [dayKey]: { ...workingHours[dayKey], isWorking: e.target.checked } }; setWorkingHours(next); setOnboardingData(d => ({ ...d, workingHours: next })); }}
                                                />
                                            }
                                            label="עובדת ביום זה"
                                        />
                                        <Chip label={dayLabels[dayKey]} />
                                        <TextField
                                            type="time"
                                            label="שעת התחלה"
                                            value={workingHours[dayKey].start || ''}
                                            onChange={(e) => { const next = { ...workingHours, [dayKey]: { ...workingHours[dayKey], start: e.target.value } }; setWorkingHours(next); setOnboardingData(d => ({ ...d, workingHours: next })); }}
                                            size="small"
                                            sx={{ width: 150 }}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                        <TextField
                                            type="time"
                                            label="שעת סיום"
                                            value={workingHours[dayKey].end || ''}
                                            onChange={(e) => { const next = { ...workingHours, [dayKey]: { ...workingHours[dayKey], end: e.target.value } }; setWorkingHours(next); setOnboardingData(d => ({ ...d, workingHours: next })); }}
                                            size="small"
                                            sx={{ width: 150 }}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Stack>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                );
            case 2:
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField label="צבע ראשי" type="color" fullWidth value={primaryColor} onChange={e => { setPrimaryColor(e.target.value); setOnboardingData(d => ({ ...d, primaryColor: e.target.value })); }} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField label="צבע משני" type="color" fullWidth value={secondaryColor} onChange={e => { setSecondaryColor(e.target.value); setOnboardingData(d => ({ ...d, secondaryColor: e.target.value })); }} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField select label="תבנית עיצוב" fullWidth value={theme} onChange={e => { setTheme(e.target.value); setOnboardingData(d => ({ ...d, themeName: e.target.value })); }}>
                                        {themeOptions.map(t => (
                                            <MenuItem key={t} value={t}>{t}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" mb={0.5}>לוגו (אופציונלי)</Typography>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setLogoPreview(URL.createObjectURL(file));
                                        }}
                                    />
                                    {logoPreview && (
                                        <Box mt={1}>
                                            <img src={logoPreview} alt="לוגו" style={{ maxHeight: 48 }} />
                                        </Box>
                                    )}
                                </Grid>
                                <Grid item xs={12}>
                                    <Alert severity="info">האתר האישי יופעל אוטומטית לאחר שמירת שלב זה.</Alert>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" mb={1}>תצוגה מקדימה</Typography>
                            <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                                <Box sx={{
                                    bgcolor: primaryColor,
                                    color: '#000',
                                    px: 2,
                                    py: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {logoPreview && <img src={logoPreview} alt="לוגו" style={{ height: 32 }} />}
                                        <Typography variant="h6" sx={{ m: 0 }}>שם הקליניקה</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Typography variant="body2">בית</Typography>
                                        <Typography variant="body2">אודות</Typography>
                                        <Typography variant="body2">צור קשר</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ p: 3, bgcolor: secondaryColor }}>
                                    <Typography variant="h5" sx={{ mb: 1 }}>כותרת לדוגמה</Typography>
                                    <Typography variant="body2">כך יראו הצבעים שבחרת באתר האישי.</Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                );
            case 3:
                return (
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    select
                                    label="לקוח/ה"
                                    value={aptClient}
                                    onChange={e => setAptClient(e.target.value)}
                                    fullWidth
                                    helperText={clients.length === 0 ? 'עדיין אין לקוחות? ניתן לדלג על שלב זה' : ''}
                                >
                                    {clients.map(c => (
                                        <MenuItem key={c._id || c.id} value={c._id || c.id}>
                                            {c.firstName} {c.lastName}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <DateTimePicker
                                    label="תאריך ושעה"
                                    value={aptDate}
                                    onChange={setAptDate}
                                    ampm={false}
                                    minutesStep={5}
                                    disablePast
                                    viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField label="משך (דקות)" type="number" fullWidth value={aptDuration} onChange={e => setAptDuration(e.target.value)} />
                            </Grid>
                            <Grid item xs={12}>
                                <Alert severity="info">אם לא תבחר/י לקוח/ה, נדלג על יצירת התור.</Alert>
                            </Grid>
                        </Grid>
                    </LocalizationProvider>
                );
            default:
                return null;
        }
    };

    const totalSteps = steps.length;
    const step = activeStep + 1;

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f5f5f5">
            <Paper elevation={3} sx={{ p: 4, maxWidth: 1000, width: '100%' }}>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
                    <div
                        className="bg-blue-500 h-2 transition-all duration-300 ease-in-out"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                </div>
                <Typography variant="h5" mb={2}>תהליך התחלה</Typography>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                <Box mb={2}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                    )}
                    {renderStep()}
                </Box>
                <Box display="flex" justifyContent="space-between" gap={1} sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Button onClick={handleBack} disabled={activeStep === 0 || saving} sx={{ width: { xs: '100%', sm: 'auto' } }}>הקודם</Button>
                    <Button variant="contained" onClick={handleNext} disabled={saving} startIcon={saving ? <CircularProgress size={18} /> : null} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        {activeStep === steps.length - 1 ? 'סיום' : 'הבא'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default OnboardingWizard;


