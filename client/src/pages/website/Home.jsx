import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Box, Typography, Button, Paper, Alert, Grid, Card, CardContent, Chip } from '@mui/material';
import BookingCard from '../../components/website/BookingCard';

export default function Home() {
    const { therapistId } = useParams();
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/therapists/${therapistId}`);
                setProfile(res.data.data);
                console.log('PROFILE DATA:', res.data.data);
            } catch (e) {
                setProfile(null);
                setError('לא ניתן לטעון את פרטי המטפלת');
            }
        };
        fetchProfile();
    }, [therapistId]);

    if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
    if (!profile) return <Typography sx={{ mt: 4 }}>טוען...</Typography>;

    const displayName = profile.businessName || `${profile.firstName} ${profile.lastName}`;

    return (
        <Box>
            {/* Hero Section */}
            <Paper
                sx={{
                    p: { xs: 4, md: 6 },
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 4,
                    mb: 6,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                }}
                elevation={0}
            >
                <Typography
                    variant="h2"
                    fontWeight={800}
                    sx={{
                        mb: 3,
                        fontSize: { xs: '2rem', md: '3rem' },
                        background: 'linear-gradient(135deg, #4A90E2 0%, #F5A623 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent'
                    }}
                >
                    ברוכה הבאה ל{displayName}
                </Typography>

                {profile.homeSummary ? (
                    <Typography
                        variant="h5"
                        sx={{
                            mb: 4,
                            color: 'text.secondary',
                            fontWeight: 400,
                            lineHeight: 1.6,
                            maxWidth: '800px',
                            mx: 'auto'
                        }}
                    >
                        {profile.homeSummary}
                    </Typography>
                ) : (
                    <Typography
                        variant="h5"
                        sx={{
                            mb: 4,
                            color: 'text.secondary',
                            fontWeight: 400,
                            lineHeight: 1.6
                        }}
                    >
                        מרחב בטוח ומקצועי לטיפול וריפוי
                    </Typography>
                )}

                {/* כרטיס קביעת תור */}
                <Box sx={{ mb: 4 }}>
                    <BookingCard therapist={profile} />
                </Box>

                {profile.clinicImage && (
                    <Box sx={{ mb: 4 }}>
                        <img
                            src={profile.clinicImage}
                            alt="קליניקה"
                            style={{
                                maxWidth: '100%',
                                maxHeight: 400,
                                borderRadius: 16,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                            }}
                        />
                    </Box>
                )}

                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    sx={{
                        py: 2,
                        px: 6,
                        borderRadius: 8,
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #4A90E2 0%, #F5A623 100%)',
                        boxShadow: '0 8px 24px rgba(74,144,226,0.3)',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 32px rgba(74,144,226,0.4)'
                        },
                        transition: 'all 0.3s ease'
                    }}
                    onClick={() => navigate('book')}
                >
                    📅 לקביעת תור
                </Button>
            </Paper>

            {/* Features Section */}
            <Grid container spacing={4} sx={{ mb: 6 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{
                        height: '100%',
                        borderRadius: 3,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                        transition: 'transform 0.3s ease',
                        '&:hover': { transform: 'translateY(-4px)' }
                    }}>
                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="h3" sx={{ mb: 2 }}>🌱</Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                                טיפול מקצועי
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                גישה מקצועית ואמפתית המותאמת אישית לכל מטופל
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{
                        height: '100%',
                        borderRadius: 3,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                        transition: 'transform 0.3s ease',
                        '&:hover': { transform: 'translateY(-4px)' }
                    }}>
                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="h3" sx={{ mb: 2 }}>🤝</Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                                מרחב בטוח
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                סביבה תומכת ללא שיפוט, המאפשרת צמיחה אישית
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{
                        height: '100%',
                        borderRadius: 3,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                        transition: 'transform 0.3s ease',
                        '&:hover': { transform: 'translateY(-4px)' }
                    }}>
                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="h3" sx={{ mb: 2 }}>⭐</Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                                תוצאות מוכחות
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                ניסיון רב שנים ושיטות טיפול מתקדמות ויעילות
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Professional Info */}
            {(profile.profession || profile.specializations) && (
                <Paper sx={{
                    p: 4,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(245,166,35,0.1) 0%, rgba(74,144,226,0.1) 100%)',
                    border: '1px solid rgba(74,144,226,0.2)'
                }}>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 3, textAlign: 'center' }}>
                        פרטים מקצועיים
                    </Typography>
                    <Grid container spacing={3} justifyContent="center">
                        {profile.profession && (
                            <Grid item>
                                <Chip
                                    label={profile.profession}
                                    color="primary"
                                    variant="filled"
                                    sx={{
                                        fontSize: '1rem',
                                        py: 3,
                                        px: 2,
                                        fontWeight: 600
                                    }}
                                />
                            </Grid>
                        )}
                        {profile.specializations && profile.specializations.length > 0 && (
                            <>
                                {profile.specializations.map((spec, index) => (
                                    <Grid item key={index}>
                                        <Chip
                                            label={spec}
                                            color="secondary"
                                            variant="outlined"
                                            sx={{
                                                fontSize: '0.9rem',
                                                py: 2.5,
                                                px: 1.5,
                                                fontWeight: 500
                                            }}
                                        />
                                    </Grid>
                                ))}
                            </>
                        )}
                    </Grid>
                </Paper>
            )}
        </Box>
    );
} 