import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Alert,
    Card,
    CardContent,
    Grid,
    Divider
} from '@mui/material';
import {
    Send as SendIcon,
    Email as EmailIcon,
    Sms as SmsIcon,
    WhatsApp as WhatsAppIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import communicationService from '../../../../../services/communicationService';

const CommunicationTab = ({ client }) => {
    // בדיקה אם יש client
    if (!client) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography>אין נתוני לקוח להצגה</Typography>
            </Box>
        );
    }
    const [openDialog, setOpenDialog] = useState(false);
    const [form, setForm] = useState({
        channel: 'email',
        subject: '',
        body: '',
        metadata: {}
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [communications, setCommunications] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    const loadCommunications = React.useCallback(async () => {
        if (!client?._id) return;

        try {
            setLoading(true);
            const data = await communicationService.getByClient(client._id);
            setCommunications(data?.communications || []);
            setStats(data?.stats || {});
        } catch (error) {
            console.error('Error loading communications:', error);
            // Fallback data for development
            setCommunications([]);
            setStats({
                total: 0,
                byStatus: { sent: 0, failed: 0 },
                successRate: 0
            });
            // Don't show error to user for now - just use fallback data
        } finally {
            setLoading(false);
        }
    }, [client?._id]);

    // טעינת נתונים
    useEffect(() => {
        if (client?._id) {
            loadCommunications();
        } else {
            // Reset data if no client
            setCommunications([]);
            setStats({});
        }
    }, [client?._id, loadCommunications]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSending(true);

        if (!form.body.trim()) {
            setError('תוכן ההודעה הוא שדה חובה');
            setSending(false);
            return;
        }

        // בדיקת פרטי קשר לפי הערוץ
        if (form.channel === 'email' && !client?.email) {
            setError('ללקוח אין כתובת אימייל');
            setSending(false);
            return;
        }

        if ((form.channel === 'sms' || form.channel === 'whatsapp') && !client?.phone) {
            setError('ללקוח אין מספר טלפון');
            setSending(false);
            return;
        }

        try {
            await communicationService.sendMessage(client._id, form);
            setSuccess('ההודעה נשלחה בהצלחה');
            setOpenDialog(false);
            setForm({ channel: 'email', subject: '', body: '', metadata: {} });
            loadCommunications(); // טעינה מחדש
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error sending message:', error);
            setError(error?.message || 'שגיאה בשליחת ההודעה');
            setTimeout(() => setError(''), 5000);
        } finally {
            setSending(false);
        }
    };

    const handleInputChange = (field, value) => {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getChannelIcon = (channel) => {
        switch (channel) {
            case 'email': return <EmailIcon fontSize="small" />;
            case 'sms': return <SmsIcon fontSize="small" />;
            case 'whatsapp': return <WhatsAppIcon fontSize="small" />;
            default: return <EmailIcon fontSize="small" />;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'sent':
            case 'delivered':
                return <CheckCircleIcon fontSize="small" color="success" />;
            case 'failed':
                return <ErrorIcon fontSize="small" color="error" />;
            case 'queued':
                return <ScheduleIcon fontSize="small" color="warning" />;
            default:
                return <ScheduleIcon fontSize="small" />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box>
            {/* כרטיסי סיכום */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="primary">
                                {stats?.total || 0}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                הודעות סה"כ
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="success.main">
                                {stats?.byStatus?.sent || 0}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                נשלחו
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="error.main">
                                {stats?.byStatus?.failed || 0}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                נכשלו
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="info.main">
                                {stats?.successRate || 0}%
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                אחוז הצלחה
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* כפתור שליחת הודעה */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">היסטוריית תקשורת</Typography>
                <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={() => setOpenDialog(true)}
                    disabled={!client?.email && !client?.phone}
                >
                    שלח הודעה
                </Button>
            </Box>

            {/* הודעות שגיאה והצלחה */}
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

            {/* טבלת הודעות */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>תאריך</TableCell>
                            <TableCell>ערוץ</TableCell>
                            <TableCell>נושא</TableCell>
                            <TableCell>תוכן</TableCell>
                            <TableCell>סטטוס</TableCell>
                            <TableCell>פעולות</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    טוען...
                                </TableCell>
                            </TableRow>
                        ) : (communications || []).length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    אין הודעות להצגה
                                </TableCell>
                            </TableRow>
                        ) : (
                            (communications || []).map((comm) => (
                                <TableRow key={comm._id}>
                                    <TableCell>
                                        {formatDate(comm.sentAt)}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={getChannelIcon(comm.channel)}
                                            label={communicationService.getChannelLabel(comm.channel)}
                                            color={communicationService.getChannelColor(comm.channel)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {comm.subject || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                            {comm.body}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getStatusIcon(comm.status)}
                                            <Typography variant="body2">
                                                {communicationService.getStatusLabel(comm.status)}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {comm.status === 'failed' && (
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                title="נסה שוב"
                                                onClick={() => {
                                                    // TODO: Implement retry functionality
                                                    console.log('Retry communication:', comm._id);
                                                }}
                                            >
                                                <RefreshIcon />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* דיאלוג שליחת הודעה */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>שלח הודעה ל{client?.firstName} {client?.lastName}</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>ערוץ תקשורת</InputLabel>
                                    <Select
                                        value={form.channel}
                                        onChange={(e) => handleInputChange('channel', e.target.value)}
                                        label="ערוץ תקשורת"
                                    >
                                        <MenuItem value="email" disabled={!client?.email}>
                                            אימייל {!client?.email && '(לא זמין)'}
                                        </MenuItem>
                                        <MenuItem value="sms" disabled={!client?.phone}>
                                            SMS {!client?.phone && '(לא זמין)'}
                                        </MenuItem>
                                        <MenuItem value="whatsapp" disabled={!client?.phone}>
                                            WhatsApp {!client?.phone && '(לא זמין)'}
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="נושא (אופציונלי)"
                                    value={form.subject}
                                    onChange={(e) => handleInputChange('subject', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    label="תוכן ההודעה *"
                                    value={form.body}
                                    onChange={(e) => handleInputChange('body', e.target.value)}
                                    required
                                    helperText="כתוב את תוכן ההודעה כאן"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)}>
                            ביטול
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={sending || !form.body.trim()}
                        >
                            {sending ? 'שולח...' : 'שלח הודעה'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default CommunicationTab;
