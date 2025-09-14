// client/src/pages/dashboard/therapist/CampaignsPage.jsx
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Alert, Tabs, Tab, Card, CardContent, CardActions, Chip, Grid,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress,
    Fab, CircularProgress, useTheme, useMediaQuery, Tooltip
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Send as SendIcon,
    Schedule as ScheduleIcon, BarChart as StatsIcon, Email as EmailIcon,
    Group as GroupIcon, Visibility as ViewIcon, FileCopy as CopyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import campaignService from '../../../services/campaignService';
import Footer from '../../../components/common/Footer';

const CampaignsPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();

    // State management
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState(0);

    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [statsDialogOpen, setStatsDialogOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [campaignStats, setCampaignStats] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        subject: '',
        content: '',
        recipientList: [],
        scheduledAt: ''
    });

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await campaignService.getAll();
            setCampaigns(response.data.data || []);
        } catch (err) {
            setError('שגיאה בטעינת קמפיינים');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCampaign = () => {
        setSelectedCampaign(null);
        setFormData({
            name: '',
            description: '',
            subject: '',
            content: '',
            recipientList: [],
            scheduledAt: ''
        });
        setDialogOpen(true);
    };

    const handleEditCampaign = (campaign) => {
        setSelectedCampaign(campaign);
        setFormData({
            name: campaign.name,
            description: campaign.description || '',
            subject: campaign.subject,
            content: campaign.content,
            recipientList: campaign.recipientList?.map(c => c._id) || [],
            scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : ''
        });
        setDialogOpen(true);
    };

    const handleSaveCampaign = async () => {
        try {
            if (selectedCampaign) {
                await campaignService.update(selectedCampaign._id, formData);
                setSuccess('קמפיין עודכן בהצלחה');
            } else {
                await campaignService.create(formData);
                setSuccess('קמפיין נוצר בהצלחה');
            }
            
            setDialogOpen(false);
            fetchCampaigns();
        } catch (err) {
            setError('שגיאה בשמירת קמפיין');
        }
    };

    const handleSendCampaign = async (campaignId) => {
        if (!window.confirm('האם את בטוחה שברצונך לשלוח את הקמפיין?')) return;
        
        try {
            await campaignService.send(campaignId);
            setSuccess('קמפיין נשלח בהצלחה');
            fetchCampaigns();
        } catch (err) {
            setError('שגיאה בשליחת קמפיין');
        }
    };

    const handleDeleteCampaign = async (campaignId) => {
        if (!window.confirm('האם את בטוחה שברצונך למחוק את הקמפיין?')) return;
        
        try {
            await campaignService.delete(campaignId);
            setSuccess('קמפיין נמחק בהצלחה');
            fetchCampaigns();
        } catch (err) {
            setError('שגיאה במחיקת קמפיין');
        }
    };

    const handleViewStats = async (campaign) => {
        try {
            const response = await campaignService.getStats(campaign._id);
            setCampaignStats(response.data.data);
            setSelectedCampaign(campaign);
            setStatsDialogOpen(true);
        } catch (err) {
            setError('שגיאה בטעינת סטטיסטיקות');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft': return 'default';
            case 'scheduled': return 'warning';
            case 'sending': return 'info';
            case 'sent': return 'success';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'draft': return 'טיוטה';
            case 'scheduled': return 'מתוזמן';
            case 'sending': return 'נשלח';
            case 'sent': return 'נשלח';
            case 'cancelled': return 'בוטל';
            default: return status;
        }
    };

    const filteredCampaigns = campaigns.filter(campaign => {
        switch (activeTab) {
            case 0: return true; // כל הקמפיינים
            case 1: return campaign.status === 'draft'; // טיוטות
            case 2: return campaign.status === 'scheduled'; // מתוזמנים
            case 3: return campaign.status === 'sent'; // נשלחו
            default: return true;
        }
    });

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    ניהול קמפיינים
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateCampaign}
                    size={isMobile ? "small" : "medium"}
                >
                    קמפיין חדש
                </Button>
            </Box>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {/* Summary Cards */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <EmailIcon color="primary" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h4">
                                        {campaigns.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        סך הכל קמפיינים
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <SendIcon color="success" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h4">
                                        {campaigns.filter(c => c.status === 'sent').length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        קמפיינים שנשלחו
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h4">
                                        {campaigns.filter(c => c.status === 'scheduled').length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        מתוזמנים
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <EditIcon color="info" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h4">
                                        {campaigns.filter(c => c.status === 'draft').length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        טיוטות
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons="auto"
                >
                    <Tab label="כל הקמפיינים" />
                    <Tab label="טיוטות" />
                    <Tab label="מתוזמנים" />
                    <Tab label="נשלחו" />
                </Tabs>
            </Paper>

            {/* Campaigns Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>שם הקמפיין</TableCell>
                            <TableCell>נושא</TableCell>
                            <TableCell>סטטוס</TableCell>
                            <TableCell>נמענים</TableCell>
                            <TableCell>נוצר בתאריך</TableCell>
                            <TableCell align="center">פעולות</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCampaigns.map((campaign) => (
                            <TableRow key={campaign._id}>
                                <TableCell>
                                    <Typography variant="subtitle2">
                                        {campaign.name}
                                    </Typography>
                                    {campaign.description && (
                                        <Typography variant="body2" color="text.secondary">
                                            {campaign.description}
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>{campaign.subject}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={getStatusLabel(campaign.status)}
                                        color={getStatusColor(campaign.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box display="flex" alignItems="center">
                                        <GroupIcon fontSize="small" sx={{ mr: 0.5 }} />
                                        {campaign.recipientList?.length || 0}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    {new Date(campaign.createdAt).toLocaleDateString('he-IL')}
                                </TableCell>
                                <TableCell align="center">
                                    <Box display="flex" gap={1} justifyContent="center">
                                        {campaign.status === 'sent' ? (
                                            <Tooltip title="סטטיסטיקות">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleViewStats(campaign)}
                                                >
                                                    <StatsIcon />
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            <>
                                                <Tooltip title="עריכה">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEditCampaign(campaign)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                {campaign.status === 'draft' && (
                                                    <Tooltip title="שליחה">
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            onClick={() => handleSendCampaign(campaign._id)}
                                                        >
                                                            <SendIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </>
                                        )}
                                        <Tooltip title="מחיקה">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteCampaign(campaign._id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {filteredCampaigns.length === 0 && (
                <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                        אין קמפיינים להצגה
                    </Typography>
                </Box>
            )}

            {/* Create/Edit Campaign Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle>
                    {selectedCampaign ? 'עריכת קמפיין' : 'קמפיין חדש'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="שם הקמפיין"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="תיאור (אופציונלי)"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="נושא המייל"
                                value={formData.subject}
                                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="תוכן המייל"
                                value={formData.content}
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                                multiline
                                rows={6}
                                required
                                helperText="ניתן להשתמש במשתנים: {{firstName}}, {{lastName}}, {{email}}"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="תזמון שליחה (אופציונלי)"
                                type="datetime-local"
                                value={formData.scheduledAt}
                                onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>
                        ביטול
                    </Button>
                    <Button
                        onClick={handleSaveCampaign}
                        variant="contained"
                        disabled={!formData.name || !formData.subject || !formData.content}
                    >
                        {selectedCampaign ? 'עדכון' : 'יצירה'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Stats Dialog */}
            <Dialog
                open={statsDialogOpen}
                onClose={() => setStatsDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    סטטיסטיקות - {selectedCampaign?.name}
                </DialogTitle>
                <DialogContent>
                    {campaignStats && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={6}>
                                <Card variant="outlined">
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="primary">
                                            {campaignStats.sent}
                                        </Typography>
                                        <Typography variant="body2">
                                            נשלחו
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6}>
                                <Card variant="outlined">
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="success.main">
                                            {campaignStats.opened}
                                        </Typography>
                                        <Typography variant="body2">
                                            נפתחו
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6}>
                                <Card variant="outlined">
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="info.main">
                                            {campaignStats.clicked}
                                        </Typography>
                                        <Typography variant="body2">
                                            קליקים
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6}>
                                <Card variant="outlined">
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="error.main">
                                            {campaignStats.failed}
                                        </Typography>
                                        <Typography variant="body2">
                                            נכשלו
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" gutterBottom>
                                        אחוז פתיחה: {campaignStats.openRate}%
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={parseFloat(campaignStats.openRate)}
                                        sx={{ mb: 1 }}
                                    />
                                    <Typography variant="body2" gutterBottom>
                                        אחוז קליקים: {campaignStats.clickRate}%
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={parseFloat(campaignStats.clickRate)}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatsDialogOpen(false)}>
                        סגירה
                    </Button>
                </DialogActions>
            </Dialog>

            <Footer />
        </Box>
    );
};

export default CampaignsPage;