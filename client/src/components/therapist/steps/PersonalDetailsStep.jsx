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
    FormHelperText
} from '@mui/material';
import { professionalTokens } from '../../../theme/professionalTokens';

const PersonalDetailsStep = ({ data, onChange, errors }) => {
    const handleChange = (field) => (event) => {
        const value = event.target.value;
        
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            onChange({
                [parent]: {
                    ...data[parent],
                    [child]: value
                }
            });
        } else {
            onChange({ [field]: value });
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ color: professionalTokens.colors.primary, mb: 3 }}>
                פרטים אישיים
            </Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="שם פרטי *"
                        value={data.firstName || ''}
                        onChange={handleChange('firstName')}
                        error={!!errors.firstName}
                        helperText={errors.firstName}
                        variant="outlined"
                    />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="שם משפחה *"
                        value={data.lastName || ''}
                        onChange={handleChange('lastName')}
                        error={!!errors.lastName}
                        helperText={errors.lastName}
                        variant="outlined"
                    />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="תעודת זהות *"
                        value={data.idNumber || ''}
                        onChange={handleChange('idNumber')}
                        error={!!errors.idNumber}
                        helperText={errors.idNumber}
                        variant="outlined"
                        inputProps={{ maxLength: 9 }}
                    />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!errors.gender}>
                        <InputLabel>מגדר</InputLabel>
                        <Select
                            value={data.gender || ''}
                            onChange={handleChange('gender')}
                            label="מגדר"
                        >
                            <MenuItem value="female">נקבה</MenuItem>
                            <MenuItem value="male">זכר</MenuItem>
                            <MenuItem value="other">אחר</MenuItem>
                            <MenuItem value="prefer_not_to_say">מעדיף/ה שלא לומר</MenuItem>
                        </Select>
                        {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
                    </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="תאריך לידה"
                        type="date"
                        value={data.dateOfBirth || ''}
                        onChange={handleChange('dateOfBirth')}
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                    />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="מספר טלפון *"
                        value={data.phone || ''}
                        onChange={handleChange('phone')}
                        error={!!errors.phone}
                        helperText={errors.phone}
                        variant="outlined"
                        placeholder="050-1234567"
                    />
                </Grid>
                
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="כתובת מייל *"
                        type="email"
                        value={data.email || ''}
                        onChange={handleChange('email')}
                        error={!!errors.email}
                        helperText={errors.email}
                        variant="outlined"
                    />
                </Grid>
                
                <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                        כתובת מגורים
                    </Typography>
                </Grid>
                
                <Grid item xs={12} sm={8}>
                    <TextField
                        fullWidth
                        label="רחוב ומספר בית"
                        value={data.address?.street || ''}
                        onChange={handleChange('address.street')}
                        variant="outlined"
                    />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        label="מיקוד"
                        value={data.address?.zipCode || ''}
                        onChange={handleChange('address.zipCode')}
                        variant="outlined"
                    />
                </Grid>
                
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="עיר"
                        value={data.address?.city || ''}
                        onChange={handleChange('address.city')}
                        variant="outlined"
                    />
                </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="body2" color="textSecondary">
                    💡 <strong>טיפ:</strong> מידע זה יעזור לנו להתאים לך לקוחות באזור המגורים שלך
                </Typography>
            </Box>
        </Box>
    );
};

export default PersonalDetailsStep;
