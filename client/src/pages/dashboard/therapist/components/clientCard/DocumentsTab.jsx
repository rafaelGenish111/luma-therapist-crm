import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Card, CardContent, Grid, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    Alert, CircularProgress, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Divider, Tabs, Tab, List, ListItem,
    ListItemIcon, ListItemText, ListItemSecondaryAction, Checkbox,
    Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
    Add as AddIcon, Download as DownloadIcon, Visibility as ViewIcon,
    Edit as EditIcon, Delete as DeleteIcon, Upload as UploadIcon,
    ExpandMore as ExpandMoreIcon, Description as DocumentIcon,
    HealthAndSafety as HealthIcon, CheckCircle as CheckIcon,
    CloudUpload as CloudUploadIcon, Folder as FolderIcon
} from '@mui/icons-material';

import documentService from '../../../../../services/documentService';
import healthDeclarationService from '../../../../../services/healthDeclarationService';

const DocumentsTab = ({ client }) => {
    const [documents, setDocuments] = useState([]);
    const [healthDeclarations, setHealthDeclarations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadForm, setUploadForm] = useState({
        type: 'other',
        description: '',
        isRequired: false
    });

    // Checklist מסמכים נדרשים
    const requiredDocuments = [
        { id: 'health_declaration', name: 'הצהרת בריאות', type: 'health', required: true },
        { id: 'consent_form', name: 'טופס הסכמה לטיפול', type: 'consent', required: true },
        { id: 'id_copy', name: 'צילום תעודת זהות', type: 'identification', required: true },
        { id: 'medical_referral', name: 'הפניה רפואית', type: 'medical', required: false },
        { id: 'insurance_form', name: 'טופס ביטוח', type: 'insurance', required: false },
        { id: 'treatment_plan', name: 'תכנית טיפול', type: 'treatment', required: false }
    ];

    useEffect(() => {
        loadData();
    }, [client._id]);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadDocuments(),
                loadHealthDeclarations()
            ]);
        } catch (err) {
            setError('שגיאה בטעינת נתונים');
        } finally {
            setLoading(false);
        }
    };

    const loadDocuments = async () => {
        try {
            const response = await documentService.getByClient(client._id);
            // השרת מחזיר { success, documents, ... }
            const data = response.data || response;
            setDocuments(data.documents || data.data?.documents || data.data || []);
        } catch (err) {
            console.error('Error loading documents:', err);
        }
    };

    const loadHealthDeclarations = async () => {
        try {
            const response = await healthDeclarationService.getByClient(client._id);
            setHealthDeclarations(response.data.data || []);
        } catch (err) {
            console.error('Error loading health declarations:', err);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!documentService.isAllowedFileType(file.name)) {
                setError('סוג קובץ לא נתמך. אנא בחר קובץ PDF, DOC, DOCX, JPG, PNG או GIF');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('נא לבחור קובץ להעלאה');
            return;
        }

        try {
            await documentService.upload(client._id, selectedFile, uploadForm);
            setSuccess('המסמך הועלה בהצלחה');
            setUploadDialogOpen(false);
            setSelectedFile(null);
            setUploadForm({
                type: 'other',
                description: '',
                isRequired: false
            });
            loadDocuments();
        } catch (err) {
            setError('שגיאה בהעלאת המסמך');
        }
    };

    const handleDownload = async (documentId) => {
        try {
            const response = await documentService.download(documentId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `document-${documentId}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('שגיאה בהורדת המסמך');
        }
    };

    const handleDelete = async (documentId) => {
        if (!window.confirm('האם את בטוחה שברצונך למחוק מסמך זה?')) {
            return;
        }

        try {
            await documentService.delete(documentId);
            setSuccess('המסמך נמחק בהצלחה');
            loadDocuments();
        } catch (err) {
            setError('שגיאה במחיקת המסמך');
        }
    };

    const handleMarkAsCompleted = async (documentId) => {
        try {
            await documentService.markAsCompleted(documentId);
            setSuccess('המסמך סומן כהשלם');
            loadDocuments();
        } catch (err) {
            setError('שגיאה בסימון המסמך');
        }
    };

    const handleDownloadHealthDeclaration = (declaration) => {
        // יצירת HTML מעוצב להצהרת בריאות
        const htmlContent = generateHealthDeclarationHTML(declaration);

        // יצירת קובץ HTML להורדה
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `הצהרת_בריאות_${client.firstName}_${client.lastName}_${new Date().toLocaleDateString('he-IL')}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const generateHealthDeclarationHTML = (declaration) => {
        const date = new Date(declaration.createdAt).toLocaleDateString('he-IL');
        const time = new Date(declaration.createdAt).toLocaleTimeString('he-IL');

        return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>הצהרת בריאות - ${client.firstName} ${client.lastName}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f9f9f9;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #4A90E2;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            color: #4A90E2;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
        }
        .content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            color: #4A90E2;
            font-size: 18px;
            font-weight: bold;
            border-bottom: 2px solid #4A90E2;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .field {
            margin-bottom: 10px;
            display: flex;
            align-items: flex-start;
        }
        .field-label {
            font-weight: bold;
            min-width: 120px;
            color: #555;
        }
        .field-value {
            flex: 1;
            color: #333;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">הצהרת בריאות</div>
        <div class="subtitle">מסמך רפואי סודי</div>
    </div>
    
    <div class="content">
        <div class="section">
            <div class="section-title">פרטים אישיים</div>
            <div class="field">
                <span class="field-label">שם מלא:</span>
                <span class="field-value">${client.firstName} ${client.lastName}</span>
            </div>
            <div class="field">
                <span class="field-label">תאריך מילוי:</span>
                <span class="field-value">${date} בשעה ${time}</span>
            </div>
        </div>

        <div class="section">
            <div class="section-title">תוכן הצהרת הבריאות</div>
            <div class="field-value">
                ${declaration.content || 'לא צוין תוכן'}
            </div>
        </div>
    </div>
    
    <div class="footer">
        הצהרת בריאות זו הינה מסמך רפואי סודי המיועד לשימוש המטפלת בלבד
        <br>
        נוצר באמצעות מערכת ניהול קליניקות • ${new Date().toLocaleDateString('he-IL')}
    </div>
</body>
</html>
        `;
    };

    const getCompletedDocuments = () => {
        return documents.filter(doc => doc.isCompleted);
    };

    const getPendingDocuments = () => {
        return documents.filter(doc => !doc.isCompleted);
    };

    const getDocumentTypeLabel = (type) => {
        const types = documentService.getDocumentTypes();
        return types.find(t => t.value === type)?.label || type;
    };

    const formatFileSize = (bytes) => {
        return documentService.formatFileSize(bytes);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('he-IL');
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
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

            {/* סיכום מסמכים */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="primary">
                                סה"כ מסמכים
                            </Typography>
                            <Typography variant="h4">
                                {documents.length + healthDeclarations.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="success.main">
                                הושלמו
                            </Typography>
                            <Typography variant="h4">
                                {getCompletedDocuments().length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="warning.main">
                                ממתינים
                            </Typography>
                            <Typography variant="h4">
                                {getPendingDocuments().length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="info.main">
                                הצהרות בריאות
                            </Typography>
                            <Typography variant="h4">
                                {healthDeclarations.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* טאבים */}
            <Paper sx={{ mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab label="כל המסמכים" />
                    <Tab label="הצהרות בריאות" />
                    <Tab label="Checklist" />
                </Tabs>
                <Divider />

                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        {tabValue === 0 && 'כל המסמכים'}
                        {tabValue === 1 && 'הצהרות בריאות'}
                        {tabValue === 2 && 'Checklist מסמכים נדרשים'}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<UploadIcon />}
                        onClick={() => setUploadDialogOpen(true)}
                    >
                        העלה מסמך
                    </Button>
                </Box>

                {/* טאב כל המסמכים */}
                {tabValue === 0 && (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>שם המסמך</TableCell>
                                    <TableCell>סוג</TableCell>
                                    <TableCell>תאריך העלאה</TableCell>
                                    <TableCell>גודל</TableCell>
                                    <TableCell>סטטוס</TableCell>
                                    <TableCell>פעולות</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {documents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <Typography color="textSecondary">
                                                אין מסמכים עדיין
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    documents.map((document) => (
                                        <TableRow key={document._id}>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <DocumentIcon color="primary" />
                                                    <Typography variant="body2">
                                                        {document.name}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getDocumentTypeLabel(document.type)}
                                                    color={documentService.getTypeColor(document.type)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{formatDate(document.uploadedAt)}</TableCell>
                                            <TableCell>{formatFileSize(document.fileSize || 0)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={document.isCompleted ? 'הושלם' : 'ממתין'}
                                                    color={document.isCompleted ? 'success' : 'warning'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" gap={1}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDownload(document._id)}
                                                        title="הורד"
                                                    >
                                                        <DownloadIcon />
                                                    </IconButton>
                                                    {!document.isCompleted && (
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            onClick={() => handleMarkAsCompleted(document._id)}
                                                            title="סמן כהשלם"
                                                        >
                                                            <CheckIcon />
                                                        </IconButton>
                                                    )}
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(document._id)}
                                                        title="מחק"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* טאב הצהרות בריאות */}
                {tabValue === 1 && (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>תאריך שליחה</TableCell>
                                    <TableCell>סטטוס</TableCell>
                                    <TableCell>הערות</TableCell>
                                    <TableCell>פעולות</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {healthDeclarations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography color="textSecondary">
                                                אין הצהרות בריאות עדיין
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    healthDeclarations.map((declaration) => (
                                        <TableRow key={declaration._id}>
                                            <TableCell>{formatDate(declaration.createdAt)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={declaration.status === 'approved' ? 'אושרה' :
                                                        declaration.status === 'rejected' ? 'נדחתה' : 'ממתינה'}
                                                    color={declaration.status === 'approved' ? 'success' :
                                                        declaration.status === 'rejected' ? 'error' : 'warning'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" noWrap>
                                                    {declaration.notes || 'אין הערות'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" gap={1}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDownloadHealthDeclaration(declaration)}
                                                        title="הורד הצהרת בריאות"
                                                    >
                                                        <DownloadIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        title="צפייה"
                                                    >
                                                        <ViewIcon />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* טאב Checklist */}
                {tabValue === 2 && (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            מסמכים נדרשים
                        </Typography>
                        <List>
                            {requiredDocuments.map((doc) => {
                                const isCompleted = documents.some(d =>
                                    d.type === doc.type && d.isCompleted
                                );

                                return (
                                    <ListItem key={doc.id} divider>
                                        <ListItemIcon>
                                            <Checkbox
                                                checked={isCompleted}
                                                color="primary"
                                                disabled
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={doc.name}
                                            secondary={doc.required ? 'נדרש' : 'אופציונלי'}
                                        />
                                        <ListItemSecondaryAction>
                                            <Chip
                                                label={doc.required ? 'חובה' : 'אופציונלי'}
                                                color={doc.required ? 'error' : 'default'}
                                                size="small"
                                            />
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                );
                            })}
                        </List>

                        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" color="textSecondary">
                                <strong>התקדמות:</strong> {getCompletedDocuments().length} מתוך {requiredDocuments.filter(d => d.required).length} מסמכים נדרשים הושלמו
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* דיאלוג העלאת מסמך */}
            <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>העלאת מסמך חדש</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <input
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                            style={{ display: 'none' }}
                            id="file-upload"
                            type="file"
                            onChange={handleFileSelect}
                        />
                        <label htmlFor="file-upload">
                            <Button
                                variant="outlined"
                                component="span"
                                startIcon={<CloudUploadIcon />}
                                fullWidth
                                sx={{ mb: 2, py: 2 }}
                            >
                                {selectedFile ? selectedFile.name : 'בחר קובץ'}
                            </Button>
                        </label>

                        <TextField
                            select
                            label="סוג מסמך"
                            value={uploadForm.type}
                            onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            {documentService.getDocumentTypes().map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="תיאור"
                            value={uploadForm.description}
                            onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={2}
                            sx={{ mb: 2 }}
                        />

                        <Box display="flex" alignItems="center">
                            <Checkbox
                                checked={uploadForm.isRequired}
                                onChange={(e) => setUploadForm({ ...uploadForm, isRequired: e.target.checked })}
                            />
                            <Typography variant="body2">
                                מסמך נדרש
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUploadDialogOpen(false)}>ביטול</Button>
                    <Button onClick={handleUpload} variant="contained" disabled={!selectedFile}>
                        העלה
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DocumentsTab;


