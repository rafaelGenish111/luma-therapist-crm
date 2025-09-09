import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    TextField,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Collapse,
    IconButton,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Add as AddIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

import treatmentSessionService from '../../../../../services/treatmentSessionService';

export default function TreatmentLogTab({ client }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [expandedRow, setExpandedRow] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [metaLabels, setMetaLabels] = useState({});
    const [editingSession, setEditingSession] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);

    const [formData, setFormData] = useState({
        sessionDate: new Date().toISOString().split('T')[0],
        sessionType: 'followup',
        description: '',
        nextSessionNotes: '',
        progress: '',
        mood: ''
    });

    useEffect(() => {
        loadSessions();
        loadMetaLabels();
    }, [client]);

    const loadSessions = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await treatmentSessionService.getAllForClient(client._id);
            console.log('Sessions response:', response.data); // Debug log

            // Handle different response structures  
            let sessionsData = [];
            if (response.data?.data?.sessions) {
                sessionsData = response.data.data.sessions;
            } else if (response.data?.sessions) {
                sessionsData = response.data.sessions;
            } else if (response.data?.data) {
                sessionsData = Array.isArray(response.data.data) ? response.data.data : [];
            }

            setSessions(sessionsData);
        } catch (err) {
            console.error('Error loading treatment sessions:', err);
            setError('שגיאה בטעינת פגישות הטיפול');
            setSessions([]); // Ensure sessions is always an array
        } finally {
            setLoading(false);
        }
    };

    const loadMetaLabels = async () => {
        try {
            const response = await treatmentSessionService.getMetaLabels();
            console.log('Meta labels response:', response.data); // Debug log
            setMetaLabels(response.data.data || {});
        } catch (err) {
            console.error('Error loading meta labels:', err);
            // Set default labels in case of error
            setMetaLabels({
                sessionTypes: {
                    intake: 'אינטייק',
                    followup: 'פגישת מעקב',
                    assessment: 'הערכה',
                    therapy: 'טיפול',
                    summary: 'סיכום',
                    emergency: 'חירום',
                    consultation: 'ייעוץ',
                    other: 'אחר'
                },
                moods: {
                    excellent: 'מצוין',
                    good: 'טוב',
                    neutral: 'נייטרלי',
                    difficult: 'קשה',
                    very_difficult: 'קשה מאוד'
                },
                progress: {
                    significant_improvement: 'שיפור משמעותי',
                    improvement: 'שיפור',
                    stable: 'יציב',
                    slight_decline: 'ירידה קלה',
                    decline: 'ירידה'
                }
            });
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const sessionData = {
                ...formData,
                clientId: client._id
            };

            if (editingSession) {
                await treatmentSessionService.update(editingSession._id, sessionData);
                setSuccess('פגישת הטיפול עודכנה בהצלחה');
                setEditingSession(null);
            } else {
                await treatmentSessionService.create(sessionData);
                setSuccess('פגישת הטיפול נוספה בהצלחה');
            }

            setFormData({
                sessionDate: new Date().toISOString().split('T')[0],
                sessionType: 'followup',
                description: '',
                nextSessionNotes: '',
                progress: '',
                mood: ''
            });
            setShowForm(false);
            loadSessions();
        } catch (err) {
            console.error('Error saving treatment session:', err);
            setError('שגיאה בשמירת פגישת הטיפול');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (session) => {
        setFormData({
            sessionDate: session.sessionDate ? session.sessionDate.split('T')[0] : '',
            sessionType: session.sessionType || 'followup',
            description: session.description || '',
            nextSessionNotes: session.nextSessionNotes || '',
            progress: session.progress || '',
            mood: session.mood || ''
        });
        setEditingSession(session);
        setShowForm(true);
    };

    const handleDelete = async () => {
        if (!sessionToDelete) return;

        try {
            setLoading(true);
            await treatmentSessionService.remove(sessionToDelete._id);
            setSuccess('פגישת הטיפול נמחקה בהצלחה');
            loadSessions();
        } catch (err) {
            console.error('Error deleting treatment session:', err);
            setError('שגיאה במחיקת פגישת הטיפול');
        } finally {
            setLoading(false);
            setDeleteDialogOpen(false);
            setSessionToDelete(null);
        }
    };

    const handleCancel = () => {
        setFormData({
            sessionDate: new Date().toISOString().split('T')[0],
            sessionType: 'followup',
            description: '',
            nextSessionNotes: '',
            progress: '',
            mood: ''
        });
        setEditingSession(null);
        setShowForm(false);
        setError('');
    };

    const toggleRowExpansion = (sessionId) => {
        setExpandedRow(expandedRow === sessionId ? null : sessionId);
    };

    const getProgressColor = (progress) => {
        switch (progress) {
            case 'significant_improvement':
                return 'success';
            case 'improvement':
                return 'info';
            case 'stable':
                return 'warning';
            case 'slight_decline':
            case 'decline':
                return 'error';
            default:
                return 'default';
        }
    };

    const getMoodColor = (mood) => {
        switch (mood) {
            case 'excellent':
            case 'good':
                return 'success';
            case 'neutral':
                return 'warning';
            case 'difficult':
            case 'very_difficult':
                return 'error';
            default:
                return 'default';
        }
    };

    if (loading && (!Array.isArray(sessions) || sessions.length === 0)) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Alerts */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">תיעוד טיפול</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowForm(!showForm)}
                    disabled={loading}
                >
                    {showForm ? 'ביטול' : 'הוספת פגישה'}
                </Button>
            </Box>

            {/* Add Session Form */}
            {showForm && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        {editingSession ? 'עריכת פגישת טיפול' : 'הוספת פגישת טיפול חדשה'}
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="תאריך הפגישה"
                                    name="sessionDate"
                                    type="date"
                                    value={formData.sessionDate}
                                    onChange={handleFormChange}
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>סוג פגישה</InputLabel>
                                    <Select
                                        name="sessionType"
                                        value={formData.sessionType}
                                        onChange={handleFormChange}
                                        label="סוג פגישה"
                                    >
                                        {Object.entries(metaLabels?.sessionTypes || {}).map(([key, label]) => (
                                            <MenuItem key={key} value={key}>{label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="תיאור הפגישה *"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    fullWidth
                                    multiline
                                    rows={4}
                                    required
                                    placeholder="תאר את מה שקרה בפגישה, נושאים שנדונו, התקדמות..."
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="דגשים לפגישה הבאה"
                                    name="nextSessionNotes"
                                    value={formData.nextSessionNotes}
                                    onChange={handleFormChange}
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder="מה חשוב להזכר או להמשיך בפגישה הבאה..."
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>התקדמות</InputLabel>
                                    <Select
                                        name="progress"
                                        value={formData.progress}
                                        onChange={handleFormChange}
                                        label="התקדמות"
                                    >
                                        <MenuItem value="">לא מוגדר</MenuItem>
                                        {Object.entries(metaLabels?.progress || {}).map(([key, label]) => (
                                            <MenuItem key={key} value={key}>{label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>מצב רוח</InputLabel>
                                    <Select
                                        name="mood"
                                        value={formData.mood}
                                        onChange={handleFormChange}
                                        label="מצב רוח"
                                    >
                                        <MenuItem value="">לא מוגדר</MenuItem>
                                        {Object.entries(metaLabels?.moods || {}).map(([key, label]) => (
                                            <MenuItem key={key} value={key}>{label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Box display="flex" gap={2} mt={3}>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<SaveIcon />}
                                disabled={loading}
                            >
                                {editingSession ? 'עדכן פגישה' : 'שמור פגישה'}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={handleCancel}
                            >
                                ביטול
                            </Button>
                        </Box>
                    </form>
                </Paper>
            )}

            {/* Sessions Table */}
            {!Array.isArray(sessions) || sessions.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        עדיין לא נרשמו פגישות טיפול עבור לקוח זה
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell width="50px"></TableCell>
                                <TableCell>מס' פגישה</TableCell>
                                <TableCell>תאריך</TableCell>
                                <TableCell>סוג פגישה</TableCell>
                                <TableCell>התקדמות</TableCell>
                                <TableCell>מצב רוח</TableCell>
                                <TableCell width="120px">פעולות</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Array.isArray(sessions) && sessions.map((session) => (
                                <React.Fragment key={session._id}>
                                    <TableRow>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => toggleRowExpansion(session._id)}
                                            >
                                                {expandedRow === session._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                #{session.sessionNumber}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(session.sessionDate || session.createdAt), 'dd/MM/yyyy', { locale: he })}
                                        </TableCell>
                                        <TableCell>
                                            {metaLabels?.sessionTypes?.[session.sessionType] || session.sessionType}
                                        </TableCell>
                                        <TableCell>
                                            {session.progress && (
                                                <Chip
                                                    label={metaLabels?.progress?.[session.progress] || session.progress}
                                                    color={getProgressColor(session.progress)}
                                                    size="small"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {session.mood && (
                                                <Chip
                                                    label={metaLabels?.moods?.[session.mood] || session.mood}
                                                    color={getMoodColor(session.mood)}
                                                    size="small"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(session)}
                                                title="עריכה"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setSessionToDelete(session);
                                                    setDeleteDialogOpen(true);
                                                }}
                                                title="מחיקה"
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                                            <Collapse in={expandedRow === session._id} timeout="auto" unmountOnExit>
                                                <Box sx={{ margin: 2 }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        תיאור הפגישה:
                                                    </Typography>
                                                    <Typography variant="body2" paragraph>
                                                        {session.description || 'אין תיאור'}
                                                    </Typography>

                                                    {session.nextSessionNotes && (
                                                        <>
                                                            <Typography variant="subtitle2" gutterBottom>
                                                                דגשים לפגישה הבאה:
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {session.nextSessionNotes}
                                                            </Typography>
                                                        </>
                                                    )}
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            )) || []}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>מחיקת פגישת טיפול</DialogTitle>
                <DialogContent>
                    <Typography>
                        האם אתה בטוח שברצונך למחוק את פגישת הטיפול #{sessionToDelete?.sessionNumber}?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        פעולה זו אינה ניתנת לביטול.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>ביטול</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        מחק
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}