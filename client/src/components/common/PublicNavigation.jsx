import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, IconButton, useTheme, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useLocation } from 'react-router-dom';
import ForgotPasswordModal from '../auth/ForgotPasswordModal';
import { useAuth } from '../../context/AuthContext';
import Logo from './Logo';

const PublicNavigation = () => {
    const location = useLocation();
    const { login, register } = useAuth();
    const [loginOpen, setLoginOpen] = useState(false);
    const [registerOpen, setRegisterOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loginError, setLoginError] = useState('');
    const [registerError, setRegisterError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [forgotOpen, setForgotOpen] = useState(false);

    const navItems = [
        { path: '/', label: 'בית' },
        { path: '/about', label: 'אודות' },
        { path: '/services', label: 'שירותים' },
        { path: '/gallery', label: 'גלריה' },
        { path: '/testimonials', label: 'המלצות' },
        { path: '/contact', label: 'צור קשר' },
    ];

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginLoading(true);

        try {
            const result = await login(loginData.email, loginData.password);
            if (result.success) {
                setLoginOpen(false);
                setLoginData({ email: '', password: '' });
            } else {
                setLoginError(result.error || 'שגיאה בהתחברות');
            }
        } catch (err) {
            setLoginError('שגיאה בהתחברות');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegisterError('');
        setRegisterLoading(true);

        if (registerData.password !== registerData.confirmPassword) {
            setRegisterError('הסיסמאות אינן תואמות');
            setRegisterLoading(false);
            return;
        }

        try {
            const result = await register(registerData);
            if (result.success) {
                setRegisterOpen(false);
                setRegisterData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                });
            } else {
                setRegisterError(result.error || 'שגיאה בהרשמה');
            }
        } catch (err) {
            setRegisterError('שגיאה בהרשמה');
        } finally {
            setRegisterLoading(false);
        }
    };

    const handleNavClick = () => {
        if (isMobile) {
            setMobileMenuOpen(false);
        }
    };

    return (
        <>
            <header className="site-header" style={{
                width: '100%',
                overflowX: 'hidden',
                position: 'relative'
            }}>
                <div className="container" style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    padding: "12px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    {/* לוגו */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
                            <Logo variant="small" />
                        </Link>
                    </div>

                    {/* ניווט דסקטופ */}
                    <nav className="site-nav" style={{
                        display: isMobile ? 'none' : 'flex',
                        gap: 18
                    }}>
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    fontWeight: location.pathname === item.path ? 700 : 500,
                                    opacity: location.pathname === item.path ? 1 : 0.8
                                }}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* CTA דסקטופ */}
                    <div style={{
                        display: isMobile ? 'none' : 'flex',
                        gap: 10
                    }}>
                        <button
                            className="btn-cta"
                            style={{
                                background: "transparent",
                                border: "1px solid #9ad7e3",
                                color: "#E9F3FA"
                            }}
                            onClick={() => setLoginOpen(true)}
                        >
                            התחברות
                        </button>
                        <button
                            className="btn-cta"
                            onClick={() => setRegisterOpen(true)}
                        >
                            התחל עכשיו
                        </button>
                    </div>

                    {/* כפתור המבורגר למובייל */}
                    <div style={{
                        display: isMobile ? 'flex' : 'none'
                    }}>
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                fontSize: '24px',
                                cursor: 'pointer',
                                padding: '8px'
                            }}
                        >
                            <MenuIcon />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Drawer */}
            {isMobile && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: '100%',
                    height: '100vh',
                    background: 'linear-gradient(90deg, var(--primary-700) 0%, #0E4E7F 50%, #136BA3 100%)',
                    zIndex: 1001,
                    transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px',
                        borderBottom: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <Logo variant="small" />
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                fontSize: '24px',
                                cursor: 'pointer'
                            }}
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    <nav style={{
                        flex: 1,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={handleNavClick}
                                style={{
                                    fontWeight: location.pathname === item.path ? 700 : 500,
                                    color: 'white',
                                    textDecoration: 'none',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    background: location.pathname === item.path ? 'rgba(255,255,255,0.2)' : 'transparent',
                                    fontSize: '18px'
                                }}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div style={{
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <button
                            style={{
                                background: "transparent",
                                border: "1px solid #9ad7e3",
                                color: "#E9F3FA",
                                padding: '16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                width: '100%'
                            }}
                            onClick={() => {
                                setMobileMenuOpen(false);
                                setLoginOpen(true);
                            }}
                        >
                            התחברות
                        </button>
                        <button
                            style={{
                                background: "#9ad7e3",
                                border: "none",
                                color: "#1e3c72",
                                padding: '16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: '600',
                                width: '100%'
                            }}
                            onClick={() => {
                                setMobileMenuOpen(false);
                                setRegisterOpen(true);
                            }}
                        >
                            התחל עכשיו
                        </button>
                    </div>
                </div>
            )}

            {/* Login Dialog */}
            <Dialog
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        p: 1
                    }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 1
                }}>
                    התחברות
                    <IconButton
                        onClick={() => setLoginOpen(false)}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <form onSubmit={handleLoginSubmit}>
                    <DialogContent sx={{ pt: 2 }}>
                        {loginError && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {loginError}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            label="אימייל"
                            type="email"
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            required
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            fullWidth
                            label="סיסמה"
                            type="password"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            required
                            sx={{ mb: 3 }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setLoginOpen(false);
                                    setForgotOpen(true);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#1976d2',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    padding: 0
                                }}
                                aria-label="שכחת סיסמה? לחץ לפתיחת תהליך איפוס"
                            >
                                שכחת סיסמה?
                            </button>
                        </div>
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loginLoading}
                            sx={{
                                py: 1.5,
                                fontSize: '1.1rem'
                            }}
                        >
                            {loginLoading ? 'מתחבר...' : 'התחבר'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />

            {/* Register Dialog */}
            <Dialog
                open={registerOpen}
                onClose={() => setRegisterOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        p: 1
                    }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 1
                }}>
                    הרשמה
                    <IconButton
                        onClick={() => setRegisterOpen(false)}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <form onSubmit={handleRegisterSubmit}>
                    <DialogContent sx={{ pt: 2 }}>
                        {registerError && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {registerError}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            label="שם פרטי"
                            value={registerData.firstName}
                            onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                            required
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            fullWidth
                            label="שם משפחה"
                            value={registerData.lastName}
                            onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                            required
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            fullWidth
                            label="אימייל"
                            type="email"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                            required
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            fullWidth
                            label="סיסמה"
                            type="password"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                            required
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            fullWidth
                            label="אימות סיסמה"
                            type="password"
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                            required
                            sx={{ mb: 3 }}
                        />
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={registerLoading}
                            sx={{
                                py: 1.5,
                                fontSize: '1.1rem'
                            }}
                        >
                            {registerLoading ? 'נרשם...' : 'הרשמה'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
};

export default PublicNavigation;
