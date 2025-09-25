import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  Button,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const actions = [
    {
      title: 'לקוח חדש',
      icon: '👤',
      color: '#667eea',
      onClick: () => navigate('/dashboard/clients/new'),
      description: 'הוסף לקוח חדש'
    },
    {
      title: 'פגישה',
      icon: '📅',
      color: '#ffa502',
      onClick: () => navigate('/dashboard/appointments/new'),
      description: 'קבע פגישה חדשה'
    },
    {
      title: 'דוח',
      icon: '📊',
      color: '#2ed573',
      onClick: () => navigate('/dashboard/reports'),
      description: 'צפה בדוחות'
    },
    {
      title: 'הודעה לכולם',
      icon: '💬',
      color: '#ff4757',
      onClick: () => navigate('/dashboard/communications/broadcast'),
      description: 'שלח הודעה לכל הלקוחות'
    }
  ];

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        פעולות מהירות
      </Typography>
      <Grid container spacing={2}>
        {actions.map((action, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Button
              fullWidth
              variant="outlined"
              onClick={action.onClick}
              sx={{
                p: 2,
                height: isMobile ? 80 : 100,
                flexDirection: 'column',
                gap: 1,
                borderColor: action.color,
                color: action.color,
                '&:hover': {
                  backgroundColor: `${action.color}15`,
                  borderColor: action.color,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${action.color}30`
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Box fontSize={isMobile ? '1.5rem' : '2rem'}>
                {action.icon}
              </Box>
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
              >
                {action.title}
              </Typography>
              {!isMobile && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.7rem' }}
                >
                  {action.description}
                </Typography>
              )}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default QuickActions;