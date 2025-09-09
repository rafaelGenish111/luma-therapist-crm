import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Divider, Chip, Link, TextField, Button, Alert,
    Tabs, Tab, Card, CardContent, Grid, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../../../services/api';
import healthDeclarationService from '../../../../services/healthDeclarationService';

const ClientDetails = ({ client, onUpdate, onAddAppointment }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [newInteraction, setNewInteraction] = useState('');
    const [addingInteraction, setAddingInteraction] = useState(false);
    const [error, setError] = useState('');

    // תיעוד טיפול
    const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
    const [treatmentForm, setTreatmentForm] = useState({
        documentation: '',
        date: new Date().toISOString().split('T')[0],
        duration: 60,
        sessionNumber: 1,
        summary: '',
        recommendations: ''
    });
    const [savingTreatment, setSavingTreatment] = useState(false);

    // הצהרות בריאות
    const [healthDeclarations, setHealthDeclarations] = useState([]);
    const [loadingDeclarations, setLoadingDeclarations] = useState(false);

    // טיפולים קודמים
    const [treatments, setTreatments] = useState([]);
    const [loadingTreatments, setLoadingTreatments] = useState(false);

    if (!client) return null;

    // טעינת הצהרות בריאות
    useEffect(() => {
        if (client.nationalId) {
            loadHealthDeclarations();
        }
    }, [client.nationalId]);

    // טעינת טיפולים קודמים
    useEffect(() => {
        loadTreatments();
    }, [client._id]);

    const loadHealthDeclarations = async () => {
        setLoadingDeclarations(true);
        try {
            const response = await healthDeclarationService.getByNationalId(client.nationalId);
            setHealthDeclarations(response.data?.data || []);
        } catch (error) {
            console.log('שגיאה בטעינת הצהרות בריאות:', error);
        } finally {
            setLoadingDeclarations(false);
        }
    };

    const loadTreatments = async () => {
        setLoadingTreatments(true);
        try {
            const response = await api.get(`/treatment-sessions/client/${client._id}`);
            setTreatments(response.data?.data?.sessions || []);
        } catch (error) {
            console.log('שגיאה בטעינת טיפולים:', error);
        } finally {
            setLoadingTreatments(false);
        }
    };

    const handleAddTreatment = async () => {
        setSavingTreatment(true);
        try {
            const treatmentData = {
                client: client._id,
                sessionDate: treatmentForm.date,
                description: treatmentForm.documentation,
                nextSessionNotes: treatmentForm.recommendations,
                sessionType: 'therapy'
            };

            const response = await api.post('/treatment-sessions', treatmentData);
            setTreatments(prev => [response.data.data, ...prev]);
            setTreatmentDialogOpen(false);
            setTreatmentForm({
                documentation: '',
                date: new Date().toISOString().split('T')[0],
                duration: 60,
                sessionNumber: treatments.length + 1,
                summary: '',
                recommendations: ''
            });
        } catch (error) {
            setError('שגיאה בשמירת תיעוד טיפול');
        } finally {
            setSavingTreatment(false);
        }
    };

    const handleAddInteraction = async () => {
        if (!newInteraction.trim()) return;

        setAddingInteraction(true);
        setError('');

        try {
            const response = await api.post(`/clients/${client._id || client.id}/interactions`, {
                text: newInteraction,
                type: 'general'
            });

            setNewInteraction('');
            if (onUpdate) {
                onUpdate(response.data.data);
            }
        } catch (err) {
            setError('שגיאה בהוספת אינטראקציה');
        } finally {
            setAddingInteraction(false);
        }
    };

    return (
        <Box minWidth={600} maxWidth={800}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">{client.firstName} {client.lastName}</Typography>
                <Box display="flex" gap={1}>
                    {onAddAppointment && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<EventIcon />}
                            onClick={() => onAddAppointment(client)}
                            size="small"
                        >
                            הוסף פגישה
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                <Tab icon={<PersonIcon />} label="פרטי לקוח" />
                <Tab icon={<DescriptionIcon />} label="תיאור" />
                <Tab icon={<HealthAndSafetyIcon />} label="הצהרת בריאות" />
                <Tab icon={<MedicalServicesIcon />} label="תיעוד טיפול" />
            </Tabs>

            {/* Tab Content */}
            {activeTab === 0 && (
                <Card>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2">טלפון:</Typography>
                                <Typography mb={1}>{client.phone}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2">אימייל:</Typography>
                                <Typography mb={1}>{client.email}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2">תעודת זהות:</Typography>
                                <Typography mb={1}>{client.nationalId}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2">סטטוס:</Typography>
                                <Chip label={client.status} color="primary" sx={{ mb: 1 }} />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2">כתובת:</Typography>
                                <Typography mb={1}>{[client.street, client.city, client.zip, client.country].filter(Boolean).join(', ')}</Typography>
                            </Grid>
                            {client.whatsapp && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2">וואטסאפ:</Typography>
                                    <Link href={client.whatsapp} target="_blank" rel="noopener">
                                        <WhatsAppIcon color="success" sx={{ verticalAlign: 'middle' }} /> {client.whatsapp}
                                    </Link>
                                </Grid>
                            )}
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {activeTab === 1 && (
                <Card>
                    <CardContent>
                        {client.interests && (
                            <Box mb={2}>
                                <Typography variant="subtitle2">תחומי עניין:</Typography>
                                <Typography>{client.interests}</Typography>
                            </Box>
                        )}
                        {client.notes && (
                            <Box mb={2}>
                                <Typography variant="subtitle2">הערות:</Typography>
                                <Typography>{client.notes}</Typography>
                            </Box>
                        )}
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" mb={1}>הוספת אינטראקציה חדשה</Typography>
                        <Box display="flex" gap={1} mb={2}>
                            <TextField
                                label="אינטראקציה חדשה"
                                value={newInteraction}
                                onChange={(e) => setNewInteraction(e.target.value)}
                                fullWidth
                                multiline
                                rows={2}
                                disabled={addingInteraction}
                            />
                            <Button
                                onClick={handleAddInteraction}
                                variant="contained"
                                disabled={!newInteraction.trim() || addingInteraction}
                                sx={{ minWidth: 'fit-content' }}
                            >
                                {addingInteraction ? 'מוסיף...' : 'הוסף'}
                            </Button>
                        </Box>
                        <Typography variant="subtitle1" mb={1}>היסטוריית אינטראקציות</Typography>
                        <Box maxHeight={200} sx={{ overflowY: 'auto' }}>
                            {client.interactions && client.interactions.length > 0 ? (
                                client.interactions.map((i, idx) => (
                                    <Box key={idx} mb={1} p={1} sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {new Date(i.date).toLocaleString('he-IL')}
                                        </Typography>
                                        <Typography variant="body2">{i.text}</Typography>
                                    </Box>
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary">אין אינטראקציות</Typography>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            )}

            {activeTab === 2 && (
                <Card>
                    <CardContent>
                        {loadingDeclarations ? (
                            <Typography>טוען הצהרות בריאות...</Typography>
                        ) : healthDeclarations.length > 0 ? (
                            <Box>
                                <Typography variant="h6" mb={2}>הצהרות בריאות</Typography>
                                {healthDeclarations.map((declaration, index) => (
                                    <Card key={declaration._id} sx={{ mb: 2, p: 2 }}>
                                        <Typography variant="subtitle2">תאריך: {new Date(declaration.createdAt).toLocaleDateString('he-IL')}</Typography>
                                        <Typography variant="subtitle2">סטטוס: {declaration.status}</Typography>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<VisibilityIcon />}
                                            sx={{ mt: 1 }}
                                        >
                                            צפייה במסמך
                                        </Button>
                                    </Card>
                                ))}
                            </Box>
                        ) : (
                            <Typography>אין הצהרות בריאות עבור לקוח זה</Typography>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeTab === 3 && (
                <Card>
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">תיעוד טיפול</Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setTreatmentDialogOpen(true)}
                            >
                                הוסף תיעוד
                            </Button>
                        </Box>

                        {loadingTreatments ? (
                            <Typography>טוען טיפולים...</Typography>
                        ) : treatments.length > 0 ? (
                            <Box>
                                {treatments.map((treatment, index) => (
                                    <Card key={treatment._id} sx={{ mb: 2, p: 2 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography variant="subtitle1">פגישה {treatment.sessionNumber}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {new Date(treatment.sessionDate).toLocaleDateString('he-IL')}
                                                </Typography>
                                            </Box>
                                            <IconButton size="small">
                                                <EditIcon />
                                            </IconButton>
                                        </Box>
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            <strong>תיאור:</strong> {treatment.description}
                                        </Typography>
                                        {treatment.nextSessionNotes && (
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                <strong>המלצות לפגישה הבאה:</strong> {treatment.nextSessionNotes}
                                            </Typography>
                                        )}
                                        {treatment.progress && (
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                <strong>התקדמות:</strong> {treatment.progress}
                                            </Typography>
                                        )}
                                    </Card>
                                ))}
                            </Box>
                        ) : (
                            <Typography>אין תיעוד טיפולים עדיין</Typography>
                        )}
                    </CardContent>
                </Card>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Treatment Dialog */}
            <Dialog open={treatmentDialogOpen} onClose={() => setTreatmentDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>הוספת תיעוד טיפול</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="תאריך"
                                type="date"
                                value={treatmentForm.date}
                                onChange={(e) => setTreatmentForm({ ...treatmentForm, date: e.target.value })}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>סוג פגישה</InputLabel>
                                <Select
                                    value={treatmentForm.sessionType || 'therapy'}
                                    onChange={(e) => setTreatmentForm({ ...treatmentForm, sessionType: e.target.value })}
                                    label="סוג פגישה"
                                >
                                    <MenuItem value="intake">פגישה ראשונה</MenuItem>
                                    <MenuItem value="followup">מעקב</MenuItem>
                                    <MenuItem value="assessment">הערכה</MenuItem>
                                    <MenuItem value="therapy">טיפול</MenuItem>
                                    <MenuItem value="summary">סיכום</MenuItem>
                                    <MenuItem value="consultation">ייעוץ</MenuItem>
                                    <MenuItem value="other">אחר</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="תיעוד"
                                multiline
                                rows={4}
                                value={treatmentForm.documentation}
                                onChange={(e) => setTreatmentForm({ ...treatmentForm, documentation: e.target.value })}
                                fullWidth
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="המלצות לפגישה הבאה"
                                multiline
                                rows={3}
                                value={treatmentForm.recommendations}
                                onChange={(e) => setTreatmentForm({ ...treatmentForm, recommendations: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTreatmentDialogOpen(false)}>ביטול</Button>
                    <Button
                        onClick={handleAddTreatment}
                        variant="contained"
                        disabled={savingTreatment || !treatmentForm.documentation.trim()}
                    >
                        {savingTreatment ? 'שומר...' : 'שמור'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ClientDetails; 