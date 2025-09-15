import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Alert,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    CircularProgress
} from '@mui/material';
import { Email, PersonAdd } from '@mui/icons-material';
import { professionalTokens } from '../../theme/professionalTokens';
import apiClient from '../../config/api.js';

const SendInvitationDialog = ({ open, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        message: '',
        specializations: [],
        expectedTherapistType: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const specializations = [
        'פסיכולוג קליני',
        'עובד סוציאל',
        'יועץ חינוכי',
        'מטפל זוגי ומשפחתי',
        'מטפל בדרמה',
        'מטפל באמנות',
        'מטפל במוזיקה',
        'פיזיותרפיסט',
        'ריפוי בעיסוק',
        'קלינאי תקשורת'
    ];

    const handleChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
        setError('');
    };

    const handleSpecializationsChange = (event) => {
        const value = event.target.value;
        setFormData(prev => ({
            ...prev,
            specializations: typeof value === 'string' ? value.split(',') : value
        }));
    };

    const validateForm = () => {
        if (!formData.email.trim()) {
            setError('כתובת מייל נדרשת');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('כתובת מייל לא תקינה');
            return false;
        }

        if (!formData.firstName.trim()) {
            setError('שם פרטי נדרש');
            return false;
        }

        if (!formData.lastName.trim()) {
            setError('שם משפחה נדרש');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            const data = await apiClient.post('/api/admin/therapists/invite', formData);

            if (data.success) {
                onSuccess();
                handleReset();
                alert('ההזמנה נשלחה בהצלחה!');
            } else {
                setError(data.error || 'שגיאה בשליחת ההזמנה');
            }
        } catch (error) {
            console.error('Error sending invitation:', error);
            setError('שגיאה בשליחת ההזמנה');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            email: '',
            firstName: '',
            lastName: '',
            message: '',
            specializations: [],
            expectedTherapistType: ''
        });
        setError('');
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const defaultMessage = `שלום ${formData.firstName},

מוזמנת להצטרף לפלטפורמת LUMA כמטפלת מקצועית.

הפלטפורמה שלנו מספקת כלים מתקדמים לניהול לקוחות, תיאום פגישות ומעקב אחר התקדמות הטיפול.

לחצי על הקישור המצורף כדי להתחיל את תהליך ההרשמה:
[קישור ההרשמה יתווסף אוטומטית]

נשמח לראותך חלק מהקהילה המקצועית שלנו!

בברכה,
צוות LUMA`;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonAdd color="primary" />
                הזמן מטפלת חדשה
            </DialogTitle>

            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        המטפלת תקבל מייל עם קישור ייחודי להרשמה. הקישור יהיה תקף למשך 7 ימים.
                    </Alert>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="שם פרטי *"
                                value={formData.firstName}
                                onChange={handleChange('firstName')}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="שם משפחה *"
                                value={formData.lastName}
                                onChange={handleChange('lastName')}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="כתובת מייל *"
                                type="email"
                                value={formData.email}
                                onChange={handleChange('email')}
                                variant="outlined"
                                placeholder="example@email.com"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>סוג מטפל מצופה</InputLabel>
                                <Select
                                    value={formData.expectedTherapistType}
                                    onChange={handleChange('expectedTherapistType')}
                                    label="סוג מטפל מצופה"
                                >
                                    {specializations.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>התמחויות מועדפות</InputLabel>
                                <Select
                                    multiple
                                    value={formData.specializations}
                                    onChange={handleSpecializationsChange}
                                    label="התמחויות מועדפות"
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => (
                                                <Chip key={value} label={value} size="small" />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {specializations.map((spec) => (
                                        <MenuItem key={spec} value={spec}>
                                            {spec}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="הודעה אישית (אופציונלי)"
                                multiline
                                rows={8}
                                value={formData.message || defaultMessage}
                                onChange={handleChange('message')}
                                variant="outlined"
                                placeholder="הודעה אישית למטפלת..."
                                helperText="ההודעה תישלח במייל ההזמנה"
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 2 }}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                >
                    ביטול
                </Button>

                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <Email />}
                    sx={{
                        background: `linear-gradient(135deg, ${professionalTokens.colors.primary}, ${professionalTokens.colors.primaryLight})`,
                        minWidth: 140
                    }}
                >
                    {loading ? 'שולח...' : 'שלח הזמנה'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SendInvitationDialog;
