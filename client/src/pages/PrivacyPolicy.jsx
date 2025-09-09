import React from 'react';
import { Box, Container, Typography, Paper, List, ListItem, ListItemText, Divider, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { brand } from '../theme/brandTokens';
import PublicNavigation from '../components/common/PublicNavigation';
import Footer from '../components/common/Footer';

export default function PrivacyPolicy() {
    const currentDate = new Date().toLocaleDateString("he-IL");

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
                <Container maxWidth="md">
                    <Paper
                        elevation={3}
                        sx={{
                            p: { xs: 3, md: 5 },
                            borderRadius: 4,
                            bgcolor: brand.surface,
                            boxShadow: `0 8px 32px ${brand.primary}15`,
                            border: `1px solid ${brand.primary}10`
                        }}
                    >
                        <Typography
                            variant="h2"
                            component="h1"
                            sx={{
                                mb: 4,
                                fontWeight: 700,
                                color: brand.text,
                                textAlign: 'right',
                                fontSize: { xs: '2rem', md: '2.5rem' },
                                textShadow: `2px 2px 4px ${brand.primary}20`
                            }}
                        >
                            מדיניות פרטיות
                        </Typography>

                        <Typography
                            variant="body1"
                            paragraph
                            sx={{
                                fontSize: '1.1rem',
                                lineHeight: 1.8,
                                color: brand.textSecondary,
                                mb: 4,
                                textAlign: 'right',
                                direction: 'rtl'
                            }}
                        >
                            אנו אוספים מידע אישי שנמסר על ידך לצורך קביעת תורים, ניהול הצהרות בריאות,
                            הפקת מסמכים ומתן שירות. ייתכן ואנו שומרים גם מזהים טכניים כגון כתובת IP וקובצי Cookie
                            לצורכי אבטחה ושיפור חוויית המשתמש.
                        </Typography>

                        <Divider sx={{ my: 4 }} />

                        <Typography
                            variant="h4"
                            component="h2"
                            sx={{
                                fontWeight: 600,
                                color: brand.text,
                                textAlign: 'right',
                                fontSize: { xs: '1.5rem', md: '1.75rem' },
                                borderBottom: `2px solid ${brand.primary}`,
                                pb: 1,
                                mb: 3
                            }}
                        >
                            מי אנו וכיצד ליצור קשר
                        </Typography>
                        <Typography
                            variant="body1"
                            paragraph
                            sx={{
                                lineHeight: 1.7,
                                color: brand.textSecondary,
                                mb: 4,
                                textAlign: 'right',
                                direction: 'rtl',
                                fontSize: '1rem'
                            }}
                        >
                            בעל המאגר: {import.meta.env.VITE_SITE_OWNER_NAME || "Luma - פלטפורמת המטפלות"}.
                            לפניות בנושא פרטיות: {import.meta.env.VITE_PRIVACY_EMAIL || "privacy@luma.com"}.
                        </Typography>

                        <Typography
                            variant="h4"
                            component="h2"
                            sx={{
                                fontWeight: 600,
                                color: brand.text,
                                textAlign: 'right',
                                fontSize: { xs: '1.5rem', md: '1.75rem' },
                                borderBottom: `2px solid ${brand.primary}`,
                                pb: 1,
                                mb: 3
                            }}
                        >
                            מטרות העיבוד
                        </Typography>
                        <Box sx={{ mb: 4, textAlign: 'right' }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                py: 1
                            }}>
                                <Box sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: brand.primary,
                                    mr: 2
                                }} />
                                <Typography sx={{
                                    color: brand.textSecondary,
                                    fontSize: '1rem',
                                    fontWeight: 500
                                }}>
                                    קביעת וניהול תורים
                                </Typography>
                            </Box>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                py: 1
                            }}>
                                <Box sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: brand.primary,
                                    mr: 2
                                }} />
                                <Typography sx={{
                                    color: brand.textSecondary,
                                    fontSize: '1rem',
                                    fontWeight: 500
                                }}>
                                    ניהול הצהרות בריאות (כולל חתימה דיגיטלית)
                                </Typography>
                            </Box>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                py: 1
                            }}>
                                <Box sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: brand.primary,
                                    mr: 2
                                }} />
                                <Typography sx={{
                                    color: brand.textSecondary,
                                    fontSize: '1rem',
                                    fontWeight: 500
                                }}>
                                    שירות לקוחות, חשבוניות ותכתובות
                                </Typography>
                            </Box>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                py: 1
                            }}>
                                <Box sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: brand.primary,
                                    mr: 2
                                }} />
                                <Typography sx={{
                                    color: brand.textSecondary,
                                    fontSize: '1rem',
                                    fontWeight: 500
                                }}>
                                    אבטחה, מניעת הונאות ושיפור שירות
                                </Typography>
                            </Box>
                        </Box>

                        <Typography
                            variant="h4"
                            component="h2"
                            sx={{
                                fontWeight: 600,
                                color: brand.text,
                                textAlign: 'right',
                                fontSize: { xs: '1.5rem', md: '1.75rem' },
                                borderBottom: `2px solid ${brand.primary}`,
                                pb: 1,
                                mb: 3
                            }}
                        >
                            זכויותיך
                        </Typography>
                        <Box sx={{ mb: 4, textAlign: 'right' }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                py: 1
                            }}>
                                <Box sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: brand.primary,
                                    mr: 2
                                }} />
                                <Typography sx={{
                                    color: brand.textSecondary,
                                    fontSize: '1rem',
                                    fontWeight: 500
                                }}>
                                    עיון במידע עליך
                                </Typography>
                            </Box>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                py: 1
                            }}>
                                <Box sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: brand.primary,
                                    mr: 2
                                }} />
                                <Typography sx={{
                                    color: brand.textSecondary,
                                    fontSize: '1rem',
                                    fontWeight: 500
                                }}>
                                    בקשת תיקון או מחיקה
                                </Typography>
                            </Box>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                py: 1
                            }}>
                                <Box sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: brand.primary,
                                    mr: 2
                                }} />
                                <Typography sx={{
                                    color: brand.textSecondary,
                                    fontSize: '1rem',
                                    fontWeight: 500
                                }}>
                                    הגבלת שימוש ושינוי העדפות הסכמה
                                </Typography>
                            </Box>
                        </Box>

                        <Typography
                            variant="h4"
                            component="h2"
                            sx={{
                                fontWeight: 600,
                                color: brand.text,
                                textAlign: 'right',
                                fontSize: { xs: '1.5rem', md: '1.75rem' },
                                borderBottom: `2px solid ${brand.primary}`,
                                pb: 1,
                                mb: 3
                            }}
                        >
                            שיתוף עם צדדים שלישיים
                        </Typography>
                        <Typography
                            variant="body1"
                            paragraph
                            sx={{
                                lineHeight: 1.7,
                                color: brand.textSecondary,
                                mb: 4,
                                textAlign: 'right',
                                direction: 'rtl',
                                fontSize: '1rem'
                            }}
                        >
                            ספקי תשתית, דיוור, סליקה ולוח פגישות (כגון Calendly) פועלים כמחזיקים במידע.
                            אנו מתקשרים עמם בהסכמי עיבוד נתונים ומחייבים אבטחה מתאימה.
                        </Typography>

                        <Typography
                            variant="h4"
                            component="h2"
                            sx={{
                                fontWeight: 600,
                                color: brand.text,
                                textAlign: 'right',
                                fontSize: { xs: '1.5rem', md: '1.75rem' },
                                borderBottom: `2px solid ${brand.primary}`,
                                pb: 1,
                                mb: 3
                            }}
                        >
                            אבטחת מידע
                        </Typography>
                        <Typography
                            variant="body1"
                            paragraph
                            sx={{
                                lineHeight: 1.7,
                                color: brand.textSecondary,
                                mb: 4,
                                textAlign: 'right',
                                direction: 'rtl',
                                fontSize: '1rem'
                            }}
                        >
                            שימוש ב‑HTTPS, בקרות גישה, גיבויים והצפנה לנתונים רגישים. במקרה אירוע אבטחה,
                            נפעל לפי נוהל תגובה ודיווח.
                        </Typography>

                        <Typography
                            variant="body1"
                            paragraph
                            sx={{
                                lineHeight: 1.7,
                                color: brand.textSecondary,
                                mb: 4,
                                textAlign: 'right',
                                direction: 'rtl',
                                fontSize: '1rem',
                                p: 3,
                                borderRadius: 2,
                                bgcolor: brand.primarySoft,
                                border: `1px solid ${brand.primary}30`
                            }}
                        >
                            לבקשות עיון, תיקון או מחיקה של המידע האישי שלך:{' '}
                            <Link
                                component={RouterLink}
                                to="/privacy-request"
                                sx={{
                                    color: brand.primary,
                                    textDecoration: 'underline',
                                    fontWeight: 600,
                                    '&:hover': {
                                        color: brand.primaryDark,
                                    }
                                }}
                            >
                                לחצו כאן
                            </Link>
                            .
                        </Typography>

                        <Divider sx={{ my: 4 }} />

                        <Typography
                            variant="body2"
                            sx={{
                                color: brand.textMuted,
                                textAlign: 'center',
                                fontStyle: 'italic',
                                mt: 4,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: brand.surfaceAlt,
                                border: `1px solid ${brand.primary}20`
                            }}
                        >
                            עדכון אחרון: {currentDate}
                        </Typography>
                    </Paper>
                </Container>
            </Box>
            <Footer />
        </Box>
    );
}
