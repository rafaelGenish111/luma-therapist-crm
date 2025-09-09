import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    TextField,
    Button,
    Alert,
    Stack,
    Chip
} from '@mui/material';
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    Schedule as ScheduleIcon,
    Send as SendIcon
} from '@mui/icons-material';

export default function Contact() {
    const { therapistId } = useParams();
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [sent, setSent] = useState(false);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/therapists/${therapistId}`);
                setProfile(res.data.data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };
        fetchProfile();
    }, [therapistId]);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // כאן תתווסף שליחה לשרת
            await new Promise(resolve => setTimeout(resolve, 1000)); // סימולציה
            setSent(true);
            setForm({ name: '', email: '', message: '' });
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    const displayName = profile?.businessName || (profile ? `${profile.firstName} ${profile.lastName}` : '');

    // נתוני שעות פעילות לדוגמה
    const workingHours = [
        { day: 'ראשון', hours: '9:00 - 17:00' },
        { day: 'שני', hours: '9:00 - 17:00' },
        { day: 'שלישי', hours: '9:00 - 17:00' },
        { day: 'רביעי', hours: '9:00 - 17:00' },
        { day: 'חמישי', hours: '9:00 - 15:00' }
    ];

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
                    צרי קשר
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
                    נשמח לענות על כל שאלה ולעזור לך למצוא את הטיפול המתאים עבורך
                </Typography>
            </Paper>

            <Grid container spacing={4}>
                {/* Contact Information */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                        פרטי התקשרות
                    </Typography>

                    <Stack spacing={3}>
                        {/* Phone */}
                        {profile?.businessPhone && (
                            <Card sx={{
                                borderRadius: 3,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                transition: 'transform 0.2s ease',
                                '&:hover': { transform: 'translateY(-2px)' }
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #4A90E2 0%, #F5A623 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <PhoneIcon sx={{ color: '#fff' }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" fontWeight={600}>
                                                טלפון
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary">
                                                {profile.businessPhone}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}

                        {/* Email */}
                        {profile?.businessEmail && (
                            <Card sx={{
                                borderRadius: 3,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                transition: 'transform 0.2s ease',
                                '&:hover': { transform: 'translateY(-2px)' }
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #F5A623 0%, #4A90E2 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <EmailIcon sx={{ color: '#fff' }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" fontWeight={600}>
                                                אימייל
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary">
                                                {profile.businessEmail}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}

                        {/* Location */}
                        {profile?.clinicAddress && (
                            <Card sx={{
                                borderRadius: 3,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                transition: 'transform 0.2s ease',
                                '&:hover': { transform: 'translateY(-2px)' }
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #4A90E2 0%, #F5A623 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <LocationIcon sx={{ color: '#fff' }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" fontWeight={600}>
                                                כתובת הקליניקה
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary">
                                                {profile.clinicAddress}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}

                        {/* Working Hours */}
                        <Card sx={{
                            borderRadius: 3,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                                    <Box sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #F5A623 0%, #4A90E2 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <ScheduleIcon sx={{ color: '#fff' }} />
                                    </Box>
                                    <Typography variant="h6" fontWeight={600}>
                                        שעות פעילות
                                    </Typography>
                                </Box>
                                <Stack spacing={1}>
                                    {workingHours.map((day, index) => (
                                        <Box key={index} display="flex" justifyContent="space-between">
                                            <Typography variant="body2" fontWeight={500}>
                                                {day.day}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {day.hours}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>

                {/* Contact Form */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                        שלחי לנו הודעה
                    </Typography>

                    {sent ? (
                        <Alert
                            severity="success"
                            sx={{
                                borderRadius: 3,
                                fontSize: '1.1rem',
                                p: 3
                            }}
                        >
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                ההודעה נשלחה בהצלחה! 🎉
                            </Typography>
                            <Typography variant="body1">
                                נחזור אליך בהקדם האפשרי
                            </Typography>
                        </Alert>
                    ) : (
                        <Paper sx={{
                            p: 4,
                            borderRadius: 3,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)'
                        }}>
                            <form onSubmit={handleSubmit}>
                                <Stack spacing={3}>
                                    <TextField
                                        name="name"
                                        label="שם מלא"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        fullWidth
                                        variant="outlined"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&:hover fieldset': {
                                                    borderColor: '#4A90E2'
                                                }
                                            }
                                        }}
                                    />

                                    <TextField
                                        name="email"
                                        label="כתובת אימייל"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        fullWidth
                                        variant="outlined"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&:hover fieldset': {
                                                    borderColor: '#4A90E2'
                                                }
                                            }
                                        }}
                                    />

                                    <TextField
                                        name="message"
                                        label="הודעה"
                                        value={form.message}
                                        onChange={handleChange}
                                        required
                                        fullWidth
                                        multiline
                                        rows={4}
                                        variant="outlined"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&:hover fieldset': {
                                                    borderColor: '#4A90E2'
                                                }
                                            }
                                        }}
                                    />

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        startIcon={<SendIcon />}
                                        disabled={loading}
                                        sx={{
                                            py: 2,
                                            borderRadius: 3,
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            background: 'linear-gradient(135deg, #4A90E2 0%, #F5A623 100%)',
                                            boxShadow: '0 6px 20px rgba(74,144,226,0.3)',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 8px 28px rgba(74,144,226,0.4)'
                                            },
                                            '&:disabled': {
                                                background: 'rgba(0,0,0,0.12)'
                                            },
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {loading ? 'שולח...' : 'שלח הודעה'}
                                    </Button>
                                </Stack>
                            </form>
                        </Paper>
                    )}

                    {/* Professional Info */}
                    {profile && (
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                על המטפלת
                            </Typography>
                            <Paper sx={{
                                p: 3,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, rgba(245,166,35,0.05) 0%, rgba(74,144,226,0.05) 100%)',
                                border: '1px solid rgba(74,144,226,0.1)'
                            }}>
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                                    {displayName}
                                </Typography>
                                {profile.profession && (
                                    <Chip
                                        label={profile.profession}
                                        color="primary"
                                        sx={{ mb: 2 }}
                                    />
                                )}
                                {profile.professionalDescription && (
                                    <Typography variant="body2" color="text.secondary">
                                        {profile.professionalDescription}
                                    </Typography>
                                )}
                            </Paper>
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
} 
