# API לניהול Calendly למטפלים

מערכת נתיבי API חדשה לניהול אינטגרציה עם Calendly עבור מטפלים, כולל הגנות תוכנית ו-role.

## תוכן עניינים

1. [נתיבי מטפל](#נתיבי-מטפל)
2. [Webhook](#webhook)
3. [נתיבי Super Admin](#נתיבי-super-admin)
4. [Validation](#validation)
5. [הגנות אבטחה](#הגנות-אבטחה)
6. [דוגמאות שימוש](#דוגמאות-שימוש)

## נתיבי מטפל

### הגנות נדרשות
כל הנתיבים הבאים מוגנים ב:
- **Authentication**: `auth` middleware
- **Role**: `requireTherapistRole` - רק מטפלים
- **Feature Access**: `requireCalendlyAccess()` - בדיקת גישה לפיצ'ר Calendly

---

### GET /api/therapist/calendly/state

קבלת מצב Calendly הנוכחי של המטפל.

**תגובה**:
```json
{
    "success": true,
    "data": {
        "setupStatus": "not_started" | "in_progress" | "completed" | "error" | "connected",
        "connected": boolean,
        "embedConfig": {
            "hideEventTypeDetails": false,
            "hideGdprBanner": true,
            "primaryColor": "#4A90E2",
            "textColor": "#333333",
            "backgroundColor": "#FFFFFF",
            "hideGitcamFooter": true,
            "hideCalendlyFooter": false,
            "height": 630,
            "branding": true,
            "inlineEmbed": true,
            "popupWidget": false
        },
        "schedulingLink": "https://calendly.com/username" | null,
        "username": "username" | null,
        "isEnabled": boolean,
        "isVerified": boolean,
        "lastSyncAt": "2024-01-01T00:00:00.000Z" | null
    }
}
```

---

### POST /api/therapist/calendly/embed-config

עדכון הגדרות `embedConfig` ומעבר ל-ACTIVE אם יש `schedulingLink`.

**Body** (Zod Validation):
```json
{
    "embedConfig": {
        "hideEventTypeDetails": boolean,
        "hideGdprBanner": boolean,
        "primaryColor": "#RRGGBB",
        "textColor": "#RRGGBB", 
        "backgroundColor": "#RRGGBB",
        "hideGitcamFooter": boolean,
        "hideCalendlyFooter": boolean,
        "height": number, // 400-1200
        "branding": boolean,
        "inlineEmbed": boolean,
        "popupWidget": boolean
    },
    "schedulingLink": "https://calendly.com/username",
    "username": "username"
}
```

**תגובה**:
```json
{
    "success": true,
    "data": {
        "setupStatus": "completed",
        "embedConfig": { ... },
        "username": "username",
        "schedulingLink": "https://calendly.com/username",
        "isEnabled": true,
        "connected": true
    },
    "message": "הגדרות Calendly עודכנו בהצלחה"
}
```

**לוגיקה**:
- אם נשלח `schedulingLink` → `setupStatus` = "completed"
- אם יש `username` אבל לא `schedulingLink` → `setupStatus` = "in_progress"

---

### POST /api/therapist/calendly/connect

יצירת URL לחיבור OAuth עם Calendly (Self-service).

**Body**:
```json
{
    "returnUrl": "/dashboard/calendly" // אופציונלי
}
```

**תגובה**:
```json
{
    "success": true,
    "data": {
        "redirectUrl": "https://auth.calendly.com/oauth/authorize?client_id=...&state=...",
        "state": "base64_encoded_data",
        "setupStatus": "in_progress"
    },
    "message": "URL להתחברות ל-Calendly נוצר בהצלחה"
}
```

**מבנה State**:
```json
{
    "therapistId": "64a7b8c9d0e1f2345678901a",
    "returnUrl": "/dashboard/calendly"
}
```

---

### POST /api/therapist/calendly/disconnect

ניתוק חיבור Calendly.

**תגובה**:
```json
{
    "success": true,
    "data": {
        "setupStatus": "not_started",
        "connected": false,
        "message": "חיבור Calendly נותק בהצלחה"
    }
}
```

---

### GET /api/therapist/calendly/event-types

קבלת סוגי אירועים מ-Calendly.

**תגובה**:
```json
{
    "success": true,
    "data": {
        "eventTypes": [...],
        "username": "username",
        "schedulingLink": "https://calendly.com/username"
    }
}
```

---

### PUT /api/therapist/calendly/settings

עדכון הגדרות כלליות.

**Body**:
```json
{
    "isEnabled": boolean,
    "embedCode": "string"
}
```

---

## Webhook

### POST /api/integrations/calendly/webhook

Webhook לקבלת עדכונים מ-Calendly.

**Headers**:
- `calendly-webhook-signature`: חתימת אימות מ-Calendly

**Body**:
```json
{
    "event": "invitee.created",
    "payload": {
        "invitee": {
            "event_uri": "https://calendly.com/username/event",
            "uri": "..."
        }
    }
}
```

**לוגיקה מיוחדת**:
- כאשר מתקבלת הזמנה ראשונה למטפל שאין לו `setupStatus=completed`
- המערכת מעדכנת ל-`setupStatus="connected"` (לא "completed")
- **לא משנה אוטומטית ל-ACTIVE**

---

## נתיבי Super Admin

### POST /api/superadmin/therapists/:id/calendly/enable

הפעלת פיצ'ר Calendly למטפל ספציפי.

**הגנה**: `authorize(['*'])` - Super Admin בלבד

**Body**:
```json
{
    "forceReset": boolean // אופציונלי
}
```

**פעולות**:
1. הפעלת `featureOverrides.calendly = true`
2. אתחול הגדרות Calendly
3. הגדרת `setupStatus = "unconfigured"` אם אין OAuth

**תגובה**:
```json
{
    "success": true,
    "data": {
        "therapistId": "64a7b8c9d0e1f2345678901a",
        "calendlyEnabled": true,
        "setupStatus": "unconfigured",
        "hasOAuth": false,
        "featureOverride": true,
        "calendlyConfig": { ... }
    },
    "message": "פיצ'ר Calendly הופעל בהצלחה למטפל"
}
```

---

### POST /api/superadmin/therapists/:id/calendly/disable

ביטול הפעלת פיצ'ר Calendly.

**Body**:
```json
{
    "keepConfig": boolean // שמירת הגדרות ללא מחיקה
}
```

---

### GET /api/superadmin/therapists/:id/calendly/status

קבלת מצב Calendly של מטפל (לשימוש מנהל).

**תגובה**:
```json
{
    "success": true,
    "data": {
        "therapistId": "64a7b8c9d0e1f2345678901a",
        "hasFeatureAccess": true,
        "featureOverride": true,
        "currentPlan": "free",
        "calendly": {
            "setupStatus": "completed",
            "isEnabled": true,
            "embedCode": "[CONFIGURED]"
        }
    }
}
```

---

## Validation

### Zod Schemas

```javascript
const embedConfigSchema = z.object({
    hideEventTypeDetails: z.boolean().optional(),
    hideGdprBanner: z.boolean().optional(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    hideGitcamFooter: z.boolean().optional(),
    hideCalendlyFooter: z.boolean().optional(),
    height: z.number().min(400).max(1200).optional(),
    branding: z.boolean().optional(),
    inlineEmbed: z.boolean().optional(),
    popupWidget: z.boolean().optional()
});

const updateEmbedConfigSchema = z.object({
    embedConfig: embedConfigSchema.optional(),
    schedulingLink: z.string().url().optional(),
    username: z.string().min(3).max(50).regex(/^[a-z0-9-_]+$/).optional()
});
```

---

## הגנות אבטחה

### Middleware Stack
```javascript
auth,                    // אימות JWT
requireTherapistRole,    // בדיקת role='therapist'
requireCalendlyAccess(), // בדיקת גישה לפיצ'ר
validateZod(schema)      // ולידציה של נתונים
```

### בדיקת הרשאות
```javascript
// בדיקה אם המטפל רשאי לגשת ל-Calendly
function hasCalendlyAccess() {
    // עקיפה ספציפית
    if (this.featureOverrides?.calendly === true) return true;
    
    // תוכנית Premium+
    if (['premium', 'extended', 'enterprise'].includes(this.subscription.plan)) {
        return true;
    }
    
    // פיצ'ר נכלל בתוכנית
    if (this.subscription.features?.includes('calendly')) return true;
    
    return false;
}
```

### תגובות שגיאה
- **401**: לא מחובר
- **402**: צריך שדרוג תוכנית (משתמש Free)
- **403**: אין הרשאה (לא מטפל / אין גישה לפיצ'ר)
- **400**: נתונים לא תקינים (Zod validation)

---

## דוגמאות שימוש

### Client-Side: קבלת מצב Calendly
```javascript
const response = await fetch('/api/therapist/calendly/state', {
    headers: { Authorization: `Bearer ${token}` }
});
const { data } = await response.json();

if (data.setupStatus === 'not_started') {
    // הצג כפתור "התחבר ל-Calendly"
} else if (data.connected) {
    // הצג ממשק ניהול
}
```

### Client-Side: עדכון הגדרות
```javascript
const updateConfig = async (config) => {
    const response = await fetch('/api/therapist/calendly/embed-config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            embedConfig: {
                primaryColor: '#FF5722',
                height: 700
            },
            schedulingLink: 'https://calendly.com/my-username'
        })
    });
    
    if (response.status === 402) {
        // הצג הודעת שדרוג
        const error = await response.json();
        showUpgradeModal(error.upgradeInfo);
    }
};
```

### Super Admin: הפעלת פיצ'ר
```javascript
const enableCalendlyForTherapist = async (therapistId) => {
    const response = await fetch(`/api/superadmin/therapists/${therapistId}/calendly/enable`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ forceReset: true })
    });
    
    const result = await response.json();
    console.log('Calendly enabled:', result.data);
};
```

---

## משתני סביבה נדרשים

```bash
# הצפנה
ENCRYPTION_KEY=64-character-hex-key

# Calendly OAuth
CALENDLY_CLIENT_ID=your_client_id
CALENDLY_REDIRECT_URI=https://your-domain.com/auth/calendly/callback
```

---

## לוגים ומעקב

### לוגי מערכת
- הפעלת/ביטול פיצ'רים על ידי Super Admin
- התחברות/ניתוק OAuth
- קבלת webhooks מ-Calendly
- שגיאות הרשאות

### מדדי ביצועים
- מספר מטפלים עם Calendly פעיל
- שיעור השלמת הגדרה
- שימוש בפיצ'רים מתקדמים

זהו המדריך המלא לשימוש במערכת Calendly החדשה!
