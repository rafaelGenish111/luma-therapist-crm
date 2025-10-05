# Google Calendar Integration - Backend

מערכת סנכרון מתקדמת עם Google Calendar למטפלות.

## 🏗️ ארכיטקטורה

### שירותים (Services)

#### 1. GoogleAuthService
שירות לאימות OAuth עם Google.

**פונקציות עיקריות:**
- `initOAuth2Client()` - אתחול Google OAuth2 client
- `getAuthUrl(therapistId)` - יצירת authorization URL
- `getTokensFromCode(code, state)` - קבלת טוקנים מקוד authorization
- `refreshAccessToken(refreshToken, therapistId)` - רענון access token
- `encryptToken(token)` / `decryptToken(encryptedToken)` - הצפנה/פענוח טוקנים
- `saveTokensToDatabase(therapistId, tokens)` - שמירת טוקנים בדאטה בייס
- `disconnectTherapist(therapistId)` - ניתוק מטפלת

**אבטחה:**
- הצפנת טוקנים עם AES
- State token validation
- טוקנים נשמרים עם `select: false`

#### 2. GoogleCalendarService
שירות לסנכרון אירועים עם Google Calendar.

**פונקציות עיקריות:**
- `syncAppointmentToGoogle(appointmentId)` - סנכרון פגישה ל-Google
- `syncFromGoogleToLocal(therapistId)` - סנכרון מ-Google למקומי
- `createGoogleEvent(appointment, calendar)` - יצירת Google Event
- `updateGoogleEvent(googleEventId, appointment, calendar)` - עדכון Google Event
- `deleteGoogleEvent(googleEventId, calendar)` - מחיקת Google Event
- `setupWebhook(therapistId)` - הגדרת webhook
- `handleWebhookNotification(channelId, resourceId)` - טיפול ב-webhook

**תכונות מתקדמות:**
- תמיכה ברמות פרטיות שונות (busy-only, generic, detailed)
- סנכרון דו-כיווני
- טיפול בשגיאות ושמירתן

#### 3. SyncService
שירות לסנכרון אוטומטי.

**פונקציות עיקריות:**
- `fullSync(therapistId)` - סנכרון מלא דו-כיווני
- `handleAppointmentChange(appointmentId, changeType)` - טיפול בשינוי פגישה
- `renewWebhook(therapistId)` - חידוש webhook
- `periodicSyncAllTherapists()` - סנכרון תקופתי לכל המטפלות
- `retryFailedSyncs(maxRetries)` - retry פגישות שנכשלו

### קונטרולרים (Controllers)

#### 1. CalendarController
טיפול בפעולות Google Calendar.

**Routes:**
- `GET /api/calendar/google/auth` - התחלת OAuth
- `GET /api/calendar/google/callback` - OAuth callback
- `POST /api/calendar/google/disconnect` - ניתוק
- `GET /api/calendar/sync-status` - סטטוס סנכרון
- `POST /api/calendar/sync` - סנכרון ידני
- `POST /api/calendar/webhook` - webhook endpoint

#### 2. AppointmentController
טיפול בפעולות פגישות.

**Routes:**
- `GET /api/appointments` - רשימת פגישות (עם סינון ומיון)
- `POST /api/appointments` - יצירת פגישה
- `PUT /api/appointments/:id` - עדכון פגישה
- `DELETE /api/appointments/:id` - מחיקת פגישה
- `POST /api/appointments/bulk` - פגישות חוזרות
- `GET /api/appointments/conflicts` - בדיקת התנגשויות
- `POST /api/appointments/:id/confirm` - אישור פגישה
- `POST /api/appointments/:id/cancel` - ביטול פגישה
- `POST /api/appointments/:id/complete` - השלמת פגישה
- `POST /api/appointments/:id/reminder` - שליחת תזכורת

#### 3. AvailabilityController
טיפול בהגדרות זמינות.

**Routes:**
- `GET /api/availability` - קבלת הגדרות זמינות
- `PUT /api/availability` - עדכון הגדרות זמינות
- `GET /api/availability/slots` - slots זמינים
- `POST /api/availability/blocked` - יצירת זמן חסום
- `PUT /api/availability/blocked/:id` - עדכון זמן חסום
- `DELETE /api/availability/blocked/:id` - מחיקת זמן חסום

### Background Jobs

#### SyncJobs
מערכת jobs תקופתיים לסנכרון אוטומטי.

**Jobs:**
1. **סנכרון תקופתי** - כל 10 דקות
2. **חידוש webhooks** - כל יום ב-2:00 AM
3. **Retry פגישות שנכשלו** - כל שעה
4. **ניקוי שגיאות ישנות** - כל יום ב-3:00 AM

**פונקציות נוספות:**
- `startCustomJob(name, schedule, task)` - יצירת job מותאם אישית
- `runJobNow(jobName)` - הרצת job מיד
- `healthCheck()` - בדיקת תקינות המערכת

## 🔧 הגדרה והפעלה

