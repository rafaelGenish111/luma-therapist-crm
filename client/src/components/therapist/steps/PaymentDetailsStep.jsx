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
    Alert,
    Card,
    CardContent,
    RadioGroup,
    FormControlLabel,
    Radio,
    Divider
} from '@mui/material';
import { CreditCard, AccountBalance, PaymentOutlined } from '@mui/icons-material';
import { professionalTokens } from '../../../theme/professionalTokens';

const PaymentDetailsStep = ({ data, onChange, errors }) => {
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

    const paymentMethods = [
        {
            value: 'bank_transfer',
            label: 'העברה בנקאית',
            icon: <AccountBalance />,
            description: 'קבלת תשלומים ישירות לחשבון הבנק'
        },
        {
            value: 'credit_card',
            label: 'כרטיס אשראי',
            icon: <CreditCard />,
            description: 'עמלה של 2.9% + מע"מ'
        },
        {
            value: 'paypal',
            label: 'PayPal',
            icon: <PaymentOutlined />,
            description: 'עמלה של 3.4% + מע"מ'
        }
    ];

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ color: professionalTokens.colors.primary, mb: 3 }}>
                פרטי תשלום
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                    🚧 <strong>מצב דמו:</strong> זהו מצב דמו לבדיקת הממשק. באפליקציה הסופית יהיה כאן חיבור למערכת תשלומים אמיתית.
                </Typography>
            </Alert>
            
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                        בחרי שיטת תשלום מועדפת
                    </Typography>
                    
                    <FormControl error={!!errors.paymentMethod} sx={{ width: '100%' }}>
                        <RadioGroup
                            value={data.paymentMethod || ''}
                            onChange={handleChange('paymentMethod')}
                        >
                            {paymentMethods.map((method) => (
                                <Card 
                                    key={method.value} 
                                    sx={{ 
                                        mb: 2, 
                                        border: data.paymentMethod === method.value ? 2 : 1,
                                        borderColor: data.paymentMethod === method.value ? professionalTokens.colors.primary : 'divider'
                                    }}
                                >
                                    <CardContent sx={{ p: 2 }}>
                                        <FormControlLabel
                                            value={method.value}
                                            control={<Radio />}
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                    <Box sx={{ mr: 2, color: professionalTokens.colors.primary }}>
                                                        {method.icon}
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                            {method.label}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {method.description}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            }
                                            sx={{ margin: 0, width: '100%' }}
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                        </RadioGroup>
                        {errors.paymentMethod && (
                            <FormHelperText sx={{ mx: 2 }}>{errors.paymentMethod}</FormHelperText>
                        )}
                    </FormControl>
                </Grid>
                
                {data.paymentMethod === 'bank_transfer' && (
                    <>
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                פרטי חשבון בנק
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="שם הבנק"
                                value={data.bankDetails?.bankName || ''}
                                onChange={handleChange('bankDetails.bankName')}
                                variant="outlined"
                                placeholder="בנק הפועלים"
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="מספר חשבון"
                                value={data.bankDetails?.accountNumber || ''}
                                onChange={handleChange('bankDetails.accountNumber')}
                                variant="outlined"
                                placeholder="123456"
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="מספר סניף"
                                value={data.bankDetails?.routingNumber || ''}
                                onChange={handleChange('bankDetails.routingNumber')}
                                variant="outlined"
                                placeholder="789"
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="שם בעל החשבון"
                                value={data.bankDetails?.accountHolderName || ''}
                                onChange={handleChange('bankDetails.accountHolderName')}
                                variant="outlined"
                                placeholder="שם מלא כפי שמופיע בבנק"
                            />
                        </Grid>
                    </>
                )}
                
                {(data.paymentMethod === 'credit_card' || data.paymentMethod === 'paypal') && (
                    <Grid item xs={12}>
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                במצב דמו - חיבור ל{data.paymentMethod === 'credit_card' ? 'חברת אשראי' : 'PayPal'} יתווסף בגרסה הסופית
                            </Typography>
                        </Alert>
                    </Grid>
                )}
                
                <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        כתובת לחשבונית
                    </Typography>
                </Grid>
                
                <Grid item xs={12} sm={8}>
                    <TextField
                        fullWidth
                        label="רחוב ומספר בית"
                        value={data.billingAddress?.street || ''}
                        onChange={handleChange('billingAddress.street')}
                        variant="outlined"
                    />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        label="מיקוד"
                        value={data.billingAddress?.zipCode || ''}
                        onChange={handleChange('billingAddress.zipCode')}
                        variant="outlined"
                    />
                </Grid>
                
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="עיר"
                        value={data.billingAddress?.city || ''}
                        onChange={handleChange('billingAddress.city')}
                        variant="outlined"
                    />
                </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f0f8ff', borderRadius: 2 }}>
                <Typography variant="body2" color="textSecondary">
                    💳 <strong>מדיניות תשלומים:</strong> התשלומים מלקוחות יועברו אליך בתוך 2-3 ימי עסקים לאחר הטיפול
                </Typography>
            </Box>
            
            <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                    ✅ כל המידע מוצפן ומאובטח לפי תקני האבטחה הגבוהים ביותר
                </Typography>
            </Alert>
        </Box>
    );
};

export default PaymentDetailsStep;
