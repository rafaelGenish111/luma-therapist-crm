import React, { useState, useEffect } from 'react';

// 🚀🚀🚀 NEW VERSION LOADED! 🚀🚀🚀
console.log('🚀🚀🚀 NEW DASHBOARD PAGE LOADING! 🚀🚀🚀');
alert('🚀 NEW VERSION LOADED!');
console.log('🚀🚀🚀 NEW DASHBOARD PAGE LOADING! 🚀🚀🚀');
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Alert,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh,
  Settings,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Star,
  AlertCircle,
  CheckCircle
} from '@mui/icons-material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// קומפוננטים חדשים
console.log('📦 Loading new dashboard components...');
import KPICard from '../../../components/dashboard/KPICard';
import RevenueChart from '../../../components/dashboard/RevenueChart';
import ActivityFeed from '../../../components/dashboard/ActivityFeed';
import NotificationCenter from '../../../components/dashboard/NotificationCenter';
import QuickActions from '../../../components/dashboard/QuickActions';
console.log('📦 Dashboard components loaded successfully!');

// קומפוננטים קיימים
import ResponsiveTableCards from '../../../components/ResponsiveTableCards';
import ClientList from './components/ClientList';
import Footer from '../../../components/common/Footer';

// Hook חדש
import { useDashboardData } from '../../../hooks/useDashboardData';

