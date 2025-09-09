import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, TextField, Button, Paper } from '@mui/material';
import { Email, Phone, LocationOn, AccessTime } from '@mui/icons-material';
import { brand } from '../../theme/brandTokens';
import CTAButton from '../../components/common/CTAButton';
import PublicNavigation from '../../components/common/PublicNavigation';
import Footer from '../../components/common/Footer';
import ConsentCheckbox from '../../components/ConsentCheckbox';

export default function ContactPage() {
    const [consent, setConsent] = useState(false);
    const [siteContact, setSiteContact] = useState({ phone: '', email: '', address: '', whatsappLink: '' });
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!consent) {
            alert('יש לאשר את מדיניות הפרטיות ותנאי השימוש');
            return;
        }
        // כאן תהיה הלוגיקה לשליחת הטופס
        console.log('Form submitted:', formData);
        alert('הטופס נשלח בהצלחה!');
    };

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/websites/site-settings');
                const json = await res.json();
                if (json.success) {
                    setSiteContact({
                        phone: json.data?.contact?.phone || '',
                        email: json.data?.contact?.email || '',
                        address: json.data?.contact?.address || '',
                        whatsappLink: json.data?.contact?.whatsappLink || ''
                    });
                }
            } catch { }
        };
        load();
    }, []);

    const contactInfo = [
        {
            icon: <Email sx={{ fontSize: 40, color: brand.primary }} />,
            title: 'אימייל',
            details: siteContact.email || 'info@luma.com',
            description: 'שלחו לנו הודעה ונחזור אליכם תוך 24 שעות'
        },
        {
            icon: <Phone sx={{ fontSize: 40, color: brand.primary }} />,
            title: 'טלפון',
            details: siteContact.phone || '03-1234567',
            description: 'שיחת ייעוץ חינם - זמינים בימים א-ה 9:00-18:00'
        },
        {
            icon: <LocationOn sx={{ fontSize: 40, color: brand.primary }} />,
            title: 'כתובת',
            details: siteContact.address || 'תל אביב, ישראל',
            description: 'משרד ראשי בתל אביב - פגישות בתיאום מראש'
        },
        {
            icon: <AccessTime sx={{ fontSize: 40, color: brand.primary }} />,
            title: 'שעות פעילות',
            details: 'א-ה 9:00-18:00',
            description: 'תמיכה טכנית זמינה 24/7'
        }
    ];

    return (
        <Box
            component="main"
            dir="rtl"
            sx={{
                minHeight: '100vh',
                bgcolor: brand.surfaceAlt
            }}
        >
            <PublicNavigation />
            <Box sx={{ py: 6 }}>
                <Container maxWidth="lg">
                    <Typography
                        variant="h2"
                        component="h1"
                        sx={{
                            mb: 6,
                            fontWeight: 700,
                            color: brand.text,
                            textAlign: 'center'
                        }}
                    >
                        יצירת קשר
                    </Typography>

                    <Typography
                        variant="h5"
                        sx={{
                            mb: 6,
                            color: brand.textSecondary,
                            textAlign: 'center'
                        }}
                    >
                        נשמח לעזור לכם להפוך את העסק שלכם לדיגיטלי
                    </Typography>

                    <Grid container spacing={4}>
                        {/* מידע ליצירת קשר */}
                        <Grid item xs={12} md={4}>
                            <Typography
                                variant="h4"
                                sx={{
                                    mb: 4,
                                    fontWeight: 600,
                                    color: brand.text
                                }}
                            >
                                פרטי קשר
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {contactInfo.map((info, index) => (
                                    <Card
                                        key={index}
                                        sx={{
                                            borderRadius: 3,
                                            transition: 'transform 0.2s ease-in-out',
                                            '&:hover': {
                                                transform: 'translateY(-2px)'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                {info.icon}
                                                <Box>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: brand.text,
                                                            mb: 1
                                                        }}
                                                    >
                                                        {info.title}
                                                    </Typography>
                                                    <Typography
                                                        variant="body1"
                                                        sx={{
                                                            fontWeight: 500,
                                                            color: brand.primary,
                                                            mb: 1
                                                        }}
                                                    >
                                                        {info.details}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: brand.textSecondary,
                                                            lineHeight: 1.6
                                                        }}
                                                    >
                                                        {info.description}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Grid>

                        {/* טופס יצירת קשר */}
                        <Grid item xs={12} md={8}>
                            <Paper
                                elevation={2}
                                sx={{
                                    p: 4,
                                    borderRadius: 3,
                                    bgcolor: brand.surface
                                }}
                            >
                                <Typography
                                    variant="h4"
                                    sx={{
                                        mb: 4,
                                        fontWeight: 600,
                                        color: brand.text
                                    }}
                                >
                                    שלחו לנו הודעה
                                </Typography>

                                <form onSubmit={handleSubmit}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="שם מלא"
                                                variant="outlined"
                                                value={formData.fullName}
                                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                                required
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '&:hover fieldset': {
                                                            borderColor: brand.primary,
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: brand.primary,
                                                        },
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="טלפון"
                                                variant="outlined"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                required
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '&:hover fieldset': {
                                                            borderColor: brand.primary,
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: brand.primary,
                                                        },
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="אימייל"
                                                type="email"
                                                variant="outlined"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                required
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '&:hover fieldset': {
                                                            borderColor: brand.primary,
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: brand.primary,
                                                        },
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="נושא"
                                                variant="outlined"
                                                value={formData.subject}
                                                onChange={(e) => handleInputChange('subject', e.target.value)}
                                                required
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '&:hover fieldset': {
                                                            borderColor: brand.primary,
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: brand.primary,
                                                        },
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="הודעה"
                                                multiline
                                                rows={6}
                                                variant="outlined"
                                                value={formData.message}
                                                onChange={(e) => handleInputChange('message', e.target.value)}
                                                required
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '&:hover fieldset': {
                                                            borderColor: brand.primary,
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: brand.primary,
                                                        },
                                                    },
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <ConsentCheckbox
                                                checked={consent}
                                                onChange={setConsent}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <CTAButton
                                                variant="gradient"
                                                size="large"
                                                fullWidth
                                                type="submit"
                                                disabled={!consent}
                                                sx={{ mt: 2 }}
                                            >
                                                שלח הודעה
                                            </CTAButton>
                                        </Grid>
                                    </Grid>
                                </form>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* מידע נוסף */}
                    <Box sx={{ mt: 8, textAlign: 'center' }}>
                        <Typography
                            variant="h5"
                            sx={{
                                mb: 3,
                                fontWeight: 600,
                                color: brand.text
                            }}
                        >
                            למה לבחור ב־Luma?
                        </Typography>

                        <Grid container spacing={3} justifyContent="center">
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: brand.textSecondary,
                                        fontWeight: 500
                                    }}
                                >
                                    ✅ תמיכה 24/7
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: brand.textSecondary,
                                        fontWeight: 500
                                    }}
                                >
                                    ✅ התחלה מהירה
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: brand.textSecondary,
                                        fontWeight: 500
                                    }}
                                >
                                    ✅ מחירים שקופים
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: brand.textSecondary,
                                        fontWeight: 500
                                    }}
                                >
                                    ✅ ללא התחייבות
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </Container>
            </Box>
            <Footer />
        </Box>
    );
}
