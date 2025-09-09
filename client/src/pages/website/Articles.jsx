import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import articleService from '../../services/articleService';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Avatar,
    Divider,
    Stack
} from '@mui/material';
import {
    CalendarToday as DateIcon,
    Person as AuthorIcon,
    ReadMore as ReadMoreIcon,
    Article as ArticleIcon
} from '@mui/icons-material';

export default function Articles() {
    const { therapistId } = useParams();
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [articlesRes, categoriesRes] = await Promise.all([
                    articleService.getPublic({ therapistId }),
                    articleService.getCategories()
                ]);

                setArticles(articlesRes.data.data || []);
                setCategories([
                    { value: 'all', label: 'הכל' },
                    ...categoriesRes.data.data || []
                ]);

                // קבלת פרטי המטפלת
                if (articlesRes.data.data && articlesRes.data.data.length > 0) {
                    setProfile({
                        name: articlesRes.data.data[0].author?.firstName + ' ' + articlesRes.data.data[0].author?.lastName,
                        profession: articlesRes.data.data[0].author?.profession
                    });
                }
            } catch (err) {
                console.error('Error fetching articles:', err);
                setError('שגיאה בטעינת המאמרים');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [therapistId]);

    const handleCategoryChange = async (event, newValue) => {
        setSelectedCategory(newValue);
        setLoading(true);
        try {
            const articlesRes = await articleService.getPublic({
                therapistId,
                category: newValue === 'all' ? undefined : newValue
            });
            setArticles(articlesRes.data.data || []);
        } catch (err) {
            console.error('Error filtering articles:', err);
            setError('שגיאה בסינון המאמרים');
        } finally {
            setLoading(false);
        }
    };

    const handleReadMore = (article) => {
        // ניווט לעמוד המאמר המלא
        navigate(`/website/${therapistId}/articles/${article.slug || article._id}`);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const truncateText = (text, maxLength = 150) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    };

    if (loading && articles.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    טוען מאמרים...
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header Section */}
            <Paper sx={{
                p: { xs: 4, md: 6 },
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(74,144,226,0.1) 0%, rgba(245,166,35,0.1) 100%)',
                borderRadius: 4,
                mb: 6,
                border: '1px solid rgba(74,144,226,0.2)'
            }}>
                <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{
                        mb: 2,
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        background: 'linear-gradient(135deg, #4A90E2 0%, #F5A623 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent'
                    }}
                >
                    מאמרים מקצועיים
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto', mb: 3 }}>
                    מאמרים, טיפים וידע מקצועי בתחום הטיפול והבריאות
                </Typography>

                {profile && (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        mt: 3
                    }}>
                        <Avatar sx={{
                            bgcolor: 'primary.main',
                            width: 48,
                            height: 48
                        }}>
                            <ArticleIcon />
                        </Avatar>
                        <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="h6" fontWeight={600}>
                                {profile.name}
                            </Typography>
                            {profile.profession && (
                                <Typography variant="body2" color="text.secondary">
                                    {profile.profession}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                )}
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Category Filter */}
            {categories.length > 1 && (
                <Paper sx={{ mb: 4, borderRadius: 3 }}>
                    <Tabs
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTabs-indicator': {
                                backgroundColor: '#4A90E2'
                            }
                        }}
                    >
                        {categories.map((category) => (
                            <Tab
                                key={category.value}
                                label={category.label}
                                value={category.value}
                                sx={{
                                    minWidth: 100,
                                    fontWeight: 600,
                                    '&.Mui-selected': {
                                        color: '#4A90E2'
                                    }
                                }}
                            />
                        ))}
                    </Tabs>
                </Paper>
            )}

            {/* Articles Grid */}
            {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : articles.length === 0 ? (
                <Paper sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(248,250,252,0.8) 0%, rgba(255,255,255,0.8) 100%)'
                }}>
                    <ArticleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                        אין מאמרים להצגה
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        מאמרים יפורסמו בקרוב או נסי לבחור קטגוריה אחרת
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={4}>
                    {articles.map((article) => (
                        <Grid item xs={12} md={6} lg={4} key={article._id}>
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 3,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                                }
                            }}>
                                {/* Article Image */}
                                {article.featuredImage && (
                                    <Box
                                        component="img"
                                        src={article.featuredImage}
                                        alt={article.title}
                                        sx={{
                                            width: '100%',
                                            height: 200,
                                            objectFit: 'cover'
                                        }}
                                    />
                                )}

                                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                    {/* Category */}
                                    {article.category && (
                                        <Chip
                                            label={categories.find(c => c.value === article.category)?.label || article.category}
                                            size="small"
                                            sx={{
                                                mb: 2,
                                                backgroundColor: 'rgba(74,144,226,0.1)',
                                                color: '#4A90E2',
                                                fontWeight: 600
                                            }}
                                        />
                                    )}

                                    {/* Title */}
                                    <Typography
                                        variant="h6"
                                        fontWeight={700}
                                        sx={{
                                            mb: 2,
                                            color: 'text.primary',
                                            lineHeight: 1.4
                                        }}
                                    >
                                        {article.title}
                                    </Typography>

                                    {/* Summary/Excerpt */}
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mb: 3,
                                            lineHeight: 1.6
                                        }}
                                    >
                                        {truncateText(article.summary || article.excerpt)}
                                    </Typography>

                                    {/* Metadata */}
                                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                                        {article.publishedAt && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <DateIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDate(article.publishedAt)}
                                                </Typography>
                                            </Box>
                                        )}

                                        {article.readTime && (
                                            <Typography variant="caption" color="text.secondary">
                                                {article.readTime} דקות קריאה
                                            </Typography>
                                        )}
                                    </Stack>

                                    {/* Tags */}
                                    {article.tags && article.tags.length > 0 && (
                                        <Box sx={{ mb: 2 }}>
                                            {article.tags.slice(0, 3).map((tag, index) => (
                                                <Chip
                                                    key={index}
                                                    label={tag}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        mr: 1,
                                                        mb: 1,
                                                        fontSize: '0.75rem',
                                                        height: 24
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </CardContent>

                                <Divider />

                                <CardActions sx={{ p: 3, pt: 2 }}>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<ReadMoreIcon />}
                                        onClick={() => handleReadMore(article)}
                                        sx={{
                                            borderRadius: 2,
                                            fontWeight: 600,
                                            background: 'linear-gradient(135deg, #4A90E2 0%, #F5A623 100%)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #3A7BC8 0%, #E09612 100%)',
                                            }
                                        }}
                                    >
                                        קרא עוד
                                    </Button>

                                    {article.views && (
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ ml: 'auto' }}
                                        >
                                            {article.views} צפיות
                                        </Typography>
                                    )}
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
} 
