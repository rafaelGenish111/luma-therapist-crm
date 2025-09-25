import React from 'react';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RevenueChart = ({ type = 'line', data = [], title = 'גרף הכנסות', height = 300, loading = false }) => {
  // אם טוען, נציג אינדיקטור טעינה
  if (loading) {
    return (
      <Paper sx={{ p: 3, height: height + 60 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>טוען נתונים...</Typography>
        </Box>
      </Paper>
    );
  }

  // אם אין נתונים, נציג הודעה
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, height: height + 60 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
          <Typography color="text.secondary">
            אין נתונים להצגה
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: height + 60 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `₪${value.toLocaleString()}`}
          />
          <Tooltip
            formatter={(value) => [`₪${value.toLocaleString()}`, 'הכנסות']}
            labelStyle={{ color: '#333' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#667eea"
            strokeWidth={3}
            dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#667eea', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default RevenueChart;