import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Divider,
  Avatar,
  Rating,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
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
  Star,
  Language,
  Schedule,
  Info,
  ArrowBack,
  ArrowForward,
  Add,
  Remove
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { format, addMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import axios from 'axios';

const steps = ['בחירת שירות', 'תאריך ושעה', 'פרטי לקוח', 'תשלום', 'אישור'];

const BookingPage = () => {
  const { therapistId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [therapist, setTherapist] = useState(null);
  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    createAccount: false
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bookingData, setBookingData] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Load therapist data
  useEffect(() => {
    const loadTherapistData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/booking/therapist/${therapistId}/info`);
        setTherapist(response.data);
      } catch (err) {
        setError('שגיאה בטעינת פרטי המטפלת');
        console.error('Error loading therapist:', err);
      } finally {
        setLoading(false);
      }
    };

    if (therapistId) {
      loadTherapistData();
    }
  }, [therapistId]);

  // Load services
  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await axios.get(`/api/booking/therapist/${therapistId}/services`);
        setServices(response.data);
      } catch (err) {
        console.error('Error loading services:', err);
      }
    };

    if (therapistId) {
      loadServices();
    }
  }, [therapistId]);

  // Load available slots when date is selected
  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!selectedDate || !selectedService) return;

      try {
        const response = await axios.get(`/api/booking/therapist/${therapistId}/slots`, {
          params: {
            date: format(selectedDate, 'yyyy-MM-dd'),
            serviceType: selectedService.type,
            duration: selectedService.duration
          }
        });
        setAvailableSlots(response.data.slots || []);
      } catch (err) {
        console.error('Error loading available slots:', err);
        setAvailableSlots([]);
      }
    };

    loadAvailableSlots();
  }, [selectedDate, selectedService, therapistId]);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setSelectedSlot(null);
    setSelectedDate(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const bookingPayload = {
        therapistId,
        serviceType: selectedService.type,
        startTime: `${format(selectedDate, 'yyyy-MM-dd')}T${selectedSlot.startTime}:00`,
        endTime: `${format(selectedDate, 'yyyy-MM-dd')}T${selectedSlot.endTime}:00`,
        clientInfo,
        paymentMethod,
        createAccount: clientInfo.createAccount
      };

      const response = await axios.post('/api/booking/create', bookingPayload);
      
      setBookingData(response.data);
      setShowConfirmation(true);
      
      // Navigate to confirmation page
      navigate(`/booking/confirmation/${response.data.confirmationCode}`);
      
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה ביצירת ההזמנה');
      console.error('Error creating booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderServiceSelection = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        בחר סוג שירות
      </Typography>
      <Grid container spacing={3}>
        {services.map((service) => (
          <Grid item xs={12} sm={6} md={4} key={service.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: selectedService?.id === service.id ? 2 : 1,
                borderColor: selectedService?.id === service.id ? 'primary.main' : 'divider',
                '&:hover': { boxShadow: 3 }
              }}
              onClick={() => handleServiceSelect(service)}
            >
              <CardMedia
                component="img"
                height="140"
                image={service.image || '/images/service-placeholder.jpg'}
                alt={service.name}
              />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {service.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {service.description}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Chip 
                    label={`${service.duration} דקות`} 
                    size="small" 
                    color="primary" 
                  />
                  <Typography variant="h6" color="primary">
                    ₪{service.price}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderDateTimeSelection = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        בחר תאריך ושעה
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            תאריך
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              minDate={new Date()}
              maxDate={addMinutes(new Date(), 30 * 24 * 60)} // 30 days from now
              renderInput={(params) => (
                <TextField {...params} fullWidth />
              )}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            שעות זמינות
          </Typography>
          {selectedDate && availableSlots.length > 0 ? (
            <Box maxHeight={300} overflow="auto">
              <Grid container spacing={1}>
                {availableSlots.map((slot, index) => (
                  <Grid item xs={6} sm={4} key={index}>
                    <Button
                      variant={selectedSlot?.startTime === slot.startTime ? 'contained' : 'outlined'}
                      fullWidth
                      onClick={() => handleSlotSelect(slot)}
                      disabled={!slot.available}
                    >
                      {slot.startTime}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : selectedDate ? (
            <Typography color="text.secondary">
              אין שעות זמינות בתאריך זה
            </Typography>
          ) : (
            <Typography color="text.secondary">
              בחר תאריך כדי לראות שעות זמינות
            </Typography>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const renderClientInfo = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        פרטי לקוח
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="שם מלא"
            value={clientInfo.name}
            onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="אימייל"
            type="email"
            value={clientInfo.email}
            onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="טלפון"
            value={clientInfo.phone}
            onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="הערות או סיבת הפגישה"
            multiline
            rows={3}
            value={clientInfo.notes}
            onChange={(e) => setClientInfo({...clientInfo, notes: e.target.value})}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={clientInfo.createAccount}
                onChange={(e) => setClientInfo({...clientInfo, createAccount: e.target.checked})}
              />
            }
            label="אני רוצה ליצור חשבון לקוח לניהול פגישות עתידיות"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderPayment = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        תשלום
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          סיכום הזמנה
        </Typography>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography>{selectedService?.name}</Typography>
          <Typography>₪{selectedService?.price}</Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography>תאריך ושעה</Typography>
          <Typography>
            {selectedDate && selectedSlot && 
              `${format(selectedDate, 'dd/MM/yyyy')} בשעה ${selectedSlot.startTime}`
            }
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h6">סה"כ</Typography>
          <Typography variant="h6">₪{selectedService?.price}</Typography>
        </Box>
      </Paper>

      <FormControl component="fieldset">
        <FormLabel component="legend">אמצעי תשלום</FormLabel>
        <RadioGroup
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <FormControlLabel value="cash" control={<Radio />} label="תשלום במקום" />
          <FormControlLabel value="stripe" control={<Radio />} label="כרטיס אשראי" />
          <FormControlLabel value="bank" control={<Radio />} label="העברה בנקאית" />
        </RadioGroup>
      </FormControl>
    </Box>
  );

  const renderConfirmation = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        אישור הזמנה
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          פרטי הפגישה
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon><Person /></ListItemIcon>
            <ListItemText primary="מטפלת" secondary={therapist?.name} />
          </ListItem>
          <ListItem>
            <ListItemIcon><Schedule /></ListItemIcon>
            <ListItemText 
              primary="שירות" 
              secondary={selectedService?.name} 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CalendarToday /></ListItemIcon>
            <ListItemText 
              primary="תאריך ושעה" 
              secondary={
                selectedDate && selectedSlot && 
                `${format(selectedDate, 'dd/MM/yyyy')} בשעה ${selectedSlot.startTime}`
              } 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><AccessTime /></ListItemIcon>
            <ListItemText 
              primary="משך" 
              secondary={`${selectedService?.duration} דקות`} 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><Payment /></ListItemIcon>
            <ListItemText 
              primary="מחיר" 
              secondary={`₪${selectedService?.price}`} 
            />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          פרטי הלקוח
        </Typography>
        <List>
          <ListItem>
            <ListItemText primary="שם" secondary={clientInfo.name} />
          </ListItem>
          <ListItem>
            <ListItemText primary="אימייל" secondary={clientInfo.email} />
          </ListItem>
          <ListItem>
            <ListItemText primary="טלפון" secondary={clientInfo.phone} />
          </ListItem>
          {clientInfo.notes && (
            <ListItem>
              <ListItemText primary="הערות" secondary={clientInfo.notes} />
            </ListItem>
          )}
        </List>
      </Paper>
    </Box>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderServiceSelection();
      case 1:
        return renderDateTimeSelection();
      case 2:
        return renderClientInfo();
      case 3:
        return renderPayment();
      case 4:
        return renderConfirmation();
      default:
        return 'Unknown step';
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return selectedService !== null;
      case 1:
        return selectedDate !== null && selectedSlot !== null;
      case 2:
        return clientInfo.name && clientInfo.email && clientInfo.phone;
      case 3:
        return paymentMethod !== null;
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (loading && !therapist) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
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
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ mb: 2 }}
          >
            חזרה
          </Button>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <Avatar
                    src={therapist?.photo}
                    sx={{ width: 80, height: 80, mx: 'auto' }}
                  >
                    {therapist?.name?.charAt(0)}
                  </Avatar>
                </Grid>
                <Grid item xs={12} sm={9}>
                  <Typography variant="h4" gutterBottom>
                    {therapist?.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {therapist?.bio}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Rating value={therapist?.rating || 0} readOnly />
                    <Typography variant="body2">
                      ({therapist?.reviewCount || 0} ביקורות)
                    </Typography>
                    <Chip 
                      label={therapist?.timezone || 'Asia/Jerusalem'} 
                      size="small" 
                      icon={<Language />}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ mb: 4 }}>
          {getStepContent(activeStep)}
        </Box>

        {/* Navigation */}
        <Box display="flex" justifyContent="space-between">
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            חזרה
          </Button>
          
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canProceed() || loading}
            endIcon={activeStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : activeStep === steps.length - 1 ? (
              'אשר הזמנה'
            ) : (
              'המשך'
            )}
          </Button>
        </Box>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmation} maxWidth="sm" fullWidth>
          <DialogTitle>הזמנה נוצרה בהצלחה!</DialogTitle>
          <DialogContent>
            <Typography>
              קוד אישור: {bookingData?.confirmationCode}
            </Typography>
            <Typography>
              נשלח אימייל אישור ל-{clientInfo.email}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowConfirmation(false)}>
              סגור
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default BookingPage;
