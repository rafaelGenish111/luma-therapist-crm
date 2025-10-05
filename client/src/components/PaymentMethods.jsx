import React from 'react';
import {
    Box,
    Button,
    Typography,
    Stack,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import {
    CreditCard as CreditCardIcon,
    Apple as AppleIcon,
    Google as GoogleIcon,
    AccountBalanceWallet as WalletIcon,
    Payment as PaymentIcon
} from '@mui/icons-material';

const PaymentMethods = ({ onPaymentMethodSelect, disabled = false }) => {
    const paymentMethods = [
        {
            id: 'credit',
            name: 'כרטיס אשראי',
            icon: <CreditCardIcon />,
            color: '#1976d2',
            description: 'כל סוגי כרטיסי האשראי'
        },
        {
            id: 'bit',
            name: 'ביט',
            icon: <WalletIcon />,
            color: '#00a651',
            description: 'תשלום מהיר ובטוח'
        },
        {
            id: 'gpay',
            name: 'Google Pay',
            icon: <GoogleIcon />,
            color: '#4285f4',
            description: 'תשלום מהיר עם Google'
        },
        {
            id: 'apay',
            name: 'Apple Pay',
            icon: <AppleIcon />,
            color: '#000000',
            description: 'תשלום מהיר עם Apple'
        }
    ];

    const handleMethodClick = (methodId) => {
        if (!disabled) {
            onPaymentMethodSelect(methodId);
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
                בחר אמצעי תשלום
            </Typography>

            <Stack spacing={2}>
                {paymentMethods.map((method) => (
                    <Card
                        key={method.id}
                        sx={{
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.6 : 1,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': disabled ? {} : {
                                transform: 'translateY(-2px)',
                                boxShadow: 3
                            }
                        }}
                        onClick={() => handleMethodClick(method.id)}
                    >
                        <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        color: method.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        bgcolor: `${method.color}15`
                                    }}
                                >
                                    {method.icon}
                                </Box>

                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" component="div">
                                        {method.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {method.description}
                                    </Typography>
                                </Box>

                                <PaymentIcon color="action" />
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Stack>

            <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    או
                </Typography>
            </Divider>

            <Button
                variant="outlined"
                fullWidth
                size="large"
                disabled={disabled}
                onClick={() => handleMethodClick('all')}
                sx={{ py: 1.5 }}
            >
                הצג את כל אפשרויות התשלום
            </Button>
        </Box>
    );
};

export default PaymentMethods;
