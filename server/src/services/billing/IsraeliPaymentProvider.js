const axios = require('axios');
const crypto = require('crypto');

class IsraeliPaymentProvider {
    constructor() {
        this.provider = process.env.ISRAELI_PAYMENT_PROVIDER || 'payplus';
        this.config = this.getConfig();
    }

    getConfig() {
        const baseConfig = {
            currency: process.env.DEFAULT_CURRENCY || 'ILS',
            autoCreateInvoice: process.env.AUTO_CREATE_INVOICE === 'true',
            autoSendInvoiceEmail: process.env.AUTO_SEND_INVOICE_EMAIL === 'true',
            encryptCardData: process.env.ENCRYPT_CARD_DATA === 'true',
            validateCardLuhn: process.env.VALIDATE_CARD_LUHN === 'true',
            validateCardExpiry: process.env.VALIDATE_CARD_EXPIRY === 'true',
            minPaymentAmount: parseFloat(process.env.MIN_PAYMENT_AMOUNT) || 1,
            maxPaymentAmount: parseFloat(process.env.MAX_PAYMENT_AMOUNT) || 100000,
            logPaymentRequests: process.env.LOG_PAYMENT_REQUESTS === 'true',
            logProviderResponses: process.env.LOG_PROVIDER_RESPONSES === 'true',
            logCardData: process.env.LOG_CARD_DATA === 'true'
        };

        if (this.provider === 'payplus') {
            return {
                ...baseConfig,
                apiKey: process.env.PAYPLUS_API_KEY,
                secretKey: process.env.PAYPLUS_SECRET_KEY,
                baseUrl: process.env.PAYPLUS_BASE_URL || 'https://restapi.payplus.co.il',
                terminalNumber: process.env.PAYPLUS_TERMINAL_NUMBER,
                callbackUrl: process.env.PAYPLUS_CALLBACK_URL
            };
        } else if (this.provider === 'greeninvoice') {
            return {
                ...baseConfig,
                apiKey: process.env.GREENINVOICE_API_KEY,
                baseUrl: process.env.GREENINVOICE_BASE_URL || 'https://api.greeninvoice.co.il',
                companyId: process.env.GREENINVOICE_COMPANY_ID
            };
        }

        return baseConfig;
    }

    async processPayment(paymentData) {
        try {
            if (this.config.logPaymentRequests) {
                console.log('🇮🇱 Israeli Payment Provider - Processing payment:', {
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    method: paymentData.method,
                    provider: this.provider
                });
            }

            // Validate payment data
            this.validatePaymentData(paymentData);

            // Process based on payment method
            let result;
            switch (paymentData.method) {
                case 'simulation':
                    result = await this.processSimulationPayment(paymentData);
                    break;
                case 'credit_card':
                    result = await this.processCreditCardPayment(paymentData);
                    break;
                case 'cash':
                    result = await this.processCashPayment(paymentData);
                    break;
                case 'bank_transfer':
                    result = await this.processBankTransferPayment(paymentData);
                    break;
                default:
                    throw new Error(`Unsupported payment method: ${paymentData.method}`);
            }

            // Create invoice if enabled
            if (this.config.autoCreateInvoice && result.success) {
                try {
                    const invoice = await this.createInvoice(paymentData, result);
                    result.invoice = invoice;
                } catch (invoiceError) {
                    console.warn('Failed to create invoice:', invoiceError.message);
                    result.invoiceWarning = 'Invoice creation failed';
                }
            }

            if (this.config.logProviderResponses) {
                console.log('🇮🇱 Israeli Payment Provider - Payment result:', {
                    success: result.success,
                    transactionId: result.transactionId,
                    amount: result.amount
                });
            }

            return result;
        } catch (error) {
            console.error('🇮🇱 Israeli Payment Provider - Payment failed:', error);
            return {
                success: false,
                error: error.message,
                errorCode: error.code || 'PAYMENT_FAILED'
            };
        }
    }

    validatePaymentData(paymentData) {
        const { amount, currency, method, clientInfo } = paymentData;

        if (!amount || amount < this.config.minPaymentAmount || amount > this.config.maxPaymentAmount) {
            throw new Error(`Invalid payment amount. Must be between ${this.config.minPaymentAmount} and ${this.config.maxPaymentAmount}`);
        }

        if (currency !== this.config.currency) {
            throw new Error(`Unsupported currency: ${currency}. Only ${this.config.currency} is supported.`);
        }

        if (!method) {
            throw new Error('Payment method is required');
        }

        if (!clientInfo || !clientInfo.name) {
            throw new Error('Client information is required');
        }

        // Validate credit card data if method is credit_card
        if (method === 'credit_card') {
            this.validateCreditCardData(paymentData.cardData);
        }
    }

