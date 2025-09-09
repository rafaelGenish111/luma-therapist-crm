import React, { useState } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Tabs,
    Tab,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Alert
} from '@mui/material';

import { useThemeSettings } from '../../../context/ThemeContext';

const SettingsPage = () => {
    const [tab, setTab] = useState(0);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showContact, setShowContact] = useState(true);
    const [showHours, setShowHours] = useState(true);
    const [allowNewClients, setAllowNewClients] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);
    const [messageNotifications, setMessageNotifications] = useState(true);
    const [billingEmails, setBillingEmails] = useState(true);
    const [paymentReminders, setPaymentReminders] = useState(true);
    const [featureUpdates, setFeatureUpdates] = useState(true);
    const [betaProgram, setBetaProgram] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { darkMode, toggleDarkMode, fontSize, changeFontSize, lang, changeLang } = useThemeSettings();

    const handleTabChange = (event, newValue) => setTab(newValue);

    const handlePasswordChange = (e) => {
        e.preventDefault();
        setSuccess('');
        setError('');
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('יש למלא את כל השדות');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('הסיסמאות אינן תואמות');
            return;
        }
        // כאן תבצע קריאה ל-API לשינוי סיסמה
        setSuccess('הסיסמה שונתה בהצלחה!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <Box>
            <Box p={4}>
                <Container maxWidth="md">
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h4" mb={3}>הגדרות</Typography>
                        <Tabs value={tab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" sx={{ mb: 3 }}>
                            <Tab label="חשבון" />
                            <Tab label="התראות" />
                            <Tab label="תצוגה" />
                            <Tab label="פרטיות" />
                            <Tab label="תשלום" />
                            <Tab label="מערכת" />
                        </Tabs>

                        {/* טאב חשבון */}
                        {tab === 0 && (
                            <Box>
                                <Typography variant="h6" mb={2}>שינוי סיסמה</Typography>
                                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                                <form onSubmit={handlePasswordChange}>
                                    <TextField
                                        label="סיסמה נוכחית"
                                        type="password"
                                        fullWidth
                                        sx={{ mb: 2 }}
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                    />
                                    <TextField
                                        label="סיסמה חדשה"
                                        type="password"
                                        fullWidth
                                        sx={{ mb: 2 }}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                    />
                                    <TextField
                                        label="אימות סיסמה חדשה"
                                        type="password"
                                        fullWidth
                                        sx={{ mb: 2 }}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                    <Button type="submit" variant="contained" color="primary">שנה סיסמה</Button>
                                </form>
                                <Box mt={4}>
                                    <Typography variant="h6" mb={2}>מחיקת חשבון</Typography>
                                    <Button variant="outlined" color="error">מחק חשבון</Button>
                                </Box>
                            </Box>
                        )}

                        {/* טאב התראות */}
                        {tab === 1 && (
                            <Box>
                                <Typography variant="h6" mb={2}>העדפות התראות</Typography>
                                <FormControlLabel
                                    control={<Switch checked={emailNotifications} onChange={e => setEmailNotifications(e.target.checked)} />}
                                    label="קבלת התראות במייל"
                                />
                                <FormControlLabel
                                    control={<Switch checked={smsNotifications} onChange={e => setSmsNotifications(e.target.checked)} />}
                                    label="קבלת התראות ב-SMS"
                                />
                                <FormControlLabel
                                    control={<Switch checked={messageNotifications} onChange={e => setMessageNotifications(e.target.checked)} />}
                                    label="קבלת התראות על הודעות מלקוחות"
                                />
                            </Box>
                        )}

                        {/* טאב תצוגה */}
                        {tab === 2 && (
                            <Box>
                                <Typography variant="h6" mb={2}>העדפות תצוגה</Typography>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>שפה</InputLabel>
                                    <Select value={lang} onChange={e => changeLang(e.target.value)} label="שפה">
                                        <MenuItem value="he">עברית</MenuItem>
                                        <MenuItem value="en">English</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>גודל גופן</InputLabel>
                                    <Select value={fontSize} onChange={e => changeFontSize(e.target.value)} label="גודל גופן">
                                        <MenuItem value="small">קטן</MenuItem>
                                        <MenuItem value="medium">בינוני</MenuItem>
                                        <MenuItem value="large">גדול</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControlLabel
                                    control={<Switch checked={darkMode} onChange={toggleDarkMode} />}
                                    label="מצב כהה"
                                />
                            </Box>
                        )}

                        {/* טאב פרטיות */}
                        {tab === 3 && (
                            <Box>
                                <Typography variant="h6" mb={2}>הגדרות פרטיות</Typography>
                                <FormControlLabel
                                    control={<Switch checked={showContact} onChange={e => setShowContact(e.target.checked)} />}
                                    label="הצג פרטי קשר באתר האישי"
                                />
                                <FormControlLabel
                                    control={<Switch checked={showHours} onChange={e => setShowHours(e.target.checked)} />}
                                    label="הצג שעות פעילות באתר"
                                />
                                <FormControlLabel
                                    control={<Switch checked={allowNewClients} onChange={e => setAllowNewClients(e.target.checked)} />}
                                    label="אפשר קבלת פניות מלקוחות חדשים"
                                />
                            </Box>
                        )}

                        {/* טאב תשלום */}
                        {tab === 4 && (
                            <Box>
                                <Typography variant="h6" mb={2}>הגדרות תשלום</Typography>
                                <FormControlLabel
                                    control={<Switch checked={billingEmails} onChange={e => setBillingEmails(e.target.checked)} />}
                                    label="קבלת חשבוניות למייל"
                                />
                                <FormControlLabel
                                    control={<Switch checked={paymentReminders} onChange={e => setPaymentReminders(e.target.checked)} />}
                                    label="קבלת תזכורות על תשלומים"
                                />
                            </Box>
                        )}

                        {/* טאב מערכת */}
                        {tab === 5 && (
                            <Box>
                                <Typography variant="h6" mb={2}>הגדרות מערכת</Typography>
                                <FormControlLabel
                                    control={<Switch checked={featureUpdates} onChange={e => setFeatureUpdates(e.target.checked)} />}
                                    label="קבלת עדכונים על פיצ'רים חדשים"
                                />
                                <FormControlLabel
                                    control={<Switch checked={betaProgram} onChange={e => setBetaProgram(e.target.checked)} />}
                                    label="הצטרפות לתוכנית בטא"
                                />
                            </Box>
                        )}
                    </Paper>
                </Container>
            </Box>
        </Box>
    );
};

export default SettingsPage; 