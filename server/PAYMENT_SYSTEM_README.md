# מערכת התשלומים - Luma CRM

מערכת תשלומים מתקדמת המאפשרת למטפלים ליצור לינקי תשלום מאובטחים ולשלוח אותם ללקוחותיהם.

## תכונות עיקריות

- 🔗 **לינקי תשלום מאובטחים** - יצירת לינקי תשלום עם תוקף של 7 ימים
- 💳 **תמיכה במספר ספקי סליקה** - Tranzila, CardCom, Mock (לבדיקות)
- 🛡️ **אבטחה מתקדמת** - Rate limiting, אימות חתימה, לוגים מסודרים
- 📱 **דף תשלום רספונסיבי** - עיצוב מודרני ונוח למכשירים ניידים
- 📊 **ניהול תשלומים** - מעקב אחר סטטוס, סטטיסטיקות ודוחות
- 🔔 **התראות** - שליחה בווטסאפ ומייל (אופציונלי)

## התקנה והגדרה

### 1. הגדרת משתני סביבה

העתק את הקובץ `env.example.payments` ל-`.env` ועדכן את הערכים:

```bash
cp env.example.payments .env
```

### 2. משתנים נדרשים

```env
# ספק התשלום (tranzila, cardcom, mock)
PAYMENT_PROVIDER=mock

# כתובת האתר (נדרש לcallbacks)
APP_BASE_URL=https://your-domain.com

# הגדרות Tranzila
TRANZILA_TERMINAL_ID=your_terminal_id
TRANZILA_SECRET=your_secret_key
```

### 3. התקנת תלויות

```bash
npm install
```

### 4. הפעלת השרת

```bash
npm run dev
```

## שימוש במערכת

### יצירת לינק תשלום

1. **מהדשבורד המטפל:**
   - עבור לכרטיס הלקוח
   - לחץ על "שלח לינק תשלום"
   - הזן סכום ותיאור
   - בחר פגישה (אופציונלי)
   - לחץ "צור לינק תשלום"

2. **שליחה ללקוח:**
   - העתק את הלינק שנוצר
   - שלח בווטסאפ או מייל
   - או העתק ידנית

### דף התשלום ללקוח

הלקוח יקבל לינק מהצורה:
```
https://your-domain.com/pay/{paymentLinkId}
```

הדף מציג:
- שם המטפל ולוגו
- סכום התשלום
- פרטי הפגישה (אם קיימת)
- כפתור "המשך לתשלום מאובטח"

## API Endpoints

### יצירת לינק תשלום
```http
POST /api/payment-links/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "therapistId": "therapist_id",
  "clientId": "client_id",
  "amount": 150.00,
  "description": "תשלום עבור טיפול",
  "sessionId": "appointment_id" // אופציונלי
}
```

### קבלת פרטי תשלום
```http
GET /api/payment-links/{paymentLinkId}
```

### התחלת תשלום
```http
POST /api/payment-links/start
Content-Type: application/json

{
  "paymentLinkId": "uuid"
}
```

### Callback מספק הסליקה
```http
POST /api/payment-links/callback/tranzila
POST /api/payment-links/callback/mock
```

## בדיקות ובדיקות

### בדיקת בריאות המערכת
```bash
curl http://localhost:5000/api/payment-health/health
```

### יצירת תשלום לדמו
```bash
curl -X POST http://localhost:5000/api/payment-health/seed
```

### הרצת בדיקות מלאות
```bash
npm run test:payments
```

## ספקי סליקה נתמכים

### Tranzila
- תמיכה בכל שיטות התשלום (אשראי, Bit, Google Pay, Apple Pay)
- אימות חתימה HMAC
- Callback מאובטח

### CardCom
- תמיכה מלאה בתשלומים
- אימות חתימה
- Callback מאובטח

### Mock (לבדיקות)
- סימולציה של תשלומים
- 80% הצלחה, 20% כישלון
- מתאים לבדיקות ופיתוח

## אבטחה

### Rate Limiting
- יצירת לינקי תשלום: 20 בקשות ב-15 דקות
- Callbacks: 50 בקשות ב-5 דקות

### אימות חתימה
- HMAC SHA-256 עבור Tranzila
- אימות IP עבור Callbacks

### לוגים
- כל פעולת תשלום מתועדת
- מידע רגיש מוסווה
- לוגים נשמרים בקבצים

## ניהול שגיאות

### שגיאות נפוצות
- `404` - לינק תשלום לא נמצא
- `410` - לינק תשלום פג תוקף
- `400` - תשלום כבר הושלם או נכשל
- `429` - יותר מדי בקשות

### מעקב שגיאות
```bash
# בדיקת לוגים
tail -f logs/error.log

# בדיקת סטטיסטיקות
curl http://localhost:5000/api/payment-health/stats
```

## תחזוקה

### ניקוי תשלומים פגי תוקף
```bash
curl -X POST http://localhost:5000/api/payment-health/cleanup
```

### עדכון סטטוס אוטומטי
המערכת מעדכנת אוטומטית תשלומים פגי תוקף ל-"expired".

## פיתוח נוסף

### הוספת ספק סליקה חדש
1. צור קובץ חדש ב-`src/payments/providers/`
2. הרחב את `PaymentProvider`
3. הוסף ל-`PaymentProviderFactory`
4. עדכן את הקונפיגורציה

### הוספת התראות
1. הגדר משתני סביבה למייל/ווטסאפ
2. הוסף שירות התראות
3. קרא לשירות ב-callback

## תמיכה

לבעיות או שאלות:
- בדוק את הלוגים ב-`logs/`
- הרץ בדיקות בריאות: `/api/payment-health/health`
- צור issue ב-GitHub

## רישיון

MIT License
