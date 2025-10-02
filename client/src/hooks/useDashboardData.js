console.log('🚀 useDashboardData.js file loaded!');

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// פונקציות עזר לחישובי תאריכים
const isThisWeek = (date) => {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
  return date >= startOfWeek && date <= endOfWeek;
};

const isThisMonth = (date) => {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

const isThisYear = (date) => {
  const now = new Date();
  return date.getFullYear() === now.getFullYear();
};

const isToday = (date) => {
  const now = new Date();
  return date.toDateString() === now.toDateString();
};

const isPast = (date) => {
  return new Date(date) < new Date();
};

const isFuture = (date) => {
  return new Date(date) > new Date();
};

// פונקציות חישוב סטטיסטיקות
const calculateClientMetrics = (clients) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    newThisWeek: clients.filter(c =>
      new Date(c.createdAt) >= oneWeekAgo
    ).length,
    newThisMonth: clients.filter(c =>
      new Date(c.createdAt) >= oneMonthAgo
    ).length,
    averageAge: clients.length > 0 ?
      clients.reduce((sum, c) => {
        const age = new Date().getFullYear() - new Date(c.birthDate || c.createdAt).getFullYear();
        return sum + age;
      }, 0) / clients.length : 0
  };
};

const calculateAppointmentMetrics = (appointments) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const weeklyAppointments = appointments.filter(a =>
    new Date(a.date) >= oneWeekAgo
  );

  const monthlyAppointments = appointments.filter(a =>
    new Date(a.date) >= oneMonthAgo
  );

  const completed = appointments.filter(a => a.status === 'completed').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;
  const upcoming = appointments.filter(a =>
    a.status === 'scheduled' && new Date(a.date) > now
  ).length;

  const completionRate = appointments.length > 0 ?
    (completed / appointments.length) * 100 : 0;

  const averageDuration = appointments.length > 0 ?
    appointments.reduce((sum, a) => sum + (a.duration || 60), 0) / appointments.length : 0;

  return {
    total: appointments.length,
    weekly: weeklyAppointments.length,
    monthly: monthlyAppointments.length,
    completed,
    cancelled,
    upcoming,
    completionRate,
    averageDuration,
    todayAppointments: appointments.filter(a =>
      isToday(new Date(a.date))
    ).length
  };
};

const calculatePaymentMetrics = (payments) => {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const monthlyPayments = payments.filter(p =>
    p.status === 'paid' && new Date(p.createdAt) >= oneMonthAgo
  );

  const yearlyPayments = payments.filter(p =>
    p.status === 'paid' && new Date(p.createdAt) >= oneYearAgo
  );

  const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const yearlyRevenue = yearlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const averagePayment = payments.length > 0 ?
    payments.reduce((sum, p) => sum + (p.amount || 0), 0) / payments.length : 0;

  const paymentMethods = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + 1;
    return acc;
  }, {});

  return {
    total: payments.length,
    monthlyRevenue,
    yearlyRevenue,
    averagePayment,
    paymentMethods,
    monthlyCount: monthlyPayments.length,
    yearlyCount: yearlyPayments.length
  };
};

const calculateRevenueTrend = (payments, months = 6) => {
  const now = new Date();
  const trendData = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const monthPayments = payments.filter(p =>
      p.status === 'paid' &&
      new Date(p.createdAt) >= monthStart &&
      new Date(p.createdAt) <= monthEnd
    );

    const revenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    trendData.push({
      month: monthStart.toLocaleDateString('he-IL', { month: 'short' }),
      value: revenue,
      count: monthPayments.length
    });
  }

  return trendData;
};

