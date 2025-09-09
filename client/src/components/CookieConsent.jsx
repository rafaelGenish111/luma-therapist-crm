import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Container, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { brand } from '../theme/brandTokens';
import cookieService from '../services/cookieService';

export default function CookieConsent() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // בדוק אם יש הסכמה קיימת או אם היא פגה
        if (!cookieService.hasConsent() || cookieService.isConsentExpired()) {
            setShow(true);
        }
    }, []);

    const accept = () => {
        cookieService.saveConsent(true, true);
        setShow(false);
    };

    const decline = () => {
        cookieService.saveConsent(true, false);
        setShow(false);
    };

    if (!show) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderTop: `2px solid ${brand.primary}`,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
                py: 2
            }}
        >
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { xs: 'stretch', md: 'center' },
                        gap: 3
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            color: brand.textSecondary,
                            lineHeight: 1.6,
                            flex: 1,
                            textAlign: { xs: 'center', md: 'right' }
                        }}
                    >
                        אנו משתמשים בקובצי Cookie הכרחיים ולפעמים גם לניתוח ושיפור חוויה.
                        קרא/י על כך ב{' '}
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
                        {' '}ו{' '}
                        <Link
                            component={RouterLink}
                            to="/terms"
                            sx={{
                                color: brand.primary,
                                textDecoration: 'underline',
                                fontWeight: 500,
                                '&:hover': {
                                    color: brand.primaryDark,
                                }
                            }}
                        >
                            תנאי השימוש
                        </Link>
                        .
                    </Typography>

                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            justifyContent: { xs: 'center', md: 'flex-start' },
                            flexShrink: 0
                        }}
                    >
                        <Button
                            variant="outlined"
                            onClick={decline}
                            sx={{
                                borderColor: brand.primary,
                                color: brand.primary,
                                '&:hover': {
                                    borderColor: brand.primaryDark,
                                    backgroundColor: brand.primarySoft,
                                }
                            }}
                        >
                            דחייה
                        </Button>
                        <Button
                            variant="contained"
                            onClick={accept}
                            sx={{
                                backgroundColor: brand.primary,
                                color: 'white',
                                fontWeight: 600,
                                '&:hover': {
                                    backgroundColor: brand.primaryDark,
                                }
                            }}
                        >
                            אישור
                        </Button>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
