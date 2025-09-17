import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  Calendar, 
  FileText, 
  MessageCircle, 
  Settings, 
  BarChart3,
  CreditCard,
  Bell,
  Download,
  Upload,
  Plus,
  Search
} from 'lucide-react';

const QuickActions = ({ 
  onAction,
  className = ""
}) => {
  const [hoveredAction, setHoveredAction] = useState(null);

  // רשימת פעולות מהירות
  const actions = [
    {
      id: 'new-client',
      title: 'לקוח חדש',
      description: 'הוסף לקוח חדש למערכת',
      icon: UserPlus,
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shortcut: 'Ctrl+N',
      category: 'clients'
    },
    {
      id: 'new-appointment',
      title: 'פגישה חדשה',
      description: 'קבע פגישה עם לקוח',
      icon: Calendar,
      color: '#2ed573',
      gradient: 'linear-gradient(135deg, #2ed573 0%, #17c0eb 100%)',
      shortcut: 'Ctrl+A',
      category: 'appointments'
    },
    {
      id: 'create-report',
      title: 'דוח חדש',
      description: 'צור דוח מפורט',
      icon: FileText,
      color: '#ffa502',
      gradient: 'linear-gradient(135deg, #ffa502 0%, #ff6348 100%)',
      shortcut: 'Ctrl+R',
      category: 'reports'
    },
    {
      id: 'send-message',
      title: 'שלח הודעה',
      description: 'שלח הודעה ללקוחות',
      icon: MessageCircle,
      color: '#3742fa',
      gradient: 'linear-gradient(135deg, #3742fa 0%, #3b82f6 100%)',
      shortcut: 'Ctrl+M',
      category: 'communication'
    },
    {
      id: 'process-payment',
      title: 'עיבוד תשלום',
      description: 'עבד תשלום מלקוח',
      icon: CreditCard,
      color: '#2ed573',
      gradient: 'linear-gradient(135deg, #2ed573 0%, #17c0eb 100%)',
      shortcut: 'Ctrl+P',
      category: 'payments'
    },
    {
      id: 'view-analytics',
      title: 'אנליטיקס',
      description: 'צפה בנתונים וסטטיסטיקות',
      icon: BarChart3,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
      shortcut: 'Ctrl+D',
      category: 'analytics'
    },
    {
      id: 'settings',
      title: 'הגדרות',
      description: 'נהל הגדרות המערכת',
      icon: Settings,
      color: '#6b7280',
      gradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
      shortcut: 'Ctrl+,',
      category: 'system'
    },
    {
      id: 'notifications',
      title: 'התראות',
      description: 'נהל התראות והתזכורות',
      icon: Bell,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      shortcut: 'Ctrl+Alt+N',
      category: 'notifications'
    },
    {
      id: 'export-data',
      title: 'ייצא נתונים',
      description: 'ייצא נתונים לקובץ',
      icon: Download,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shortcut: 'Ctrl+E',
      category: 'data'
    },
    {
      id: 'import-data',
      title: 'ייבא נתונים',
      description: 'ייבא נתונים מקובץ',
      icon: Upload,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      shortcut: 'Ctrl+I',
      category: 'data'
    },
    {
      id: 'search',
      title: 'חיפוש מתקדם',
      description: 'חפש במערכת',
      icon: Search,
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      shortcut: 'Ctrl+F',
      category: 'search'
    },
    {
      id: 'quick-add',
      title: 'הוספה מהירה',
      description: 'הוסף תוכן במהירות',
      icon: Plus,
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      shortcut: 'Ctrl+Shift+A',
      category: 'general'
    }
  ];

  // קבוצות פעולות
  const actionGroups = {
    clients: actions.filter(a => a.category === 'clients'),
    appointments: actions.filter(a => a.category === 'appointments'),
    reports: actions.filter(a => a.category === 'reports'),
    communication: actions.filter(a => a.category === 'communication'),
    payments: actions.filter(a => a.category === 'payments'),
    analytics: actions.filter(a => a.category === 'analytics'),
    system: actions.filter(a => a.category === 'system'),
    notifications: actions.filter(a => a.category === 'notifications'),
    data: actions.filter(a => a.category === 'data'),
    search: actions.filter(a => a.category === 'search'),
    general: actions.filter(a => a.category === 'general')
  };

  // טיפול בלחיצה על פעולה
  const handleActionClick = (action) => {
    if (onAction) {
      onAction(action);
    }
  };

  // טיפול במקשי קיצור
  const handleKeyPress = (event) => {
    const action = actions.find(a => a.shortcut === event.ctrlKey + event.key);
    if (action) {
      event.preventDefault();
      handleActionClick(action);
    }
  };

  // הוספת מאזין למקשי קיצור
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // רכיב פעולה בודדת
  const ActionItem = ({ action, index }) => {
    const IconComponent = action.icon;
    const isHovered = hoveredAction === action.id;

    return (
      <motion.button
        className="action-item"
        onClick={() => handleActionClick(action)}
        onMouseEnter={() => setHoveredAction(action.id)}
        onMouseLeave={() => setHoveredAction(null)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.3, 
          delay: index * 0.05 
        }}
        whileHover={{ 
          scale: 1.05,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.95 }}
        style={{
          '--action-color': action.color,
          '--action-gradient': action.gradient
        }}
      >
        <div className="action-icon">
          <IconComponent size={24} />
        </div>
        
        <div className="action-content">
          <div className="action-title">{action.title}</div>
          <div className="action-description">{action.description}</div>
          <div className="action-shortcut">{action.shortcut}</div>
        </div>

        {isHovered && (
          <motion.div
            className="action-hover-effect"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.button>
    );
  };

  return (
    <motion.div
      className={`quick-actions ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="actions-header">
        <h3 className="actions-title">פעולות מהירות</h3>
        <p className="actions-subtitle">
          גש במהירות לפונקציות הנפוצות ביותר
        </p>
      </div>

      <div className="actions-grid">
        {actions.map((action, index) => (
          <ActionItem
            key={action.id}
            action={action}
            index={index}
          />
        ))}
      </div>

      <div className="actions-footer">
        <div className="shortcuts-help">
          <span className="help-text">
            💡 השתמש במקשי הקיצור לפעולות מהירות יותר
          </span>
        </div>
      </div>

      <style jsx>{`
        .quick-actions {
          background: linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(102, 126, 234, 0.1);
        }

        .actions-header {
          margin-bottom: 24px;
          text-align: center;
        }

        .actions-title {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .actions-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .action-item {
          position: relative;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 16px;
          text-align: right;
          overflow: hidden;
        }

        .action-item:hover {
          border-color: var(--action-color);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .action-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--action-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .action-item:hover .action-icon {
          transform: scale(1.1);
        }

        .action-content {
          flex: 1;
          min-width: 0;
        }

        .action-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .action-description {
          font-size: 13px;
          color: #64748b;
          line-height: 1.4;
          margin-bottom: 6px;
        }

        .action-shortcut {
          font-size: 11px;
          color: #9ca3af;
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
          font-family: 'Courier New', monospace;
        }

        .action-hover-effect {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--action-gradient);
          opacity: 0.05;
          border-radius: 12px;
          pointer-events: none;
        }

        .actions-footer {
          text-align: center;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .shortcuts-help {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .help-text {
          font-size: 12px;
          color: #64748b;
          background: #f8f9ff;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #e0e7ff;
        }

        @media (max-width: 768px) {
          .quick-actions {
            padding: 16px;
          }
          
          .actions-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .action-item {
            padding: 16px;
          }
          
          .action-icon {
            width: 40px;
            height: 40px;
          }
          
          .action-title {
            font-size: 14px;
          }
          
          .action-description {
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .action-item {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }
          
          .action-content {
            width: 100%;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default QuickActions;
