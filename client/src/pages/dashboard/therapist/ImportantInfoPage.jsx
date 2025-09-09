import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Paper,
    Stack,
    Divider,
    Grid
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import importantInfoService from '../../../services/importantInfoService';

export default function ImportantInfoPage() {
    const [importantInfo, setImportantInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        text: ''
    });

    useEffect(() => {
        loadImportantInfo();
    }, []);

    const loadImportantInfo = async () => {
        try {
            setLoading(true);
            const response = await importantInfoService.getAll();
            setImportantInfo(response.data || null);
        } catch (error) {
            setError('שגיאה בטעינת מידע חשוב');
            console.error('Error loading important info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (item = null, isTitle = false) => {
        if (isTitle) {
            setEditingItem({ type: 'title', value: importantInfo?.title || '' });
            setFormData({ title: importantInfo?.title || '', text: '' });
        } else if (item) {
            setEditingItem({ type: 'item', value: item });
            setFormData({ title: '', text: item.text });
        } else {
            setEditingItem({ type: 'new', value: null });
            setFormData({ title: '', text: '' });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingItem(null);
        setFormData({ title: '', text: '' });
    };

    const handleSubmit = async () => {
        try {
            if (editingItem?.type === 'title') {
                await importantInfoService.update({ title: formData.title });
            } else if (editingItem?.type === 'item') {
                await importantInfoService.updateItem(editingItem.value._id, formData.text);
            } else if (editingItem?.type === 'new') {
                await importantInfoService.addItem(formData.text);
            }
            handleCloseDialog();
            loadImportantInfo();
        } catch (error) {
            setError('שגיאה בשמירת מידע חשוב');
            console.error('Error saving important info:', error);
        }
    };

    const handleDelete = async (itemId) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק את הפריט הזה?')) {
            try {
                await importantInfoService.deleteItem(itemId);
                loadImportantInfo();
            } catch (error) {
                setError('שגיאה במחיקת פריט');
                console.error('Error deleting item:', error);
            }
        }
    };

    const resetToDefault = async () => {
        if (window.confirm('האם אתה בטוח שברצונך לאפס את המידע החשוב לברירת מחדל?')) {
            try {
                const defaultInfo = importantInfoService.getDefaultImportantInfo();
                await importantInfoService.update(defaultInfo);
                loadImportantInfo();
            } catch (error) {
                setError('שגיאה באיפוס מידע חשוב');
                console.error('Error resetting important info:', error);
            }
        }
    };

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6">טוען...</Typography>
            </Box>
        );
    }

    const activeItems = importantInfo?.items?.filter(item => item.isActive) || [];

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight={700}>
                    מידע חשוב
                </Typography>
                <Box>
                    <Button
                        variant="outlined"
                        onClick={resetToDefault}
                        sx={{ mr: 2 }}
                    >
                        איפוס לברירת מחדל
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog(null, false)}
                    >
                        הוספת פריט
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* מידע חשוב נוכחי */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight={600}>
                                    מידע חשוב נוכחי
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(null, true)}
                                    color="primary"
                                >
                                    <EditIcon />
                                </IconButton>
                            </Box>

                            <Typography variant="h5" fontWeight={700} sx={{ mb: 2, color: 'primary.main' }}>
                                {importantInfo?.title || 'מידע חשוב'}
                            </Typography>

                            {activeItems.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    אין פריטים מוגדרים
                                </Typography>
                            ) : (
                                <List>
                                    {activeItems.map((item, index) => (
                                        <ListItem key={item._id} sx={{ px: 0 }}>
                                            <ListItemText
                                                primary={`• ${item.text}`}
                                                primaryTypographyProps={{
                                                    variant: 'body2',
                                                    color: 'text.secondary'
                                                }}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDialog(item)}
                                                    sx={{ mr: 1 }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDelete(item._id)}
                                                    color="error"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* תצוגה מקדימה */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                תצוגה מקדימה
                            </Typography>

                            <Paper sx={{
                                p: 3,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, rgba(245,166,35,0.05) 0%, rgba(74,144,226,0.05) 100%)',
                                border: '1px solid rgba(74,144,226,0.1)'
                            }}>
                                <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                                    <InfoIcon color="primary" />
                                    <Typography variant="h6" fontWeight={600}>
                                        {importantInfo?.title || 'מידע חשוב'}
                                    </Typography>
                                </Box>
                                <Stack spacing={1}>
                                    {activeItems.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            אין פריטים מוגדרים
                                        </Typography>
                                    ) : (
                                        activeItems.map((item) => (
                                            <Typography key={item._id} variant="body2" color="text.secondary">
                                                • {item.text}
                                            </Typography>
                                        ))
                                    )}
                                </Stack>
                            </Paper>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Dialog ליצירה/עריכה */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingItem?.type === 'title' ? 'עריכת כותרת' :
                        editingItem?.type === 'item' ? 'עריכת פריט' : 'הוספת פריט חדש'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        {editingItem?.type === 'title' ? (
                            <TextField
                                fullWidth
                                label="כותרת"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                sx={{ mb: 2 }}
                                required
                            />
                        ) : (
                            <TextField
                                fullWidth
                                label="טקסט הפריט"
                                value={formData.text}
                                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                multiline
                                rows={3}
                                sx={{ mb: 2 }}
                                required
                                placeholder="לדוגמה: ביטול פגישה - עד 24 שעות מראש"
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>ביטול</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!formData.title && !formData.text}
                    >
                        {editingItem?.type === 'title' || editingItem?.type === 'item' ? 'עדכן' : 'צור'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}


