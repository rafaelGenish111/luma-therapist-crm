import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Avatar, Rating } from '@mui/material';
import { brand } from '../../theme/brandTokens';
import PublicNavigation from '../../components/common/PublicNavigation';
import Footer from '../../components/common/Footer';

export default function TestimonialsPage() {
    const testimonials = [
        {
            name: 'שרה כהן',
            profession: 'פסיכולוגית קלינית',
            rating: 5,
            text: 'הפלטפורמה שינתה את הדרך שבה אני מנהלת את הקליניקה. הכל פשוט, יעיל ומקצועי. ממליצה בחום!',
            avatar: 'https://via.placeholder.com/80x80/3BB9FF/FFFFFF?text=ש'
        },
        {
            name: 'דוד לוי',
            profession: 'מטפל הוליסטי',
            rating: 5,
            text: 'האתר האישי שנוצר עבורי נראה מקצועי ומרשים. הלקוחות שלי אוהבים את הנוחות של קביעת תורים אונליין.',
            avatar: 'https://via.placeholder.com/80x80/2795D6/FFFFFF?text=ד'
        },
        {
            name: 'מיכל רוזן',
            profession: 'מאמנת אישית',
            rating: 5,
            text: 'מערכת התשלומים עובדת בצורה מושלמת. אני חוסכת המון זמן בניהול חשבוניות ותשלומים.',
            avatar: 'https://via.placeholder.com/80x80/10B981/FFFFFF?text=מ'
        },
        {
            name: 'יוסי גולדברג',
            profession: 'מטפל זוגי',
            rating: 5,
            text: 'הממשק ידידותי מאוד והתמיכה הטכנית מעולה. הפלטפורמה עזרה לי להגדיל את העסק שלי.',
            avatar: 'https://via.placeholder.com/80x80/F59E0B/FFFFFF?text=י'
        },
        {
            name: 'נועה שפירא',
            profession: 'יועצת חינוכית',
            rating: 5,
            text: 'אני משתמשת בפלטפורמה כבר שנה וחצי. זה פשוט עובד! הכל מאורגן וברור.',
            avatar: 'https://via.placeholder.com/80x80/EF4444/FFFFFF?text=נ'
        },
        {
            name: 'עמית כהן',
            profession: 'מטפל באמנות',
            rating: 5,
            text: 'הגלריה והמאמרים עוזרים לי להציג את העבודה שלי בצורה מקצועית. הלקוחות אוהבים את התוכן.',
            avatar: 'https://via.placeholder.com/80x80/8B5CF6/FFFFFF?text=ע'
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
                        מה הלקוחות שלנו אומרים
                    </Typography>

                    <Typography
                        variant="h5"
                        sx={{
                            mb: 6,
                            color: brand.textSecondary,
                            textAlign: 'center'
                        }}
                    >
                        מאות מטפלות ומטפלים כבר משתמשים בפלטפורמה שלנו
                    </Typography>

                    <Grid container spacing={4}>
                        {testimonials.map((testimonial, index) => (
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
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                            <Avatar
                                                src={testimonial.avatar}
                                                sx={{
                                                    width: 60,
                                                    height: 60,
                                                    mr: 2,
                                                    bgcolor: brand.primary
                                                }}
                                            >
                                                {testimonial.name.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: brand.text
                                                    }}
                                                >
                                                    {testimonial.name}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: brand.textSecondary
                                                    }}
                                                >
                                                    {testimonial.profession}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Rating
                                            value={testimonial.rating}
                                            readOnly
                                            sx={{
                                                mb: 2,
                                                '& .MuiRating-iconFilled': {
                                                    color: brand.primary
                                                }
                                            }}
                                        />

                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: brand.textSecondary,
                                                lineHeight: 1.7,
                                                fontStyle: 'italic'
                                            }}
                                        >
                                            "{testimonial.text}"
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    <Box sx={{ textAlign: 'center', mt: 6 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                color: brand.primary,
                                fontWeight: 600
                            }}
                        >
                            הצטרפו למאות המטפלות שכבר משתמשות בפלטפורמה שלנו
                        </Typography>
                    </Box>
                </Container>
            </Box>
            <Footer />
        </Box>
    );
}
