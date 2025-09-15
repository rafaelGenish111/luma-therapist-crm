import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Chip,
    IconButton,
    Button,
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Tooltip,
    Card,
    CardContent,
    Grid,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Visibility,
    Edit,
    Block,
    CheckCircle,
    Email,
    Phone,
    Work,
    MoreVert,
    Person,
    Settings,
    PersonOff
} from '@mui/icons-material';
import { professionalTokens } from '../../theme/professionalTokens';
import apiClient from '../../config/api.js';

const ApprovedTherapistsTable = ({ therapists, onRefresh, loading }) => {
    const [selectedTherapist, setSelectedTherapist] = useState(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuTherapist, setMenuTherapist] = useState(null);

    const handleViewDetails = (therapist) => {
        setSelectedTherapist(therapist);
        setShowDetailsDialog(true);
        setAnchorEl(null);
    };

    const handleEdit = (therapist) => {
        setSelectedTherapist(therapist);
        setShowEditDialog(true);
        setAnchorEl(null);
    };

    const handleMenuClick = (event, therapist) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setMenuTherapist(therapist);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuTherapist(null);
    };

    const handleToggleStatus = async (therapistId, newStatus) => {
        try {
            const data = await apiClient.patch(`/api/admin/therapists/${therapistId}/status`, { status: newStatus });
            
            if (data.success) {
                onRefresh();
                alert(`המטפלת ${newStatus === 'active' ? 'הופעלה' : 'הושבתה'} בהצלחה`);
            } else {
                alert('שגיאה בעדכון הסטטוס: ' + data.error);
            }
        } catch (error) {
            console.error('Error updating therapist status:', error);
            alert('שגיאה בעדכון הסטטוס');
        }
        handleMenuClose();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('he-IL');
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'default';
            case 'suspended': return 'error';
            default: return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return 'פעילה';
            case 'inactive': return 'לא פעילה';
            case 'suspended': return 'מושעית';
            default: return status;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (therapists.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h6" color="textSecondary">
                    אין מטפלות מאושרות
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    המטפלות שיאושרו יופיעו כאן
                </Typography>
            </Box>
        );
    }

    return (
        <>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>מטפלת</TableCell>
                            <TableCell>פרטי קשר</TableCell>
                            <TableCell>התמחות</TableCell>
                            <TableCell>תאריך הצטרפות</TableCell>
                            <TableCell>סטטוס</TableCell>
                            <TableCell>לקוחות פעילים</TableCell>
                            <TableCell align="center">פעולות</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {therapists.map((therapist) => (
                            <TableRow key={therapist._id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar 
                                            sx={{ 
                                                bgcolor: therapist.status === 'active' 
                                                    ? professionalTokens.colors.primary 
                                                    : '#bdbdbd' 
                                            }}
                                        >
                                            {getInitials(therapist.firstName, therapist.lastName)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                {therapist.firstName} {therapist.lastName}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                ת.ז: {therapist.idNumber}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                
                                <TableCell>
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Email fontSize="small" color="action" />
                                            <Typography variant="body2">{therapist.email}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Phone fontSize="small" color="action" />
                                            <Typography variant="body2">{therapist.phone}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                        {therapist.therapistType}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {therapist.specializations?.slice(0, 2).map((spec, index) => (
                                            <Chip 
                                                key={index}
                                                label={spec} 
                                                size="small" 
                                                variant="outlined"
                                            />
                                        ))}
                                        {therapist.specializations?.length > 2 && (
                                            <Chip 
                                                label={`+${therapist.specializations.length - 2}`}
                                                size="small" 
                                                variant="outlined"
                                            />
                                        )}
                                    </Box>
                                </TableCell>
                                
                                <TableCell>
                                    <Typography variant="body2">
                                        {formatDate(therapist.approvedAt || therapist.createdAt)}
                                    </Typography>
                                </TableCell>
                                
                                <TableCell>
                                    <Chip
                                        label={getStatusLabel(therapist.status)}
                                        color={getStatusColor(therapist.status)}
                                        size="small"
                                    />
                                </TableCell>
                                
                                <TableCell>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: professionalTokens.colors.primary }}>
                                        {therapist.activeClients || 0}
                                    </Typography>
                                </TableCell>
                                
                                <TableCell align="center">
                                    <IconButton 
                                        size="small"
                                        onClick={(e) => handleMenuClick(e, therapist)}
                                    >
                                        <MoreVert />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: { minWidth: 200 }
                }}
            >
                <MenuItem onClick={() => handleViewDetails(menuTherapist)}>
                    <ListItemIcon>
                        <Visibility fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>צפייה בפרטים</ListItemText>
                </MenuItem>
                
                <MenuItem onClick={() => handleEdit(menuTherapist)}>
                    <ListItemIcon>
                        <Edit fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>עריכה</ListItemText>
                </MenuItem>
                
                {menuTherapist?.status === 'active' ? (
                    <MenuItem onClick={() => handleToggleStatus(menuTherapist._id, 'inactive')}>
                        <ListItemIcon>
                            <Block fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>השבת</ListItemText>
                    </MenuItem>
                ) : (
                    <MenuItem onClick={() => handleToggleStatus(menuTherapist._id, 'active')}>
                        <ListItemIcon>
                            <CheckCircle fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>הפעל</ListItemText>
                    </MenuItem>
                )}
            </Menu>

            {/* Therapist Details Dialog */}
            <Dialog 
                open={showDetailsDialog} 
                onClose={() => setShowDetailsDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    פרטי המטפלת - {selectedTherapist?.firstName} {selectedTherapist?.lastName}
                </DialogTitle>
                <DialogContent>
                    {selectedTherapist && (
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            {/* Personal Information */}
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="primary">
                                            פרטים אישיים
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Typography variant="body2">
                                                <strong>שם:</strong> {selectedTherapist.firstName} {selectedTherapist.lastName}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>ת.ז:</strong> {selectedTherapist.idNumber}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>טלפון:</strong> {selectedTherapist.phone}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>מייל:</strong> {selectedTherapist.email}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>סטטוס:</strong> 
                                                <Chip 
                                                    label={getStatusLabel(selectedTherapist.status)}
                                                    color={getStatusColor(selectedTherapist.status)}
                                                    size="small"
                                                    sx={{ ml: 1 }}
                                                />
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Professional Information */}
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="primary">
                                            פרטים מקצועיים
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Typography variant="body2">
                                                <strong>סוג מטפל:</strong> {selectedTherapist.therapistType}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>ניסיון:</strong> {selectedTherapist.experience} שנים
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>לקוחות פעילים:</strong> {selectedTherapist.activeClients || 0}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>התמחויות:</strong>
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 2 }}>
                                                {selectedTherapist.specializations?.map((spec, index) => (
                                                    <Chip key={index} label={spec} size="small" />
                                                ))}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDetailsDialog(false)}>
                        סגור
                    </Button>
                    {selectedTherapist && (
                        <Button 
                            variant="outlined"
                            onClick={() => {
                                setShowDetailsDialog(false);
                                handleEdit(selectedTherapist);
                            }}
                        >
                            ערוך
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Edit Dialog (placeholder) */}
            <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)}>
                <DialogTitle>עריכת מטפלת</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        פונקציונליות העריכה תיווסף בהמשך...
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowEditDialog(false)}>
                        סגור
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ApprovedTherapistsTable;
