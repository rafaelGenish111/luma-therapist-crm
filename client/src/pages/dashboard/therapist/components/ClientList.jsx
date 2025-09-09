import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ResponsiveTableCards from '../../../../components/ResponsiveTableCards';

const ClientList = ({ clients = [], onEdit, onDelete, onView, onAddAppointment, onSelect }) => {
    const navigate = useNavigate();
    if (clients.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <Typography variant="h6" color="text.secondary">
                    אין לקוחות עדיין. הוסף לקוח ראשון!
                </Typography>
            </Box>
        );
    }

    return (
        <ResponsiveTableCards
            columns={[
                { key: "firstName", label: "שם פרטי" },
                { key: "lastName", label: "שם משפחה" },
                { key: "nationalId", label: "ת.ז." },
                { key: "phone", label: "טלפון" },
                { key: "email", label: "אימייל" },
                { key: "city", label: "עיר" },
                { key: "status", label: "סטטוס" },
                { key: "whatsapp", label: "וואטסאפ" },
                { key: "lastInteraction", label: "אינטראקציה אחרונה" }
            ]}
            rows={clients.map((client) => ({
                id: client._id || client.id,
                firstName: client.firstName,
                lastName: client.lastName,
                nationalId: client.nationalId || '-',
                phone: client.phone,
                email: client.email,
                city: client.city,
                status: client.status,
                whatsapp: client.whatsapp ? 'פעיל' : 'לא פעיל',
                lastInteraction: client.interactions && client.interactions.length > 0
                    ? `${new Date(client.interactions[client.interactions.length - 1].date).toLocaleDateString('he-IL')} - ${client.interactions[client.interactions.length - 1].text.substring(0, 30)}${client.interactions[client.interactions.length - 1].text.length > 30 ? '...' : ''}`
                    : 'אין אינטראקציות',
                _client: client // שמירת האובייקט המקורי
            }))}
            onRowClick={(row) => {
                const client = row._client;
                console.log('Row clicked, navigating to client card:', client._id);
                // פתיחת כרטיס הלקוח (אותו דבר כמו הכפתור עם AssignmentIcon)
                navigate(`/dashboard/clients/${client._id}`);
            }}
            actions={(row) => {
                const client = clients.find(c => (c._id || c.id) === row.id);
                return (
                    <>
                        <IconButton
                            color="info"
                            onClick={() => onView && onView(client)}
                            title="צפייה בפרטים"
                            size="small"
                        >
                            <VisibilityIcon />
                        </IconButton>
                        <IconButton
                            color="secondary"
                            onClick={() => navigate(`/dashboard/clients/${client._id}`)}
                            title="כרטיס לקוח"
                            size="small"
                        >
                            <AssignmentIcon />
                        </IconButton>
                        {onAddAppointment && (
                            <IconButton
                                color="success"
                                onClick={() => onAddAppointment(client)}
                                title="הוסף פגישה"
                                size="small"
                            >
                                <EventIcon />
                            </IconButton>
                        )}
                        <IconButton
                            color="primary"
                            onClick={() => onEdit && onEdit(client)}
                            title="עריכה"
                            size="small"
                        >
                            <EditIcon />
                        </IconButton>
                        <IconButton
                            color="error"
                            onClick={() => onDelete && onDelete(client)}
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

export default ClientList; 