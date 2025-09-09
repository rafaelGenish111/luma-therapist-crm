import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Alert,
    Divider,
    CircularProgress,
    Snackbar
} from '@mui/material';
import { Save as SaveIcon, Edit as EditIcon } from '@mui/icons-material';
import { updateCalendlyLink, getTherapistProfile } from '../../../services/therapistService';

const CalendlyPage = () => {
    const [calendlyUrl, setCalendlyUrl] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [therapist, setTherapist] = useState(null);

    useEffect(() => {
        loadTherapistProfile();
    }, []);

    const loadTherapistProfile = async () => {
        try {
            setLoading(true);
            const response = await getTherapistProfile();
            const therapistData = response.data;
            setTherapist(therapistData);

            if (therapistData.calendlyUrl) {
                setCalendlyUrl(therapistData.calendlyUrl);
                setIsConnected(true);
            }
        } catch (err) {
            console.error('Error loading therapist profile:', err);
            setError('שגיאה בטעינת פרופיל המטפלת');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCalendlyLink = async () => {
        try {
            setSaving(true);
            setError('');

            // ולידציה
            if (!calendlyUrl.trim()) {
                setError('קישור Calendly הוא שדה חובה');
                return;
            }

            if (!calendlyUrl.startsWith('https://calendly.com/')) {
                setError('קישור Calendly חייב להתחיל ב-https://calendly.com');
                return;
            }

            await updateCalendlyLink(calendlyUrl.trim());
            setIsConnected(true);
            setSuccess('חשבון קלנדלי חובר בהצלחה!');
            setShowSnackbar(true);
        } catch (err) {
            console.error('Error saving Calendly link:', err);
            setError(err.message || 'שגיאה בשמירת קישור Calendly');
        } finally {
            setSaving(false);
        }
    };

    const handleChangeLink = () => {
        setIsConnected(false);
        setCalendlyUrl('');
        setError('');
        setSuccess('');
    };



    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight={600}>
                חיבור Calendly
            </Typography>

            {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* הודעות הצלחה/שגיאה */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}

                    {/* מצב לא מחובר - טופס הזנה */}
                    {!isConnected && (
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                🔗 חיבור חשבון Calendly
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Typography variant="body1" sx={{ mb: 3 }}>
                                כדי לאפשר ללקוחות שלך לקבוע פגישות, חברי את חשבון ה-Calendly שלך.
                            </Typography>

                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={8}>
                                    <TextField
                                        fullWidth
                                        label="קישור Calendly"
                                        placeholder="https://calendly.com/your-username"
                                        value={calendlyUrl}
                                        onChange={(e) => setCalendlyUrl(e.target.value)}
                                        helperText="הדביקי את הקישור המלא של Calendly שלך"
                                        error={!!error}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSaveCalendlyLink}
                                        disabled={saving || !calendlyUrl.trim()}
                                        sx={{ height: 56 }}
                                    >
                                        {saving ? <CircularProgress size={20} /> : 'שמור'}
                                    </Button>
                                </Grid>
                            </Grid>

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                💡 <strong>איך למצוא את הקישור:</strong><br />
                                1. היכנסי ל-<a href="https://calendly.com" target="_blank" rel="noopener noreferrer">Calendly.com</a><br />
                                2. לחצי על "Share" ליד סוג הפגישה שלך<br />
                                3. העתיקי את הקישור המלא
                            </Typography>
                        </Paper>
                    )}

                    {/* מצב מחובר - תצוגת iframe */}
                    {isConnected && (
                        <Paper sx={{ p: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight={600}>
                                    ✅ Calendly מחובר
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={handleChangeLink}
                                >
                                    שינוי לינק
                                </Button>
                            </Box>
                            <Divider sx={{ mb: 3 }} />

                            <Typography variant="body1" sx={{ mb: 3 }}>
                                לקוחות שלך יכולים כעת לקבוע פגישות דרך הקישור שלך: <strong>{calendlyUrl}</strong>
                            </Typography>

                            {/* iframe של Calendly */}
                            <Box sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                overflow: 'hidden',
                                height: 600
                            }}>
                                <iframe
                                    src={calendlyUrl}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        border: "none"
                                    }}
                                    title="Calendly Scheduling"
                                />
                            </Box>
                        </Paper>
                    )}
                </>
            )}

            {/* Snackbar להודעות */}
            <Snackbar
                open={showSnackbar}
                autoHideDuration={6000}
                onClose={() => setShowSnackbar(false)}
            >
                <Alert
                    onClose={() => setShowSnackbar(false)}
                    severity={error ? "error" : "success"}
                >
                    {error || success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CalendlyPage;
