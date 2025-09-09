# שכבת תשלומים - Billing Layer

שכבת אבסטרקציה לספקי תשלומים שמאפשרת החלפה קלה בין ספקים שונים.

## 🎯 מטרה

- **אבסטרקציה אחידה** - ממשק זהה לכל ספקי התשלומים
- **גמישות** - החלפה קלה בין ספקים ללא שינוי קוד
- **סימולציה** - תמיכה במצב פיתוח ובדיקות
- **הרחבה קלה** - הוספת ספקים חדשים בקלות

## 📁 מבנה הקבצים

```
services/billing/
├── BillingProvider.js          # ממשק אחיד לספקים
├── SimulatedBillingProvider.js # ספק סימולציה
├── StripeBillingProvider.js    # ספק Stripe (עתידי)
├── index.js                    # Factory לספקים
└── README.md                   # תיעוד זה
```

## 🚀 שימוש בסיסי

### יצירת תשלום

```javascript
const billingService = require('./billingService');

const paymentData = {
    clientId: 'client123',
    amount: 15000, // 150 ש"ח
    currency: 'ILS',
    method: 'simulated',
    description: 'תשלום פגישה'
};

const result = await billingService.createPayment(paymentData, 'therapist123');
```

### יצירת חשבונית

```javascript
const invoiceResult = await billingService.createInvoice('payment123');
```

### בדיקת סטטוס

```javascript
const status = await billingService.checkPaymentStatus('payment123');
```

## ⚙️ הגדרת ספק

### משתני סביבה

```env
# ספק התשלומים (ברירת מחדל: simulated)
BILLING_PROVIDER=simulated

# הגדרות סימולציה
SIMULATED_FAILURE_RATE=0.05    # 5% כשל
SIMULATED_DELAY_MIN=100        # עיכוב מינימלי (ms)
SIMULATED_DELAY_MAX=500        # עיכוב מקסימלי (ms)

# הגדרות Stripe (עתידי)
STRIPE_SECRET_KEY=sk_test_...
```

### Factory

```javascript
const { getBillingProvider, getProviderInfo } = require('./billing');

// קבלת הספק הנוכחי
const provider = getBillingProvider();

// קבלת פרטי הספק
const info = getProviderInfo();
console.log(info.isSimulated); // true/false
```

## 🔧 ספקי תשלומים

### 1. SimulatedBillingProvider

ספק סימולציה לפיתוח ובדיקות.

**תכונות:**
- ✅ תשלומים מדומים
- ✅ חשבוניות מדומות
- ✅ ביטולים מדומים
- ✅ עיכובים מדומים
- ✅ כשלים מדומים

**הגדרות:**
```javascript
const provider = new SimulatedBillingProvider();

// הגדרת אחוז כשל
provider.setFailureRate(0.1); // 10% כשל

// הגדרת טווח עיכובים
provider.setDelayRange(50, 200); // 50-200ms
```

### 2. StripeBillingProvider

ספק Stripe (מימוש עתידי).

**תכונות:**
- ✅ עיבוד כרטיסי אשראי
- ✅ ביטולים אוטומטיים
- ✅ יצירת חשבוניות
- ✅ תמיכה ב-Webhooks
- ✅ תמיכה במטבעות מרובים

**הגדרה:**
```javascript
const provider = new StripeBillingProvider();
provider.configure('sk_test_...');
```

## 📊 ממשק אחיד

### CreateChargeInput

```javascript
const input = new CreateChargeInput(
    'client123',           // clientId
    15000,                 // amount (באגורות)
    {
        appointmentId: 'apt123',
        currency: 'ILS',
        metadata: {
            description: 'תשלום פגישה',
            customField: 'value'
        }
    }
);
```

### ChargeResult

```javascript
// הצלחה
const success = ChargeResult.success('txn_123', {
    provider: 'stripe',
    chargeId: 'ch_123'
});

// כשל
const failure = ChargeResult.failure('CARD_DECLINED', {
    provider: 'stripe',
    error: 'Card was declined'
});
```

