# Notifications & Reminders - שלב 5

מערכת תזכורות ואימיילים מתקדמת למטפלות ולקוחות.

## 🎯 תכונות עיקריות

### 1. תבניות אימייל HTML מתקדמות

#### תבניות זמינות:
- **`appointmentConfirmation.html`** - אישור פגישה
- **`appointmentReminder.html`** - תזכורת פגישה
- **`appointmentCancellation.html`** - ביטול פגישה
- **`therapistNewBooking.html`** - התראה למטפלת

#### תכונות עיצוב:
- ✅ **Responsive Design** - מותאם לכל המכשירים
- ✅ **RTL Support** - תמיכה מלאה בעברית
- ✅ **Branding** - צבעים ולוגו של המטפלת
- ✅ **Inline CSS** - תאימות מלאה עם כל לקוחות האימייל
- ✅ **Material Design** - עיצוב מודרני ונקי

### 2. Email Service מתקדם

#### פונקציות עיקריות:
- **`sendAppointmentConfirmation()`** - אישור פגישה עם קובץ ICS
- **`sendAppointmentReminder()`** - תזכורות עם סוגים שונים
- **`sendCancellationEmail()`** - ביטול עם פרטי החזר
- **`sendTherapistNotification()`** - התראות למטפלת
- **`sendReminderSMS()`** - תזכורות SMS (placeholder)

#### תכונות מתקדמות:
- ✅ **Retry Logic** - ניסיון חוזר עד 3 פעמים
- ✅ **Template Engine** - Handlebars עם placeholders
- ✅ **ICS Generation** - קובץ יומן אוטומטי
- ✅ **Error Handling** - טיפול מפורט בשגיאות
- ✅ **Logging** - לוגים מפורטים לכל פעולה

### 3. Reminder Scheduler אוטומטי

#### Jobs תקופתיים:
1. **תזכורת יומית** - כל יום ב-9:00 AM (24 שעות לפני הפגישה)
2. **תזכורת שעתית** - כל שעה (שעה לפני הפגישה)
3. **Follow-up** - כל 6 שעות (אחרי פגישות שהסתיימו)
4. **תזכורות מותאמות** - כל 30 דקות (לפי הגדרות המטפלת)

#### תכונות מתקדמות:
- ✅ **Timezone Support** - תמיכה באזור זמן מקומי
- ✅ **Custom Settings** - הגדרות אישיות לכל מטפלת
- ✅ **Health Checks** - בדיקת תקינות המערכת
- ✅ **Error Recovery** - התאוששות משגיאות
- ✅ **Metrics** - סטטיסטיקות מפורטות

## 🔧 הגדרה והפעלה

### 1. משתני סביבה
```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Application URLs
FRONTEND_URL=http://localhost:3000
DASHBOARD_URL=http://localhost:3000/dashboard
DOMAIN=yourdomain.com

# Timezone
DEFAULT_TIMEZONE=Asia/Jerusalem
```

### 2. התקנת dependencies
```bash
npm install nodemailer handlebars ical-generator moment-timezone
```

### 3. הפעלת Email Service
```javascript
// server/src/server.js
const emailService = require('./services/email.service');

// Initialize email service
await emailService.init();
```

### 4. הפעלת Reminder Jobs
```javascript
// server/src/server.js
const reminderJobs = require('./jobs/reminderJobs');

// Start reminder jobs
reminderJobs.start();
```

## 📧 שימוש ב-Email Service

### שליחת אישור פגישה
```javascript
const emailService = require('./services/email.service');

await emailService.sendAppointmentConfirmation(
    appointment,
    client,
    therapist
);
```

### שליחת תזכורת
```javascript
await emailService.sendAppointmentReminder(
    appointment,
    client,
    therapist,
    '24h' // '24h', '1h', 'custom'
);
```

### שליחת התראה למטפלת
```javascript
await emailService.sendTherapistNotification(
    appointment,
    client,
    therapist,
    'new_booking' // 'new_booking', 'cancellation', 'reschedule'
);
```

## ⏰ הגדרות תזכורות

