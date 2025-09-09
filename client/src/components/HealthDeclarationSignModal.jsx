import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Stepper,
    Step,
    StepLabel,
    Alert,
    CircularProgress,
    Paper,
    Divider,
    Chip,
    LinearProgress,
    IconButton
} from '@mui/material';
import {
    Security as SecurityIcon,
    Sms as SmsIcon,
    Email as EmailIcon,
    Verified as VerifiedIcon,
    Download as DownloadIcon,
    Close as CloseIcon,
    Lock as LockIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
// Remove AuthContext import - we'll get user data from props instead
import api from '../services/api';

const steps = ['סקירת התוכן', 'אימות זהות', 'חתימה הושלמה'];

export default function HealthDeclarationSignModal({ open, onClose, declarationPayload, onSuccess, currentUser }) {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // OTP State
    const [otpSentTo, setOtpSentTo] = useState('');
    const [otpChannel, setOtpChannel] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpError, setOtpError] = useState('');

    // Result State
    const [signResult, setSignResult] = useState(null);

    const payloadString = JSON.stringify(declarationPayload);

    // Reset state when modal opens/closes
    React.useEffect(() => {
        if (open) {
            setActiveStep(0);
            setError('');
            setOtpSentTo('');
            setOtpChannel('');
            setOtpCode('');
            setOtpError('');
            setSignResult(null);
            setLoading(false);
        }
    }, [open]);

    const handleStartOtp = async () => {
        try {
            setLoading(true);
            setError('');

            const preferredChannel = currentUser?.phone ? 'sms' : 'email';

            const response = await api.post('/esign/otp/start', {
                payload: payloadString,
                channel: preferredChannel
            });

            setOtpSentTo(response.data.sentTo);
            setOtpChannel(response.data.channel);
            setActiveStep(1);

        } catch (err) {
            console.error('OTP start error:', err);
            setError(err?.response?.data?.message || 'שגיאה בשליחת קוד אימות');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        try {
            setLoading(true);
            setOtpError('');

            const response = await api.post('/esign/otp/verify', {
                payload: payloadString,
                code: otpCode
            });

            setSignResult(response.data);
            setActiveStep(2);

            // Call success callback if provided
            if (onSuccess) {
                onSuccess(response.data);
            }

        } catch (err) {
            console.error('OTP verify error:', err);
            setOtpError(err?.response?.data?.message || 'קוד שגוי או שפג תוקפו');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (signResult?.downloadUrl) {
            window.open(signResult.downloadUrl, '_blank');
        }
    };

    const handleClose = () => {
        setActiveStep(0);
        setError('');
        setOtpSentTo('');
        setOtpChannel('');
        setOtpCode('');
        setOtpError('');
        setSignResult(null);
        setLoading(false);
        onClose();
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0: // Review Content
                return (
                    <Box>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                אנא עבור על פרטי הצהרת הבריאות ולאחר מכן המשך לתהליך החתימה הדיגיטלית המאובטחת.
                            </Typography>
                        </Alert>

                        <Paper elevation={1} sx={{ p: 2, mb: 3, maxHeight: 300, overflow: 'auto' }}>
                            <Typography variant="h6" gutterBottom>
                                תוכן ההצהרה:
                            </Typography>
                            <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(declarationPayload, null, 2)}
                            </Box>
                        </Paper>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <SecurityIcon color="primary" />
                            <Typography variant="body2">
                                החתימה הדיגיטלית תתבצע באמצעות אימות דו-שלבי מאובטח
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                                icon={currentUser?.phone ? <SmsIcon /> : <EmailIcon />}
                                label={currentUser?.phone ? `SMS ל-${currentUser.phone}` : `אימייל ל-${currentUser.email}`}
                                color="primary"
                                variant="outlined"
                            />
                        </Box>
                    </Box>
                );

            case 1: // OTP Verification
                return (
                    <Box>
                        <Alert severity="success" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                שלחנו קוד אימות ל-{otpChannel === 'sms' ? 'SMS' : 'אימייל'}: <strong>{otpSentTo}</strong>
                            </Typography>
                        </Alert>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            <LockIcon color="primary" />
                            <Typography variant="h6">
                                הזן את קוד האימות
                            </Typography>
                        </Box>

                        <TextField
                            fullWidth
                            label="קוד אימות"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="123456"
                            inputProps={{
                                maxLength: 6,
                                style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
                            }}
                            error={!!otpError}
                            helperText={otpError || 'הזן את הקוד בן 6 הספרות שקיבלת'}
                            disabled={loading}
                            sx={{ mb: 2 }}
                        />

                        <Alert severity="warning" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                • הקוד תקף למשך 10 דקות בלבד<br />
                                • אל תשתף את הקוד עם אחרים<br />
                                • המסמך יחתם דיגיטלית לאחר אימות הקוד
                            </Typography>
                        </Alert>
                    </Box>
                );

            case 2: // Success
                return (
                    <Box sx={{ textAlign: 'center' }}>
                        <CheckCircleIcon
                            sx={{ fontSize: 80, color: 'success.main', mb: 2 }}
                        />

                        <Typography variant="h5" gutterBottom color="success.main">
                            החתימה הושלמה בהצלחה! ✔️
                        </Typography>

                        <Alert severity="success" sx={{ mb: 3, textAlign: 'right' }}>
                            <Typography variant="body1">
                                הצהרת הבריאות נחתמה דיגיטלית ומוכנה להורדה
                            </Typography>
                        </Alert>

                        {signResult && (
                            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    פרטי המסמך החתום:
                                </Typography>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2">
                                        <strong>מזהה מסמך:</strong> {signResult.signedDocumentId}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>תאריך חתימה:</strong> {new Date(signResult.signedAt).toLocaleString('he-IL')}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>גודל קובץ:</strong> {(signResult.fileSize / 1024).toFixed(1)} KB
                                    </Typography>
                                </Box>
                            </Paper>
                        )}

                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownload}
                            size="large"
                            sx={{ mb: 2 }}
                        >
                            הורד את הצהרת הבריאות החתומה
                        </Button>

                        <Typography variant="body2" color="text.secondary">
                            המסמך מוגן באמצעות חתימה דיגיטלית מתקדמת וניתן לאמת את שלמותו בכל עת
                        </Typography>
                    </Box>
                );

            default:
                return null;
        }
    };

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '500px' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedIcon color="primary" />
                    <Typography variant="h6">
                        חתימה דיגיטלית מאובטחת
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                {/* Progress Stepper */}
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label, index) => (
                        <Step key={label} completed={index < activeStep}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* Loading Indicator */}
                {loading && (
                    <LinearProgress sx={{ mb: 2 }} />
                )}

                {/* Error Display */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Step Content */}
                {renderStepContent()}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2 }}>
                {activeStep === 0 && (
                    <>
                        <Button onClick={handleClose} disabled={loading}>
                            ביטול
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleStartOtp}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
                        >
                            {loading ? 'שולח קוד...' : 'המשך לאימות זהות'}
                        </Button>
                    </>
                )}

                {activeStep === 1 && (
                    <>
                        <Button onClick={() => setActiveStep(0)} disabled={loading}>
                            חזרה
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleVerifyOtp}
                            disabled={loading || otpCode.length < 6}
                            startIcon={loading ? <CircularProgress size={20} /> : <VerifiedIcon />}
                        >
                            {loading ? 'מאמת...' : 'חתום על המסמך'}
                        </Button>
                    </>
                )}

                {activeStep === 2 && (
                    <Button
                        variant="contained"
                        onClick={handleClose}
                        color="success"
                    >
                        סיום
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
