import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  DollarSign,
  Calendar,
  MessageCircle,
  Star,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

const NotificationCenter = ({ 
  notifications = [], 
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  maxNotifications = 20,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // סוגי התראות
  const notificationTypes = {
    reminder: {
      icon: Clock,
      color: '#ffa502',
      bgColor: '#fef3c7'
    },
    payment: {
      icon: DollarSign,
      color: '#2ed573',
      bgColor: '#dcfce7'
    },
    appointment: {
      icon: Calendar,
      color: '#667eea',
      bgColor: '#e0e7ff'
    },
    message: {
      icon: MessageCircle,
      color: '#3742fa',
      bgColor: '#dbeafe'
    },
    achievement: {
      icon: Star,
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    alert: {
      icon: AlertCircle,
      color: '#ef4444',
      bgColor: '#fef2f2'
    },
    system: {
      icon: Settings,
      color: '#6b7280',
      bgColor: '#f3f4f6'
    }
  };

  // חישוב התראות לא נקראות
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  // פורמט זמן
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

  // סימון כנקרא
  const handleMarkAsRead = (notificationId) => {
    if (onMarkAsRead) {
      onMarkAsRead(notificationId);
    }
  };

  // סימון הכל כנקרא
  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  // סגירת התראה
  const handleDismiss = (notificationId) => {
    if (onDismiss) {
      onDismiss(notificationId);
    }
  };

  // רכיב התראה בודדת
  const NotificationItem = ({ notification, index }) => {
    const typeConfig = notificationTypes[notification.type] || notificationTypes.system;
    const IconComponent = typeConfig.icon;
    const isUnread = !notification.read;
    const isUrgent = notification.urgent || notification.priority === 'high';

    return (
      <motion.div
        className={`notification-item ${isUnread ? 'unread' : ''} ${isUrgent ? 'urgent' : ''}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ 
          duration: 0.3, 
          delay: index * 0.05 
        }}
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.2 }
        }}
      >
        <div className="notification-content">
          <div 
            className="notification-icon"
            style={{ 
              backgroundColor: typeConfig.bgColor,
              color: typeConfig.color
            }}
          >
            <IconComponent size={16} />
          </div>
          
          <div className="notification-body">
            <div className="notification-header">
              <div className="notification-title">{notification.title}</div>
              <div className="notification-time">
                {formatTimeAgo(notification.timestamp || notification.createdAt)}
              </div>
            </div>
            
            <div className="notification-message">
              {notification.message}
            </div>
            
            {notification.client && (
              <div className="notification-client">
                <span className="client-label">לקוח:</span>
                <span className="client-name">{notification.client}</span>
              </div>
            )}
            
            {notification.amount && (
              <div className="notification-amount">
                <span className="amount-label">סכום:</span>
                <span className="amount-value">₪{notification.amount.toLocaleString()}</span>
              </div>
            )}
            
            {notification.actions && notification.actions.length > 0 && (
              <div className="notification-actions">
                {notification.actions.map((action, actionIndex) => (
                  <button
                    key={actionIndex}
                    className="action-button"
                    onClick={() => action.onClick && action.onClick(notification)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="notification-controls">
          {isUnread && (
            <button
              className="control-button mark-read"
              onClick={() => handleMarkAsRead(notification.id)}
              title="סמן כנקרא"
            >
              <CheckCircle size={16} />
            </button>
          )}
          
          <button
            className="control-button dismiss"
            onClick={() => handleDismiss(notification.id)}
            title="סגור"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    );
  };

  // רשימת התראות
  const sortedNotifications = [...notifications]
    .sort((a, b) => {
      // התראות דחופות קודם
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      
      // לא נקראות קודם
      if (!a.read && b.read) return -1;
      if (a.read && !b.read) return 1;
      
      // לפי זמן
      return new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt);
    })
    .slice(0, maxNotifications);

  return (
    <div className={`notification-center ${className}`}>
      {/* כפתור התראות */}
      <motion.button
        className="notification-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span
            className="notification-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* פאנל התראות */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="notification-panel"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="panel-header">
              <div className="panel-title">
                <Bell size={18} />
                <span>התראות</span>
                {unreadCount > 0 && (
                  <span className="unread-count">({unreadCount})</span>
                )}
              </div>
              
              {unreadCount > 0 && (
                <button
                  className="mark-all-read"
                  onClick={handleMarkAllAsRead}
                >
                  סמן הכל כנקרא
                </button>
              )}
            </div>

            <div className="notifications-list">
              <AnimatePresence mode="popLayout">
                {sortedNotifications.length > 0 ? (
                  sortedNotifications.map((notification, index) => (
                    <NotificationItem
                      key={notification.id || index}
                      notification={notification}
                      index={index}
                    />
                  ))
                ) : (
                  <motion.div
                    className="empty-notifications"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Bell size={48} />
                    <div className="empty-title">אין התראות חדשות</div>
                    <div className="empty-description">
                      כל ההתראות החדשות יופיעו כאן
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .notification-center {
          position: relative;
          display: inline-block;
        }

        .notification-trigger {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          padding: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .notification-trigger:hover {
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          border: 2px solid white;
        }

        .notification-panel {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          width: 400px;
          max-width: 90vw;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid #e2e8f0;
          z-index: 1000;
          max-height: 500px;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8f9ff;
          border-radius: 16px 16px 0 0;
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }

        .unread-count {
          background: #667eea;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .mark-all-read {
          background: none;
          border: none;
          color: #667eea;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background-color 0.2s;
        }

        .mark-all-read:hover {
          background-color: #e0e7ff;
        }

        .notifications-list {
          flex: 1;
          overflow-y: auto;
          max-height: 400px;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          transition: all 0.2s ease;
          position: relative;
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-item.unread {
          background-color: #f8f9ff;
          border-right: 3px solid #667eea;
        }

        .notification-item.urgent {
          background-color: #fef2f2;
          border-right: 3px solid #ef4444;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }

        .notification-content {
          flex: 1;
          display: flex;
          gap: 12px;
        }

        .notification-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notification-body {
          flex: 1;
          min-width: 0;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }

        .notification-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.4;
        }

        .notification-time {
          font-size: 11px;
          color: #64748b;
          white-space: nowrap;
          margin-right: 8px;
        }

        .notification-message {
          font-size: 13px;
          color: #475569;
          line-height: 1.4;
          margin-bottom: 6px;
        }

        .notification-client,
        .notification-amount {
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

        .notification-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .action-button {
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .action-button:hover {
          background: #5a67d8;
        }

        .notification-controls {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-right: 8px;
        }

        .control-button {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .control-button:hover {
          background-color: #f1f5f9;
          color: #1e293b;
        }

        .control-button.mark-read:hover {
          color: #2ed573;
        }

        .control-button.dismiss:hover {
          color: #ef4444;
        }

        .empty-notifications {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          color: #64748b;
        }

        .empty-title {
          font-size: 16px;
          font-weight: 600;
          margin: 16px 0 8px;
          color: #475569;
        }

        .empty-description {
          font-size: 14px;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .notification-panel {
            width: 320px;
            right: -50px;
          }
          
          .notification-item {
            padding: 12px 16px;
          }
          
          .notification-content {
            gap: 8px;
          }
          
          .notification-icon {
            width: 28px;
            height: 28px;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationCenter;
