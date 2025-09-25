import React from 'react';
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
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const ActivityFeed = ({
  activities = [],
  title = 'פעילות אחרונה',
  maxItems = 5,
  loading = false
}) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'client':
        return '👤';
      case 'appointment':
        return '📅';
      case 'payment':
        return '💰';
      case 'message':
        return '💬';
      default:
        return '📋';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'לא ידוע';
    try {
      const date = new Date(timestamp);
      return format(date, 'HH:mm', { locale: he });
    } catch {
      return 'לא ידוע';
    }
  };

  // אם טוען, נציג אינדיקטור טעינה
  if (loading) {
    return (
      <Paper sx={{ p: 3, height: 400 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>טוען פעילות...</Typography>
        </Box>
      </Paper>
    );
  }

  // אם אין פעילויות, נציג הודעה
  if (!activities || activities.length === 0) {
    return (
      <Paper sx={{ p: 3, height: 400 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
          <Typography color="text.secondary">
            אין פעילות להצגה
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <List sx={{ maxHeight: 320, overflow: 'auto' }}>
        {activities.slice(0, maxItems).map((activity, index) => (
          <ListItem key={activity.id || index} sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Avatar sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                fontSize: '16px'
              }}>
                {getActivityIcon(activity.type)}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" fontWeight={500}>
                    {activity.title || 'פעילות'}
                  </Typography>
                  {activity.status && (
                    <Chip
                      label={activity.status}
                      size="small"
                      color={getStatusColor(activity.status)}
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {activity.description || 'אין תיאור זמין'}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    {formatTime(activity.timestamp)}
                    {activity.client?.name && ` • ${activity.client.name}`}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default ActivityFeed;