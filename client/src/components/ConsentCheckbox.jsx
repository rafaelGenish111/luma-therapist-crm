import React from 'react';
import { Box, FormControlLabel, Checkbox, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { brand } from '../theme/brandTokens';

export default function ConsentCheckbox({ checked, onChange, required = true }) {
    return (
        <Box sx={{ mt: 3, mb: 2 }}>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked)}
                        required={required}
                        sx={{
                            color: brand.primary,
                            '&.Mui-checked': {
                                color: brand.primary,
                            },
                            '& .MuiSvgIcon-root': {
                                fontSize: 20,
                            },
                        }}
                    />
                }
                label={
                    <Typography variant="body2" sx={{
                        color: brand.textSecondary,
                        lineHeight: 1.5,
                        fontSize: '0.875rem'
                    }}>
                        אני מאשר/ת את{' '}
                        <Link
                            component={RouterLink}
                            to="/privacy"
                            sx={{
                                color: brand.primary,
                                textDecoration: 'underline',
                                fontWeight: 500,
                                '&:hover': {
                                    color: brand.primaryDark,
                                }
                            }}
                        >
                            מדיניות הפרטיות
                        </Link>
                        {' '}ו{' '}
                        <Link
                            component={RouterLink}
                            to="/terms"
                            sx={{
                                color: brand.primary,
                                textDecoration: 'underline',
                                fontWeight: 500,
                                '&:hover': {
                                    color: brand.primaryDark,
                                }
                            }}
                        >
                            תנאי השימוש
                        </Link>
                        .
                    </Typography>
                }
                sx={{
                    alignItems: 'flex-start',
                    margin: 0,
                    '& .MuiFormControlLabel-label': {
                        marginTop: '2px'
                    }
                }}
            />
        </Box>
    );
}
