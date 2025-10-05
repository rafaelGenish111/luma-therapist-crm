const PaymentProvider = require('./types');
const crypto = require('crypto');
const axios = require('axios');
const paymentConfig = require('../../config/payments');

class TranzilaProvider extends PaymentProvider {
    constructor() {
        super();
        this.terminalId = paymentConfig.tranzila.terminalId;
        this.secret = paymentConfig.tranzila.secret;
        this.baseUrl = paymentConfig.tranzila.baseUrl;
        this.callbackUrl = paymentConfig.tranzila.callbackUrl;
        this.successUrl = paymentConfig.tranzila.successUrl;
        this.failUrl = paymentConfig.tranzila.failUrl;

        if (!this.terminalId) {
            throw new Error('TRANZILA_TERMINAL_ID is required');
        }
    }

    getName() {
        return 'tranzila';
    }

    supports(method) {
        // Tranzila supports all payment methods through their gateway
        const supportedMethods = ['credit', 'bit', 'paybox', 'gpay', 'apay'];
        return supportedMethods.includes(method);
    }

    async createCheckout(payment) {
        try {
            const params = {
                sum: payment.amount.toFixed(2),
                currency: payment.currency || '1', // 1 = ILS
                terminal: this.terminalId,
                TranzilaTK: payment.paymentLinkId,
                email: payment.clientEmail || '',
                phone: payment.clientPhone || '',
                contact: payment.clientName || '',
                osum: payment.description || 'תשלום עבור טיפול',
                myid: payment.sessionId || '',
                myid2: payment.therapistId,
                myid3: payment.clientId,
                callback_url: this.callbackUrl,
                success_url: this.successUrl,
                cancel_url: this.failUrl,
                lang: 'he'
            };

            // אם יש secret, נוסיף חתימה
            if (this.secret) {
                params.signature = this.generateSignature(params);
            }

            // יצירת URL עם פרמטרים
            const queryString = new URLSearchParams(params).toString();
            const redirectUrl = `${this.baseUrl}?${queryString}`;

            return { redirectUrl };
        } catch (error) {
            console.error('Tranzila createCheckout error:', error);
            throw new Error(`Failed to create Tranzila checkout: ${error.message}`);
        }
    }

    async verifyCallback(req) {
        try {
            const {
                TranzilaTK: paymentLinkId,
                ConfirmationCode: confirmationCode,
                Sum: amount,
                Currency: currency,
                TranzilaTK: tranzilaTK,
                Response: response,
                Index: index,
                ConfirmationCode: confirmationCode2,
                MyId: myId,
                MyId2: myId2,
                MyId3: myId3,
                signature: receivedSignature
            } = req.body;

            // בדיקת חתימה אם יש secret
            if (this.secret && receivedSignature) {
                const expectedSignature = this.generateSignature(req.body);
                if (receivedSignature !== expectedSignature) {
                    console.error('Tranzila signature verification failed');
                    return { ok: false };
                }
            }

            // בדיקת קוד אישור
            if (!confirmationCode || !paymentLinkId) {
                console.error('Missing required Tranzila callback parameters');
                return { ok: false };
            }

            // קביעת סטטוס לפי קוד התגובה
            let status = 'failed';
            if (response === '000' || confirmationCode === '000') {
                status = 'paid';
            }

            return {
                ok: true,
                paymentLinkId,
                status,
                providerTxnId: confirmationCode,
                metadata: {
                    amount,
                    currency,
                    response,
                    index,
                    myId,
                    myId2,
                    myId3
                }
            };
        } catch (error) {
            console.error('Tranzila verifyCallback error:', error);
            return { ok: false };
        }
    }

    generateSignature(params) {
        if (!this.secret) return '';

        // יצירת מחרוזת לחתימה
        const signatureString = Object.keys(params)
            .filter(key => key !== 'signature')
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');

        // יצירת חתימה HMAC
        return crypto
            .createHmac('sha256', this.secret)
            .update(signatureString)
            .digest('hex');
    }
}

module.exports = TranzilaProvider;
