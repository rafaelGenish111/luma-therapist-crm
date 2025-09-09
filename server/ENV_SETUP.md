# הגדרת משתני סביבה - Wellness Platform

## 📋 הוראות התקנה

### 1. יצירת קובץ .env
```bash
cp env.example .env
```

### 2. הגדרת משתנים בסיסיים

#### 🔧 הגדרות שרת
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
```

#### 🗄️ מסד נתונים MongoDB
```env
# Development
MONGODB_URI=mongodb://localhost:27017/wellness-platform

# Production (MongoDB Atlas)
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/wellness-platform?retryWrites=true&w=majority
```

#### 🔐 JWT Authentication
```env
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-token-secret-key
JWT_REFRESH_EXPIRE=30d
```

### 3. הגדרת שירותי ענן

#### ☁️ Cloudinary (תמונות וקבצים)
1. הירשם ל-[Cloudinary](https://cloudinary.com/)
2. קבל את הפרטים מ-Dashboard
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=wellness-platform
```

#### 💳 Stripe (תשלומים)
1. הירשם ל-[Stripe](https://stripe.com/)
2. קבל את המפתחות מ-Dashboard
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### 🇮🇱 Paybox (שער תשלומים ישראלי)
1. הירשם ל-[Paybox](https://www.paybox.co.il/)
2. קבל פרטי סוחר
```env
PAYBOX_MERCHANT_ID=your_merchant_id
PAYBOX_MERCHANT_KEY=your_merchant_key
PAYBOX_API_URL=https://api.paybox.co.il
```

### 4. הגדרת שירותי אימייל

#### 📧 Gmail SMTP
1. הפעל אימות דו-שלבי ב-Gmail
2. צור סיסמת אפליקציה
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@wellness-platform.com
```

#### 📧 SendGrid (אלטרנטיבה)
```env
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@wellness-platform.com
```

### 5. הגדרת SMS

#### 📱 Twilio
1. הירשם ל-[Twilio](https://www.twilio.com/)
2. קבל Account SID ו-Auth Token
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+972501234567
```

### 6. הגדרת Redis (אופציונלי)

#### 🔄 Redis Cache
```env
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 7. הגדרת Firebase (התראות Push)

#### 🔥 Firebase Cloud Messaging
1. צור פרויקט ב-[Firebase Console](https://console.firebase.google.com/)
2. הורד קובץ Service Account
```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
```

### 8. הגדרת שירותים חיצוניים

#### 🗺️ Google Maps
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### 📅 Google Calendar
```env
GOOGLE_CALENDAR_CLIENT_ID=your_google_calendar_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_calendar_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=https://your-domain.com/auth/google/callback
```

## 🔒 אבטחה

### יצירת מפתחות בטוחים
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### הגדרות אבטחה מומלצות
```env
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3000,https://your-domain.com
```

## 🚀 Production Checklist

### לפני העלאה לפרודקשן:
- [ ] שנה `NODE_ENV=production`
- [ ] הגדר `MONGODB_URI_PROD`
- [ ] שנה מפתחות JWT
- [ ] הגדר CORS_ORIGIN לכתובת האמיתית
- [ ] הפעל `COMPRESSION_ENABLED=true`
- [ ] הפעל `HELMET_ENABLED=true`
- [ ] הגדר `TRUST_PROXY=true`

### הגדרות נוספות לפרודקשן:
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-domain.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wellness-platform
JWT_SECRET=production-super-secret-key
CORS_ORIGIN=https://your-domain.com
```

## 🛠️ פתרון בעיות

### MongoDB Connection Error
```bash
# בדוק שהמונגו רץ
mongod --version
brew services start mongodb-community
```

### Cloudinary Upload Error
```bash
# בדוק פרטי Cloudinary
curl -X GET "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/resources/image" \
  -H "Authorization: Basic $(echo -n 'YOUR_API_KEY:YOUR_API_SECRET' | base64)"
```

### Stripe Webhook Error
```bash
# בדוק webhook endpoint
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

## 📞 תמיכה

לשאלות נוספות:
- 📧 Email: support@wellness-platform.com
- 📖 Documentation: https://docs.wellness-platform.com
- 🐛 Issues: https://github.com/your-repo/issues 