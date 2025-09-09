import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Grid, MenuItem, Typography, Alert } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';

const appointmentTypes = [
    'פגישה ראשונה',
    'טיפול רגיל',
    'מעקב',
    'ייעוץ',
    'אחר'
];

const appointmentStatuses = [
    'מתוכננת',
    'אושרה',
    'בוצעה',
    'בוטלה',
    'לא הופיעה'
];

const AppointmentForm = ({ onSubmit, onCancel, initialData, clientId, clients = [] }) => {
    const [form, setForm] = useState({
        client: clientId || '',
        date: new Date(),
        duration: 60,
        type: 'טיפול רגיל',
        status: 'מתוכננת',
        notes: '',
        location: '',
        price: '',
        summary: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setForm({
                ...form,
                ...initialData,
                date: initialData.date ? new Date(initialData.date) : new Date()
            });
        }
    }, [initialData]);

    const validate = () => {
        const newErrors = {};
        if (!form.client) newErrors.client = 'שדה חובה';
        if (!form.date) newErrors.date = 'שדה חובה';
        if (!form.type) newErrors.type = 'שדה חובה';
        if (!form.status) newErrors.status = 'שדה חובה';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleDateChange = (newDate) => {
        setForm({ ...form, date: newDate });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        // המרות קלות לפני שליחה
        const payload = {
            ...form,
            duration: Number(form.duration),
            price: form.price === '' ? undefined : Number(form.price),
        };
        onSubmit(payload);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <DateTimePicker
                            label="תאריך ושעה"
                            value={form.date}
                            onChange={handleDateChange}
                            ampm={false}
                            minutesStep={5}
                            disablePast
                            format="dd.MM.yyyy HH:mm"
                            viewRenderers={{
                                hours: renderTimeViewClock,
                                minutes: renderTimeViewClock,
                                seconds: renderTimeViewClock,
                            }}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    required: true,
                                    error: !!errors.date,
                                    helperText: errors.date,
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="משך (דקות)"
                            name="duration"
                            type="number"
                            value={form.duration}
                            onChange={handleChange}
                            fullWidth
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="לקוח/ה"
                            name="client"
                            value={form.client}
                            onChange={handleChange}
                            fullWidth
                            required
                            error={!!errors.client}
                            helperText={errors.client}
                        >
                            {clients.map((c) => (
                                <MenuItem key={c._id || c.id} value={c._id || c.id}>
                                    {c.firstName} {c.lastName}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="סוג פגישה"
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                            fullWidth
                            required
                            error={!!errors.type}
                            helperText={errors.type}
                        >
                            {appointmentTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="סטטוס"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            fullWidth
                            required
                            error={!!errors.status}
                            helperText={errors.status}
                        >
                            {appointmentStatuses.map((status) => (
                                <MenuItem key={status} value={status}>
                                    {status}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="מיקום"
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            fullWidth
                            placeholder="כתובת או חדר"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="מחיר"
                            name="price"
                            type="number"
                            value={form.price}
                            onChange={handleChange}
                            fullWidth
                            placeholder="₪"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="הערות לפני הפגישה"
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={3}
                        />
                    </Grid>
                    {form.status === 'בוצעה' && (
                        <Grid item xs={12}>
                            <TextField
                                label="סיכום פגישה"
                                name="summary"
                                value={form.summary}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="תיאור הטיפול, המלצות, מטרות להמשך..."
                            />
                        </Grid>
                    )}
                    <Grid item xs={12} display="flex" gap={2} justifyContent="flex-end">
                        <Button type="submit" variant="contained" color="primary">
                            {initialData ? 'עדכן פגישה' : 'צור פגישה'}
                        </Button>
                        {onCancel && (
                            <Button variant="outlined" color="secondary" onClick={onCancel}>
                                ביטול
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </Box>
        </LocalizationProvider>
    );
};

export default AppointmentForm; 