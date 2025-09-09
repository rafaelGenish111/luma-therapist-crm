# מדריך לקוח Calendly - Client API Guide

מדריך מלא לשימוש בקבצי API ורכיבים של Calendly בצד הלקוח.

## תוכן עניינים

1. [API Client](#api-client)
2. [Types & Constants](#types--constants)
3. [React Hook](#react-hook)
4. [React Component](#react-component)
5. [דוגמאות שימוש](#דוגמאות-שימוש)

## API Client

**מיקום**: `src/api/calendlyClient.js`

### פונקציות API עיקריות

#### `getTherapistCalendlyState()`
קבלת מצב Calendly הנוכחי של המטפל.

```javascript
import { getTherapistCalendlyState } from '../api/calendlyClient';

try {
  const response = await getTherapistCalendlyState();
  const { setupStatus, connected, embedConfig, schedulingLink } = response.data;
  
  console.log('Setup Status:', setupStatus);
  console.log('Connected:', connected);
  console.log('Scheduling URL:', schedulingLink);
} catch (error) {
  console.error('Error:', error.message);
}
```

**תגובה**:
```javascript
{
  success: true,
  data: {
    setupStatus: "completed",
    connected: true,
    embedConfig: { ... },
    schedulingLink: "https://calendly.com/username",
    username: "username",
    isEnabled: true,
    isVerified: true,
    lastSyncAt: "2024-01-01T00:00:00.000Z"
  }
}
```

#### `getTherapistCalendlyConnectUrl(options)`
קבלת URL לחיבור OAuth.

```javascript
import { getTherapistCalendlyConnectUrl } from '../api/calendlyClient';

try {
  const response = await getTherapistCalendlyConnectUrl({
    returnUrl: '/dashboard/calendly?connected=true'
  });
  
  // הפניה ל-URL חיבור
  window.location.href = response.data.redirectUrl;
} catch (error) {
  if (error.message.includes('FEATURE_NOT_AVAILABLE')) {
    // הצג הודעת שדרוג
    showUpgradeModal();
  }
}
```

#### `saveTherapistCalendlyEmbedConfig(payload)`
שמירת הגדרות embedConfig.

```javascript
import { saveTherapistCalendlyEmbedConfig } from '../api/calendlyClient';

const config = {
  embedConfig: {
    primaryColor: '#FF5722',
    height: 700,
    hideGdprBanner: true
  },
  schedulingLink: 'https://calendly.com/my-username'
};

try {
  const response = await saveTherapistCalendlyEmbedConfig(config);
  console.log('Config saved:', response.data);
} catch (error) {
  console.error('Save failed:', error.message);
}
```

#### פונקציות נוספות

- `disconnectTherapistCalendly(options)` - ניתוק חיבור
- `getTherapistCalendlyEventTypes()` - קבלת סוגי אירועים  
- `updateTherapistCalendlySettings(settings)` - עדכון הגדרות כלליות

---

## Types & Constants

**מיקום**: `src/types/calendly.js`

### CalendlySetupStatus

```javascript
import { CalendlySetupStatus } from '../types/calendly';

export const CalendlySetupStatus = {
  NOT_STARTED: 'not_started',    // לא הוגדר
  UNCONFIGURED: 'unconfigured',  // לא מוגדר  
  IN_PROGRESS: 'in_progress',    // בתהליך
  CONNECTED: 'connected',        // מחובר
  COMPLETED: 'completed',        // פעיל
  ERROR: 'error',               // שגיאה
  ACTIVE: 'completed'           // alias
};
```

### CalendlyHelpers

```javascript
import { CalendlyHelpers } from '../types/calendly';

// בדיקות מצב
CalendlyHelpers.isActive(setupStatus);      // האם פעיל
CalendlyHelpers.hasError(setupStatus);      // האם יש שגיאה  
CalendlyHelpers.isInProgress(setupStatus);  // האם בתהליך
CalendlyHelpers.notStarted(setupStatus);    // האם לא התחיל

// עזרים
CalendlyHelpers.getNextStep(setupStatus);   // השלב הבא
CalendlyHelpers.formatSchedulingUrl(username); // פורמט URL
CalendlyHelpers.validateEmbedConfig(config);   // ולידציה
```

### Default Configuration

```javascript
import { defaultEmbedConfig } from '../types/calendly';

export const defaultEmbedConfig = {
  hideEventTypeDetails: false,
  hideGdprBanner: true,
  primaryColor: '#4A90E2',
  textColor: '#333333',
  backgroundColor: '#FFFFFF',
  hideGitcamFooter: true,
  hideCalendlyFooter: false,
  height: 630,
  branding: true,
  inlineEmbed: true,
  popupWidget: false
};
```

### Labels & Colors

```javascript
import { setupStatusLabels, setupStatusColors } from '../types/calendly';

const status = CalendlySetupStatus.COMPLETED;
const label = setupStatusLabels[status]; // "פעיל"
const color = setupStatusColors[status]; // "green"
```

---

## React Hook

**מיקום**: `src/hooks/useCalendly.js`

### שימוש בסיסי

```javascript
import useCalendly from '../hooks/useCalendly';

function CalendlyPage() {
  const {
    // Data
    calendlyState,
    setupStatus,
    isConnected,
    isActive,
    schedulingUrl,
    
    // Loading states  
    loading,
    connecting,
    saving,
    
    // Actions
    connect,
    saveEmbedConfig,
    disconnect,
    refresh,
    
    // Error
    error,
    clearError
  } = useCalendly({
    autoLoad: true,
    onSuccess: (action, data) => {
      console.log(`${action} successful:`, data);
    },
    onError: (action, error) => {
      console.error(`${action} failed:`, error);
    }
  });

  if (loading) return <div>טוען...</div>;
  
  return (
    <div>
      <h1>מצב Calendly: {setupStatus}</h1>
      
      {!isConnected && (
        <button onClick={() => connect()}>
          התחבר ל-Calendly
        </button>
      )}
      
      {isActive && (
        <p>קישור לפגישות: {schedulingUrl}</p>
      )}
    </div>
  );
}
```

### Hook Options

```javascript
const options = {
  autoLoad: true,        // טעינה אוטומטית במאונט
  onSuccess: (action, data) => {},  // callback הצלחה
  onError: (action, error) => {}    // callback שגיאה
};
```

### Hook Return Values

```javascript
{
  // Data
  calendlyState: Object,     // נתוני Calendly מלאים
  setupStatus: String,       // מצב הגדרה נוכחי
  isConnected: Boolean,      // האם מחובר
  isActive: Boolean,         // האם פעיל
  hasError: Boolean,         // האם יש שגיאה
  schedulingUrl: String,     // URL לקביעת פגישות
  
  // Loading States
  loading: Boolean,          // טוען מצב
  connecting: Boolean,       // מתחבר
  saving: Boolean,           // שומר
  disconnecting: Boolean,    // מנתק
  
  // Error
  error: String,            // הודעת שגיאה
  
  // Actions
  loadState: Function,      // טעינת מצב
  connect: Function,        // התחברות
  saveEmbedConfig: Function, // שמירת הגדרות
  disconnect: Function,     // ניתוק
  refresh: Function,        // רענון
  clearError: Function,     // ניקוי שגיאה
  
  // Computed
  isReady: Boolean,         // מוכן לשימוש
  canConnect: Boolean,      // יכול להתחבר
  canDisconnect: Boolean    // יכול לנתק
}
```

---

## React Component

**מיקום**: `src/components/CalendlySetup.jsx`

### שימוש בסיסי

```javascript
import CalendlySetup from '../components/CalendlySetup';

function CalendlyPage() {
  return (
    <div>
      <h1>הגדרות Calendly</h1>
      <CalendlySetup 
        onStatusChange={(action, data) => {
          console.log('Status changed:', action, data);
        }}
      />
    </div>
  );
}
```

### Component Props

```javascript
<CalendlySetup 
  onStatusChange={(action, data) => {
    // action: 'load' | 'connect' | 'save' | 'disconnect'
    // data: response data from API
  }}
/>
```

### Features הרכיב

- ✅ **ממשק גרפי מלא** לניהול Calendly
- ✅ **מצבי טעינה** עם אנימציות
- ✅ **טיפול בשגיאות** עם הודעות ברורות
- ✅ **הגדרות מתקדמות** (צבעים, גובה, אפשרויות)
- ✅ **חיבור/ניתוק** עם אישורים
- ✅ **תצוגת סטטוס** עם צבעים ותוויות

---

## דוגמאות שימוש

### 1. דף הגדרות Calendly פשוט

```javascript
import React from 'react';
import useCalendly from '../hooks/useCalendly';
import { CalendlySetupStatus } from '../types/calendly';

function CalendlySettingsPage() {
  const { 
    setupStatus, 
    isActive, 
    schedulingUrl, 
    connect, 
    loading 
  } = useCalendly();

  if (loading) {
    return <div className="p-4">טוען הגדרות Calendly...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">הגדרות Calendly</h1>
      
      {setupStatus === CalendlySetupStatus.NOT_STARTED && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">התחבר ל-Calendly</h2>
          <p className="text-gray-600 mb-4">
            אפשר ללקוחות לקבוע פגישות ישירות דרך האתר שלך
          </p>
          <button 
            onClick={connect}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            התחבר עכשיו
          </button>
        </div>
      )}

      {isActive && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Calendly פעיל</h2>
          <p className="text-gray-600">
            קישור לקביעת פגישות: 
            <a href={schedulingUrl} className="text-blue-600 underline mr-1">
              {schedulingUrl}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
```

### 2. סטטוס Calendly בדף דשבורד

```javascript
import React from 'react';
import useCalendly from '../hooks/useCalendly';
import { setupStatusLabels, setupStatusColors } from '../types/calendly';

function CalendlyStatusCard() {
  const { setupStatus, isActive, schedulingUrl, error } = useCalendly();

  const statusColor = setupStatusColors[setupStatus] || 'gray';
  const statusLabel = setupStatusLabels[setupStatus] || 'לא ידוע';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Calendly</h3>
        <span className={`px-2 py-1 text-xs rounded bg-${statusColor}-100 text-${statusColor}-800`}>
          {statusLabel}
        </span>
      </div>

      {error && (
        <div className="mt-2 text-red-600 text-sm">{error}</div>
      )}

      {isActive && schedulingUrl && (
        <div className="mt-3">
          <a 
            href={schedulingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            צפה בקישור לפגישות ←
          </a>
        </div>
      )}
    </div>
  );
}
```

### 3. הטמעת ווידג'ט Calendly

```javascript
import React, { useEffect, useRef } from 'react';
import useCalendly from '../hooks/useCalendly';

function CalendlyEmbed() {
  const { calendlyState, isActive } = useCalendly();
  const containerRef = useRef(null);

  useEffect(() => {
    if (isActive && calendlyState?.embedConfig && containerRef.current) {
      const { embedConfig, username } = calendlyState;
      
      // ניקוי תוכן קיים
      containerRef.current.innerHTML = '';
      
      // יצירת קוד הטמעה
      const embedCode = `
        <div class="calendly-inline-widget" 
             data-url="https://calendly.com/${username}"
             style="min-width:320px;height:${embedConfig.height}px;">
        </div>
        <script type="text/javascript" 
                src="https://assets.calendly.com/assets/external/widget.js" 
                async>
        </script>
      `;
      
      containerRef.current.innerHTML = embedCode;
    }
  }, [isActive, calendlyState]);

  if (!isActive) {
    return (
      <div className="p-8 text-center text-gray-500">
        Calendly לא מוגדר או לא פעיל
      </div>
    );
  }

  return <div ref={containerRef} className="calendly-embed" />;
}
```

### 4. טיפול בשגיאות מתקדם

```javascript
import React from 'react';
import useCalendly from '../hooks/useCalendly';
import { CalendlyErrors, errorMessages } from '../types/calendly';

function CalendlyWithErrorHandling() {
  const { 
    setupStatus, 
    error, 
    connect, 
    clearError 
  } = useCalendly({
    onError: (action, error) => {
      // טיפול מתקדם בשגיאות
      if (error.message.includes('FEATURE_NOT_AVAILABLE')) {
        // הפנה לעמוד שדרוג
        window.location.href = '/upgrade?feature=calendly';
      }
    }
  });

  const getErrorMessage = (errorText) => {
    // מיפוי שגיאות לעברית
    for (const [errorCode, message] of Object.entries(errorMessages)) {
      if (errorText.includes(errorCode)) {
        return message;
      }
    }
    return errorText;
  };

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex justify-between">
            <p className="text-red-700">{getErrorMessage(error)}</p>
            <button 
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
          
          {error.includes('FEATURE_NOT_AVAILABLE') && (
            <button 
              onClick={() => window.location.href = '/upgrade'}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              שדרג עכשיו
            </button>
          )}
        </div>
      )}
      
      {/* שאר הרכיב */}
    </div>
  );
}
```

---

## Import Patterns

### אימפורטים מומלצים

```javascript
// API Functions
import { 
  getTherapistCalendlyState,
  getTherapistCalendlyConnectUrl,
  saveTherapistCalendlyEmbedConfig
} from '../api/calendlyClient';

// Types & Constants
import { 
  CalendlySetupStatus,
  CalendlyHelpers,
  defaultEmbedConfig,
  setupStatusLabels
} from '../types/calendly';

// Hook
import useCalendly from '../hooks/useCalendly';

// Component
import CalendlySetup from '../components/CalendlySetup';

// All in one (from index)
import { 
  getTherapistCalendlyState,
  CalendlySetupStatus,
  CalendlyHelpers
} from '../api';
```

---

## Best Practices

### 1. Error Handling
```javascript
// תמיד טפל בשגיאות
try {
  await saveTherapistCalendlyEmbedConfig(config);
} catch (error) {
  if (error.message.includes('FEATURE_NOT_AVAILABLE')) {
    showUpgradeModal();
  } else {
    showErrorToast(error.message);
  }
}
```

### 2. Loading States
```javascript
// הצג מצבי טעינה
const { loading, saving, connecting } = useCalendly();

return (
  <button disabled={saving}>
    {saving ? 'שומר...' : 'שמור'}
  </button>
);
```

### 3. Status Checking
```javascript
// השתמש ב-helpers לבדיקת מצב
import { CalendlyHelpers } from '../types/calendly';

if (CalendlyHelpers.isActive(setupStatus)) {
  // הצג ממשק פעיל
} else if (CalendlyHelpers.notStarted(setupStatus)) {
  // הצג כפתור התחברות
}
```

### 4. Configuration Validation
```javascript
// ולד הגדרות לפני שמירה
const validation = CalendlyHelpers.validateEmbedConfig(config);
if (!validation.isValid) {
  alert(validation.errors.join('\n'));
  return;
}
```

כל הקבצים מוכנים לשימוש! 🚀
