# Calendar API Documentation

## תוכן עניינים
1. [התחלה מהירה](#התחלה-מהירה)
2. [אימות](#אימות)
3. [פגישות](#פגישות)
4. [זמינות](#זמינות)
5. [Google Calendar](#google-calendar)
6. [הזמנות ציבוריות](#הזמנות-ציבוריות)
7. [תשלומים](#תשלומים)
8. [תגובות שגיאה](#תגובות-שגיאה)
9. [הגבלות קצב](#הגבלות-קצב)

---

## התחלה מהירה

### Base URL
```
Production: https://api.yoursite.com
Development: http://localhost:5000
```

### Content-Type
```
Content-Type: application/json
```

### Authentication
כל ה-endpoints (למעט הזמנות ציבוריות) דורשים אימות JWT.

```
Authorization: Bearer <token>
```

---

## אימות

### התחברות
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "therapist@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "firstName": "ד\"ר",
    "lastName": "שרה",
    "email": "therapist@example.com",
    "role": "THERAPIST"
  }
}
```

### הרשמה
```http
POST /api/auth/register
```

**Body:**
```json
{
  "firstName": "ד\"ר",
  "lastName": "שרה",
  "email": "therapist@example.com",
  "password": "password123",
  "phone": "0501234567",
  "specialties": ["anxiety", "depression"]
}
```

### איפוס סיסמה
```http
POST /api/auth/forgot-password
```

**Body:**
```json
{
  "email": "therapist@example.com"
}
```

---

## פגישות

### קבלת פגישות
```http
GET /api/appointments
```

**Query Parameters:**
- `startDate` (optional): תאריך התחלה בפורמט ISO (YYYY-MM-DD)
- `endDate` (optional): תאריך סיום בפורמט ISO (YYYY-MM-DD)
- `status` (optional): סטטוס הפגישה (pending|confirmed|completed|cancelled)
- `clientId` (optional): מזהה לקוח
- `page` (optional): מספר עמוד (ברירת מחדל: 1)
- `limit` (optional): מספר פריטים בעמוד (ברירת מחדל: 20)
- `sort` (optional): מיון (startTime|createdAt)

**Response:**
```json
{
  "success": true,
  "appointments": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "therapistId": "64f1a2b3c4d5e6f7g8h9i0j2",
      "clientId": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
        "firstName": "יוחנן",
        "lastName": "כהן",
        "email": "yohanan@example.com",
        "phone": "0507654321"
      },
      "serviceType": "individual",
      "startTime": "2025-12-15T10:00:00.000Z",
      "endTime": "2025-12-15T11:00:00.000Z",
      "duration": 60,
      "status": "confirmed",
      "googleCalendarSynced": true,
      "location": "online",
      "meetingUrl": "https://zoom.us/j/123456789",
      "notes": "פגישה ראשונה",
      "privateNotes": "הערות פרטיות",
      "paymentStatus": "paid",
      "paymentAmount": 300,
      "confirmationCode": "ABC12345",
      "createdAt": "2025-12-01T08:00:00.000Z",
      "updatedAt": "2025-12-01T08:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 3,
    "limit": 20
  }
}
```

### יצירת פגישה
```http
POST /api/appointments
```

**Body:**
```json
{
  "clientId": "64f1a2b3c4d5e6f7g8h9i0j3",
  "serviceType": "individual",
  "startTime": "2025-12-15T10:00:00.000Z",
  "endTime": "2025-12-15T11:00:00.000Z",
  "duration": 60,
  "location": "online",
  "meetingUrl": "https://zoom.us/j/123456789",
  "notes": "פגישה ראשונה",
  "paymentAmount": 300,
  "isRecurring": false
}
```

**פגישה חוזרת:**
```json
{
  "clientId": "64f1a2b3c4d5e6f7g8h9i0j3",
  "serviceType": "individual",
  "startTime": "2025-12-15T10:00:00.000Z",
  "endTime": "2025-12-15T11:00:00.000Z",
  "duration": 60,
  "isRecurring": true,
  "recurringPattern": {
    "frequency": "weekly",
    "endDate": "2025-12-31T00:00:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "appointment": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "clientId": "64f1a2b3c4d5e6f7g8h9i0j3",
    "therapistId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "serviceType": "individual",
    "startTime": "2025-12-15T10:00:00.000Z",
    "endTime": "2025-12-15T11:00:00.000Z",
    "duration": 60,
    "status": "pending",
    "confirmationCode": "ABC12345",
    "createdAt": "2025-12-01T08:00:00.000Z"
  }
}
```

### עדכון פגישה
```http
PUT /api/appointments/:id
```

**Body (כל השדות אופציונליים):**
```json
{
  "startTime": "2025-12-15T11:00:00.000Z",
  "endTime": "2025-12-15T12:00:00.000Z",
  "duration": 90,
  "notes": "הערות מעודכנות",
  "status": "confirmed",
  "location": "clinic",
  "meetingUrl": "https://zoom.us/j/987654321"
}
```

**Response:**
```json
{
  "success": true,
  "appointment": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "startTime": "2025-12-15T11:00:00.000Z",
    "endTime": "2025-12-15T12:00:00.000Z",
    "duration": 90,
    "notes": "הערות מעודכנות",
    "status": "confirmed",
    "updatedAt": "2025-12-01T09:00:00.000Z"
  }
}
```

### ביטול פגישה
```http
POST /api/appointments/:id/cancel
```

**Body:**
```json
{
  "reason": "הלקוח ביקש לבטל",
  "cancelledBy": "therapist"
}
```

**Response:**
```json
{
  "success": true,
  "appointment": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "status": "cancelled",
    "cancellationReason": "הלקוח ביקש לבטל",
    "cancelledBy": "therapist",
    "cancelledAt": "2025-12-01T10:00:00.000Z"
  }
}
```

### מחיקת פגישה
```http
DELETE /api/appointments/:id
```

**Response:**
```json
{
  "success": true,
  "message": "פגישה נמחקה בהצלחה"
}
```

### סטטיסטיקות פגישות
```http
GET /api/appointments/stats
```

**Query Parameters:**
- `startDate` (optional): תאריך התחלה
- `endDate` (optional): תאריך סיום
- `therapistId` (optional): מזהה מטפלת

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 45,
    "confirmed": 30,
    "pending": 10,
    "completed": 25,
    "cancelled": 5,
    "revenue": 13500,
    "averageDuration": 65,
    "completionRate": 83.3
  }
}
```

---

## זמינות

### קבלת הגדרות זמינות
```http
GET /api/availability
```

**Response:**
```json
{
  "success": true,
  "availability": {
    "therapistId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "weeklySchedule": [
      {
        "dayOfWeek": 0,
        "isAvailable": false,
        "timeSlots": []
      },
      {
        "dayOfWeek": 1,
        "isAvailable": true,
        "timeSlots": [
          {
            "startTime": "09:00",
            "endTime": "12:00"
          },
          {
            "startTime": "14:00",
            "endTime": "17:00"
          }
        ]
      }
    ],
    "bufferTime": 15,
    "maxDailyAppointments": 8,
    "timezone": "Asia/Jerusalem"
  },
  "blockedTimes": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
      "startTime": "2025-12-20T00:00:00.000Z",
      "endTime": "2025-12-22T00:00:00.000Z",
      "reason": "vacation",
      "isRecurring": false
    }
  ]
}
```

### עדכון הגדרות זמינות
```http
PUT /api/availability
```

**Body:**
```json
{
  "weeklySchedule": [
    {
      "dayOfWeek": 1,
      "isAvailable": true,
      "timeSlots": [
        {
          "startTime": "09:00",
          "endTime": "17:00"
        }
      ]
    }
  ],
  "bufferTime": 15,
  "maxDailyAppointments": 8,
  "timezone": "Asia/Jerusalem"
}
```

### קבלת שעות זמינות
```http
GET /api/availability/slots
```

**Query Parameters:**
- `therapistId` (required): מזהה מטפלת
- `date` (required): תאריך בפורמט YYYY-MM-DD
- `duration` (optional): משך בדקות (ברירת מחדל: 60)
- `timezone` (optional): אזור זמן

**Response:**
```json
{
  "success": true,
  "date": "2025-12-15",
  "slots": [
    {
      "startTime": "09:00",
      "endTime": "10:00",
      "available": true
    },
    {
      "startTime": "10:15",
      "endTime": "11:15",
      "available": false,
      "reason": "Booked"
    },
    {
      "startTime": "11:30",
      "endTime": "12:30",
      "available": false,
      "reason": "Buffer time"
    }
  ],
  "timezone": "Asia/Jerusalem"
}
```

### חסימת זמן
```http
POST /api/availability/block-time
```

**Body:**
```json
{
  "startTime": "2025-12-20T00:00:00.000Z",
  "endTime": "2025-12-22T00:00:00.000Z",
  "reason": "vacation",
  "isRecurring": false
}
```

**חסימה חוזרת:**
```json
{
  "startTime": "2025-12-20T00:00:00.000Z",
  "endTime": "2025-12-20T23:59:59.000Z",
  "reason": "weekly break",
  "isRecurring": true,
  "recurringPattern": {
    "frequency": "weekly",
    "endDate": "2025-12-31T00:00:00.000Z"
  }
}
```

---

## Google Calendar

### התחלת OAuth
```http
GET /api/calendar/google/auth
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

### callback OAuth
```http
GET /api/calendar/google/callback?code=...
```

**Response:**
```json
{
  "success": true,
  "message": "Google Calendar מחובר בהצלחה"
}
```

### ניתוק Google Calendar
```http
POST /api/calendar/google/disconnect
```

**Response:**
```json
{
  "success": true,
  "message": "Google Calendar נותק בהצלחה"
}
```

### סנכרון ידני
```http
POST /api/calendar/sync
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "synced": 12,
    "created": 2,
    "updated": 3,
    "deleted": 1,
    "errors": 0
  },
  "lastSyncedAt": "2025-12-15T12:30:00.000Z"
}
```

### סטטוס סנכרון
```http
GET /api/calendar/sync-status
```

**Response:**
```json
{
  "success": true,
  "connected": true,
  "email": "therapist@gmail.com",
  "lastSynced": "2025-12-15T12:30:00.000Z",
  "syncEnabled": true,
  "syncDirection": "two-way"
}
```

---

## הזמנות ציבוריות

### קבלת מידע מטפלת
```http
GET /api/booking/therapist/:id/info
```

**Response:**
```json
{
  "success": true,
  "therapist": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "firstName": "ד\"ר",
    "lastName": "שרה",
    "bio": "מטפלת מומחית...",
    "photo": "https://example.com/photo.jpg",
    "specialties": ["anxiety", "depression"],
    "languages": ["hebrew", "english"],
    "timezone": "Asia/Jerusalem",
    "services": [
      {
        "type": "individual",
        "name": "טיפול פרטי",
        "duration": 60,
        "price": 300
      }
    ]
  }
}
```

### יצירת הזמנה
```http
POST /api/booking/create
```

**Body:**
```json
{
  "therapistId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "serviceType": "individual",
  "startTime": "2025-12-15T10:00:00.000Z",
  "endTime": "2025-12-15T11:00:00.000Z",
  "clientInfo": {
    "name": "יוחנן כהן",
    "email": "yohanan@example.com",
    "phone": "+972501234567",
    "notes": "לקוח חדש"
  },
  "paymentMethod": "stripe",
  "paymentToken": "tok_...",
  "createAccount": false
}
```

**Response:**
```json
{
  "success": true,
  "appointmentId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "confirmationCode": "ABC12345",
  "message": "הזמנה אושרה! אימייל אישור נשלח."
}
```

### ניהול הזמנה
```http
GET /api/booking/:confirmationCode
```

**Response:**
```json
{
  "success": true,
  "appointment": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "confirmationCode": "ABC12345",
    "therapist": {
      "name": "ד\"ר שרה כהן",
      "email": "sarah@example.com",
      "phone": "0501234567"
    },
    "client": {
      "name": "יוחנן כהן",
      "email": "yohanan@example.com"
    },
    "serviceType": "individual",
    "startTime": "2025-12-15T10:00:00.000Z",
    "endTime": "2025-12-15T11:00:00.000Z",
    "duration": 60,
    "status": "confirmed",
    "location": "online",
    "meetingUrl": "https://zoom.us/j/123456789"
  }
}
```

### ביטול הזמנה
```http
POST /api/booking/:confirmationCode/cancel
```

**Body:**
```json
{
  "reason": "שינוי תוכניות"
}
```

---

## תשלומים

### יצירת תשלום
```http
POST /api/payments/create
```

**Body:**
```json
{
  "appointmentId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "amount": 300,
  "currency": "ILS",
  "paymentMethod": "stripe",
  "paymentToken": "tok_..."
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j5",
    "appointmentId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "amount": 300,
    "currency": "ILS",
    "status": "succeeded",
    "paymentMethod": "stripe",
    "transactionId": "pi_...",
    "createdAt": "2025-12-01T08:00:00.000Z"
  }
}
```

### webhook תשלומים
```http
POST /api/payments/webhook
```

**Headers:**
```
Stripe-Signature: t=1234567890,v1=...
```

---

## תגובות שגיאה

כל השגיאות עוקבות אחר הפורמט הבא:

```json
{
  "success": false,
  "error": {
    "message": "תיאור השגיאה",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### קודי שגיאה נפוצים:

- `VALIDATION_ERROR` (400): שגיאת ולידציה
- `UNAUTHORIZED` (401): לא מאומת
- `FORBIDDEN` (403): אין הרשאה
- `NOT_FOUND` (404): משאב לא נמצא
- `CONFLICT` (409): התנגשות
- `RATE_LIMIT_EXCEEDED` (429): הגבלת קצב
- `INTERNAL_ERROR` (500): שגיאת שרת

### דוגמאות שגיאות:

**שגיאת ולידציה:**
```json
{
  "success": false,
  "error": {
    "message": "שדות חובה חסרים",
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "startTime",
      "message": "זמן התחלה הוא שדה חובה"
    }
  }
}
```

**התנגשות זמן:**
```json
{
  "success": false,
  "error": {
    "message": "הזמן הנתון כבר תפוס",
    "code": "CONFLICT",
    "details": {
      "conflictingAppointment": "64f1a2b3c4d5e6f7g8h9i0j6",
      "requestedTime": "2025-12-15T10:00:00.000Z"
    }
  }
}
```

---

## הגבלות קצב

### הגבלות כלליות:
- **API כללי**: 100 בקשות ל-15 דקות
- **הזמנות**: 5 הזמנות לשעה
- **OAuth**: 10 בקשות ל-15 דקות
- **אימיילים**: 50 אימיילים לשעה
- **התחברות**: 5 ניסיונות ל-15 דקות

### Headers של הגבלת קצב:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

### תגובת הגבלת קצב:
```json
{
  "success": false,
  "error": {
    "message": "יותר מדי בקשות מ-IP זה. אנא נסה שוב מאוחר יותר.",
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 900
  }
}
```

---

## דוגמאות שימוש

### JavaScript (Fetch)
```javascript
// יצירת פגישה
const createAppointment = async (appointmentData) => {
  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(appointmentData)
  });
  
  return await response.json();
};

// קבלת פגישות
const getAppointments = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/appointments?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

### cURL
```bash
# יצירת פגישה
curl -X POST https://api.yoursite.com/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "clientId": "64f1a2b3c4d5e6f7g8h9i0j3",
    "serviceType": "individual",
    "startTime": "2025-12-15T10:00:00.000Z",
    "endTime": "2025-12-15T11:00:00.000Z",
    "duration": 60
  }'

# קבלת פגישות
curl -X GET "https://api.yoursite.com/api/appointments?status=confirmed" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Python (requests)
```python
import requests

# יצירת פגישה
def create_appointment(appointment_data, token):
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.post(
        'https://api.yoursite.com/api/appointments',
        json=appointment_data,
        headers=headers
    )
    
    return response.json()

# קבלת פגישות
def get_appointments(token, filters=None):
    headers = {'Authorization': f'Bearer {token}'}
    params = filters or {}
    
    response = requests.get(
        'https://api.yoursite.com/api/appointments',
        params=params,
        headers=headers
    )
    
    return response.json()
```

---

## תמיכה

לשאלות או בעיות:
- **אימייל**: api-support@yoursite.com
- **תיעוד נוסף**: https://docs.yoursite.com
- **GitHub**: https://github.com/your-org/wellness-platform
