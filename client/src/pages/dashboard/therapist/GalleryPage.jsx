import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Button, Grid, Card, CardMedia, CardContent, CardActions,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, IconButton,
    Chip, Alert, CircularProgress, Fab, ImageList, ImageListItem, ImageListItemBar, useTheme, useMediaQuery
} from '@mui/material';
import {
    Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Visibility as ViewIcon,
    VisibilityOff as HideIcon, Visibility as ShowIcon
} from '@mui/icons-material';

import galleryService from '../../../services/galleryService';

const GalleryPage = () => {
    const [images, setImages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: '',
        altText: '',
        tags: '',
        image: null
    });
    const [previewUrl, setPreviewUrl] = useState('');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // טעינת נתונים
    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [imagesRes, categoriesRes] = await Promise.all([
                galleryService.getAll(),
                galleryService.getCategories()
            ]);
            setImages(imagesRes.data.data || []);
            // וידוא שהקטגוריות מכילות רק ערכים תקינים
            const validCategories = (categoriesRes.data.data || []).filter(cat =>
                cat && typeof cat === 'string' && cat.trim() !== ''
            );
            setCategories(validCategories);
        } catch (err) {
            setError('שגיאה בטעינת הגלריה');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // פתיחת טופס הוספה
    const handleAdd = () => {
        setForm({
            title: '',
            description: '',
            category: '',
            altText: '',
            tags: '',
            image: null
        });
        setPreviewUrl('');
        setDialogOpen(true);
    };

    // פתיחת טופס עריכה
    const handleEdit = (image) => {
        setForm({
            title: image.title,
            description: image.description || '',
            category: image.category,
            altText: image.altText || '',
            tags: image.tags ? image.tags.join(', ') : '',
            image: null
        });
        setSelectedImage(image);
        setPreviewUrl(image.imageUrl);
        setDialogOpen(true);
    };

    // פתיחת תצוגה מקדימה
    const handlePreview = (image) => {
        setSelectedImage(image);
        setPreviewOpen(true);
    };

    // שמירה (הוספה/עדכון)
    const handleSave = async () => {
        if (!form.title || !form.category) {
            setError('כותרת וקטגוריה נדרשים');
            return;
        }

        if (!selectedImage && !form.image) {
            setError('תמונה נדרשת');
            return;
        }

        setUploading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('description', form.description);
            formData.append('category', form.category);
            formData.append('altText', form.altText);
            formData.append('tags', form.tags);

            if (form.image) {
                formData.append('image', form.image);
            }

            if (selectedImage) {
                // עדכון
                await galleryService.update(selectedImage._id, formData);
                setSuccess('התמונה עודכנה בהצלחה');
            } else {
                // הוספה
                await galleryService.create(formData);
                setSuccess('התמונה נוספה בהצלחה');
            }

            setDialogOpen(false);
            fetchData();
        } catch (err) {
            setError('שגיאה בשמירת התמונה');
        } finally {
            setUploading(false);
        }
    };

    // מחיקה
    const handleDelete = async (imageId) => {
        if (!window.confirm('האם למחוק את התמונה?')) return;
        try {
            await galleryService.delete(imageId);
            setSuccess('התמונה נמחקה בהצלחה');
            fetchData();
        } catch (err) {
            setError('שגיאה במחיקת התמונה');
        }
    };

    // שינוי נראות
    const handleToggleVisibility = async (image) => {
        try {
            await galleryService.update(image._id, { isVisible: !image.isVisible });
            setSuccess(`התמונה ${image.isVisible ? 'הוסתרה' : 'הוצגה'} בהצלחה`);
            fetchData();
        } catch (err) {
            setError('שגיאה בעדכון נראות התמונה');
        }
    };

    // טיפול בבחירת קובץ
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setForm({ ...form, image: file });
            const reader = new FileReader();
            reader.onload = (e) => setPreviewUrl(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    // טיפול בשינוי שדות
    const handleChange = (field, value) => {
        setForm({ ...form, [field]: value });
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
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography
                        variant={isMobile ? "h5" : "h4"}
                        sx={{
                            '@media (max-width: 480px)': {
                                fontSize: '1.3rem'
                            }
                        }}
                    >
                        ניהול גלריה
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                        sx={{
                            '@media (max-width: 480px)': {
                                width: '100%',
                                mt: 2
                            }
                        }}
                    >
                        הוספת תמונה
                    </Button>
                </Box>

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

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                        <CircularProgress />
                    </Box>
                ) : images.length === 0 ? (
                    <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            אין תמונות בגלריה
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            הוסיפי תמונות כדי להתחיל לבנות את הגלריה שלך
                        </Typography>
                    </Paper>
                ) : (
                    <ImageList
                        cols={isMobile ? 1 : 3}
                        gap={isMobile ? 8 : 16}
                        sx={{
                            '@media (max-width: 768px)': {
                                cols: 2
                            }
                        }}
                    >
                        {images.map((image) => (
                            <ImageListItem key={image._id} sx={{ position: 'relative' }}>
                                <img
                                    src={image.imageUrl}
                                    alt={image.altText || image.title}
                                    loading="lazy"
                                    style={{
                                        width: '100%',
                                        height: isMobile ? 200 : 250,
                                        objectFit: 'cover',
                                        borderRadius: 8,
                                        opacity: image.isVisible ? 1 : 0.5
                                    }}
                                />
                                <ImageListItemBar
                                    title={image.title}
                                    subtitle={image.category}
                                    actionIcon={
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <IconButton
                                                onClick={() => handlePreview(image)}
                                                sx={{ color: 'white' }}
                                                size="small"
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleEdit(image)}
                                                sx={{ color: 'white' }}
                                                size="small"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleToggleVisibility(image)}
                                                sx={{ color: 'white' }}
                                                size="small"
                                            >
                                                {image.isVisible ? <HideIcon /> : <ShowIcon />}
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleDelete(image._id)}
                                                sx={{ color: 'white' }}
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    }
                                    sx={{
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
                                        borderRadius: '0 0 8px 8px'
                                    }}
                                />
                                {!image.isVisible && (
                                    <Chip
                                        label="מוסתרת"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                            color: 'white'
                                        }}
                                    />
                                )}
                            </ImageListItem>
                        ))}
                    </ImageList>
                )}

                {/* Upload Dialog */}
                <Dialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                    fullScreen={isMobile}
                >
                    <DialogTitle>
                        {selectedImage ? 'עריכת תמונה' : 'הוספת תמונה חדשה'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <TextField
                                label="כותרת"
                                value={form.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <TextField
                                label="תיאור"
                                value={form.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                fullWidth
                                margin="normal"
                                multiline
                                rows={3}
                            />
                            <TextField
                                select
                                label="קטגוריה"
                                value={form.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                                fullWidth
                                margin="normal"
                                required
                            >
                                {categories.filter(category => category && typeof category === 'string').map((category) => (
                                    <MenuItem key={category} value={category}>
                                        {category}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="טקסט חלופי"
                                value={form.altText}
                                onChange={(e) => handleChange('altText', e.target.value)}
                                fullWidth
                                margin="normal"
                                helperText="טקסט שתיאר את התמונה למשתמשים עם לקויות ראייה"
                            />
                            <TextField
                                label="תגיות"
                                value={form.tags}
                                onChange={(e) => handleChange('tags', e.target.value)}
                                fullWidth
                                margin="normal"
                                helperText="תגיות מופרדות בפסיקים"
                            />

                            {!selectedImage && (
                                <Box sx={{ mt: 2 }}>
                                    <input
                                        accept="image/*"
                                        type="file"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                        id="image-upload"
                                    />
                                    <label htmlFor="image-upload">
                                        <Button
                                            variant="outlined"
                                            component="span"
                                            fullWidth
                                            sx={{ mb: 2 }}
                                        >
                                            בחרי תמונה
                                        </Button>
                                    </label>
                                </Box>
                            )}

                            {previewUrl && (
                                <Box sx={{ mt: 2, textAlign: 'center' }}>
                                    <img
                                        src={previewUrl}
                                        alt="תצוגה מקדימה"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: 200,
                                            objectFit: 'contain',
                                            borderRadius: 8
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)}>ביטול</Button>
                        <Button
                            onClick={handleSave}
                            variant="contained"
                            disabled={uploading}
                        >
                            {uploading ? <CircularProgress size={20} /> : 'שמור'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Preview Dialog */}
                <Dialog
                    open={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    maxWidth="md"
                    fullWidth
                    fullScreen={isMobile}
                >
                    <DialogTitle>
                        {selectedImage?.title}
                    </DialogTitle>
                    <DialogContent>
                        {selectedImage && (
                            <Box sx={{ textAlign: 'center' }}>
                                <img
                                    src={selectedImage.imageUrl}
                                    alt={selectedImage.altText || selectedImage.title}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: isMobile ? '60vh' : '70vh',
                                        objectFit: 'contain',
                                        borderRadius: 8
                                    }}
                                />
                                {selectedImage.description && (
                                    <Typography variant="body1" sx={{ mt: 2 }}>
                                        {selectedImage.description}
                                    </Typography>
                                )}
                                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                                    <Chip label={selectedImage.category} color="primary" />
                                    {selectedImage.tags?.map((tag, index) => (
                                        <Chip key={index} label={tag} variant="outlined" />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setPreviewOpen(false)}>סגור</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default GalleryPage; 