import React from 'react';
import { Box, Container, Typography, Paper, List, ListItem, ListItemText, Divider, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { brand } from '../theme/brandTokens';
import PublicNavigation from '../components/common/PublicNavigation';
import Footer from '../components/common/Footer';

export default function TermsOfUse() {
    const businessName = "Luma - פתרונות משרד למטפלות ומטפלים";
    const companyId = "ח.פ. 000000000"; // החלף בהמשך
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
                            תנאי שימוש
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
                            ברוך/ה הבא/ה לאתר {businessName} ({companyId}) ("האתר"). שימוש באתר מהווה הסכמה לתנאי שימוש אלה.
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
                            1. כללי
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
                                    האתר מופעל ומנוהל על ידי {businessName}.
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
                                    התנאים מנוסחים בלשון זכר מטעמי נוחות אך מתייחסים לכל המגדרים.
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
                            2. השימוש באתר
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
                                    השימוש באתר מותר למטרות חוקיות ושקופות בלבד.
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
                                    חל איסור לבצע פעולות הפוגעות בפרטיות, באבטחה או בזכויות צדדים שלישיים.
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
                            3. רישום, טפסים ושירותים
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
                                    בעת מילוי טפסים (יצירת קשר, הרשמה, הצהרת בריאות) עשוי להיאסף מידע אישי.
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
                                    מסירת מידע נעשית מרצון; היעדר מסירה עלול להגביל קבלת שירות.
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
                                    סימון תיבת הסכמה לתנאי שימוש ולמדיניות פרטיות הוא תנאי לשליחת טפסים.
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
                            4. פרטיות והגנת מידע
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
                                    עיבוד המידע יתבצע לפי חוק הגנת הפרטיות (כולל תיקון 13) ולפי{' '}
                                    <Link
                                        component={RouterLink}
                                        to="/privacy"
                                        sx={{
                                            color: brand.primary,
                                            textDecoration: 'underline',
                                            fontWeight: 500,
                                            '&:hover': {
                                                color: brand.primaryDark,
                                            }
                                        }}
                                    >
                                        מדיניות הפרטיות
                                    </Link>
                                    .
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
                                    למשתמש/ת עומדות זכויות עיון, תיקון ומחיקה באמצעות פניה לקשר שבמדיניות הפרטיות.
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
                                    ספקים חיצוניים (אחסון, סליקה, ניהול פגישות) פועלים כמחזיקים במידע מטעם האתר.
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
                            5. קניין רוחני
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
                            כל התכנים באתר מוגנים בזכויות יוצרים. אין להעתיק/להפיץ/לעבד ללא אישור מראש ובכתב.
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
                            6. אחריות
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
                                    השימוש באתר באחריות המשתמש/ת. ייתכנו טעויות, תקלות ושיבושים.
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
                                    האתר לא יישא באחריות לנזקים עקיפים/תוצאתיים עקב שימוש בתכנים או בשירותים.
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
                            7. שינויים
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
                            אנו רשאים לעדכן תנאים אלו מעת לעת. גרסה מעודכנת תפורסם באתר ותחול מרגע פרסומה.
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
                            8. דין וסמכות
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
                            על התנאים יחולו דיני מדינת ישראל. סמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים במחוז ירושלים.
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


