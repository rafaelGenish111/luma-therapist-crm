# מערכת תוכניות והרשאות - Plan Features System

## סקירה כללית

מערכת מתקדמת לניהול הרשאות לפיצ'רים בהתאם לתוכנית המנוי של המטפל, כולל אפשרויות עקיפה (overrides) והצפנת נתונים רגישים.

## מרכיבי המערכת

### 1. מודל Therapist מורחב

הורחב מודל המטפל עם השדות הבאים:

#### תוכניות מנוי
```javascript
subscription: {
    plan: ['free', 'basic', 'premium', 'extended', 'enterprise'],
    features: [..., 'calendly'] // הוסף 'calendly' לרשימת הפיצ'רים
}
```

#### עקיפות פיצ'רים
```javascript
featureOverrides: {
    calendly: Boolean,
    unlimitedClients: Boolean,
    customDomain: Boolean,
    advancedAnalytics: Boolean,
    paymentProcessing: Boolean,
    smsNotifications: Boolean,
    emailMarketing: Boolean,
    prioritySupport: Boolean
}
```

#### הגדרות Calendly מורחבות
```javascript
website.calendly: {
    setupStatus: ['not_started', 'in_progress', 'completed', 'error'],
    embedConfig: {
        hideEventTypeDetails: Boolean,
        hideGdprBanner: Boolean,
        primaryColor: String,
        textColor: String,
        backgroundColor: String,
        hideGitcamFooter: Boolean,
        hideCalendlyFooter: Boolean,
        height: Number (400-1200),
        branding: Boolean,
        inlineEmbed: Boolean,
        popupWidget: Boolean
    }
}
```

### 2. מתודות חדשות במודל

```javascript
// בדיקת גישה לפיצ'ר
therapist.hasFeature('calendly') // Boolean

// בדיקת גישה ספציפית ל-Calendly
therapist.hasCalendlyAccess() // Boolean

// קבלת מגבלות התוכנית
therapist.getPlanLimitations() // Object
```

### 3. כלי הצפנה (Encryption Utility)

הממוקם ב: `src/utils/encryption.js`

#### תכונות:
- **אלגוריתם**: AES-256-GCM (בטוח ומהיר)
- **אימות**: Authentication tags למניעת שינוי
- **מפתח**: 32 bytes (64 תווים hex) מהמשתנה `ENCRYPTION_KEY`

#### שימוש:
```javascript
const { encrypt, decrypt, generateToken } = require('../utils/encryption');

// הצפנת נתונים
const encrypted = encrypt('sensitive data');
const encrypted2 = encrypt({ user: 'data', token: 'secret' });

// פענוח
const decrypted = decrypt(encrypted);

// יצירת טוקנים
const token = generateToken(32); // 32 bytes random token
```

### 4. מידלוואר הרשאות (Plan Features Middleware)

הממוקם ב: `src/middleware/planFeatures.js`

#### פונקציות עיקריות:

##### `requirePlanOrFeature(featureKey, options)`
בדיקת הרשאה לפיצ'ר או רשימת פיצ'רים:

```javascript
// פיצ'ר יחיד
requirePlanOrFeature('calendly')

// מספר פיצ'רים
requirePlanOrFeature(['calendly', 'custom_domain'])

// עם אפשרויות
requirePlanOrFeature('calendly', {
    allowFreeUsers: false,
    customErrorMessage: 'הודעה מותאמת',
    includeUpgradeInfo: true,
    redirectUrl: '/upgrade'
})
```

##### מידלוואר מתמחה:
```javascript
requireCalendlyAccess()        // בדיקת גישה ל-Calendly
requireCustomDomainAccess()    // בדיקת גישה לדומיין מותאם
requireAdvancedAnalytics()     // בדיקת גישה לאנליטיקה
checkClientLimit()             // בדיקת מגבלת לקוחות
```

### 5. תגובות שגיאה

#### קוד 402 (Payment Required)
מוחזר כאשר משתמש בתוכנית Free זקוק לשדרוג:
```json
{
    "error": "הפיצ'ר calendly אינו זמין בתוכנית הנוכחית",
    "code": "FEATURE_NOT_AVAILABLE",
    "currentPlan": "free",
    "missingFeatures": ["calendly"],
    "upgradeInfo": {
        "availablePlans": [...],
        "benefits": [...],
        "contactSupport": {...}
    }
}
```

