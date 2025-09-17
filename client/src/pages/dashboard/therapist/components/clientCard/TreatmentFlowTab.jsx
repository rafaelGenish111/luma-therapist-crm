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
import appointmentService from '../../../../../services/appointmentService';

const TreatmentFlowTab = ({ client }) => {
    const [sessions, setSessions] = useState([]);
    const [completedAppointments, setCompletedAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [expandedRow, setExpandedRow] = useState(null);
    const [metaLabels, setMetaLabels] = useState({});
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('timeline'); // timeline או table
    const [aiInsightsOpen, setAiInsightsOpen] = useState(false);
    const [documentationDialogOpen, setDocumentationDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showDocumentationForm, setShowDocumentationForm] = useState(false);
    const [documentationForm, setDocumentationForm] = useState({
        sessionDate: '',
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
        loadCompletedAppointments();
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

    const loadCompletedAppointments = async () => {
        try {
            console.log('Loading completed appointments...');
            const response = await appointmentService.getByClient(client._id);
            console.log('Appointments response:', response);
            const allAppointments = response.appointments || [];
            console.log('All appointments:', allAppointments);
            const completed = allAppointments.filter(apt =>
                (apt.status === 'completed' || apt.status === 'בוצעה') &&
                !apt.metadata?.documented
            );
            console.log('Completed appointments (not documented):', completed);
            setCompletedAppointments(completed);
        } catch (err) {
            console.error('Error loading completed appointments:', err);
        }
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

    const toggleRowExpansion = (sessionId) => {
        setExpandedRow(expandedRow === sessionId ? null : sessionId);
    };

    const handleOpenDocumentationDialog = (appointment) => {
        setSelectedAppointment(appointment);
        setDocumentationDialogOpen(true);
    };

    const handleCloseDocumentationDialog = () => {
        setDocumentationDialogOpen(false);
        setSelectedAppointment(null);
        setShowDocumentationForm(false);
        setDocumentationForm({
            sessionDate: '',
            sessionType: 'followup',
            description: '',
            nextSessionNotes: '',
            progress: '',
            mood: '',
            tags: ''
        });
    };

    const handleOpenDocumentationForm = () => {
        if (selectedAppointment) {
            setDocumentationForm({
                sessionDate: selectedAppointment.date.split('T')[0],
                sessionType: 'followup',
                description: selectedAppointment.description || '',
                nextSessionNotes: '',
                progress: '',
                mood: '',
                tags: ''
            });
            setShowDocumentationForm(true);
        }
    };

    const handleDocumentationFormChange = (e) => {
        const { name, value } = e.target;
        setDocumentationForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitDocumentation = async () => {
        try {
            const sessionData = {
                clientId: client._id,
                appointmentId: selectedAppointment._id,
                sessionDate: documentationForm.sessionDate,
                sessionType: documentationForm.sessionType,
                description: documentationForm.description,
                nextSessionNotes: documentationForm.nextSessionNotes,
                progress: documentationForm.progress,
                mood: documentationForm.mood,
                tags: documentationForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            };

            await treatmentSessionService.create(sessionData);
            setSuccess('הפגישה תועדה בהצלחה');

            // עדכן את הרשימות
            loadSessions();

            // טען מחדש את רשימת הפגישות כדי לקבל את הנתונים העדכניים מהשרת
            loadCompletedAppointments();

            handleCloseDocumentationDialog();
        } catch (err) {
            setError('שגיאה בתיעוד הפגישה');
        }
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
                        {searchTerm ? 'לא נמצאו תוצאות עבור החיפוש' : 'עדיין לא תועדו פגישות טיפול'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        פגישות יופיעו כאן לאחר שיועדו בטאב "פגישות"
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

            {/* פגישות שהסתיימו */}
            {completedAppointments.length > 0 && (
                <Paper sx={{ mb: 3 }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">פגישות שהסתיימו - מוכנות לתיעוד</Typography>
                    </Box>
                    <Divider />
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>תאריך</TableCell>
                                    <TableCell>סוג פגישה</TableCell>
                                    <TableCell>משך</TableCell>
                                    <TableCell>תיאור</TableCell>
                                    <TableCell>פעולות</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {completedAppointments.map((appointment) => (
                                    <TableRow key={appointment._id}>
                                        <TableCell>{format(new Date(appointment.date), 'dd/MM/yyyy HH:mm', { locale: he })}</TableCell>
                                        <TableCell>{appointment.type}</TableCell>
                                        <TableCell>{appointment.duration} דקות</TableCell>
                                        <TableCell>{appointment.description || 'ללא תיאור'}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<AddIcon />}
                                                onClick={() => handleOpenDocumentationDialog(appointment)}
                                            >
                                                תיעוד פגישה
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Header & Controls */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Typography variant="h6">היסטוריית טיפול</Typography>
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
                    <Typography variant="body2" color="text.secondary">
                        פגישות מתועדות - לתזמון פגישות חדשות עבור לטאב "פגישות"
                    </Typography>
                </Box>
            </Box>


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

            {/* דיאלוג תיעוד פגישה */}
            <Dialog
                open={documentationDialogOpen}
                onClose={handleCloseDocumentationDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    תיעוד פגישה - {selectedAppointment?.type}
                </DialogTitle>
                <DialogContent>
                    {selectedAppointment && (
                        <Box sx={{ pt: 2 }}>
                            {!showDocumentationForm ? (
                                <>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                תאריך הפגישה:
                                            </Typography>
                                            <Typography variant="body1">
                                                {format(new Date(selectedAppointment.date), 'dd/MM/yyyy HH:mm', { locale: he })}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                משך הפגישה:
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedAppointment.duration} דקות
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                תיאור הפגישה:
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedAppointment.description || 'ללא תיאור'}
                                            </Typography>
                                        </Grid>
                                    </Grid>

                                    <Divider sx={{ my: 3 }} />

                                    <Typography variant="h6" gutterBottom>
                                        תיעוד הפגישה
                                    </Typography>

                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        💡 לאחר תיעוד הפגישה, היא תופיע בהיסטוריית הטיפול ותוכל להוסיף הערות, תגיות ומידע נוסף
                                    </Alert>

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        לחץ על "פתח טופס תיעוד" כדי להתחיל לתעד את הפגישה.
                                    </Typography>
                                </>
                            ) : (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        טופס תיעוד פגישה
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="תאריך הפגישה"
                                                type="date"
                                                name="sessionDate"
                                                value={documentationForm.sessionDate}
                                                onChange={handleDocumentationFormChange}
                                                fullWidth
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>סוג פגישה</InputLabel>
                                                <Select
                                                    name="sessionType"
                                                    value={documentationForm.sessionType}
                                                    onChange={handleDocumentationFormChange}
                                                    label="סוג פגישה"
                                                >
                                                    <MenuItem value="intake">אינטייק</MenuItem>
                                                    <MenuItem value="followup">פגישת מעקב</MenuItem>
                                                    <MenuItem value="assessment">הערכה</MenuItem>
                                                    <MenuItem value="therapy">טיפול</MenuItem>
                                                    <MenuItem value="summary">סיכום</MenuItem>
                                                    <MenuItem value="emergency">חירום</MenuItem>
                                                    <MenuItem value="consultation">ייעוץ</MenuItem>
                                                    <MenuItem value="other">אחר</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="תיאור הפגישה"
                                                name="description"
                                                value={documentationForm.description}
                                                onChange={handleDocumentationFormChange}
                                                multiline
                                                rows={4}
                                                fullWidth
                                                placeholder="תאר את מה שקרה בפגישה, הנושאים שדנו בהם, והתקדמות שהושגה..."
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="הערות לפגישה הבאה"
                                                name="nextSessionNotes"
                                                value={documentationForm.nextSessionNotes}
                                                onChange={handleDocumentationFormChange}
                                                multiline
                                                rows={2}
                                                fullWidth
                                                placeholder="מה חשוב לזכור לפגישה הבאה? איזה נושאים לטפל בהם?"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>התקדמות</InputLabel>
                                                <Select
                                                    name="progress"
                                                    value={documentationForm.progress}
                                                    onChange={handleDocumentationFormChange}
                                                    label="התקדמות"
                                                >
                                                    <MenuItem value="significant_improvement">שיפור משמעותי</MenuItem>
                                                    <MenuItem value="improvement">שיפור</MenuItem>
                                                    <MenuItem value="stable">יציב</MenuItem>
                                                    <MenuItem value="slight_decline">ירידה קלה</MenuItem>
                                                    <MenuItem value="decline">ירידה</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>מצב רוח</InputLabel>
                                                <Select
                                                    name="mood"
                                                    value={documentationForm.mood}
                                                    onChange={handleDocumentationFormChange}
                                                    label="מצב רוח"
                                                >
                                                    <MenuItem value="excellent">מצוין</MenuItem>
                                                    <MenuItem value="good">טוב</MenuItem>
                                                    <MenuItem value="neutral">נייטרלי</MenuItem>
                                                    <MenuItem value="difficult">קשה</MenuItem>
                                                    <MenuItem value="very_difficult">קשה מאוד</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="תגיות (מופרדות בפסיקים)"
                                                name="tags"
                                                value={documentationForm.tags}
                                                onChange={handleDocumentationFormChange}
                                                fullWidth
                                                placeholder="דיכאון, חרדה, זוגיות, עבודה..."
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDocumentationDialog}>
                        {showDocumentationForm ? 'ביטול' : 'סגור'}
                    </Button>
                    {!showDocumentationForm ? (
                        <Button
                            variant="contained"
                            onClick={handleOpenDocumentationForm}
                        >
                            פתח טופס תיעוד
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleSubmitDocumentation}
                        >
                            שמור תיעוד
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TreatmentFlowTab;
