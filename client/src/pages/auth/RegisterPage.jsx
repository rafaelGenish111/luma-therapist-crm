import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Typography, Alert, CircularProgress, Paper, MenuItem, useTheme, useMediaQuery } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/common/Logo';
import ConsentCheckbox from '../../components/ConsentCheckbox';

const roleRedirect = (role) => {
    switch ((role || '').toUpperCase()) {
        case 'SUPER_ADMIN':
            return '/admin';
        case 'THERAPIST':
            return '/dashboard';
        case 'CLIENT':
            return '/appointments';
        case 'INSTITUTE_ADMIN':
            return '/institute';
        default:
            return '/';
    }
};

const RegisterPage = () => {
    const { register, loading, user } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        userType: 'CLIENT',
        profession: '',
    });
    const [error, setError] = useState('');
    const [errorDetails, setErrorDetails] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [consent, setConsent] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    React.useEffect(() => {
        if (user && (user.role || user.userType)) {
            navigate(roleRedirect(user.role || user.userType), { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        if (form.userType === 'THERAPIST' && !form.profession) {
            setForm(f => ({ ...f, profession: 'פסיכולוגית' }));
        }
        if (form.userType === 'CLIENT' && form.profession) {
            setForm(f => ({ ...f, profession: '' }));
        }
    }, [form.userType]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrorDetails([]);

        if (!consent) {
            setError('יש לאשר את מדיניות הפרטיות ותנאי השימוש');
            return;
        }

        setSubmitting(true);
        if (form.userType === 'THERAPIST' && !form.profession) {
            setError('יש לבחור מקצוע');
            setSubmitting(false);
            return;
        }
        try {
            const res = await register(form);
            if (res.success) {
                if ((form.userType || '').toUpperCase() === 'THERAPIST') {
                    alert('פרטיך התקבלו, ניצור איתך קשר בהקדם');
                    navigate('/', { replace: true });
                } else {
                    navigate('/onboarding', { replace: true });
                }
            } else {
                setError(res.error || 'שגיאה בהרשמה');
                setErrorDetails(res.details || []);
            }
        } catch (err) {
            setError('שגיאה בהרשמה');
        } finally {
            setSubmitting(false);
        }
    };

    const textFieldProps = {
        sx: {
            '@media (max-width: 480px)': {
                '& .MuiInputBase-input': {
                    fontSize: '16px' // Prevents zoom on iOS
                }
            }
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
                    maxWidth: isMobile ? '100%' : 500,
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
                    הרשמה
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="שם פרטי"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                        {...textFieldProps}
                    />
                    <TextField
                        label="שם משפחה"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                        {...textFieldProps}
                    />
                    <TextField
                        label="אימייל"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                        {...textFieldProps}
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
                        {...textFieldProps}
                    />
                    <TextField
                        label="טלפון"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                        {...textFieldProps}
                    />
                    <TextField
                        select
                        label="סוג משתמש"
                        name="userType"
                        value={form.userType}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                        {...textFieldProps}
                    >
                        <MenuItem value="THERAPIST">מטפלת</MenuItem>
                        <MenuItem value="CLIENT">לקוח</MenuItem>
                    </TextField>
                    {form.userType === 'THERAPIST' && (
                        <TextField
                            select
                            label="מקצוע"
                            name="profession"
                            value={form.profession}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            required
                            {...textFieldProps}
                        >
                            <MenuItem value="פסיכולוגית">פסיכולוגית</MenuItem>
                            <MenuItem value="פסיכולוגית קלינית">פסיכולוגית קלינית</MenuItem>
                            <MenuItem value="פסיכולוגית חינוכית">פסיכולוגית חינוכית</MenuItem>
                            <MenuItem value="פסיכולוגית התפתחותית">פסיכולוגית התפתחותית</MenuItem>
                            <MenuItem value="עובדת סוציאלית">עובדת סוציאלית</MenuItem>
                            <MenuItem value="עובדת סוציאלית קלינית">עובדת סוציאלית קלינית</MenuItem>
                            <MenuItem value="מטפלת זוגית">מטפלת זוגית</MenuItem>
                            <MenuItem value="מטפלת משפחתית">מטפלת משפחתית</MenuItem>
                            <MenuItem value="מטפלת באמנות">מטפלת באמנות</MenuItem>
                            <MenuItem value="מטפלת בתנועה">מטפלת בתנועה</MenuItem>
                            <MenuItem value="מטפלת במוזיקה">מטפלת במוזיקה</MenuItem>
                            <MenuItem value="מטפלת בדרמה">מטפלת בדרמה</MenuItem>
                            <MenuItem value="מטפלת הוליסטית">מטפלת הוליסטית</MenuItem>
                            <MenuItem value="רפלקסולוגית">רפלקסולוגית</MenuItem>
                            <MenuItem value="קוסמטיקאית">קוסמטיקאית</MenuItem>
                            <MenuItem value="מטפלת ברפואה משלימה">מטפלת ברפואה משלימה</MenuItem>
                            <MenuItem value="יועצת חינוכית">יועצת חינוכית</MenuItem>
                            <MenuItem value="יועצת זוגית">יועצת זוגית</MenuItem>
                            <MenuItem value="מאמנת אישית">מאמנת אישית</MenuItem>
                            <MenuItem value="מאמנת עסקית">מאמנת עסקית</MenuItem>
                            <MenuItem value="אחר">אחר</MenuItem>
                        </TextField>
                    )}
                    <ConsentCheckbox
                        checked={consent}
                        onChange={setConsent}
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
                            {errorDetails.length > 0 && (
                                <ul style={{ margin: 0, paddingRight: 20 }}>
                                    {errorDetails.map((d, i) => (
                                        <li key={i}>{d.message}</li>
                                    ))}
                                </ul>
                            )}
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
                        disabled={submitting || loading || !consent}
                        startIcon={submitting ? <CircularProgress size={20} /> : null}
                    >
                        הרשמה
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default RegisterPage; 