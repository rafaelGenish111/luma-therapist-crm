import React, { useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Container, Box, Link as MuiLink, Button } from '@mui/material';

// תצוגת אתר אישית לשימוש כ-preview בתוך הדשבורד. מקבלת themeData ו-profile מבחוץ.
const WebsitePreview = ({ themeData, profile }) => {
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

    const displayName = profile?.businessName || (profile ? `${profile.firstName} ${profile.lastName}` : 'הקליניקה שלי');

    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <Box minHeight="100%" sx={{ background: themeData?.backgroundUrl ? `url(${themeData.backgroundUrl}) center/cover` : undefined }}>
                {/* Header */}
                <AppBar position="static" color="primary" elevation={2} sx={{ mb: 2 }}>
                    <Toolbar sx={{ justifyContent: 'space-between' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            {themeData?.logoUrl && <img src={themeData.logoUrl} alt="לוגו" style={{ maxHeight: 40, borderRadius: 6 }} />}
                            <Typography variant="h6" fontWeight={700}>{displayName}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography variant="body2">בית</Typography>
                            <Typography variant="body2">אודות</Typography>
                            <Typography variant="body2">מאמרים</Typography>
                            <Typography variant="body2">צור קשר</Typography>
                        </Box>
                    </Toolbar>
                </AppBar>

                {/* תוכן לדוגמה */}
                <Container maxWidth="md" sx={{ py: 4, fontFamily: themeData?.fontFamily }}>
                    <Box textAlign="center" sx={{ color: muiTheme.palette.secondary.main }}>
                        <Typography variant="h4" sx={{ mb: 1 }}>ברוכה הבאה</Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>כך האתר ייראה עם העיצוב שבחרת. שינויי צבעים/פונט מתעדכנים מיידית.</Typography>
                        <Button variant="contained" color="secondary">קבעי תור</Button>
                    </Box>
                </Container>

                {/* Footer */}
                <Box component="footer" sx={{ bgcolor: 'primary.main', color: '#fff', py: 3, mt: 6, textAlign: 'center' }}>
                    <Typography variant="body2">
                        {displayName} &copy; {new Date().getFullYear()} | כל הזכויות שמורות
                    </Typography>
                    {profile?.businessEmail && (
                        <Typography variant="body2">
                            <MuiLink href={`mailto:${profile.businessEmail}`} color="inherit">{profile.businessEmail}</MuiLink>
                        </Typography>
                    )}
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default WebsitePreview;


