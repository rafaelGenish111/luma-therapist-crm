# מדריך שירותי Calendly

מדריך מלא לשירותים החדשים לניהול אינטגרציה עם Calendly במערכת.

## תוכן עניינים

1. [שירות calendlyWebhooks](#שירות-calendlywebhooks)
2. [שירות calendlyService](#שירות-calendlyservice)
3. [נתיבי OAuth](#נתיבי-oauth)
4. [הגדרות סביבה](#הגדרות-סביבה)
5. [דוגמאות שימוש](#דוגמאות-שימוש)

## שירות calendlyWebhooks

**מיקום**: `src/services/calendlyWebhooks.js`

### פונקציות עיקריות

#### `ensureSubscriptionsForTherapist(therapistId)`
וידוא קיום webhook subscriptions עבור מטפל.

```javascript
const { ensureSubscriptionsForTherapist } = require('../services/calendlyWebhooks');

const result = await ensureSubscriptionsForTherapist('64a7b8c9d0e1f2345678901a');
// {
//   success: true,
//   newSubscriptions: 1,
//   existingSubscriptions: 0,
//   totalSubscriptions: 1,
//   subscriptions: [...]
// }
```

**מה הפונקציה עושה**:
- בודקת אם יש טוקן Calendly מוצפן למטפל
- קוראת ל-API של Calendly לקבלת משתמש נוכחי
- בודקת אילו webhook subscriptions כבר קיימים
- יוצרת subscriptions חדשים לאירועים: `invitee.created`, `invitee.canceled`, `invitee_no_show.created`
- מעדכנת את נתוני המטפל במסד הנתונים

#### `removeSubscriptionsForTherapist(therapistId, keepInactive)`
הסרת webhook subscriptions עבור מטפל.

```javascript
const result = await removeSubscriptionsForTherapist('64a7b8c9d0e1f2345678901a', false);
// {
//   success: true,
//   removedSubscriptions: 2,
//   message: "הוסרו 2 webhook subscriptions"
// }
```

**פרמטרים**:
- `therapistId` - מזהה המטפל
- `keepInactive` - האם להשאיר subscriptions לא פעילים (ברירת מחדל: false)

### פונקציות נוספות

- `getSubscriptionStatus(therapistId)` - בדיקת סטטוס subscriptions
- `resyncSubscriptionsForTherapist(therapistId)` - סנכרון מחדש
- `cleanupSubscriptionsForTherapist(therapistId)` - ניקוי כפולים

---

## שירות calendlyService

**מיקום**: `src/services/calendlyService.js`

### פונקציה עיקרית: `getConnectUrlForTherapist`

```javascript
const { getConnectUrlForTherapist } = require('../services/calendlyService');

const result = await getConnectUrlForTherapist('64a7b8c9d0e1f2345678901a', {
    returnUrl: '/dashboard/calendly',
    adminInitiated: true,
    adminEmail: 'admin@company.com',
    scope: 'default'
});

// {
//   success: true,
//   data: {
//     connectUrl: "https://auth.calendly.com/oauth/authorize?client_id=...",
//     state: "encrypted_state_data",
//     therapistId: "64a7b8c9d0e1f2345678901a",
//     setupStatus: "in_progress",
//     expiresAt: "2024-01-02T00:00:00.000Z",
//     metadata: { ... }
//   }
// }
```

**אפשרויות**:
- `returnUrl` - עמוד חזרה אחרי החיבור (ברירת מחדל: '/dashboard/calendly')
- `adminInitiated` - האם החיבור יזום על ידי מנהל (ברירת מחדל: false)
- `adminEmail` - מייל המנהל שיזם (רק אם adminInitiated=true)
- `scope` - היקף הרשאות (ברירת מחדל: 'default')
- `customState` - נתונים נוספים ל-state

**שימושים**:
1. **מטפל עצמאי**: קבלת URL לחיבור עצמי ל-Calendly
2. **Super Admin**: יצירת URL לשליחה במייל למטפל

### פונקציות נוספות

#### `handleOAuthCallback(code, state)`
טיפול בחזרה מ-OAuth של Calendly.

```javascript
const result = await calendlyService.handleOAuthCallback(authCode, encryptedState);
```

#### `disconnectTherapist(therapistId, options)`
ניתוק חיבור Calendly.

```javascript
const result = await calendlyService.disconnectTherapist('therapistId', {
    keepConfig: true,
    adminInitiated: false
});
```

#### `getConnectionStatus(therapistId)`
קבלת סטטוס חיבור מפורט.

#### `refreshAccessToken(therapistId)`
רענון טוקן גישה.

#### `getConnectedTherapists()`
רשימת כל המטפלים המחוברים.

---

## נתיבי OAuth

**מיקום**: `src/routes/calendlyOAuth.js`

### GET /api/auth/calendly/callback
נתיב החזרה מ-OAuth של Calendly.

**פרמטרים**:
- `code` - קוד הרשאה מ-Calendly
- `state` - state מוצפן
- `error` - שגיאה (אם יש)

**פעולה**:
1. בדיקת שגיאות
2. וולידציה של קוד ו-state
3. טיפול בקוד באמצעות `calendlyService.handleOAuthCallback`
4. הפניה חזרה ללקוח עם תוצאות

### GET /api/auth/calendly/status/:therapistId
בדיקת סטטוס חיבור (לשימוש בדף המתנה).

### POST /api/auth/calendly/refresh/:therapistId
רענון טוקן גישה (לשימוש פנימי).

---

## הגדרות סביבה

הוסף למשתני הסביבה (`.env`):

```bash
# Calendly Integration
CALENDLY_CLIENT_ID=your_calendly_client_id
CALENDLY_CLIENT_SECRET=your_calendly_client_secret
CALENDLY_REDIRECT_URI=https://your-domain.com/api/auth/calendly/callback
CALENDLY_WEBHOOK_ENDPOINT=https://your-domain.com/api/integrations/calendly/webhook
SERVER_URL=https://your-domain.com

# Encryption (required)
ENCRYPTION_KEY=your-64-character-hex-encryption-key
```

**יצירת מפתח הצפנה**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## דוגמאות שימוש

### 1. מטפל מבקש חיבור עצמי

```javascript
// נתיב: POST /api/therapist/calendly/connect
const connectResult = await calendlyService.getConnectUrlForTherapist(
    therapist._id.toString(),
    {
        returnUrl: '/dashboard/calendly',
        adminInitiated: false
    }
);

if (connectResult.success) {
    // הפנה למשתמש ל-URL
    res.redirect(connectResult.data.connectUrl);
}
```

### 2. Super Admin יוצר URL למטפל

```javascript
// נתיב: POST /api/superadmin/therapists/:id/calendly/connect-url
const connectResult = await calendlyService.getConnectUrlForTherapist(id, {
    returnUrl: '/dashboard/calendly',
    adminInitiated: true,
    adminEmail: req.user.email,
    scope: 'default'
});

// שלח את connectResult.data.connectUrl במייל למטפל
```

### 3. הפעלת פיצ'ר Calendly למטפל

```javascript
// נתיב: POST /api/superadmin/therapists/:id/calendly/enable
// הפעלת עקיפה
therapist.featureOverrides.calendly = true;

// יצירת webhook subscriptions
const webhookResult = await calendlyWebhooksService.ensureSubscriptionsForTherapist(id);
```

### 4. טיפול ב-webhook מ-Calendly

```javascript
// נתיב: POST /api/integrations/calendly/webhook
if (event === 'invitee.created' && payload?.invitee) {
    const username = extractUsernameFromUri(payload.invitee.event_uri);
    const therapist = await Therapist.findOne({
        'website.calendly.username': username
    });

    if (therapist && therapist.website.calendly.setupStatus !== 'completed') {
        therapist.website.calendly.setupStatus = 'connected';
        await therapist.save();
    }
}
```

### 5. בדיקת סטטוס החיבור

```javascript
const statusResult = await calendlyService.getConnectionStatus(therapistId);

if (statusResult.success) {
    const { setupStatus, isConnected, username, webhooks } = statusResult.data;
    
    console.log(`Therapist ${therapistId}:`, {
        setupStatus,    // 'not_started', 'in_progress', 'completed', 'connected', 'error'
        isConnected,    // true/false
        username,       // Calendly username או null
        webhooks: {
            hasSubscriptions: webhooks.hasSubscriptions,
            subscriptions: webhooks.subscriptions
        }
    });
}
```

---

## זרימת העבודה המלאה

### להפעלת Calendly למטפל חדש:

1. **Super Admin מפעיל פיצ'ר**:
   ```javascript
   POST /api/superadmin/therapists/:id/calendly/enable
   // → מגדיר featureOverrides.calendly = true
   // → מאתחל הגדרות Calendly
   ```

2. **יצירת URL לחיבור**:
   ```javascript
   POST /api/superadmin/therapists/:id/calendly/connect-url
   // → מחזיר URL לשליחה במייל
   ```

3. **מטפל לוחץ על הקישור**:
   ```
   → מועבר ל-Calendly OAuth
   → מאשר הרשאות
   → חוזר ל-/api/auth/calendly/callback
   ```

4. **טיפול בחזרה**:
   ```javascript
   // calendlyService.handleOAuthCallback()
   // → שומר טוקנים מוצפנים
   // → יוצר webhook subscriptions
   // → מעדכן setupStatus = 'completed'
   ```

5. **קבלת webhook מ-Calendly**:
   ```javascript
   POST /api/integrations/calendly/webhook
   // → מעקב אחר הזמנות
   // → עדכון סטטיסטיקות
   ```

### למטפל קיים שרוצה להתחבר עצמאית:

1. **מטפל מבקש חיבור**:
   ```javascript
   POST /api/therapist/calendly/connect
   // → בודק הרשאות (requireCalendlyAccess)
   // → יוצר URL לחיבור
   ```

2. **המשך הזרימה זהה** כמו מעלה (שלבים 3-5)

---

## אבטחה והצפנה

### טוקנים מוצפנים
כל הטוקנים של Calendly נשמרים מוצפנים במסד הנתונים:

```javascript
// שמירה
therapist.encryptedData.calendlyAccessToken = encrypt(access_token);
therapist.encryptedData.calendlyRefreshToken = encrypt(refresh_token);

// קריאה
const accessToken = decrypt(therapist.encryptedData.calendlyAccessToken);
```

### State מוצפן
המידע ב-state של OAuth מוצפן ומכיל:

```javascript
{
    therapistId: "64a7b8c9d0e1f2345678901a",
    returnUrl: "/dashboard/calendly",
    adminInitiated: true,
    adminEmail: "admin@company.com",
    timestamp: 1704067200000,
    nonce: "random_hex_string"
}
```

### Webhook Security
- בדיקת חתימת Calendly (TODO: להשלים)
- רישום כל הפעילויות
- תמיכה בטוקנים legacy

---

## לוגים ומעקב

### יומני מערכת
- יצירת URLs לחיבור
- הצלחות/כשלונות OAuth
- יצירת/הסרת webhook subscriptions
- קבלת webhooks מ-Calendly
- רענון טוקנים

### מדדי ביצועים
- מספר מטפלים מחוברים
- שיעור הצלחת חיבורים
- מספר הזמנות דרך Calendly
- שגיאות ותקלות

הכל מוכן לשימוש! 🚀
