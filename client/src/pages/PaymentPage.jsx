import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    Container,
    Paper,
    Stack
} from '@mui/material';
import {
    Payment as PaymentIcon,
    Security as SecurityIcon,
    AccessTime as TimeIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import PaymentMethods from '../components/PaymentMethods';

const PaymentPage = () => {
    const { paymentLinkId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const [paymentData, setPaymentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

    useEffect(() => {
        fetchPaymentDetails();
    }, [paymentLinkId]);

    const fetchPaymentDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/payment-links/${paymentLinkId}`);
            setPaymentData(response.data);
        } catch (err) {
            console.error('Error fetching payment details:', err);
            if (err.response?.status === 404) {
                setError('לינק התשלום לא נמצא');
            } else if (err.response?.status === 410) {
                setError('לינק התשלום פג תוקף');
            } else if (err.response?.status === 400) {
                setError('התשלום כבר הושלם או נכשל');
            } else {
                setError('שגיאה בטעינת פרטי התשלום');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (paymentMethod = 'all') => {
        try {
            setProcessing(true);

            // יצירת checkout session עם אמצעי התשלום שנבחר
            const response = await axios.post('/api/payment-links/start', {
                paymentLinkId,
                paymentMethod
            });

            // הפניה לעמוד התשלום המאובטח
            window.location.href = response.data.checkoutUrl;
        } catch (err) {
            console.error('Error starting payment:', err);
            setError('שגיאה בהתחלת התשלום');
            setProcessing(false);
        }
    };

    const handlePaymentMethodSelect = (methodId) => {
        setSelectedPaymentMethod(methodId);
        handlePayment(methodId);
    };

    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                        <Typography variant="h6" gutterBottom>
                            לא ניתן להמשיך עם התשלום
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            אנא פנה למטפל שלך לקבלת לינק תשלום חדש
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/')}
                            sx={{ mr: 2 }}
                        >
                            חזרה לעמוד הבית
                        </Button>
                        <Button
                            variant="outlined"
                            href={`mailto:${paymentData?.therapistEmail || 'support@luma-crm.com'}?subject=בעיה עם לינק התשלום`}
                        >
                            צור קשר
                        </Button>
                    </CardContent>
                </Card>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {/* Header */}
                <Box
                    sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        color: 'white',
                        p: 3,
                        textAlign: 'center'
                    }}
                >
                    <PaymentIcon sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h4" component="h1" gutterBottom>
                        תשלום מאובטח
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        {paymentData.therapistName}
                    </Typography>
                </Box>

                <CardContent sx={{ p: 3 }}>
                    {/* Payment Details */}
                    <Stack spacing={3}>
                        {/* Amount */}
                        <Box textAlign="center">
                            <Typography variant="h3" color="primary" fontWeight="bold">
                                {formatCurrency(paymentData.amount, paymentData.currency)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {paymentData.description}
                            </Typography>
                        </Box>

                        <Divider />

                        {/* Session Info */}
                        {paymentData.sessionInfo && (
                            <Box>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CalendarIcon sx={{ mr: 1 }} />
                                    פרטי הפגישה
                                </Typography>
                                <Box sx={{ pl: 4 }}>
                                    <Typography variant="body1">
                                        <strong>תאריך:</strong> {formatDate(paymentData.sessionInfo.date)}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>שעה:</strong> {formatTime(paymentData.sessionInfo.time)}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>סוג טיפול:</strong> {paymentData.sessionInfo.treatmentType}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Client Info */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ mr: 1 }} />
                                פרטי הלקוח
                            </Typography>
                            <Box sx={{ pl: 4 }}>
                                <Typography variant="body1">
                                    <strong>שם:</strong> {paymentData.clientName}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Expiration Warning */}
                        {!paymentData.isExpired && (
                            <Alert severity="warning" icon={<TimeIcon />}>
                                <Typography variant="body2">
                                    לינק התשלום יפוג ב-{formatDate(paymentData.expiresAt)}
                                </Typography>
                            </Alert>
                        )}

                        {/* Security Notice */}
                        <Alert severity="info" icon={<SecurityIcon />}>
                            <Typography variant="body2">
                                🔒 התשלום מאובטח באמצעות ספק סליקה מוכר ומאושר
                            </Typography>
                        </Alert>

                        {/* Payment Methods */}
                        <PaymentMethods
                            onPaymentMethodSelect={handlePaymentMethodSelect}
                            disabled={processing || paymentData.isExpired}
                        />

                        {/* Status Chip */}
                        <Box textAlign="center">
                            <Chip
                                label="ממתין לתשלום"
                                color="warning"
                                variant="outlined"
                                icon={<TimeIcon />}
                            />
                        </Box>
                    </Stack>
                </CardContent>
            </Paper>

            {/* Footer */}
            <Box textAlign="center" sx={{ mt: 4 }}>
                <Typography variant="body2" color="text.secondary">
                    בעיות טכניות? פנה לתמיכה
                </Typography>
                <Button
                    variant="text"
                    size="small"
                    href={`mailto:support@luma-crm.com?subject=בעיה טכנית - תשלום ${paymentLinkId}`}
                    sx={{ mt: 1 }}
                >
                    צור קשר עם התמיכה
                </Button>
            </Box>
        </Container>
    );
};

export default PaymentPage;
