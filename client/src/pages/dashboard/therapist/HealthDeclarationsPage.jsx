import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    Alert, Tabs, Tab, Card, CardContent, CardActions, Chip, Grid, FormControl,
    FormLabel, FormGroup, FormControlLabel, Checkbox, Divider, CircularProgress, useTheme, useMediaQuery
} from '@mui/material';
import ResponsiveTableCards from '../../../components/ResponsiveTableCards';
import '../../../components/responsive-table.css';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    Add as AddIcon,
    Visibility as ViewIcon,
    Save as SaveIcon,
    Settings as SettingsIcon,
    Description as DocumentIcon,
    Download as DownloadIcon,
    Print as PrintIcon
} from '@mui/icons-material';
import healthDeclarationService from '../../../services/healthDeclarationService';
import api from '../../../services/api';

import Footer from '../../../components/common/Footer';

const statusOptions = [
    { value: 'pending', label: 'ממתינה' },
    { value: 'approved', label: 'מאושרת' },
    { value: 'rejected', label: 'נדחתה' },
];

const HealthDeclarationsPage = () => {
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Declarations management
    const [selected, setSelected] = useState(null);
    const [editStatus, setEditStatus] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);

    // Templates management
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [currentTemplate, setCurrentTemplate] = useState('general');

    // Document view/download
    const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    // Templates from super-admin
    const [templates, setTemplates] = useState([]);

    const fetchDeclarations = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await healthDeclarationService.getAll();
            setDeclarations(res.data.data || []);
        } catch (err) {
            setError('שגיאה בטעינת הצהרות הבריאות');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeclarations();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await healthDeclarationService.getTemplates();
                const templatesData = res.data?.data || [];
                setTemplates(templatesData);
                // Set first template as current if none selected
                if (templatesData.length > 0 && !currentTemplate) {
                    setCurrentTemplate(templatesData[0].key);
                }
            } catch { }
        })();
    }, []);

    const handleOpenDialog = (declaration) => {
        setSelected(declaration);
        setEditStatus(declaration.status);
        setEditNotes(declaration.notes || '');
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelected(null);
    };

    const handleSave = async () => {
        try {
            await healthDeclarationService.updateStatus(selected._id, {
                status: editStatus,
                notes: editNotes
            });
            setSuccess('הצהרת הבריאות עודכנה בהצלחה');
            fetchDeclarations();
            handleCloseDialog();
        } catch (err) {
            setError('שגיאה בעדכון הצהרת הבריאות');
        }
    };

    const handleDelete = async (declarationId) => {
        if (!window.confirm('האם את בטוחה שברצונך למחוק הצהרת בריאות זו?')) {
            return;
        }
        try {
            await healthDeclarationService.delete(declarationId);
            setSuccess('הצהרת הבריאות נמחקה בהצלחה');
            fetchDeclarations();
        } catch (err) {
            setError('שגיאה במחיקת הצהרת הבריאות');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('he-IL');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'error';
            default: return 'warning';
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleViewDocument = (declaration) => {
        setSelectedDocument(declaration);
        setDocumentDialogOpen(true);
    };

    const handleCloseDocument = () => {
        setDocumentDialogOpen(false);
        setSelectedDocument(null);
    };

    const handleDownloadDocument = (declaration) => {
        // יצירת HTML מעוצב להצהרת בריאות
        const htmlContent = generateHealthDeclarationHTML(declaration);

        // יצירת קובץ PDF או HTML להורדה
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `הצהרת_בריאות_${declaration.clientName || declaration.fullName}_${new Date().toLocaleDateString('he-IL')}.html`;
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
    <title>הצהרת בריאות - ${declaration.clientName || declaration.fullName}</title>
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
        .conditions-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 5px;
        }
        .condition-chip {
            background: #E3F2FD;
            color: #1976D2;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 14px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .signature-area {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            text-align: center;
            width: 200px;
        }
        .signature-line {
            border-bottom: 1px solid #333;
            margin-bottom: 10px;
            height: 50px;
        }
        @media print {
            body { background: white; }
            .content { box-shadow: none; }
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
                <span class="field-value">${declaration.clientName || declaration.fullName || ''}</span>
            </div>
            ${declaration.idNumber ? `
            <div class="field">
                <span class="field-label">תעודת זהות:</span>
                <span class="field-value">${declaration.idNumber}</span>
            </div>
            ` : ''}
            <div class="field">
                <span class="field-label">גיל:</span>
                <span class="field-value">${declaration.age || 'לא צוין'}</span>
            </div>
            <div class="field">
                <span class="field-label">טלפון:</span>
                <span class="field-value">${declaration.clientPhone || declaration.phone || ''}</span>
            </div>
            <div class="field">
                <span class="field-label">אימייל:</span>
                <span class="field-value">${declaration.clientEmail || declaration.email || ''}</span>
            </div>
            <div class="field">
                <span class="field-label">תאריך מילוי:</span>
                <span class="field-value">${date} בשעה ${time}</span>
            </div>
        </div>

        ${declaration.medicalConditions && declaration.medicalConditions.length > 0 ? `
        <div class="section">
            <div class="section-title">מצבים רפואיים</div>
            <div class="conditions-list">
                ${declaration.medicalConditions.map(condition => `<span class="condition-chip">${condition}</span>`).join('')}
            </div>
        </div>
        ` : ''}

        ${declaration.medications ? `
        <div class="section">
            <div class="section-title">תרופות</div>
            <div class="field-value">${declaration.medications}</div>
        </div>
        ` : ''}

        ${declaration.allergies ? `
        <div class="section">
            <div class="section-title">אלרגיות</div>
            <div class="field-value">${declaration.allergies}</div>
        </div>
        ` : ''}

        ${declaration.previousSurgeries ? `
        <div class="section">
            <div class="section-title">ניתוחים קודמים</div>
            <div class="field-value">${declaration.previousSurgeries}</div>
        </div>
        ` : ''}

        ${declaration.physicalLimitations ? `
        <div class="section">
            <div class="section-title">מגבלות פיזיות</div>
            <div class="field-value">${declaration.physicalLimitations}</div>
        </div>
        ` : ''}

        ${declaration.currentStress ? `
        <div class="section">
            <div class="section-title">מצבי לחץ נוכחיים</div>
            <div class="field-value">${declaration.currentStress}</div>
        </div>
        ` : ''}

        ${declaration.previousTherapy ? `
        <div class="section">
            <div class="section-title">טיפולים קודמים</div>
            <div class="field-value">${declaration.previousTherapy}</div>
        </div>
        ` : ''}

        ${declaration.expectations ? `
        <div class="section">
            <div class="section-title">ציפיות מהטיפול</div>
            <div class="field-value">${declaration.expectations}</div>
        </div>
        ` : ''}

        ${declaration.additionalInfo ? `
        <div class="section">
            <div class="section-title">מידע נוסף</div>
            <div class="field-value">${declaration.additionalInfo}</div>
        </div>
        ` : ''}

        ${declaration.pregnancyStatus || declaration.breastfeeding ? `
        <div class="section">
            <div class="section-title">מצב הריון/הנקה</div>
            ${declaration.pregnancyStatus ? '<div class="field-value">✓ בהריון כעת</div>' : ''}
            ${declaration.breastfeeding ? '<div class="field-value">✓ מניקה כעת</div>' : ''}
        </div>
        ` : ''}

        <div class="signature-area">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div>חתימת המטופלת</div>
                <div>תאריך: ${date}</div>
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <div>חתימת המטפלת</div>
                <div>תאריך: ${date}</div>
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

    return (
        <Box>
            <Box
                p={isMobile ? 2 : 4}
                sx={{
                    '@media (max-width: 480px)': {
                        padding: '1rem'
                    }
                }}
            >
                <Typography
                    variant={isMobile ? "h5" : "h4"}
                    mb={isMobile ? 2 : 3}
                    sx={{
                        '@media (max-width: 480px)': {
                            fontSize: '1.3rem'
                        }
                    }}
                >
                    ניהול הצהרות בריאות
                </Typography>

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

                {/* Tabs */}
                <Paper sx={{ mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant={isMobile ? "scrollable" : "standard"}
                        scrollButtons={isMobile ? "auto" : false}
                    >
                        <Tab label="הצהרות שהתקבלו" />
                        <Tab label="ניהול תבניות" />
                    </Tabs>
                </Paper>

                {/* Tab 0: Existing Declarations */}
                {activeTab === 0 && (
                    <Paper elevation={2} sx={{ p: isMobile ? 2 : 3 }}>
                        {loading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                                <CircularProgress />
                            </Box>
                        ) : declarations.length === 0 ? (
                            <Box textAlign="center" py={4}>
                                <Typography variant="h6" color="textSecondary">
                                    אין הצהרות בריאות
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                    הצהרות בריאות שיתקבלו מלקוחות יופיעו כאן
                                </Typography>
                            </Box>
                        ) : (
                            <ResponsiveTableCards
                                columns={[
                                    { key: "clientName", label: "שם הלקוח" },
                                    { key: "createdAt", label: "תאריך שליחה" },
                                    { key: "status", label: "סטטוס" }
                                ]}
                                rows={declarations.map((declaration) => ({
                                    id: declaration._id,
                                    clientName: declaration.clientName || declaration.fullName,
                                    createdAt: formatDate(declaration.createdAt),
                                    status: statusOptions.find(s => s.value === declaration.status)?.label,
                                    _declaration: declaration // שמירת האובייקט המקורי
                                }))}
                                actions={(row) => {
                                    const declaration = row._declaration;
                                    return (
                                        <>
                                            <IconButton
                                                onClick={() => handleViewDocument(declaration)}
                                                size="small"
                                                color="primary"
                                                title="צפייה במסמך"
                                            >
                                                <DocumentIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleDownloadDocument(declaration)}
                                                size="small"
                                                color="secondary"
                                                title="הורדת מסמך"
                                            >
                                                <DownloadIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleOpenDialog(declaration)}
                                                size="small"
                                                title="עריכה"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleDelete(declaration._id)}
                                                size="small"
                                                color="error"
                                                title="מחיקה"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </>
                                    );
                                }}
                            />
                        )}
                    </Paper>
                )}

                {/* Tab 1: Template Management */}
                {activeTab === 1 && (
                    <Box>
                        <Typography
                            variant={isMobile ? "h6" : "h5"}
                            sx={{ mb: 3 }}
                        >
                            תבניות הצהרות בריאות
                        </Typography>

                        {templates.length === 0 ? (
                            <Box textAlign="center" py={4}>
                                <Typography variant="h6" color="textSecondary">
                                    אין תבניות הצהרות בריאות זמינות
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                    הסופר־אדמין יוסיף תבניות בהקדם
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={isMobile ? 2 : 3}>
                                {templates.map((tpl) => (
                                    <Grid item xs={12} sm={6} md={4} key={tpl.key}>
                                        <Card sx={{
                                            height: '100%',
                                            border: currentTemplate === tpl.key ? '2px solid #4A90E2' : '1px solid #e0e0e0'
                                        }}>
                                            <CardContent>
                                                <Typography
                                                    variant="h6"
                                                    fontWeight={600}
                                                    sx={{ mb: 2 }}
                                                >
                                                    {tpl.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {tpl.conditions?.length || 0} שאלות
                                                </Typography>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                                        שאלות לדוגמה:
                                                    </Typography>
                                                    {(tpl.conditions || []).slice(0, 3).map((c, idx) => (
                                                        <Typography key={idx} variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                                                            • {c.label}
                                                        </Typography>
                                                    ))}
                                                    {(tpl.conditions?.length || 0) > 3 && (
                                                        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                                                            ועוד {(tpl.conditions.length - 3)} שאלות...
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </CardContent>
                                            <CardActions>
                                                <Button
                                                    size="small"
                                                    variant={currentTemplate === tpl.key ? "contained" : "outlined"}
                                                    onClick={() => setCurrentTemplate(tpl.key)}
                                                    startIcon={<SettingsIcon />}
                                                    fullWidth={isMobile}
                                                >
                                                    {currentTemplate === tpl.key ? 'תבנית פעילה' : 'הפעל תבנית'}
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}

                        {templates.length > 0 && (
                            <>
                                <Divider sx={{ my: 4 }} />

                                {/* Custom Template Section */}
                                <Paper sx={{ p: isMobile ? 2 : 3, mt: 3 }}>
                                    <Typography variant="h6" sx={{ mb: 3 }}>
                                        התאמה אישית
                                    </Typography>
                                    <Alert severity="info" sx={{ mb: 3 }}>
                                        באפשרותך להתאים את השאלות בהצהרת הבריאות בהתאם לסוג הטיפול שלך
                                    </Alert>

                                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                        תבנית נוכחית: {templates.find(t => t.key === currentTemplate)?.name || '—'}
                                    </Typography>

                                    <Box sx={{
                                        maxHeight: 300,
                                        overflowY: 'auto',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        p: 2
                                    }}>
                                        {(templates.find(t => t.key === currentTemplate)?.conditions || []).map((c, idx) => (
                                            <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: idx % 2 === 0 ? 'grey.50' : 'white' }}>
                                                <Typography variant="body2">
                                                    {idx + 1}. {c.label}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>

                                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            רוצה להתאים את השאלות? צרי קשר לתמיכה
                                        </Typography>
                                    </Box>
                                </Paper>
                            </>
                        )}
                    </Box>
                )}

                {/* Edit Dialog */}
                <Dialog
                    open={dialogOpen}
                    onClose={handleCloseDialog}
                    maxWidth="md"
                    fullWidth
                    fullScreen={isMobile}
                >
                    <DialogTitle>עריכת הצהרת בריאות</DialogTitle>
                    <DialogContent>
                        {selected && (
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    פרטי הלקוח: {selected.clientName || selected.fullName}
                                </Typography>

                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>ת.ז.:</strong> {selected.idNumber || 'לא צוין'}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>אימייל:</strong> {selected.clientEmail || selected.email}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>טלפון:</strong> {selected.clientPhone || selected.phone}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 3 }}>
                                    <strong>גיל:</strong> {selected.age || 'לא צוין'}
                                </Typography>

                                {selected.medicalConditions && selected.medicalConditions.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                            מצבים רפואיים:
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {selected.medicalConditions.map((condition, idx) => (
                                                <Chip key={idx} label={condition} size="small" />
                                            ))}
                                        </Box>
                                    </Box>
                                )}

                                {selected.additionalInfo && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                            מידע נוסף:
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            p: 2,
                                            bgcolor: 'grey.50',
                                            borderRadius: 1,
                                            whiteSpace: 'pre-line'
                                        }}>
                                            {selected.additionalInfo}
                                        </Typography>
                                    </Box>
                                )}

                                <TextField
                                    select
                                    label="סטטוס"
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                >
                                    {statusOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    label="הערות"
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="הערות למטופל או למעקב..."
                                />
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>ביטול</Button>
                        <Button onClick={handleSave} variant="contained">
                            שמור
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Document View Dialog */}
                <Dialog
                    open={documentDialogOpen}
                    onClose={handleCloseDocument}
                    maxWidth="md"
                    fullWidth
                    fullScreen={isMobile}
                    PaperProps={{
                        sx: { minHeight: isMobile ? '100vh' : '80vh' }
                    }}
                >
                    <DialogTitle sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #e0e0e0',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 1 : 0
                    }}>
                        <Box>
                            <Typography variant="h6">
                                הצהרת בריאות - {selectedDocument?.clientName || selectedDocument?.fullName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                נוצר ב: {selectedDocument && formatDate(selectedDocument.createdAt)}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                                onClick={() => handleDownloadDocument(selectedDocument)}
                                color="primary"
                                title="הורדת מסמך"
                            >
                                <DownloadIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => window.print()}
                                color="secondary"
                                title="הדפסה"
                            >
                                <PrintIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>

                    <DialogContent sx={{ p: isMobile ? 2 : 4 }}>
                        {selectedDocument && (
                            <Box sx={{ direction: 'rtl' }}>
                                {/* Header */}
                                <Box sx={{
                                    textAlign: 'center',
                                    borderBottom: '3px solid #4A90E2',
                                    pb: 2,
                                    mb: 3
                                }}>
                                    <Typography variant="h4" sx={{ color: '#4A90E2', fontWeight: 'bold', mb: 1 }}>
                                        הצהרת בריאות
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        מסמך רפואי סודי
                                    </Typography>
                                </Box>

                                {/* Personal Info */}
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ color: '#4A90E2', fontWeight: 'bold', mb: 2, borderBottom: '2px solid #4A90E2', pb: 1 }}>
                                        פרטים אישיים
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography><strong>שם מלא:</strong> {selectedDocument.clientName || selectedDocument.fullName}</Typography>
                                        </Grid>
                                        {selectedDocument.idNumber && (
                                            <Grid item xs={12} sm={6}>
                                                <Typography><strong>ת.ז.:</strong> {selectedDocument.idNumber}</Typography>
                                            </Grid>
                                        )}
                                        <Grid item xs={12} sm={6}>
                                            <Typography><strong>גיל:</strong> {selectedDocument.age || 'לא צוין'}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography><strong>טלפון:</strong> {selectedDocument.clientPhone || selectedDocument.phone}</Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography><strong>אימייל:</strong> {selectedDocument.clientEmail || selectedDocument.email}</Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography><strong>תאריך מילוי:</strong> {formatDate(selectedDocument.createdAt)}</Typography>
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Medical Conditions */}
                                {selectedDocument.medicalConditions && selectedDocument.medicalConditions.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" sx={{ color: '#4A90E2', fontWeight: 'bold', mb: 2, borderBottom: '2px solid #4A90E2', pb: 1 }}>
                                            מצבים רפואיים
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {selectedDocument.medicalConditions.map((condition, index) => (
                                                <Chip key={index} label={condition} color="primary" variant="outlined" />
                                            ))}
                                        </Box>
                                    </Box>
                                )}

                                {/* Additional Sections */}
                                {[
                                    { title: 'תרופות', value: selectedDocument.medications },
                                    { title: 'אלרגיות', value: selectedDocument.allergies },
                                    { title: 'ניתוחים קודמים', value: selectedDocument.previousSurgeries },
                                    { title: 'מגבלות פיזיות', value: selectedDocument.physicalLimitations },
                                    { title: 'מצבי לחץ נוכחיים', value: selectedDocument.currentStress },
                                    { title: 'טיפולים קודמים', value: selectedDocument.previousTherapy },
                                    { title: 'ציפיות מהטיפול', value: selectedDocument.expectations },
                                    { title: 'מידע נוסף', value: selectedDocument.additionalInfo }
                                ].filter(section => section.value).map((section, index) => (
                                    <Box key={index} sx={{ mb: 3 }}>
                                        <Typography variant="h6" sx={{ color: '#4A90E2', fontWeight: 'bold', mb: 1, borderBottom: '2px solid #4A90E2', pb: 1 }}>
                                            {section.title}
                                        </Typography>
                                        <Typography sx={{ whiteSpace: 'pre-line' }}>
                                            {section.value}
                                        </Typography>
                                    </Box>
                                ))}

                                {/* Pregnancy/Breastfeeding */}
                                {(selectedDocument.pregnancyStatus || selectedDocument.breastfeeding) && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" sx={{ color: '#4A90E2', fontWeight: 'bold', mb: 1, borderBottom: '2px solid #4A90E2', pb: 1 }}>
                                            מצב הריון/הנקה
                                        </Typography>
                                        {selectedDocument.pregnancyStatus && <Typography>✓ בהריון כעת</Typography>}
                                        {selectedDocument.breastfeeding && <Typography>✓ מניקה כעת</Typography>}
                                    </Box>
                                )}

                                {/* Signature Area */}
                                <Box sx={{
                                    mt: 4,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    gap: isMobile ? 2 : 0
                                }}>
                                    <Box sx={{ textAlign: 'center', width: isMobile ? '100%' : '200px' }}>
                                        <Box sx={{ borderBottom: '1px solid #333', height: '50px', mb: 1 }}></Box>
                                        <Typography>חתימת המטופלת</Typography>
                                        <Typography variant="body2">תאריך: {formatDate(selectedDocument.createdAt)}</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center', width: isMobile ? '100%' : '200px' }}>
                                        <Box sx={{ borderBottom: '1px solid #333', height: '50px', mb: 1 }}></Box>
                                        <Typography>חתימת המטפלת</Typography>
                                        <Typography variant="body2">תאריך: {formatDate(selectedDocument.createdAt)}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </DialogContent>

                    <DialogActions sx={{ borderTop: '1px solid #e0e0e0' }}>
                        <Button onClick={handleCloseDocument}>סגור</Button>
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownloadDocument(selectedDocument)}
                        >
                            הורד מסמך
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
            <Footer variant="therapist" />
        </Box>
    );
};

export default HealthDeclarationsPage; 