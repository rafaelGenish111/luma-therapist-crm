import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardHeader } from '@mui/material';
import { brand } from '../../theme/brandTokens';
import PublicNavigation from '../../components/common/PublicNavigation';
import Footer from '../../components/common/Footer';

export default function ServicesPage() {
    const services = [
        {
            title: 'CRM מתקדם',
            description: 'ניהול לקוחות, פגישות ותשלומים במקום אחד עם ממשק ידידותי ומותאם אישית.',
            icon: '👥'
        },
        {
            title: 'אתרים אישיים',
            description: 'בונה אתרים מותאם אישית למטפלות עם עיצוב מקצועי ותוכן מותאם.',
            icon: '🌐'
        },
        {
            title: 'לוח זמנים חכם',
            description: 'ניהול פגישות עם תזכורות אוטומטיות ואינטגרציה עם Calendly.',
            icon: '📅'
        },
        {
            title: 'מערכת תשלומים',
            description: 'אינטגרציה עם Stripe לתשלומים מאובטחים וניהול חשבוניות.',
            icon: '💳'
        },
        {
            title: 'ניהול תוכן',
            description: 'יצירה וניהול מאמרים, גלריה ותוכן מקצועי לאתר האישי.',
            icon: '📝'
        },
        {
            title: 'הצהרות בריאות',
            description: 'מערכת דיגיטלית לניהול הצהרות בריאות וטפסים רפואיים.',
            icon: '🏥'
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
                        השירותים שלנו
                    </Typography>

                    <Grid container spacing={4}>
                        {services.map((service, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        borderRadius: 3,
                                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                                        }
                                    }}
                                >
                                    <CardHeader
                                        avatar={
                                            <Typography variant="h2" sx={{ fontSize: '2.5rem' }}>
                                                {service.icon}
                                            </Typography>
                                        }
                                        title={
                                            <Typography
                                                variant="h5"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: brand.text
                                                }}
                                            >
                                                {service.title}
                                            </Typography>
                                        }
                                        sx={{ pb: 1 }}
                                    />
                                    <CardContent>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: brand.textSecondary,
                                                lineHeight: 1.7
                                            }}
                                        >
                                            {service.description}
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
