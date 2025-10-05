import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  TextField,
  CircularProgress,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  Person,
  Email,
  Phone,
  LocationOn,
  Payment,
  Schedule,
  Info,
  Cancel,
  Edit,
  CheckCircle,
  Warning,
  Lock
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { format, addMinutes } from 'date-fns';
import axios from 'axios';

const ManageBooking = () => {
  const { confirmationCode } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState('auth'); // 'auth', 'manage'
  const [email, setEmail] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [newDate, setNewDate] = useState(null);
  const [newTime, setNewTime] = useState(null);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`/api/booking/${confirmationCode}/auth`, {
        email
      });

      setAppointment(response.data);
      setStep('manage');
    } catch (err) {
      setError('אימייל לא תואם להזמנה זו');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async (date) => {
    if (!date || !appointment) return;

    try {
      const response = await axios.get(`/api/booking/therapist/${appointment.therapistId}/slots`, {
        params: {
          date: format(date, 'yyyy-MM-dd'),
          serviceType: appointment.serviceType,
          duration: appointment.duration,
          excludeAppointmentId: appointment._id
        }
      });
      setAvailableSlots(response.data.slots || []);
    } catch (err) {
      console.error('Error loading available slots:', err);
      setAvailableSlots([]);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) return;

    try {
      setProcessing(true);

      const newStartTime = `${format(newDate, 'yyyy-MM-dd')}T${format(newTime, 'HH:mm')}:00`;
      const newEndTime = `${format(newDate, 'yyyy-MM-dd')}T${format(addMinutes(newTime, appointment.duration), 'HH:mm')}:00`;

      const response = await axios.post(`/api/booking/${confirmationCode}/reschedule`, {
        newStartTime,
        newEndTime
      });

      setAppointment(response.data);
      setShowRescheduleDialog(false);
      setNewDate(null);
      setNewTime(null);
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בשינוי התאריך');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    try {
      setProcessing(true);

      await axios.post(`/api/booking/${confirmationCode}/cancel`, {
        reason: cancelReason
      });

      setAppointment(prev => ({
        ...prev,
        status: 'cancelled',
        cancellationReason: cancelReason
      }));

      setShowCancelDialog(false);
      setCancelReason('');
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בביטול ההזמנה');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'success';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'ממתין לאישור';
      case 'confirmed':
        return 'מאושר';
      case 'completed':
        return 'הושלם';
      case 'cancelled':
        return 'בוטל';
      default:
        return status;
    }
  };

  const canReschedule = () => {
    if (!appointment) return false;
    const appointmentDate = new Date(appointment.startTime);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
    return hoursUntilAppointment > 24 && appointment.status !== 'cancelled' && appointment.status !== 'completed';
  };

  const canCancel = () => {
    if (!appointment) return false;
    const appointmentDate = new Date(appointment.startTime);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
    return hoursUntilAppointment > 24 && appointment.status !== 'cancelled' && appointment.status !== 'completed';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            onClick={() => navigate('/')}
            sx={{ mb: 2 }}
          >
            חזרה לעמוד הבית
          </Button>

          <Typography variant="h4" gutterBottom>
            ניהול הזמנה
          </Typography>
          <Typography variant="body1" color="text.secondary">
            קוד אישור: <strong>{confirmationCode}</strong>
          </Typography>
        </Box>

        {/* Authentication Step */}
        {step === 'auth' && (
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Lock color="primary" />
                <Typography variant="h6">
                  הזדהות לניהול הזמנה
                </Typography>
              </Box>

              <Typography paragraph>
                אנא הזינו את כתובת האימייל ששימשה ליצירת ההזמנה כדי לגשת לפרטים ולנהל את הפגישה.
              </Typography>

              <Box component="form" onSubmit={handleAuth}>
                <TextField
                  fullWidth
                  label="כתובת אימייל"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  sx={{ mb: 3 }}
                />

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading || !email}
                >
                  {loading ? <CircularProgress size={24} /> : 'המשך'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Management Step */}
        {step === 'manage' && appointment && (
          <>
            {/* Appointment Details */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h5">
                    פרטי הפגישה
                  </Typography>
                  <Chip
                    label={getStatusText(appointment.status)}
                    color={getStatusColor(appointment.status)}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      מטפלת
                    </Typography>
                    <Typography variant="body1">
                      {appointment.therapist?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      שירות
                    </Typography>
                    <Typography variant="body1">
                      {appointment.serviceType}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      תאריך ושעה
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(appointment.startTime), 'dd/MM/yyyy HH:mm', { locale: he })}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      משך
                    </Typography>
                    <Typography variant="body1">
                      {appointment.duration} דקות
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      מיקום
                    </Typography>
                    <Typography variant="body1">
                      {appointment.location === 'online' ? 'מפגש מקוון' : appointment.location}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      מחיר
                    </Typography>
                    <Typography variant="body1">
                      ₪{appointment.paymentAmount}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  פעולות זמינות
                </Typography>

                <Grid container spacing={2}>
                  {canReschedule() && (
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => setShowRescheduleDialog(true)}
                      >
                        שנה תאריך ושעה
                      </Button>
                    </Grid>
                  )}

                  {canCancel() && (
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => setShowCancelDialog(true)}
                      >
                        בטל פגישה
                      </Button>
                    </Grid>
                  )}

                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Email />}
                      onClick={() => axios.post(`/api/booking/${confirmationCode}/resend-confirmation`)}
                    >
                      שלח אישור שוב
                    </Button>
                  </Grid>
                </Grid>

                {!canReschedule() && !canCancel() && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    לא ניתן לשנות או לבטל פגישה פחות מ-24 שעות לפני השעה הנקובה
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  פרטי הלקוח
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      שם מלא
                    </Typography>
                    <Typography variant="body1">
                      {appointment.client?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      אימייל
                    </Typography>
                    <Typography variant="body1">
                      {appointment.client?.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      טלפון
                    </Typography>
                    <Typography variant="body1">
                      {appointment.client?.phone}
                    </Typography>
                  </Grid>
                  {appointment.notes && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        הערות
                      </Typography>
                      <Typography variant="body1">
                        {appointment.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </>
        )}

        {/* Reschedule Dialog */}
        <Dialog
          open={showRescheduleDialog}
          onClose={() => setShowRescheduleDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>שינוי תאריך ושעה</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="תאריך חדש"
                  value={newDate}
                  onChange={(date) => {
                    setNewDate(date);
                    loadAvailableSlots(date);
                  }}
                  minDate={new Date()}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TimePicker
                  label="שעה חדשה"
                  value={newTime}
                  onChange={setNewTime}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth />
                  )}
                />
              </Grid>
            </Grid>

            {newDate && availableSlots.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  שעות זמינות בתאריך {format(newDate, 'dd/MM/yyyy')}:
                </Typography>
                <Grid container spacing={1}>
                  {availableSlots.slice(0, 8).map((slot, index) => (
                    <Grid item xs={3} key={index}>
                      <Button
                        variant={newTime && format(newTime, 'HH:mm') === slot.startTime ? 'contained' : 'outlined'}
                        size="small"
                        fullWidth
                        onClick={() => {
                          const [hours, minutes] = slot.startTime.split(':');
                          setNewTime(new Date().setHours(parseInt(hours), parseInt(minutes), 0, 0));
                        }}
                        disabled={!slot.available}
                      >
                        {slot.startTime}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRescheduleDialog(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleReschedule}
              variant="contained"
              disabled={!newDate || !newTime || processing}
            >
              {processing ? <CircularProgress size={24} /> : 'אשר שינוי'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
          <DialogTitle>ביטול פגישה</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              האם אתם בטוחים שברצונכם לבטל את הפגישה? פעולה זו לא ניתנת לביטול.
            </Alert>

            <TextField
              fullWidth
              label="סיבת הביטול"
              multiline
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCancelDialog(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleCancel}
              color="error"
              variant="contained"
              disabled={processing}
            >
              {processing ? <CircularProgress size={24} /> : 'אשר ביטול'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default ManageBooking;
