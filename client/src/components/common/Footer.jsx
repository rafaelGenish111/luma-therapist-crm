import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Link, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Email, Phone, WhatsApp } from '@mui/icons-material';
import Logo from './Logo';
import { brand } from '../../theme/brandTokens';

const Footer = ({ variant = 'default' }) => {
    const currentYear = new Date().getFullYear();
    const [contactInfo, setContactInfo] = useState({ phone: '+972-50-123-4567', whatsapp: '+972-50-123-4567', email: 'info@luma.co.il' });

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/websites/site-settings');
                const json = await res.json();
                if (json.success && (json.data?.contact)) {
                    setContactInfo({
                        phone: json.data.contact.phone || '',
                        whatsapp: json.data.contact.phone || '',
                        email: json.data.contact.email || '',
                    });
                }
            } catch { }
        };
        load();
    }, []);

    const getFooterStyle = () => {
        switch (variant) {
            case 'therapist':
                return {
                    bgcolor: 'background.paper',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    py: 4,
                };
            case 'admin':
                return {
                    background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 100%)`,
                    color: 'white',
                    py: 4,
                };
            default:
                return {
                    bgcolor: 'grey.100',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    py: 4,
                };
        }
    };

    const linkStyle = {
        textDecoration: 'none',
        color: variant === 'admin' ? 'white' : 'text.secondary',
        '&:hover': {
            textDecoration: 'underline',
            color: variant === 'admin' ? 'white' : brand.primary
        }
    };



    return (
        <Box component="footer" sx={{
            ...getFooterStyle(),
            width: '100%',
            overflowX: 'hidden'
        }}>
            <Container maxWidth="lg" sx={{
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <Grid container spacing={4}>
                    {/* טור ראשון - דפים */}
                    <Grid item xs={12} md={4}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                color: variant === 'admin' ? 'white' : brand.text,
                                mb: 3,
                                textAlign: { xs: 'center', md: 'right' }
                            }}
                        >
                            דפים
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                alignItems: { xs: 'center', md: 'flex-start' }
                            }}
                        >
                            <Link component={RouterLink} to="/" variant="body2" sx={linkStyle}>
                                בית
                            </Link>
                            <Link component={RouterLink} to="/about" variant="body2" sx={linkStyle}>
                                אודות
                            </Link>
                            <Link component={RouterLink} to="/services" variant="body2" sx={linkStyle}>
                                שירותים
                            </Link>
                            <Link component={RouterLink} to="/gallery" variant="body2" sx={linkStyle}>
                                גלריה
                            </Link>
                            <Link component={RouterLink} to="/testimonials" variant="body2" sx={linkStyle}>
                                המלצות
                            </Link>
                            <Link component={RouterLink} to="/contact" variant="body2" sx={linkStyle}>
                                צור קשר
                            </Link>
                        </Box>
                    </Grid>

                    {/* טור שני - מדיניות */}
                    <Grid item xs={12} md={4}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                color: variant === 'admin' ? 'white' : brand.text,
                                mb: 3,
                                textAlign: { xs: 'center', md: 'right' }
                            }}
                        >
                            מדיניות
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                alignItems: { xs: 'center', md: 'flex-start' }
                            }}
                        >
                            <Link component={RouterLink} to="/privacy" variant="body2" sx={linkStyle}>
                                מדיניות פרטיות
                            </Link>
                            <Link component={RouterLink} to="/privacy-request" variant="body2" sx={linkStyle}>
                                בקשות פרטיות
                            </Link>
                            <Link component={RouterLink} to="/terms" variant="body2" sx={linkStyle}>
                                תנאי שימוש
                            </Link>
                        </Box>
                    </Grid>

                    {/* טור שלישי - פרטי קשר */}
                    <Grid item xs={12} md={4}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: { xs: 'center', md: 'flex-start' },
                                gap: 3
                            }}
                        >
                            {/* לוגו */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Logo variant="footer" />

                            </Box>

                            {/* פרטי קשר */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    alignItems: { xs: 'center', md: 'flex-start' }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Phone sx={{ fontSize: 20, color: variant === 'admin' ? 'white' : brand.primary }} />
                                    <Link
                                        href={`tel:${contactInfo.phone}`}
                                        variant="body2"
                                        sx={linkStyle}
                                    >
                                        {contactInfo.phone}
                                    </Link>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WhatsApp sx={{ fontSize: 20, color: variant === 'admin' ? 'white' : brand.primary }} />
                                    <Link
                                        href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        variant="body2"
                                        sx={linkStyle}
                                    >
                                        WhatsApp
                                    </Link>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Email sx={{ fontSize: 20, color: variant === 'admin' ? 'white' : brand.primary }} />
                                    <Link
                                        href={`mailto:${contactInfo.email}`}
                                        variant="body2"
                                        sx={linkStyle}
                                    >
                                        {contactInfo.email}
                                    </Link>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>

                {/* קו מפריד */}
                <Box
                    sx={{
                        borderTop: '1px solid',
                        borderColor: variant === 'admin' ? 'rgba(255,255,255,0.2)' : 'divider',
                        mt: 4,
                        pt: 3
                    }}
                />

                {/* זכויות שמורות */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            color: variant === 'admin' ? 'white' : 'text.secondary',
                            textAlign: { xs: 'center', md: 'right' }
                        }}
                    >
                        © {currentYear} כל הזכויות שמורות
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: variant === 'admin' ? 'white' : 'text.secondary',
                            textAlign: { xs: 'center', md: 'left' },
                            fontWeight: 500
                        }}
                    >
                        Luma - פתרונות משרד למטפלות ומטפלים
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;
