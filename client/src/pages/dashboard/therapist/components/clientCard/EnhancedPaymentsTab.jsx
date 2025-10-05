import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tabs,
    Tab,
    Badge,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Payment as PaymentIcon,
    Receipt as ReceiptIcon,
    TrendingUp as TrendingUpIcon,
    AccountBalance as AccountBalanceIcon,
    CreditCard as CreditCardIcon,
    AttachMoney as CashIcon,
    Science as ScienceIcon,
    Refresh as RefreshIcon,
    FilterList as FilterIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import PaymentModal from './PaymentModal';
import SendPaymentLinkModal from '../../../../../components/SendPaymentLinkModal';
import api from '../../../../../services/api';

const EnhancedPaymentsTab = ({ client }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [openCharges, setOpenCharges] = useState([]);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [sendLinkModalOpen, setSendLinkModalOpen] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState('');
    const [selectedChargeIds, setSelectedChargeIds] = useState([]);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
    const [defaultPaymentAmount, setDefaultPaymentAmount] = useState(0);
    const [activeTab, setActiveTab] = useState(0);
    const [filters, setFilters] = useState({
        status: '',
        method: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        loadPayments();
        loadSummary();
        loadOpenCharges();
    }, [client._id]);

    const loadPayments = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/payments/clients/${client._id}/history`, {
                params: filters
            });
            setPayments(response.payments || []);
        } catch (err) {
            console.error('Error loading payments:', err);
            setError('שגיאה בטעינת תשלומים');
        } finally {
            setLoading(false);
        }
    };

    const loadSummary = async () => {
        try {
            const response = await api.get(`/payments/clients/${client._id}/summary`);
            setSummary(response.summary);
        } catch (err) {
            console.error('Error loading summary:', err);
        }
    };

    const loadOpenCharges = async () => {
        try {
            const response = await api.get(`/charges/clients/${client._id}`);
            console.log('💰 EnhancedPaymentsTab - Charges response:', response);
            const allCharges = response.data?.charges || response.charges || [];
            console.log('💰 EnhancedPaymentsTab - All charges:', allCharges);
            const openCharges = allCharges.filter(charge => {
                const status = charge.status?.toUpperCase();
                return (
                    ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(status) &&
                    charge.amount > 0
                );
            });
            console.log('💰 EnhancedPaymentsTab - Open charges:', openCharges);
            setOpenCharges(openCharges);
        } catch (err) {
            console.error('Error loading charges:', err);
        }
    };


    const handlePaymentSuccess = (payment) => {
        setSuccess('התשלום בוצע בהצלחה!');
        // Reload all data to reflect changes
        loadPayments();
        loadSummary();
        loadOpenCharges();
        setPaymentModalOpen(false);
        setSelectedChargeIds([]);
        setSelectedAppointmentId(null);
        setDefaultPaymentAmount(0);
    };

    const handleOpenPaymentModal = (chargeIds = [], appointmentId = null) => {
        setSelectedChargeIds(chargeIds);
        setSelectedAppointmentId(appointmentId);
        setPaymentModalOpen(true);
    };

    const handleCollectAllCharges = () => {
        const totalPendingAmount = openCharges.reduce((sum, charge) => sum + (charge.amount - (charge.paidAmount || 0)), 0);
        setSelectedChargeIds(openCharges.map(c => c._id));
        setSelectedAppointmentId(null);
        setPaymentModalOpen(true);
        // Store the default amount for the modal
        setDefaultPaymentAmount(totalPendingAmount);
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const applyFilters = () => {
        loadPayments();
    };

    const clearFilters = () => {
        setFilters({
            status: '',
            method: '',
            startDate: '',
            endDate: ''
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
            case 'paid':
                return 'success';
            case 'pending':
                return 'warning';
            case 'failed':
                return 'error';
            case 'refunded':
                return 'default';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed':
            case 'paid':
                return 'שולם';
            case 'pending':
                return 'ממתין';
            case 'failed':
                return 'נכשל';
            case 'refunded':
                return 'הוחזר';
            default:
                return status;
        }
    };

    const getMethodIcon = (method) => {
        switch (method) {
            case 'simulation': return <ScienceIcon />;
            case 'credit_card': return <CreditCardIcon />;
            case 'cash': return <CashIcon />;
            case 'bank_transfer': return <AccountBalanceIcon />;
            default: return <PaymentIcon />;
        }
    };

    const getMethodLabel = (method) => {
        switch (method) {
            case 'simulation': return 'סימולציה';
            case 'credit_card': return 'כרטיס אשראי';
            case 'cash': return 'מזומן';
            case 'bank_transfer': return 'העברה בנקאית';
            default: return method;
        }
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(amount);
    };

    const getAppointmentStatus = (appointment) => {
        if (!appointment || !appointment.date) return null;

        const now = new Date();
        const appointmentDate = new Date(appointment.date);
        const appointmentEnd = new Date(appointmentDate.getTime() + (appointment.duration || 60) * 60000);

        if (now < appointmentDate) {
            return { status: 'future', label: 'עתידית', color: 'default' };
        } else if (now >= appointmentDate && now <= appointmentEnd) {
            return { status: 'current', label: 'מתקיימת עכשיו', color: 'success' };
        } else {
            return { status: 'past', label: 'הסתיימה', color: 'error' };
        }
    };

    const formatDate = (date) => {
        try {
            if (!date) return 'לא זמין';
            return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: he });
        } catch (error) {
            console.error('Error formatting date:', date, error);
            return 'תאריך לא תקין';
        }
    };

    const renderSummaryCards = () => {
        if (!summary) return null;

        return (
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        ממתין לתשלום
                                    </Typography>
                                    <Typography variant="h4">
                                        {formatAmount(summary.pendingAmount || 0)}
                                    </Typography>
                                </Box>
                                <TrendingUpIcon color="warning" sx={{ fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        שולם
                                    </Typography>
                                    <Typography variant="h4">
                                        {formatAmount(summary.paidAmount || 0)}
                                    </Typography>
                                </Box>
                                <ReceiptIcon color="success" sx={{ fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        סה"כ תשלומים
                                    </Typography>
                                    <Typography variant="h4">
                                        {formatAmount(summary.totalAmount || 0)}
                                    </Typography>
                                </Box>
                                <PaymentIcon color="primary" sx={{ fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        מספר תשלומים
                                    </Typography>
                                    <Typography variant="h4">
                                        {summary.totalPayments || 0}
                                    </Typography>
                                </Box>
                                <Badge badgeContent={summary.totalPayments || 0} color="primary">
                                    <PaymentIcon sx={{ fontSize: 40 }} />
                                </Badge>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    const renderFilters = () => (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    סינון תשלומים
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>סטטוס</InputLabel>
                            <Select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                label="סטטוס"
                            >
                                <MenuItem value="">הכל</MenuItem>
                                <MenuItem value="completed">שולם</MenuItem>
                                <MenuItem value="pending">ממתין</MenuItem>
                                <MenuItem value="failed">נכשל</MenuItem>
                                <MenuItem value="refunded">הוחזר</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>שיטת תשלום</InputLabel>
                            <Select
                                value={filters.method}
                                onChange={(e) => handleFilterChange('method', e.target.value)}
                                label="שיטת תשלום"
                            >
                                <MenuItem value="">הכל</MenuItem>
                                <MenuItem value="simulation">סימולציה</MenuItem>
                                <MenuItem value="credit_card">כרטיס אשראי</MenuItem>
                                <MenuItem value="cash">מזומן</MenuItem>
                                <MenuItem value="bank_transfer">העברה בנקאית</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="מתאריך"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="עד תאריך"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Box display="flex" gap={1}>
                            <Button
                                variant="contained"
                                onClick={applyFilters}
                                startIcon={<FilterIcon />}
                                size="small"
                            >
                                סנן
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={clearFilters}
                                size="small"
                            >
                                נקה
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );

    const renderPaymentHistory = () => (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">היסטוריית תשלומים</Typography>
                    <Box>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={loadPayments}
                            size="small"
                            sx={{ mr: 1 }}
                        >
                            רענן
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            size="small"
                        >
                            ייצא
                        </Button>
                    </Box>
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>תאריך</TableCell>
                                    <TableCell>סכום</TableCell>
                                    <TableCell>שיטה</TableCell>
                                    <TableCell>סטטוס</TableCell>
                                    <TableCell>תיאור</TableCell>
                                    <TableCell>פעולות</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {payments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <Typography color="textSecondary">
                                                אין תשלומים עדיין
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payments.map((payment) => (
                                        <TableRow key={payment._id}>
                                            <TableCell>{formatDate(payment.createdAt)}</TableCell>
                                            <TableCell>{formatAmount(payment.amount)}</TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    {getMethodIcon(payment.method)}
                                                    {getMethodLabel(payment.method)}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getStatusLabel(payment.status)}
                                                    color={getStatusColor(payment.status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{payment.description}</TableCell>
                                            <TableCell>
                                                <Button
                                                    size="small"
                                                    onClick={() => {
                                                        // Handle payment details
                                                    }}
                                                >
                                                    פרטים
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        </Card>
    );

    const renderOpenCharges = () => (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    חיובים פתוחים
                </Typography>
                {openCharges.length === 0 ? (
                    <Typography color="textSecondary">
                        אין חיובים פתוחים
                    </Typography>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>תיאור</TableCell>
                                    <TableCell>תאריך פגישה</TableCell>
                                    <TableCell>סטטוס פגישה</TableCell>
                                    <TableCell>סכום</TableCell>
                                    <TableCell>שולם</TableCell>
                                    <TableCell>נותר</TableCell>
                                    <TableCell>פעולות</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {openCharges.map((charge) => {
                                    const appointmentStatus = getAppointmentStatus(charge.appointmentId);
                                    return (
                                        <TableRow key={charge._id}>
                                            <TableCell>{charge.description}</TableCell>
                                            <TableCell>
                                                {charge.appointmentId ? formatDate(charge.appointmentId.date) : 'לא זמין'}
                                            </TableCell>
                                            <TableCell>
                                                {appointmentStatus ? (
                                                    <Chip
                                                        label={appointmentStatus.label}
                                                        color={appointmentStatus.color}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                ) : (
                                                    <Chip
                                                        label="לא זמין"
                                                        color="default"
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>{formatAmount(charge.amount)}</TableCell>
                                            <TableCell>{formatAmount(charge.paidAmount || 0)}</TableCell>
                                            <TableCell>
                                                {formatAmount(charge.amount - (charge.paidAmount || 0))}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={() => handleOpenPaymentModal([charge._id])}
                                                >
                                                    גבה תשלום
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        </Card>
    );


    return (
        <Box>
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

            {/* Summary Cards */}
            {renderSummaryCards()}

            {/* Action Buttons */}
            <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenPaymentModal()}
                >
                    תשלום חדש
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CashIcon />}
                    onClick={() => {
                        setSelectedAmount('');
                        setSendLinkModalOpen(true);
                    }}
                >
                    בחר סכום לתשלום
                </Button>
                <Button
                    variant="contained"
                    color="success"
                    startIcon={<PaymentIcon />}
                    onClick={() => {
                        const totalPending = openCharges.reduce((sum, charge) => sum + (charge.amount - (charge.paidAmount || 0)), 0);
                        setSelectedAmount(totalPending.toString());
                        setSendLinkModalOpen(true);
                    }}
                    disabled={openCharges.length === 0}
                >
                    גבה את כל התשלומים ({formatAmount(openCharges.reduce((sum, charge) => sum + (charge.amount - (charge.paidAmount || 0)), 0))})
                </Button>
            </Box>

            {/* Tabs */}
            <Card>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                        <Tab label="היסטוריית תשלומים" />
                        <Tab label="חיובים פתוחים" />
                    </Tabs>
                </Box>

                <Box sx={{ p: 3 }}>
                    {activeTab === 0 && (
                        <>
                            {renderFilters()}
                            {renderPaymentHistory()}
                        </>
                    )}
                    {activeTab === 1 && renderOpenCharges()}
                </Box>
            </Card>

            {/* Payment Modal */}
            <PaymentModal
                open={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                client={client}
                chargeIds={selectedChargeIds}
                appointmentId={selectedAppointmentId}
                onPaymentSuccess={handlePaymentSuccess}
                defaultAmount={defaultPaymentAmount}
            />

            {/* Send Payment Link Modal */}
            <SendPaymentLinkModal
                client={client}
                open={sendLinkModalOpen}
                onClose={() => {
                    setSendLinkModalOpen(false);
                    setSelectedAmount('');
                    loadPayments();
                    loadSummary();
                    loadOpenCharges();
                }}
                initialAmount={selectedAmount}
            />
        </Box>
    );
};

export default EnhancedPaymentsTab;
