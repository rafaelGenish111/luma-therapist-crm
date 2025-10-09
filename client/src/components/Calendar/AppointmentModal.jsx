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

const AppointmentModal = ({ open, onClose, appointment, clients = [], onSave }) => {
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
                    clients={clients}
                />
            </DialogContent>
        </Dialog>
    );
};

export default AppointmentModal;

