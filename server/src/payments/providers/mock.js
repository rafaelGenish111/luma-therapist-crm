const PaymentProvider = require('./types');

class MockProvider extends PaymentProvider {
    constructor() {
        super();
    }

    getName() {
        return 'mock';
    }

    supports(method) {
        // Mock provider supports all methods for testing
        const supportedMethods = ['credit', 'bit', 'paybox', 'gpay', 'apay'];
        return supportedMethods.includes(method);
    }

    async createCheckout(payment) {
        console.log('MockProvider: Creating checkout for payment:', payment);

        // Mock provider returns a fake checkout URL with payment method
        const paymentMethod = payment.paymentMethod || 'all';
        const mockCheckoutUrl = `https://mock-payment.example.com/checkout?paymentId=${payment.paymentLinkId}&amount=${payment.amount}&method=${paymentMethod}`;

        return { redirectUrl: mockCheckoutUrl };
    }

    async verifyCallback(req) {
        // Mock provider simulates successful payment
        const { paymentLinkId } = req.body;

        if (!paymentLinkId) {
            return { ok: false };
        }

        // Simulate random success/failure for testing
        const isSuccess = Math.random() > 0.2; // 80% success rate

        return {
            ok: true,
            paymentLinkId,
            status: isSuccess ? 'paid' : 'failed',
            providerTxnId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            metadata: {
                mock: true,
                simulated: true,
                timestamp: new Date().toISOString()
            }
        };
    }
}

module.exports = MockProvider;
