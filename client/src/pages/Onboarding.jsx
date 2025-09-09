import React, { useState } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Paper, Typography } from '@mui/material';
import Logo from '../components/common/Logo';

const steps = ['ברוכים הבאים', 'פרטים בסיסיים', 'השלמת פרופיל', 'סיום'];

const Onboarding = () => {
    const [activeStep, setActiveStep] = useState(0);

    const handleNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
    const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

    const renderStep = () => {
        switch (activeStep) {
            case 0:
                return <Typography>ברוכים הבאים לפלטפורמה! נלווה אותך בכמה צעדים פשוטים.</Typography>;
            case 1:
                return <Typography>מלאי פרטים בסיסיים כדי שנתאים עבורך את החוויה.</Typography>;
            case 2:
                return <Typography>השלימי פרופיל: תמונה, תיאור קצר, שעות פעילות.</Typography>;
            case 3:
                return <Typography>סיימנו! אפשר להתחיל להשתמש במערכת.</Typography>;
            default:
                return null;
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f5f5f5">
            <Paper elevation={3} sx={{ p: 4, maxWidth: 800, width: '100%' }}>
                <Box display="flex" justifyContent="center" mb={3}>
                    <Logo variant="default" />
                </Box>
                <Typography variant="h5" mb={2}>תהליך התחלה</Typography>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                <Box minHeight={150} mb={2}>
                    {renderStep()}
                </Box>
                <Box display="flex" justifyContent="space-between">
                    <Button onClick={handleBack} disabled={activeStep === 0}>הקודם</Button>
                    <Button variant="contained" onClick={handleNext}>
                        {activeStep === steps.length - 1 ? 'סיום' : 'הבא'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default Onboarding;


