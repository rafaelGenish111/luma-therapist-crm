import React, { useEffect, useState, createContext, useMemo } from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import { getPublicTheme } from '../../services/therapistService';
import api from '../../services/api';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Container, Box, Link as MuiLink } from '@mui/material';
import Copyright from '../../components/common/Copyright';

const navLinks = [
    { to: '.', label: 'בית' },
    { to: 'about', label: 'אודות' },
    { to: 'articles', label: 'מאמרים' },
    { to: 'gallery', label: 'תמונות' },
    { to: 'health-declaration', label: 'הצהרת בריאות' },
    { to: 'book', label: 'קביעת תור' },
    { to: 'contact', label: 'צור קשר' },
];

export default function WebsiteLayout() {
    const { therapistId } = useParams();
    const [themeData, setThemeData] = useState(null);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchThemeAndProfile = async () => {
            try {
                const [theme, prof] = await Promise.all([
                    getPublicTheme(therapistId),
                    api.get(`/therapists/${therapistId}`)
                ]);
                setThemeData(theme);
                setProfile(prof.data.data);
            } catch {
                setThemeData(null);
                setProfile(null);
            }
        };
        fetchThemeAndProfile();
    }, [therapistId]);

    const muiTheme = useMemo(() => createTheme({
        direction: 'rtl',
        typography: {
            fontFamily: themeData?.fontFamily || 'Heebo',
        },
        palette: {
            mode: 'light',
            primary: { main: themeData?.primaryColor || '#4A90E2' },
            secondary: { main: themeData?.secondaryColor || '#F5A623' },
            background: {
                default: themeData?.backgroundUrl ? undefined : themeData?.primaryColor || '#fff',
                paper: '#fff',
            },
        },
    }), [themeData]);

    const displayName = profile?.businessName || (profile ? `${profile.firstName} ${profile.lastName}` : '');

    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <Box minHeight="100vh" sx={{
                background: themeData?.backgroundUrl ? `url(${themeData.backgroundUrl}) center/cover` : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <AppBar position="static" color="primary" elevation={4} sx={{
                    background: 'linear-gradient(135deg, rgba(74,144,226,0.95) 0%, rgba(74,144,226,1) 100%)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: `3px solid ${themeData?.secondaryColor || '#F5A623'}`
                }}>
                    <Toolbar sx={{
                        justifyContent: 'space-between',
                        py: 1,
                        minHeight: { xs: 60, md: 70 }
                    }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            {themeData?.logoUrl && (
                                <Box sx={{
                                    width: { xs: 40, md: 52 },
                                    height: { xs: 40, md: 52 },
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}>
                                    <img
                                        src={themeData.logoUrl}
                                        alt="לוגו"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </Box>
                            )}
                            <Typography
                                variant="h5"
                                fontWeight={800}
                                sx={{
                                    color: '#fff',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                    fontSize: { xs: '1.2rem', md: '1.5rem' }
                                }}
                            >
                                {displayName}
                            </Typography>
                        </Box>
                        <Box sx={{
                            display: { xs: 'none', md: 'flex' },
                            gap: 1
                        }}>
                            {navLinks.map(link => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    end={link.to === '.'}
                                    style={({ isActive }) => ({
                                        color: '#fff',
                                        padding: '8px 16px',
                                        borderRadius: '25px',
                                        textDecoration: 'none',
                                        fontWeight: isActive ? 700 : 500,
                                        background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                                        transition: 'all 0.3s ease',
                                        border: isActive ? '2px solid rgba(255,255,255,0.4)' : '2px solid transparent',
                                        backdropFilter: isActive ? 'blur(5px)' : 'none'
                                    })}
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                        </Box>
                        {/* Mobile menu - simplified for now */}
                        <Box sx={{
                            display: { xs: 'flex', md: 'none' },
                            flexDirection: 'column',
                            gap: 0.5
                        }}>
                            {[1, 2, 3].map(i => (
                                <Box key={i} sx={{
                                    width: 20,
                                    height: 2,
                                    backgroundColor: '#fff',
                                    borderRadius: 1
                                }} />
                            ))}
                        </Box>
                    </Toolbar>
                </AppBar>
                {/* תוכן */}
                <Container maxWidth="lg" sx={{
                    py: { xs: 3, md: 6 },
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Outlet />
                </Container>
                {/* Footer */}
                <Box component="footer" sx={{
                    background: `linear-gradient(135deg, ${themeData?.primaryColor || '#4A90E2'} 0%, ${themeData?.secondaryColor || '#F5A623'} 100%)`,
                    color: '#fff',
                    py: 4,
                    mt: 'auto',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
                }}>
                    <Container maxWidth="lg">
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 2
                        }}>
                            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                                    {displayName}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    טיפול מקצועי ואמפתי
                                </Typography>
                                <Copyright variant="minimal" sx={{ color: 'white', opacity: 0.9, mt: 1 }} />
                                <MuiLink
                                    href="/terms"
                                    color="inherit"
                                    sx={{
                                        textDecoration: 'none',
                                        '&:hover': { textDecoration: 'underline' },
                                        fontWeight: 400,
                                        fontSize: '0.875rem',
                                        opacity: 0.8,
                                        mt: 0.5,
                                        display: 'block'
                                    }}
                                >
                                    תנאי שימוש ומדיניות פרטיות
                                </MuiLink>
                            </Box>

                            <Box sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 2,
                                alignItems: 'center'
                            }}>
                                {profile?.businessEmail && (
                                    <MuiLink
                                        href={`mailto:${profile.businessEmail}`}
                                        color="inherit"
                                        sx={{
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' },
                                            fontWeight: 500
                                        }}
                                    >
                                        📧 {profile.businessEmail}
                                    </MuiLink>
                                )}
                                {profile?.businessPhone && (
                                    <MuiLink
                                        href={`tel:${profile.businessPhone}`}
                                        color="inherit"
                                        sx={{
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' },
                                            fontWeight: 500
                                        }}
                                    >
                                        📞 {profile.businessPhone}
                                    </MuiLink>
                                )}
                            </Box>
                        </Box>
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
} 