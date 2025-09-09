import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import healthDeclarationService from '../../services/healthDeclarationService';
import api from '../../services/api';
import ConsentCheckbox from '../../components/ConsentCheckbox';
// import HealthDeclarationSignModal from '../../components/HealthDeclarationSignModal';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    FormControl,
    FormLabel,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Alert,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    Divider,
    Card,
    CardContent,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Send as SendIcon,
    CheckCircle as CheckIcon,
    Info as InfoIcon
} from '@mui/icons-material';

export default function HealthDeclaration() {
    const { therapistId } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [activeStep, setActiveStep] = useState(0);

    // Digital Signature Modal State
    const [signModalOpen, setSignModalOpen] = useState(false);
    const [signedDocument, setSignedDocument] = useState(null);

    const [formData, setFormData] = useState({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        idNumber: '',
        age: '',
        medicalConditions: [],
        medications: '',
        allergies: '',
        previousSurgeries: '',
        pregnancyStatus: false,
        breastfeeding: false,
        physicalLimitations: '',
        mentalHealthConditions: [],
        currentStress: '',
        previousTherapy: '',
        expectations: '',
        additionalInfo: '',
        consent: false
    });
    const [privacyConsent, setPrivacyConsent] = useState(false);

    // הגדרת סוגי הצהרות לפי מקצוע
    const getDeclarationQuestions = () => {
        const profession = profile?.profession || '';

        if (profession.includes('עיסוי') || profession.includes('פיזיו')) {
            return {
                title: 'הצהרת בריאות לטיפולי עיסוי ופיזיותרפיה',
                medicalConditions: [
                    'בעיות לב וכלי דם',
                    'בעיות עמוד שדרה',
                    'פציעות ספורט',
                    'דלקות מפרקים',
                    'סוכרת',
                    'לחץ דם גבוה',
                    'בעיות עור',
                    'אוסטאופורוזיס'
                ],
                mentalHealth: false
            };
        } else if (profession.includes('פסיכולוג') || profession.includes('יעוץ') || profession.includes('טיפול נפשי')) {
            return {
                title: 'הצהרת בריאות לטיפול פסיכולוגי',
                medicalConditions: [
                    'דיכאון',
                    'חרדה',
                    'הפרעות אכילה',
                    'הפרעת קשב וריכוז',
                    'הפרעה דו קוטבית',
                    'הפרעות שינה',
                    'טראומה או PTSD',
                    'התמכרויות'
                ],
                mentalHealth: true
            };
        } else {
            return {
                title: 'הצהרת בריאות כללית',
                medicalConditions: [
                    'מחלות כרוניות',
                    'תרופות קבועות',
                    'אלרגיות',
                    'ניתוחים קודמים',
                    'בעיות פיזיות',
                    'בעיות נפשיות',
                    'הריון או הנקה',
                    'אחר'
                ],
                mentalHealth: true
            };
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/therapists/${therapistId}`);
                setProfile(res.data.data);
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('שגיאה בטעינת פרטי המטפלת');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [therapistId]);

    // ולידציה לת.ז. ישראלי
    const validateIsraeliId = (id) => {
        if (!id || id.length !== 9) return false;

        // בדיקה שכל התווים הם ספרות
        if (!/^\d{9}$/.test(id)) return false;

        // אלגוריתם בדיקת ת.ז. ישראלי
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            let digit = parseInt(id[i]);
            if (i % 2 === 1) {
                digit *= 2;
                if (digit > 9) {
                    digit = Math.floor(digit / 10) + (digit % 10);
                }
            }
            sum += digit;
        }
        return sum % 10 === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        // ולידציה מיוחדת לת.ז.
        if (name === 'idNumber') {
            // מונע הקלדת אותיות ומגביל ל-9 ספרות
            const numericValue = value.replace(/\D/g, '').slice(0, 9);
            setFormData(prev => ({
                ...prev,
                [name]: numericValue
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleMedicalConditionChange = (condition) => {
        setFormData(prev => ({
            ...prev,
            medicalConditions: prev.medicalConditions.includes(condition)
                ? prev.medicalConditions.filter(c => c !== condition)
                : [...prev.medicalConditions, condition]
        }));
    };

    const handleNext = () => {
        setActiveStep(prev => prev + 1);
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        console.log('Starting form submission...');
        console.log('Form data:', formData);
        console.log('Therapist ID:', therapistId);

        if (!formData.consent) {
            setError('יש לאשר את ההסכמה לטיפול');
            return;
        }

        if (!privacyConsent) {
            setError('יש לאשר את מדיניות הפרטיות ותנאי השימוש');
            return;
        }

        // פתח מודאל אישור פשוט
        setSignModalOpen(true);
    };

    const handleConfirmSubmission = async () => {
        try {
            setSubmitting(true);
            setError('');

            const submitData = {
                ...formData,
                therapistId
            };

            console.log('Submitting data:', submitData);

            const response = await healthDeclarationService.create(submitData);
            console.log('Response:', response);

            const saved = response.data?.saved !== false; // כברירת מחדל true אם לא קיים
            if (saved && response.data?.data?._id) {
                setSignedDocument({
                    signedDocumentId: response.data.data._id,
                    signedAt: new Date().toISOString()
                });
            } else {
                setSignedDocument(null);
            }
            setSubmitted(true);
            setSignModalOpen(false);

        } catch (err) {
            console.error('Error submitting declaration:', err);
            console.error('Error details:', err.response?.data);
            setError(`שגיאה בשליחת ההצהרה: ${err.response?.data?.message || err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const steps = ['פרטים אישיים', 'מצב בריאותי', 'אישור ושליחה'];
    const declarationQuestions = getDeclarationQuestions();

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    טוען...
                </Typography>
            </Box>
        );
    }

    if (submitted) {
        return (
            <Box sx={{ textAlign: 'center', py: 6 }}>
                <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
                <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                    {signedDocument ? 'הצהרת הבריאות נשלחה ונחתמה בהצלחה!' : 'תודה! הפרטים התקבלו'}
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                    {signedDocument
                        ? 'ההצהרה נשלחה בהצלחה למטפלת.'
                        : 'אם יש לך תיק קיים אצל המטפלת, ניתן לעדכן פרטים כדי שנזהה אותך.'}
                </Typography>

                {signedDocument && (
                    <Paper elevation={1} sx={{ p: 3, mb: 3, maxWidth: 500, mx: 'auto' }}>
                        <Typography variant="h6" gutterBottom>
                            פרטי השליחה:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>מזהה הצהרה:</strong> {signedDocument.signedDocumentId}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            <strong>תאריך שליחה:</strong> {new Date(signedDocument.signedAt).toLocaleString('he-IL')}
                        </Typography>
                    </Paper>
                )}

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    המטפלת תיצור איתך קשר בהקדם לקביעת תור.
                </Typography>
            </Box>
        );
    }

    const displayName = profile?.businessName || (profile ? `${profile.firstName} ${profile.lastName}` : '');

    return (
        <Box>
            {/* Header */}
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
                    {declarationQuestions.title}
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto', mb: 3 }}>
                    אצל {displayName}
                </Typography>

                <Alert
                    severity="info"
                    sx={{
                        maxWidth: '500px',
                        mx: 'auto',
                        borderRadius: 3
                    }}
                >
                    <Typography variant="body2">
                        מילוי הצהרת בריאות חשוב לבטיחותך ולהתאמת הטיפול המתאים עבורך
                    </Typography>
                </Alert>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Progress Bar */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        התקדמות: שלב {activeStep + 1} מתוך {steps.length}
                    </Typography>
                    <Typography variant="body2" color="primary" fontWeight={600}>
                        {Math.round(((activeStep + 1) / steps.length) * 100)}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={((activeStep + 1) / steps.length) * 100}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                        '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(135deg, #4A90E2 0%, #F5A623 100%)',
                            borderRadius: 4
                        }
                    }}
                />
            </Box>

            {/* Stepper */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3, overflow: 'hidden' }}>
                <Stepper
                    activeStep={activeStep}
                    alternativeLabel
                    sx={{
                        direction: 'ltr', // Force LTR for stepper
                        '& .MuiStepLabel-root .Mui-completed': {
                            color: '#4A90E2',
                        },
                        '& .MuiStepLabel-root .Mui-active': {
                            color: '#4A90E2',
                        },
                        '& .MuiStepLabel-iconContainer': {
                            color: '#e0e0e0',
                            '&.Mui-active': {
                                color: '#4A90E2',
                            },
                            '&.Mui-completed': {
                                color: '#4A90E2',
                            }
                        },
                        '& .MuiStepIcon-root': {
                            fontSize: '2rem',
                            '&.Mui-active': {
                                color: '#4A90E2',
                            },
                            '&.Mui-completed': {
                                color: '#4A90E2',
                            }
                        },
                        '& .MuiStepConnector-line': {
                            borderColor: '#e0e0e0',
                        },
                        '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
                            borderColor: '#4A90E2',
                        },
                        '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
                            borderColor: '#4A90E2',
                        }
                    }}
                >
                    {steps.map((label, index) => (
                        <Step key={label} completed={index < activeStep}>
                            <StepLabel
                                sx={{
                                    '& .MuiStepLabel-labelContainer': {
                                        mt: 1
                                    },
                                    '& .MuiStepLabel-label': {
                                        fontWeight: activeStep === index ? 700 : 500,
                                        color: activeStep === index ? '#4A90E2' : 'text.secondary',
                                        direction: 'rtl' // RTL for Hebrew text
                                    }
                                }}
                            >
                                {label}
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Paper>

            {/* Form Steps */}
            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
                {activeStep === 0 && (
                    <Box>
                        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                            פרטים אישיים
                        </Typography>

                        <Box sx={{ display: 'grid', gap: 3 }}>
                            <TextField
                                name="clientName"
                                label="שם מלא *"
                                value={formData.clientName}
                                onChange={handleInputChange}
                                fullWidth
                                required
                            />

                            <TextField
                                name="idNumber"
                                label="תעודת זהות *"
                                value={formData.idNumber}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                inputProps={{
                                    maxLength: 9,
                                    pattern: "[0-9]*"
                                }}
                                error={Boolean(formData.idNumber && !validateIsraeliId(formData.idNumber))}
                                helperText={
                                    formData.idNumber && !validateIsraeliId(formData.idNumber)
                                        ? "תעודת הזהות אינה תקינה"
                                        : "יש להזין 9 ספרות בלבד"
                                }
                                placeholder="123456789"
                            />

                            <TextField
                                name="clientEmail"
                                label="כתובת אימייל *"
                                type="email"
                                value={formData.clientEmail}
                                onChange={handleInputChange}
                                fullWidth
                                required
                            />

                            <TextField
                                name="clientPhone"
                                label="מספר טלפון *"
                                value={formData.clientPhone}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                placeholder="05X-XXXXXXX"
                            />

                            <TextField
                                name="age"
                                label="גיל *"
                                type="number"
                                value={formData.age}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                inputProps={{ min: 1, max: 120 }}
                            />
                        </Box>
                    </Box>
                )}

                {activeStep === 1 && (
                    <Box>
                        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                            מצב בריאותי
                        </Typography>

                        <Box sx={{ display: 'grid', gap: 4 }}>
                            {/* Medical Conditions */}
                            <FormControl component="fieldset">
                                <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
                                    {declarationQuestions.mentalHealth ? 'מצבים רלוונטיים:' : 'מצבים רפואיים:'}
                                </FormLabel>
                                <FormGroup>
                                    {declarationQuestions.medicalConditions.map((condition) => (
                                        <FormControlLabel
                                            key={condition}
                                            control={
                                                <Checkbox
                                                    checked={formData.medicalConditions.includes(condition)}
                                                    onChange={() => handleMedicalConditionChange(condition)}
                                                />
                                            }
                                            label={condition}
                                        />
                                    ))}
                                </FormGroup>
                            </FormControl>

                            {/* Conditional Questions */}
                            {!declarationQuestions.mentalHealth && (
                                <>
                                    <TextField
                                        name="medications"
                                        label="תרופות שאת/ה נוטל/ת כיום"
                                        value={formData.medications}
                                        onChange={handleInputChange}
                                        fullWidth
                                        multiline
                                        rows={2}
                                    />

                                    <TextField
                                        name="allergies"
                                        label="אלרגיות ידועות"
                                        value={formData.allergies}
                                        onChange={handleInputChange}
                                        fullWidth
                                        multiline
                                        rows={2}
                                    />

                                    <TextField
                                        name="previousSurgeries"
                                        label="ניתוחים קודמים"
                                        value={formData.previousSurgeries}
                                        onChange={handleInputChange}
                                        fullWidth
                                        multiline
                                        rows={2}
                                    />

                                    <Box>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    name="pregnancyStatus"
                                                    checked={formData.pregnancyStatus}
                                                    onChange={handleInputChange}
                                                />
                                            }
                                            label="בהריון כעת"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    name="breastfeeding"
                                                    checked={formData.breastfeeding}
                                                    onChange={handleInputChange}
                                                />
                                            }
                                            label="מניקה כעת"
                                        />
                                    </Box>

                                    <TextField
                                        name="physicalLimitations"
                                        label="מגבלות פיזיות או כאבים"
                                        value={formData.physicalLimitations}
                                        onChange={handleInputChange}
                                        fullWidth
                                        multiline
                                        rows={3}
                                    />
                                </>
                            )}

                            {declarationQuestions.mentalHealth && (
                                <>
                                    <TextField
                                        name="currentStress"
                                        label="מצבי לחץ או קושי נוכחיים"
                                        value={formData.currentStress}
                                        onChange={handleInputChange}
                                        fullWidth
                                        multiline
                                        rows={3}
                                    />

                                    <TextField
                                        name="previousTherapy"
                                        label="טיפולים פסיכולוגיים קודמים"
                                        value={formData.previousTherapy}
                                        onChange={handleInputChange}
                                        fullWidth
                                        multiline
                                        rows={2}
                                    />
                                </>
                            )}

                            <TextField
                                name="expectations"
                                label="מה את/ה מצפה/ה מהטיפול?"
                                value={formData.expectations}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={3}
                            />

                            <TextField
                                name="additionalInfo"
                                label="מידע נוסף שחשוב לך שנדע"
                                value={formData.additionalInfo}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={3}
                            />
                        </Box>
                    </Box>
                )}

                {activeStep === 2 && (
                    <Box>
                        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                            אישור ושליחה
                        </Typography>

                        <Card sx={{ mb: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                    סיכום הצהרתך:
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>שם:</strong> {formData.clientName}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>ת.ז.:</strong> {formData.idNumber}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>גיל:</strong> {formData.age}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>מצבים רלוונטיים:</strong> {formData.medicalConditions.length > 0 ? formData.medicalConditions.join(', ') : 'אין'}
                                </Typography>
                            </CardContent>
                        </Card>

                        <Alert severity="warning" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                <strong>חשוב לדעת:</strong> המידע שתמסרי ישמר בסודיות מלאה ויעבור רק למטפלת.
                                המידע משמש לצורך התאמת הטיפול המתאים ובטיחותך.
                            </Typography>
                        </Alert>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="consent"
                                    checked={formData.consent}
                                    onChange={handleInputChange}
                                    required
                                />
                            }
                            label={
                                <Typography variant="body2">
                                    אני מאשרת כי המידע שמסרתי נכון ומדויק, ואני מסכימה לקבלת טיפול על בסיס מידע זה.
                                    אני מבינה כי עליי להודיע למטפלת על כל שינוי במצבי הבריאותי.
                                </Typography>
                            }
                        />
                    </Box>
                )}

                <Divider sx={{ my: 4 }} />

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        variant="outlined"
                        size="large"
                    >
                        חזור
                    </Button>

                    {activeStep === steps.length - 1 ? (
                        <>
                            <ConsentCheckbox
                                checked={privacyConsent}
                                onChange={setPrivacyConsent}
                            />
                            <Button
                                onClick={handleSubmit}
                                variant="contained"
                                size="large"
                                startIcon={<SendIcon />}
                                disabled={submitting || !formData.consent || !privacyConsent}
                                sx={{
                                    background: 'linear-gradient(135deg, #4A90E2 0%, #F5A623 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #3A7BC8 0%, #E09612 100%)',
                                    }
                                }}
                            >
                                {submitting ? 'שולח...' : 'שלח הצהרה'}
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={handleNext}
                            variant="contained"
                            size="large"
                            disabled={
                                (activeStep === 0 && (!formData.clientName || !formData.clientEmail || !formData.clientPhone || !formData.age || !formData.idNumber || !validateIsraeliId(formData.idNumber))) ||
                                (activeStep === 1 && formData.medicalConditions.length === 0 && !formData.expectations)
                            }
                            sx={{
                                background: 'linear-gradient(135deg, #4A90E2 0%, #F5A623 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #3A7BC8 0%, #E09612 100%)',
                                }
                            }}
                        >
                            המשך
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* Confirmation Modal */}
            <Dialog
                open={signModalOpen}
                onClose={() => setSignModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Typography variant="h6" fontWeight={600}>
                        אישור שליחת הצהרת בריאות
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        האם את/ה בטוח/ה שברצונך לשלוח את הצהרת הבריאות?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        לאחר השליחה, ההצהרה תועבר למטפלת והיא תיצור איתך קשר לקביעת תור.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setSignModalOpen(false)}
                        variant="outlined"
                        disabled={submitting}
                    >
                        ביטול
                    </Button>
                    <Button
                        onClick={handleConfirmSubmission}
                        variant="contained"
                        disabled={submitting}
                        sx={{
                            background: 'linear-gradient(135deg, #4A90E2 0%, #F5A623 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #3A7BC8 0%, #E09612 100%)',
                            }
                        }}
                    >
                        {submitting ? (
                            <>
                                <CircularProgress size={20} sx={{ mr: 1 }} />
                                שולח...
                            </>
                        ) : (
                            'שלח הצהרה'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 
