import React from "react";
import { Box, Container, Typography } from '@mui/material';
import Logo from '../components/common/Logo';
import Copyright from '../components/common/Copyright';

export default function TermsAndPrivacyPage() {
    return (
        <Box minHeight="100vh" bgcolor="background.default">
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" mb={4}>
                    <Logo variant="default" />
                </Box>
                <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                    תקנון האתר – תנאי שימוש ומדיניות פרטיות
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    עודכן לאחרונה: 17.08.2025
                </Typography>

                <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                    1. כללי
                </Typography>
                <Typography paragraph>
                    השימוש במערכת מותר לכל אדם מעל גיל 18. השימוש מהווה הסכמה מלאה לכל האמור בתקנון זה. אם אינך מסכים – הימנע משימוש במערכת.
                </Typography>
                <Typography paragraph>
                    החברה שומרת לעצמה את הזכות לשנות את התקנון מעת לעת. העדכון האחרון מופיע בראש המסמך.
                </Typography>

                <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                    2. הרשמה ושימוש במערכת
                </Typography>
                <Typography paragraph>
                    שימוש בשירותי המערכת מחייב רישום עם פרטים אישיים. המשתמש אחראי לשמירת סודיות פרטי הגישה (שם משתמש/סיסמה). כל פעולה שתתבצע באמצעות החשבון תיחשב כאילו בוצעה על ידי בעל החשבון.
                </Typography>

                <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                    3. שירותי המערכת
                </Typography>
                <Typography paragraph>
                    המערכת מאפשרת למטפלים לנהל פגישות ותורים, לנהל לקוחות, לאסוף ולשמור הצהרות בריאות ומידע רפואי, להחזיק אתר אישי להצגת שירותיהם, ולהנפיק חשבוניות ותזכורות.
                </Typography>
                <Typography paragraph>
                    המערכת אינה מספקת שירות רפואי או ייעוץ רפואי.
                </Typography>

                <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                    4. אחריות והגבלת אחריות
                </Typography>
                <Typography paragraph>
                    החברה מספקת פלטפורמה טכנולוגית בלבד לניהול מידע. האחריות המלאה על טיב השירות הטיפולי ועל התוכן המוזן במערכת מוטלת על המטפלים בלבד.
                </Typography>
                <Typography paragraph>
                    החברה לא תישא בכל אחריות לנזק ישיר או עקיף שייגרם כתוצאה משימוש במערכת.
                </Typography>

                <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                    5. תוכן ונתונים
                </Typography>
                <Typography paragraph>
                    המשתמש אחראי על כל מידע ותוכן שמוזן למערכת. נאסר להזין מידע שקרי, מטעה, פוגעני או בלתי חוקי. החברה רשאית להסיר מידע או לחסום משתמש שפועל בניגוד לתקנון זה.
                </Typography>

                <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                    6. תשלומים
                </Typography>
                <Typography paragraph>
                    חלק מהשירותים עשויים להיות כרוכים בתשלום דמי מנוי. התשלום יתבצע באמצעים מאובטחים דרך ספקי סליקה חיצוניים. החברה רשאית לשנות את מחירי המנוי בהודעה מוקדמת של 30 יום.
                </Typography>

                <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                    7. זכויות יוצרים וקניין רוחני
                </Typography>
                <Typography paragraph>
                    כל זכויות היוצרים, הפטנטים, הסימנים המסחריים והקוד של המערכת שייכים לחברה בלבד. אין להעתיק, להפיץ או להשתמש בתכנים ללא אישור מראש ובכתב.
                </Typography>

                <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                    8. פרטיות והגנת מידע
                </Typography>
                <Typography paragraph>
                    בהתאם לחוק הגנת הפרטיות, תשמ"א-1981 ותיקון 13:
                </Typography>

                <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                    8.1 מידע הנאסף
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                    <Typography component="li">פרטי משתמשים (מטפלים): שם, טלפון, דוא"ל, אמצעי תשלום.</Typography>
                    <Typography component="li">פרטי מטופלים: שם, טלפון, דוא"ל, היסטוריית פגישות.</Typography>
                    <Typography component="li">מידע רפואי רגיש: הצהרות בריאות, טפסי הסכמה, נתונים רפואיים שמסרו מטופלים.</Typography>
                    <Typography component="li">מידע טכני: כתובת IP, סוג דפדפן, שימוש במערכת.</Typography>
                </Box>

                <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                    8.2 מטרות השימוש
                </Typography>
                <Typography paragraph>
                    מתן השירותים, ניהול הצהרות בריאות ותורים, שיפור השירות, עמידה בחובות חוקיות.
                </Typography>

                <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                    8.3 מסירת מידע לצדדים שלישיים
                </Typography>
                <Typography paragraph>
                    המידע לא יימסר לצדדים שלישיים אלא אם נדרש לצורך אספקת השירות, קיימת חובה חוקית, או לצורך אכיפת התקנון.
                </Typography>

                <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                    8.4 אבטחת מידע
                </Typography>
                <Typography paragraph>
                    שימוש בהצפנה, בקרות גישה וגיבויים מאובטחים. המידע הרפואי נשמר במאגרים מאובטחים בלבד.
                </Typography>

                <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                    8.5 זכויות המשתמשים
                </Typography>
                <Typography paragraph>
                    זכות עיון, תיקון, מחיקה ("הזכות להישכח"), הגבלת שימוש, ניידות מידע. לבקשות: [האימייל שלך]
                </Typography>

                <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                    8.6 שמירת מידע
                </Typography>
                <Typography paragraph>
                    מידע רפואי יישמר לפי דין או עד לבקשת מחיקה. מידע אחר יימחק או יעבור אנונימיזציה בתום ההתקשרות.
                </Typography>

                <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                    8.7 שימוש בעוגיות
                </Typography>
                <Typography paragraph>
                    המערכת עושה שימוש בעוגיות לצורך תפקוד תקין, זיהוי משתמשים, שיפור חוויית השימוש וניתוח נתונים.
                </Typography>

                <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                    9. סיום והפסקת שירות
                </Typography>
                <Typography paragraph>
                    המשתמש רשאי להפסיק שימוש בכל עת. החברה רשאית להשעות או להפסיק את השירות במקרה של הפרת תנאי התקנון.
                </Typography>

                <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                    10. דין וסמכות שיפוט
                </Typography>
                <Typography paragraph>
                    הדין החל: הדין הישראלי בלבד. סמכות השיפוט הבלעדית: בתי המשפט המוסמכים בעיר [תל אביב/ירושלים – לבחור].
                </Typography>

                <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                    11. יצירת קשר
                </Typography>
                <Typography paragraph>
                    לשאלות, בקשות או תלונות ניתן לפנות: 📧 [האימייל שלך] 📞 [מספר טלפון עסקי]
                </Typography>
                <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Copyright variant="with-logo" />
                </Box>
            </Container>
        </Box>
    );
}
