import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, Grid } from '@mui/material';
import healthDeclarationService from '../services/healthDeclarationService';

const defaultQuestions = [
    { key: 'covid', label: 'האם חלית בקורונה בחצי שנה האחרונה?' },
    { key: 'chronic', label: 'האם יש לך מחלה כרונית?' },
    { key: 'medication', label: 'האם את/ה נוטל/ת תרופות קבועות?' },
    { key: 'allergies', label: 'האם יש לך אלרגיות?' },
    { key: 'other', label: 'האם יש משהו נוסף שחשוב שנדע?' },
];

const HealthDeclarationForm = ({ therapistId }) => {
    const [form, setForm] = useState({
        fullName: '',
        idNumber: '',
        phone: '',
        email: '',
        answers: {},
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAnswerChange = (key, value) => {
        setForm({ ...form, answers: { ...form.answers, [key]: value } });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');
        try {
            const payload = { ...form, therapistId };
            await healthDeclarationService.submitPublic(payload);
            setSuccess('הצהרת הבריאות נשלחה בהצלחה!');
            setForm({ fullName: '', idNumber: '', phone: '', email: '', answers: {} });
        } catch (err) {
            setError('שגיאה בשליחת הצהרת הבריאות');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box maxWidth={500} mx="auto" mt={6} p={3} component={"form"} onSubmit={handleSubmit}>
            <Typography variant="h5" mb={2}>טופס הצהרת בריאות</Typography>
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TextField label="שם מלא" name="fullName" value={form.fullName} onChange={handleChange} fullWidth required />
                </Grid>
                <Grid item xs={12}>
                    <TextField label="תעודת זהות" name="idNumber" value={form.idNumber} onChange={handleChange} fullWidth required />
                </Grid>
                <Grid item xs={12}>
                    <TextField label="טלפון" name="phone" value={form.phone} onChange={handleChange} fullWidth required />
                </Grid>
                <Grid item xs={12}>
                    <TextField label="אימייל" name="email" value={form.email} onChange={handleChange} fullWidth />
                </Grid>
                {defaultQuestions.map(q => (
                    <Grid item xs={12} key={q.key}>
                        <TextField
                            label={q.label}
                            value={form.answers[q.key] || ''}
                            onChange={e => handleAnswerChange(q.key, e.target.value)}
                            fullWidth
                            multiline={q.key === 'other'}
                            required={q.key !== 'other'}
                        />
                    </Grid>
                ))}
                <Grid item xs={12} display="flex" justifyContent="flex-end">
                    <Button type="submit" variant="contained" color="primary" disabled={submitting}>
                        שלח הצהרה
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default HealthDeclarationForm; 