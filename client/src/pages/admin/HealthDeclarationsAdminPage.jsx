import React from 'react';
import { Box, Typography, Grid, Card, CardContent, TextField, Button, Chip, Stack, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import api from '../../services/api';

const EmptyTemplate = { key: '', name: '', conditions: [] };

const HealthDeclarationsAdminPage = () => {
    const [templates, setTemplates] = React.useState([]);
    const [creating, setCreating] = React.useState(EmptyTemplate);

    const load = React.useCallback(async () => {
        const res = await api.get('/admin/health-declaration-templates');
        setTemplates(res.data?.data || []);
    }, []);

    React.useEffect(() => { load(); }, [load]);

    const addTemplate = async () => {
        const res = await api.post('/admin/health-declaration-templates', creating);
        setCreating(EmptyTemplate);
        setTemplates([res.data.data, ...templates]);
    };

    const saveTemplate = async (idx) => {
        const t = templates[idx];
        const res = await api.patch(`/admin/health-declaration-templates/${t._id}`, t);
        const copy = [...templates];
        copy[idx] = res.data.data;
        setTemplates(copy);
    };

    const deleteTemplate = async (id) => {
        if (!confirm('למחוק תבנית?')) return;
        await api.delete(`/admin/health-declaration-templates/${id}`);
        setTemplates(templates.filter(t => t._id !== id));
    };

    const addCondition = (idx) => {
        const label = prompt('שם ההפרעה/מחלה:');
        if (!label) return;
        const key = label.trim().toLowerCase().replace(/\s+/g, '_');
        const copy = [...templates];
        copy[idx].conditions = [...(copy[idx].conditions || []), { key, label, requiresDetails: false }];
        setTemplates(copy);
    };

    const toggleRequires = (idx, key) => {
        const copy = [...templates];
        copy[idx].conditions = copy[idx].conditions.map(c => c.key === key ? { ...c, requiresDetails: !c.requiresDetails } : c);
        setTemplates(copy);
    };

    const removeCondition = (idx, key) => {
        const copy = [...templates];
        copy[idx].conditions = copy[idx].conditions.filter(c => c.key !== key);
        setTemplates(copy);
    };

    const loadDefaultTemplates = async () => {
        if (!confirm('לטעון תבניות בסיס? זה יוסיף תבניות לעיסויים ופסיכולוגים.')) return;

        const defaultTemplates = [
            {
                key: 'massage',
                name: 'הצהרת בריאות לעיסויים',
                conditions: [
                    { key: 'heart_problems', label: 'בעיות לב וכלי דם', requiresDetails: true },
                    { key: 'spinal_problems', label: 'בעיות עמוד שדרה', requiresDetails: true },
                    { key: 'sports_injuries', label: 'פציעות ספורט', requiresDetails: true },
                    { key: 'arthritis', label: 'דלקות מפרקים', requiresDetails: false },
                    { key: 'diabetes', label: 'סוכרת', requiresDetails: true },
                    { key: 'high_blood_pressure', label: 'לחץ דם גבוה', requiresDetails: true },
                    { key: 'skin_problems', label: 'בעיות עור', requiresDetails: false },
                    { key: 'osteoporosis', label: 'אוסטאופורוזיס', requiresDetails: true },
                    { key: 'pregnancy', label: 'הריון', requiresDetails: false },
                    { key: 'breastfeeding', label: 'הנקה', requiresDetails: false },
                    { key: 'medications', label: 'תרופות קבועות', requiresDetails: true },
                    { key: 'allergies', label: 'אלרגיות ידועות', requiresDetails: true },
                    { key: 'previous_surgeries', label: 'ניתוחים קודמים', requiresDetails: true },
                    { key: 'physical_limitations', label: 'מגבלות פיזיות', requiresDetails: true }
                ]
            },
            {
                key: 'psychology',
                name: 'הצהרת בריאות לטיפול פסיכולוגי',
                conditions: [
                    { key: 'depression', label: 'דיכאון', requiresDetails: true },
                    { key: 'anxiety', label: 'חרדה', requiresDetails: true },
                    { key: 'eating_disorders', label: 'הפרעות אכילה', requiresDetails: true },
                    { key: 'adhd', label: 'הפרעת קשב וריכוז', requiresDetails: true },
                    { key: 'bipolar', label: 'הפרעה דו קוטבית', requiresDetails: true },
                    { key: 'sleep_disorders', label: 'הפרעות שינה', requiresDetails: false },
                    { key: 'trauma_ptsd', label: 'טראומה או PTSD', requiresDetails: true },
                    { key: 'addictions', label: 'התמכרויות', requiresDetails: true },
                    { key: 'self_harm', label: 'מחשבות על פגיעה עצמית', requiresDetails: true },
                    { key: 'psychiatric_hospitalization', label: 'אשפוז פסיכיאטרי קודם', requiresDetails: true },
                    { key: 'psychiatric_medications', label: 'תרופות פסיכיאטריות', requiresDetails: true },
                    { key: 'previous_therapy', label: 'טיפולים פסיכולוגיים קודמים', requiresDetails: true },
                    { key: 'current_stress', label: 'מצבי לחץ נוכחיים', requiresDetails: true },
                    { key: 'family_support', label: 'תמיכה משפחתית', requiresDetails: false }
                ]
            },
            {
                key: 'general',
                name: 'הצהרת בריאות כללית',
                conditions: [
                    { key: 'chronic_diseases', label: 'מחלות כרוניות', requiresDetails: true },
                    { key: 'medications', label: 'תרופות קבועות', requiresDetails: true },
                    { key: 'allergies', label: 'אלרגיות', requiresDetails: true },
                    { key: 'previous_surgeries', label: 'ניתוחים קודמים', requiresDetails: true },
                    { key: 'physical_problems', label: 'בעיות פיזיות', requiresDetails: true },
                    { key: 'mental_problems', label: 'בעיות נפשיות', requiresDetails: true },
                    { key: 'pregnancy_breastfeeding', label: 'הריון או הנקה', requiresDetails: false },
                    { key: 'physical_limitations', label: 'מגבלות פיזיות', requiresDetails: true },
                    { key: 'medical_emergency', label: 'מצבי חירום רפואי', requiresDetails: true },
                    { key: 'emergency_contact', label: 'איש קשר לחירום', requiresDetails: true },
                    { key: 'health_insurance', label: 'ביטוח בריאות', requiresDetails: false },
                    { key: 'family_doctor', label: 'רופא משפחה', requiresDetails: false }
                ]
            }
        ];

        try {
            for (const template of defaultTemplates) {
                await api.post('/admin/health-declaration-templates', template);
            }
            await load(); // Reload templates
            alert('תבניות בסיס נטענו בהצלחה!');
        } catch (error) {
            alert('שגיאה בטעינת תבניות בסיס');
        }
    };

    return (
        <Box>
            <Typography variant="h5" mb={2}>ניהול תוכניות הצהרות בריאות</Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>צור תוכנית חדשה</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}><TextField label="מפתח (key)" size="small" fullWidth value={creating.key} onChange={e => setCreating({ ...creating, key: e.target.value })} /></Grid>
                        <Grid item xs={12} md={5}><TextField label="שם" size="small" fullWidth value={creating.name} onChange={e => setCreating({ ...creating, name: e.target.value })} /></Grid>
                        <Grid item xs={12} md={2}><Button startIcon={<AddIcon />} variant="contained" fullWidth onClick={addTemplate}>צור</Button></Grid>
                        <Grid item xs={12} md={2}><Button variant="outlined" fullWidth onClick={loadDefaultTemplates}>טען תבניות בסיס</Button></Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Grid container spacing={2}>
                {templates.map((t, idx) => (
                    <Grid item xs={12} md={6} key={t._id}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="h6">{t.name} ({t.key})</Typography>
                                    <IconButton color="error" onClick={() => deleteTemplate(t._id)}><DeleteIcon /></IconButton>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}><TextField fullWidth size="small" label="שם" value={t.name} onChange={e => setTemplates(templates.map((q, i) => i === idx ? { ...q, name: e.target.value } : q))} /></Grid>
                                </Grid>
                                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>הפרעות/מחלות</Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {(t.conditions || []).map(c => (
                                        <Chip key={c.key} label={c.label + (c.requiresDetails ? ' (דורש פירוט)' : '')} onClick={() => toggleRequires(idx, c.key)} onDelete={() => removeCondition(idx, c.key)} />
                                    ))}
                                    <Button size="small" startIcon={<AddIcon />} onClick={() => addCondition(idx)}>הוסף</Button>
                                </Stack>
                                <Box textAlign="left" mt={2}>
                                    <Button variant="contained" onClick={() => saveTemplate(idx)}>שמור</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default HealthDeclarationsAdminPage;