// API services
import api, { clientsApi, articlesApi, galleryApi, therapistsApi } from '../../../services/api';
import healthDeclarationService from '../../../services/healthDeclarationService';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  console.log('🚀🚀🚀 DashboardPage loaded - NEW VERSION! 🚀🚀🚀');
  console.log('🚀🚀🚀 DashboardPage loaded - NEW VERSION! 🚀🚀🚀');
  console.log('🚀🚀🚀 DashboardPage loaded - NEW VERSION! 🚀🚀🚀');
  console.log('🚀🚀🚀 DashboardPage loaded - NEW VERSION! 🚀🚀🚀');
  console.log('🚀🚀🚀 DashboardPage loaded - NEW VERSION! 🚀🚀🚀');
  console.log('🚀🚀🚀 DashboardPage loaded - NEW VERSION! 🚀🚀🚀');
  console.log('🚀🚀🚀 DashboardPage loaded - NEW VERSION! 🚀🚀🚀');
  console.log('🚀🚀🚀 DashboardPage loaded - NEW VERSION! 🚀🚀🚀');
  console.log('🚀🚀🚀 DashboardPage loaded - NEW VERSION! 🚀🚀🚀');
  console.log('🚀🚀🚀 DashboardPage loaded - NEW VERSION! 🚀🚀🚀');

  const [declarations, setDeclarations] = useState([]);
  const [declarationsLoading, setDeclarationsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Hook חדש לנתוני לוח הבקרה
  console.log('📊 Loading dashboard data...');
  const { data, loading, error, lastUpdated, refreshData } = useDashboardData();
  console.log('📊 Dashboard data:', { data, loading, error });

  // עדכון זמן בזמן אמת
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // טעינת הצהרות בריאות
  useEffect(() => {
    const fetchDeclarations = async () => {
      try {
        setDeclarationsLoading(true);
        const response = await healthDeclarationService.getAll();
        setDeclarations(response.data.data || []);
      } catch (err) {
        console.error('Error loading declarations:', err);
      } finally {
        setDeclarationsLoading(false);
      }
    };

    fetchDeclarations();
  }, []);

  // סימולציה של מזג אוויר (בפועל תהיה API אמיתי)
  useEffect(() => {
    const weatherData = {
      temperature: 22,
      condition: 'שמשי',
      humidity: 65,
      windSpeed: 12
    };
    setWeather(weatherData);
  }, []);

  // פורמט תאריך עברי
  const formatHebrewDate = (date) => {
    return format(date, 'EEEE, d בMMMM yyyy', { locale: he });
  };

  // פורמט זמן
  const formatTime = (date) => {
    return format(date, 'HH:mm:ss');
  };

  // טיפול בפעולות מהירות
  const handleQuickAction = (action) => {
    console.log('Quick action:', action);
    // כאן תהיה ניווט לפעולה המתאימה
    switch (action.id) {
      case 'new-client':
        // navigate to new client page
        break;
      case 'new-appointment':
        // navigate to new appointment page
        break;
      case 'create-report':
        // navigate to reports page
        break;
      default:
        break;
    }
  };

  // טיפול בהתראות
  const handleNotificationAction = (notificationId) => {
    console.log('Mark as read:', notificationId);
    // כאן תהיה לוגיקה לסימון כנקרא
  };

  const handleMarkAllAsRead = () => {
    console.log('Mark all as read');
    // כאן תהיה לוגיקה לסימון הכל כנקרא
  };

  const handleDismissNotification = (notificationId) => {
    console.log('Dismiss notification:', notificationId);
    // כאן תהיה לוגיקה לסגירת התראה
  };

  // אנימציות
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  if (loading) {
    console.log('⏳ Dashboard is loading...');
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          טוען לוח בקרה חדש... 🚀
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={refreshData}>
            נסה שוב
          </Button>
        }>
          שגיאה בטעינת נתונים: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box>
        {/* הודעה בולטת */}
        <Alert severity="success" sx={{ mb: 2 }}>
          🚀 לוח בקרה חדש נטען! זהו הלוח המשודרג עם כל הפיצ'רים החדשים!
        </Alert>

        {/* כותרת ואזור אישי */}
        <motion.div variants={itemVariants}>
          <Box
            p={isMobile ? 2 : 4}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '0 0 24px 24px',
              marginBottom: 3
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h4" fontWeight="bold" mb={1}>
                  שלום {data?.profile?.firstName || 'מטפלת'}! 👋
                </Typography>
                <Typography variant="h6" opacity={0.9}>
                  {formatHebrewDate(currentTime)}
                </Typography>
                <Typography variant="body1" opacity={0.8}>
                  {formatTime(currentTime)}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={2}>
                {weather && (
                  <Box textAlign="center">
                    <Typography variant="h6">{weather.temperature}°C</Typography>
                    <Typography variant="body2" opacity={0.8}>{weather.condition}</Typography>
                  </Box>
                )}

                <NotificationCenter
                  notifications={data?.notifications || []}
                  onMarkAsRead={handleNotificationAction}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onDismiss={handleDismissNotification}
                />

                <Tooltip title="רענן נתונים">
                  <IconButton onClick={refreshData} sx={{ color: 'white' }}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {lastUpdated && (
              <Typography variant="caption" opacity={0.7}>
                עודכן לאחרונה: {format(lastUpdated, 'HH:mm:ss')}
              </Typography>
            )}
          </Box>
        </motion.div>

        <Box p={isMobile ? 2 : 4}>
          {/* כרטיסי KPI */}
          <motion.div variants={itemVariants}>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              סקירה כללית
            </Typography>

            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="לקוחות פעילים"
                  value={data?.clientMetrics?.active || 0}
                  change={`+${data?.clientMetrics?.newThisWeek || 0} השבוע`}
                  icon="users"
                  color="#667eea"
                  trend="up"
                  details={`מתוכם ${data?.clientMetrics?.newThisMonth || 0} לקוחות חדשים החודש`}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="הכנסות החודש"
                  value={data?.paymentMetrics?.monthlyRevenue || 0}
                  change={`₪${data?.paymentMetrics?.averagePayment?.toLocaleString() || 0} ממוצע לתשלום`}
                  icon="dollar"
                  color="#2ed573"
                  trend="up"
                  progress={data?.progressToTarget || 0}
                  target="₪15,000"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="פגישות השבוע"
                  value={data?.appointmentMetrics?.weekly || 0}
                  breakdown={{
                    הושלמו: data?.appointmentMetrics?.completed || 0,
                    קרובות: data?.appointmentMetrics?.upcoming || 0,
                    בוטלו: data?.appointmentMetrics?.cancelled || 0
                  }}
                  successRate={data?.appointmentMetrics?.completionRate || 0}
                  icon="calendar"
                  color="#ffa502"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="פגישות היום"
                  value={data?.appointmentMetrics?.todayAppointments || 0}
                  change={`${data?.appointmentMetrics?.averageDuration || 0} דקות ממוצע`}
                  icon="clock"
                  color="#8b5cf6"
                  trend="neutral"
                />
              </Grid>
            </Grid>
          </motion.div>

          {/* גרפים ופעילות */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} lg={8}>
              <motion.div variants={itemVariants}>
                <RevenueChart
                  type="line"
                  data={data?.revenueTrend || []}
                  title="מגמת הכנסות חודשיות"
                  height={300}
                />
              </motion.div>
            </Grid>

            <Grid item xs={12} lg={4}>
              <motion.div variants={itemVariants}>
                <ActivityFeed
                  activities={data?.recentActivity || []}
                  title="פעילות אחרונה"
                  maxItems={8}
                />
              </motion.div>
            </Grid>
          </Grid>

          {/* פעולות מהירות */}
          <motion.div variants={itemVariants}>
            <QuickActions
              onAction={handleQuickAction}
              className="mb-4"
            />
          </motion.div>

          {/* המלצות חכמות */}
          {data?.recommendations && data.recommendations.length > 0 && (
            <motion.div variants={itemVariants}>
              <Typography variant="h5" fontWeight="bold" mb={2}>
                המלצות חכמות
              </Typography>

              <Grid container spacing={2} mb={4}>
                {data.recommendations.map((rec, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Alert
                      severity={rec.type === 'warning' ? 'warning' : rec.type === 'info' ? 'info' : 'success'}
                      icon={rec.type === 'warning' ? <AlertCircle /> : rec.type === 'info' ? <Settings /> : <CheckCircle />}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        {rec.title}
                      </Typography>
                      <Typography variant="body2">
                        {rec.description}
                      </Typography>
                    </Alert>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          )}

          {/* לקוחות אחרונים */}
          <motion.div variants={itemVariants}>
            <Typography variant="h5" fontWeight="bold" mb={2}>
              לקוחות אחרונים
            </Typography>

            <ClientList clients={data?.clients?.slice(0, 5) || []} />
          </motion.div>

          {/* הצהרות בריאות */}
          <motion.div variants={itemVariants}>
            <Box mt={4}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
                flexDirection={isMobile ? "column" : "row"}
                gap={isMobile ? 1 : 0}
              >
                <Typography variant="h5" fontWeight="bold">
                  הצהרות בריאות אחרונות
                </Typography>
                <Button
                  component={Link}
                  to="/dashboard/health-declarations"
                  variant="outlined"
                  size="small"
                  sx={{
                    '@media (max-width: 480px)': {
                      width: '100%'
                    }
                  }}
                >
                  נהל הצהרות
                </Button>
              </Box>

              <Paper elevation={2} sx={{ p: 2, overflow: 'auto' }}>
                {declarationsLoading ? (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <ResponsiveTableCards
                    columns={[
                      { key: "fullName", label: "שם לקוחה" },
                      { key: "phone", label: "טלפון" },
                      { key: "status", label: "סטטוס" },
                      { key: "createdAt", label: "תאריך" }
                    ]}
                    rows={declarations.slice(0, 5).map(dec => ({
                      id: dec._id,
                      fullName: dec.fullName,
                      phone: dec.phone,
                      status: dec.status === 'pending' ? 'ממתינה' : dec.status === 'approved' ? 'מאושרת' : 'נדחתה',
                      createdAt: new Date(dec.createdAt).toLocaleDateString('he-IL')
                    }))}
                  />
                )}
              </Paper>
            </Box>
          </motion.div>
        </Box>

        <Footer variant="therapist" />
      </Box>
    </motion.div>
  );
};

export default DashboardPage;