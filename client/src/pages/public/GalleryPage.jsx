import React from 'react';
import { Box, Container, Typography, Grid, Card, CardMedia, CardContent } from '@mui/material';
import { brand } from '../../theme/brandTokens';
import PublicNavigation from '../../components/common/PublicNavigation';
import Footer from '../../components/common/Footer';

export default function GalleryPage() {
    const galleryItems = [
        {
            title: 'ממשק ניהול מתקדם',
            description: 'ממשק ידידותי ומותאם אישית לניהול כל הפעילות העסקית.',
            image: 'https://via.placeholder.com/400x300/3BB9FF/FFFFFF?text=ממשק+ניהול',
            category: 'ממשק'
        },
        {
            title: 'אתרים אישיים',
            description: 'דוגמאות לאתרים אישיים שנוצרו בפלטפורמה.',
            image: 'https://via.placeholder.com/400x300/2795D6/FFFFFF?text=אתר+אישי',
            category: 'אתרים'
        },
        {
            title: 'לוח זמנים חכם',
            description: 'ניהול פגישות עם תזכורות אוטומטיות.',
            image: 'https://via.placeholder.com/400x300/E8F7FF/0F172A?text=לוח+זמנים',
            category: 'ניהול'
        },
        {
            title: 'מערכת תשלומים',
            description: 'אינטגרציה עם Stripe לתשלומים מאובטחים.',
            image: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=תשלומים',
            category: 'תשלומים'
        },
        {
            title: 'ניהול לקוחות',
            description: 'CRM מתקדם לניהול לקוחות ופגישות.',
            image: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=לקוחות',
            category: 'CRM'
        },
        {
            title: 'הצהרות בריאות',
            description: 'מערכת דיגיטלית לניהול הצהרות בריאות.',
            image: 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=בריאות',
            category: 'בריאות'
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
                        גלריה
                    </Typography>

                    <Typography
                        variant="h5"
                        sx={{
                            mb: 4,
                            color: brand.textSecondary,
                            textAlign: 'center'
                        }}
                    >
                        הצצה לפלטפורמה שלנו ולשירותים שאנו מציעים
                    </Typography>

                    <Grid container spacing={4}>
                        {galleryItems.map((item, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                                        }
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={item.image}
                                        alt={item.title}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                    <CardContent>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: brand.primary,
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: 1
                                            }}
                                        >
                                            {item.category}
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mt: 1,
                                                mb: 2,
                                                fontWeight: 600,
                                                color: brand.text
                                            }}
                                        >
                                            {item.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: brand.textSecondary,
                                                lineHeight: 1.6
                                            }}
                                        >
                                            {item.description}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>
            <Footer />
        </Box>
    );
}
