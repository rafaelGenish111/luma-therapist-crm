import React, { useState } from 'react';
import {
    Box,
    Grid,
    TextField,
    Button,
    Alert,
    Paper,
    Typography,
    Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';

import clientService from '../../../../../services/clientService';

export default function ReferralDescriptionTab({ client, onClientUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        generalDescription: client.generalDescription || '',
        referralReason: client.referralReason || '',
        medicalHistory: client.medicalHistory || '',
        currentMedications: client.currentMedications || '',
        allergies: client.allergies || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Clean the data before sending
            const cleanedData = clientService.cleanClientFormData(formData);

            await clientService.updateClient(client._id, cleanedData);
            setSuccess('המידע הכללי עודכן בהצלחה');
            setIsEditing(false);
            onClientUpdate();
        } catch (err) {
            console.error('Error updating client:', err);
            setError('שגיאה בעדכון המידע הכללי');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            generalDescription: client.generalDescription || '',
            referralReason: client.referralReason || '',
            medicalHistory: client.medicalHistory || '',
            currentMedications: client.currentMedications || '',
            allergies: client.allergies || ''
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
                {/* General Description */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>תיאור כללי</Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                label="תיאור כללי של הלקוח"
                                name="generalDescription"
                                value={formData.generalDescription}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={4}
                                disabled={!isEditing}
                                placeholder="תיאור כללי של מצב הלקוח, אישיותו, נסיבות החיים..."
                                helperText="עד 2000 תווים"
                                inputProps={{ maxLength: 2000 }}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Referral Information */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>מידע על ההפניה</Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                label="סיבת ההפניה / בעיה מרכזית"
                                name="referralReason"
                                value={formData.referralReason}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={3}
                                disabled={!isEditing}
                                placeholder="מה הביא את הלקוח לטיפול? מה הבעיה המרכזית שאיתה הוא מתמודד?"
                                helperText="עד 1000 תווים"
                                inputProps={{ maxLength: 1000 }}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Medical Information */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>מידע רפואי</Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                label="היסטוריה רפואית"
                                name="medicalHistory"
                                value={formData.medicalHistory}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={3}
                                disabled={!isEditing}
                                placeholder="מחלות, ניתוחים, אשפוזים, טיפולים רפואיים קודמים..."
                                helperText="עד 3000 תווים"
                                inputProps={{ maxLength: 3000 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="תרופות נוכחיות"
                                name="currentMedications"
                                value={formData.currentMedications}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={3}
                                disabled={!isEditing}
                                placeholder="שמות תרופות, מינונים, תדירות נטילה..."
                                helperText="עד 1000 תווים"
                                inputProps={{ maxLength: 1000 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="אלרגיות"
                                name="allergies"
                                value={formData.allergies}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={3}
                                disabled={!isEditing}
                                placeholder="אלרגיות למזון, תרופות, חומרים אחרים..."
                                helperText="עד 500 תווים"
                                inputProps={{ maxLength: 500 }}
                            />
                        </Grid>
                    </Grid>
                </Paper>
            </form>
        </Box>
    );
}