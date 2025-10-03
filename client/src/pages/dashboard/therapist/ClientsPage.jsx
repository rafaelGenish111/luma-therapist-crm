import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Alert, useTheme, useMediaQuery } from '@mui/material';

import ClientList from './components/ClientList';
import ClientForm from './components/ClientForm';
import ClientDetails from './components/ClientDetails';
import AppointmentForm from './components/AppointmentForm';
import api from '../../../services/api';

const ClientsPage = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editClient, setEditClient] = useState(null);
    const [saving, setSaving] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [error, setError] = useState('');
    const [dialogError, setDialogError] = useState('');
    const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
    const [selectedClientForAppointment, setSelectedClientForAppointment] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // שליפת לקוחות מהשרת
    const fetchClients = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/clients');
            console.log('Clients response:', res.data);
            setClients(res.data?.data || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
            setError('שגיאה בטעינת לקוחות');
            setClients([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    // פתיחת טופס הוספה
    const handleAdd = () => {
        setEditClient(null);
        setOpen(true);
    };

    // פתיחת טופס עריכה
    const handleEdit = (client) => {
        setEditClient(client);
        setOpen(true);
    };

    // בחירת לקוח (לפתיחת כרטיס)
    const handleSelectClient = (client) => {
        console.log('handleSelectClient called with:', client);
        setSelectedClient(client);
    };

    // שמירה (הוספה/עדכון)
    const handleSave = async (data) => {
        console.log('handleSave called with data:', data);
        setSaving(true);
        setError('');
        setDialogError('');
        try {
            const payload = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== '' && v !== null && v !== undefined));
            // נירמול טלפון (מספרים בלבד + הוספת מקף סטנדרטי)
            if (payload.phone) {
                const digits = String(payload.phone).replace(/\D/g, '');
                if (digits.length === 10) {
                    payload.phone = `${digits.slice(0, 3)}-${digits.slice(3)}`;
                } else if (/^\d{3}-?\d{7}$/.test(payload.phone) === false) {
                    // אם לא בפורמט תקין - נשאיר כפי שהוא כדי שהשרת יחזיר שגיאה מפורטת
                }
            }
            if (payload.nationalId) {
                payload.nationalId = String(payload.nationalId).replace(/\D/g, '').slice(0, 9);
            }
            console.log('Payload:', payload);
            if (editClient) {
                // עדכון
                console.log('Updating client:', editClient._id || editClient.id);
                await api.put(`/clients/${editClient._id || editClient.id}`, payload);
            } else {
                // הוספה
                console.log('Creating new client');
                await api.post('/clients', payload);
                // ניקוי cache של הדשבורד כדי שהמספרים יתעדכנו
                localStorage.removeItem('dashboard_data_cache');
            }
            setOpen(false);
            fetchClients();
        } catch (err) {
            console.error('Save error:', err);
            const apiError = err?.response?.data;
            const msg = apiError?.message || 'שגיאה בשמירת לקוח';
            setError(msg);
            setDialogError(msg);
        } finally {
            setSaving(false);
        }
    };

    // מחיקה
    const handleDelete = async (client) => {
        if (!window.confirm('האם למחוק את הלקוח?')) return;
        try {
            await api.delete(`/clients/${client._id || client.id}`);
            // ניקוי cache של הדשבורד כדי שהמספרים יתעדכנו
            localStorage.removeItem('dashboard_data_cache');
            fetchClients();
        } catch (err) {
            setError('שגיאה במחיקת לקוח');
        }
    };

    // עדכון לקוח (לאחר הוספת אינטראקציה)
    const handleClientUpdate = (updatedClient) => {
        setClients(prevClients =>
            prevClients.map(client =>
                client._id === updatedClient._id || client.id === updatedClient.id
                    ? updatedClient
                    : client
            )
        );
        setSelectedClient(updatedClient);
    };

    // פתיחת דיאלוג תור
    const handleOpenAppointment = (client) => {
        setSelectedClientForAppointment(client);
        setAppointmentDialogOpen(true);
    };

    return (
        <Box>
            <Box
                p={isMobile ? 2 : 4}
                sx={{
                    '@media (max-width: 480px)': {
                        padding: '1rem'
                    }
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography
                        variant={isMobile ? "h5" : "h4"}
                        sx={{
                            '@media (max-width: 480px)': {
                                fontSize: '1.3rem'
                            }
                        }}
                    >
                        ניהול לקוחות
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={handleAdd}
                        sx={{
                            '@media (max-width: 480px)': {
                                width: '100%',
                                mt: 2
                            }
                        }}
                    >
                        הוספת לקוח חדש
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <ClientList
                        clients={clients}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onSelect={handleSelectClient}
                        onAppointment={handleOpenAppointment}
                        selectedClient={selectedClient}
                        onClientUpdate={handleClientUpdate}
                    />
                )}

                {/* Client Form Dialog */}
                <Dialog
                    open={open}
                    onClose={() => setOpen(false)}
                    maxWidth="md"
                    fullWidth
                    fullScreen={isMobile}
                >
                    <DialogTitle>
                        {editClient ? 'עריכת לקוח' : 'הוספת לקוח חדש'}
                    </DialogTitle>
                    <DialogContent>
                        {dialogError && (
                            <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>
                        )}
                        <ClientForm
                            initialData={editClient}
                            onSubmit={handleSave}
                            onCancel={() => setOpen(false)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>ביטול</Button>
                    </DialogActions>
                </Dialog>

                {/* Client Details Dialog */}
                {selectedClient && (
                    <Dialog
                        open={!!selectedClient}
                        onClose={() => setSelectedClient(null)}
                        maxWidth="md"
                        fullWidth
                        fullScreen={isMobile}
                    >
                        <DialogTitle>
                            פרטי לקוח: {selectedClient.fullName}
                        </DialogTitle>
                        <DialogContent>
                            <ClientDetails
                                client={selectedClient}
                                onUpdate={handleClientUpdate}
                                onClose={() => setSelectedClient(null)}
                            />
                        </DialogContent>
                    </Dialog>
                )}

                {/* Appointment Form Dialog */}
                <Dialog
                    open={appointmentDialogOpen}
                    onClose={() => setAppointmentDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                    fullScreen={isMobile}
                >
                    <DialogTitle>
                        קביעת תור ל{selectedClientForAppointment?.fullName}
                    </DialogTitle>
                    <DialogContent>
                        <AppointmentForm
                            client={selectedClientForAppointment}
                            onSave={() => {
                                setAppointmentDialogOpen(false);
                                setSelectedClientForAppointment(null);
                            }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setAppointmentDialogOpen(false)}>ביטול</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default ClientsPage; 