# Calendar Components

קומפוננטות מתקדמות לניהול יומן ופגישות במערכת המטפלות.

## קומפוננטות

### 1. TherapistCalendar
קומפוננטת יומן מתקדמת עם תמיכה ב-react-big-calendar.

**תכונות:**
- תצוגות: יום, שבוע, חודש
- Drag & Drop לשינוי פגישות
- צבעים שונים לפי סטטוס פגישה
- סינון מתקדם לפי סטטוס, סוג שירות, לקוח
- חיפוש פגישות
- אינדיקציה ויזואלית לסנכרון Google Calendar
- תצוגת אירועים חיצוניים מ-Google

**Props:**
```javascript
{
  appointments: Array,           // רשימת פגישות
  onSelectSlot: Function,        // טיפול בבחירת slot ריק
  onSelectEvent: Function,       // טיפול בבחירת אירוע
  onEventDrop: Function,         // טיפול בגרירת אירוע
  loading: Boolean,              // מצב טעינה
  view: String,                  // תצוגה נוכחית
  onViewChange: Function,        // שינוי תצוגה
  date: Date,                    // תאריך נוכחי
  onNavigate: Function,          // ניווט בין תאריכים
  clients: Array,                // רשימת לקוחות
  onRefresh: Function,           // רענון נתונים
  onSyncWithGoogle: Function,    // סנכרון עם Google
  syncStatus: String             // סטטוס סנכרון
}
```

### 2. AppointmentModal
Modal ליצירה, עריכה וצפייה בפגישות.

**תכונות:**
- תמיכה במצבים: create, edit, view
- שדות מלאים: לקוח, סוג שירות, תאריך, משך, מיקום
- פגישות חוזרות עם תצוגה מקדימה
- וולידציה מלאה עם react-hook-form
- בדיקת התנגשויות
- פעולות: שמירה, מחיקה, שכפול, שליחת תזכורת

**Props:**
```javascript
{
  open: Boolean,                 // האם המודל פתוח
  onClose: Function,             // סגירת המודל
  mode: String,                  // 'create' | 'edit' | 'view'
  appointment: Object,           // נתוני הפגישה
  clients: Array,                // רשימת לקוחות
  onSave: Function,              // שמירת פגישה
  onDelete: Function,            // מחיקת פגישה
  onDuplicate: Function,         // שכפול פגישה
  onSendReminder: Function,      // שליחת תזכורת
  loading: Boolean,              // מצב טעינה
  conflicts: Array,             // רשימת התנגשויות
  availability: Object          // נתוני זמינות
}
```

### 3. AvailabilitySettings
ממשק להגדרת זמינות מטפלת.

**תכונות:**
- עורך לוח זמנים שבועי
- הגדרת זמן חיץ בין פגישות
- ניהול זמנים חסומים
- תצוגה מקדימה של הזמינות
- הגדרות מתקדמות: אזור זמן, הודעה מינימלית

**Props:**
```javascript
{
  availability: Object,          // נתוני זמינות נוכחיים
  blockedTimes: Array,          // רשימת זמנים חסומים
  onSave: Function,              // שמירת הגדרות זמינות
  onSaveBlockedTime: Function,   // שמירת זמן חסום
  onDeleteBlockedTime: Function, // מחיקת זמן חסום
  loading: Boolean               // מצב טעינה
}
```

### 4. MiniCalendar
Widget קטן ליומן עם תצוגת חודש קומפקטית.

**תכונות:**
- תצוגת חודש קומפקטית
- סימון ימים עם פגישות
- ניווט בין חודשים
- סטטיסטיקות חודשיות
- קליק על יום לניווט

**Props:**
```javascript
{
  appointments: Array,          // רשימת פגישות
  currentDate: Date,            // תאריך נוכחי
  onDateSelect: Function,       // בחירת תאריך
  onNavigate: Function,         // ניווט בין תאריכים
  maxWidth: Number,             // רוחב מקסימלי (ברירת מחדל: 300)
  showEventCount: Boolean,      // הצגת מספר פגישות
  highlightToday: Boolean,      // הדגשת היום הנוכחי
  showNavigation: Boolean       // הצגת כפתורי ניווט
}
```

### 5. AppointmentList
תצוגת רשימה מתקדמת של פגישות.

**תכונות:**
- טבלה responsive עם עמודות מלאות
- מיון לפי כל עמודה
- סינון מתקדם
- בחירה מרובה
- פעולות מהירות
- פעולות על מספר פגישות
- ייצוא ל-CSV

**Props:**
```javascript
{
  appointments: Array,           // רשימת פגישות
  clients: Array,               // רשימת לקוחות
  loading: Boolean,             // מצב טעינה
  onEdit: Function,             // עריכת פגישה
  onDelete: Function,           // מחיקת פגישה
  onView: Function,             // צפייה בפגישה
  onCancel: Function,           // ביטול פגישה
  onComplete: Function,         // סימון כהושלם
  onSendReminder: Function,     // שליחת תזכורת
  onCopyMeetingLink: Function,  // העתקת קישור פגישה
  onBulkAction: Function,       // פעולות על מספר פגישות
  onExport: Function,           // ייצוא ל-CSV
  onRefresh: Function,         // רענון נתונים
  page: Number,                 // עמוד נוכחי
  rowsPerPage: Number,          // שורות בעמוד
  totalCount: Number,           // סה"כ פגישות
  onPageChange: Function,       // שינוי עמוד
  onRowsPerPageChange: Function // שינוי מספר שורות
}
```

## שימוש

```javascript
import { 
  TherapistCalendar, 
  AppointmentModal, 
  AvailabilitySettings,
  MiniCalendar,
  AppointmentList 
} from './components/Calendar';

// שימוש בקומפוננטת יומן ראשית
<TherapistCalendar
  appointments={appointments}
  onSelectSlot={handleSelectSlot}
  onSelectEvent={handleSelectEvent}
  onEventDrop={handleEventDrop}
  loading={loading}
  view={view}
  onViewChange={setView}
  date={date}
  onNavigate={setDate}
  clients={clients}
  onRefresh={refreshAppointments}
  onSyncWithGoogle={syncWithGoogle}
  syncStatus={syncStatus}
/>

// שימוש במודל פגישה
<AppointmentModal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  mode="create"
  clients={clients}
  onSave={handleSaveAppointment}
  loading={saving}
/>
```

## דרישות

- React 18+
- Material-UI 5+
- react-big-calendar
- react-hook-form
- @mui/x-date-pickers
- moment.js
- date-fns

## הערות טכניות

- כל הקומפוננטות תומכות בעברית ו-RTL
- משתמשות ב-moment.js לחישובי תאריכים
- כוללות טיפול בשגיאות ו-loading states
- תומכות בגישה נגישה (accessibility)
- עיצוב responsive לכל הגדלי מסך
