# פלטפורמת המטפלות - Wellness Platform

פלטפורמה מלאה למטפלות עם CRM ואתרים אישיים.

## 🚀 תכונות עיקריות

- **CRM מלא** - ניהול לקוחות, פגישות ותשלומים
- **אתרים אישיים** - בונה אתרים מותאם אישית למטפלות
- **לוח זמנים חכם** - ניהול פגישות עם תזכורות
- **תשלומים** - אינטגרציה עם Stripe
- **ניהול תוכן** - עריכת תוכן האתר האישי
- **ניתוחים** - דוחות וסטטיסטיקות

## 🛠️ טכנולוגיות

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Stripe Payments
- Nodemailer

### Frontend
- React 18 + JavaScript
- Material-UI
- React Query
- React Router
- Vite

### Shared
- TypeScript Types
- Validation Schemas
- Constants

## 📁 מבנה הפרויקט

```
wellness-platform/
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── config/        # הגדרות מסד נתונים
│   │   ├── controllers/   # לוגיקה עסקית
│   │   ├── middleware/    # Middleware
│   │   ├── models/        # מודלים MongoDB
│   │   ├── routes/        # נתיבי API
│   │   └── utils/         # פונקציות עזר
│   └── package.json
├── client/                 # Frontend React (JavaScript)
│   ├── src/
│   │   ├── components/    # קומפוננטים
│   │   ├── pages/         # דפים
│   │   ├── hooks/         # Custom Hooks
│   │   ├── services/      # קריאות API
│   │   ├── store/         # ניהול state
│   │   └── utils/         # פונקציות עזר
│   └── package.json
├── shared/                 # קוד משותף (TypeScript)
│   ├── src/
│   │   ├── types/         # טיפוסים TypeScript
│   │   └── utils/         # פונקציות עזר
│   └── package.json
└── package.json
```

## 🚀 התקנה והפעלה

### דרישות מקדימות
- Node.js 18+
- MongoDB
- npm או yarn

### התקנה

1. **שכפול הפרויקט**
```bash
git clone <repository-url>
cd wellness-platform
```

2. **התקנת תלויות**
```bash
npm run install:all
```

3. **הגדרת משתני סביבה**
```bash
# יצירת קובץ .env בשרת
cp server/env.example server/.env

# עריכת הקובץ עם הפרטים שלך
MONGODB_URI=mongodb://localhost:27017/wellness-platform
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=your-stripe-secret

# הגדרת Google Calendar OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/google/callback
FRONTEND_URL=http://localhost:3000
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

### הגדרת Google Calendar OAuth

כדי להפעיל את תכונת הסנכרון עם Google Calendar, יש להגדיר OAuth credentials:

1. **לך ל-Google Cloud Console**
   - בקר ב: https://console.cloud.google.com/

2. **צור פרויקט חדש**
   - לחץ על "New Project"
   - תן שם לפרויקט (לדוגמה: "luma-therapist-crm")

3. **אפשר את Google Calendar API**
   - לך ל-"APIs & Services" > "Library"
   - חפש "Google Calendar API"
   - לחץ על "Enable"

4. **צור OAuth 2.0 credentials**
   - לך ל-"APIs & Services" > "Credentials"
   - לחץ על "Create Credentials" > "OAuth client ID"
   - בחר "Web application"
   - הוסף Authorized redirect URIs:
     - `http://localhost:5000/api/calendar/google/callback` (פיתוח)
     - `https://your-domain.com/api/calendar/google/callback` (פרודקשן)

5. **העתק את ה-credentials**
   - העתק את Client ID ו-Client Secret
   - הוסף אותם לקובץ `.env` שלך

6. **הגדר את משתני הסביבה**
```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/google/callback
FRONTEND_URL=http://localhost:3000
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

4. **הפעלת הפרויקט**
```bash
# הפעלה בפיתוח (שני השרתים יחד)
npm run dev

# או בנפרד:
npm run dev:server  # שרת על פורט 5000
npm run dev:client  # קליינט על פורט 3000
```

## 📚 API Endpoints

### אימות
- `POST /api/auth/register` - הרשמה
- `POST /api/auth/login` - התחברות
- `POST /api/auth/logout` - התנתקות

### מטפלות
- `GET /api/therapists/profile` - פרופיל מטפלת
- `PUT /api/therapists/profile` - עדכון פרופיל
- `GET /api/therapists/:id` - פרטי מטפלת

### לקוחות
- `GET /api/clients` - רשימת לקוחות
- `POST /api/clients` - יצירת לקוח
- `PUT /api/clients/:id` - עדכון לקוח
- `DELETE /api/clients/:id` - מחיקת לקוח

### פגישות
- `GET /api/appointments` - רשימת פגישות
- `POST /api/appointments` - יצירת פגישה
- `PUT /api/appointments/:id` - עדכון פגישה
- `DELETE /api/appointments/:id` - ביטול פגישה

### אתרים
- `GET /api/websites/:therapistId` - פרטי אתר
- `PUT /api/websites/:therapistId` - עדכון אתר
- `POST /api/websites/:therapistId/sections` - הוספת סקציה

## 🧪 בדיקות

```bash
# בדיקות שרת
npm run test:server

# בדיקות קליינט
npm run test:client

# כל הבדיקות
npm test
```

## 📦 בנייה לפרודקשן

```bash
# בניית כל הפרויקט
npm run build

# בניית שרת בלבד
npm run build:server

# בניית קליינט בלבד
npm run build:client
```

## 🔧 פיתוח

### הוספת מודל חדש
1. צור קובץ מודל ב-`server/src/models/`
2. הוסף טיפוסים ב-`shared/src/types/`
3. צור Controller ו-Routes
4. הוסף בדיקות

### הוספת דף חדש
1. צור קומפוננט ב-`client/src/pages/`
2. הוסף נתיב ב-`client/src/App.jsx`
3. הוסף תפריט ב-`client/src/layouts/DashboardLayout.jsx`

## 📝 רישיון

MIT License

## 🤝 תרומה

1. Fork את הפרויקט
2. צור branch חדש (`git checkout -b feature/amazing-feature`)
3. Commit את השינויים (`git commit -m 'Add amazing feature'`)
4. Push ל-branch (`git push origin feature/amazing-feature`)
5. פתח Pull Request

## 📞 תמיכה

לשאלות ותמיכה, צור קשר: support@wellness-platform.com 