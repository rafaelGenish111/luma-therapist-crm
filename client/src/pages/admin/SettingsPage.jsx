import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, Grid, Paper, Alert } from '@mui/material';
import api from '../../services/api';

const SettingsPage = () => {
    const [siteContact, setSiteContact] = useState({ phone: '', email: '', address: '', whatsappLink: '', website: '', facebook: '', instagram: '' });
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/admin/site-settings');
                const json = res.data;
                if (json.success) {
                    setSiteContact({
                        phone: json.data?.contact?.phone || '',
                        email: json.data?.contact?.email || '',
                        address: json.data?.contact?.address || '',
                        whatsappLink: json.data?.contact?.whatsappLink || '',
                        website: json.data?.contact?.website || '',
                        facebook: json.data?.contact?.facebook || '',
                        instagram: json.data?.contact?.instagram || '',
                    });
                }
            } catch (e) { }
        };
        load();
    }, []);

    const saveSiteContact = async () => {
        setSaving(true);
        setSaveMsg('');
        try {
            const res = await api.put('/admin/site-settings', { contact: siteContact });
            const json = res.data;
            if (json.success) setSaveMsg('נשמר בהצלחה');
            else setSaveMsg('שמירה נכשלה');
        } catch {
            setSaveMsg('שמירה נכשלה');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box>
            <Typography variant="h5" mb={2}>הגדרות מערכת</Typography>

            <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="h6" gutterBottom>פרטי קשר לאתר הראשי (Footer / צור קשר)</Typography>
                {saveMsg && <Alert severity={saveMsg.includes('נשמר') ? 'success' : 'error'} sx={{ mb: 2 }}>{saveMsg}</Alert>}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField fullWidth label="טלפון" value={siteContact.phone} onChange={(e) => setSiteContact({ ...siteContact, phone: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField fullWidth label="אימייל" value={siteContact.email} onChange={(e) => setSiteContact({ ...siteContact, email: e.target.value })} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth label="כתובת" value={siteContact.address} onChange={(e) => setSiteContact({ ...siteContact, address: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField fullWidth label="קישור וואטסאפ" value={siteContact.whatsappLink} onChange={(e) => setSiteContact({ ...siteContact, whatsappLink: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField fullWidth label="אתר" value={siteContact.website} onChange={(e) => setSiteContact({ ...siteContact, website: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField fullWidth label="פייסבוק" value={siteContact.facebook} onChange={(e) => setSiteContact({ ...siteContact, facebook: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField fullWidth label="אינסטגרם" value={siteContact.instagram} onChange={(e) => setSiteContact({ ...siteContact, instagram: e.target.value })} />
                    </Grid>
                </Grid>
                <Box mt={2}>
                    <Button variant="contained" onClick={saveSiteContact} disabled={saving}>{saving ? 'שומר...' : 'שמור פרטי קשר'}</Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default SettingsPage;




