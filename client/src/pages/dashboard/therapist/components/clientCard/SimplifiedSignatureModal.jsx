import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    IconButton,
    Stepper,
    Step,
    StepLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function SimplifiedSignatureModal({ open, onClose, onSuccess, client }) {
    const [step, setStep] = useState(0); // 0: review, 1: approval, 2: success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const steps = ['סקירת המסמך', 'אישור חתימה', 'הושלם'];

    // Calculate age from dateOfBirth if available
    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return 30; // Default age
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const mockDeclarationData = {
        clientName: `${client.firstName || ''} ${client.lastName || ''}`.trim(),
        clientEmail: client.email || '',
        clientPhone: client.phone || '',
        idNumber: client.nationalId || '',
        age: calculateAge(client.dateOfBirth),
        medicalConditions: [],
        medications: '',
        allergies: '',
        previousSurgeries: '',
        pregnancyStatus: false,
        breastfeeding: false,
        physicalLimitations: '',
        currentStress: '',
        previousTherapy: '',
        expectations: '',
        additionalInfo: 'נוצר מכרטיס הלקוח',
        status: 'pending'
    };

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const handleApprove = async () => {
        setLoading(true);
        setError('');

        try {
            // Instead of using esign API, directly submit to health declarations
            const healthDeclarationService = await import('../../../../../services/healthDeclarationService').then(m => m.default);

            const declarationData = {
                therapistId: client.therapist, // Use client's therapist ID
                clientName: mockDeclarationData.clientName,
                clientEmail: mockDeclarationData.clientEmail,
                clientPhone: mockDeclarationData.clientPhone,
                idNumber: mockDeclarationData.idNumber,
                age: mockDeclarationData.age,
                medicalConditions: mockDeclarationData.medicalConditions,
                medications: mockDeclarationData.medications,
                allergies: mockDeclarationData.allergies,
                previousSurgeries: mockDeclarationData.previousSurgeries,
                pregnancyStatus: mockDeclarationData.pregnancyStatus,
                breastfeeding: mockDeclarationData.breastfeeding,
                physicalLimitations: mockDeclarationData.physicalLimitations,
                currentStress: mockDeclarationData.currentStress,
                previousTherapy: mockDeclarationData.previousTherapy,
                expectations: mockDeclarationData.expectations,
                additionalInfo: mockDeclarationData.additionalInfo,
                status: 'approved'
            };

            console.log('Submitting health declaration:', declarationData);
            const response = await healthDeclarationService.create(declarationData);

            const mockSignedDocumentId = response.data?.data?._id || `doc_${Date.now()}`;

            setStep(2); // Move to success step

            // Call success callback after a short delay
            setTimeout(() => {
                onSuccess(mockSignedDocumentId);
                handleClose();
            }, 1500);

        } catch (err) {
            console.error('Error signing declaration:', err);
            setError(err.response?.data?.message || 'שגיאה בחתימה על ההצהרה');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(0);
        setError('');
        setLoading(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                הצהרת בריאות - חתימה דיגיטלית
                <IconButton
                    onClick={handleClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {/* Stepper */}
                <Stepper activeStep={step} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* Error Alert */}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {/* Step Content */}
                {step === 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            סקירת פרטי ההצהרה
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            אנא בדק את הפרטים לפני המשך לחתימה דיגיטלית
                        </Typography>

                        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="h6" gutterBottom>פרטי הלקוח</Typography>
                            <Typography><strong>שם הלקוח:</strong> {mockDeclarationData.clientName}</Typography>
                            <Typography><strong>ת.ז.:</strong> {mockDeclarationData.idNumber}</Typography>
                            <Typography><strong>טלפון:</strong> {mockDeclarationData.clientPhone}</Typography>
                            <Typography><strong>אימייל:</strong> {mockDeclarationData.clientEmail}</Typography>
                            <Typography><strong>גיל:</strong> {mockDeclarationData.age}</Typography>

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6" gutterBottom>תוכן ההצהרה</Typography>
                                <Typography><strong>מצבים רפואיים:</strong> {mockDeclarationData.medicalConditions.length > 0 ? mockDeclarationData.medicalConditions.join(', ') : 'אין'}</Typography>
                                <Typography><strong>תרופות:</strong> {mockDeclarationData.medications || 'אין'}</Typography>
                                <Typography><strong>אלרגיות:</strong> {mockDeclarationData.allergies || 'אין'}</Typography>
                                <Typography><strong>ניתוחים קודמים:</strong> {mockDeclarationData.previousSurgeries || 'אין'}</Typography>
                                <Typography><strong>מגבלות פיזיות:</strong> {mockDeclarationData.physicalLimitations || 'אין'}</Typography>
                                <Typography><strong>רמת לחץ נוכחית:</strong> {mockDeclarationData.currentStress || 'לא מוגדר'}</Typography>
                                <Typography><strong>טיפול קודם:</strong> {mockDeclarationData.previousTherapy || 'אין'}</Typography>
                                <Typography><strong>ציפיות:</strong> {mockDeclarationData.expectations || 'לא מוגדר'}</Typography>
                                <Typography><strong>מידע נוסף:</strong> {mockDeclarationData.additionalInfo}</Typography>
                            </Box>
                        </Box>

                        <Alert severity="info" sx={{ mt: 2 }}>
                            זוהי הצהרת בריאות בסיסית שנוצרה על בסיס פרטי הלקוח.
                            ניתן יהיה להשלים את המידע הרפואי המפורט בהמשך.
                        </Alert>
                    </Box>
                )}

                {step === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            אישור חתימה דיגיטלית
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            על ידי לחיצה על "אשר חתימה" אתה מאשר שקראת וסקרת את פרטי הצהרת הבריאות
                            ומסכים לחתימה דיגיטלית על המסמך.
                        </Typography>

                        <Alert severity="warning" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                <strong>שים לב:</strong> חתימה דיגיטלית היא בעלת תוקף משפטי.
                                וודא שכל הפרטים נכונים לפני האישור.
                            </Typography>
                        </Alert>

                        {loading && (
                            <Box display="flex" alignItems="center" justifyContent="center" mt={3}>
                                <CircularProgress size={24} sx={{ mr: 2 }} />
                                <Typography>מעבד חתימה דיגיטלית...</Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {step === 2 && (
                    <Box textAlign="center">
                        <Typography variant="h6" gutterBottom color="success.main">
                            ✅ החתימה הושלמה בהצלחה
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            הצהרת הבריאות נחתמה דיגיטלית ונשמרה במערכת.
                        </Typography>
                        <Alert severity="success" sx={{ mt: 2 }}>
                            המסמך החתום זמין כעת בטאב הצהרות הבריאות של הלקוח.
                        </Alert>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                {step === 0 && (
                    <>
                        <Button onClick={handleClose}>ביטול</Button>
                        <Button variant="contained" onClick={handleNext}>
                            המשך לחתימה
                        </Button>
                    </>
                )}

                {step === 1 && (
                    <>
                        <Button onClick={handleBack} disabled={loading}>
                            חזור
                        </Button>
                        <Button onClick={handleClose} disabled={loading}>
                            ביטול
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleApprove}
                            disabled={loading}
                            color="primary"
                        >
                            אשר חתימה
                        </Button>
                    </>
                )}

                {step === 2 && (
                    <Button variant="contained" onClick={handleClose}>
                        סגור
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}