### הגדרות מטפלת
```javascript
// Therapist model
reminderSettings: {
    enableReminders: true,
    reminder24h: true,
    reminder1h: true,
    reminderCustom: [
        { hoursBefore: 2, enabled: true },
        { hoursBefore: 6, enabled: false }
    ],
    followUpEnabled: true
}
```

### הרצת Jobs ידנית
```javascript
const reminderJobs = require('./jobs/reminderJobs');

// Run specific job immediately
await reminderJobs.runJobNow('dailyReminder');
await reminderJobs.runJobNow('hourlyReminder');
await reminderJobs.runJobNow('followUp');
```

## 🎨 התאמת תבניות

### הוספת שדות חדשים
```html
<!-- בתבנית HTML -->
<h3>{{newField}}</h3>
<p>{{therapist.customField}}</p>
```

```javascript
// ב-Email Service
const templateData = {
    newField: 'ערך חדש',
    therapist: {
        customField: 'שדה מותאם'
    }
};
```

### שינוי צבעים
```html
<!-- בתבנית HTML -->
<style>
.header {
    background: linear-gradient(135deg, {{therapist.primaryColor}} 0%, {{therapist.secondaryColor}} 100%);
}
</style>
```

## 📊 ניטור וביצועים

### Health Check
```javascript
const reminderJobs = require('./jobs/reminderJobs');

const health = await reminderJobs.healthCheck();
console.log(health);
```

### סטטיסטיקות
```javascript
// קבלת סטטוס Jobs
const status = reminderJobs.getJobsStatus();
console.log(status);

// בדיקת תזכורות ממתינות
const pendingReminders = await Appointment.countDocuments({
    startTime: { $gte: tomorrow, $lte: tomorrowEnd },
    status: 'confirmed',
    'remindersSent.type': { $ne: '24h' }
});
```

## 🔒 אבטחה

### Rate Limiting
- הגבלת מספר אימיילים לכל IP
- הגבלת תזכורות לכל לקוח
- הגבלת ניסיונות שליחה

### Validation
- ולידציה של כתובות אימייל
- בדיקת תבניות לפני שליחה
- הגנה מפני spam

### Logging
- לוגים מפורטים לכל פעולה
- מעקב אחר שגיאות
- סטטיסטיקות שליחה

## 🚀 תכונות מתקדמות

### ICS Calendar Files
- יצירה אוטומטית של קבצי יומן
- תמיכה ב-Google Calendar, Outlook, Apple Calendar
- פרטי פגישה מלאים בקובץ

### Template Engine
- Handlebars עם תמיכה ב-loops ו-conditionals
- Nested objects support
- Helper functions מותאמות

### Error Recovery
- Retry logic עם exponential backoff
- Queue failed emails לשליחה מאוחרת
- Fallback templates

### Multi-language Support
- תמיכה בעברית ואנגלית
- תאריכים בפורמט מקומי
- RTL layout support

## 🔧 פתרון בעיות

### בעיות נפוצות
1. **SMTP Authentication Failed** - בדיקת credentials
2. **Template Not Found** - בדיקת נתיבי קבצים
3. **Jobs Not Running** - בדיקת timezone ו-cron expressions
4. **High Memory Usage** - אופטימיזציה של batch processing

### Debugging
```javascript
// Enable debug logging
process.env.DEBUG = 'email:*,reminder:*';

// Check email service status
await emailService.init();
console.log('Email service initialized');

// Check reminder jobs status
const status = reminderJobs.getJobsStatus();
console.log('Reminder jobs status:', status);
```

### Monitoring
- בדיקת לוגים ב-`logs/combined.log`
- מעקב אחר מטריקות שליחה
- התראות על שגיאות חוזרות

## 📈 אופטימיזציות

### Batch Processing
- שליחת אימיילים בקבוצות
- אופטימיזציה של queries
- Caching של templates

### Performance
- Connection pooling ל-SMTP
- Async processing
- Memory optimization

### Scalability
- Queue system לעיבוד אסינכרוני
- Load balancing
- Horizontal scaling
