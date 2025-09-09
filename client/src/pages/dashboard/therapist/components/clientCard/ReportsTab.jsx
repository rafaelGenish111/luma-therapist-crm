import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Divider
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    Payment as PaymentIcon,
    Event as EventIcon,
    Cancel as CancelIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import paymentService from '../../../../../services/paymentService';
import appointmentService from '../../../../../services/appointmentService';

const ReportsTab = ({ client }) => {
    // בדיקה אם יש client
    if (!client) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography>אין נתוני לקוח להצגה</Typography>
            </Box>
        );
    }
    const [payments, setPayments] = useState([]);
    const [paymentStats, setPaymentStats] = useState({});
    const [appointments, setAppointments] = useState([]);
    const [appointmentStats, setAppointmentStats] = useState({});
    const [loading, setLoading] = useState(false);

    const loadData = React.useCallback(async () => {
        if (!client?._id) return;

        try {
            setLoading(true);

            // טעינת תשלומים
            const paymentsData = await paymentService.getByClient(client._id);
            setPayments(paymentsData?.payments || []);
            setPaymentStats(paymentsData?.stats || {});

            // טעינת פגישות
            const appointmentsData = await appointmentService.getByClient(client._id);
            setAppointments(appointmentsData?.appointments || []);
            setAppointmentStats(appointmentsData?.stats || {});
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback data for development
            setPayments([]);
            setPaymentStats({});
            setAppointments([]);
            setAppointmentStats({});
            // Don't show error to user for now - just use fallback data
        } finally {
            setLoading(false);
        }
    }, [client?._id]);

    // טעינת נתונים
    useEffect(() => {
        if (client?._id) {
            loadData();
        } else {
            // Reset data if no client
            setPayments([]);
            setPaymentStats({});
            setAppointments([]);
            setAppointmentStats({});
        }
    }, [client?._id, loadData]);

    // חישוב KPI
    const totalPaid = paymentStats?.paidAmount || 0;
    const totalAppointments = appointmentStats?.total || 0;
    const completedAppointments = appointmentStats?.byStatus?.completed || 0;
    const noShows = appointmentStats?.byStatus?.no_show || 0;
    const cancelledAppointments = appointmentStats?.byStatus?.cancelled || 0;
    const successRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

    // חישוב ממוצע תשלום
    const averagePayment = paymentStats?.paid > 0 ? Math.round(totalPaid / paymentStats.paid) : 0;

    // חישוב תשלומים לפי חודש (לשנה האחרונה)
    const getMonthlyPayments = () => {
        if (!Array.isArray(payments) || payments.length === 0) {
            return [];
        }

        const monthlyData = {};
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

        payments
            .filter(payment => payment.status === 'paid' && new Date(payment.createdAt) >= oneYearAgo)
            .forEach(payment => {
                const date = new Date(payment.createdAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + payment.amount;
            });

        return Object.entries(monthlyData)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-12); // 12 החודשים האחרונים
    };

    const monthlyPayments = getMonthlyPayments();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('he-IL');
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography>טוען נתונים...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* כרטיסי KPI */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <PaymentIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6" color="primary">
                                    {formatCurrency(totalPaid)}
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="textSecondary">
                                סכום שולם כולל
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {paymentStats?.paid || 0} תשלומים
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <EventIcon color="success" sx={{ mr: 1 }} />
                                <Typography variant="h6" color="success.main">
                                    {totalAppointments}
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="textSecondary">
                                פגישות סה"כ
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {successRate}% הצלחה
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                                <Typography variant="h6" color="success.main">
                                    {completedAppointments}
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="textSecondary">
                                פגישות הושלמו
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CancelIcon color="error" sx={{ mr: 1 }} />
                                <Typography variant="h6" color="error.main">
                                    {noShows}
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="textSecondary">
                                לא הגיעו
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {totalAppointments > 0 ? Math.round((noShows / totalAppointments) * 100) : 0}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* גרף תשלומים חודשי */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                תשלומים חודשיים
                            </Typography>
                            {monthlyPayments.length > 0 ? (
                                <Box sx={{ height: 200, overflow: 'auto' }}>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>חודש</TableCell>
                                                    <TableCell align="right">סכום</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {monthlyPayments.map((item) => (
                                                    <TableRow key={item.month}>
                                                        <TableCell>
                                                            {new Date(item.month + '-01').toLocaleDateString('he-IL', {
                                                                year: 'numeric',
                                                                month: 'long'
                                                            })}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {formatCurrency(item.amount)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="textSecondary" align="center">
                                    אין נתוני תשלומים להצגה
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* סטטיסטיקות מפורטות */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                סטטיסטיקות מפורטות
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        ממוצע תשלום:
                                    </Typography>
                                    <Typography variant="h6">
                                        {formatCurrency(averagePayment)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        פגישות בוטלו:
                                    </Typography>
                                    <Typography variant="h6" color="warning.main">
                                        {cancelledAppointments}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        תשלומים ממתינים:
                                    </Typography>
                                    <Typography variant="h6" color="warning.main">
                                        {paymentStats?.pending || 0}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        תשלומים נכשלו:
                                    </Typography>
                                    <Typography variant="h6" color="error.main">
                                        {paymentStats?.failed || 0}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* טבלת תשלומים אחרונים */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                תשלומים אחרונים
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>תאריך</TableCell>
                                            <TableCell>סכום</TableCell>
                                            <TableCell>שיטה</TableCell>
                                            <TableCell>סטטוס</TableCell>
                                            <TableCell>חשבונית</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(payments || []).slice(0, 10).map((payment) => (
                                            <TableRow key={payment._id}>
                                                <TableCell>
                                                    {formatDate(payment.createdAt)}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(payment.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={paymentService.getMethodLabel(payment.method)}
                                                        color={paymentService.getMethodColor(payment.method)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={paymentService.getStatusLabel(payment.status)}
                                                        color={paymentService.getStatusColor(payment.status)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {payment.invoiceUrl ? (
                                                        <a
                                                            href={payment.invoiceUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ textDecoration: 'none' }}
                                                        >
                                                            צפה בחשבונית
                                                        </a>
                                                    ) : (
                                                        <Typography variant="body2" color="textSecondary">
                                                            אין חשבונית
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(payments || []).length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    אין תשלומים להצגה
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ReportsTab;
