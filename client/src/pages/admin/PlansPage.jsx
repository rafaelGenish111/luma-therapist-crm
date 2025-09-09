import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, TextField, Chip, Stack, IconButton, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import api from '../../services/api';

const EmptyPlan = { key: '', name: '', price: 0, discountPrice: 0, discountPercent: 0, coupons: [], features: [] };

const PlansPage = () => {
    const [plans, setPlans] = React.useState([]);
    const [creating, setCreating] = React.useState(EmptyPlan);

    const load = React.useCallback(async () => {
        const res = await api.get('/admin/plans');
        setPlans(res.data?.data || []);
    }, []);

    React.useEffect(() => { load(); }, [load]);

    const seedDefaults = async () => {
        await api.post('/admin/plans', { _seedDefaults: true });
        await load();
    };

    const savePlan = async (idx) => {
        const p = plans[idx];
        const res = await api.patch(`/admin/plans/${p._id}`, p);
        const copy = [...plans];
        copy[idx] = res.data.data;
        setPlans(copy);
    };

    const addCoupon = (idx) => {
        const code = prompt('קוד קופון:');
        if (!code) return;
        const copy = [...plans];
        copy[idx].coupons = [...(copy[idx].coupons || []), { code, percentOff: 10, active: true }];
        setPlans(copy);
    };

    const removeCoupon = (idx, code) => {
        const copy = [...plans];
        copy[idx].coupons = copy[idx].coupons.filter(c => c.code !== code);
        setPlans(copy);
    };

    const addFeature = (idx) => {
        const feat = prompt('תכונה חדשה:');
        if (!feat) return;
        const copy = [...plans];
        copy[idx].features = [...(copy[idx].features || []), feat];
        setPlans(copy);
    };

    const removeFeature = (idx, feat) => {
        const copy = [...plans];
        copy[idx].features = copy[idx].features.filter(f => f !== feat);
        setPlans(copy);
    };

    const createPlan = async () => {
        const res = await api.post('/admin/plans', creating);
        setCreating(EmptyPlan);
        setPlans([res.data.data, ...plans]);
    };

    const deletePlan = async (id) => {
        if (!confirm('למחוק את התוכנית?')) return;
        await api.delete(`/admin/plans/${id}`);
        setPlans(plans.filter(p => p._id !== id));
    };

    return (
        <Box>
            <Typography variant="h5" mb={2}>ניהול תוכניות</Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>צור תוכנית חדשה</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}><TextField label="מפתח (key)" size="small" fullWidth value={creating.key} onChange={e => setCreating({ ...creating, key: e.target.value })} /></Grid>
                        <Grid item xs={12} md={3}><TextField label="שם" size="small" fullWidth value={creating.name} onChange={e => setCreating({ ...creating, name: e.target.value })} /></Grid>
                        <Grid item xs={12} md={2}><TextField label="מחיר" type="number" size="small" fullWidth value={creating.price} onChange={e => setCreating({ ...creating, price: Number(e.target.value) })} /></Grid>
                        <Grid item xs={12} md={2}><TextField label="מחיר לאחר הנחה" type="number" size="small" fullWidth value={creating.discountPrice} onChange={e => setCreating({ ...creating, discountPrice: Number(e.target.value) })} /></Grid>
                        <Grid item xs={12} md={2}><TextField label="הנחה (%)" type="number" size="small" fullWidth value={creating.discountPercent} onChange={e => setCreating({ ...creating, discountPercent: Number(e.target.value) })} /></Grid>
                        <Grid item xs={12} md={2}><Button startIcon={<AddIcon />} variant="contained" fullWidth onClick={createPlan}>צור</Button></Grid>
                        <Grid item xs={12} md={2}><Button variant="outlined" fullWidth onClick={seedDefaults}>טען תוכניות בסיס</Button></Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Grid container spacing={2}>
                {plans.map((p, idx) => (
                    <Grid item xs={12} md={6} key={p._id}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="h6">{p.name} ({p.key})</Typography>
                                    <IconButton color="error" onClick={() => deletePlan(p._id)}><DeleteIcon /></IconButton>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={3}><TextField label="שם" size="small" fullWidth value={p.name} onChange={e => setPlans(plans.map((q, i) => i === idx ? { ...q, name: e.target.value } : q))} /></Grid>
                                    <Grid item xs={12} md={3}><TextField label="מחיר" type="number" size="small" fullWidth value={p.price} onChange={e => setPlans(plans.map((q, i) => i === idx ? { ...q, price: Number(e.target.value) } : q))} /></Grid>
                                    <Grid item xs={12} md={3}><TextField label="מחיר לאחר הנחה" type="number" size="small" fullWidth value={p.discountPrice || 0} onChange={e => setPlans(plans.map((q, i) => i === idx ? { ...q, discountPrice: Number(e.target.value) } : q))} /></Grid>
                                    <Grid item xs={12} md={3}><TextField label="הנחה (%)" type="number" size="small" fullWidth value={p.discountPercent} onChange={e => setPlans(plans.map((q, i) => i === idx ? { ...q, discountPercent: Number(e.target.value) } : q))} /></Grid>
                                </Grid>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" gutterBottom>קופונים</Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {(p.coupons || []).map(c => (
                                        <Chip key={c.code} label={`${c.code}${c.percentOff ? ` • ${c.percentOff}%` : ''}`} onDelete={() => removeCoupon(idx, c.code)} />
                                    ))}
                                    <Button size="small" startIcon={<AddIcon />} onClick={() => addCoupon(idx)}>הוסף קופון</Button>
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" gutterBottom>מה כוללת התוכנית</Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {(p.features || []).map(f => (
                                        <Chip key={f} label={f} onDelete={() => removeFeature(idx, f)} />
                                    ))}
                                    <Button size="small" startIcon={<AddIcon />} onClick={() => addFeature(idx)}>הוסף תכונה</Button>
                                </Stack>
                                <Box textAlign="left" mt={2}>
                                    <Button variant="contained" onClick={() => savePlan(idx)}>שמור</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default PlansPage;


