import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Box,
    Typography,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Divider,
    IconButton,
    InputAdornment,
    FormControlLabel,
    Switch
} from '@mui/material';
import {
    Close as CloseIcon,
    CreditCard as CreditCardIcon,
    AttachMoney as CashIcon,
    AccountBalance as BankIcon,
    Science as ScienceIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import api from '../../../../../services/api';

const PaymentModal = ({ open, onClose, client, chargeIds = [], appointmentId = null, onPaymentSuccess, defaultAmount = 0 }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [formData, setFormData] = useState({
        amount: '',
        currency: 'ILS',
        method: 'simulation',
        description: 'תשלום עבור טיפול',
        cardData: {
            cardNumber: '',
            expiryMonth: '',
            expiryYear: '',
            cvv: '',
            holderName: ''
        }
    });
    const [showCardData, setShowCardData] = useState(false);
    const [showCvv, setShowCvv] = useState(false);

    useEffect(() => {
        if (open) {
            loadPaymentMethods();
            resetForm();
        }
    }, [open]);

    const loadPaymentMethods = async () => {
        try {
            const response = await api.get('/payments/methods');
            setPaymentMethods(response.methods || []);
        } catch (err) {
            console.error('Error loading payment methods:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            amount: defaultAmount > 0 ? defaultAmount.toString() : '',
            currency: 'ILS',
            method: 'simulation',
            description: 'תשלום עבור טיפול',
            cardData: {
                cardNumber: '',
                expiryMonth: '',
                expiryYear: '',
                cvv: '',
                holderName: ''
            }
        });
        setError('');
        setSuccess('');
    };

    const handleInputChange = (field, value) => {
        if (field.startsWith('cardData.')) {
            const cardField = field.split('.')[1];
            setFormData(prev => ({
                ...prev,
                cardData: {
                    ...prev.cardData,
                    [cardField]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const paymentData = {
                clientId: client._id,
                amount: parseFloat(formData.amount),
                currency: formData.currency,
                method: formData.method,
                description: formData.description,
                chargeIds: chargeIds,
                appointmentId: appointmentId,
                cardData: formData.method === 'credit_card' ? formData.cardData : undefined
            };

            const response = await api.post('/payments/process', paymentData);

            if (response.success) {
                setSuccess('התשלום בוצע בהצלחה!');
                setTimeout(() => {
                    onPaymentSuccess && onPaymentSuccess(response.payment);
                    onClose();
                }, 2000);
            } else {
                setError(response.error || 'שגיאה בעיבוד התשלום');
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError('שגיאה בעיבוד התשלום');
        } finally {
            setLoading(false);
        }
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return v;
        }
    };

    const getMethodIcon = (method) => {
        switch (method) {
            case 'simulation': return <ScienceIcon />;
            case 'credit_card': return <CreditCardIcon />;
            case 'cash': return <CashIcon />;
            case 'bank_transfer': return <BankIcon />;
            default: return <CreditCardIcon />;
        }
    };

    const getMethodDescription = (method) => {
        switch (method) {
            case 'simulation': return 'תשלום סימולציה לבדיקות';
            case 'credit_card': return 'תשלום בכרטיס אשראי';
            case 'cash': return 'תשלום במזומן';
            case 'bank_transfer': return 'העברה בנקאית';
            default: return '';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">תשלום חדש</Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
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

                    <Grid container spacing={3}>
                        {/* Client Info */}
                        <Grid item xs={12}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        פרטי לקוח
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {client.firstName} {client.lastName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {client.email}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {client.phone}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Payment Amount */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="סכום התשלום"
                                type="number"
                                value={formData.amount}
                                onChange={(e) => handleInputChange('amount', e.target.value)}
                                required
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₪</InputAdornment>
                                }}
                            />
                        </Grid>

                        {/* Currency */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>מטבע</InputLabel>
                                <Select
                                    value={formData.currency}
                                    onChange={(e) => handleInputChange('currency', e.target.value)}
                                    label="מטבע"
                                >
                                    <MenuItem value="ILS">שקל ישראלי (₪)</MenuItem>
                                    <MenuItem value="USD">דולר אמריקאי ($)</MenuItem>
                                    <MenuItem value="EUR">יורו (€)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Payment Method */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>שיטת תשלום</InputLabel>
                                <Select
                                    value={formData.method}
                                    onChange={(e) => handleInputChange('method', e.target.value)}
                                    label="שיטת תשלום"
                                >
                                    {paymentMethods
                                        .filter(method => method.enabled)
                                        .map(method => (
                                            <MenuItem key={method.id} value={method.id}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    {getMethodIcon(method.id)}
                                                    <Box>
                                                        <Typography variant="body1">{method.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {method.description}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Description */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="תיאור התשלום"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                multiline
                                rows={2}
                            />
                        </Grid>

                        {/* Credit Card Data */}
                        {formData.method === 'credit_card' && (
                            <>
                                <Grid item xs={12}>
                                    <Divider>
                                        <Typography variant="h6">פרטי כרטיס אשראי</Typography>
                                    </Divider>
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={showCardData}
                                                onChange={(e) => setShowCardData(e.target.checked)}
                                            />
                                        }
                                        label="הצג פרטי כרטיס"
                                    />
                                </Grid>

                                {showCardData && (
                                    <>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="מספר כרטיס"
                                                value={formData.cardData.cardNumber}
                                                onChange={(e) => handleInputChange('cardData.cardNumber', formatCardNumber(e.target.value))}
                                                placeholder="1234 5678 9012 3456"
                                                inputProps={{ maxLength: 19 }}
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={3}>
                                            <FormControl fullWidth>
                                                <InputLabel>חודש</InputLabel>
                                                <Select
                                                    value={formData.cardData.expiryMonth}
                                                    onChange={(e) => handleInputChange('cardData.expiryMonth', e.target.value)}
                                                    label="חודש"
                                                >
                                                    {Array.from({ length: 12 }, (_, i) => (
                                                        <MenuItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                                            {String(i + 1).padStart(2, '0')}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        <Grid item xs={12} md={3}>
                                            <FormControl fullWidth>
                                                <InputLabel>שנה</InputLabel>
                                                <Select
                                                    value={formData.cardData.expiryYear}
                                                    onChange={(e) => handleInputChange('cardData.expiryYear', e.target.value)}
                                                    label="שנה"
                                                >
                                                    {Array.from({ length: 10 }, (_, i) => {
                                                        const year = new Date().getFullYear() + i;
                                                        return (
                                                            <MenuItem key={year} value={String(year)}>
                                                                {year}
                                                            </MenuItem>
                                                        );
                                                    })}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="CVV"
                                                type={showCvv ? 'text' : 'password'}
                                                value={formData.cardData.cvv}
                                                onChange={(e) => handleInputChange('cardData.cvv', e.target.value)}
                                                placeholder="123"
                                                inputProps={{ maxLength: 4 }}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                onClick={() => setShowCvv(!showCvv)}
                                                                edge="end"
                                                            >
                                                                {showCvv ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="שם בעל הכרטיס"
                                                value={formData.cardData.holderName}
                                                onChange={(e) => handleInputChange('cardData.holderName', e.target.value)}
                                                placeholder="שם מלא כפי שמופיע על הכרטיס"
                                            />
                                        </Grid>
                                    </>
                                )}
                            </>
                        )}

                        {/* Bank Transfer Info */}
                        {formData.method === 'bank_transfer' && (
                            <Grid item xs={12}>
                                <Alert severity="info">
                                    <Typography variant="h6" gutterBottom>
                                        פרטי העברה בנקאית
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>בנק:</strong> בנק לאומי<br />
                                        <strong>מספר סניף:</strong> 123<br />
                                        <strong>מספר חשבון:</strong> 456789<br />
                                        <strong>שם החשבון:</strong> מרכז הטיפול שלך
                                    </Typography>
                                </Alert>
                            </Grid>
                        )}

                        {/* Cash Payment Info */}
                        {formData.method === 'cash' && (
                            <Grid item xs={12}>
                                <Alert severity="success">
                                    <Typography variant="h6" gutterBottom>
                                        תשלום במזומן
                                    </Typography>
                                    <Typography variant="body2">
                                        התשלום יירשם במערכת ויועבר לסטטוס "שולם" מיד.
                                    </Typography>
                                </Alert>
                            </Grid>
                        )}

                        {/* Simulation Payment Info */}
                        {formData.method === 'simulation' && (
                            <Grid item xs={12}>
                                <Alert severity="warning">
                                    <Typography variant="h6" gutterBottom>
                                        תשלום סימולציה
                                    </Typography>
                                    <Typography variant="body2">
                                        זהו תשלום סימולציה לבדיקות. לא יתבצע חיוב אמיתי.
                                    </Typography>
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose} disabled={loading}>
                        ביטול
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !formData.amount}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'מעבד תשלום...' : 'עבד תשלום'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default PaymentModal;
