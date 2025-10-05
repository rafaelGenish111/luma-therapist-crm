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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  Person,
  Email,
  Phone,
  LocationOn,
  Payment,
  CheckCircle,
  Schedule,
  Info,
  Cancel,
  Edit,
  Add,
  Share,
  Download,
  Print,
  ArrowBack,
  Warning
} from '@mui/icons-material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import axios from 'axios';

const BookingConfirmation = () => {
  const { confirmationCode } = useParams();
  const navigate = useNavigate();
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const loadAppointment = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/booking/verify/${confirmationCode}`);
        setAppointment(response.data);
      } catch (err) {
        setError('הזמנה לא נמצאה או קוד אישור לא תקין');
        console.error('Error loading appointment:', err);
      } finally {
        setLoading(false);
      }
    };

    if (confirmationCode) {
      loadAppointment();
    }
  }, [confirmationCode]);

  const handleCancelAppointment = async () => {
    try {
      setCancelling(true);
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
      setCancelling(false);
    }
  };

  const handleReschedule = () => {
    navigate(`/booking/reschedule/${confirmationCode}`);
  };

  const handleAddToCalendar = () => {
    if (!appointment) return;

    const startDate = new Date(appointment.startTime);
    const endDate = new Date(appointment.endTime);
    
    // Google Calendar
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(appointment.serviceType)}&dates=${format(startDate, 'yyyyMMddTHHmmss')}/${format(endDate, 'yyyyMMddTHHmmss')}&details=${encodeURIComponent(appointment.notes || '')}&location=${encodeURIComponent(appointment.location || '')}`;
    
    // iCal format
    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Luma//Therapist CRM//EN
BEGIN:VEVENT
UID:${appointment._id}@luma.com
DTSTAMP:${format(new Date(), 'yyyyMMddTHHmmss')}Z
DTSTART:${format(startDate, 'yyyyMMddTHHmmss')}Z
DTEND:${format(endDate, 'yyyyMMddTHHmmss')}Z
SUMMARY:${appointment.serviceType}
DESCRIPTION:${appointment.notes || ''}
LOCATION:${appointment.location || ''}
END:VEVENT
END:VCALENDAR`;

    // Create download link for iCal
    const blob = new Blob([icalContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appointment-${confirmationCode}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleResendConfirmation = async () => {
    try {
      await axios.post(`/api/booking/${confirmationCode}/resend-confirmation`);
      // Show success message
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בשליחת אימייל אישור');
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !appointment) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>
          חזרה לעמוד הבית
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{ mb: 2 }}
        >
          חזרה לעמוד הבית
        </Button>
        
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <CheckCircle color="success" sx={{ fontSize: 40 }} />
          <Typography variant="h4">
            הזמנה נוצרה בהצלחה!
          </Typography>
        </Box>
        
        <Typography variant="body1" color="text.secondary">
          קוד אישור: <strong>{confirmationCode}</strong>
        </Typography>
      </Box>

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
          
          <List>
            <ListItem>
              <ListItemIcon><Person /></ListItemIcon>
              <ListItemText 
                primary="מטפלת" 
                secondary={appointment.therapist?.name} 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Schedule /></ListItemIcon>
              <ListItemText 
                primary="שירות" 
                secondary={appointment.serviceType} 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CalendarToday /></ListItemIcon>
              <ListItemText 
                primary="תאריך ושעה" 
                secondary={format(new Date(appointment.startTime), 'dd/MM/yyyy HH:mm', { locale: he })} 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><AccessTime /></ListItemIcon>
              <ListItemText 
                primary="משך" 
                secondary={`${appointment.duration} דקות`} 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><LocationOn /></ListItemIcon>
              <ListItemText 
                primary="מיקום" 
                secondary={appointment.location === 'online' ? 'מפגש מקוון' : appointment.location} 
              />
            </ListItem>
            {appointment.meetingUrl && (
              <ListItem>
                <ListItemIcon><Share /></ListItemIcon>
                <ListItemText 
                  primary="קישור למפגש" 
                  secondary={
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => window.open(appointment.meetingUrl, '_blank')}
                    >
                      הצג קישור
                    </Button>
                  } 
                />
              </ListItem>
            )}
            <ListItem>
              <ListItemIcon><Payment /></ListItemIcon>
              <ListItemText 
                primary="מחיר" 
                secondary={`₪${appointment.paymentAmount}`} 
              />
            </ListItem>
            {appointment.notes && (
              <ListItem>
                <ListItemIcon><Info /></ListItemIcon>
                <ListItemText 
                  primary="הערות" 
                  secondary={appointment.notes} 
                />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      {/* Client Details */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            פרטי הלקוח
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><Person /></ListItemIcon>
              <ListItemText 
                primary="שם" 
                secondary={appointment.client?.name} 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Email /></ListItemIcon>
              <ListItemText 
                primary="אימייל" 
                secondary={appointment.client?.email} 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Phone /></ListItemIcon>
              <ListItemText 
                primary="טלפון" 
                secondary={appointment.client?.phone} 
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            פעולות
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddToCalendar}
              >
                הוסף ליומן
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Email />}
                onClick={handleResendConfirmation}
              >
                שלח אישור שוב
              </Button>
            </Grid>
            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={handleReschedule}
                  >
                    שנה תאריך
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
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
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            הוראות חשובות
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><Info /></ListItemIcon>
              <ListItemText 
                primary="הגעה לפגישה" 
                secondary="אנא הגיעו 5-10 דקות לפני השעה הנקובה" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Warning /></ListItemIcon>
              <ListItemText 
                primary="ביטול פגישה" 
                secondary="ניתן לבטל פגישה עד 24 שעות לפני השעה הנקובה" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Email /></ListItemIcon>
              <ListItemText 
                primary="אימייל אישור" 
                secondary="נשלח אימייל אישור עם כל הפרטים לכתובת שלכם" 
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            שאלות נפוצות
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="איך אני יכול לשנות את הפגישה?" 
                secondary="לחצו על 'שנה תאריך' או צרו קשר עם המטפלת" 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="מה קורה אם אני מאחר?" 
                secondary="אנא צרו קשר עם המטפלת בהקדם האפשרי" 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="איך אני יכול לבטל?" 
                secondary="לחצו על 'בטל פגישה' או צרו קשר עם המטפלת" 
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>ביטול פגישה</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            האם אתם בטוחים שברצונכם לבטל את הפגישה?
          </Typography>
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
            onClick={handleCancelAppointment}
            color="error"
            disabled={cancelling}
          >
            {cancelling ? <CircularProgress size={24} /> : 'אשר ביטול'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookingConfirmation;
