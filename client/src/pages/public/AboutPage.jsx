import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { brand } from '../../theme/brandTokens';
import PublicNavigation from '../../components/common/PublicNavigation';
import Footer from '../../components/common/Footer';

export default function AboutPage() {
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
                            mb: 4,
                            fontWeight: 700,
                            color: brand.text,
                            textAlign: 'center'
                        }}
                    >
                        אודות Luma
                    </Typography>

                    <Paper
                        elevation={2}
                        sx={{
                            p: 4,
                            borderRadius: 3,
                            bgcolor: brand.surface
                        }}
                    >
                        <Typography
                            variant="h5"
                            sx={{
                                mb: 3,
                                color: brand.primary,
                                fontWeight: 600
                            }}
                        >
                            מי אנחנו?
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                fontSize: '1.125rem',
                                lineHeight: 1.8,
                                color: brand.textSecondary,
                                mb: 3
                            }}
                        >
                            Luma היא פלטפורמה מתקדמת המיועדת למטפלות ומטפלים מקצועיים.
                            אנו מאמינים שכל מטפל צריך כלים דיגיטליים מתקדמים כדי לספק
                            שירות מקצועי ואיכותי ללקוחותיו.
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                fontSize: '1.125rem',
                                lineHeight: 1.8,
                                color: brand.textSecondary
                            }}
                        >
                            הפלטפורמה שלנו משלבת CRM מתקדם, בונה אתרים אישיים,
                            ניהול פגישות חכם ומערכת תשלומים מאובטחת - הכל במקום אחד.
                        </Typography>
                    </Paper>
                </Container>
            </Box>
            <Footer />
        </Box>
    );
}