### InvoiceResult

```javascript
// הצלחה
const success = InvoiceResult.success('inv_123', 'https://...', {
    provider: 'stripe',
    invoiceId: 'in_123'
});

// כשל
const failure = InvoiceResult.failure('INVOICE_FAILED', {
    provider: 'stripe',
    error: 'Failed to create invoice'
});
```

## 🔄 הוספת ספק חדש

### 1. יצירת קלאס ספק

```javascript
const { BillingProvider, CreateChargeInput, ChargeResult, InvoiceResult } = require('./BillingProvider');

class MyBillingProvider extends BillingProvider {
    async createCharge(input) {
        // מימוש יצירת תשלום
        return ChargeResult.success('transaction_id');
    }

    async createInvoice(paymentId) {
        // מימוש יצירת חשבונית
        return InvoiceResult.success('invoice_id', 'invoice_url');
    }

    getProviderInfo() {
        return {
            name: 'MyBillingProvider',
            isSimulated: false,
            supportsRefunds: true,
            supportsInvoices: true
        };
    }
}
```

### 2. הוספה ל-Factory

```javascript
// ב-index.js
const MyBillingProvider = require('./MyBillingProvider');

case 'myprovider':
    this.provider = new MyBillingProvider();
    break;
```

### 3. הגדרת משתנה סביבה

```env
BILLING_PROVIDER=myprovider
```

## 🧪 בדיקות

### בדיקת ספק סימולציה

```javascript
const { getBillingProvider } = require('./billing');

describe('SimulatedBillingProvider', () => {
    let provider;

    beforeEach(() => {
        provider = getBillingProvider();
    });

    test('should create charge successfully', async () => {
        const input = new CreateChargeInput('client123', 1000);
        const result = await provider.createCharge(input);
        
        expect(result.ok).toBe(true);
        expect(result.transactionId).toMatch(/^sim_/);
    });
});
```

### בדיקת כשלים

```javascript
test('should handle failures', async () => {
    const provider = new SimulatedBillingProvider();
    provider.setFailureRate(1.0); // 100% כשל

    const input = new CreateChargeInput('client123', 1000);
    const result = await provider.createCharge(input);
    
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
});
```

## 📈 סטטיסטיקות

### קבלת סטטיסטיקות תשלומים

```javascript
const billingService = require('./billingService');

const stats = await billingService.getPaymentStats('therapist123', {
    dateFrom: '2024-01-01',
    dateTo: '2024-12-31'
});

console.log(stats);
// {
//   total: 100,
//   totalAmount: 1500000,
//   paid: 95,
//   paidAmount: 1425000,
//   pending: 3,
//   failed: 2,
//   refunded: 0
// }
```

## 🔒 אבטחה

### בדיקות הרשאות

```javascript
// בדיקה שהמטפלת יכולה לגשת לתשלום
const payment = await Payment.findById(paymentId);
if (payment.createdBy.toString() !== therapistId) {
    throw new Error('אין הרשאה לגשת לתשלום זה');
}
```

### הצפנת נתונים רגישים

```javascript
// שמירת מפתחות API מוצפנים
const encryptedKey = await encrypt(process.env.STRIPE_SECRET_KEY);
```

## 🚨 שגיאות נפוצות

### BILLING_PROVIDER_NOT_FOUND

```javascript
// פתרון: הגדרת משתנה סביבה
BILLING_PROVIDER=simulated
```

### PROVIDER_NOT_CONFIGURED

```javascript
// פתרון: הגדרת מפתחות API
STRIPE_SECRET_KEY=sk_test_...
```

### INSUFFICIENT_PERMISSIONS

```javascript
// פתרון: בדיקת הרשאות מטפלת
if (payment.createdBy !== therapistId) {
    throw new Error('אין הרשאה');
}
```

## 📞 תמיכה

לשאלות ותמיכה:
- 📧 support@wellness-platform.com
- 📱 טלפון: 03-1234567
- 💬 צ'אט: /support