#### קוד 403 (Forbidden)
מוחזר כאשר גם עם שדרוג אין גישה לפיצ'ר.

## הגדרת הסביבה

### 1. הוספת מפתח הצפנה
הוסף לקובץ `.env`:
```bash
# יצירת מפתח (הרץ פעם אחת):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# הוסף לקובץ .env:
ENCRYPTION_KEY=your-64-character-hex-encryption-key-here
```

### 2. עדכון מסד הנתונים
הפעל מיגרציה או עדכן רשומות קיימות עם השדות החדשים.

## דוגמאות שימוש

### בדיקת גישה ל-Calendly
```javascript
router.get('/calendly/settings', 
    requireCalendlyAccess(),
    async (req, res) => {
        const therapist = req.therapist;
        res.json({
            calendlySettings: therapist.website.calendly,
            hasAccess: true
        });
    }
);
```

### הצפנת טוקן רגיש
```javascript
router.post('/save-api-token',
    requireCalendlyAccess(),
    async (req, res) => {
        const { apiToken } = req.body;
        const therapist = req.therapist;
        
        // הצפנת הטוקן
        const encryptedToken = encrypt(apiToken);
        
        // שמירה במסד נתונים
        therapist.encryptedData = { apiToken: encryptedToken };
        await therapist.save();
        
        res.json({ success: true });
    }
);
```

### בדיקת מגבלות תוכנית
```javascript
router.post('/add-client',
    checkClientLimit(),
    async (req, res) => {
        const therapist = req.therapist;
        
        // הוספת לקוח...
        therapist.stats.totalClients += 1;
        await therapist.save();
        
        res.json({ success: true });
    }
);
```

## לוגיקת הרשאות

### דרגי תוכניות
1. **Free**: 5 לקוחות, 10 פגישות
2. **Basic**: 25 לקוחות, 100 פגישות, בונה אתרים
3. **Premium/Extended**: ללא הגבלה + Calendly + דומיין מותאם
4. **Enterprise**: כל הפיצ'רים + תמיכה מועדפת

### עקיפות (Overrides)
- עקיפה ספציפית גוברת על מגבלות התוכנית
- שימושי למתן גישה ללא שדרוג מלא
- ניתן לעקוף פיצ'רים בודדים או הגבלות

### מידע לשדרוג (Upsell)
- מידע על תוכניות זמינות
- תיאור יתרונות הפיצ'רים
- פרטי התקשרות לתמיכה
- המלצה על התוכנית המתאימה

## אבטחה

### הצפנת נתונים
- **אלגוריתם**: AES-256-GCM (תקן תעשייה)
- **מפתח**: 256-bit מהסביבה
- **אימות**: Authentication tags
- **IV**: אקראי לכל הצפנה

### בדיקות אבטחה
- ולידציה של קלט
- בדיקת הרשאות ברמת מסד הנתונים
- הגנה מפני CSRF ו-XSS
- Rate limiting על נתיבי API

## ביצועים

### קשינג
- שמירת זמנית של מצב תוכניות
- מטמון של חישובי הרשאות
- עדכון async של סטטיסטיקות

### אופטימיזציה
- שאילתות מיוחדות למסד הנתונים
- פעולות batch לעדכוני מנוי
- טעינה lazy של נתונים מוצפנים

## בדיקות

ראה `src/examples/planFeatureUsage.js` לדוגמאות מלאות של:
- שימוש במידלוואר
- הצפנת נתונים
- טיפול בשגיאות
- תגובות upsell

## תחזוקה

### מעקב ושידרוגים
- מעקב שימוש בפיצ'רים
- דוחות על דרישות שדרוג
- ניתוח מגמות השימוש
- עדכון תוכניות לפי ביקוש

### יומני מערכת
- רישום ניסיונות גישה
- מעקב שגיאות הרשאות
- ביקורת פעולות הצפנה
- ניטור ביצועים
