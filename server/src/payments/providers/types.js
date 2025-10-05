const { Request, Response } = require('express');

/**
 * Interface for payment providers
 */
class PaymentProvider {
    /**
     * Create a checkout session and return redirect URL
     * @param {Object} payment - Payment object with amount, currency, etc.
     * @returns {Promise<{redirectUrl: string}>}
     */
    async createCheckout(payment) {
        throw new Error('createCheckout method must be implemented');
    }

    /**
     * Verify callback from payment provider
     * @param {Request} req - Express request object
     * @returns {Promise<{ok: boolean, paymentLinkId?: string, status?: "paid" | "failed", providerTxnId?: string}>}
     */
    async verifyCallback(req) {
        throw new Error('verifyCallback method must be implemented');
    }

    /**
     * Check if provider supports specific payment method
     * @param {string} method - Payment method
     * @returns {boolean}
     */
    supports(method) {
        throw new Error('supports method must be implemented');
    }

    /**
     * Get provider name
     * @returns {string}
     */
    getName() {
        throw new Error('getName method must be implemented');
    }
}

module.exports = PaymentProvider;
