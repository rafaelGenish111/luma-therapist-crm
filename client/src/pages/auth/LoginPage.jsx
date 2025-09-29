import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Typography, Alert, CircularProgress, Paper, useTheme, useMediaQuery, Link } from '@mui/material';
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/common/Logo';

const roleRedirect = (role) => {
    console.log('roleRedirect called with role:', role);
    const upperRole = (role || '').toUpperCase();
    console.log('roleRedirect - upperRole:', upperRole);

    switch (upperRole) {
        case 'ADMIN':
        case 'SUPER_ADMIN':
            console.log('roleRedirect - returning /admin');
            return '/admin';
        case 'THERAPIST':
            console.log('roleRedirect - returning /dashboard');
            return '/dashboard';
        case 'CLIENT':
        case 'USER':
            console.log('roleRedirect - returning /dashboard');
            return '/dashboard';
        case 'INSTITUTE_ADMIN':
            console.log('roleRedirect - returning /institute');
            return '/institute';
        default:
            console.log('roleRedirect - returning / (default)');
            return '/';
    }
};

const LoginPage = () => {
    const { login, loading, user } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [forgotOpen, setForgotOpen] = useState(false);

    React.useEffect(() => {
        if (user && (user.role || user.userType)) {
            const role = user.role || user.userType;
            const redirectPath = roleRedirect(role);
            console.log('LoginPage useEffect - User role:', role);
            console.log('LoginPage useEffect - Redirect path:', redirectPath);
            console.log('LoginPage useEffect - Full user:', user);
            navigate(redirectPath, { replace: true });
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            // איפוס סשן קודם כדי למנוע הדבקה ממשתמש אחר
            // Skip logout - not needed before login
            const res = await login(form.email, form.password);
            if (res.success && (res.data?.user?.role || res.data?.user?.userType)) {
                navigate(roleRedirect(res.data.user.role || res.data.user.userType), { replace: true });
            } else {
                setError(res.error || 'שגיאה בהתחברות');
            }
        } catch (err) {
            setError('שגיאה בהתחברות');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
            bgcolor="#f5f5f5"
            sx={{
                '@media (max-width: 768px)': {
                    padding: '1rem'
                }
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: isMobile ? 2 : 4,
                    minWidth: isMobile ? '100%' : 350,
                    maxWidth: isMobile ? '100%' : 400,
                    '@media (max-width: 480px)': {
                        padding: '1.5rem'
                    }
                }}
            >
                <Box display="flex" justifyContent="center" mb={isMobile ? 2 : 3}>
                    <Logo variant="default" />
                </Box>
                <Typography
                    variant={isMobile ? "h6" : "h5"}
                    mb={isMobile ? 1.5 : 2}
                    align="center"
                    sx={{
                        '@media (max-width: 480px)': {
                            fontSize: '1.3rem'
                        }
                    }}
                >
                    התחברות
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="אימייל"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                        sx={{
                            '@media (max-width: 480px)': {
                                '& .MuiInputBase-input': {
                                    fontSize: '16px' // Prevents zoom on iOS
                                }
                            }
                        }}
                    />
                    <TextField
                        label="סיסמה"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                        sx={{
                            '@media (max-width: 480px)': {
                                '& .MuiInputBase-input': {
                                    fontSize: '16px' // Prevents zoom on iOS
                                }
                            }
                        }}
                    />
                    {error && (
                        <Alert
                            severity="error"
                            sx={{
                                mt: 2,
                                '@media (max-width: 480px)': {
                                    fontSize: '0.9rem'
                                }
                            }}
                        >
                            {error}
                        </Alert>
                    )}
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{
                            mt: 2,
                            py: isMobile ? 1.5 : 1,
                            '@media (max-width: 480px)': {
                                py: 2,
                                fontSize: '1rem'
                            }
                        }}
                        disabled={submitting || loading}
                        startIcon={submitting ? <CircularProgress size={20} /> : null}
                    >
                        התחבר
                    </Button>
                </form>
                <Box display="flex" justifyContent="space-between" mt={1}>
                    <Link component="button" type="button" variant="body2" onClick={() => setForgotOpen(true)} underline="hover">
                        שכחת סיסמה?
                    </Link>
                </Box>
            </Paper>
            <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
        </Box>
    );
};

export default LoginPage; 