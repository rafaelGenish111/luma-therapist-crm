# מערכת Authentication - Wellness Platform

## 📋 סקירה כללית

מערכת ה-Authentication כוללת:
- **הרשמה** למטפלות ולקוחות
- **התחברות** עם JWT tokens
- **אימות כתובת אימייל**
- **איפוס סיסמה**
- **Refresh tokens**
- **Rate limiting** ואבטחה מתקדמת

## 🚀 התקנה והגדרה

### 1. התקנת תלויות
```bash
cd server
npm install
```

### 2. הגדרת משתני סביבה
```bash
cp env.example .env
```

עדכן את הקובץ `.env` עם הפרטים שלך (ראה `ENV_SETUP.md`).

### 3. הפעלת השרת
```bash
npm run dev
```

## 🔐 API Endpoints

### הרשמה
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "firstName": "ישראל",
  "lastName": "כהן",
  "phone": "+972501234567",
  "userType": "therapist", // או "client"
  "dateOfBirth": "1990-01-01",
  "gender": "male", // או "female", "other"
  
  // שדות ספציפיים למטפלות
  "specialization": ["massage", "physiotherapy"],
  "licenseNumber": "12345",
  "experience": 5,
  
  // שדות ספציפיים ללקוחות
  "medicalHistory": ["diabetes"],
  "emergencyContact": {
    "name": "שרה כהן",
    "phone": "+972501234568",
    "relationship": "אחות"
  }
}
```

### התחברות
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

### איפוס סיסמה
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "NewStrongPass123!"
}
```

### אימות אימייל
```http
GET /api/auth/verify-email/:token
```

### רענון טוקן
```http
POST /api/auth/refresh
```

### התנתקות
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
```

### קבלת פרטי משתמש
```http
GET /api/auth/me
Authorization: Bearer <access-token>
```

## 🛡️ Middleware אבטחה

### Middleware זמינים

```javascript
const { 
  auth, 
  requireEmailVerification, 
  requireTherapist, 
  requireClient, 
  requireApprovedTherapist, 
  requireCompleteProfile, 
  optionalAuth 
} = require('../middleware/auth');
```

### שימוש ב-Middleware

```javascript
// דורש התחברות
router.get('/protected', auth, (req, res) => {
  // req.user זמין כאן
});

// דורש אימות אימייל
router.get('/verified-only', auth, requireEmailVerification, (req, res) => {
  // רק משתמשים מאומתים
});

// דורש מטפל מאושר
router.get('/therapist-only', auth, requireApprovedTherapist, (req, res) => {
  // רק מטפלות מאושרות
});

// אופציונלי - לא נכשל אם אין טוקן
router.get('/public-with-user', optionalAuth, (req, res) => {
  // req.user זמין אם יש טוקן תקין
});
```

## 📧 שירות אימייל

### תבניות זמינות

1. **emailVerification** - אימות כתובת אימייל
2. **passwordReset** - איפוס סיסמה
3. **welcome** - הודעת ברוכים הבאים
4. **appointmentConfirmation** - אישור פגישה
5. **appointmentReminder** - תזכורת פגישה

### שימוש

```javascript
const sendEmail = require('../utils/emailService');

await sendEmail({
  email: 'user@example.com',
  subject: 'אימות כתובת אימייל',
  template: 'emailVerification',
  data: {
    name: 'ישראל',
    verificationUrl: 'https://example.com/verify?token=123'
  }
});
```

### תבניות מותאמות אישית

צור תיקייה `src/templates/emails/` והוסף קבצי `.hbs`:

```handlebars
<!-- src/templates/emails/customTemplate.hbs -->
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <title>{{title}}</title>
</head>
<body>
    <h1>שלום {{name}}</h1>
    <p>{{message}}</p>
</body>
</html>
```

## 🔒 אבטחה

### Rate Limiting

- **התחברות**: 5 ניסיונות ב-15 דקות
- **הרשמה**: 3 ניסיונות בשעה
- **איפוס סיסמה**: 3 ניסיונות בשעה

### הגנות נוספות

- **Account Lockout**: חסימת חשבון לאחר 5 ניסיונות כושלים
- **Password History**: מניעת שימוש בסיסמאות קודמות
- **Session Management**: ניהול sessions בטוח
- **CSRF Protection**: הגנה מפני CSRF attacks
- **XSS Protection**: הגנה מפני XSS attacks

### Validation

```javascript
// דוגמה ל-validation
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('כתובת אימייל לא תקינה'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('סיסמה חייבת להכיל אות גדולה, אות קטנה, מספר ותו מיוחד')
];
```

## 📱 שימוש ב-Client

### התחברות

```javascript
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // שמור access token
    localStorage.setItem('accessToken', data.data.accessToken);
    // refresh token נשמר אוטומטית ב-cookies
  }
  
  return data;
};
```

### בקשות מאובטחות

```javascript
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  // אם הטוקן פג תוקף, נסה לרענן
  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // נסה שוב עם הטוקן החדש
      return makeAuthenticatedRequest(url, options);
    }
  }
  
  return response;
};
```

### רענון טוקן

```javascript
const refreshToken = async () => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include' // שולח cookies
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('accessToken', data.data.accessToken);
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
};
```

## 🧪 בדיקות

### הרצת בדיקות

```bash
npm test
npm run test:watch
```

### דוגמאות לבדיקות

```javascript
describe('Auth Routes', () => {
  test('should register new therapist', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'ישראל',
        lastName: 'כהן',
        phone: '+972501234567',
        userType: 'therapist'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
  
  test('should login user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeDefined();
  });
});
```

## 🚨 פתרון בעיות

### שגיאות נפוצות

#### "JWT_SECRET not defined"
```bash
# הוסף ל-.env
JWT_SECRET=your-super-secret-jwt-key-here
```

#### "Email service not initialized"
```bash
# הוסף פרטי אימייל ל-.env
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### "MongoDB connection failed"
```bash
# בדוק שהמונגו רץ
mongod --version
brew services start mongodb-community
```

#### "Rate limit exceeded"
```bash
# המתן 15 דקות או שנה את ההגדרות ב-auth.js
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10 // הגדל את המספר
});
```

### Debug Mode

```bash
# הפעל debug mode
DEBUG=* npm run dev
```

## 📚 משאבים נוספים

- [Express.js Documentation](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Express Validator](https://express-validator.github.io/)
- [Nodemailer](https://nodemailer.com/)

## 🤝 תמיכה

לשאלות ותמיכה:
- 📧 Email: support@wellness-platform.com
- 📖 Documentation: https://docs.wellness-platform.com
- 🐛 Issues: https://github.com/your-repo/issues 