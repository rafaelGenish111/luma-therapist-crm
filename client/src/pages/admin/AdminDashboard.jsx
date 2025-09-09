import React from 'react';
import { Box, Container, Typography, Card, CardContent, Grid, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, Chip, Stack, Tabs, Tab, Switch, FormControlLabel } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ResponsiveTableCards from '../../components/ResponsiveTableCards';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [therapistsPending, setTherapistsPending] = React.useState({ items: [], total: 0, page: 1, limit: 20 });
    const [therapistsApproved, setTherapistsApproved] = React.useState({ items: [], total: 0, page: 1, limit: 20 });
    const [q, setQ] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [selected, setSelected] = React.useState(null);
    const [saving, setSaving] = React.useState(false);
    const [tab, setTab] = React.useState(0);
    const [calStatus, setCalStatus] = React.useState(null);

    const loadTherapists = React.useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const [pendingRes, approvedRes] = await Promise.all([
                api.get('/admin/therapists', { params: { q, page, limit: 20, pendingOnly: 1 } }),
                api.get('/admin/therapists', { params: { q, page, limit: 20, approvedOnly: 1 } })
            ]);
            setTherapistsPending(pendingRes.data.data);
            setTherapistsApproved(approvedRes.data.data);
        } catch {
        } finally {
            setLoading(false);
        }
    }, [q]);

    React.useEffect(() => { loadTherapists(1); }, [loadTherapists]);
    return (
        <Box>
            <Container maxWidth="lg">
                <Typography variant="h4" mb={3}>לוח ניהול - אדמין</Typography>
                <Typography variant="subtitle1" color="text.secondary" mb={4}>
                    ברוך הבא {user?.firstName} {user?.lastName}
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>מטפלות ממתינות לאישור</Typography>
                                <div className="rt-sticky">
                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        <TextField size="small" placeholder="חיפוש (שם/אימייל)" value={q} onChange={(e) => setQ(e.target.value)} />
                                        <Button variant="contained" onClick={() => loadTherapists(1)} disabled={loading}>חפש</Button>
                                    </Box>
                                </div>
                                
                                <ResponsiveTableCards
                                    columns={[
                                        { key: "name", label: "שם" },
                                        { key: "email", label: "אימייל" },
                                        { key: "phone", label: "טלפון" },
                                        { key: "plan", label: "תוכנית" }
                                    ]}
                                    rows={therapistsPending.items.map(t => ({
                                        id: t._id,
                                        name: `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim(),
                                        email: t.email,
                                        phone: t.phone,
                                        plan: t.subscription?.plan || 'free'
                                    }))}
                                    actions={(row) => (
                                        <Button 
                                            size="small" 
                                            variant="outlined" 
                                            className="btn btn--primary"
                                            onClick={async () => {
                                                await api.patch(`/admin/therapists/${row.id}`, { isApproved: true });
                                                loadTherapists(1);
                                            }}
                                        >
                                            אשר
                                        </Button>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12}>
                        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>מטפלות מאושרות</Typography>
                                <div className="rt-sticky">
                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        <TextField size="small" placeholder="חיפוש (שם/אימייל)" value={q} onChange={(e) => setQ(e.target.value)} />
                                        <Button variant="contained" onClick={() => loadTherapists(1)} disabled={loading}>חפש</Button>
                                    </Box>
                                </div>
                                
                                <ResponsiveTableCards
                                    columns={[
                                        { key: "name", label: "שם" },
                                        { key: "email", label: "אימייל" },
                                        { key: "phone", label: "טלפון" },
                                        { key: "plan", label: "תוכנית" },
                                        { key: "calendly", label: "Calendly" }
                                    ]}
                                    rows={therapistsApproved.items.map(t => ({
                                        id: t._id,
                                        name: `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim(),
                                        email: t.email,
                                        phone: t.phone,
                                        plan: t.subscription?.plan || 'free',
                                        calendly: t.featureOverrides?.calendly ? 'מופעל' : 'מכובה'
                                    }))}
                                    actions={(row) => (
                                        <Button 
                                            size="small" 
                                            variant="outlined" 
                                            className="btn"
                                            onClick={() => {
                                                const therapist = therapistsApproved.items.find(t => t._id === row.id);
                                                if (therapist) setSelected(therapist);
                                            }}
                                        >
                                            עריכה
                                        </Button>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Therapist details dialog */}
                <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="lg" fullWidth>
                    <DialogTitle>ניהול מטפלת</DialogTitle>
                    <DialogContent>
                        {selected && (
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    {selected.firstName} {selected.lastName} · {selected.email}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                    <Chip label={`תוכנית: ${selected.subscription?.plan || 'free'}`} />
                                    <Chip label={`Calendly: ${selected.featureOverrides?.calendly ? 'מופעל' : 'מכובה'}`} />
                                </Stack>

                                <Tabs value={tab} onChange={(e, v) => {
                                    setTab(v);
                                    if (v === 3) {
                                        // Calendly tab – טען סטטוס
                                        (async () => {
                                            try {
                                                const res = await api.get(`/admin/superadmin/therapists/${selected._id}/calendly/status`);
                                                setCalStatus(res.data?.data);
                                            } catch { }
                                        })();
                                    }
                                }} sx={{ mb: 2 }} variant="scrollable">
                                    <Tab label="פרטים אישיים" />
                                    <Tab label="תוכנית" />
                                    <Tab label="תשלומים" />
                                    <Tab label="Calendly" />
                                    <Tab label="אחר" />
                                </Tabs>

                                {tab === 0 && (
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}><TextField fullWidth size="small" label="שם פרטי" value={selected.firstName || ''} onChange={e => setSelected({ ...selected, firstName: e.target.value })} /></Grid>
                                        <Grid item xs={12} md={4}><TextField fullWidth size="small" label="שם משפחה" value={selected.lastName || ''} onChange={e => setSelected({ ...selected, lastName: e.target.value })} /></Grid>
                                        <Grid item xs={12} md={4}><TextField fullWidth size="small" label="טלפון" value={selected.phone || ''} onChange={e => setSelected({ ...selected, phone: e.target.value })} /></Grid>
                                    </Grid>
                                )}

                                {tab === 1 && (
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel id="plan-label">תוכנית</InputLabel>
                                                <Select labelId="plan-label" label="תוכנית" value={selected.subscription?.plan || 'free'} onChange={(e) => setSelected({ ...selected, subscription: { ...(selected.subscription || {}), plan: e.target.value } })}>
                                                    <MenuItem value="free">free</MenuItem>
                                                    <MenuItem value="premium">premium</MenuItem>
                                                    <MenuItem value="extended">extended</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormControlLabel control={<Switch checked={!!selected.subscription?.isActive} onChange={(e) => setSelected({ ...selected, subscription: { ...(selected.subscription || {}), isActive: e.target.checked } })} />} label="מנוי פעיל" />
                                        </Grid>
                                    </Grid>
                                )}

                                {tab === 2 && (
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <TextField fullWidth size="small" label="Billing Email" value={selected.billingEmail || ''} onChange={e => setSelected({ ...selected, billingEmail: e.target.value })} />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormControlLabel control={<Switch checked={!!selected.subscription?.isActive} onChange={(e) => setSelected({ ...selected, subscription: { ...(selected.subscription || {}), isActive: e.target.checked } })} />} label="סימון כתשלום התקבל" />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button variant="outlined" onClick={() => alert('קישור תשלום נשלח (דמו).')}>שלח קישור תשלום</Button>
                                        </Grid>
                                    </Grid>
                                )}

                                {tab === 3 && (
                                    <Box>
                                        <Typography variant="body2" sx={{ mb: 1 }}>סטטוס נוכחי: {calStatus?.hasFeatureAccess ? 'גישה פעילה' : 'ללא גישה'}</Typography>
                                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                            <Button variant="contained" onClick={async () => { await api.post(`/admin/superadmin/therapists/${selected._id}/calendly/enable`, { forceReset: false }); const res = await api.get(`/admin/superadmin/therapists/${selected._id}/calendly/status`); setCalStatus(res.data?.data); }}>הפעל Calendly</Button>
                                            <Button variant="outlined" onClick={async () => { await api.post(`/admin/superadmin/therapists/${selected._id}/calendly/disable`, { keepConfig: true }); const res = await api.get(`/admin/superadmin/therapists/${selected._id}/calendly/status`); setCalStatus(res.data?.data); }}>כבה Calendly</Button>
                                            <Button variant="outlined" onClick={async () => { const res = await api.post(`/admin/superadmin/therapists/${selected._id}/calendly/connect-url`, { returnUrl: '/dashboard/calendly' }); alert(`קישור חיבור: ${res.data?.data?.connectUrl}`); }}>צור קישור התחברות</Button>
                                        </Stack>
                                    </Box>
                                )}

                                {tab === 4 && (
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField fullWidth size="small" label="הערות מנהל" value={selected.adminNotes || ''} onChange={e => setSelected({ ...selected, adminNotes: e.target.value })} multiline minRows={3} />
                                        </Grid>
                                    </Grid>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={async () => {
                            if (!selected) return;
                            setSaving(true);
                            try {
                                await api.patch(`/admin/therapists/${selected._id}`, {
                                    plan: selected.subscription?.plan,
                                    calendlyOverride: !!selected.featureOverrides?.calendly,
                                    isApproved: selected.isApproved,
                                    subscription: selected.subscription,
                                    firstName: selected.firstName,
                                    lastName: selected.lastName,
                                    phone: selected.phone,
                                    billingEmail: selected.billingEmail,
                                    adminNotes: selected.adminNotes,
                                });
                                await loadTherapists(therapists.page || 1);
                                setSelected(null);
                            } finally { setSaving(false); }
                        }} disabled={saving} variant="contained">שמור</Button>
                        <Button onClick={async () => {
                            if (!selected) return;
                            const res = await api.post(`/admin/superadmin/therapists/${selected._id}/calendly/connect-url`, { returnUrl: '/dashboard/calendly' });
                            alert(`קישור נוצר: ${res.data?.data?.connectUrl || ''}`);
                        }} variant="outlined">צור קישור התחברות Calendly</Button>
                        <Button onClick={() => setSelected(null)}>סגור</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default AdminDashboard;