const calculateAppointmentDistribution = (appointments) => {
  const distribution = appointments.reduce((acc, appointment) => {
    const type = appointment.type || 'כללי';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(distribution).map(([type, count]) => ({
    name: type,
    value: count,
    percentage: appointments.length > 0 ? (count / appointments.length) * 100 : 0
  }));
};

const generateRecentActivity = (clients, appointments, payments) => {
  const activities = [];

  // פעילויות לקוחות
  clients.slice(0, 5).forEach(client => {
    activities.push({
      id: `client-${client._id}`,
      type: 'client',
      title: 'לקוח חדש',
      description: `${client.firstName} ${client.lastName} נרשם למערכת`,
      timestamp: client.createdAt,
      client: client
    });
  });

  // פעילויות פגישות
  appointments.slice(0, 10).forEach(appointment => {
    const client = clients.find(c => c._id === appointment.clientId);
    if (client) {
      activities.push({
        id: `appointment-${appointment._id}`,
        type: 'appointment',
        title: 'פגישה חדשה',
        description: `פגישה עם ${client.firstName} ${client.lastName}`,
        timestamp: appointment.createdAt,
        client: client,
        status: appointment.status
      });
    }
  });

  // פעילויות תשלומים
  payments.slice(0, 10).forEach(payment => {
    const client = clients.find(c => c._id === payment.clientId);
    if (client) {
      activities.push({
        id: `payment-${payment._id}`,
        type: 'payment',
        title: 'תשלום חדש',
        description: `תשלום של ₪${payment.amount.toLocaleString()} מ${client.firstName} ${client.lastName}`,
        timestamp: payment.createdAt,
        client: client,
        amount: payment.amount,
        status: payment.status
      });
    }
  });

  return activities.sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  ).slice(0, 20);
};

const generateNotifications = (clients, appointments, payments) => {
  const notifications = [];
  const now = new Date();

  // התראות פגישות קרובות
  const upcomingAppointments = appointments.filter(a =>
    a.status === 'scheduled' &&
    new Date(a.date) > now &&
    new Date(a.date) <= new Date(now.getTime() + 24 * 60 * 60 * 1000)
  );

  upcomingAppointments.forEach(appointment => {
    const client = clients.find(c => c._id === appointment.clientId);
    if (client) {
      notifications.push({
        id: `appointment-reminder-${appointment._id}`,
        type: 'reminder',
        title: 'פגישה קרובה',
        message: `פגישה עם ${client.firstName} ${client.lastName} ב${new Date(appointment.date).toLocaleDateString('he-IL')}`,
        timestamp: appointment.createdAt,
        client: client,
        urgent: true,
        actions: [
          { label: 'התחל פגישה', onClick: () => console.log('Start appointment') },
          { label: 'דחה', onClick: () => console.log('Reschedule') }
        ]
      });
    }
  });

  // התראות תשלומים ממתינים
  const pendingPayments = payments.filter(p => p.status === 'pending');
  pendingPayments.forEach(payment => {
    const client = clients.find(c => c._id === payment.clientId);
    if (client) {
      notifications.push({
        id: `payment-pending-${payment._id}`,
        type: 'payment',
        title: 'תשלום ממתין',
        message: `תשלום של ₪${payment.amount.toLocaleString()} מ${client.firstName} ${client.lastName}`,
        timestamp: payment.createdAt,
        client: client,
        amount: payment.amount,
        actions: [
          { label: 'שלח תזכורת', onClick: () => console.log('Send reminder') },
          { label: 'צור חשבונית', onClick: () => console.log('Create invoice') }
        ]
      });
    }
  });

  return notifications.sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  );
};

