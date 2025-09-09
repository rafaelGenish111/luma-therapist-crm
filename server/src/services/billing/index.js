const SimulatedBillingProvider = require('./SimulatedBillingProvider');
const StripeBillingProvider = require('./StripeBillingProvider');
const GreenInvoiceProvider = require('./GreenInvoiceProvider');

/**
 * Factory לספקי תשלומים
 * מחזיר את הספק המתאים לפי משתני הסביבה
 */
class BillingProviderFactory {
    constructor() {
        this.provider = null;
        this.providerName = null;
    }

    /**
     * קבלת ספק התשלומים הנוכחי
     * @returns {BillingProvider} ספק התשלומים
     */
    getProvider() {
        if (this.provider) {
            return this.provider;
        }

        const mode = process.env.BILLING_PROVIDER || 'simulated';
        this.providerName = mode;

        switch (mode.toLowerCase()) {
            case 'simulated':
                this.provider = new SimulatedBillingProvider();
                break;

            case 'stripe':
                this.provider = new StripeBillingProvider();
                break;

            case 'greeninvoice':
                this.provider = new GreenInvoiceProvider();
                break;

            // case 'tranzilla':
            //     this.provider = new TranzillaBillingProvider();
            //     break;

            default:
                console.warn(`Unknown billing provider: ${mode}, falling back to simulated`);
                this.provider = new SimulatedBillingProvider();
                this.providerName = 'simulated';
        }

        console.log(`Billing provider initialized: ${this.providerName}`);
        return this.provider;
    }

    /**
     * קבלת שם הספק הנוכחי
     * @returns {string} שם הספק
     */
    getProviderName() {
        if (!this.providerName) {
            this.getProvider();
        }
        return this.providerName;
    }

    /**
     * קבלת פרטי הספק הנוכחי
     * @returns {Object} פרטי הספק
     */
    getProviderInfo() {
        const provider = this.getProvider();
        return provider.getProviderInfo();
    }

    /**
     * בדיקה אם הספק הנוכחי הוא סימולציה
     * @returns {boolean} true אם זה ספק סימולציה
     */
    isSimulated() {
        const info = this.getProviderInfo();
        return info.isSimulated;
    }

    /**
     * איפוס הספק (לבדיקות)
     */
    reset() {
        this.provider = null;
        this.providerName = null;
    }

    /**
     * קבלת רשימת ספקים זמינים
     * @returns {Array} רשימת שמות ספקים
     */
    getAvailableProviders() {
        return [
            'simulated',
            'stripe',
            'greeninvoice', // זמין כעת
            // 'tranzilla'    // בעתיד
        ];
    }

    /**
     * בדיקה אם ספק נתמך
     * @param {string} providerName - שם הספק
     * @returns {boolean} true אם הספק נתמך
     */
    isProviderSupported(providerName) {
        return this.getAvailableProviders().includes(providerName.toLowerCase());
    }
}

// יצירת instance יחיד (Singleton)
const billingProviderFactory = new BillingProviderFactory();

module.exports = {
    billingProviderFactory,
    getBillingProvider: () => billingProviderFactory.getProvider(),
    getProviderInfo: () => billingProviderFactory.getProviderInfo(),
    isSimulated: () => billingProviderFactory.isSimulated(),
    getAvailableProviders: () => billingProviderFactory.getAvailableProviders(),
    isProviderSupported: (name) => billingProviderFactory.isProviderSupported(name)
};
