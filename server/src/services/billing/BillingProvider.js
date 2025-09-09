/**
 * ממשק אחיד לספקי תשלומים
 * מאפשר החלפה קלה בין ספקים שונים (סימולציה, Stripe, GreenInvoice וכו')
 */

/**
 * קלט ליצירת תשלום
 */
class CreateChargeInput {
    constructor(clientId, amount, options = {}) {
        this.clientId = clientId;
        this.appointmentId = options.appointmentId;
        this.amount = amount; // באגורות/ש"ח אחיד
        this.currency = options.currency || 'ILS';
        this.metadata = options.metadata || {};
    }
}

/**
 * תוצאה של יצירת תשלום
 */
class ChargeResult {
    constructor(ok, options = {}) {
        this.ok = ok;
        this.transactionId = options.transactionId;
        this.error = options.error;
        this.providerResponse = options.providerResponse;
    }

    static success(transactionId, providerResponse = null) {
        return new ChargeResult(true, { transactionId, providerResponse });
    }

    static failure(error, providerResponse = null) {
        return new ChargeResult(false, { error, providerResponse });
    }
}

/**
 * תוצאה של יצירת חשבונית
 */
class InvoiceResult {
    constructor(ok, options = {}) {
        this.ok = ok;
        this.invoiceId = options.invoiceId;
        this.invoiceUrl = options.invoiceUrl;
        this.error = options.error;
        this.providerResponse = options.providerResponse;
    }

    static success(invoiceId, invoiceUrl, providerResponse = null) {
        return new InvoiceResult(true, { invoiceId, invoiceUrl, providerResponse });
    }

    static failure(error, providerResponse = null) {
        return new InvoiceResult(false, { error, providerResponse });
    }
}

/**
 * ממשק לספק תשלומים
 */
class BillingProvider {
    /**
     * יצירת תשלום
     * @param {CreateChargeInput} input - פרטי התשלום
     * @returns {Promise<ChargeResult>} תוצאת התשלום
     */
    async createCharge(input) {
        throw new Error('createCharge must be implemented by subclass');
    }

    /**
     * יצירת חשבונית
     * @param {string} paymentId - מזהה התשלום
     * @returns {Promise<InvoiceResult>} תוצאת החשבונית
     */
    async createInvoice(paymentId) {
        throw new Error('createInvoice must be implemented by subclass');
    }

    /**
     * בדיקת סטטוס תשלום
     * @param {string} transactionId - מזהה העסקה
     * @returns {Promise<ChargeResult>} סטטוס התשלום
     */
    async checkChargeStatus(transactionId) {
        throw new Error('checkChargeStatus must be implemented by subclass');
    }

    /**
     * ביטול תשלום
     * @param {string} transactionId - מזהה העסקה
     * @returns {Promise<ChargeResult>} תוצאת הביטול
     */
    async refundCharge(transactionId) {
        throw new Error('refundCharge must be implemented by subclass');
    }

    /**
     * קבלת פרטי ספק
     * @returns {Object} פרטי הספק
     */
    getProviderInfo() {
        return {
            name: this.constructor.name,
            isSimulated: false,
            supportsRefunds: false,
            supportsInvoices: false
        };
    }
}

module.exports = {
    CreateChargeInput,
    ChargeResult,
    InvoiceResult,
    BillingProvider
};


