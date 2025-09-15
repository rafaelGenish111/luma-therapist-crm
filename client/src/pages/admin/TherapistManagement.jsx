import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Button,
    Paper,
    Card,
    CardContent,
    Grid,
    Chip,
    Avatar,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Divider,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    Add,
    Email,
    CheckCircle,
    Cancel,
    MoreVert,
    Visibility,
    Edit,
    Delete,
    PersonAdd,
    Pending,
    Verified
} from '@mui/icons-material';
import { professionalTokens } from '../../theme/professionalTokens';
import PendingTherapistsTable from '../../components/admin/PendingTherapistsTable';
import ApprovedTherapistsTable from '../../components/admin/ApprovedTherapistsTable';
import SendInvitationDialog from '../../components/admin/SendInvitationDialog';

const TherapistManagement = () => {
    const [currentTab, setCurrentTab] = useState(0);
    const [pendingTherapists, setPendingTherapists] = useState([]);
    const [approvedTherapists, setApprovedTherapists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showInvitationDialog, setShowInvitationDialog] = useState(false);
    const [statistics, setStatistics] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        active: 0
    });

    useEffect(() => {
        fetchTherapists();
        fetchStatistics();
    }, []);

    const fetchTherapists = async () => {
        setLoading(true);
        try {
            // Fetch pending therapists
            const pendingResponse = await fetch('/api/admin/therapists/pending', {
                credentials: 'include'
            });
            const pendingData = await pendingResponse.json();
            if (pendingData.success) {
                setPendingTherapists(pendingData.data);
            }

            // Fetch approved therapists
            const approvedResponse = await fetch('/api/admin/therapists/approved', {
                credentials: 'include'
            });
            const approvedData = await approvedResponse.json();
            if (approvedData.success) {
                setApprovedTherapists(approvedData.data);
            }
        } catch (error) {
            console.error('Error fetching therapists:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await fetch('/api/admin/therapists/statistics', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setStatistics(data.data);
            }
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const handleApproveTherapist = async (therapistId) => {
        try {
            const response = await fetch(`/api/admin/therapists/${therapistId}/approve`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                // Move therapist from pending to approved
                const therapist = pendingTherapists.find(t => t._id === therapistId);
                setPendingTherapists(prev => prev.filter(t => t._id !== therapistId));
                setApprovedTherapists(prev => [...prev, { ...therapist, status: 'approved' }]);
                
                // Update statistics
                setStatistics(prev => ({
                    ...prev,
                    pending: prev.pending - 1,
                    approved: prev.approved + 1
                }));
                
                alert('המטפלת אושרה בהצלחה!');
            } else {
                alert('שגיאה באישור המטפלת: ' + data.error);
            }
        } catch (error) {
            console.error('Error approving therapist:', error);
            alert('שגיאה באישור המטפלת');
        }
    };

    const handleRejectTherapist = async (therapistId, reason) => {
        try {
            const response = await fetch(`/api/admin/therapists/${therapistId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ reason })
            });
            const data = await response.json();
            
            if (data.success) {
                setPendingTherapists(prev => prev.filter(t => t._id !== therapistId));
                setStatistics(prev => ({
                    ...prev,
                    pending: prev.pending - 1
                }));
                
                alert('המטפלת נדחתה. נשלח אליה מייל עם הסיבה.');
            } else {
                alert('שגיאה בדחיית המטפלת: ' + data.error);
            }
        } catch (error) {
            console.error('Error rejecting therapist:', error);
            alert('שגיאה בדחיית המטפלת');
        }
    };

    const statisticsCards = [
        {
            title: 'סה"כ מטפלות',
            value: statistics.total,
            icon: <PersonAdd />,
            color: professionalTokens.colors.primary
        },
        {
            title: 'ממתינות לאישור',
            value: statistics.pending,
            icon: <Pending />,
            color: '#ff9800'
        },
        {
            title: 'מאושרות',
            value: statistics.approved,
            icon: <Verified />,
            color: '#4caf50'
        },
        {
            title: 'פעילות',
            value: statistics.active,
            icon: <CheckCircle />,
            color: '#2196f3'
        }
    ];

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: professionalTokens.colors.primary }}>
                    ניהול מטפלות
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setShowInvitationDialog(true)}
                    sx={{
                        background: `linear-gradient(135deg, ${professionalTokens.colors.primary}, ${professionalTokens.colors.primaryLight})`,
                        px: 3
                    }}
                >
                    הזמן מטפלת חדשה
                </Button>
            </Box>

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statisticsCards.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom variant="body2">
                                            {stat.title}
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: stat.color }}>
                                            {stat.value}
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                                        {stat.icon}
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Tabs */}
            <Paper sx={{ borderRadius: 2 }}>
                <Tabs
                    value={currentTab}
                    onChange={(e, newValue) => setCurrentTab(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                >
                    <Tab 
                        label={`ממתינות לאישור (${statistics.pending})`}
                        icon={<Pending />}
                        iconPosition="start"
                    />
                    <Tab 
                        label={`מטפלות מאושרות (${statistics.approved})`}
                        icon={<Verified />}
                        iconPosition="start"
                    />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {currentTab === 0 && (
                        <PendingTherapistsTable
                            therapists={pendingTherapists}
                            onApprove={handleApproveTherapist}
                            onReject={handleRejectTherapist}
                            loading={loading}
                        />
                    )}
                    
                    {currentTab === 1 && (
                        <ApprovedTherapistsTable
                            therapists={approvedTherapists}
                            onRefresh={fetchTherapists}
                            loading={loading}
                        />
                    )}
                </Box>
            </Paper>

            {/* Send Invitation Dialog */}
            <SendInvitationDialog
                open={showInvitationDialog}
                onClose={() => setShowInvitationDialog(false)}
                onSuccess={() => {
                    setShowInvitationDialog(false);
                    // Could refresh statistics here
                }}
            />
        </Box>
    );
};

export default TherapistManagement;
