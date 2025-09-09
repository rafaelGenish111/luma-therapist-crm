import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { brand } from '../../theme/brandTokens';

const SessionWarning = () => {
    const { showSessionWarning, extendSession, logout } = useAuth();

    if (!showSessionWarning) return null;

    return (
        <Dialog
            open={showSessionWarning}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    bgcolor: brand.surface,
                    border: `2px solid ${brand.primary}`
                }
            }}
        >
            <DialogTitle sx={{
                textAlign: 'center',
                color: brand.text,
                fontWeight: 600,
                borderBottom: `1px solid ${brand.primary}20`
            }}>
                ⏰ התראת פקיעת זמן פעלה
            </DialogTitle>

            <DialogContent sx={{ py: 3 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        לא הייתה פעילות במערכת במשך 5 דקות
                    </Typography>
                </Alert>

                <Typography variant="body1" sx={{
                    textAlign: 'center',
                    color: brand.textSecondary,
                    lineHeight: 1.6
                }}>
                    תתבצע התנתקות אוטומטית תוך 30 שניות אם לא תבחר להשאר מחובר
                </Typography>
            </DialogContent>

            <DialogActions sx={{
                justifyContent: 'center',
                gap: 2,
                p: 3,
                pt: 0
            }}>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={logout}
                    sx={{
                        minWidth: 120,
                        borderColor: brand.error,
                        color: brand.error,
                        '&:hover': {
                            borderColor: brand.errorDark,
                            bgcolor: brand.errorSoft
                        }
                    }}
                >
                    התנתק עכשיו
                </Button>

                <Button
                    variant="contained"
                    onClick={extendSession}
                    sx={{
                        minWidth: 120,
                        bgcolor: brand.primary,
                        '&:hover': {
                            bgcolor: brand.primaryDark
                        }
                    }}
                >
                    השאר מחובר
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SessionWarning;
