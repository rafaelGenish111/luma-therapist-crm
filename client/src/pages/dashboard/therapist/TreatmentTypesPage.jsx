import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Alert,
    Chip,
    Stack,
    Paper
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIcon,
    AccessTime as TimeIcon,
    MonetizationOn as PriceIcon
} from '@mui/icons-material';
import treatmentTypeService from '../../../services/treatmentTypeService';

export default function TreatmentTypesPage() {
    const [treatmentTypes, setTreatmentTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration: 60,
        price: '',
        currency: 'ILS',
        color: '#4A90E2',
        isActive: true
    });

    useEffect(() => {
        loadTreatmentTypes();
    }, []);

    const loadTreatmentTypes = async () => {
        try {
            setLoading(true);
            const response = await treatmentTypeService.getAll();
            setTreatmentTypes(response.data || []);
        } catch (error) {
            setError('שגיאה בטעינת סוגי טיפולים');
            console.error('Error loading treatment types:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({
                name: type.name,
                description: type.description || '',
                duration: type.duration,
                price: type.price,
                currency: type.currency,
                color: type.color,
                isActive: type.isActive
            });
        } else {
            setEditingType(null);
            setFormData({
                name: '',
                description: '',
                duration: 60,
                price: '',
                currency: 'ILS',
                color: '#4A90E2',
                isActive: true
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingType(null);
        setFormData({
            name: '',
            description: '',
            duration: 60,
            price: '',
            currency: 'ILS',
            color: '#4A90E2',
            isActive: true
        });
    };

    const handleSubmit = async () => {
        try {
            if (editingType) {
                await treatmentTypeService.update(editingType._id, formData);
            } else {
                await treatmentTypeService.create(formData);
            }
            handleCloseDialog();
            loadTreatmentTypes();
        } catch (error) {
            setError('שגיאה בשמירת סוג טיפול');
            console.error('Error saving treatment type:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק את סוג הטיפול הזה?')) {
            try {
                await treatmentTypeService.delete(id);
                loadTreatmentTypes();
            } catch (error) {
                setError('שגיאה במחיקת סוג טיפול');
                console.error('Error deleting treatment type:', error);
            }
        }
    };

    const createDefaultTypes = async () => {
        try {
            const defaultTypes = treatmentTypeService.getDefaultTreatmentTypes();
            for (const type of defaultTypes) {
                await treatmentTypeService.create(type);
            }
            loadTreatmentTypes();
        } catch (error) {
            setError('שגיאה ביצירת סוגי טיפולים ברירת מחדל');
            console.error('Error creating default types:', error);
        }
    };

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6">טוען...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight={700}>
                    סוגי טיפולים
                </Typography>
                <Box>
                    {treatmentTypes.length === 0 && (
                        <Button
                            variant="outlined"
                            onClick={createDefaultTypes}
                            sx={{ mr: 2 }}
                        >
                            יצירת סוגי טיפולים ברירת מחדל
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        הוספת סוג טיפול
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {treatmentTypes.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                        אין סוגי טיפולים מוגדרים
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        הוסף סוגי טיפולים כדי שהלקוחות יוכלו לבחור ביניהם בעת קביעת תור
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={createDefaultTypes}
                        startIcon={<AddIcon />}
                    >
                        יצירת סוגי טיפולים ברירת מחדל
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {treatmentTypes.map((type) => (
                        <Grid item xs={12} md={6} lg={4} key={type._id}>
                            <Card sx={{
                                height: '100%',
                                border: `2px solid ${type.color}20`,
                                '&:hover': {
                                    borderColor: type.color,
                                    transform: 'translateY(-2px)',
                                    transition: 'all 0.3s ease'
                                }
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="h6" fontWeight={700} sx={{ color: type.color }}>
                                            {type.name}
                                        </Typography>
                                        <Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(type)}
                                                sx={{ color: type.color }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(type._id)}
                                                sx={{ color: 'error.main' }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {type.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {type.description}
                                        </Typography>
                                    )}

                                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                        <Chip
                                            icon={<TimeIcon />}
                                            label={treatmentTypeService.formatDuration(type.duration)}
                                            size="small"
                                            variant="outlined"
                                            sx={{ borderColor: type.color, color: type.color }}
                                        />
                                        <Chip
                                            icon={<PriceIcon />}
                                            label={treatmentTypeService.formatPrice(type.price, type.currency)}
                                            size="small"
                                            variant="outlined"
                                            sx={{ borderColor: type.color, color: type.color }}
                                        />
                                    </Stack>

                                    {!type.isActive && (
                                        <Chip
                                            label="לא פעיל"
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Dialog ליצירה/עריכה */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingType ? 'עריכת סוג טיפול' : 'הוספת סוג טיפול חדש'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="שם הטיפול"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            sx={{ mb: 2 }}
                            required
                        />

                        <TextField
                            fullWidth
                            label="תיאור (אופציונלי)"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            multiline
                            rows={2}
                            sx={{ mb: 2 }}
                        />

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="משך זמן (דקות)"
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                    inputProps={{ min: 15, max: 480 }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="מחיר"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    inputProps={{ min: 0, step: 0.01 }}
                                    required
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>מטבע</InputLabel>
                                    <Select
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        label="מטבע"
                                    >
                                        <MenuItem value="ILS">₪ שקל</MenuItem>
                                        <MenuItem value="USD">$ דולר</MenuItem>
                                        <MenuItem value="EUR">€ יורו</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="צבע"
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    sx={{ '& input': { height: 56 } }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>ביטול</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!formData.name || !formData.price}
                    >
                        {editingType ? 'עדכן' : 'צור'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}


