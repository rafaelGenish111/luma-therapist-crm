import React, { useState, useEffect } from 'react';
import { Box, Fab, Tooltip, Switch, Typography, Dialog, DialogTitle, DialogContent, Button } from '@mui/material';
import AccessibilityIcon from '@mui/icons-material/AccessibilityNew';
import ContrastIcon from '@mui/icons-material/Contrast';
import TextIncreaseIcon from '@mui/icons-material/TextIncrease';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import cookieService from '../services/cookieService';

const AccessibilityWidget = ({ onFontSize, onContrast, onPauseAnimations }) => {
    const [open, setOpen] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [animationsPaused, setAnimationsPaused] = useState(false);

    // טעינת העדפות מקוקיז
    useEffect(() => {
        const preferences = cookieService.getUserPreferences();
        if (preferences) {
            if (preferences.highContrast) {
                setHighContrast(true);
                document.body.classList.add('high-contrast');
            }
            if (preferences.animationsPaused) {
                setAnimationsPaused(true);
                document.body.classList.add('pause-animations');
            }
        }
    }, []);

    const handleContrast = () => {
        setHighContrast((prev) => {
            const newValue = !prev;
            document.body.classList.toggle('high-contrast', newValue);
            onContrast && onContrast(newValue);

            // שמירת העדפה בקוקיז
            const preferences = cookieService.getUserPreferences() || {};
            preferences.highContrast = newValue;
            cookieService.saveUserPreferences(preferences);

            return newValue;
        });
    };

    const handlePauseAnimations = () => {
        setAnimationsPaused((prev) => {
            const newValue = !prev;
            document.body.classList.toggle('pause-animations', newValue);
            onPauseAnimations && onPauseAnimations(newValue);

            // שמירת העדפה בקוקיז
            const preferences = cookieService.getUserPreferences() || {};
            preferences.animationsPaused = newValue;
            cookieService.saveUserPreferences(preferences);

            return newValue;
        });
    };

    return (
        <>
            <Box position="fixed" bottom={24} left={24} zIndex={2000} dir="rtl">
                <Tooltip title="אפשרויות נגישות">
                    <Fab color="primary" aria-label="נגישות" onClick={() => setOpen(true)}>
                        <AccessibilityIcon />
                    </Fab>
                </Tooltip>
            </Box>
            <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="accessibility-dialog-title">
                <DialogTitle id="accessibility-dialog-title">אפשרויות נגישות</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} minWidth={250}>
                        <Button
                            startIcon={<TextIncreaseIcon />}
                            onClick={() => onFontSize && onFontSize('large')}
                            variant="outlined"
                            aria-label="הגדל גופן"
                        >
                            הגדל גופן
                        </Button>
                        <Button
                            startIcon={<TextIncreaseIcon />}
                            onClick={() => onFontSize && onFontSize('medium')}
                            variant="outlined"
                            aria-label="גופן רגיל"
                        >
                            גופן רגיל
                        </Button>
                        <Button
                            startIcon={<ContrastIcon />}
                            onClick={handleContrast}
                            variant={highContrast ? "contained" : "outlined"}
                            aria-label="ניגודיות גבוהה"
                        >
                            ניגודיות גבוהה
                        </Button>
                        <Button
                            startIcon={<PauseCircleIcon />}
                            onClick={handlePauseAnimations}
                            variant={animationsPaused ? "contained" : "outlined"}
                            aria-label="עצור אנימציות"
                        >
                            עצור אנימציות
                        </Button>
                        <Button
                            component="a"
                            href="/accessibility-statement"
                            target="_blank"
                            rel="noopener"
                            variant="text"
                            aria-label="הצהרת נגישות"
                        >
                            הצהרת נגישות
                        </Button>
                        <Button
                            onClick={() => {
                                localStorage.removeItem('cookieConsent');
                                window.location.reload();
                            }}
                            variant="text"
                            aria-label="נהל קוקיז"
                        >
                            נהל קוקיז
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AccessibilityWidget; 