import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign, 
  Clock,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const iconMap = {
  users: Users,
  calendar: Calendar,
  dollar: DollarSign,
  clock: Clock,
  star: Star,
  alert: AlertCircle,
  check: CheckCircle,
  x: XCircle
};

const KPICard = ({ 
  title, 
  value, 
  change, 
  icon, 
  color = "#667eea", 
  trend = "neutral",
  progress,
  target,
  details,
  breakdown,
  successRate,
  className = ""
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const IconComponent = iconMap[icon] || Users;

  // אנימציית מספרים עולים
  useEffect(() => {
    if (isVisible && typeof value === 'number') {
      const duration = 1000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isVisible, value]);

  // פורמט מספרים
  const formatValue = (val) => {
    if (typeof val !== 'number') return val;
    
    if (title.includes('₪') || title.includes('הכנסות')) {
      return `₪${val.toLocaleString()}`;
    }
    
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    
    return val.toString();
  };

  // פורמט שינוי
  const formatChange = (change) => {
    if (!change) return null;
    
    const isPositive = change.includes('+') || change.includes('עלייה');
    const isNegative = change.includes('-') || change.includes('ירידה');
    
    return {
      text: change,
      isPositive,
      isNegative
    };
  };

  const changeData = formatChange(change);

  return (
    <motion.div
      className={`kpi-card ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        y: -8, 
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        transition: { duration: 0.3 }
      }}
      onViewportEnter={() => setIsVisible(true)}
      style={{
        '--card-color': color,
        '--gradient': `linear-gradient(135deg, ${color} 0%, ${color}88 100%)`
      }}
    >
      <div className="kpi-card-header">
        <div className="kpi-icon" style={{ backgroundColor: color }}>
          <IconComponent size={24} />
        </div>
        <div className="kpi-title">{title}</div>
      </div>

      <div className="kpi-content">
        <div className="kpi-value">
          {formatValue(displayValue)}
        </div>

        {changeData && (
          <div className={`kpi-change ${changeData.isPositive ? 'positive' : changeData.isNegative ? 'negative' : 'neutral'}`}>
            {changeData.isPositive && <TrendingUp size={16} />}
            {changeData.isNegative && <TrendingDown size={16} />}
            <span>{changeData.text}</span>
          </div>
        )}

        {progress !== undefined && (
          <div className="kpi-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: color
                }}
              />
            </div>
            {target && (
              <div className="progress-target">
                יעד: {target}
              </div>
            )}
          </div>
        )}

        {breakdown && (
          <div className="kpi-breakdown">
            {Object.entries(breakdown).map(([key, val]) => (
              <div key={key} className="breakdown-item">
                <span className="breakdown-label">{key}:</span>
                <span className="breakdown-value">{val}</span>
              </div>
            ))}
          </div>
        )}

        {successRate !== undefined && (
          <div className="kpi-success-rate">
            <div className="success-rate-label">אחוז הצלחה:</div>
            <div className="success-rate-value" style={{ color: color }}>
              {successRate.toFixed(1)}%
            </div>
          </div>
        )}

        {details && (
          <div className="kpi-details">
            {details}
          </div>
        )}
      </div>

      <style jsx>{`
        .kpi-card {
          background: linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(102, 126, 234, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .kpi-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--gradient);
        }

        .kpi-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .kpi-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          background: var(--gradient);
        }

        .kpi-title {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          line-height: 1.4;
        }

        .kpi-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .kpi-value {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
          margin-bottom: 4px;
        }

        .kpi-change {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 500;
        }

        .kpi-change.positive {
          color: #059669;
        }

        .kpi-change.negative {
          color: #dc2626;
        }

        .kpi-change.neutral {
          color: #6b7280;
        }

        .kpi-progress {
          margin-top: 8px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.8s ease-out;
        }

        .progress-target {
          font-size: 12px;
          color: #6b7280;
          text-align: right;
        }

        .kpi-breakdown {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 8px;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .breakdown-label {
          color: #6b7280;
        }

        .breakdown-value {
          font-weight: 500;
          color: #1e293b;
        }

        .kpi-success-rate {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          padding: 8px 12px;
          background-color: rgba(102, 126, 234, 0.05);
          border-radius: 8px;
        }

        .success-rate-label {
          font-size: 12px;
          color: #6b7280;
        }

        .success-rate-value {
          font-size: 16px;
          font-weight: 600;
        }

        .kpi-details {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .kpi-card {
            padding: 16px;
          }
          
          .kpi-value {
            font-size: 24px;
          }
          
          .kpi-icon {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default KPICard;
