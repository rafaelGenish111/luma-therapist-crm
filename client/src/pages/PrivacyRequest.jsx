import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress
} from '@mui/material';
import { brand } from '../theme/brandTokens';
import PublicNavigation from '../components/common/PublicNavigation';
import Footer from '../components/common/Footer';

export default function PrivacyRequest() {
    const [type, setType] = useState("access");
    const [email, setEmail] = useState("");
    const [details, setDetails] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const requestTypes = [
        { value: "access", label: "בקשת עיון" },
        { value: "rectify", label: "בקשת תיקון" },
        { value: "erase", label: "בקשת מחיקה" }
    ];

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/privacy/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, email, details }),
            });

            if (response.ok) {
                setSent(true);
            } else {
                setError("אירעה שגיאה בשליחת הבקשה. אנא נסו שוב.");
            }
        } catch (err) {
            setError("אירעה שגיאה בחיבור. אנא נסו שוב.");
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
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
                                border: `1px solid ${brand.primary}10`,
                                textAlign: 'center'
                            }}
                        >
                            <Typography
                                variant="h2"
                                component="h1"
                                sx={{
                                    mb: 4,
                                    fontWeight: 700,
                                    color: brand.text,
                                    fontSize: { xs: '2rem', md: '2.5rem' },
                                    textShadow: `2px 2px 4px ${brand.primary}20`
                                }}
                            >
                                בקשה התקבלה
                            </Typography>

                            <Typography
                                variant="body1"
                                sx={{
                                    fontSize: '1.1rem',
                                    lineHeight: 1.8,
                                    color: brand.textSecondary,
                                    mb: 4
                                }}
                            >
                                בקשתך התקבלה בהצלחה. נחזור אליך בהקדם האפשרי לכתובת האימייל שציינת.
                            </Typography>

                            <Button
                                variant="contained"
                                onClick={() => window.history.back()}
                                sx={{
                                    backgroundColor: brand.primary,
                                    color: 'white',
                                    fontWeight: 600,
                                    px: 4,
                                    py: 2,
                                    '&:hover': {
                                        backgroundColor: brand.primaryDark,
                                    }
                                }}
                            >
                                חזרה לדף הקודם
                            </Button>
                        </Paper>
                    </Container>
                </Box>
                <Footer />
            </Box>
        );
    }

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
                            בקשות פרטיות
                        </Typography>

                        <Typography
                            variant="body1"
                            paragraph
                            sx={{
                                fontSize: '1.1rem',
                                lineHeight: 1.8,
                                color: brand.textSecondary,
                                mb: 4,
                                textAlign: 'right'
                            }}
                        >
                            על פי חוק הגנת הפרטיות, יש לך הזכות לבקש עיון, תיקון או מחיקה של המידע האישי שלך.
                            השתמש בטופס זה כדי להגיש בקשה.
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3, textAlign: 'right' }}>
                                {error}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={submit} sx={{ mt: 4 }}>
                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel sx={{ textAlign: 'right' }}>סוג הבקשה</InputLabel>
                                <Select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '&:hover fieldset': {
                                                borderColor: brand.primary,
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: brand.primary,
                                            },
                                        },
                                    }}
                                >
                                    {requestTypes.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="אימייל לאימות ויצירת קשר"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                sx={{
                                    mb: 3,
                                    '& .MuiOutlinedInput-root': {
                                        '&:hover fieldset': {
                                            borderColor: brand.primary,
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: brand.primary,
                                        },
                                    },
                                }}
                            />

                            <TextField
                                fullWidth
                                label="פרטים נוספים (אופציונלי)"
                                multiline
                                rows={4}
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                sx={{
                                    mb: 4,
                                    '& .MuiOutlinedInput-root': {
                                        '&:hover fieldset': {
                                            borderColor: brand.primary,
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: brand.primary,
                                        },
                                    },
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                fullWidth
                                sx={{
                                    backgroundColor: brand.primary,
                                    color: 'white',
                                    fontWeight: 600,
                                    py: 2,
                                    fontSize: '1.1rem',
                                    '&:hover': {
                                        backgroundColor: brand.primaryDark,
                                    },
                                    '&:disabled': {
                                        backgroundColor: brand.textMuted,
                                    }
                                }}
                            >
                                {loading ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircularProgress size={20} color="inherit" />
                                        שולח...
                                    </Box>
                                ) : (
                                    'שליחת בקשה'
                                )}
                            </Button>
                        </Box>

                        <Typography
                            variant="body2"
                            sx={{
                                color: brand.textMuted,
                                textAlign: 'center',
                                mt: 4,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: brand.surfaceAlt,
                                border: `1px solid ${brand.primary}20`
                            }}
                        >
                            נטפל בבקשתך תוך 30 ימים מיום קבלתה, בהתאם לחוק הגנת הפרטיות.
                        </Typography>
                    </Paper>
                </Container>
            </Box>
            <Footer />
        </Box>
    );
}