### 1. משתני סביבה
```bash
# Google Calendar OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Encryption key for tokens
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Calendar settings
DEFAULT_TIMEZONE=Asia/Jerusalem
MAX_ADVANCE_BOOKING_DAYS=90
```

### 2. הפעלת Jobs
```javascript
// בקובץ server/src/server.js
const syncJobs = require('./jobs/syncJobs');
syncJobs.start();
```

### 3. הוספת Routes לשרת הראשי
```javascript
// בקובץ server/src/index.js
const calendarRoutes = require('./routes/calendar.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const availabilityRoutes = require('./routes/availability.routes');

app.use('/api/calendar', calendarRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/availability', availabilityRoutes);
```

## 📊 מודלים (Models)

### GoogleCalendarSync
```javascript
{
  therapistId: ObjectId,
  googleAccessToken: String (encrypted),
  googleRefreshToken: String (encrypted),
  googleCalendarId: String,
  syncEnabled: Boolean,
  lastSyncedAt: Date,
  syncDirection: String, // 'two-way', 'to-google', 'from-google'
  privacyLevel: String, // 'busy-only', 'generic', 'detailed'
  webhookChannelId: String,
  webhookResourceId: String,
  webhookExpiration: Date,
  syncErrors: [{
    error: String,
    occurredAt: Date,
    resolved: Boolean
  }]
}
```

### Appointment (עודכן)
```javascript
{
  therapistId: ObjectId,
  clientId: ObjectId,
  serviceType: String, // 'individual', 'couple', 'family', 'group', 'workshop'
  startTime: Date,
  endTime: Date,
  duration: Number,
  status: String, // 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'
  googleEventId: String,
  googleCalendarSynced: Boolean,
  location: String, // 'online', 'clinic', 'home'
  meetingUrl: String,
  recurringPattern: {
    isRecurring: Boolean,
    frequency: String,
    endDate: Date,
    parentAppointmentId: ObjectId
  },
  paymentStatus: String,
  paymentAmount: Number,
  remindersSent: [{
    type: String,
    sentAt: Date
  }],
  cancellationReason: String,
  cancelledBy: String,
  cancelledAt: Date
}
```

### TherapistAvailability
```javascript
{
  therapistId: ObjectId,
  weeklySchedule: [{
    dayOfWeek: Number, // 0-6
    isAvailable: Boolean,
    timeSlots: [{
      startTime: String, // "HH:mm"
      endTime: String
    }]
  }],
  bufferTime: Number,
  maxDailyAppointments: Number,
  advanceBookingDays: Number,
  minNoticeHours: Number,
  timezone: String
}
```

### BlockedTime
```javascript
{
  therapistId: ObjectId,
  startTime: Date,
  endTime: Date,
  reason: String, // 'vacation', 'sick', 'personal', 'training', 'other'
  notes: String,
  isRecurring: Boolean,
  recurringPattern: {
    frequency: String,
    endDate: Date,
    parentBlockedTimeId: ObjectId
  }
}
```

## 🔒 אבטחה

### הצפנת טוקנים
- כל הטוקנים מוצפנים עם AES לפני שמירה בדאטה בייס
- מפתח הצפנה נשמר ב-ENCRYPTION_KEY
- טוקנים נשמרים עם `select: false` בברירת מחדל

### Rate Limiting
- Calendar operations: 100 requests per 15 minutes
- Webhook: 10 requests per minute
- Appointment operations: 200 requests per 15 minutes
- Reminder: 10 requests per minute

### Validation
- ולידציה מלאה של כל הקלטים
- בדיקת הרשאות לכל פעולה
- טיפול בשגיאות מפורט

## 📈 ביצועים

### אופטימיזציות
- סנכרון אסינכרוני ל-Google Calendar
- Batch operations לפגישות חוזרות
- Caching של הגדרות זמינות
- אינדקסים על שדות נפוצים

### Monitoring
- לוגים מפורטים לכל פעולה
- סטטיסטיקות סנכרון
- Health checks תקופתיים
- התראות על שגיאות

## 🚀 שימוש

### התחלת סנכרון
```javascript
const syncService = require('./services/sync.service');

// סנכרון מלא
const stats = await syncService.fullSync(therapistId);

// סנכרון פגישה בודדת
const result = await syncService.syncAppointmentToGoogle(appointmentId);
```

### ניהול Jobs
```javascript
const syncJobs = require('./jobs/syncJobs');

// התחלת jobs
syncJobs.start();

// הרצת job מיד
await syncJobs.runJobNow('periodicSync');

// בדיקת תקינות
const health = await syncJobs.healthCheck();
```

## 🔧 פתרון בעיות

### שגיאות נפוצות
1. **Token expired** - רענון אוטומטי של refresh token
2. **Rate limiting** - המתנה ונסיון חוזר
3. **Webhook expired** - חידוש אוטומטי
4. **Network errors** - retry עם exponential backoff

### Debugging
- בדיקת לוגים ב-`logs/combined.log`
- בדיקת סטטוס סנכרון דרך API
- הרצת health check
- בדיקת שגיאות סנכרון בדאטה בייס
