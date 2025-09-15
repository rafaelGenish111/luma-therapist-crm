import React, { useState } from 'react';
import {
    Box,
    TextField,
    Typography,
    Grid,
    InputAdornment,
    IconButton,
    LinearProgress,
    Chip,
    Alert
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle, Cancel } from '@mui/icons-material';
import { professionalTokens } from '../../../theme/professionalTokens';

const PasswordStep = ({ data, onChange, errors }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (field) => (event) => {
        onChange({ [field]: event.target.value });
    };

    const calculatePasswordStrength = (password) => {
        if (!password) return { score: 0, label: '', color: '' };
        
        let score = 0;
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        score = Object.values(checks).filter(Boolean).length;
        
        if (score <= 2) return { score: score * 20, label: 'חלשה', color: 'error' };
        if (score === 3) return { score: score * 20, label: 'בינונית', color: 'warning' };
        if (score === 4) return { score: score * 20, label: 'חזקה', color: 'info' };
        return { score: 100, label: 'מצוינת', color: 'success' };
    };

    const passwordStrength = calculatePasswordStrength(data.password);
    
    const passwordRequirements = [
        { text: 'לפחות 8 תווים', met: data.password?.length >= 8 },
        { text: 'אות גדולה באנגלית', met: /[A-Z]/.test(data.password || '') },
        { text: 'אות קטנה באנגלית', met: /[a-z]/.test(data.password || '') },
        { text: 'מספר', met: /\d/.test(data.password || '') },
        { text: 'תו מיוחד (!@#$%^&*)', met: /[!@#$%^&*(),.?":{}|<>]/.test(data.password || '') }
    ];

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ color: professionalTokens.colors.primary, mb: 3 }}>
                הגדרת סיסמה
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
                הסיסמה תשמש אותך להתחברות למערכת ניהול הלקוחות שלך
            </Alert>
            
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="סיסמה *"
                        type={showPassword ? 'text' : 'password'}
                        value={data.password || ''}
                        onChange={handleChange('password')}
                        error={!!errors.password}
                        helperText={errors.password}
                        variant="outlined"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    
                    {data.password && (
                        <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" sx={{ mr: 1 }}>
                                    חוזק הסיסמה:
                                </Typography>
                                <Chip 
                                    label={passwordStrength.label}
                                    color={passwordStrength.color}
                                    size="small"
                                />
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={passwordStrength.score}
                                color={passwordStrength.color}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                        </Box>
                    )}
                </Grid>
                
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="אימות סיסמה *"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={data.confirmPassword || ''}
                        onChange={handleChange('confirmPassword')}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                        variant="outlined"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        edge="end"
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                </Grid>
                
                {data.password && (
                    <Grid item xs={12}>
                        <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                דרישות הסיסמה:
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {passwordRequirements.map((req, index) => (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {req.met ? (
                                            <CheckCircle color="success" fontSize="small" />
                                        ) : (
                                            <Cancel color="error" fontSize="small" />
                                        )}
                                        <Typography
                                            variant="body2"
                                            color={req.met ? 'success.main' : 'error.main'}
                                        >
                                            {req.text}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Grid>
                )}
            </Grid>
            
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#fff3cd', borderRadius: 2 }}>
                <Typography variant="body2" color="textSecondary">
                    🔒 <strong>אבטחה:</strong> הסיסמה שלך מוצפנת ומאובטחת במערכת שלנו
                </Typography>
            </Box>
        </Box>
    );
};

export default PasswordStep;