// Hook ראשי
export const useDashboardData = () => {
  console.log('🎯 useDashboardData hook called!');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Starting dashboard data refresh...');
      console.log('🔄 Current state:', { data, loading, error });

      // ננסה לטעון מה-endpoint החדש, אם לא עובד נטען ישירות
      let dashboardData = null;

      try {
        console.log('📊 Fetching dashboard stats...');
        console.log('📊 Making request to: /dashboard/stats');

        // הוספת timestamp למניעת cache
        const timestamp = Date.now();
        const dashboardResponse = await api.get(`/dashboard/stats?t=${timestamp}`);

        console.log('📊 Dashboard response raw:', dashboardResponse);
        console.log('📊 Dashboard response data:', dashboardResponse.data);
        console.log('📊 Dashboard response success:', dashboardResponse.data.success);

        dashboardData = dashboardResponse.data.data;
        console.log('✅ Dashboard data loaded successfully:', dashboardData);
        console.log('💰 PaymentMetrics from server:', dashboardData.paymentMetrics);

        if (!dashboardData) {
          throw new Error('Dashboard data is null or undefined');
        }
      } catch (dashboardError) {
        console.log('⚠️ Dashboard endpoint failed, loading data directly...', dashboardError.message);
        console.log('⚠️ Dashboard error details:', dashboardError);

        // טעינה ישירה של נתונים
        console.log('📊 Loading clients...');
        const clientsResponse = await api.get('/clients').catch(err => {
          console.error('❌ Clients API error:', err);
          return { data: [] };
        });

        console.log('📊 Loading appointments...');
        const appointmentsResponse = await api.get('/appointments').catch(err => {
          console.error('❌ Appointments API error:', err);
          return { data: [] };
        });

        console.log('📊 Loading payments...');
        const paymentsResponse = await api.get('/enhanced-payments/stats').catch(err => {
          console.error('❌ Payments API error:', err);
          return { data: [] };
        });

        const clients = clientsResponse?.data?.data || [];
        const appointments = appointmentsResponse?.data?.data || [];
        const payments = paymentsResponse?.data?.data || [];

        console.log('📊 Direct data loaded:', { clients: clients.length, appointments: appointments.length, payments: payments.length });

        // אם אין נתונים (משתמש לא מחובר), נשתמש בנתונים לדוגמה
        if (clients.length === 0 && appointments.length === 0 && payments.length === 0) {
          console.log('⚠️ No data found, using demo data...');

          // נתונים לדוגמה
          const demoClients = [
            {
              _id: 'demo-client-1',
              firstName: 'דני',
              lastName: 'אברהם',
              status: 'active',
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // שבוע שעבר
            },
            {
              _id: 'demo-client-2',
              firstName: 'שרה',
              lastName: 'כהן',
              status: 'active',
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // לפני 3 ימים
            }
          ];

          const demoAppointments = [
            {
              _id: 'demo-appointment-1',
              client: 'demo-client-1',
              date: new Date(Date.now() + 24 * 60 * 60 * 1000), // מחר
              status: 'scheduled',
              type: 'טיפול רגיל',
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
              _id: 'demo-appointment-2',
              client: 'demo-client-2',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // לפני יומיים
              status: 'completed',
              type: 'טיפול רגיל',
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            }
          ];

          const demoPayments = [
            {
              _id: 'demo-payment-1',
              clientId: 'demo-client-1',
              amount: 1900,
              status: 'paid',
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
              _id: 'demo-payment-2',
              clientId: 'demo-client-2',
              amount: 1200,
              status: 'paid',
              createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            }
          ];

          // נשתמש בנתונים לדוגמה
          clients.push(...demoClients);
          appointments.push(...demoAppointments);
          payments.push(...demoPayments);
        }

        // חישוב מטריקות ישירות
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const clientMetrics = {
          total: clients?.length || 0,
          active: clients?.filter(c => c.status === 'active').length || 0,
          newThisWeek: clients?.filter(c => new Date(c.createdAt) >= oneWeekAgo).length || 0,
          newThisMonth: clients?.filter(c => new Date(c.createdAt) >= oneMonthAgo).length || 0
        };

        const appointmentMetrics = {
          total: appointments?.length || 0,
          weekly: appointments?.filter(a => new Date(a.date) >= oneWeekAgo).length || 0,
          monthly: appointments?.filter(a => new Date(a.date) >= oneMonthAgo).length || 0,
          completed: appointments?.filter(a => a.status === 'completed').length || 0,
          cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
          upcoming: appointments?.filter(a => a.status === 'scheduled' && new Date(a.date) > now).length || 0,
          completionRate: appointments?.length > 0 ? (appointments.filter(a => a.status === 'completed').length / appointments.length) * 100 : 0
        };

        const monthlyPayments = payments?.filter(p =>
          p.status === 'paid' && new Date(p.createdAt) >= oneMonthAgo
        ) || [];

        const paymentMetrics = {
          total: payments?.length || 0,
          monthlyRevenue: monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
          monthlyCount: monthlyPayments.length,
          averagePayment: payments?.length > 0 ? payments.reduce((sum, p) => sum + (p.amount || 0), 0) / payments.length : 0
        };

        // חישוב מגמת הכנסות
        const revenueTrend = [];
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

          const monthPayments = payments.filter(p =>
            p.status === 'paid' &&
            new Date(p.createdAt) >= monthStart &&
            new Date(p.createdAt) <= monthEnd
          );

          const revenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

          revenueTrend.push({
            month: monthStart.toLocaleDateString('he-IL', { month: 'short' }),
            value: revenue,
            count: monthPayments.length
          });
        }

        // יצירת פעילות אחרונה
        const recentActivity = [];

        clients.slice(0, 5).forEach(client => {
          recentActivity.push({
            id: `client-${client._id}`,
            type: 'client',
            title: 'לקוח חדש',
            description: `${client.firstName} ${client.lastName} נרשם למערכת`,
            timestamp: client.createdAt,
            client: { name: `${client.firstName} ${client.lastName}` },
            status: 'completed'
          });
        });

        appointments.slice(0, 10).forEach(appointment => {
          const client = clients.find(c => c._id.toString() === appointment.client.toString());
          if (client) {
            recentActivity.push({
              id: `appointment-${appointment._id}`,
              type: 'appointment',
              title: 'פגישה חדשה',
              description: `פגישה עם ${client.firstName} ${client.lastName}`,
              timestamp: appointment.createdAt,
              client: { name: `${client.firstName} ${client.lastName}` },
              status: appointment.status
            });
          }
        });

        payments.slice(0, 10).forEach(payment => {
          const client = clients.find(c => c._id.toString() === payment.clientId.toString());
          if (client) {
            recentActivity.push({
              id: `payment-${payment._id}`,
              type: 'payment',
              title: 'תשלום חדש',
              description: `תשלום של ₪${(payment.amount || 0).toLocaleString()} מ${client.firstName} ${client.lastName}`,
              timestamp: payment.createdAt,
              client: { name: `${client.firstName} ${client.lastName}` },
              amount: payment.amount,
              status: payment.status
            });
          }
        });

        recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        dashboardData = {
          clientMetrics,
          appointmentMetrics,
          paymentMetrics,
          revenueTrend,
          recentActivity: recentActivity.slice(0, 20),
          notifications: [],
          monthlyTarget: 15000,
          progressToTarget: (paymentMetrics.monthlyRevenue / 15000) * 100,
          recommendations: [],
          totalRecords: clients.length + appointments.length + payments.length
        };
      }

      // טעינת פרופיל המטפלת בנפרד
      console.log('👤 Fetching therapist profile...');
      let profile = {};
      try {
        const profileResponse = await api.get('/therapists/profile');
        console.log('👤 Profile response raw:', profileResponse);
        console.log('👤 Profile response data:', profileResponse.data);

        if (profileResponse.data && profileResponse.data.data) {
          profile = profileResponse.data.data;
        } else if (profileResponse.data) {
          profile = profileResponse.data;
        }
        console.log('👤 Profile extracted:', profile);
      } catch (profileError) {
        console.error('⚠️ Failed to load profile:', profileError);
        profile = { firstName: 'מטפלת', lastName: '' };
      }

      // הוספת פרופיל לנתוני הלוח
      const finalData = {
        ...dashboardData,
        profile
      };

      console.log('✅ Final dashboard data:', finalData);
      console.log('✅ Client metrics:', finalData.clientMetrics);
      console.log('✅ Payment metrics:', finalData.paymentMetrics);
      console.log('✅ Appointment metrics:', finalData.appointmentMetrics);
      setData(finalData);
      setLastUpdated(new Date());
      console.log('✅ Data set successfully, loading set to false');
    } catch (err) {
      console.error('❌ Error loading dashboard data:', err);
      console.error('❌ Error details:', err.response?.data || err.message);
      setError(err.message || 'שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
      console.log('🔄 Loading set to false');
    }
  }, []);

  // טעינה ראשונית
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // רענון אוטומטי כל 5 דקות (לא כל דקה כדי למנוע טעינה מתמשכת)
  useEffect(() => {
    const interval = setInterval(refreshData, 5 * 60 * 1000); // 5 דקות
    return () => clearInterval(interval);
  }, [refreshData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refreshData
  };
};

export default useDashboardData;
