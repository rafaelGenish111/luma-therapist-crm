# UI Components - קומפוננטות חדשות

תיעוד מלא של הקומפוננטות החדשות שנוספו למערכת.

## 📁 מבנה הקבצים

```
client/src/pages/dashboard/therapist/components/clientCard/
├── CommunicationTab.jsx      # טאב תקשורת
├── ReportsTab.jsx           # טאב דוחות
├── PaymentsTab.jsx          # טאב תשלומים (קיים)
├── AppointmentsTab.jsx      # טאב פגישות (קיים)
├── DocumentsTab.jsx         # טאב מסמכים (קיים)
└── ...
```

## 📞 תקשורת - CommunicationTab

### תכונות עיקריות:
- ✅ היסטוריית תקשורת מלאה
- ✅ שליחת הודעות (אימייל, SMS, WhatsApp)
- ✅ סטטיסטיקות תקשורת
- ✅ ניסיון חוזר להודעות שנכשלו
- ✅ תמיכה ב-RTL

### שימוש:
```jsx
import CommunicationTab from './components/clientCard/CommunicationTab';

<CommunicationTab client={client} />
```

### API Calls:
- `GET /api/clients/:clientId/communications` - קבלת היסטוריה
- `POST /api/clients/:clientId/communications` - שליחת הודעה
- `GET /api/communications/failed` - הודעות שנכשלו
- `POST /api/communications/:id/retry` - ניסיון חוזר

### תכונות:
1. **כרטיסי סיכום** - סטטיסטיקות מהירות
2. **טבלת הודעות** - היסטוריה מלאה עם סינון
3. **דיאלוג שליחה** - יצירת הודעות חדשות
4. **בדיקות תקינות** - וידוא פרטי קשר זמינים
5. **סטטוסים ויזואליים** - צבעים ואייקונים

## 📊 דוחות - ReportsTab

### תכונות עיקריות:
- ✅ KPI קטנים (תשלומים, פגישות, הצלחה)
- ✅ גרף תשלומים חודשי
- ✅ סטטיסטיקות מפורטות
- ✅ טבלת תשלומים אחרונים
- ✅ תמיכה ב-RTL

### שימוש:
```jsx
import ReportsTab from './components/clientCard/ReportsTab';

<ReportsTab client={client} />
```

### API Calls:
- `GET /api/clients/:clientId/payments` - נתוני תשלומים
- `GET /api/clients/:clientId/appointments` - נתוני פגישות

### תכונות:
1. **כרטיסי KPI** - 4 כרטיסים עם נתונים מרכזיים
2. **גרף חודשי** - תשלומים לפי חודש (טבלה)
3. **סטטיסטיקות מפורטות** - ממוצעים ואחוזים
4. **טבלת תשלומים** - 10 התשלומים האחרונים
5. **חישובים אוטומטיים** - אחוזי הצלחה וממוצעים

## 💳 תשלומים - PaymentsTab (שדרוג)

### תכונות עיקריות:
- ✅ יצירת תשלומים חדשים
- ✅ היסטוריית תשלומים
- ✅ יצירת חשבוניות
- ✅ ביטול תשלומים
- ✅ Badge "יתרה פתוחה"

### שימוש:
```jsx
import PaymentsTab from './components/clientCard/PaymentsTab';

<PaymentsTab client={client} />
```

### API Calls:
- `GET /api/clients/:clientId/payments` - קבלת תשלומים
- `POST /api/clients/:clientId/payments` - יצירת תשלום
- `POST /api/payments/:id/invoice` - יצירת חשבונית
- `POST /api/payments/:id/refund` - ביטול תשלום

### תכונות:
1. **דיאלוג יצירה** - טופס מלא ליצירת תשלום
2. **טבלת תשלומים** - היסטוריה עם פעולות
3. **סטטיסטיקות** - סיכום כספי
4. **קישורי חשבוניות** - צפייה בהורדה
5. **בדיקות תקינות** - וידוא נתונים

## 📅 פגישות - AppointmentsTab (שדרוג)

### תכונות עיקריות:
- ✅ הפרדת רשימות (עתידיות/עבר)
- ✅ שינוי סטטוסים מהיר
- ✅ קישור תשלום לפגישה
- ✅ סינונים מתקדמים
- ✅ פעולות מהירות

### שימוש:
```jsx
import AppointmentsTab from './components/clientCard/AppointmentsTab';

<AppointmentsTab client={client} />
```

### API Calls:
- `GET /api/clients/:clientId/appointments` - קבלת פגישות
- `PATCH /api/appointments/:id` - עדכון פגישה
- `DELETE /api/appointments/:id` - מחיקת פגישה

### תכונות:
1. **טאבים נפרדים** - עתידיות והיסטוריה
2. **כרטיסי סיכום** - סטטיסטיקות מהירות
3. **טבלת פגישות** - עם פעולות מהירות
4. **דיאלוג יצירה/עריכה** - טופס מלא
5. **קישור תשלום** - כפתור "גבה עכשיו"

## 📄 מסמכים - DocumentsTab (שדרוג)

### תכונות עיקריות:
- ✅ העלאת מסמכים ל-Cloudinary
- ✅ ניהול מסמכים נדרשים
- ✅ אינטגרציה עם הצהרות בריאות
- ✅ הורדה ומחיקה
- ✅ סימון השלמה

### שימוש:
```jsx
import DocumentsTab from './components/clientCard/DocumentsTab';

<DocumentsTab client={client} />
```

### API Calls:
- `GET /api/clients/:clientId/documents` - קבלת מסמכים
- `POST /api/clients/:clientId/documents` - העלאת מסמך
- `DELETE /api/documents/:id` - מחיקת מסמך
- `PATCH /api/documents/:id/status` - עדכון סטטוס

