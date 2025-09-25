import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Input, MenuItem, Paper, Alert, CircularProgress, Stack } from '@mui/material';

import { getOwnTheme, updateOwnTheme } from '../../../services/therapistService';
import WebsitePreview from '../../website/WebsitePreview';
import api, { therapistsApi } from '../../../services/api';

const fontOptions = [
    'Heebo', 'Assistant', 'Rubik', 'Open Sans', 'Alef', 'Arimo', 'David Libre', 'Varela Round', 'Secular One', 'Arial', 'Tahoma'
];

export default function DesignPage() {
    const [theme, setTheme] = useState({
        primaryColor: '#4A90E2',
        secondaryColor: '#F5A623',
        fontFamily: 'Heebo',
        logo: null,
        background: null,
        logoUrl: '',
        backgroundUrl: ''
    });
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchTheme = async () => {
            try {
                setLoading(true);
                const data = await getOwnTheme();
                setTheme(prev => ({ ...prev, ...data }));
                const prof = await getTherapistProfile();
                setProfile(prof || null);
            } catch (e) {
                setError('שגיאה בטעינת העיצוב');
            } finally {
                setLoading(false);
            }
        };
        fetchTheme();
    }, []);

    const handleChange = e => {
        setTheme({ ...theme, [e.target.name]: e.target.value });
    };

    const handleFile = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setTheme(prev => ({ ...prev, [type]: file, [`${type}Url`]: url }));
        }
    };

    const handleSave = async () => {
        try {
            setSuccess('');
            setError('');
            setLoading(true);
            // שמירה לשרת (ללא קבצים כרגע)
            const { logo, background, ...themeToSave } = theme;
            await updateOwnTheme(themeToSave);
            setSuccess('העיצוב נשמר בהצלחה!');
        } catch (e) {
            setError('שגיאה בשמירת העיצוב');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Box textAlign="center" mt={6}><CircularProgress /></Box>;

    return (
        <Box>
            <Box p={4}>
                <Typography variant="h5" mb={2}>עיצוב האתר האישי</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
                    {/* צד שמאל: טופס עריכה */}
                    <Paper sx={{ p: 3, flex: 1, minWidth: 320 }}>
                        <Box display="flex" flexDirection="column" gap={2}>
                            <TextField
                                label="צבע ראשי"
                                name="primaryColor"
                                type="color"
                                value={theme.primaryColor}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 120 }}
                            />
                            <TextField
                                label="צבע משני"
                                name="secondaryColor"
                                type="color"
                                value={theme.secondaryColor}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 120 }}
                            />
                            <TextField
                                select
                                label="פונט ראשי"
                                name="fontFamily"
                                value={theme.fontFamily}
                                onChange={handleChange}
                                sx={{ width: 200 }}
                            >
                                {fontOptions.map(font => (
                                    <MenuItem key={font} value={font} style={{ fontFamily: font }}>{font}</MenuItem>
                                ))}
                            </TextField>
                            <Box>
                                <Typography>לוגו אישי</Typography>
                                <Input type="file" accept="image/*" onChange={e => handleFile(e, 'logo')} />
                                {theme.logoUrl && <img src={theme.logoUrl} alt="לוגו" style={{ maxWidth: 120, marginTop: 8 }} />}
                            </Box>
                            <Box>
                                <Typography>תמונת רקע</Typography>
                                <Input type="file" accept="image/*" onChange={e => handleFile(e, 'background')} />
                                {theme.backgroundUrl && <img src={theme.backgroundUrl} alt="רקע" style={{ maxWidth: 200, marginTop: 8 }} />}
                            </Box>
                            <Button variant="contained" color="primary" onClick={handleSave}>שמור עיצוב</Button>
                        </Box>
                    </Paper>
                    {/* צד ימין: תצוגה חיה */}
                    <Box sx={{ flex: 1.2, minWidth: 360 }}>
                        <Typography variant="h6" mb={1}>תצוגה מקדימה חיה</Typography>
                        <Paper sx={{ p: 0, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                            <WebsitePreview themeData={theme} profile={profile} />
                        </Paper>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
} 