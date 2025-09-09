import React from 'react';
import { Box, Container, Typography, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage = () => {
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom align="center">
                מדיניות פרטיות
            </Typography>

            <Paper elevation={2} sx={{ p: 4, mt: 3 }}>
                <Typography variant="h5" gutterBottom>
                    אודות מדיניות הפרטיות
                </Typography>
                <Typography paragraph>
                    אנו ב־Luma מחויבים להגן על הפרטיות שלך. מדיניות זו מסבירה כיצד אנו אוספים,
                    משתמשים ומגנים על המידע האישי שלך.
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                    איזה מידע אנו אוספים?
                </Typography>
                <List>
                    <ListItem>
                        <ListItemText
                            primary="מידע אישי"
                            secondary="שם, כתובת אימייל, מספר טלפון ופרטי קשר אחרים שאתה מספק לנו"
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemText
                            primary="מידע טכני"
                            secondary="כתובת IP, סוג דפדפן, מערכת הפעלה ומידע על המכשיר"
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemText
                            primary="מידע על שימוש"
                            secondary="דפים שביקרת בהם, זמן שהייה ופעולות שביצעת באתר"
                        />
                    </ListItem>
                </List>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                    כיצד אנו משתמשים בקוקיז?
                </Typography>
                <Typography paragraph>
                    אנו משתמשים בקוקיז כדי:
                </Typography>
                <List>
                    <ListItem>
                        <ListItemText
                            primary="קוקיז הכרחיים"
                            secondary="לניהול התחברות, אבטחה ותפקוד בסיסי של האתר"
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemText
                            primary="קוקיז ביצועים"
                            secondary="לשיפור מהירות האתר ולניתוח ביצועים"
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemText
                            primary="קוקיז העדפות"
                            secondary="לזכירת הגדרות אישיות והעדפות שלך"
                        />
                    </ListItem>
                </List>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                    כיצד אנו מגנים על המידע שלך?
                </Typography>
                <Typography paragraph>
                    אנו נוקטים באמצעי אבטחה מתקדמים כדי להגן על המידע האישי שלך:
                </Typography>
                <List>
                    <ListItem>
                        <ListItemText
                            primary="הצפנה"
                            secondary="כל המידע מועבר בצורה מוצפנת באמצעות SSL"
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemText
                            primary="גיבוי מאובטח"
                            secondary="המידע נשמר בשרתים מאובטחים עם גיבוי קבוע"
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemText
                            primary="גישה מוגבלת"
                            secondary="רק עובדים מורשים יכולים לגשת למידע האישי"
                        />
                    </ListItem>
                </List>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                    זכויותיך
                </Typography>
                <Typography paragraph>
                    יש לך הזכות:
                </Typography>
                <List>
                    <ListItem>
                        <ListItemText
                            primary="גישה למידע"
                            secondary="לבקש גישה לכל המידע האישי שיש לנו עליך"
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemText
                            primary="תיקון מידע"
                            secondary="לתקן מידע לא מדויק או לא מעודכן"
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemText
                            primary="מחיקת מידע"
                            secondary="לבקש מחיקה של המידע האישי שלך"
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemText
                            primary="התנגדות"
                            secondary="להתנגד לעיבוד המידע שלך למטרות מסוימות"
                        />
                    </ListItem>
                </List>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                    יצירת קשר
                </Typography>
                <Typography paragraph>
                    אם יש לך שאלות לגבי מדיניות הפרטיות שלנו, אנא צור איתנו קשר:
                </Typography>
                <Typography>
                    📧 אימייל: privacy@luma.com
                </Typography>
                <Typography>
                    📞 טלפון: 03-1234567
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Typography variant="body2" color="text.secondary" align="center">
                    עדכון אחרון: {new Date().toLocaleDateString('he-IL')}
                </Typography>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <Typography color="primary">
                            ← חזרה לדף הבית
                        </Typography>
                    </Link>
                </Box>
            </Paper>
        </Container>
    );
};

export default PrivacyPolicyPage;


