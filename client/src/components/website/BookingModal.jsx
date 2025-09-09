import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid
} from '@mui/material';
import { Close as CloseIcon, Email as EmailIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';

const BookingModal = ({ open, onClose, therapist, calendlyUrl, selectedTreatmentType }) => {
    const [bookingType, setBookingType] = useState(calendlyUrl ? 'calendly' : 'email');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // טופס מייל
    const [emailForm, setEmailForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        requestedDate: '',
        preferredTime: '',
        notes: ''
    });

    const handleEmailFormChange = (field, value) => {
        setEmailForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // שליחה לשרת
            const response = await fetch('/api/bookings/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    therapistId: therapist._id,
                    treatmentType: selectedTreatmentType ? {
                        name: selectedTreatmentType.type,
                        duration: selectedTreatmentType.duration,
                        price: selectedTreatmentType.price
                    } : null,
                    ...emailForm
                })
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setEmailForm({
                        fullName: '',
                        email: '',
                        phone: '',
                        requestedDate: '',
                        preferredTime: '',
                        notes: ''
                    });
                }, 3000);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'שגיאה בשליחת הבקשה');
            }
        } catch (err) {
            setError('שגיאה בשליחת הבקשה');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
            setSuccess(false);
            setError('');
            setEmailForm({
                fullName: '',
                email: '',
                phone: '',
                requestedDate: '',
                preferredTime: '',
                notes: ''
            });
        }
    };

    // זמנים מועדפים
    const timeSlots = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
    ];

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    minHeight: calendlyUrl ? '80vh' : 'auto'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 1
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    {calendlyUrl ? (
                        <>
                            <CalendarIcon color="primary" />
                            <Typography variant="h6">קביעת תור אונליין</Typography>
                        </>
                    ) : (
                        <>
                            <EmailIcon color="primary" />
                            <Typography variant="h6">קביעת תור במייל ✉️</Typography>
                        </>
                    )}
                </Box>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    sx={{ minWidth: 'auto', p: 1 }}
                >
                    <CloseIcon />
                </Button>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                {success ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        בקשה נשלחה בהצלחה! המטפל יחזור אליך בהקדם.
                    </Alert>
                ) : (
                    <>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {/* הצגת סוג טיפול נבחר */}
                        {selectedTreatmentType && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    <strong>סוג טיפול נבחר:</strong> {selectedTreatmentType.type} - {selectedTreatmentType.duration} - {selectedTreatmentType.price}
                                </Typography>
                            </Alert>
                        )}

                        {/* בחירת סוג קביעת תור (רק אם יש Calendly) */}
                        {calendlyUrl && (
                            <Box mb={3}>
                                <Typography variant="subtitle1" gutterBottom>
                                    בחר/י איך לקבוע תור:
                                </Typography>
                                <Box display="flex" gap={2}>
                                    <Button
                                        variant={bookingType === 'calendly' ? 'contained' : 'outlined'}
                                        onClick={() => setBookingType('calendly')}
                                        startIcon={<CalendarIcon />}
                                    >
                                        קביעת תור אונליין
                                    </Button>
                                    <Button
                                        variant={bookingType === 'email' ? 'contained' : 'outlined'}
                                        onClick={() => setBookingType('email')}
                                        startIcon={<EmailIcon />}
                                    >
                                        קביעת תור במייל
                                    </Button>
                                </Box>
                            </Box>
                        )}

                        {/* Calendly Embed */}
                        {bookingType === 'calendly' && calendlyUrl && (
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
                        )}

                        {/* טופס מייל */}
                        {bookingType === 'email' && (
                            <Box component="form" onSubmit={handleEmailSubmit}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="שם מלא"
                                            value={emailForm.fullName}
                                            onChange={(e) => handleEmailFormChange('fullName', e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="אימייל"
                                            type="email"
                                            value={emailForm.email}
                                            onChange={(e) => handleEmailFormChange('email', e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="טלפון"
                                            type="tel"
                                            value={emailForm.phone}
                                            onChange={(e) => handleEmailFormChange('phone', e.target.value)}
                                            disabled={loading}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="תאריך מבוקש"
                                            type="date"
                                            value={emailForm.requestedDate}
                                            onChange={(e) => handleEmailFormChange('requestedDate', e.target.value)}
                                            required
                                            disabled={loading}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>שעה מועדפת</InputLabel>
                                            <Select
                                                value={emailForm.preferredTime}
                                                onChange={(e) => handleEmailFormChange('preferredTime', e.target.value)}
                                                required
                                                disabled={loading}
                                                label="שעה מועדפת"
                                            >
                                                {timeSlots.map(time => (
                                                    <MenuItem key={time} value={time}>
                                                        {time}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="הערות נוספות"
                                            multiline
                                            rows={3}
                                            value={emailForm.notes}
                                            onChange={(e) => handleEmailFormChange('notes', e.target.value)}
                                            disabled={loading}
                                            placeholder="תיאור קצר של הסיבה לביקור, העדפות מיוחדות וכו'"
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>

            {/* כפתורים - רק לטופס מייל */}
            {bookingType === 'email' && !success && (
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button
                        onClick={handleClose}
                        disabled={loading}
                        variant="outlined"
                    >
                        ביטול
                    </Button>
                    <Button
                        onClick={handleEmailSubmit}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <EmailIcon />}
                    >
                        {loading ? 'שולח...' : 'שלח בקשה'}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default BookingModal;
