import React from 'react';
import {
    IconButton,
    Typography,
    Box,
    Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventIcon from '@mui/icons-material/Event';
import ResponsiveTableCards from '../../../../components/ResponsiveTableCards';
import '../../../../components/responsive-table.css';

const statusLabels = {
    'scheduled': 'מתוכננת',
    'confirmed': 'אושרה',
    'completed': 'בוצעה',
    'cancelled': 'בוטלה',
    'no_show': 'לא הופיעה',
    // תמיכה בערכים הישנים בעברית
    'מתוכננת': 'מתוכננת',
    'אושרה': 'אושרה',
    'בוצעה': 'בוצעה',
    'בוטלה': 'בוטלה',
    'לא הופיעה': 'לא הופיעה'
};

const getStatusColor = (status) => {
    const normalizedStatus = statusLabels[status] || status;
    switch (normalizedStatus) {
        case 'מתוכננת': return { bg: '#e3f2fd', color: '#1976d2' };
        case 'אושרה': return { bg: '#e8f5e8', color: '#2e7d32' };
        case 'בוצעה': return { bg: '#f3e5f5', color: '#7b1fa2' };
        case 'בוטלה': return { bg: '#ffebee', color: '#c62828' };
        case 'לא הופיעה': return { bg: '#fff3e0', color: '#f57c00' };
        default: return { bg: '#f5f5f5', color: '#757575' };
    }
};

const getTypeColor = (type) => {
    switch (type) {
        case 'פגישה ראשונה': return { bg: '#e1f5fe', color: '#0277bd' };
        case 'טיפול רגיל': return { bg: '#f1f8e9', color: '#558b2f' };
        case 'מעקב': return { bg: '#fff8e1', color: '#f9a825' };
        case 'ייעוץ': return { bg: '#fce4ec', color: '#c2185b' };
        default: return { bg: '#f5f5f5', color: '#757575' };
    }
};

const AppointmentList = ({ appointments = [], onEdit, onDelete, onView }) => {
    if (appointments.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <Typography variant="h6" color="text.secondary">
                    אין פגישות מתוכננות
                </Typography>
            </Box>
        );
    }

    return (
        <ResponsiveTableCards
            columns={[
                { key: "date", label: "תאריך ושעה" },
                { key: "client", label: "לקוח" },
                { key: "type", label: "סוג" },
                { key: "duration", label: "משך" },
                { key: "status", label: "סטטוס" },
                { key: "location", label: "מיקום" },
                { key: "price", label: "מחיר" }
            ]}
            rows={appointments.map((appointment) => {
                const statusColors = getStatusColor(appointment.status);
                const typeColors = getTypeColor(appointment.type);

                return {
                    id: appointment._id || appointment.id,
                    date: new Date(appointment.date).toLocaleString('he-IL'),
                    client: `${appointment.client?.firstName || ''} ${appointment.client?.lastName || ''}`.trim(),
                    type: appointment.type,
                    duration: `${appointment.duration} דקות`,
                    status: statusLabels[appointment.status] || appointment.status,
                    location: appointment.location || '-',
                    price: appointment.price ? `₪${appointment.price}` : '-',
                    _appointment: appointment // שמירת האובייקט המקורי
                };
            })}
            actions={(row) => {
                const appointment = row._appointment;
                return (
                    <>
                        <IconButton
                            color="info"
                            onClick={() => onView && onView(appointment)}
                            title="צפייה בפרטים"
                            size="small"
                        >
                            <VisibilityIcon />
                        </IconButton>
                        <IconButton
                            color="primary"
                            onClick={() => onEdit && onEdit(appointment)}
                            title="עריכה"
                            size="small"
                        >
                            <EditIcon />
                        </IconButton>
                        <IconButton
                            color="error"
                            onClick={() => onDelete && onDelete(appointment)}
                            title="מחיקה"
                            size="small"
                        >
                            <DeleteIcon />
                        </IconButton>
                    </>
                );
            }}
        />
    );
};

export default AppointmentList; 