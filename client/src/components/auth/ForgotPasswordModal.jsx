import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, CircularProgress } from '@mui/material';

export default function ForgotPasswordModal({ open, onClose }) {
    const [identifier, setIdentifier] = useState('');
    const [status, setStatus] = useState('idle');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: identifier })
            });
            setStatus('sent');
        } catch (e) {
            setStatus('sent');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
            <DialogTitle>איפוס סיסמה</DialogTitle>
            <DialogContent>
                {status === 'sent' ? (
                    <Typography variant="body2">
                        אם החשבון קיים, נשלח קישור לאיפוס לכתובת המייל.
                    </Typography>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="אימייל"
                            type="email"
                            fullWidth
                            variant="outlined"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                        />
                        <DialogActions sx={{ px: 0, pt: 2 }}>
                            <Button onClick={onClose}>ביטול</Button>
                            <Button type="submit" variant="contained" disabled={status === 'loading'}>
                                {status === 'loading' ? <CircularProgress size={20} /> : 'שלח קישור איפוס'}
                            </Button>
                        </DialogActions>
                    </form>
                )}
            </DialogContent>
            {status === 'sent' && (
                <DialogActions>
                    <Button variant="contained" onClick={onClose}>סגור</Button>
                </DialogActions>
            )}
        </Dialog>
    );
}