    validateCreditCardData(cardData) {
        if (!cardData) {
            throw new Error('Credit card data is required for credit card payments');
        }

        const { cardNumber, expiryMonth, expiryYear, cvv, holderName } = cardData;

        if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !holderName) {
            throw new Error('All credit card fields are required');
        }

        // Validate card number using Luhn algorithm
        if (this.config.validateCardLuhn && !this.validateLuhn(cardNumber)) {
            throw new Error('Invalid credit card number');
        }

        // Validate expiry date
        if (this.config.validateCardExpiry) {
            const now = new Date();
            const expiryDate = new Date(expiryYear, expiryMonth - 1);
            if (expiryDate <= now) {
                throw new Error('Credit card has expired');
            }
        }

        // Validate CVV
        if (!/^\d{3,4}$/.test(cvv)) {
            throw new Error('Invalid CVV');
        }
    }

    validateLuhn(cardNumber) {
        const cleaned = cardNumber.replace(/\D/g, '');
        let sum = 0;
        let isEven = false;

        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned[i]);

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    }

    async processSimulationPayment(paymentData) {
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            success: true,
            transactionId: `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: paymentData.amount,
            currency: paymentData.currency,
            method: 'simulation',
            status: 'completed',
            processedAt: new Date(),
            provider: 'israeli_simulation',
            message: 'תשלום סימולציה בוצע בהצלחה'
        };
    }

    async processCreditCardPayment(paymentData) {
        if (this.provider === 'payplus') {
            return await this.processPayPlusPayment(paymentData);
        } else if (this.provider === 'greeninvoice') {
            return await this.processGreenInvoicePayment(paymentData);
        } else {
            // Fallback to simulation for unsupported providers
            console.warn(`Provider ${this.provider} not implemented, using simulation`);
            return await this.processSimulationPayment(paymentData);
        }
    }

    async processPayPlusPayment(paymentData) {
        try {
            const { cardData, amount, currency, clientInfo } = paymentData;

            // Encrypt card data if enabled
            let encryptedCardData = cardData;
            if (this.config.encryptCardData) {
                encryptedCardData = this.encryptCardData(cardData);
            }

            const paymentRequest = {
                terminal_number: this.config.terminalNumber,
                amount: Math.round(amount * 100), // Convert to agorot
                currency_code: currency,
                card_number: encryptedCardData.cardNumber,
                expiry_month: encryptedCardData.expiryMonth,
                expiry_year: encryptedCardData.expiryYear,
                cvv: encryptedCardData.cvv,
                holder_name: encryptedCardData.holderName,
                customer_name: clientInfo.name,
                customer_email: clientInfo.email,
                customer_phone: clientInfo.phone,
                description: paymentData.description || 'תשלום עבור טיפול',
                callback_url: this.config.callbackUrl
            };

            const response = await axios.post(`${this.config.baseUrl}/api/v1/payments`, paymentRequest, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                return {
                    success: true,
                    transactionId: response.data.transaction_id,
                    amount: amount,
                    currency: currency,
                    method: 'credit_card',
                    status: 'completed',
                    processedAt: new Date(),
                    provider: 'payplus',
                    message: 'תשלום בכרטיס אשראי בוצע בהצלחה',
                    rawResponse: response.data
                };
            } else {
                throw new Error(response.data.error_message || 'Payment failed');
            }
        } catch (error) {
            console.error('PayPlus payment error:', error.response?.data || error.message);
            throw new Error(`PayPlus payment failed: ${error.response?.data?.error_message || error.message}`);
        }
    }

    async processGreenInvoicePayment(paymentData) {
        try {
            const { amount, currency, clientInfo } = paymentData;

            // Create customer
            const customerData = {
                name: clientInfo.name,
                email: clientInfo.email,
                phone: clientInfo.phone,
                address: clientInfo.address || ''
            };

            const customerResponse = await axios.post(`${this.config.baseUrl}/api/v1/customers`, customerData, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            // Create payment
            const paymentRequest = {
                customer_id: customerResponse.data.id,
                amount: amount,
                currency: currency,
                description: paymentData.description || 'תשלום עבור טיפול',
                payment_method: 'credit_card'
            };

            const response = await axios.post(`${this.config.baseUrl}/api/v1/payments`, paymentRequest, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                return {
                    success: true,
                    transactionId: response.data.payment_id,
                    amount: amount,
                    currency: currency,
                    method: 'credit_card',
                    status: 'completed',
                    processedAt: new Date(),
                    provider: 'greeninvoice',
                    message: 'תשלום בכרטיס אשראי בוצע בהצלחה',
                    rawResponse: response.data
                };
            } else {
                throw new Error(response.data.error || 'Payment failed');
            }
        } catch (error) {
            console.error('GreenInvoice payment error:', error.response?.data || error.message);
            throw new Error(`GreenInvoice payment failed: ${error.response?.data?.error || error.message}`);
        }
    }

    async processCashPayment(paymentData) {
        return {
            success: true,
            transactionId: `CASH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: paymentData.amount,
            currency: paymentData.currency,
            method: 'cash',
            status: 'completed',
            processedAt: new Date(),
            provider: 'israeli_cash',
            message: 'תשלום במזומן נרשם בהצלחה'
        };
    }

    async processBankTransferPayment(paymentData) {
        return {
            success: true,
            transactionId: `BANK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: paymentData.amount,
            currency: paymentData.currency,
            method: 'bank_transfer',
            status: 'pending',
            processedAt: new Date(),
            provider: 'israeli_bank_transfer',
            message: 'העברה בנקאית נרשמה - ממתין לאישור',
            bankDetails: {
                bankName: 'בנק לאומי',
                branchNumber: '123',
                accountNumber: '456789',
                accountName: 'מרכז הטיפול שלך'
            }
        };
    }

    encryptCardData(cardData) {
        const encryptionKey = process.env.CARD_DATA_ENCRYPTION_KEY || 'default-key-change-in-production';
        const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
        
        return {
            cardNumber: cipher.update(cardData.cardNumber, 'utf8', 'hex') + cipher.final('hex'),
            expiryMonth: cardData.expiryMonth,
            expiryYear: cardData.expiryYear,
            cvv: cipher.update(cardData.cvv, 'utf8', 'hex') + cipher.final('hex'),
            holderName: cardData.holderName
        };
    }

    async createInvoice(paymentData, paymentResult) {
        if (this.provider === 'greeninvoice') {
            return await this.createGreenInvoice(paymentData, paymentResult);
        } else {
            return await this.createGenericInvoice(paymentData, paymentResult);
        }
    }

    async createGreenInvoice(paymentData, paymentResult) {
        try {
            const invoiceData = {
                company_id: this.config.companyId,
                customer_id: paymentData.clientInfo.id,
                amount: paymentData.amount,
                currency: paymentData.currency,
                description: paymentData.description || 'תשלום עבור טיפול',
                payment_id: paymentResult.transactionId,
                status: 'paid'
            };

            const response = await axios.post(`${this.config.baseUrl}/api/v1/invoices`, invoiceData, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                invoiceId: response.data.id,
                invoiceNumber: response.data.number,
                provider: 'greeninvoice',
                rawResponse: response.data
            };
        } catch (error) {
            console.error('GreenInvoice invoice creation error:', error.response?.data || error.message);
            throw new Error(`Invoice creation failed: ${error.response?.data?.error || error.message}`);
        }
    }

    async createGenericInvoice(paymentData, paymentResult) {
        // Create a generic invoice record
        return {
            success: true,
            invoiceId: `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            invoiceNumber: `INV-${Date.now()}`,
            provider: 'generic',
            amount: paymentData.amount,
            currency: paymentData.currency,
            status: 'created',
            createdAt: new Date()
        };
    }

    async getPaymentStatus(transactionId) {
        try {
            if (this.provider === 'payplus') {
                const response = await axios.get(`${this.config.baseUrl}/api/v1/payments/${transactionId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`
                    }
                });

                return {
                    success: true,
                    status: response.data.status,
                    amount: response.data.amount,
                    currency: response.data.currency,
                    processedAt: response.data.processed_at
                };
            } else {
                // For other providers, return a generic status
                return {
                    success: true,
                    status: 'completed',
                    message: 'Payment status retrieved'
                };
            }
        } catch (error) {
            console.error('Error getting payment status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async refundPayment(transactionId, amount, reason) {
        try {
            if (this.provider === 'payplus') {
                const refundRequest = {
                    transaction_id: transactionId,
                    amount: Math.round(amount * 100), // Convert to agorot
                    reason: reason || 'Refund requested'
                };

                const response = await axios.post(`${this.config.baseUrl}/api/v1/refunds`, refundRequest, {
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                return {
                    success: true,
                    refundId: response.data.refund_id,
                    amount: amount,
                    status: 'processed',
                    processedAt: new Date()
                };
            } else {
                // For other providers, create a manual refund record
                return {
                    success: true,
                    refundId: `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    amount: amount,
                    status: 'manual_required',
                    processedAt: new Date(),
                    message: 'Manual refund required - contact provider'
                };
            }
        } catch (error) {
            console.error('Refund error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = IsraeliPaymentProvider;
