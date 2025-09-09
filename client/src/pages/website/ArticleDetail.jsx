import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import articleService from '../../services/articleService';
import {
    Box,
    Typography,
    Paper,
    Button,
    Chip,
    Alert,
    CircularProgress,
    Avatar,
    Divider,
    Stack,
    IconButton
} from '@mui/material';
import {
    CalendarToday as DateIcon,
    Person as AuthorIcon,
    ArrowBack as BackIcon,
    Share as ShareIcon,
    Article as ArticleIcon
} from '@mui/icons-material';

export default function ArticleDetail() {
    const { therapistId, articleSlug } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                setLoading(true);
                const response = await articleService.getBySlug(articleSlug);
                setArticle(response.data.data);
            } catch (err) {
                console.error('Error fetching article:', err);
                setError('שגיאה בטעינת המאמר');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [articleSlug]);

    const handleBack = () => {
        navigate(`/website/${therapistId}/articles`);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.summary || article.excerpt,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('הקישור הועתק ללוח');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    טוען מאמר...
                </Typography>
            </Box>
        );
    }

    if (error || !article) {
        return (
            <Box sx={{ textAlign: 'center', py: 6 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error || 'מאמר לא נמצא'}
                </Alert>
                <Button variant="contained" onClick={handleBack}>
                    חזור למאמרים
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            {/* Back Button */}
            <Button
                startIcon={<BackIcon />}
                onClick={handleBack}
                sx={{ mb: 3, fontWeight: 600 }}
            >
                חזור למאמרים
            </Button>

            {/* Article Header */}
            <Paper sx={{
                p: { xs: 4, md: 6 },
                borderRadius: 4,
                mb: 4,
                background: 'linear-gradient(135deg, rgba(74,144,226,0.05) 0%, rgba(245,166,35,0.05) 100%)',
                border: '1px solid rgba(74,144,226,0.1)'
            }}>
                {/* Category */}
                {article.category && (
                    <Chip
                        label={article.category}
                        sx={{
                            mb: 3,
                            backgroundColor: 'rgba(74,144,226,0.1)',
                            color: '#4A90E2',
                            fontWeight: 600
                        }}
                    />
                )}

                {/* Title */}
                <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{
                        mb: 3,
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        lineHeight: 1.3,
                        color: 'text.primary'
                    }}
                >
                    {article.title}
                </Typography>

                {/* Summary */}
                {article.summary && (
                    <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{
                            mb: 4,
                            fontWeight: 400,
                            lineHeight: 1.6
                        }}
                    >
                        {article.summary}
                    </Typography>
                )}

                {/* Metadata */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={3}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* Author */}
                        <Avatar sx={{
                            bgcolor: 'primary.main',
                            width: 48,
                            height: 48
                        }}>
                            <AuthorIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                                {article.author?.firstName} {article.author?.lastName}
                            </Typography>
                            {article.author?.profession && (
                                <Typography variant="body2" color="text.secondary">
                                    {article.author.profession}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        {/* Date */}
                        {article.publishedAt && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DateIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                    {formatDate(article.publishedAt)}
                                </Typography>
                            </Box>
                        )}

                        {/* Read Time */}
                        {article.readTime && (
                            <Typography variant="body2" color="text.secondary">
                                {article.readTime} דקות קריאה
                            </Typography>
                        )}

                        {/* Share Button */}
                        <IconButton
                            onClick={handleShare}
                            sx={{
                                bgcolor: 'rgba(74,144,226,0.1)',
                                '&:hover': { bgcolor: 'rgba(74,144,226,0.2)' }
                            }}
                        >
                            <ShareIcon sx={{ color: '#4A90E2' }} />
                        </IconButton>
                    </Box>
                </Stack>
            </Paper>

            {/* Featured Image */}
            {article.featuredImage && (
                <Box sx={{ mb: 4 }}>
                    <img
                        src={article.featuredImage}
                        alt={article.title}
                        style={{
                            width: '100%',
                            maxHeight: 500,
                            objectFit: 'cover',
                            borderRadius: 16,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                        }}
                    />
                </Box>
            )}

            {/* Article Content */}
            <Paper sx={{
                p: { xs: 4, md: 6 },
                borderRadius: 3,
                mb: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
                <Typography
                    variant="body1"
                    sx={{
                        lineHeight: 1.8,
                        fontSize: '1.1rem',
                        '& p': { mb: 3 },
                        '& h1, & h2, & h3, & h4, & h5, & h6': {
                            mt: 4,
                            mb: 2,
                            fontWeight: 700,
                            color: 'primary.main'
                        },
                        '& ul, & ol': {
                            mb: 3,
                            pl: 3
                        },
                        '& li': {
                            mb: 1
                        },
                        '& blockquote': {
                            borderLeft: '4px solid #4A90E2',
                            pl: 3,
                            py: 2,
                            bgcolor: 'rgba(74,144,226,0.05)',
                            borderRadius: '0 8px 8px 0',
                            fontStyle: 'italic',
                            mb: 3
                        }
                    }}
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />
            </Paper>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
                <Paper sx={{
                    p: 3,
                    borderRadius: 3,
                    mb: 4,
                    background: 'linear-gradient(135deg, rgba(245,166,35,0.05) 0%, rgba(74,144,226,0.05) 100%)'
                }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                        תגיות
                    </Typography>
                    <Box>
                        {article.tags.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag}
                                variant="outlined"
                                sx={{
                                    mr: 1,
                                    mb: 1,
                                    borderColor: '#4A90E2',
                                    color: '#4A90E2',
                                    '&:hover': {
                                        backgroundColor: 'rgba(74,144,226,0.1)'
                                    }
                                }}
                            />
                        ))}
                    </Box>
                </Paper>
            )}

            {/* Back to Articles */}
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<ArticleIcon />}
                    onClick={handleBack}
                    sx={{
                        py: 2,
                        px: 4,
                        borderRadius: 3,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #4A90E2 0%, #F5A623 100%)',
                        boxShadow: '0 6px 20px rgba(74,144,226,0.3)',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 28px rgba(74,144,226,0.4)'
                        },
                        transition: 'all 0.3s ease'
                    }}
                >
                    עוד מאמרים
                </Button>
            </Box>
        </Box>
    );
} 
