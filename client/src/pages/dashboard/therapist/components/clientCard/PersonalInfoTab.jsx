import React, { useState } from 'react';
import {
    Box,
    Grid,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    Paper,
    Typography,
    Divider,
    Autocomplete,
    FormControlLabel,
    Switch
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';

import clientService from '../../../../../services/clientService';
import citiesData from '../../../../../data/cities_he.json';

const statusOptions = [
    'פניה ראשונית',
    'פעיל',
    'לא פעיל',
    'הפסקת טיפול',
    'השלמת טיפול'
];

export default function PersonalInfoTab({ client, onClientUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        phone: client.phone || '',
        email: client.email || '',
        dateOfBirth: client.dateOfBirth ? client.dateOfBirth.split('T')[0] : '',
        nationalId: client.nationalId || '',
        status: client.status || 'פניה ראשונית',
        whatsapp: client.whatsapp || false,
        interests: client.interests || '',
        notes: client.notes || '',
        // Address fields
        city: client.city || '',
        street: client.street || '',
        houseNumber: client.houseNumber || '',
        zipCode: client.zipCode || '',
        country: client.country || 'ישראל',
        // Emergency contact
        emergencyContact: {
            name: client.emergencyContact?.name || '',
            phone: client.emergencyContact?.phone || '',
            relationship: client.emergencyContact?.relationship || ''
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith('emergencyContact.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                emergencyContact: {
                    ...prev.emergencyContact,
                    [field]: value
                }
            }));
        } else if (name === 'nationalId') {
            // Only allow digits and limit to 9 characters
            const digitsOnly = value.replace(/\D/g, '').slice(0, 9);
            setFormData(prev => ({ ...prev, [name]: digitsOnly }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Validate data
            const errors = {};
            if (!formData.firstName.trim()) errors.firstName = 'שם פרטי חובה';
            if (!formData.lastName.trim()) errors.lastName = 'שם משפחה חובה';
            if (!formData.phone.trim()) errors.phone = 'טלפון חובה';
            if (!formData.email.trim()) errors.email = 'אימייל חובה';
            if (!formData.nationalId.trim()) {
                errors.nationalId = 'תעודת זהות חובה';
            } else if (!/^\d{9}$/.test(formData.nationalId)) {
                errors.nationalId = 'תעודת זהות חייבת להכיל 9 ספרות';
            } else if (!clientService.validateIsraeliId(formData.nationalId)) {
                errors.nationalId = 'תעודת זהות אינה תקינה';
            }

            if (Object.keys(errors).length > 0) {
                setError('אנא תקן את השגיאות בטופס');
                return;
            }

            // Clean the data before sending
            const cleanedData = clientService.cleanClientFormData(formData);

            await clientService.updateClient(client._id, cleanedData);
            setSuccess('פרטי הלקוח עודכנו בהצלחה');
            setIsEditing(false);
            onClientUpdate();
        } catch (err) {
            console.error('Error updating client:', err);
            if (err.response?.data?.message?.includes('תעודת זהות זו כבר קיימת')) {
                setError('תעודת זהות זו כבר קיימת במערכת');
            } else {
                setError('שגיאה בעדכון פרטי הלקוח');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            firstName: client.firstName || '',
            lastName: client.lastName || '',
            phone: client.phone || '',
            email: client.email || '',
            dateOfBirth: client.dateOfBirth ? client.dateOfBirth.split('T')[0] : '',
            nationalId: client.nationalId || '',
            status: client.status || 'פניה ראשונית',
            whatsapp: client.whatsapp || false,
            interests: client.interests || '',
            notes: client.notes || '',
            city: client.city || '',
            street: client.street || '',
            houseNumber: client.houseNumber || '',
            zipCode: client.zipCode || '',
            country: client.country || 'ישראל',
            emergencyContact: {
                name: client.emergencyContact?.name || '',
                phone: client.emergencyContact?.phone || '',
                relationship: client.emergencyContact?.relationship || ''
            }
        });
        setIsEditing(false);
        setError('');
        setSuccess('');
    };

    return (
        <Box>
            {/* Alerts */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {/* Action Buttons */}
            <Box display="flex" justifyContent="flex-end" mb={3}>
                {!isEditing ? (
                    <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={() => setIsEditing(true)}
                    >
                        עריכה
                    </Button>
                ) : (
                    <Box gap={2} display="flex">
                        <Button
                            variant="outlined"
                            onClick={handleCancel}
                        >
                            ביטול
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            שמירה
                        </Button>
                    </Box>
                )}
            </Box>

            <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>פרטים בסיסיים</Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="שם פרטי *"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                fullWidth
                                disabled={!isEditing}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="שם משפחה *"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                fullWidth
                                disabled={!isEditing}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="תעודת זהות *"
                                name="nationalId"
                                value={formData.nationalId}
                                onChange={handleChange}
                                fullWidth
                                disabled={!isEditing}
                                required
                                helperText="9 ספרות בלבד"
                                inputProps={{
                                    maxLength: 9,
                                    inputMode: 'numeric',
                                    pattern: '[0-9]*'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="תאריך לידה"
                                name="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                fullWidth
                                disabled={!isEditing}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="טלפון *"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                fullWidth
                                disabled={!isEditing}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="אימייל *"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                fullWidth
                                disabled={!isEditing}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth disabled={!isEditing}>
                                <InputLabel>סטטוס</InputLabel>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    label="סטטוס"
                                >
                                    {statusOptions.map(status => (
                                        <MenuItem key={status} value={status}>
                                            {status}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        name="whatsapp"
                                        checked={formData.whatsapp}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                }
                                label="זמין בוואטסאפ"
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Address Information */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>כתובת</Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                options={citiesData}
                                value={formData.city}
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({ ...prev, city: newValue || '' }));
                                }}
                                disabled={!isEditing}
                                renderInput={(params) => (
                                    <TextField {...params} label="עיר" fullWidth />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="רחוב"
                                name="street"
                                value={formData.street}
                                onChange={handleChange}
                                fullWidth
                                disabled={!isEditing}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="מספר בית"
                                name="houseNumber"
                                value={formData.houseNumber}
                                onChange={handleChange}
                                fullWidth
                                disabled={!isEditing}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="מיקוד"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleChange}
                                fullWidth
                                disabled={!isEditing}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="מדינה"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                fullWidth
                                disabled={!isEditing}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Emergency Contact */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>איש קשר לחירום</Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="שם מלא"
                                name="emergencyContact.name"
                                value={formData.emergencyContact.name}
                                onChange={handleChange}
                                fullWidth
                                disabled={!isEditing}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="טלפון"
                                name="emergencyContact.phone"
                                value={formData.emergencyContact.phone}
                                onChange={handleChange}
                                fullWidth
                                disabled={!isEditing}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="קשר משפחתי"
                                name="emergencyContact.relationship"
                                value={formData.emergencyContact.relationship}
                                onChange={handleChange}
                                fullWidth
                                disabled={!isEditing}
                                placeholder="דוגמה: אמא, אבא, בן/בת זוג"
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Additional Information */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>מידע נוסף</Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                label="תחומי עניין"
                                name="interests"
                                value={formData.interests}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={2}
                                disabled={!isEditing}
                                placeholder="תחביבים, ספורט, תחומי עניין..."
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="הערות"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={3}
                                disabled={!isEditing}
                                placeholder="הערות כלליות על הלקוח..."
                            />
                        </Grid>
                    </Grid>
                </Paper>
            </form>
        </Box>
    );
}