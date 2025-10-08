import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Card,
  CardContent,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
  Schedule,
  Person,
  AttachMoney,
  FilterList,
  MoreVert,
  Edit,
  Cancel,
  CheckCircle,
  AccessTime,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { format, parseISO, isToday, isYesterday, isTomorrow } from 'date-fns';
import { he } from 'date-fns/locale';

const DayDetailsPanel = ({
  selectedDate,
  appointments = [],
  onAppointmentClick,
  onNewAppointment,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [filter, setFilter] = useState('all');

  // Filter and sort appointments for selected date
  const filteredAppointments = useMemo(() => {
    if (!selectedDate) return [];
    
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    let dayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      return aptDate >= dayStart && aptDate <= dayEnd;
    });

    // Apply status filter
    if (filter !== 'all') {
      dayAppointments = dayAppointments.filter(apt => apt.status === filter);
    }

    // Sort by start time
    return dayAppointments.sort((a, b) => 
      new Date(a.startTime) - new Date(b.startTime)
    );
  }, [appointments, selectedDate, filter]);

  // Calculate day stats
  const dayStats = useMemo(() => {
    const total = filteredAppointments.length;
    const confirmed = filteredAppointments.filter(apt => apt.status === 'confirmed').length;
    const pending = filteredAppointments.filter(apt => apt.status === 'pending').length;
    const cancelled = filteredAppointments.filter(apt => apt.status === 'cancelled').length;
    
    const totalDuration = filteredAppointments.reduce((sum, apt) => sum + (apt.duration || 60), 0);
    const totalRevenue = filteredAppointments
      .filter(apt => apt.paymentStatus === 'paid')
      .reduce((sum, apt) => sum + (apt.paymentAmount || 0), 0);

    return { total, confirmed, pending, cancelled, totalDuration, totalRevenue };
  }, [filteredAppointments]);

  // Format date display
  const formatDate = (date) => {
    if (!date) return 'בחר תאריך';
    
    if (isToday(date)) return `היום, ${format(date, 'd בMMMM yyyy', { locale: he })}`;
    if (isYesterday(date)) return `אתמול, ${format(date, 'd בMMMM yyyy', { locale: he })}`;
    if (isTomorrow(date)) return `מחר, ${format(date, 'd בMMMM yyyy', { locale: he })}`;
    
    return format(date, 'EEEE, d בMMMM yyyy', { locale: he });
  };

  // Get status color and icon
  const getStatusConfig = (status) => {
    switch (status) {
      case 'confirmed':
        return { color: '#4CAF50', icon: CheckCircle, label: 'מאושר' };
      case 'pending':
        return { color: '#FF9800', icon: AccessTime, label: 'ממתין' };
      case 'cancelled':
        return { color: '#F44336', icon: CancelIcon, label: 'בוטל' };
      case 'completed':
        return { color: '#9E9E9E', icon: CheckCircle, label: 'הושלם' };
      default:
        return { color: '#757575', icon: Schedule, label: status || 'לא מוגדר' };
    }
  };

  // Get payment status color
  const getPaymentColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return '#4CAF50';
      case 'partially_paid':
        return '#FF9800';
      case 'unpaid':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  if (loading) {
    return (
      <Paper sx={{ height: '100%', p: 2 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 2, mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={100} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={100} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={100} />
      </Paper>
    );
  }

  return (
    <Paper 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: isMobile ? 0 : 2,
        boxShadow: isMobile ? 'none' : 1,
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          {formatDate(selectedDate)}
        </Typography>
        
        {/* Quick Stats */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`${dayStats.total} פגישות`} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
          <Chip 
            label={`${Math.round(dayStats.totalDuration / 60)} שעות`} 
            size="small" 
            color="secondary" 
            variant="outlined" 
          />
          <Chip 
            label={`${dayStats.totalRevenue} ₪`} 
            size="small" 
            color="success" 
            variant="outlined" 
          />
        </Box>

        {/* Filter */}
        <FormControl size="small" fullWidth>
          <InputLabel>סינון</InputLabel>
          <Select
            value={filter}
            label="סינון"
            onChange={(e) => setFilter(e.target.value)}
            startAdornment={<FilterList sx={{ mr: 1, fontSize: 20 }} />}
          >
            <MenuItem value="all">הכל</MenuItem>
            <MenuItem value="confirmed">מאושר</MenuItem>
            <MenuItem value="pending">ממתין</MenuItem>
            <MenuItem value="cancelled">בוטל</MenuItem>
            <MenuItem value="completed">הושלם</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Appointments List */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {filteredAppointments.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            textAlign: 'center',
            p: 3
          }}>
            <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              אין פגישות לתאריך זה
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filter !== 'all' 
                ? `אין פגישות עם סטטוס "${filter}"`
                : 'לחץ על "פגישה חדשה" כדי להוסיף'
              }
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filteredAppointments.map((appointment, index) => {
              const statusConfig = getStatusConfig(appointment.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <React.Fragment key={appointment._id || index}>
                  <Card 
                    sx={{ 
                      mb: 1, 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                      }
                    }}
                    onClick={() => onAppointmentClick && onAppointmentClick(appointment)}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        {/* Time & Duration */}
                        <Box sx={{ minWidth: 80 }}>
                          <Typography variant="body2" color="primary" fontWeight={600}>
                            {format(parseISO(appointment.startTime), 'HH:mm')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {appointment.duration || 60} דק'
                          </Typography>
                        </Box>

                        {/* Client Info */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                              {appointment.client?.firstName?.[0] || '?'}
                            </Avatar>
                            <Typography variant="subtitle2" noWrap>
                              {appointment.client?.firstName} {appointment.client?.lastName}
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {appointment.serviceType || 'שירות כללי'}
                          </Typography>
                        </Box>

                        {/* Status & Payment */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                          <Chip
                            icon={<StatusIcon sx={{ fontSize: 16 }} />}
                            label={statusConfig.label}
                            size="small"
                            sx={{ 
                              bgcolor: statusConfig.color,
                              color: 'white',
                              fontSize: '0.75rem',
                              height: 24
                            }}
                          />
                          
                          {appointment.paymentAmount > 0 && (
                            <Chip
                              label={`${appointment.paymentAmount} ₪`}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                borderColor: getPaymentColor(appointment.paymentStatus),
                                color: getPaymentColor(appointment.paymentStatus),
                                fontSize: '0.7rem',
                                height: 20
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Add />}
          onClick={() => onNewAppointment && onNewAppointment()}
          sx={{ 
            borderRadius: 2,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem'
          }}
        >
          פגישה חדשה
        </Button>
      </Box>
    </Paper>
  );
};

export default DayDetailsPanel;
