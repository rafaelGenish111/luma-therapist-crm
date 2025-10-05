import React, { useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
    CircularProgress,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    Stack
} from '@mui/material';
import {
    Send as SendIcon,
    ContentCopy as CopyIcon,
    WhatsApp as WhatsAppIcon,
    Email as EmailIcon,
    Link as LinkIcon
} from '@mui/icons-material';

import paymentLinksService from '../services/paymentLinksService';
import appointmentService from '../services/appointmentService';

const SendPaymentLinkModal = ({ client, open, onClose, initialAmount = '' }) => {
    const [form, setForm] = useState({
        amount: initialAmount || '',
        description: '',
        sessionId: ''
    });
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [paymentLink, setPaymentLink] = useState('');
    const [paymentLinkId, setPaymentLinkId] = useState('');

    // עדכון הסכום כשמשנים את initialAmount
    React.useEffect(() => {
        if (initialAmount) {
            setForm(prev => ({ ...prev, amount: initialAmount }));
        }
    }, [initialAmount]);

    React.useEffect(() => {
        if (open) {
            loadUpcomingAppointments();
        }
    }, [open, client._id]);

    const loadUpcomingAppointments = async () => {
        try {
            const response = await appointmentService.getByClient(client._id);
            const appointments = response.appointments || [];

            // פגישות עתידיות או היום
            const upcoming = appointments.filter(apt => {
                const aptDate = new Date(apt.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return aptDate >= today && apt.status !== 'cancelled';
            }).sort((a, b) => new Date(a.date) - new Date(b.date));

            setUpcomingAppointments(upcoming);
        } catch (err) {
            console.error('Error loading appointments:', err);
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const response = await paymentLinksService.createPaymentLink({
                clientId: client._id,
                sessionId: form.sessionId || undefined,
                amount: parseFloat(form.amount),
                description: form.description || 'תשלום עבור טיפול'
            });

            setPaymentLink(response.paymentLink);
            setPaymentLinkId(response.paymentLinkId);
            setSuccess('לינק התשלום נוצר בהצלחה!');
        } catch (err) {
            console.error('Error creating payment link:', err);
            setError('שגיאה ביצירת לינק התשלום');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(paymentLink);
        setSuccess('הלינק הועתק ללוח');
    };

    const handleSendWhatsApp = () => {
        const message = `שלום ${client.firstName || 'לקוח יקר'},

אנא לחץ על הלינק הבא כדי לבצע תשלום מאובטח עבור הטיפול:

${paymentLink}

תודה,
${client.therapistName || 'המטפל'}`;

        const whatsappUrl = `https://wa.me/${client.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleSendEmail = () => {
        const subject = 'לינק לתשלום מאובטח';
        const body = `שלום ${client.firstName || 'לקוח יקר'},

אנא לחץ על הלינק הבא כדי לבצע תשלום מאובטח עבור הטיפול:

${paymentLink}

תודה,
${client.therapistName || 'המטפל'}`;

        const mailtoUrl = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoUrl);
    };

    const handleClose = () => {
        setForm({ amount: initialAmount || '', description: '', sessionId: '' });
        setPaymentLink('');
        setPaymentLinkId('');
        setError('');
        setSuccess('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <SendIcon />
                    <Typography variant="h6">שלח לינק תשלום</Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Stack spacing={3} sx={{ pt: 1 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" onClose={() => setSuccess('')}>
                            {success}
                        </Alert>
                    )}

                    {!paymentLink ? (
                        // טופס יצירת לינק
                        <>
                            <TextField
                                label="סכום (₪)"
                                type="number"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                fullWidth
                                required
                                inputProps={{ min: 0.01, step: 0.01 }}
                            />

                            <TextField
                                label="תיאור"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                fullWidth
                                placeholder="תשלום עבור טיפול"
                            />

                            {upcomingAppointments.length > 0 && (
                                <TextField
                                    select
                                    label="שייך לפגישה (אופציונלי)"
                                    value={form.sessionId}
                                    onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
                                    fullWidth
                                >
                                    <MenuItem value="">
                                        <em>ללא שיוך לפגישה</em>
                                    </MenuItem>
                                    {upcomingAppointments.map((apt) => (
                                        <MenuItem key={apt._id} value={apt._id}>
                                            {new Date(apt.date).toLocaleDateString('he-IL')} - {apt.time} - {apt.type || 'טיפול'}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}

                            <Alert severity="info">
                                <Typography variant="body2">
                                    לינק התשלום יהיה תקף למשך 7 ימים ויפנה את הלקוח לעמוד תשלום מאובטח
                                </Typography>
                            </Alert>
                        </>
                    ) : (
                        // הצגת הלינק שנוצר
                        <>
                            <Alert severity="success">
                                <Typography variant="h6" gutterBottom>
                                    לינק התשלום נוצר בהצלחה!
                                </Typography>
                                <Typography variant="body2">
                                    הלינק תקף למשך 7 ימים
                                </Typography>
                            </Alert>

                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    לינק התשלום:
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <TextField
                                        value={paymentLink}
                                        fullWidth
                                        InputProps={{ readOnly: true }}
                                        size="small"
                                    />
                                    <Tooltip title="העתק ללוח">
                                        <IconButton onClick={handleCopyLink} color="primary">
                                            <CopyIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    שליחה ללקוח:
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Button
                                        variant="contained"
                                        startIcon={<WhatsAppIcon />}
                                        onClick={handleSendWhatsApp}
                                        disabled={!client.phone}
                                        color="success"
                                    >
                                        שלח בווטסאפ
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<EmailIcon />}
                                        onClick={handleSendEmail}
                                        disabled={!client.email}
                                        color="primary"
                                    >
                                        שלח במייל
                                    </Button>
                                </Stack>

                                {(!client.phone || !client.email) && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        <Typography variant="body2">
                                            {!client.phone && 'מספר טלפון לא זמין לווטסאפ. '}
                                            {!client.email && 'כתובת מייל לא זמינה. '}
                                            ניתן להעתיק את הלינק ידנית
                                        </Typography>
                                    </Alert>
                                )}
                            </Box>
                        </>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>
                    {paymentLink ? 'סגור' : 'ביטול'}
                </Button>
                {!paymentLink && (
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading || !form.amount}
                        startIcon={loading ? <CircularProgress size={20} /> : <LinkIcon />}
                    >
                        {loading ? 'יוצר לינק...' : 'צור לינק תשלום'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default SendPaymentLinkModal;
