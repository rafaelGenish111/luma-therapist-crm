import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Cancel,
  Visibility,
  Schedule,
  Person,
  AttachMoney,
  CheckCircle,
  AccessTime,
  Cancel as CancelIcon,
  LocationOn,
  VideoCall,
  Home,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

const AppointmentCard = ({
  appointment,
  onView,
  onEdit,
  onCancel,
  compact = false,
  showActions = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

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

  // Get payment status color and label
  const getPaymentConfig = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return { color: '#4CAF50', label: 'שולם' };
      case 'partially_paid':
        return { color: '#FF9800', label: 'חלקי' };
      case 'unpaid':
        return { color: '#F44336', label: 'לא שולם' };
      default:
        return { color: '#757575', label: 'לא מוגדר' };
    }
  };

  // Get location icon
  const getLocationIcon = (location) => {
    switch (location) {
      case 'online':
        return VideoCall;
      case 'home':
        return Home;
      case 'clinic':
      default:
        return LocationOn;
    }
  };

  const statusConfig = getStatusConfig(appointment.status);
  const paymentConfig = getPaymentConfig(appointment.paymentStatus);
  const StatusIcon = statusConfig.icon;
  const LocationIcon = getLocationIcon(appointment.location);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    handleMenuClose();
    if (action === 'view' && onView) onView(appointment);
    if (action === 'edit' && onEdit) onEdit(appointment);
    if (action === 'cancel' && onCancel) onCancel(appointment);
  };

  const handleCardClick = () => {
    if (onView) onView(appointment);
  };

  if (compact) {
    return (
      <Card 
        sx={{ 
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: 2,
          }
        }}
        onClick={handleCardClick}
      >
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Time */}
            <Box sx={{ minWidth: 60, textAlign: 'center' }}>
              <Typography variant="caption" color="primary" fontWeight={600}>
                {format(parseISO(appointment.startTime), 'HH:mm')}
              </Typography>
            </Box>

            {/* Client */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap fontWeight={500}>
                {appointment.client?.firstName} {appointment.client?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {appointment.serviceType}
              </Typography>
            </Box>

            {/* Status */}
            <Chip
              icon={<StatusIcon sx={{ fontSize: 14 }} />}
              label={statusConfig.label}
              size="small"
              sx={{ 
                bgcolor: statusConfig.color,
                color: 'white',
                fontSize: '0.7rem',
                height: 20,
                minWidth: 'auto'
              }}
            />

            {/* Actions */}
            {showActions && (
              <IconButton 
                size="small" 
                onClick={handleMenuOpen}
                sx={{ ml: 0.5 }}
              >
                <MoreVert sx={{ fontSize: 18 }} />
              </IconButton>
            )}
          </Box>

          {/* Actions Menu */}
          {showActions && (
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={() => handleAction('view')}>
                <Visibility sx={{ mr: 1, fontSize: 20 }} />
                צפייה
              </MenuItem>
              <MenuItem onClick={() => handleAction('edit')}>
                <Edit sx={{ mr: 1, fontSize: 20 }} />
                עריכה
              </MenuItem>
              <MenuItem onClick={() => handleAction('cancel')} sx={{ color: 'error.main' }}>
                <Cancel sx={{ mr: 1, fontSize: 20 }} />
                ביטול
              </MenuItem>
            </Menu>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full card layout
  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 2,
        }
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Time & Duration */}
          <Box sx={{ minWidth: 80, textAlign: 'center' }}>
            <Typography variant="h6" color="primary" fontWeight={600}>
              {format(parseISO(appointment.startTime), 'HH:mm')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {appointment.duration || 60} דק'
            </Typography>
          </Box>

          {/* Main Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Client Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Avatar sx={{ width: 40, height: 40, fontSize: 16 }}>
                {appointment.client?.firstName?.[0] || '?'}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  {appointment.client?.firstName} {appointment.client?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {appointment.client?.phone}
                </Typography>
              </Box>
            </Box>

            {/* Service & Location */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" color="text.primary">
                {appointment.serviceType || 'שירות כללי'}
              </Typography>
              <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {appointment.location === 'online' ? 'אונליין' : 
                 appointment.location === 'home' ? 'בית' : 'קליניקה'}
              </Typography>
            </Box>

            {/* Notes */}
            {appointment.notes && (
              <Typography variant="body2" color="text.secondary" sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                {appointment.notes}
              </Typography>
            )}
          </Box>

          {/* Status & Payment */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
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
                  borderColor: paymentConfig.color,
                  color: paymentConfig.color,
                  fontSize: '0.7rem',
                  height: 20
                }}
              />
            )}

            {/* Actions */}
            {showActions && (
              <Tooltip title="פעולות">
                <IconButton 
                  size="small" 
                  onClick={handleMenuOpen}
                >
                  <MoreVert sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Actions Menu */}
        {showActions && (
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => handleAction('view')}>
              <Visibility sx={{ mr: 1, fontSize: 20 }} />
              צפייה
            </MenuItem>
            <MenuItem onClick={() => handleAction('edit')}>
              <Edit sx={{ mr: 1, fontSize: 20 }} />
              עריכה
            </MenuItem>
            <MenuItem onClick={() => handleAction('cancel')} sx={{ color: 'error.main' }}>
              <Cancel sx={{ mr: 1, fontSize: 20 }} />
              ביטול
            </MenuItem>
          </Menu>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;
