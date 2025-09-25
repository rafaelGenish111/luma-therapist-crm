import React, { useState } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Box,
  Avatar,
  IconButton,
  Collapse,
  Button
} from '@mui/material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const NotificationCenter = ({ notifications = [], title = 'התראות חכמות' }) => {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reminder':
        return '⏰';
      case 'payment':
        return '💰';
      case 'milestone':
        return '🎉';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📋';
    }
  };

  const getNotificationColor = (type, urgent) => {
    if (urgent) return '#ff4757';
    switch (type) {
      case 'reminder':
        return '#ffa502';
      case 'payment':
        return '#2ed573';
      case 'milestone':
        return '#667eea';
      case 'warning':
        return '#ff4757';
      case 'info':
        return '#3742fa';
      default:
        return '#6c757d';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'לא ידוע';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));

      if (diffInMinutes < 1) return 'עכשיו';
      if (diffInMinutes < 60) return `לפני ${diffInMinutes} דקות`;
      if (diffInMinutes < 1440) return `לפני ${Math.floor(diffInMinutes / 60)} שעות`;
      return format(date, 'dd/MM HH:mm', { locale: he });
    } catch {
      return 'לא ידוע';
    }
  };

  const handleDismiss = (notificationId) => {
    setDismissed(prev => new Set([...prev, notificationId]));
  };

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));
  const urgentCount = visibleNotifications.filter(n => n.urgent).length;

  if (visibleNotifications.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box display="flex" alignItems="center" justifyContent="center" height={100}>
          <Typography color="text.secondary">
            אין התראות חדשות
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">
          {title}
          {urgentCount > 0 && (
            <Chip
              label={urgentCount}
              size="small"
              color="error"
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
        <IconButton
          onClick={() => setExpanded(!expanded)}
          size="small"
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded || visibleNotifications.length <= 3}>
        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {visibleNotifications.slice(0, expanded ? undefined : 3).map((notification, index) => (
            <ListItem
              key={notification.id || index}
              sx={{
                px: 0,
                bgcolor: notification.urgent ? 'error.light' : 'transparent',
                borderRadius: 1,
                mb: 1
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Avatar sx={{
                  width: 32,
                  height: 32,
                  bgcolor: getNotificationColor(notification.type, notification.urgent),
                  fontSize: '16px'
                }}>
                  {getNotificationIcon(notification.type)}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography
                      variant="body2"
                      fontWeight={notification.urgent ? 700 : 500}
                    >
                      {notification.title}
                    </Typography>
                    {notification.urgent && (
                      <Chip
                        label="דחוף"
                        size="small"
                        color="error"
                        sx={{ fontSize: '0.6rem', height: 18 }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {formatTime(notification.timestamp)}
                    </Typography>
                    {notification.actions && notification.actions.length > 0 && (
                      <Box mt={1} display="flex" gap={1}>
                        {notification.actions.map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            size="small"
                            variant="outlined"
                            onClick={action.onClick}
                            sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </Box>
                    )}
                  </Box>
                }
              />
              <IconButton
                size="small"
                onClick={() => handleDismiss(notification.id)}
                sx={{ ml: 1 }}
              >
                ×
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Collapse>

      {visibleNotifications.length > 3 && !expanded && (
        <Button
          fullWidth
          onClick={() => setExpanded(true)}
          sx={{ mt: 1 }}
        >
          הצג עוד {visibleNotifications.length - 3} התראות
        </Button>
      )}
    </Paper>
  );
};

export default NotificationCenter;