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
    DialogActions,
    Card,
    CardContent,
    Tabs,
    Tab,
    Divider,
    Badge
} from '@mui/material';
import {
    Add as AddIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Psychology as PsychologyIcon,
    Timeline as TimelineIcon,
    TrendingUp as TrendingUpIcon,
    Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

import treatmentSessionService from '../../../../../services/treatmentSessionService';

const TreatmentFlowTab = ({ client }) => {
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
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('timeline'); // timeline או table
    const [aiInsightsOpen, setAiInsightsOpen] = useState(false);

    const [formData, setFormData] = useState({
        sessionDate: new Date().toISOString().split('T')[0],
        sessionType: 'followup',
        description: '',
        nextSessionNotes: '',
        progress: '',
        mood: '',
        tags: ''
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
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const loadMetaLabels = async () => {
        try {
            const response = await treatmentSessionService.getMetaLabels();
            setMetaLabels(response.data.data || {
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
        } catch (err) {
            console.error('Error loading meta labels:', err);
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
                clientId: client._id,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
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
                mood: '',
                tags: ''
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
            mood: session.mood || '',
            tags: session.tags?.join(', ') || ''
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
            mood: '',
            tags: ''
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
            case 'significant_improvement': return 'success';
            case 'improvement': return 'info';
            case 'stable': return 'warning';
            case 'slight_decline':
            case 'decline': return 'error';
            default: return 'default';
        }
    };

    const getMoodColor = (mood) => {
        switch (mood) {
            case 'excellent':
            case 'good': return 'success';
            case 'neutral': return 'warning';
            case 'difficult':
            case 'very_difficult': return 'error';
            default: return 'default';
        }
    };

    const getFilteredSessions = () => {
        if (!searchTerm) return sessions;

        return sessions.filter(session => {
            const searchLower = searchTerm.toLowerCase();
            return (
                session.description?.toLowerCase().includes(searchLower) ||
                session.nextSessionNotes?.toLowerCase().includes(searchLower) ||
                session.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
                metaLabels.sessionTypes?.[session.sessionType]?.toLowerCase().includes(searchLower) ||
                metaLabels.moods?.[session.mood]?.toLowerCase().includes(searchLower) ||
                metaLabels.progress?.[session.progress]?.toLowerCase().includes(searchLower)
            );
        });
    };

    const calculateStats = () => {
        if (!sessions.length) return { totalSessions: 0, improvementRate: 0, recentTrend: 'stable' };

        const totalSessions = sessions.length;
        const improvedSessions = sessions.filter(s =>
            s.progress === 'significant_improvement' || s.progress === 'improvement'
        ).length;
        const improvementRate = Math.round((improvedSessions / totalSessions) * 100);

        // חישוב מגמה אחרונה
        const recentSessions = sessions.slice(-3);
        const recentImproved = recentSessions.filter(s =>
            s.progress === 'significant_improvement' || s.progress === 'improvement'
        ).length;

        let recentTrend = 'stable';
        if (recentImproved >= recentSessions.length * 0.7) recentTrend = 'improvement';
        else if (recentImproved <= recentSessions.length * 0.3) recentTrend = 'decline';

        return { totalSessions, improvementRate, recentTrend };
    };

    const renderTimelineView = () => {
        const filteredSessions = getFilteredSessions();

        if (filteredSessions.length === 0) {
            return (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <PsychologyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        {searchTerm ? 'לא נמצאו תוצאות עבור החיפוש' : 'עדיין לא נרשמו פגישות טיפול'}
                    </Typography>
                    {searchTerm && (
                        <Button onClick={() => setSearchTerm('')} sx={{ mt: 2 }}>
                            נקה חיפוש
                        </Button>
                    )}
                </Paper>
            );
        }

        return (
            <Box>
                {filteredSessions.map((session, index) => (
                    <Card key={session._id} sx={{ mb: 3, position: 'relative' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                                <Typography variant="h6" color="primary">
                                    פגישה {sessions.length - index} - {metaLabels.sessionTypes?.[session.sessionType] || session.sessionType}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {session.sessionDate ? format(new Date(session.sessionDate), 'dd/MM/yyyy', { locale: he }) : 'ללא תאריך'}
                                </Typography>
                            </Box>

                            <Box display="flex" gap={1} mb={2}>
                                {session.mood && (
                                    <Chip
                                        label={metaLabels.moods?.[session.mood] || session.mood}
                                        color={getMoodColor(session.mood)}
                                        size="small"
                                    />
                                )}
                                {session.progress && (
                                    <Chip
                                        label={metaLabels.progress?.[session.progress] || session.progress}
                                        color={getProgressColor(session.progress)}
                                        size="small"
                                    />
                                )}
                            </Box>

                            {session.description && (
                                <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                                    {session.description}
                                </Typography>
                            )}

                            {session.nextSessionNotes && (
                                <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                                    <Typography variant="body2" color="primary.main">
                                        <strong>לפגישה הבאה:</strong> {session.nextSessionNotes}
                                    </Typography>
                                </Paper>
                            )}

                            {session.tags && session.tags.length > 0 && (
                                <Box display="flex" gap={0.5} flexWrap="wrap" mb={2}>
                                    {session.tags.map((tag, tagIndex) => (
                                        <Chip
                                            key={tagIndex}
                                            label={tag}
                                            size="small"
                                            variant="outlined"
                                            onClick={() => setSearchTerm(tag)}
                                            sx={{ cursor: 'pointer' }}
                                        />
                                    ))}
                                </Box>
                            )}

                            <Box display="flex" justifyContent="flex-end" gap={1}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleEdit(session)}
                                    color="primary"
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setSessionToDelete(session);
                                        setDeleteDialogOpen(true);
                                    }}
                                    color="error"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        );
    };

    const renderTableView = () => {
        const filteredSessions = getFilteredSessions();

        return (
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
                        {filteredSessions.map((session, index) => (
                            <React.Fragment key={session._id}>
                                <TableRow>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => toggleRowExpansion(session._id)}
                                        >
                                            {expandedRow === session._id ?
                                                <ExpandLessIcon /> : <ExpandMoreIcon />
                                            }
                                        </IconButton>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            פגישה {sessions.length - index}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {session.sessionDate ?
                                            format(new Date(session.sessionDate), 'dd/MM/yyyy', { locale: he })
                                            : 'ללא תאריך'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {metaLabels.sessionTypes?.[session.sessionType] || session.sessionType}
                                    </TableCell>
                                    <TableCell>
                                        {session.progress && (
                                            <Chip
                                                label={metaLabels.progress?.[session.progress] || session.progress}
                                                color={getProgressColor(session.progress)}
                                                size="small"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {session.mood && (
                                            <Chip
                                                label={metaLabels.moods?.[session.mood] || session.mood}
                                                color={getMoodColor(session.mood)}
                                                size="small"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEdit(session)}
                                            color="primary"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setSessionToDelete(session);
                                                setDeleteDialogOpen(true);
                                            }}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                                        <Collapse in={expandedRow === session._id} timeout="auto" unmountOnExit>
                                            <Box sx={{ margin: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                {session.description && (
                                                    <Typography variant="body2" paragraph>
                                                        <strong>תיאור הפגישה:</strong><br />
                                                        {session.description}
                                                    </Typography>
                                                )}
                                                {session.nextSessionNotes && (
                                                    <Typography variant="body2" paragraph>
                                                        <strong>לפגישה הבאה:</strong><br />
                                                        {session.nextSessionNotes}
                                                    </Typography>
                                                )}
                                                {session.tags && session.tags.length > 0 && (
                                                    <Box display="flex" gap={0.5} flexWrap="wrap">
                                                        <Typography variant="body2" sx={{ mr: 1 }}>
                                                            <strong>תגיות:</strong>
                                                        </Typography>
                                                        {session.tags.map((tag, tagIndex) => (
                                                            <Chip
                                                                key={tagIndex}
                                                                label={tag}
                                                                size="small"
                                                                variant="outlined"
                                                                onClick={() => setSearchTerm(tag)}
                                                                sx={{ cursor: 'pointer' }}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const stats = calculateStats();

    if (loading && sessions.length === 0) {
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

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <PsychologyIcon color="primary" />
                                <Box>
                                    <Typography variant="h4" color="primary">
                                        {stats.totalSessions}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        סה"כ פגישות
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <TrendingUpIcon color="success" />
                                <Box>
                                    <Typography variant="h4" color="success.main">
                                        {stats.improvementRate}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        שיפור כללי
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <TimelineIcon color={stats.recentTrend === 'improvement' ? 'success' :
                                    stats.recentTrend === 'decline' ? 'error' : 'warning'} />
                                <Box>
                                    <Typography variant="h6" color={
                                        stats.recentTrend === 'improvement' ? 'success.main' :
                                            stats.recentTrend === 'decline' ? 'error.main' : 'warning.main'
                                    }>
                                        {stats.recentTrend === 'improvement' ? 'שיפור' :
                                            stats.recentTrend === 'decline' ? 'ירידה' : 'יציב'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        מגמה אחרונה
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ cursor: 'pointer' }} onClick={() => setAiInsightsOpen(true)}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <AnalyticsIcon color="info" />
                                <Box>
                                    <Typography variant="h6" color="info.main">
                                        AI תובנות
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        ניתוח מתקדם
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Header & Controls */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Typography variant="h6">תיעוד טיפול</Typography>
                <Box display="flex" gap={2} alignItems="center">
                    <TextField
                        placeholder="חיפוש בפגישות..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                        sx={{ minWidth: 200 }}
                    />
                    <Tabs
                        value={viewMode}
                        onChange={(e, newValue) => setViewMode(newValue)}
                        size="small"
                    >
                        <Tab label="ציר זמן" value="timeline" />
                        <Tab label="טבלה" value="table" />
                    </Tabs>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowForm(!showForm)}
                        disabled={loading}
                    >
                        {showForm ? 'ביטול' : 'הוספת פגישה'}
                    </Button>
                </Box>
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
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>התקדמות</InputLabel>
                                    <Select
                                        name="progress"
                                        value={formData.progress}
                                        onChange={handleFormChange}
                                        label="התקדמות"
                                    >
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
                                        {Object.entries(metaLabels?.moods || {}).map(([key, label]) => (
                                            <MenuItem key={key} value={key}>{label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="תיאור הפגישה"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    multiline
                                    rows={4}
                                    fullWidth
                                    placeholder="תאר את מהלך הפגישה, נושאים שנדונו, שיטות טיפול שנעשה בהן שימוש..."
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="הערות לפגישה הבאה"
                                    name="nextSessionNotes"
                                    value={formData.nextSessionNotes}
                                    onChange={handleFormChange}
                                    multiline
                                    rows={2}
                                    fullWidth
                                    placeholder="מטלות, נושאים לטיפול, המשך לפגישה הבאה..."
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="תגיות"
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleFormChange}
                                    fullWidth
                                    placeholder="הפרד בפסיקים: חרדה, EMDR, נשימות, התקדמות..."
                                    helperText="תגיות עוזרות לחיפוש ולארגון הפגישות"
                                />
                            </Grid>
                        </Grid>

                        <Box mt={3} display="flex" gap={2}>
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

            {/* Results Counter */}
            {searchTerm && (
                <Box mb={2}>
                    <Chip
                        label={`${getFilteredSessions().length} תוצאות עבור "${searchTerm}"`}
                        onDelete={() => setSearchTerm('')}
                        color="primary"
                        variant="outlined"
                    />
                </Box>
            )}

            {/* Sessions Content */}
            {viewMode === 'timeline' ? renderTimelineView() : renderTableView()}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>מחיקת פגישת טיפול</DialogTitle>
                <DialogContent>
                    <Typography>
                        האם את בטוחה שברצונך למחוק פגישת טיפול זו? פעולה זו אינה ניתנת לביטול.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>ביטול</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        מחק
                    </Button>
                </DialogActions>
            </Dialog>

            {/* AI Insights Dialog */}
            <Dialog
                open={aiInsightsOpen}
                onClose={() => setAiInsightsOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={2}>
                        <AnalyticsIcon color="info" />
                        תובנות AI - ניתוח טיפולי
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        {/* Summary Card */}
                        <Card sx={{ mb: 3, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                            <CardContent>
                                <Typography variant="h6" color="success.main" gutterBottom>
                                    📋 סיכום כללי
                                </Typography>
                                <Typography variant="body1">
                                    המטופלת הראתה שיפור משמעותי במהלך {stats.totalSessions} פגישות הטיפול.
                                    קצב ההתקדמות היה יציב עם פריצות דרך מרכזיות בפגישות האחרונות.
                                </Typography>
                            </CardContent>
                        </Card>

                        {/* Key Achievements */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    🎯 הישגים מרכזיים
                                </Typography>
                                <Box component="ul" sx={{ pl: 3 }}>
                                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                        ✅ שיפור משמעותי ברמות החרדה
                                    </Typography>
                                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                        ✅ שיפור באיכות השינה דרך טכניקות נשימה
                                    </Typography>
                                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                        ✅ חזרה לפעילויות חברתיות (קפה עם חברות)
                                    </Typography>
                                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                        ✅ פיתוח כלי התמודדות יעילים
                                    </Typography>
                                    <Typography component="li" variant="body2">
                                        ✅ עיבוד טראומה מוצלח באמצעות EMDR
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Treatment Patterns */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📈 דפוסי טיפול
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="primary">
                                            שיטות טיפול יעילות:
                                        </Typography>
                                        <Typography variant="body2">
                                            • טכניקות נשימה ומיינדפולנס<br />
                                            • EMDR לעיבוד טראומה<br />
                                            • יומן הישגים<br />
                                            • עבודה על בניית ביטחון עצמי
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="warning.main">
                                            אזורים לתשומת לב:
                                        </Typography>
                                        <Typography variant="body2">
                                            • חיזוק כלי ההתמודדות<br />
                                            • מניעת נסיגות<br />
                                            • המשך מעקב חודשי<br />
                                            • חיזוק רשת התמיכה החברתית
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Recommendations */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    💡 המלצות לטיפול
                                </Typography>
                                <Box component="ul" sx={{ pl: 3 }}>
                                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                        המשך פגישות דו-שבועיות לתחזוקה
                                    </Typography>
                                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                        התמקדות באסטרטגיות מניעת נסיגות
                                    </Typography>
                                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                        עידוד המשך מעורבות חברתית
                                    </Typography>
                                    <Typography component="li" variant="body2">
                                        מעקב אחר התקדמות עם מעקב מצב רוח
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAiInsightsOpen(false)} variant="contained">
                        סגור
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TreatmentFlowTab;
