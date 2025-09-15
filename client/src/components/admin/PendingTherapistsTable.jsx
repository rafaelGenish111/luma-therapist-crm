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
    Divider
} from '@mui/material';
import {
    Visibility,
    CheckCircle,
    Cancel,
    Email,
    Phone,
    Work,
    School,
    LocationOn
} from '@mui/icons-material';
import { professionalTokens } from '../../theme/professionalTokens';

const PendingTherapistsTable = ({ therapists, onApprove, onReject, loading }) => {
    const [selectedTherapist, setSelectedTherapist] = useState(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const handleViewDetails = (therapist) => {
        setSelectedTherapist(therapist);
        setShowDetailsDialog(true);
    };

    const handleReject = (therapist) => {
        setSelectedTherapist(therapist);
        setShowRejectDialog(true);
        setRejectReason('');
    };

    const handleConfirmReject = () => {
        if (rejectReason.trim() && selectedTherapist) {
            onReject(selectedTherapist._id, rejectReason);
            setShowRejectDialog(false);
            setSelectedTherapist(null);
            setRejectReason('');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('he-IL');
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
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
                    אין מטפלות ממתינות לאישור
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    כל המטפלות החדשות יופיעו כאן
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
                            <TableCell>תאריך הרשמה</TableCell>
                            <TableCell>סטטוס</TableCell>
                            <TableCell align="center">פעולות</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {therapists.map((therapist) => (
                            <TableRow key={therapist._id}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: professionalTokens.colors.primary }}>
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
                                        {formatDate(therapist.createdAt)}
                                    </Typography>
                                </TableCell>

                                <TableCell>
                                    <Chip
                                        label={therapist.emailVerified ? 'מאומת' : 'ממתין לאימות'}
                                        color={therapist.emailVerified ? 'success' : 'warning'}
                                        size="small"
                                    />
                                </TableCell>

                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title="צפה בפרטים">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewDetails(therapist)}
                                            >
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="אשר">
                                            <IconButton
                                                size="small"
                                                color="success"
                                                onClick={() => onApprove(therapist._id)}
                                                disabled={!therapist.emailVerified}
                                            >
                                                <CheckCircle />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="דחה">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleReject(therapist)}
                                            >
                                                <Cancel />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

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
                                                <strong>מגדר:</strong> {selectedTherapist.gender}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>תאריך לידה:</strong> {selectedTherapist.dateOfBirth ? formatDate(selectedTherapist.dateOfBirth) : 'לא צוין'}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>טלפון:</strong> {selectedTherapist.phone}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>מייל:</strong> {selectedTherapist.email}
                                            </Typography>
                                            {selectedTherapist.address && (
                                                <Typography variant="body2">
                                                    <strong>כתובת:</strong> {selectedTherapist.address.street}, {selectedTherapist.address.city}
                                                </Typography>
                                            )}
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
                                                <strong>התמחויות:</strong>
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 2 }}>
                                                {selectedTherapist.specializations?.map((spec, index) => (
                                                    <Chip key={index} label={spec} size="small" />
                                                ))}
                                            </Box>
                                            <Typography variant="body2">
                                                <strong>שפות:</strong>
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 2 }}>
                                                {selectedTherapist.languages?.map((lang, index) => (
                                                    <Chip key={index} label={lang} size="small" variant="outlined" />
                                                ))}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* About Me */}
                            {selectedTherapist.aboutMe && (
                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom color="primary">
                                                קצת עליי
                                            </Typography>
                                            <Typography variant="body2">
                                                {selectedTherapist.aboutMe}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}

                            {/* Education & Certifications */}
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="primary">
                                            השכלה והסמכות
                                        </Typography>

                                        {selectedTherapist.education?.length > 0 && (
                                            <>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                    השכלה:
                                                </Typography>
                                                {selectedTherapist.education.map((edu, index) => (
                                                    <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                                                        • {edu.degree} ב{edu.field} מ{edu.institution} ({edu.year})
                                                    </Typography>
                                                ))}
                                                <Divider sx={{ my: 2 }} />
                                            </>
                                        )}

                                        {selectedTherapist.certifications?.length > 0 && (
                                            <>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                    הסמכות:
                                                </Typography>
                                                {selectedTherapist.certifications.map((cert, index) => (
                                                    <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                                                        • {cert.name} מ{cert.organization} ({cert.year})
                                                    </Typography>
                                                ))}
                                            </>
                                        )}
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
                        <>
                            <Button
                                color="error"
                                onClick={() => {
                                    setShowDetailsDialog(false);
                                    handleReject(selectedTherapist);
                                }}
                            >
                                דחה
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={() => {
                                    onApprove(selectedTherapist._id);
                                    setShowDetailsDialog(false);
                                }}
                                disabled={!selectedTherapist.emailVerified}
                            >
                                אשר
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)}>
                <DialogTitle>דחיית מטפלת</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        אנא ציין את הסיבה לדחיית המטפלת. הסיבה תישלח למטפלת במייל.
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="סיבת הדחייה"
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="למשל: חסרים מסמכים, אין התאמה לקריטריונים..."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowRejectDialog(false)}>
                        ביטול
                    </Button>
                    <Button
                        onClick={handleConfirmReject}
                        color="error"
                        variant="contained"
                        disabled={!rejectReason.trim()}
                    >
                        דחה
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default PendingTherapistsTable;
