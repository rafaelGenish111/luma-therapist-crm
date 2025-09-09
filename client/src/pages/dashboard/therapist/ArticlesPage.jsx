import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Typography, Paper, Button, Grid, Card, CardMedia, CardContent, CardActions,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, IconButton,
    Chip, Alert, CircularProgress, Switch, FormControlLabel, CardHeader, Avatar
} from '@mui/material';
import {
    Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Visibility as ViewIcon,
    Publish as PublishIcon, Schedule as UnpublishIcon, AccessTime as TimeIcon,
    RemoveRedEye as ViewsIcon
} from '@mui/icons-material';

import articleService from '../../../services/articleService';

const ArticlesPage = () => {
    const { id } = useParams(); // אם יש ID, זה מאמר ספציפי
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [form, setForm] = useState({
        title: '',
        subtitle: '',
        content: '',
        excerpt: '',
        category: '',
        tags: '',
        seoTitle: '',
        seoDescription: '',
        isPublished: false,
        isFeatured: false,
        image: null
    });
    const [previewUrl, setPreviewUrl] = useState('');

    // טעינת נתונים
    const fetchData = async () => {
        console.log('=== fetchData called ===');
        console.log('=== Token from localStorage ===', localStorage.getItem('accessToken'));
        setLoading(true);
        setError('');
        try {
            if (id) {
                console.log('=== ID found, redirecting ===', id);
                // אם יש ID, זה מאמר ספציפי - נחזור לדף הראשי
                window.location.href = '/dashboard/articles';
                return;
            }

            console.log('=== Fetching articles and categories ===');
            const [articlesRes, categoriesRes] = await Promise.all([
                articleService.getAll(),
                articleService.getCategories()
            ]);
            console.log('=== Articles response ===', articlesRes);
            console.log('=== Categories response ===', categoriesRes);

            setArticles(articlesRes.data.data || []);
            setCategories(categoriesRes.data.data || []);
            console.log('=== Data set successfully ===');
        } catch (err) {
            console.error('=== Error in fetchData ===', err);
            console.error('=== Error response ===', err.response);
            console.error('=== Error config ===', err.config);
            console.error('=== Error URL ===', err.config?.url);
            setError('שגיאה בטעינת המאמרים');
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
            subtitle: '',
            content: '',
            excerpt: '',
            category: '',
            tags: '',
            seoTitle: '',
            seoDescription: '',
            isPublished: false,
            isFeatured: false,
            image: null
        });
        setPreviewUrl('');
        setSelectedArticle(null);
        setDialogOpen(true);
    };

    // פתיחת טופס עריכה
    const handleEdit = (article) => {
        setForm({
            title: article.title,
            subtitle: article.subtitle || '',
            content: article.content,
            excerpt: article.excerpt || '',
            category: article.category,
            tags: article.tags ? article.tags.join(', ') : '',
            seoTitle: article.seoTitle || article.title,
            seoDescription: article.seoDescription || article.excerpt || '',
            isPublished: article.isPublished,
            isFeatured: article.isFeatured,
            image: null
        });
        setSelectedArticle(article);
        setPreviewUrl(article.imageUrl || '');
        setDialogOpen(true);
    };

    // פתיחת תצוגה מקדימה
    const handlePreview = (article) => {
        setSelectedArticle(article);
        setPreviewOpen(true);
    };

    // שמירה (הוספה/עדכון)
    const handleSave = async () => {
        if (!form.title || !form.content || !form.category) {
            setError('כותרת, תוכן וקטגוריה נדרשים');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('subtitle', form.subtitle);
            formData.append('content', form.content);
            formData.append('excerpt', form.excerpt);
            formData.append('category', form.category);
            formData.append('tags', form.tags);
            formData.append('seoTitle', form.seoTitle);
            formData.append('seoDescription', form.seoDescription);
            formData.append('isPublished', form.isPublished);
            formData.append('isFeatured', form.isFeatured);

            if (form.image) {
                formData.append('image', form.image);
            }

            if (selectedArticle) {
                await articleService.update(selectedArticle._id, {
                    title: form.title,
                    subtitle: form.subtitle,
                    content: form.content,
                    excerpt: form.excerpt,
                    category: form.category,
                    tags: form.tags,
                    seoTitle: form.seoTitle,
                    seoDescription: form.seoDescription,
                    isPublished: form.isPublished,
                    isFeatured: form.isFeatured
                });
            } else {
                await articleService.create(formData);
            }

            setSuccess(selectedArticle ? 'מאמר עודכן בהצלחה' : 'מאמר נוצר בהצלחה');
            setDialogOpen(false);
            fetchData();
        } catch (err) {
            setError('שגיאה בשמירת המאמר');
        } finally {
            setSaving(false);
        }
    };

    // מחיקה
    const handleDelete = async (article) => {
        if (!window.confirm('האם למחוק את המאמר?')) return;
        try {
            await articleService.delete(article._id);
            setSuccess('מאמר נמחק בהצלחה');
            fetchData();
        } catch (err) {
            setError('שגיאה במחיקת המאמר');
        }
    };

    // פרסום/ביטול פרסום
    const handleTogglePublish = async (article) => {
        try {
            await articleService.togglePublish(article._id);
            fetchData();
        } catch (err) {
            setError('שגיאה בעדכון סטטוס פרסום');
        }
    };

    // טיפול בבחירת קובץ
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('גודל הקובץ לא יכול לעלות על 5MB');
                return;
            }
            setForm({ ...form, image: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // טיפול בשינוי שדות
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // פורמט תאריך
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('he-IL');
    };

    return (
        <Box>
            <Box p={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4">ניהול מאמרים</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                    >
                        כתוב מאמר חדש
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
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {articles.length === 0 ? (
                            <Grid item xs={12}>
                                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                                    <Typography variant="h6" color="textSecondary" mb={2}>
                                        אין מאמרים עדיין
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        startIcon={<AddIcon />}
                                        onClick={handleAdd}
                                    >
                                        כתוב מאמר ראשון
                                    </Button>
                                </Paper>
                            </Grid>
                        ) : (
                            articles.map((article) => (
                                <Grid item xs={12} md={6} lg={4} key={article._id}>
                                    <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        {article.imageUrl && (
                                            <CardMedia
                                                component="img"
                                                height="200"
                                                image={article.imageUrl}
                                                alt={article.title}
                                                sx={{ objectFit: 'cover' }}
                                            />
                                        )}
                                        <CardHeader
                                            avatar={
                                                <Avatar sx={{ bgcolor: article.isPublished ? 'success.main' : 'warning.main' }}>
                                                    {article.isPublished ? <PublishIcon /> : <UnpublishIcon />}
                                                </Avatar>
                                            }
                                            action={
                                                <Box>
                                                    <IconButton
                                                        onClick={() => handleTogglePublish(article)}
                                                        color={article.isPublished ? 'success' : 'warning'}
                                                    >
                                                        {article.isPublished ? <PublishIcon /> : <UnpublishIcon />}
                                                    </IconButton>
                                                </Box>
                                            }
                                            title={article.title}
                                            subheader={
                                                <Box>
                                                    <Typography variant="caption" display="block">
                                                        {formatDate(article.createdAt)}
                                                    </Typography>
                                                    <Chip
                                                        label={categories.find(c => c.value === article.category)?.label || article.category}
                                                        size="small"
                                                        sx={{ mt: 1 }}
                                                    />
                                                </Box>
                                            }
                                        />
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            {article.subtitle && (
                                                <Typography variant="subtitle2" color="textSecondary" mb={1}>
                                                    {article.subtitle}
                                                </Typography>
                                            )}
                                            <Typography variant="body2" color="textSecondary" sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical'
                                            }}>
                                                {article.excerpt || article.content.substring(0, 150)}...
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={1} mt={2}>
                                                <TimeIcon fontSize="small" color="action" />
                                                <Typography variant="caption" color="textSecondary">
                                                    {article.readTime} דקות קריאה
                                                </Typography>
                                                <ViewsIcon fontSize="small" color="action" />
                                                <Typography variant="caption" color="textSecondary">
                                                    {article.views} צפיות
                                                </Typography>
                                            </Box>
                                            {article.isFeatured && (
                                                <Chip
                                                    label="מומלץ"
                                                    size="small"
                                                    color="primary"
                                                    sx={{ mt: 1 }}
                                                />
                                            )}
                                        </CardContent>
                                        <CardActions>
                                            <Button
                                                size="small"
                                                onClick={() => handlePreview(article)}
                                            >
                                                צפייה
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={() => handleEdit(article)}
                                            >
                                                עריכה
                                            </Button>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(article)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))
                        )}
                    </Grid>
                )}

                {/* דיאלוג טופס */}
                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
                    <DialogTitle>
                        {selectedArticle ? 'עריכת מאמר' : 'כתיבת מאמר חדש'}
                    </DialogTitle>
                    <DialogContent>
                        <Box display="flex" gap={3} mt={2}>
                            <Box flex={1}>
                                <TextField
                                    name="title"
                                    label="כותרת"
                                    value={form.title}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    name="subtitle"
                                    label="כותרת משנה"
                                    value={form.subtitle}
                                    onChange={handleChange}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    name="category"
                                    label="קטגוריה"
                                    value={form.category}
                                    onChange={handleChange}
                                    select
                                    fullWidth
                                    required
                                    sx={{ mb: 2 }}
                                >
                                    {categories.map((category) => (
                                        <MenuItem key={category.value} value={category.value}>
                                            {category.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    name="excerpt"
                                    label="תקציר"
                                    value={form.excerpt}
                                    onChange={handleChange}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    name="content"
                                    label="תוכן המאמר"
                                    value={form.content}
                                    onChange={handleChange}
                                    fullWidth
                                    multiline
                                    rows={10}
                                    required
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    name="tags"
                                    label="תגיות (מופרדות בפסיקים)"
                                    value={form.tags}
                                    onChange={handleChange}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    name="seoTitle"
                                    label="כותרת SEO"
                                    value={form.seoTitle}
                                    onChange={handleChange}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    name="seoDescription"
                                    label="תיאור SEO"
                                    value={form.seoDescription}
                                    onChange={handleChange}
                                    fullWidth
                                    multiline
                                    rows={2}
                                    sx={{ mb: 2 }}
                                />
                                <Box display="flex" gap={2} mb={2}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                name="isPublished"
                                                checked={form.isPublished}
                                                onChange={handleChange}
                                            />
                                        }
                                        label="מפורסם"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                name="isFeatured"
                                                checked={form.isFeatured}
                                                onChange={handleChange}
                                            />
                                        }
                                        label="מומלץ"
                                    />
                                </Box>
                                {!selectedArticle && (
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        fullWidth
                                    >
                                        הוסף תמונת כותרת
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </Button>
                                )}
                            </Box>
                            {previewUrl && (
                                <Box width={200}>
                                    <Typography variant="subtitle2" mb={1}>תצוגה מקדימה:</Typography>
                                    <img
                                        src={previewUrl}
                                        alt="תצוגה מקדימה"
                                        style={{
                                            width: '100%',
                                            height: 150,
                                            objectFit: 'cover',
                                            borderRadius: 4
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
                            disabled={saving}
                        >
                            {saving ? <CircularProgress size={20} /> : 'שמור'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* דיאלוג תצוגה מקדימה */}
                <Dialog
                    open={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogTitle>{selectedArticle?.title}</DialogTitle>
                    <DialogContent>
                        {selectedArticle && (
                            <Box>
                                {selectedArticle.imageUrl && (
                                    <img
                                        src={selectedArticle.imageUrl}
                                        alt={selectedArticle.title}
                                        style={{
                                            width: '100%',
                                            maxHeight: 300,
                                            objectFit: 'cover',
                                            borderRadius: 8,
                                            marginBottom: 16
                                        }}
                                    />
                                )}
                                {selectedArticle.subtitle && (
                                    <Typography variant="h6" color="textSecondary" mb={2}>
                                        {selectedArticle.subtitle}
                                    </Typography>
                                )}
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {selectedArticle.content}
                                </Typography>
                                <Box mt={3} display="flex" gap={2} flexWrap="wrap">
                                    <Chip
                                        label={categories.find(c => c.value === selectedArticle.category)?.label || selectedArticle.category}
                                    />
                                    {selectedArticle.tags && selectedArticle.tags.map((tag, index) => (
                                        <Chip key={index} label={tag} variant="outlined" size="small" />
                                    ))}
                                </Box>
                                <Box mt={2} display="flex" gap={3} color="textSecondary">
                                    <Typography variant="caption">
                                        זמן קריאה: {selectedArticle.readTime} דקות
                                    </Typography>
                                    <Typography variant="caption">
                                        צפיות: {selectedArticle.views}
                                    </Typography>
                                    <Typography variant="caption">
                                        נוצר: {formatDate(selectedArticle.createdAt)}
                                    </Typography>
                                    {selectedArticle.publishedAt && (
                                        <Typography variant="caption">
                                            פורסם: {formatDate(selectedArticle.publishedAt)}
                                        </Typography>
                                    )}
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

export default ArticlesPage; 