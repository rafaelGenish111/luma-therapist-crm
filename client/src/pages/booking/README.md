# Client Booking Portal - שלב 4

מערכת תיאום פגישות ציבורית מתקדמת למטפלות.

## 🎯 תכונות עיקריות

### 1. עמוד תיאום פגישות ציבורי (`BookingPage.jsx`)

#### תהליך הזמנה מובנה:
1. **בחירת שירות** - כרטיסים עם מחירים ותיאורים
2. **תאריך ושעה** - לוח זמנים עם slots זמינים
3. **פרטי לקוח** - טופס עם אפשרות יצירת חשבון
4. **תשלום** - תמיכה במספר אמצעי תשלום
5. **אישור** - סיכום והשלמת ההזמנה

#### תכונות מתקדמות:
- **Stepper Navigation** - ניווט בין שלבים
- **Real-time Availability** - בדיקת זמינות בזמן אמת
- **Mobile Responsive** - עיצוב מותאם למובייל
- **RTL Support** - תמיכה בעברית
- **Loading States** - מצבי טעינה בכל שלב
- **Error Handling** - טיפול בשגיאות מפורט

### 2. עמוד אישור הזמנה (`BookingConfirmation.jsx`)

#### תצוגת פרטי הפגישה:
- פרטי המטפלת והשירות
- תאריך, שעה ומשך הפגישה
- מיקום וקישור למפגש מקוון
- מחיר וסטטוס תשלום

#### פעולות זמינות:
- **הוסף ליומן** - Google Calendar ו-iCal
- **שלח אישור שוב** - שליחת אימייל חוזרת
- **שנה תאריך** - העברה לעמוד ניהול
- **בטל פגישה** - עם אישור וסיבת ביטול

#### מידע נוסף:
- הוראות הגעה לפגישה
- מדיניות ביטול (24 שעות)
- שאלות נפוצות (FAQ)

### 3. עמוד ניהול הזמנה (`ManageBooking.jsx`)

#### הזדהות:
- הזנת אימייל לזיהוי ההזמנה
- אבטחה עם בדיקת התאמה

#### ניהול הפגישה:
- **צפייה בפרטים** - כל המידע על הפגישה
- **שינוי תאריך** - בחירת תאריך ושעה חדשים
- **ביטול פגישה** - עם סיבת ביטול
- **שליחת אישור** - אימייל חוזר

#### הגבלות זמן:
- לא ניתן לשנות/לבטל פחות מ-24 שעות לפני הפגישה
- התראות ברורות על הגבלות

## 🔧 API Endpoints

### Public Routes (ללא אימות)

#### `GET /api/booking/therapist/:id/info`
קבלת מידע ציבורי על המטפלת.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "therapist_id",
    "name": "שם המטפלת",
    "bio": "תיאור קצר",
    "photo": "url_to_photo",
    "specialties": ["טיפול קוגניטיבי", "טיפול זוגי"],
    "languages": ["עברית", "אנגלית"],
    "timezone": "Asia/Jerusalem",
    "rating": 4.8,
    "reviewCount": 25
  }
}
```

#### `GET /api/booking/therapist/:id/services`
קבלת רשימת שירותים זמינים.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "individual",
      "name": "טיפול פרטי",
      "description": "פגישת טיפול אישית",
      "duration": 60,
      "price": 300,
      "category": "therapy",
      "image": "/images/individual-therapy.jpg"
    }
  ]
}
```

#### `GET /api/booking/therapist/:id/slots`
קבלת slots זמינים לתאריך מסוים.

**Query Parameters:**
- `date` - תאריך בפורמט YYYY-MM-DD
- `serviceType` - סוג השירות
- `duration` - משך בדקות
- `excludeAppointmentId` - ID של פגישה להוציא (לשינוי תאריך)

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "slots": [
      {
        "startTime": "09:00",
        "endTime": "10:00",
        "available": true
      }
    ],
    "timezone": "Asia/Jerusalem"
  }
}
```

#### `POST /api/booking/create`
יצירת הזמנה חדשה.

**Request Body:**
```json
{
  "therapistId": "therapist_id",
  "serviceType": "individual",
  "startTime": "2025-01-15T09:00:00",
  "endTime": "2025-01-15T10:00:00",
  "clientInfo": {
    "name": "שם הלקוח",
    "email": "client@example.com",
    "phone": "050-1234567",
    "notes": "הערות נוספות"
  },
  "paymentMethod": "cash",
  "createAccount": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "appointmentId": "appointment_id",
    "confirmationCode": "A1B2C3D4",
    "clientId": "client_id",
    "appointment": { /* appointment object */ }
  }
}
```

#### `GET /api/booking/verify/:code`
אימות קיום הזמנה לפי קוד אישור.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "appointment_id",
    "serviceType": "individual",
    "startTime": "2025-01-15T09:00:00",
    "status": "pending",
    "confirmationCode": "A1B2C3D4",
    "therapist": {
      "name": "שם המטפלת",
      "email": "therapist@example.com"
    },
    "client": {
      "name": "שם הלקוח",
      "email": "client@example.com"
    }
  }
}
```

