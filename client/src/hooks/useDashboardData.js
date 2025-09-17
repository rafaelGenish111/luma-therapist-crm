import { useState, useEffect, useCallback } from 'react';
import { 
  getClients, 
  getAppointments, 
  getPayments, 
  getTherapistProfile 
} from '../services/api';

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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // טעינת נתונים במקביל
      const [clientsResponse, appointmentsResponse, paymentsResponse, profileResponse] = await Promise.all([
        getClients(),
        getAppointments(),
        getPayments(),
        getTherapistProfile()
      ]);

      const clients = clientsResponse.data || [];
      const appointments = appointmentsResponse.data || [];
      const payments = paymentsResponse.data || [];
      const profile = profileResponse.data || {};

      // חישוב מטריקות
      const clientMetrics = calculateClientMetrics(clients);
      const appointmentMetrics = calculateAppointmentMetrics(appointments);
      const paymentMetrics = calculatePaymentMetrics(payments);

      // חישוב נתונים לגרפים
      const revenueTrend = calculateRevenueTrend(payments);
      const appointmentDistribution = calculateAppointmentDistribution(appointments);

      // יצירת פעילות והתראות
      const recentActivity = generateRecentActivity(clients, appointments, payments);
      const notifications = generateNotifications(clients, appointments, payments);

      // חישוב יעדים והמלצות
      const monthlyTarget = 15000; // יעד חודשי
      const progressToTarget = (paymentMetrics.monthlyRevenue / monthlyTarget) * 100;

      const recommendations = [];
      
      if (appointmentMetrics.completionRate < 80) {
        recommendations.push({
          type: 'warning',
          title: 'שיעור השלמת פגישות נמוך',
          description: `שיעור השלמת הפגישות הוא ${appointmentMetrics.completionRate.toFixed(1)}%. נסה לשפר את התקשורת עם הלקוחות.`
        });
      }

      if (paymentMetrics.monthlyRevenue < monthlyTarget * 0.7) {
        recommendations.push({
          type: 'info',
          title: 'הכנסות חודשיות נמוכות',
          description: `ההכנסות החודשיות הן ₪${paymentMetrics.monthlyRevenue.toLocaleString()}. שקול לקדם שירותים נוספים.`
        });
      }

      if (clientMetrics.newThisWeek === 0) {
        recommendations.push({
          type: 'suggestion',
          title: 'אין לקוחות חדשים השבוע',
          description: 'שקול לקדם את השירותים שלך או ליצור קשר עם לקוחות פוטנציאליים.'
        });
      }

      const dashboardData = {
        // מטריקות בסיסיות
        clientMetrics,
        appointmentMetrics,
        paymentMetrics,
        
        // נתונים לגרפים
        revenueTrend,
        appointmentDistribution,
        
        // פעילות והתראות
        recentActivity,
        notifications,
        
        // יעדים והמלצות
        monthlyTarget,
        progressToTarget,
        recommendations,
        
        // נתונים גולמיים
        clients,
        appointments,
        payments,
        profile,
        
        // מטא-דאטה
        lastUpdated: new Date(),
        totalRecords: clients.length + appointments.length + payments.length
      };

      setData(dashboardData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  }, []);

  // טעינה ראשונית
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // רענון אוטומטי כל דקה
  useEffect(() => {
    const interval = setInterval(refreshData, 60000);
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
