import React from 'react';
import {
    Box,
    TextField,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Chip,
    OutlinedInput,
    Checkbox,
    ListItemText,
    Button,
    IconButton
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { professionalTokens } from '../../../theme/professionalTokens';

const therapistTypes = [
    'פסיכולוג קליני',
    'עובד סוציאל',
    'יועץ חינוכי',
    'מטפל זוגי ומשפחתי',
    'מטפל בדרמה',
    'מטפל באמנות',
    'מטפל במוזיקה',
    'מטפל בשחייה',
    'פיזיותרפיסט',
    'ריפוי בעיסוק',
    'קלינאי תקשורת',
    'מטפל הוליסטי',
    'מאמן אישי',
    'אחר'
];

const specializations = [
    'טיפול בחרדות',
    'טיפול בדיכאון',
    'טיפול בטראומה',
    'טיפול בילדים',
    'טיפול במתבגרים',
    'טיפול זוגי',
    'טיפול משפחתי',
    'הפרעות קשב וריכוז',
    'הפרעות אכילה',
    'התמכרויות',
    'אבל ואובדן',
    'התפתחות אישית',
    'ניהול כעסים',
    'בעיות שינה',
    'מיניות וזוגיות'
];

const languages = [
    'עברית',
    'אנגלית',
    'ערבית',
    'רוסית',
    'צרפתית',
    'ספרדית',
    'גרמנית',
    'איטלקית',
    'אמהרית',
    'תגרינית'
];

const ProfessionalDetailsStep = ({ data, onChange, errors }) => {
    const handleChange = (field) => (event) => {
        onChange({ [field]: event.target.value });
    };

    const handleMultiSelectChange = (field) => (event) => {
        const value = event.target.value;
        onChange({ [field]: typeof value === 'string' ? value.split(',') : value });
    };

    const addEducation = () => {
        const newEducation = {
            institution: '',
            degree: '',
            field: '',
            year: ''
        };
        onChange({ 
            education: [...(data.education || []), newEducation] 
        });
    };

    const updateEducation = (index, field, value) => {
        const updatedEducation = [...(data.education || [])];
        updatedEducation[index] = { ...updatedEducation[index], [field]: value };
        onChange({ education: updatedEducation });
    };

    const removeEducation = (index) => {
        const updatedEducation = (data.education || []).filter((_, i) => i !== index);
        onChange({ education: updatedEducation });
    };

    const addCertification = () => {
        const newCertification = {
            name: '',
            organization: '',
            year: ''
        };
        onChange({ 
            certifications: [...(data.certifications || []), newCertification] 
        });
    };

    const updateCertification = (index, field, value) => {
        const updatedCertifications = [...(data.certifications || [])];
        updatedCertifications[index] = { ...updatedCertifications[index], [field]: value };
        onChange({ certifications: updatedCertifications });
    };

    const removeCertification = (index) => {
        const updatedCertifications = (data.certifications || []).filter((_, i) => i !== index);
        onChange({ certifications: updatedCertifications });
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ color: professionalTokens.colors.primary, mb: 3 }}>
                פרטים מקצועיים
            </Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!errors.therapistType}>
                        <InputLabel>סוג מטפל *</InputLabel>
                        <Select
                            value={data.therapistType || ''}
                            onChange={handleChange('therapistType')}
                            label="סוג מטפל *"
                        >
                            {therapistTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.therapistType && <FormHelperText>{errors.therapistType}</FormHelperText>}
                    </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="שנות ניסיון"
                        type="number"
                        value={data.experience || ''}
                        onChange={handleChange('experience')}
                        variant="outlined"
                        inputProps={{ min: 0, max: 50 }}
                    />
                </Grid>
                
                <Grid item xs={12}>
                    <FormControl fullWidth error={!!errors.specializations}>
                        <InputLabel>התמחויות *</InputLabel>
                        <Select
                            multiple
                            value={data.specializations || []}
                            onChange={handleMultiSelectChange('specializations')}
                            input={<OutlinedInput label="התמחויות *" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={value} size="small" />
                                    ))}
                                </Box>
                            )}
                        >
                            {specializations.map((spec) => (
                                <MenuItem key={spec} value={spec}>
                                    <Checkbox checked={(data.specializations || []).indexOf(spec) > -1} />
                                    <ListItemText primary={spec} />
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.specializations && <FormHelperText>{errors.specializations}</FormHelperText>}
                    </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <InputLabel>שפות</InputLabel>
                        <Select
                            multiple
                            value={data.languages || []}
                            onChange={handleMultiSelectChange('languages')}
                            input={<OutlinedInput label="שפות" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={value} size="small" />
                                    ))}
                                </Box>
                            )}
                        >
                            {languages.map((lang) => (
                                <MenuItem key={lang} value={lang}>
                                    <Checkbox checked={(data.languages || []).indexOf(lang) > -1} />
                                    <ListItemText primary={lang} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="קצת עליי"
                        multiline
                        rows={4}
                        value={data.aboutMe || ''}
                        onChange={handleChange('aboutMe')}
                        variant="outlined"
                        placeholder="ספרי על עצמך, הגישה הטיפולית שלך ומה חשוב לך בעבודה עם לקוחות..."
                    />
                </Grid>
                
                {/* Education Section */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            השכלה
                        </Typography>
                        <Button
                            startIcon={<Add />}
                            onClick={addEducation}
                            variant="outlined"
                            size="small"
                        >
                            הוסף השכלה
                        </Button>
                    </Box>
                    
                    {(data.education || []).map((edu, index) => (
                        <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="מוסד לימודים"
                                        value={edu.institution || ''}
                                        onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <TextField
                                        fullWidth
                                        label="תואר"
                                        value={edu.degree || ''}
                                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={2}>
                                    <TextField
                                        fullWidth
                                        label="שנה"
                                        type="number"
                                        value={edu.year || ''}
                                        onChange={(e) => updateEducation(index, 'year', e.target.value)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={1}>
                                    <IconButton 
                                        onClick={() => removeEducation(index)}
                                        color="error"
                                        size="small"
                                    >
                                        <Delete />
                                    </IconButton>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="תחום לימודים"
                                        value={edu.field || ''}
                                        onChange={(e) => updateEducation(index, 'field', e.target.value)}
                                        size="small"
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    ))}
                </Grid>
                
                {/* Certifications Section */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            הסמכות ותעודות
                        </Typography>
                        <Button
                            startIcon={<Add />}
                            onClick={addCertification}
                            variant="outlined"
                            size="small"
                        >
                            הוסף הסמכה
                        </Button>
                    </Box>
                    
                    {(data.certifications || []).map((cert, index) => (
                        <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={5}>
                                    <TextField
                                        fullWidth
                                        label="שם ההסמכה"
                                        value={cert.name || ''}
                                        onChange={(e) => updateCertification(index, 'name', e.target.value)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="גוף מסמיך"
                                        value={cert.organization || ''}
                                        onChange={(e) => updateCertification(index, 'organization', e.target.value)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={2}>
                                    <TextField
                                        fullWidth
                                        label="שנה"
                                        type="number"
                                        value={cert.year || ''}
                                        onChange={(e) => updateCertification(index, 'year', e.target.value)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={1}>
                                    <IconButton 
                                        onClick={() => removeCertification(index)}
                                        color="error"
                                        size="small"
                                    >
                                        <Delete />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </Box>
                    ))}
                </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#e8f5e8', borderRadius: 2 }}>
                <Typography variant="body2" color="textSecondary">
                    🎓 <strong>טיפ:</strong> פרטים מקצועיים מפורטים יעזרו לנו להתאים לך לקוחות מתאימים
                </Typography>
            </Box>
        </Box>
    );
};

export default ProfessionalDetailsStep;
