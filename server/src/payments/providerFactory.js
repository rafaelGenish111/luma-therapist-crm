const TranzilaProvider = require('./providers/tranzila');
const MockProvider = require('./providers/mock');
const paymentConfig = require('../config/payments');

class PaymentProviderFactory {
    static getProvider() {
        const providerName = paymentConfig.provider;

        switch (providerName.toLowerCase()) {
            case 'tranzila':
                return new TranzilaProvider();
            case 'mock':
                return new MockProvider();
            default:
                console.warn(`Unknown payment provider: ${providerName}, falling back to mock`);
                return new MockProvider();
        }
    }

    static getProviderByName(name) {
        switch (name.toLowerCase()) {
            case 'tranzila':
                return new TranzilaProvider();
            case 'mock':
                return new MockProvider();
            default:
                throw new Error(`Unknown payment provider: ${name}`);
        }
    }

    static getAvailableProviders() {
        return ['tranzila', 'mock'];
    }

    static isProviderAvailable(name) {
        return this.getAvailableProviders().includes(name.toLowerCase());
    }
}

module.exports = PaymentProviderFactory;