#### `POST /api/booking/:code/cancel`
ביטול הזמנה.

**Request Body:**
```json
{
  "email": "client@example.com",
  "reason": "סיבת הביטול"
}
```

#### `POST /api/booking/:code/reschedule`
שינוי תאריך הזמנה.

**Request Body:**
```json
{
  "email": "client@example.com",
  "newStartTime": "2025-01-16T10:00:00",
  "newEndTime": "2025-01-16T11:00:00"
}
```

#### `POST /api/booking/:code/resend-confirmation`
שליחת אימייל אישור חוזר.

**Request Body:**
```json
{
  "email": "client@example.com"
}
```

## 🔒 אבטחה

### Rate Limiting
- **Booking Creation**: 5 בקשות ל-15 דקות לכל IP
- **General Requests**: 100 בקשות ל-15 דקות לכל IP
- **Webhook**: 10 בקשות לדקה לכל IP

### Validation
- ולידציה מלאה של כל הקלטים
- בדיקת התאמת אימייל לזיהוי הזמנות
- הגנה מפני double-booking עם race condition protection

### Data Protection
- החזרת מידע ציבורי בלבד
- הצפנת קודי אישור
- לוגים מפורטים לכל פעולה

## 📧 מערכת אימיילים

### אימיילי אישור
- **לקוח**: אישור הזמנה עם כל הפרטים
- **מטפלת**: התראה על הזמנה חדשה

### אימיילי עדכון
- **שינוי תאריך**: אישור על שינוי עם הפרטים החדשים
- **ביטול**: אישור ביטול עם סיבה

### אימיילי תזכורת
- תזכורת 24 שעות לפני הפגישה
- תזכורת שעה לפני הפגישה

## 🎨 עיצוב ו-UX

### Material-UI Components
- **Stepper** - ניווט בין שלבים
- **Cards** - תצוגת מידע מאורגנת
- **Dialogs** - חלונות אישור ופעולות
- **Chips** - תגיות סטטוס
- **Grid** - פריסה רספונסיבית

### תמיכה בשפות
- עברית (RTL) - ברירת מחדל
- אנגלית - תמיכה מלאה
- תאריכים בפורמט מקומי

### Mobile Responsive
- עיצוב מותאם למובייל
- Touch-friendly buttons
- Optimized layouts

## 🚀 שימוש

### הוספת Routes ל-App
```javascript
// App.jsx
import { BookingPage, BookingConfirmation, ManageBooking } from './pages/booking';

// Routes
<Route path="/book/:therapistId" element={<BookingPage />} />
<Route path="/booking/confirmation/:confirmationCode" element={<BookingConfirmation />} />
<Route path="/booking/manage/:confirmationCode" element={<ManageBooking />} />
```

### הוספת API Routes לשרת
```javascript
// server/src/index.js
const bookingRoutes = require('./routes/booking.routes');
app.use('/api/booking', bookingRoutes);
```

### הגדרת משתני סביבה
```bash
# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000

# Email service configuration
EMAIL_SERVICE_API_KEY=your_email_service_key

# Payment processing (if using Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## 🔧 התאמה אישית

### שירותים מותאמים
ניתן להתאים את רשימת השירותים ב-`getAvailableServices`:
- הוספת שירותים חדשים
- שינוי מחירים
- הוספת קטגוריות

### עיצוב מותאם
- שינוי צבעי הברנד
- הוספת לוגו המטפלת
- התאמת הודעות ואימיילים

### אינטגרציות
- **Stripe** - תשלום בכרטיס אשראי
- **Google Calendar** - הוספה ליומן
- **SMS** - תזכורות SMS
- **WhatsApp** - הודעות WhatsApp

## 📊 Analytics & Monitoring

### מטריקות חשובות
- מספר הזמנות ליום/שבוע/חודש
- שיעור השלמת הזמנות
- שיעור ביטולים
- זמני תגובה ממוצעים

### לוגים
- כל פעולת הזמנה נרשמת
- שגיאות נשמרות עם פרטים
- ביצועי API מנוטרים

## 🔧 פתרון בעיות

### בעיות נפוצות
1. **"Time slot is no longer available"** - Slot נלקח בינתיים
2. **"Email does not match booking"** - אימייל שגוי לזיהוי
3. **"Cannot cancel/reschedule less than 24 hours"** - הגבלת זמן

### Debugging
- בדיקת לוגים ב-`logs/combined.log`
- בדיקת סטטוס הזמנות דרך API
- בדיקת הגדרות זמינות מטפלת
