import React from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';

const AccessibilityStatement = () => (
    <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
            <Typography variant="h4" mb={2}>הצהרת נגישות</Typography>
            <Typography mb={2}>
                אתר זה עומד בדרישות תקן הנגישות הישראלי (ת"י 5568) ו-WCAG 2.0 AA. אנו עושים מאמצים להנגיש את כלל השירותים באתר לכלל האוכלוסייה, כולל אנשים עם מוגבלויות.
            </Typography>
            <Typography mb={2}>
                אם נתקלתם בבעיה או יש לכם הערה בנושא נגישות, נשמח שתפנו לרכז הנגישות:
            </Typography>
            <Box mb={2}>
                <Typography>רכז נגישות: שם לדוגמה</Typography>
                <Typography>דוא"ל: <a href="mailto:accessibility@example.com">accessibility@example.com</a></Typography>
                <Typography>טלפון: 03-1234567</Typography>
            </Box>
            <Typography>
                נמשיך לפעול לשיפור הנגישות באתר. תודה על הסבלנות וההבנה!
            </Typography>
        </Paper>
    </Container>
);

export default AccessibilityStatement; 