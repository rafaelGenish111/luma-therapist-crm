import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Box,
    Typography
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import AppointmentForm from '../../pages/dashboard/therapist/components/AppointmentForm';
import api from '../../services/api';

const AppointmentModal = ({ open, onClose, appointment, clients = [], onSave }) => {
    const [localClients, setLocalClients] = React.useState(clients);

    // טען לקוחות במקרה שהרשימה עדיין לא נטענה מסביבת האב
    React.useEffect(() => {
        setLocalClients(clients);
    }, [clients]);

    React.useEffect(() => {
        if (!open) return;
        if (localClients && localClients.length > 0) return;
        (async () => {
            try {
                const res = await api.get('/clients');
                const list = Array.isArray(res?.data)
                    ? res.data
                    : (res?.data?.data || res?.data?.clients || []);
                setLocalClients(list);
            } catch (e) {
                // השאר ריק בשקט; הטופס עדיין יעבוד אם המשתמש יקליד ידנית
            }
        })();
    }, [open]);
    const handleSubmit = async (formData) => {
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving appointment:', error);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            dir="rtl"
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        {appointment ? 'עריכת פגישה' : 'פגישה חדשה'}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <AppointmentForm
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                    initialData={appointment}
                    clients={localClients}
                />
            </DialogContent>
        </Dialog>
    );
};

export default AppointmentModal;

