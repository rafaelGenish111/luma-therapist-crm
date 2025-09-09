import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import calendlyService from '../../services/calendlyService';
import treatmentTypeService from '../../services/treatmentTypeService';
import importantInfoService from '../../services/importantInfoService';
import BookingModal from '../../components/website/BookingModal';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Stack,
    Alert,
    Divider
} from '@mui/material';
import {
    AccessTime as TimeIcon,
    MonetizationOn as PriceIcon,
    Info as InfoIcon,
    CalendarToday as CalendarIcon,
    Email as EmailIcon
} from '@mui/icons-material';

export default function BookAppointment() {
    const { therapistId } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calendlyData, setCalendlyData] = useState(null);
    const [calendlyLoading, setCalendlyLoading] = useState(true);
    const [treatmentTypes, setTreatmentTypes] = useState([]);
    const [selectedTreatmentType, setSelectedTreatmentType] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [importantInfo, setImportantInfo] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // טעינת פרופיל מטפלת
                const profileRes = await api.get(`/therapists/${therapistId}`);
                setProfile(profileRes.data.data);

                // טעינת נתוני Calendly
                try {
                    const calendlyRes = await calendlyService.getPublicData(therapistId);
                    setCalendlyData(calendlyRes.data.data);
                } catch (calendlyError) {
                    console.error('Error fetching Calendly data:', calendlyError);
                    setCalendlyData({ isEnabled: false });
                } finally {
                    setCalendlyLoading(false);
                }

                // טעינת סוגי טיפולים
                try {
                    const treatmentTypesRes = await treatmentTypeService.getByTherapist(therapistId);
                    setTreatmentTypes(treatmentTypesRes.data || []);
                } catch (treatmentTypesError) {
                    console.error('Error fetching treatment types:', treatmentTypesError);
                    setTreatmentTypes([]);
                }

                // טעינת מידע חשוב (ציבורי)
                try {
                    const importantInfoRes = await importantInfoService.getByTherapist(therapistId);
                    setImportantInfo(importantInfoRes.data || null);
                } catch (importantInfoError) {
                    console.error('Error fetching important info:', importantInfoError);
                    setImportantInfo(null);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                setCalendlyData({ isEnabled: false });
                setCalendlyLoading(false);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [therapistId]);

    const displayName = profile?.businessName || (profile ? `${profile.firstName} ${profile.lastName}` : '');

    // שימוש בסוגי טיפולים דינמיים או ברירת מחדל
    const treatmentInfo = treatmentTypes.length > 0
        ? treatmentTypes.map(type => ({
            type: type.name,
            duration: treatmentTypeService.formatDuration(type.duration),
            price: treatmentTypeService.formatPrice(type.price, type.currency),
            color: type.color,
            description: type.description
        }))
        : [
            { type: 'פגישת יעוץ ראשונית', duration: '60 דקות', price: '300 ₪', color: '#4A90E2' },
            { type: 'פגישת טיפול', duration: '50 דקות', price: '250 ₪', color: '#F5A623' },
            { type: 'פגישת המשך', duration: '45 דקות', price: '200 ₪', color: '#7ED321' }
        ];

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6">טוען...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header Section */}
            <Paper sx={{
                p: { xs: 4, md: 6 },
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(74,144,226,0.1) 0%, rgba(245,166,35,0.1) 100%)',
                borderRadius: 4,
                mb: 6,
                border: '1px solid rgba(74,144,226,0.2)'
            }}>
                <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{
                        mb: 2,
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        background: 'linear-gradient(135deg, #4A90E2 0%, #F5A623 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent'
                    }}
                >
                    קביעת תור אצל {displayName}
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto', mb: 3 }}>
                    בחרי זמן נוח עבורך ונקבע פגישה בקלות ובמהירות
                </Typography>

                <Alert
                    severity="info"
                    sx={{
                        maxWidth: '500px',
                        mx: 'auto',
                        borderRadius: 3,
                        '& .MuiAlert-icon': { fontSize: '1.5rem' }
                    }}
                >
                    <Typography variant="body1" fontWeight={500}>
                        🕐 זמן תגובה: עד 24 שעות | 📞 פגישות טלפוניות ופרונטליות זמינות
                    </Typography>
                </Alert>
            </Paper>

            <Grid container spacing={4}>
                {/* Treatment Information */}
                <Grid item xs={12} md={4}>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                        סוגי טיפולים
                    </Typography>

                    <Stack spacing={3}>
                        {treatmentInfo.map((treatment, index) => (
                            <Card
                                key={index}
                                sx={{
                                    borderRadius: 3,
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                    transition: 'transform 0.2s ease',
                                    border: `2px solid ${selectedTreatmentType === treatment ? treatment.color : treatment.color + '20'}`,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        borderColor: treatment.color
                                    }
                                }}
                                onClick={() => setSelectedTreatmentType(treatment)}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="h6" fontWeight={700} sx={{ color: treatment.color }}>
                                            {treatment.type}
                                        </Typography>
                                        {selectedTreatmentType === treatment && (
                                            <Chip
                                                label="נבחר"
                                                size="small"
                                                color="success"
                                                variant="filled"
                                            />
                                        )}
                                    </Box>

                                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                                        <Chip
                                            icon={<TimeIcon />}
                                            label={treatment.duration}
                                            variant="outlined"
                                            size="small"
                                            sx={{ borderColor: treatment.color, color: treatment.color }}
                                        />
                                        <Chip
                                            icon={<PriceIcon />}
                                            label={treatment.price}
                                            variant="outlined"
                                            size="small"
                                            sx={{ borderColor: treatment.color, color: treatment.color }}
                                        />
                                    </Stack>

                                    <Typography variant="body2" color="text.secondary">
                                        {treatment.description || (treatment.type.includes('ראשונית') ? 'מתאים לפגישה הכרויות ראשונה' : 'מתאים למעקב וטיפול מתמשך')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>

                    {/* Additional Info */}
                    <Paper sx={{
                        p: 3,
                        mt: 3,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(245,166,35,0.05) 0%, rgba(74,144,226,0.05) 100%)',
                        border: '1px solid rgba(74,144,226,0.1)'
                    }}>
                        <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                            <InfoIcon color="primary" />
                            <Typography variant="h6" fontWeight={600}>
                                {importantInfo?.title || 'מידע חשוב'}
                            </Typography>
                        </Box>
                        <Stack spacing={1}>
                            {importantInfo?.items?.length > 0 ? (
                                importantInfo.items.map((item) => (
                                    <Typography key={item.id} variant="body2" color="text.secondary">
                                        • {item.text}
                                    </Typography>
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    • ביטול פגישה - עד 24 שעות מראש
                                </Typography>
                            )}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Calendly Booking Section */}
                <Grid item xs={12} md={8}>
                    {/* בחירת סוג טיפול */}
                    {treatmentInfo.length > 0 ? (
                        <Paper sx={{
                            p: 3,
                            mb: 3,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, rgba(74,144,226,0.05) 0%, rgba(245,166,35,0.05) 100%)',
                            border: '1px solid rgba(74,144,226,0.2)'
                        }}>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                                בחר/י סוג טיפול
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                בחר/י את סוג הטיפול הרצוי לפני קביעת התור
                            </Typography>

                            <Grid container spacing={2}>
                                {treatmentInfo.map((treatment, index) => (
                                    <Grid item xs={12} sm={6} key={index}>
                                        <Card
                                            sx={{
                                                borderRadius: 2,
                                                border: `2px solid ${selectedTreatmentType === treatment ? treatment.color : 'transparent'}`,
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                                }
                                            }}
                                            onClick={() => setSelectedTreatmentType(treatment)}
                                        >
                                            <CardContent sx={{ p: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight={600} sx={{ color: treatment.color }}>
                                                        {treatment.type}
                                                    </Typography>
                                                    {selectedTreatmentType === treatment && (
                                                        <Chip
                                                            label="✓"
                                                            size="small"
                                                            color="success"
                                                            variant="filled"
                                                        />
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {treatment.duration}
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={600} sx={{ color: treatment.color }}>
                                                        {treatment.price}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>

                            {selectedTreatmentType && (
                                <Alert severity="success" sx={{ mt: 2 }}>
                                    <Typography variant="body2">
                                        נבחר: <strong>{selectedTreatmentType.type}</strong> - {selectedTreatmentType.duration} - {selectedTreatmentType.price}
                                    </Typography>
                                </Alert>
                            )}
                        </Paper>
                    ) : (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                המטפל עדיין לא הגדיר סוגי טיפולים. ניתן לקבוע תור ישירות.
                            </Typography>
                        </Alert>
                    )}

                    <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                        {selectedTreatmentType ? `קביעת תור - ${selectedTreatmentType.type}` : 'בחירת תאריך ושעה'}
                    </Typography>

                    <Paper sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}>
                        {/* הודעה אם לא נבחר סוג טיפול */}
                        {treatmentInfo.length > 0 && !selectedTreatmentType ? (
                            <Box sx={{
                                minHeight: 400,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, rgba(248,250,252,0.8) 0%, rgba(255,255,255,0.8) 100%)',
                                p: 4
                            }}>
                                <Box textAlign="center">
                                    <CalendarIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.7 }} />
                                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                                        בחר/י סוג טיפול תחילה
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        יש לבחור סוג טיפול מהרשימה למעלה כדי להמשיך לקביעת תור
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            <>
                                {/* Calendly Embed */}
                                {profile?.calendlyUrl ? (
                                    <Box sx={{
                                        minHeight: 600,
                                        width: '100%'
                                    }}>
                                        <iframe
                                            src={profile.calendlyUrl}
                                            style={{
                                                width: '100%',
                                                height: '600px',
                                                border: 'none',
                                                borderRadius: '12px'
                                            }}
                                            title="Calendly Scheduling"
                                            frameBorder="0"
                                        />
                                    </Box>
                                ) : (
                                    <Box sx={{
                                        minHeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'linear-gradient(135deg, rgba(248,250,252,0.8) 0%, rgba(255,255,255,0.8) 100%)',
                                        border: '2px dashed rgba(74,144,226,0.3)',
                                        p: 4
                                    }}>
                                        <Box textAlign="center">
                                            <CalendarIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2, opacity: 0.7 }} />
                                            <Typography variant="h5" fontWeight={700} sx={{ mb: 2, color: 'primary.main' }}>
                                                שילוב Calendly
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: '400px' }}>
                                                כאן יוטמע וידג'ט Calendly המתחבר ליומן Google Calendar שלך
                                            </Typography>

                                            <Alert severity="info" sx={{ maxWidth: '500px', textAlign: 'right' }}>
                                                <Typography variant="body2" fontWeight={500}>
                                                    להטמעת Calendly:
                                                </Typography>
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    1. צרי חשבון ב-Calendly.com<br />
                                                    2. התחברי עם Google Calendar<br />
                                                    3. העתיקי את קוד ההטמעה לכאן<br />
                                                    4. הוידג'ט יוצג במקום התיבה הזו
                                                </Typography>
                                            </Alert>

                                            {/* כפתורי קביעת תור */}
                                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                                                <Button
                                                    variant="contained"
                                                    size="large"
                                                    startIcon={<CalendarIcon />}
                                                    onClick={() => setModalOpen(true)}
                                                    sx={{
                                                        py: 2,
                                                        px: 4,
                                                        borderRadius: 3,
                                                        fontSize: '1.1rem',
                                                        fontWeight: 700,
                                                        background: 'linear-gradient(135deg, #4A90E2 0%, #F5A623 100%)',
                                                        boxShadow: '0 6px 20px rgba(74,144,226,0.3)',
                                                        '&:hover': {
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: '0 8px 28px rgba(74,144,226,0.4)'
                                                        },
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    קביעת תור דרך המערכת
                                                </Button>

                                                <Button
                                                    variant="outlined"
                                                    size="large"
                                                    startIcon={<EmailIcon />}
                                                    href={`mailto:${profile?.businessEmail || profile?.email}?subject=בקשה לקביעת תור${selectedTreatmentType ? ` - ${selectedTreatmentType.type}` : ''}&body=שלום ${displayName},%0A%0Aהייתי רוצה לקבוע תור לטיפול.${selectedTreatmentType ? `%0A%0Aסוג טיפול: ${selectedTreatmentType.type}%0Aמשך זמן: ${selectedTreatmentType.duration}%0Aמחיר: ${selectedTreatmentType.price}` : ''}%0A%0Aשם מלא: %0Aטלפון: %0Aתאריך מועדף: %0Aשעה מועדפת: %0A%0Aתודה!`}
                                                    sx={{
                                                        py: 2,
                                                        px: 4,
                                                        borderRadius: 3,
                                                        fontSize: '1.1rem',
                                                        fontWeight: 700,
                                                        borderColor: 'primary.main',
                                                        color: 'primary.main',
                                                        '&:hover': {
                                                            transform: 'translateY(-2px)',
                                                            borderColor: 'primary.dark',
                                                            backgroundColor: 'primary.main',
                                                            color: 'white'
                                                        },
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    קביעת תור באימייל
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Box>
                                )}
                            </>
                        )}
                    </Paper>


                </Grid>
            </Grid>

            {/* מודאל קביעת תור */}
            <BookingModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                therapist={profile}
                calendlyUrl={profile?.calendlyUrl}
                selectedTreatmentType={selectedTreatmentType}
            />
        </Box>
    );
} 