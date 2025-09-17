import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, DollarSign, Calendar, Users } from 'lucide-react';

const RevenueChart = ({ 
  type = 'line', 
  data = [], 
  title = 'הכנסות חודשיות',
  height = 300,
  showLegend = true,
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // צבעים לגרפים
  const colors = {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#2ed573',
    warning: '#ffa502',
    danger: '#ff4757',
    info: '#3742fa'
  };

  // פורמט נתונים לגרף קו
  const formatLineData = (data) => {
    return data.map(item => ({
      ...item,
      formattedValue: `₪${item.value?.toLocaleString() || 0}`,
      formattedDate: new Date(item.date).toLocaleDateString('he-IL', {
        month: 'short',
        day: 'numeric'
      })
    }));
  };

  // פורמט נתונים לגרף עוגה
  const formatPieData = (data) => {
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
    return data.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
      formattedValue: `₪${item.value?.toLocaleString() || 0}`
    }));
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <div className="tooltip-label">{label}</div>
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item">
              <div 
                className="tooltip-color" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="tooltip-name">{entry.name}:</span>
              <span className="tooltip-value">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom Legend
  const CustomLegend = ({ payload }) => {
    return (
      <div className="chart-legend">
        {payload.map((entry, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="legend-text">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // רכיב גרף קו
  const LineChartComponent = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatLineData(data)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="formattedDate" 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₪${value.toLocaleString()}`}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend content={<CustomLegend />} />}
        <Line
          type="monotone"
          dataKey="value"
          stroke={colors.primary}
          strokeWidth={3}
          dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: colors.primary, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  // רכיב גרף שטח
  const AreaChartComponent = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatLineData(data)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="formattedDate" 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₪${value.toLocaleString()}`}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend content={<CustomLegend />} />}
        <Area
          type="monotone"
          dataKey="value"
          stroke={colors.primary}
          fillOpacity={1}
          fill="url(#colorRevenue)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  // רכיב גרף עמודות
  const BarChartComponent = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={formatLineData(data)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="formattedDate" 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₪${value.toLocaleString()}`}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend content={<CustomLegend />} />}
        <Bar 
          dataKey="value" 
          fill={colors.primary}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  // רכיב גרף עוגה
  const PieChartComponent = () => {
    const pieData = formatPieData(data);
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={Object.values(colors)[index % Object.values(colors).length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend content={<CustomLegend />} />}
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // בחירת סוג הגרף
  const renderChart = () => {
    switch (type) {
      case 'area':
        return <AreaChartComponent />;
      case 'bar':
        return <BarChartComponent />;
      case 'pie':
        return <PieChartComponent />;
      default:
        return <LineChartComponent />;
    }
  };

  // חישוב סטטיסטיקות
  const calculateStats = () => {
    if (!data || data.length === 0) return null;

    const values = data.map(item => item.value || 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    // חישוב מגמה
    const trend = values.length > 1 ? 
      (values[values.length - 1] - values[0]) / values[0] * 100 : 0;

    return { total, average, max, min, trend };
  };

  const stats = calculateStats();

  return (
    <motion.div
      className={`revenue-chart ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onViewportEnter={() => setIsVisible(true)}
    >
      <div className="chart-header">
        <div className="chart-title">
          <DollarSign size={20} />
          <span>{title}</span>
        </div>
        {stats && (
          <div className="chart-stats">
            <div className="stat-item">
              <span className="stat-label">סה"כ:</span>
              <span className="stat-value">₪{stats.total.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">ממוצע:</span>
              <span className="stat-value">₪{stats.average.toLocaleString()}</span>
            </div>
            {stats.trend !== 0 && (
              <div className={`stat-item trend ${stats.trend > 0 ? 'positive' : 'negative'}`}>
                <TrendingUp size={16} />
                <span>{Math.abs(stats.trend).toFixed(1)}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="chart-container">
        {isVisible && renderChart()}
      </div>

      <style jsx>{`
        .revenue-chart {
          background: linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(102, 126, 234, 0.1);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .chart-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .chart-stats {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
        }

        .stat-label {
          color: #64748b;
        }

        .stat-value {
          font-weight: 600;
          color: #1e293b;
        }

        .stat-item.trend {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .stat-item.trend.positive {
          background-color: #dcfce7;
          color: #166534;
        }

        .stat-item.trend.negative {
          background-color: #fef2f2;
          color: #dc2626;
        }

        .chart-container {
          width: 100%;
          height: ${height}px;
        }

        .chart-tooltip {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .tooltip-label {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .tooltip-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .tooltip-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .tooltip-name {
          color: #64748b;
          font-size: 12px;
        }

        .tooltip-value {
          font-weight: 600;
          color: #1e293b;
          font-size: 12px;
        }

        .chart-legend {
          display: flex;
          gap: 16px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .legend-text {
          font-size: 12px;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .revenue-chart {
            padding: 16px;
          }
          
          .chart-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .chart-stats {
            width: 100%;
            justify-content: space-between;
          }
          
          .chart-container {
            height: 250px;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default RevenueChart;
