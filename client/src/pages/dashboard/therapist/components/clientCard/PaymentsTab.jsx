import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Card, CardContent, Grid, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    Alert, CircularProgress, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Divider, Fab
} from '@mui/material';
import {
    Add as AddIcon, Download as DownloadIcon, Visibility as ViewIcon,
    Edit as EditIcon, Delete as DeleteIcon, Receipt as ReceiptIcon,
    Payment as PaymentIcon, AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';

import paymentService from '../../../../../services/paymentService';
import chargeService from '../../../../../services/chargeService';

const PaymentsTab = ({ client }) => {
    const [payments, setPayments] = useState([]);
    const [openCharges, setOpenCharges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [selectedCharge, setSelectedCharge] = useState(null);
    const [form, setForm] = useState({
        amount: '',
        description: '',
        method: 'simulated',
        dueDate: null
    });

    useEffect(() => {
        loadPayments();
    }, [client._id]);

    const loadPayments = async () => {
        try {
            setLoading(true);
            const response = await paymentService.getByClient(client._id);
            setPayments(response.payments || response.data?.data || []);
            // טען חיובים פתוחים
            const chargesRes = await chargeService.getByClient(client._id, { status: 'open' });
            setOpenCharges(chargesRes.charges || []);
        } catch (err) {
            setError('שגיאה בטעינת תשלומים');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (payment = null, charge = null) => {
        setSelectedCharge(charge);
        if (payment) {
            setSelectedPayment(payment);
            setForm({
                amount: payment.amount.toString(),
                description: payment.description || '',
                method: payment.method,
                dueDate: null
            });
        } else {
            setSelectedPayment(null);
            setForm({
                amount: charge ? String(charge.amount) : '',
                description: '',
                type: 'session',
                paymentMethod: 'simulation',
                dueDate: null
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedPayment(null);
        setSelectedCharge(null);
        setForm({
            amount: '',
            description: '',
            method: 'simulated',
            dueDate: null
        });
    };

    const handleSubmit = async () => {
        try {
            const paymentData = {
                clientId: client._id,
                amount: parseFloat(form.amount),
                description: form.description,
                method: form.method,
                appointmentId: selectedCharge?.appointmentId
            };

            if (selectedPayment) {
                await paymentService.update(selectedPayment._id, paymentData);
                setSuccess('התשלום עודכן בהצלחה');
            } else {
                await paymentService.create(client._id, paymentData);
                setSuccess('התשלום נוצר בהצלחה');
            }

            loadPayments();
            handleCloseDialog();
        } catch (err) {
            setError('שגיאה בשמירת התשלום');
        }
    };

    const handleMarkAsPaid = async (paymentId) => {
        try {
            await paymentService.markAsPaid(paymentId);
            setSuccess('התשלום סומן כשולם');
            loadPayments();
        } catch (err) {
            setError('שגיאה בסימון התשלום');
        }
    };

    const handleDelete = async (paymentId) => {
        if (!window.confirm('האם את בטוחה שברצונך למחוק תשלום זה?')) {
            return;
        }

        try {
            await paymentService.delete(paymentId);
            setSuccess('התשלום נמחק בהצלחה');
            loadPayments();
        } catch (err) {
            setError('שגיאה במחיקת התשלום');
        }
    };

    const handleDownloadInvoice = async (paymentId) => {
        try {
            const response = await paymentService.downloadInvoice(paymentId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${paymentId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('שגיאה בהורדת החשבונית');
        }
    };

    const getTotalAmount = () => {
        return payments.reduce((sum, payment) => sum + payment.amount, 0);
    };

    const getPaidAmount = () => {
        return payments
            .filter(payment => payment.status === 'paid')
            .reduce((sum, payment) => sum + payment.amount, 0);
    };

    const getPendingAmount = () => {
        // יתרה לתשלום = סכום כל החיובים הפתוחים פחות מה ששולם
        const openChargesTotal = openCharges.reduce((sum, ch) => sum + (ch.amount || 0), 0);
        const paidOnOpenCharges = openCharges.reduce((sum, ch) => sum + (ch.paidAmount || 0), 0);
        const balance = openChargesTotal - paidOnOpenCharges;
        return balance > 0 ? balance : 0;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {/* סיכום תשלומים */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="primary">
                                סה"כ תשלומים
                            </Typography>
                            <Typography variant="h4">
                                {paymentService.formatAmount(getTotalAmount())}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="success.main">
                                שולם
                            </Typography>
                            <Typography variant="h4">
                                {paymentService.formatAmount(getPaidAmount())}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="warning.main">
                                ממתין לתשלום
                            </Typography>
                            <Typography variant="h4">
                                {paymentService.formatAmount(getPendingAmount())}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* חיובים פתוחים */}
            {openCharges.length > 0 && (
                <Paper sx={{ mb: 2 }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">חיובים פתוחים</Typography>
                    </Box>
                    <Divider />
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>נוצר</TableCell>
                                    <TableCell>סכום</TableCell>
                                    <TableCell>סטטוס</TableCell>
                                    <TableCell>פעולות</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {openCharges.map((ch) => (
                                    <TableRow key={ch._id}>
                                        <TableCell>{paymentService.formatDate(ch.createdAt)}</TableCell>
                                        <TableCell>{paymentService.formatAmount(ch.amount)}</TableCell>
                                        <TableCell>
                                            <Chip label={ch.status} color={ch.status === 'PENDING' ? 'warning' : 'info'} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleOpenDialog(null, ch)}
                                            >
                                                גבייה (סימולציה)
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* רשימת תשלומים */}
            <Paper sx={{ mb: 2 }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">היסטוריית תשלומים</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        תשלום חדש
                    </Button>
                </Box>
                <Divider />
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>תאריך</TableCell>
                                <TableCell>תיאור</TableCell>
                                <TableCell>סכום</TableCell>
                                <TableCell>סטטוס</TableCell>
                                <TableCell>שיטת תשלום</TableCell>
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
                                        <TableCell>
                                            {paymentService.formatDate(payment.createdAt)}
                                        </TableCell>
                                        <TableCell>{payment.description}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {paymentService.formatAmount(payment.amount)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={paymentService.getStatusLabel(payment.status)}
                                                color={paymentService.getStatusColor(payment.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={paymentService.getMethodLabel(payment.method)}
                                                color={paymentService.getMethodColor(payment.method)}
                                                variant="outlined"
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" gap={1}>
                                                {payment.status === 'pending' && (
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => handleMarkAsPaid(payment._id)}
                                                        title="סמן כשולם"
                                                    >
                                                        <PaymentIcon />
                                                    </IconButton>
                                                )}
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDownloadInvoice(payment._id)}
                                                    title="הורד חשבונית"
                                                >
                                                    <DownloadIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDialog(payment)}
                                                    title="ערוך"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(payment._id)}
                                                    title="מחק"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* דיאלוג יצירה/עריכה */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedPayment ? 'עריכת תשלום' : 'תשלום חדש'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            label="סכום"
                            type="number"
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            fullWidth
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                        <TextField
                            label="תיאור"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            fullWidth
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            select
                            label="שיטת תשלום"
                            value={form.method}
                            onChange={(e) => setForm({ ...form, method: e.target.value })}
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            <MenuItem value="simulated">סימולציה</MenuItem>
                            <MenuItem value="cash">מזומן</MenuItem>
                            <MenuItem value="card">כרטיס אשראי</MenuItem>
                            <MenuItem value="transfer">העברה בנקאית</MenuItem>
                        </TextField>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                            <DatePicker
                                label="תאריך יעד לתשלום"
                                value={form.dueDate}
                                onChange={(newValue) => setForm({ ...form, dueDate: newValue })}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </LocalizationProvider>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>ביטול</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedPayment ? 'עדכן' : 'צור'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* FAB להוספה מהירה */}
            <Fab
                color="primary"
                aria-label="הוסף תשלום"
                sx={{ position: 'fixed', bottom: 16, right: 16 }}
                onClick={() => handleOpenDialog()}
            >
                <AddIcon />
            </Fab>
        </Box>
    );
};

export default PaymentsTab;
