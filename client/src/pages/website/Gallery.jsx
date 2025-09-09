import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import galleryService from '../../services/galleryService';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardMedia,
    CardContent,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    ImageList,
    ImageListItem,
    ImageListItemBar
} from '@mui/material';
import {
    Close as CloseIcon,
    ZoomIn as ZoomInIcon
} from '@mui/icons-material';

export default function Gallery() {
    const { therapistId } = useParams();
    const [images, setImages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedImage, setSelectedImage] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [galleryRes, categoriesRes] = await Promise.all([
                    galleryService.getPublic(therapistId),
                    galleryService.getCategories()
                ]);

                setImages(galleryRes.data.data || []);
                setCategories([
                    { value: 'all', label: 'הכל' },
                    ...categoriesRes.data.data || []
                ]);
            } catch (err) {
                console.error('Error fetching gallery:', err);
                setError('שגיאה בטעינת הגלריה');
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
            const galleryRes = await galleryService.getPublic(
                therapistId,
                newValue === 'all' ? null : newValue
            );
            setImages(galleryRes.data.data || []);
        } catch (err) {
            console.error('Error filtering gallery:', err);
            setError('שגיאה בסינון הגלריה');
        } finally {
            setLoading(false);
        }
    };

    const handleImageClick = (image) => {
        setSelectedImage(image);
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setSelectedImage(null);
    };

    if (loading && images.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    טוען גלריה...
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
                    גלריית תמונות
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
                    תמונות מהקליניקה, הטיפולים והאווירה שלנו
                </Typography>
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

            {/* Gallery Grid */}
            {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : images.length === 0 ? (
                <Paper sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(248,250,252,0.8) 0%, rgba(255,255,255,0.8) 100%)'
                }}>
                    <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                        אין תמונות להצגה
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        תמונות יועלו בקרוב או נסי לבחור קטגוריה אחרת
                    </Typography>
                </Paper>
            ) : (
                <ImageList
                    cols={3}
                    gap={16}
                    sx={{
                        '& .MuiImageListItem-root': {
                            borderRadius: 3,
                            overflow: 'hidden',
                            '&:hover': {
                                transform: 'scale(1.02)',
                                transition: 'transform 0.3s ease',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                            }
                        }
                    }}
                >
                    {images.map((image) => (
                        <ImageListItem
                            key={image._id}
                            sx={{
                                cursor: 'pointer',
                                position: 'relative',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0,0,0,0)',
                                    transition: 'background 0.3s ease',
                                    zIndex: 1
                                },
                                '&:hover::before': {
                                    background: 'rgba(0,0,0,0.3)'
                                },
                                '&:hover .zoom-icon': {
                                    opacity: 1
                                }
                            }}
                            onClick={() => handleImageClick(image)}
                        >
                            <img
                                src={image.imageUrl}
                                alt={image.altText || image.title}
                                loading="lazy"
                                style={{
                                    height: 300,
                                    width: '100%',
                                    objectFit: 'cover'
                                }}
                            />

                            {/* Zoom Icon */}
                            <Box
                                className="zoom-icon"
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 2,
                                    opacity: 0,
                                    transition: 'opacity 0.3s ease'
                                }}
                            >
                                <ZoomInIcon sx={{ fontSize: 40, color: 'white' }} />
                            </Box>

                            <ImageListItemBar
                                title={image.title}
                                subtitle={
                                    <Box sx={{ mt: 0.5 }}>
                                        <Chip
                                            label={categories.find(c => c.value === image.category)?.label || image.category}
                                            size="small"
                                            sx={{
                                                backgroundColor: 'rgba(255,255,255,0.2)',
                                                color: 'white',
                                                fontSize: '0.75rem'
                                            }}
                                        />
                                    </Box>
                                }
                                sx={{
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)',
                                    '& .MuiImageListItemBar-title': {
                                        fontSize: '1rem',
                                        fontWeight: 600
                                    },
                                    '& .MuiImageListItemBar-subtitle': {
                                        fontSize: '0.8rem'
                                    }
                                }}
                            />
                        </ImageListItem>
                    ))}
                </ImageList>
            )}

            {/* Image Preview Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleDialogClose}
                maxWidth="lg"
                fullWidth
                sx={{
                    '& .MuiDialog-paper': {
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        borderRadius: 3
                    }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'white',
                    pb: 1
                }}>
                    <Box>
                        <Typography variant="h6" sx={{ color: 'white' }}>
                            {selectedImage?.title}
                        </Typography>
                        {selectedImage?.category && (
                            <Chip
                                label={categories.find(c => c.value === selectedImage.category)?.label || selectedImage.category}
                                size="small"
                                sx={{
                                    mt: 1,
                                    backgroundColor: 'rgba(74,144,226,0.8)',
                                    color: 'white'
                                }}
                            />
                        )}
                    </Box>
                    <IconButton
                        onClick={handleDialogClose}
                        sx={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {selectedImage && (
                        <Box sx={{ textAlign: 'center' }}>
                            <img
                                src={selectedImage.imageUrl}
                                alt={selectedImage.altText || selectedImage.title}
                                style={{
                                    width: '100%',
                                    maxHeight: '70vh',
                                    objectFit: 'contain'
                                }}
                            />

                            {selectedImage.description && (
                                <Box sx={{ p: 3, color: 'white' }}>
                                    <Typography variant="body1" sx={{ textAlign: 'center' }}>
                                        {selectedImage.description}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
} 