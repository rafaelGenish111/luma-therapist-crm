import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Grid, MenuItem, Typography, Autocomplete } from '@mui/material';
import api from '../../../../services/api';

const initialState = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    street: '',
    houseNumber: '',
    city: '',
    zip: '',
    country: 'ישראל',
    nationalId: '',
    status: 'פניה ראשונית',
    whatsapp: '',
    interests: '',
    notes: '',
    interactions: [],
    newInteraction: '',
};

const ClientForm = ({ onSubmit, onCancel, initialData }) => {
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [cityOptions, setCityOptions] = useState([]);
    const [streetOptions, setStreetOptions] = useState([]);

    const searchCities = async (query) => {
        if (!query || query.length < 2) return setCityOptions([]);
        try {
            const res = await api.get(`/geo/cities?search=${encodeURIComponent(query)}`);
            setCityOptions((res.data?.data || []).map(c => c.name));
        } catch (error) {
            console.log('City search error:', error);
            // Fallback: רשימת ערים בסיסית
            const fallbackCities = ['תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'אשדוד', 'נתניה', 'ראשון לציון', 'פתח תקווה', 'אשקלון', 'רחובות'];
            const filtered = fallbackCities.filter(city => city.toLowerCase().includes(query.toLowerCase()));
            setCityOptions(filtered);
        }
    };

    const searchStreets = async (city, query) => {
        if (!city || !query || query.length < 2) return setStreetOptions([]);
        try {
            const res = await api.get(`/geo/streets?city=${encodeURIComponent(city)}&search=${encodeURIComponent(query)}`);
            setStreetOptions((res.data?.data || []).map(s => s.name));
        } catch (error) {
            console.log('Street search error:', error);
            // Fallback: רשימת רחובות בסיסית
            const fallbackStreets = ['דיזנגוף', 'רוטשילד', 'הרצל', 'ויצמן', 'בן גוריון', 'שדרות העצמאות', 'שדרות ירושלים', 'שדרות הרצל'];
            const filtered = fallbackStreets.filter(street => street.toLowerCase().includes(query.toLowerCase()));
            setStreetOptions(filtered);
        }
    };

    useEffect(() => {
        if (initialData) {
            setForm({ ...initialState, ...initialData });
        } else {
            setForm(initialState);
        }
    }, [initialData]);

    const isValidIsraeliId = (id) => {
        if (!/^\d{9}$/.test(id)) return false;
        const digits = id.split('').map(Number);
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            let inc = digits[i] * ((i % 2) + 1);
            if (inc > 9) inc -= 9;
            sum += inc;
        }
        return sum % 10 === 0;
    };

    const validate = () => {
        const newErrors = {};
        if (!form.firstName) newErrors.firstName = 'שדה חובה';
        if (!form.lastName) newErrors.lastName = 'שדה חובה';
        if (!form.phone) newErrors.phone = 'שדה חובה';
        else if (!/^\d{3}-?\d{7}$/.test(form.phone)) newErrors.phone = 'מספר טלפון לא תקין (3 ספרות קידומת ו-7 ספרות מספר)';
        if (!form.email) newErrors.email = 'שדה חובה';
        else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'אימייל לא תקין';
        if (!form.nationalId) {
            newErrors.nationalId = 'תעודת זהות היא שדה חובה';
        } else if (!/^\d{9}$/.test(form.nationalId)) {
            newErrors.nationalId = 'תעודת זהות חייבת להכיל 9 ספרות';
        } else if (!isValidIsraeliId(form.nationalId)) {
            newErrors.nationalId = 'תעודת זהות אינה תקינה';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Special handling for nationalId - only allow digits
        if (name === 'nationalId') {
            const digitsOnly = value.replace(/\D/g, '').slice(0, 9);
            setForm({ ...form, [name]: digitsOnly });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('ClientForm handleSubmit called');
        if (!validate()) {
            console.log('Validation failed');
            return;
        }
        console.log('Calling onSubmit with form:', form);
        onSubmit(form);
    };

    const handleInteractionAdd = () => {
        if (form.newInteraction) {
            setForm({
                ...form,
                interactions: [...form.interactions, { date: new Date().toISOString(), text: form.newInteraction }],
                newInteraction: '',
            });
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="שם פרטי"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={!!errors.firstName}
                        helperText={errors.firstName}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="שם משפחה"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={!!errors.lastName}
                        helperText={errors.lastName}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="טלפון"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={!!errors.phone}
                        helperText={errors.phone}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="אימייל"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={!!errors.email}
                        helperText={errors.email}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="תאריך לידה"
                        name="dateOfBirth"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={handleChange}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Autocomplete
                        freeSolo
                        openOnFocus
                        options={cityOptions}
                        inputValue={form.city}
                        onInputChange={(_, value) => {
                            setForm({ ...form, city: value });
                            if (value && value.length >= 2) {
                                searchCities(value);
                            } else {
                                setCityOptions([]);
                            }
                            // ניקוי אופציות רחוב בעת שינוי עיר
                            setStreetOptions([]);
                        }}
                        onFocus={() => {
                            if (form.city && form.city.length >= 2) searchCities(form.city);
                        }}
                        filterOptions={(x) => x}
                        autoHighlight
                        renderInput={(params) => (
                            <TextField {...params} label="עיר" fullWidth />
                        )}
                    />
                </Grid>
                <Grid item xs={12} sm={5}>
                    <Autocomplete
                        freeSolo
                        openOnFocus
                        options={streetOptions}
                        inputValue={form.street}
                        onInputChange={(_, value) => {
                            setForm({ ...form, street: value });
                            if (value && value.length >= 2) {
                                searchStreets(form.city, value);
                            } else {
                                setStreetOptions([]);
                            }
                        }}
                        onFocus={() => {
                            if (form.street && form.street.length >= 2) searchStreets(form.city, form.street);
                        }}
                        filterOptions={(x) => x}
                        autoHighlight
                        renderInput={(params) => (
                            <TextField {...params} label="רחוב" fullWidth />
                        )}
                    />
                </Grid>
                <Grid item xs={12} sm={2}>
                    <TextField label="מספר בית" name="houseNumber" value={form.houseNumber} onChange={handleChange} fullWidth />
                </Grid>
                <Grid item xs={12} sm={2}>
                    <TextField label="מיקוד" name="zip" value={form.zip} onChange={handleChange} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField label="מדינה" name="country" value={form.country} onChange={handleChange} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="תעודת זהות *"
                        name="nationalId"
                        value={form.nationalId}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={!!errors.nationalId}
                        helperText={errors.nationalId || "9 ספרות בלבד"}
                        placeholder="123456789"
                        inputProps={{
                            maxLength: 9,
                            inputMode: 'numeric',
                            pattern: '[0-9]*'
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField select label="סטטוס" name="status" value={form.status} onChange={handleChange} fullWidth>
                        <MenuItem value="פניה ראשונית">פניה ראשונית</MenuItem>
                        <MenuItem value="לקוח קיים">לקוח קיים</MenuItem>
                        <MenuItem value="לקוח פוטנציאלי">לקוח פוטנציאלי</MenuItem>
                        <MenuItem value="לא רלוונטי">לא רלוונטי</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField label="קישור לוואטסאפ" name="whatsapp" value={form.whatsapp} onChange={handleChange} fullWidth placeholder="https://wa.me/9725..." />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField label="תחומי עניין" name="interests" value={form.interests} onChange={handleChange} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField label="הערות" name="notes" value={form.notes} onChange={handleChange} fullWidth multiline rows={2} />
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle1" mb={1}>היסטוריית אינטראקציות</Typography>
                    <Box display="flex" gap={1} mb={1}>
                        <TextField label="אינטראקציה חדשה" name="newInteraction" value={form.newInteraction} onChange={handleChange} fullWidth />
                        <Button onClick={handleInteractionAdd} variant="outlined">הוסף</Button>
                    </Box>
                    <Box>
                        {form.interactions.map((i, idx) => (
                            <Box key={idx} mb={0.5}>
                                <Typography variant="body2">{new Date(i.date).toLocaleString()} - {i.text}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} display="flex" alignItems="center">
                    <Button type="submit" variant="contained" color="primary" sx={{ ml: 2 }}>
                        שמור
                    </Button>
                    {onCancel && (
                        <Button variant="outlined" color="secondary" onClick={onCancel}>
                            ביטול
                        </Button>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default ClientForm; 