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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Alert,
    CircularProgress,
    IconButton,
    Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

import healthDeclarationService from '../../../../../services/healthDeclarationService';
import SimplifiedSignatureModal from './SimplifiedSignatureModal';

export default function HealthDeclarationTab({ client }) {
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDeclaration, setSelectedDeclaration] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [signModalOpen, setSignModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadDeclarations();
    }, [client]);

    const loadDeclarations = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await healthDeclarationService.getAll({ clientId: client._id || client.id });
            const items = response.data.data || [];
            setDeclarations(items);
        } catch (err) {
            console.error('Error loading health declarations:', err);
            setError('שגיאה בטעינת הצהרות הבריאות');
        } finally {
            setLoading(false);
        }
    };

    const handleNewDeclaration = () => {
        if (!client.nationalId) {
            setError('על מנת ליצור הצהרת בריאות, הלקוח חייב לכלול תעודת זהות. אנא עדכן את פרטי הלקוח תחילה.');
            return;
        }
        setSignModalOpen(true);
    };

    const handleSignatureSuccess = (signedDocumentId) => {
        console.log('Health declaration signed successfully:', signedDocumentId);
        setSignModalOpen(false);
        loadDeclarations(); // Refresh the list
    };

    const handleViewDetails = (declaration) => {
        setSelectedDeclaration(declaration);
        setDetailsOpen(true);
    };

    const handleApproveDeclaration = async (declarationId) => {
        try {
            setError('');
            await healthDeclarationService.updateStatus(declarationId, {
                status: 'approved',
                notes: 'הצהרה אושרה על ידי המטפלת'
            });

            // Refresh the declarations list
            loadDeclarations();

            // Show success message
            setSuccessMessage('הצהרת הבריאות אושרה בהצלחה');
            setShowSuccess(true);
        } catch (err) {
            console.error('Error approving declaration:', err);
            setError('שגיאה באישור ההצהרה');
        }
    };

    const handleRejectDeclaration = async (declarationId) => {
        try {
            setError('');
            await healthDeclarationService.updateStatus(declarationId, {
                status: 'rejected',
                notes: 'הצהרה נדחתה על ידי המטפלת'
            });

            // Refresh the declarations list
            loadDeclarations();

            // Show success message
            setSuccessMessage('הצהרת הבריאות נדחתה');
            setShowSuccess(true);
        } catch (err) {
            console.error('Error rejecting declaration:', err);
            setError('שגיאה בדחיית ההצהרה');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'success';
            case 'pending':
                return 'warning';
            case 'rejected':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'approved':
                return 'מאושר';
            case 'pending':
                return 'ממתין לאישור';
            case 'rejected':
                return 'נדחה';
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Error Alert */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">הצהרות בריאות</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleNewDeclaration}
                >
                    הצהרת בריאות חדשה
                </Button>
            </Box>

            {/* Declarations Table */}
            {declarations.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        עדיין לא הוגשו הצהרות בריאות עבור לקוח זה
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>תאריך יצירה</TableCell>
                                <TableCell>שם הלקוח</TableCell>
                                <TableCell>גיל</TableCell>
                                <TableCell>סטטוס</TableCell>
                                <TableCell>פעולות</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {declarations.map((declaration) => (
                                <TableRow key={declaration._id}>
                                    <TableCell>
                                        {format(new Date(declaration.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                                    </TableCell>
                                    <TableCell>{declaration.clientName}</TableCell>
                                    <TableCell>{declaration.age}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getStatusLabel(declaration.status)}
                                            color={getStatusColor(declaration.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewDetails(declaration)}
                                                title="צפייה בפרטים"
                                            >
                                                <VisibilityIcon />
                                            </IconButton>

                                            {declaration.status === 'pending' && (
                                                <>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleApproveDeclaration(declaration._id)}
                                                        title="אישור הצהרה"
                                                        color="success"
                                                    >
                                                        <CheckIcon />
                                                    </IconButton>

                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRejectDeclaration(declaration._id)}
                                                        title="דחיית הצהרה"
                                                        color="error"
                                                    >
                                                        <ClearIcon />
                                                    </IconButton>
                                                </>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Details Dialog */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    פרטי הצהרת בריאות
                    <IconButton
                        onClick={() => setDetailsOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedDeclaration && (
                        <Box>
                            <Typography variant="h6" gutterBottom>מידע כללי</Typography>
                            <Typography><strong>שם:</strong> {selectedDeclaration.clientName}</Typography>
                            <Typography><strong>אימייל:</strong> {selectedDeclaration.clientEmail}</Typography>
                            <Typography><strong>טלפון:</strong> {selectedDeclaration.clientPhone}</Typography>
                            <Typography><strong>ת.ז.:</strong> {selectedDeclaration.idNumber}</Typography>
                            <Typography><strong>גיל:</strong> {selectedDeclaration.age}</Typography>
                            <Typography><strong>תאריך:</strong> {format(new Date(selectedDeclaration.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}</Typography>

                            <Box mt={3}>
                                <Typography variant="h6" gutterBottom>מידע רפואי</Typography>
                                {selectedDeclaration.medicalConditions?.length > 0 && (
                                    <Typography><strong>מצבים רפואיים:</strong> {selectedDeclaration.medicalConditions.join(', ')}</Typography>
                                )}
                                {selectedDeclaration.medications && (
                                    <Typography><strong>תרופות:</strong> {selectedDeclaration.medications}</Typography>
                                )}
                                {selectedDeclaration.allergies && (
                                    <Typography><strong>אלרגיות:</strong> {selectedDeclaration.allergies}</Typography>
                                )}
                                {selectedDeclaration.previousSurgeries && (
                                    <Typography><strong>ניתוחים קודמים:</strong> {selectedDeclaration.previousSurgeries}</Typography>
                                )}
                                {selectedDeclaration.physicalLimitations && (
                                    <Typography><strong>מגבלות פיזיות:</strong> {selectedDeclaration.physicalLimitations}</Typography>
                                )}
                                {selectedDeclaration.currentStress && (
                                    <Typography><strong>רמת לחץ נוכחית:</strong> {selectedDeclaration.currentStress}</Typography>
                                )}
                                {selectedDeclaration.previousTherapy && (
                                    <Typography><strong>טיפול קודם:</strong> {selectedDeclaration.previousTherapy}</Typography>
                                )}
                                {selectedDeclaration.expectations && (
                                    <Typography><strong>ציפיות:</strong> {selectedDeclaration.expectations}</Typography>
                                )}
                                {selectedDeclaration.additionalInfo && (
                                    <Typography><strong>מידע נוסף:</strong> {selectedDeclaration.additionalInfo}</Typography>
                                )}
                            </Box>

                            {selectedDeclaration.notes && (
                                <Box mt={3}>
                                    <Typography variant="h6" gutterBottom>הערות המטפלת</Typography>
                                    <Typography>{selectedDeclaration.notes}</Typography>
                                </Box>
                            )}

                            {selectedDeclaration.digitalSignature && (
                                <Box mt={3}>
                                    <Typography variant="h6" gutterBottom>חתימה דיגיטלית</Typography>
                                    <Typography><strong>תאריך חתימה:</strong> {format(new Date(selectedDeclaration.digitalSignature.signedAt), 'dd/MM/yyyy HH:mm', { locale: he })}</Typography>
                                    <Typography><strong>מזהה מסמך:</strong> {selectedDeclaration.digitalSignature.documentId}</Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsOpen(false)}>סגור</Button>
                </DialogActions>
            </Dialog>

            {/* Simplified Signature Modal */}
            <SimplifiedSignatureModal
                open={signModalOpen}
                onClose={() => setSignModalOpen(false)}
                onSuccess={handleSignatureSuccess}
                client={client}
            />

            {/* Success Snackbar */}
            <Snackbar
                open={showSuccess}
                autoHideDuration={4000}
                onClose={() => setShowSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setShowSuccess(false)}
                    severity="success"
                    sx={{ width: '100%' }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}