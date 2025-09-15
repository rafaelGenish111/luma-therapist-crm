import React, { useState } from 'react';
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    Paper,
    Container,
    LinearProgress
} from '@mui/material';
import PersonalDetailsStep from './steps/PersonalDetailsStep';
import PasswordStep from './steps/PasswordStep';
import ProfessionalDetailsStep from './steps/ProfessionalDetailsStep';
import PaymentDetailsStep from './steps/PaymentDetailsStep';
import { professionalTokens } from '../../theme/professionalTokens';

const steps = [
    'פרטים אישיים',
    'הגדרת סיסמה',
    'פרטים מקצועיים',
    'פרטי תשלום'
];

const TherapistRegistrationWizard = ({ invitationToken }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        // Personal Details
        firstName: '',
        lastName: '',
        idNumber: '',
        gender: '',
        phone: '',
        email: '',
        address: {
            street: '',
            city: '',
            zipCode: ''
        },
        dateOfBirth: '',

        // Password
        password: '',
        confirmPassword: '',

        // Professional Details
        therapistType: '',
        specializations: [],
        services: [],
        experience: '',
        education: [],
        certifications: [],
        languages: [],
        aboutMe: '',

        // Payment Details (Demo)
        paymentMethod: '',
        bankDetails: {
            bankName: '',
            accountNumber: '',
            routingNumber: '',
            accountHolderName: ''
        },
        billingAddress: {
            street: '',
            city: '',
            zipCode: ''
        }
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
        setFormData({});
        setErrors({});
    };

    const validateStep = (stepIndex) => {
        const stepErrors = {};

        switch (stepIndex) {
            case 0: // Personal Details
                if (!formData.firstName?.trim()) stepErrors.firstName = 'שם פרטי נדרש';
                if (!formData.lastName?.trim()) stepErrors.lastName = 'שם משפחה נדרש';
                if (!formData.idNumber?.trim()) stepErrors.idNumber = 'תעודת זהות נדרשת';
                if (!formData.email?.trim()) stepErrors.email = 'כתובת מייל נדרשת';
                if (!formData.phone?.trim()) stepErrors.phone = 'מספר טלפון נדרש';
                break;

            case 1: // Password
                if (!formData.password) stepErrors.password = 'סיסמה נדרשת';
                if (formData.password !== formData.confirmPassword) {
                    stepErrors.confirmPassword = 'הסיסמאות אינן תואמות';
                }
                if (formData.password && formData.password.length < 8) {
                    stepErrors.password = 'הסיסמה חייבת להכיל לפחות 8 תווים';
                }
                break;

            case 2: // Professional Details
                if (!formData.therapistType) stepErrors.therapistType = 'סוג מטפל נדרש';
                if (!formData.specializations?.length) stepErrors.specializations = 'לפחות התמחות אחת נדרשת';
                break;

            case 3: // Payment Details
                if (!formData.paymentMethod) stepErrors.paymentMethod = 'שיטת תשלום נדרשת';
                break;
        }

        setErrors(stepErrors);
        return Object.keys(stepErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateStep(activeStep)) return;

        setLoading(true);
        try {
            // Here we'll call the API to submit the registration
            const response = await fetch('/api/therapists/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    invitationToken
                })
            });

            const result = await response.json();

            if (result.success) {
                // Show success message and redirect
                alert('ההרשמה נשלחה בהצלחה! יישלח אליך מייל אימות בקרוב.');
                // Redirect to success page
            } else {
                alert('שגיאה בהרשמה: ' + result.error);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('שגיאה בהרשמה');
        } finally {
            setLoading(false);
        }
    };

    const updateFormData = (stepData) => {
        setFormData(prev => ({ ...prev, ...stepData }));
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <PersonalDetailsStep
                        data={formData}
                        onChange={updateFormData}
                        errors={errors}
                    />
                );
            case 1:
                return (
                    <PasswordStep
                        data={formData}
                        onChange={updateFormData}
                        errors={errors}
                    />
                );
            case 2:
                return (
                    <ProfessionalDetailsStep
                        data={formData}
                        onChange={updateFormData}
                        errors={errors}
                    />
                );
            case 3:
                return (
                    <PaymentDetailsStep
                        data={formData}
                        onChange={updateFormData}
                        errors={errors}
                    />
                );
            default:
                return 'Unknown step';
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h4" gutterBottom sx={{ color: professionalTokens.colors.primary, fontWeight: 'bold' }}>
                        הרשמה כמטפלת
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary">
                        בואי נכיר ונגדיר את הפרופיל המקצועי שלך
                    </Typography>
                </Box>

                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label, index) => (
                        <Step key={label}>
                            <StepLabel>
                                <Typography variant="body2" sx={{ fontWeight: activeStep === index ? 'bold' : 'normal' }}>
                                    {label}
                                </Typography>
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {loading && <LinearProgress sx={{ mb: 2 }} />}

                <Box sx={{ minHeight: '400px', mb: 4 }}>
                    {activeStep === steps.length ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h5" gutterBottom color="success.main">
                                ההרשמה הושלמה בהצלחה! 🎉
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                                יישלח אליך מייל אימות בקרוב. לאחר האימות, הפרופיל שלך יועבר לאישור הסופר אדמין.
                            </Typography>
                            <Button onClick={handleReset} variant="outlined">
                                התחלה מחדש
                            </Button>
                        </Box>
                    ) : (
                        getStepContent(activeStep)
                    )}
                </Box>

                {activeStep < steps.length && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                        <Button
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            variant="outlined"
                            sx={{ minWidth: 120 }}
                        >
                            חזרה
                        </Button>

                        <Button
                            variant="contained"
                            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                            disabled={loading}
                            sx={{
                                minWidth: 120,
                                background: `linear-gradient(135deg, ${professionalTokens.colors.primary}, ${professionalTokens.colors.primaryLight})`
                            }}
                        >
                            {activeStep === steps.length - 1 ? 'שלח הרשמה' : 'המשך'}
                        </Button>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default TherapistRegistrationWizard;