### תכונות:
1. **טאבים נפרדים** - כל המסמכים, הצהרות בריאות, Checklist
2. **העלאה מתקדמת** - עם בדיקת סוגי קבצים
3. **ניהול נדרשות** - סימון מסמכים נדרשים
4. **אינטגרציה** - הצהרות בריאות מוצגות יחד
5. **הורדה מהירה** - קישורים ישירים

## 🎨 עיצוב ו-RTL

### תמיכה ב-RTL:
- ✅ כל הטקסטים בעברית
- ✅ כיוון טקסט מימין לשמאל
- ✅ אייקונים מותאמים
- ✅ תאריכים בפורמט עברי
- ✅ מספרים בפורמט עברי

### עיצוב MUI:
- ✅ שימוש ב-Theme הקיים
- ✅ צבעים עקביים
- ✅ Typography אחיד
- ✅ Spacing סטנדרטי
- ✅ Responsive Design

### קומפוננטות משותפות:
- ✅ Cards לכרטיסי סיכום
- ✅ Tables לטבלאות
- ✅ Dialogs לטופסים
- ✅ Chips לסטטוסים
- ✅ Alerts להודעות

## 🔧 שירותים חדשים

### CommunicationService:
```javascript
// קבלת היסטוריה
const data = await communicationService.getByClient(clientId);

// שליחת הודעה
const result = await communicationService.sendMessage(clientId, {
    channel: 'email',
    subject: 'נושא',
    body: 'תוכן'
});

// עזרים ויזואליים
const color = communicationService.getChannelColor('email');
const label = communicationService.getStatusLabel('sent');
```

### AppointmentService:
```javascript
// קבלת פגישות
const data = await appointmentService.getByClient(clientId, {
    scope: 'upcoming'
});

// עדכון פגישה
const result = await appointmentService.update(appointmentId, {
    status: 'completed'
});

// עזרים ויזואליים
const color = appointmentService.getStatusColor('completed');
const label = appointmentService.getStatusLabel('completed');
```

## 📱 Responsive Design

### Breakpoints:
- **xs** (0-599px) - מובייל
- **sm** (600-959px) - טאבלט
- **md** (960-1279px) - דסקטופ קטן
- **lg** (1280px+) - דסקטופ גדול

### התאמות:
- ✅ טבלאות מתקפלות למובייל
- ✅ כרטיסים בשורות בודדות
- ✅ דיאלוגים מלאים במסך
- ✅ טאבים מתגלגלים
- ✅ טקסטים מותאמים

## 🧪 בדיקות DoD

### תקשורת:
✅ **יצירת לוג תקשורת עובדת** - שליחת הודעות נשמרת במסד הנתונים
✅ **היסטוריה מוצגת** - טבלה עם כל ההודעות
✅ **סטטיסטיקות נכונות** - חישובים מדויקים
✅ **בדיקות תקינות** - וידוא פרטי קשר

### דוחות:
✅ **נתונים נטענים** - React Query עובד
✅ **KPI מוצגים** - 4 כרטיסים עם נתונים
✅ **גרף עובד** - טבלה חודשית
✅ **RTL נתמך** - עיצוב עברי מלא

### תשלומים:
✅ **יצירת תשלום מצליחה** - סימולציה עובדת
✅ **רשימה מתעדכנת** - React Query invalidation
✅ **לינק חשבונית** - קישור מדומה עובד
✅ **Badge מוצג** - "יתרה פתוחה" כשיש pending

### פגישות:
✅ **מעבר חלק** - בין עתידיות/עבר
✅ **שינוי סטטוסים** - עדכון בשרת עובד
✅ **קישור תשלום** - כפתור "גבה עכשיו"
✅ **סינונים עובדים** - לפי תאריך וסטטוס

### מסמכים:
✅ **העלאה פועלת** - Cloudinary + DB
✅ **מחיקה עובדת** - soft delete
✅ **צפייה זמינה** - קישורים להורדה
✅ **הצהרות משולבות** - מוצגות יחד עם מסמכים

## 🚀 שימוש מהיר

### התקנה:
```bash
# אין צורך בהתקנה נוספת - הקומפוננטות מוכנות
```

### שימוש:
```jsx
// ב-ClientCard.jsx כבר מוגדר
<TabPanel value={tabValue} index={5}>
    <CommunicationTab client={client} />
</TabPanel>

<TabPanel value={tabValue} index={6}>
    <ReportsTab client={client} />
</TabPanel>
```

### הגדרות נדרשות:
```javascript
// React Query כבר מוגדר
// MUI Theme כבר מוגדר
// API endpoints כבר מוגדרים
```

## 📝 הערות חשובות

1. **תקשורת** - בשלב ראשון רק לוג, ללא שליחה אמיתית
2. **תשלומים** - פועל במצב סימולציה
3. **חשבוניות** - קישורים מדומים
4. **WhatsApp** - לוג בלבד, ללא שליחה אמיתית
5. **קבצים** - מוגבל ל-10MB, סוגים נתמכים בלבד

## 🔄 הרחבות עתידיות

### תקשורת:
- [ ] חיבור Nodemailer לשליחת אימיילים
- [ ] חיבור Twilio לשליחת SMS
- [ ] חיבור WhatsApp Business API
- [ ] תבניות הודעות
- [ ] תזכורות אוטומטיות

### תשלומים:
- [ ] חיבור Stripe
- [ ] חיבור GreenInvoice
- [ ] חיבור Tranzilla
- [ ] חשבוניות אמיתיות
- [ ] תזכורות תשלום

### דוחות:
- [ ] גרפים מתקדמים (Chart.js)
- [ ] ייצוא PDF
- [ ] דוחות תקופתיים
- [ ] התראות KPI
- [ ] השוואות תקופות


