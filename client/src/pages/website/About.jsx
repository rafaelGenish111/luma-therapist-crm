import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { Box, Typography, Paper, CircularProgress, Alert, Divider } from '@mui/material';

export default function About() {
    const { therapistId } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError('');
                const res = await api.get(`/therapists/${therapistId}`);
                setProfile(res.data.data);
            } catch (e) {
                setError('לא ניתן לטעון את פרטי המטפלת');
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [therapistId]);

    if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
    if (!profile) return null;

    return (
        <Box maxWidth="md" mx="auto" mt={4}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    אודות המטפלת
                </Typography>
                <Divider sx={{ my: 3 }} />
                {profile.professionalDescription && (
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom>תיאור מקצועי</Typography>
                        <Typography variant="body1" color="text.secondary">{profile.professionalDescription}</Typography>
                    </Box>
                )}
                {profile.personalStory && (
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom>סיפור אישי</Typography>
                        <Typography variant="body1" color="text.secondary">{profile.personalStory}</Typography>
                    </Box>
                )}
                {profile.aboutMe && (
                    <Box mb={2}>
                        <Typography variant="h6" gutterBottom>עליי</Typography>
                        <Typography variant="body1" color="text.secondary">{profile.aboutMe}</Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
} 