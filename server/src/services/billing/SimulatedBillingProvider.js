const { BillingProvider, CreateChargeInput, ChargeResult, InvoiceResult } = require('./BillingProvider');

/**
 * ספק תשלומים סימולציה
 * מדמה תשלומים אמיתיים לצורך פיתוח ובדיקות
 */
class SimulatedBillingProvider extends BillingProvider {
    constructor() {
        super();
        this.failureRate = parseFloat(process.env.SIMULATED_FAILURE_RATE) || 0.05; // 5% כשל ברירת מחדל
        this.delayRange = {
            min: parseInt(process.env.SIMULATED_DELAY_MIN) || 100, // 100ms
            max: parseInt(process.env.SIMULATED_DELAY_MAX) || 500  // 500ms
        };
    }

    /**
     * יצירת תשלום סימולציה
     * @param {CreateChargeInput} input - פרטי התשלום
     * @returns {Promise<ChargeResult>} תוצאת התשלום
     */
    async createCharge(input) {
        // סימולציית עיכוב
        await this.simulateDelay();

        // בדיקה אם התשלום נכשל (לפי אחוז הכשל)
        const shouldFail = Math.random() < this.failureRate;

        if (shouldFail) {
            return this.simulateFailure(input);
        }

        return this.simulateSuccess(input);
    }

    /**
     * יצירת חשבונית סימולציה
     * @param {string} paymentId - מזהה התשלום
     * @returns {Promise<InvoiceResult>} תוצאת החשבונית
     */
    async createInvoice(paymentId) {
        // סימולציית עיכוב
        await this.simulateDelay();

        // סימולציית כשל נדיר בחשבוניות
        const shouldFail = Math.random() < 0.02; // 2% כשל

        if (shouldFail) {
            return InvoiceResult.failure('SIMULATED_INVOICE_FAILURE', {
                provider: 'simulated',
                paymentId,
                timestamp: new Date().toISOString()
            });
        }

        const invoiceId = `inv_sim_${paymentId}_${Date.now()}`;
        const invoiceUrl = `/api/invoices/simulated/${invoiceId}.pdf`;

        return InvoiceResult.success(invoiceId, invoiceUrl, {
            provider: 'simulated',
            paymentId,
            invoiceId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * בדיקת סטטוס תשלום סימולציה
     * @param {string} transactionId - מזהה העסקה
     * @returns {Promise<ChargeResult>} סטטוס התשלום
     */
    async checkChargeStatus(transactionId) {
        await this.simulateDelay();

        // סימולציה - תמיד מחזיר שהתשלום הצליח
        return ChargeResult.success(transactionId, {
            provider: 'simulated',
            status: 'completed',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * ביטול תשלום סימולציה
     * @param {string} transactionId - מזהה העסקה
     * @returns {Promise<ChargeResult>} תוצאת הביטול
     */
    async refundCharge(transactionId) {
        await this.simulateDelay();

        // סימולציית כשל נדיר בביטולים
        const shouldFail = Math.random() < 0.1; // 10% כשל

        if (shouldFail) {
            return ChargeResult.failure('SIMULATED_REFUND_FAILURE', {
                provider: 'simulated',
                transactionId,
                timestamp: new Date().toISOString()
            });
        }

        const refundId = `ref_sim_${transactionId}_${Date.now()}`;

        return ChargeResult.success(refundId, {
            provider: 'simulated',
            transactionId,
            refundId,
            status: 'refunded',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * קבלת פרטי ספק
     * @returns {Object} פרטי הספק
     */
    getProviderInfo() {
        return {
            name: 'SimulatedBillingProvider',
            isSimulated: true,
            supportsRefunds: true,
            supportsInvoices: true,
            failureRate: this.failureRate,
            delayRange: this.delayRange
        };
    }

    /**
     * סימולציית הצלחה
     * @param {CreateChargeInput} input - פרטי התשלום
     * @returns {ChargeResult} תוצאת הצלחה
     */
    simulateSuccess(input) {
        const transactionId = `sim_${input.clientId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return ChargeResult.success(transactionId, {
            provider: 'simulated',
            clientId: input.clientId,
            appointmentId: input.appointmentId,
            amount: input.amount,
            currency: input.currency,
            metadata: input.metadata,
            timestamp: new Date().toISOString(),
            processingTime: this.getRandomDelay()
        });
    }

    /**
     * סימולציית כשל
     * @param {CreateChargeInput} input - פרטי התשלום
     * @returns {ChargeResult} תוצאת כשל
     */
    simulateFailure(input) {
        const failureReasons = [
            'INSUFFICIENT_FUNDS',
            'CARD_DECLINED',
            'NETWORK_ERROR',
            'TIMEOUT',
            'INVALID_CARD',
            'SIMULATED_FAILURE'
        ];

        const randomReason = failureReasons[Math.floor(Math.random() * failureReasons.length)];

        return ChargeResult.failure(randomReason, {
            provider: 'simulated',
            clientId: input.clientId,
            appointmentId: input.appointmentId,
            amount: input.amount,
            currency: input.currency,
            metadata: input.metadata,
            timestamp: new Date().toISOString(),
            processingTime: this.getRandomDelay()
        });
    }

    /**
     * סימולציית עיכוב
     * @returns {Promise<void>}
     */
    async simulateDelay() {
        const delay = this.getRandomDelay();
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * קבלת עיכוב רנדומלי
     * @returns {number} זמן עיכוב במילישניות
     */
    getRandomDelay() {
        return Math.floor(Math.random() * (this.delayRange.max - this.delayRange.min + 1)) + this.delayRange.min;
    }

    /**
     * הגדרת אחוז כשל (לבדיקות)
     * @param {number} rate - אחוז הכשל (0-1)
     */
    setFailureRate(rate) {
        this.failureRate = Math.max(0, Math.min(1, rate));
    }

    /**
     * הגדרת טווח עיכובים (לבדיקות)
     * @param {number} min - עיכוב מינימלי במילישניות
     * @param {number} max - עיכוב מקסימלי במילישניות
     */
    setDelayRange(min, max) {
        this.delayRange = { min, max };
    }
}

module.exports = SimulatedBillingProvider;


