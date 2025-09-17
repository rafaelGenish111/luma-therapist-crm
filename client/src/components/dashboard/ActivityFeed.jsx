import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  DollarSign, 
  MessageCircle, 
  UserPlus, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { he } from 'date-fns/locale';

const ActivityFeed = ({ 
  activities = [], 
  title = 'פעילות אחרונה',
  maxItems = 10,
  autoRefresh = true,
  refreshInterval = 30000,
  className = ""
}) => {
  const [displayActivities, setDisplayActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // מפת אייקונים לפי סוג פעילות
  const activityIcons = {
    appointment: Calendar,
    payment: DollarSign,
    message: MessageCircle,
    client: UserPlus,
    reminder: Clock,
    completed: CheckCircle,
    cancelled: XCircle,
    alert: AlertCircle,
    notification: Bell
  };

  // צבעים לפי סוג פעילות
  const activityColors = {
    appointment: '#667eea',
    payment: '#2ed573',
    message: '#3742fa',
    client: '#ffa502',
    reminder: '#ff4757',
    completed: '#2ed573',
    cancelled: '#ff4757',
    alert: '#ffa502',
    notification: '#667eea'
  };

  // פורמט זמן עברי
  const formatTimeAgo = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true, 
        locale: he 
      });
    } catch (error) {
      return 'לפני זמן לא ידוע';
    }
  };

  // פורמט תאריך מלא
  const formatFullDate = (date) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: he });
    } catch (error) {
      return 'תאריך לא ידוע';
    }
  };

  // עדכון פעילויות
  const updateActivities = () => {
    if (activities.length === 0) return;
    
    setIsLoading(true);
    
    // סימולציה של עדכון נתונים
    setTimeout(() => {
      const sortedActivities = [...activities]
        .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt))
        .slice(0, maxItems);
      
      setDisplayActivities(sortedActivities);
      setIsLoading(false);
    }, 500);
  };

  // אפקט לעדכון אוטומטי
  useEffect(() => {
    updateActivities();
    
    if (autoRefresh) {
      const interval = setInterval(updateActivities, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [activities, autoRefresh, refreshInterval, maxItems]);

  // רכיב פעילות בודדת
  const ActivityItem = ({ activity, index }) => {
    const IconComponent = activityIcons[activity.type] || Bell;
    const color = activityColors[activity.type] || '#667eea';
    
    return (
      <motion.div
        className="activity-item"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ 
          duration: 0.3, 
          delay: index * 0.1 
        }}
        whileHover={{ 
          x: 4,
          transition: { duration: 0.2 }
        }}
      >
        <div className="activity-icon" style={{ backgroundColor: color }}>
          <IconComponent size={16} />
        </div>
        
        <div className="activity-content">
          <div className="activity-header">
            <div className="activity-title">{activity.title}</div>
            <div className="activity-time" title={formatFullDate(activity.timestamp || activity.createdAt)}>
              {formatTimeAgo(activity.timestamp || activity.createdAt)}
            </div>
          </div>
          
          <div className="activity-description">
            {activity.description}
          </div>
          
          {activity.client && (
            <div className="activity-client">
              <span className="client-label">לקוח:</span>
              <span className="client-name">{activity.client.name || activity.client}</span>
            </div>
          )}
          
          {activity.amount && (
            <div className="activity-amount">
              <span className="amount-label">סכום:</span>
              <span className="amount-value">₪{activity.amount.toLocaleString()}</span>
            </div>
          )}
          
          {activity.status && (
            <div className={`activity-status status-${activity.status}`}>
              {activity.status === 'completed' && 'הושלם'}
              {activity.status === 'pending' && 'ממתין'}
              {activity.status === 'cancelled' && 'בוטל'}
              {activity.status === 'urgent' && 'דחוף'}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // רכיב ריק
  const EmptyState = () => (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="empty-icon">
        <Bell size={48} />
      </div>
      <div className="empty-title">אין פעילות אחרונה</div>
      <div className="empty-description">
        הפעילויות החדשות יופיעו כאן
      </div>
    </motion.div>
  );

  return (
    <motion.div
      className={`activity-feed ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="activity-header">
        <div className="activity-title">
          <Bell size={20} />
          <span>{title}</span>
        </div>
        {isLoading && (
          <div className="loading-indicator">
            <div className="loading-spinner" />
          </div>
        )}
      </div>

      <div className="activity-list">
        <AnimatePresence mode="popLayout">
          {displayActivities.length > 0 ? (
            displayActivities.map((activity, index) => (
              <ActivityItem 
                key={activity.id || index} 
                activity={activity} 
                index={index}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .activity-feed {
          background: linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(102, 126, 234, 0.1);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .activity-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .loading-indicator {
          display: flex;
          align-items: center;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e2e8f0;
          border-top: 2px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .activity-list {
          flex: 1;
          overflow-y: auto;
          max-height: 400px;
        }

        .activity-item {
          display: flex;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
          transition: all 0.2s ease;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .activity-content {
          flex: 1;
          min-width: 0;
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }

        .activity-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.4;
        }

        .activity-time {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
          margin-right: 8px;
        }

        .activity-description {
          font-size: 13px;
          color: #475569;
          line-height: 1.4;
          margin-bottom: 6px;
        }

        .activity-client,
        .activity-amount {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          margin-bottom: 2px;
        }

        .client-label,
        .amount-label {
          color: #64748b;
        }

        .client-name,
        .amount-value {
          font-weight: 500;
          color: #1e293b;
        }

        .activity-status {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          margin-top: 4px;
        }

        .status-completed {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-pending {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-cancelled {
          background-color: #fef2f2;
          color: #dc2626;
        }

        .status-urgent {
          background-color: #fef2f2;
          color: #dc2626;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          color: #64748b;
        }

        .empty-icon {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #475569;
        }

        .empty-description {
          font-size: 14px;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .activity-feed {
            padding: 16px;
          }
          
          .activity-item {
            padding: 8px 0;
          }
          
          .activity-icon {
            width: 28px;
            height: 28px;
          }
          
          .activity-list {
            max-height: 300px;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default ActivityFeed;
