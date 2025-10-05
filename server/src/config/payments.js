const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

class PaymentConfig {
    constructor() {
        this.validateConfig();
    }

    validateConfig() {
        // Validate payment provider specific config
        if (process.env.PAYMENT_PROVIDER === 'tranzila') {
            const tranzilaRequired = ['TRANZILA_TERMINAL_ID', 'APP_BASE_URL'];
            const tranzilaMissing = tranzilaRequired.filter(varName => !process.env[varName]);

            if (tranzilaMissing.length > 0) {
                console.error('❌ Missing Tranzila configuration:', tranzilaMissing);
                throw new Error(`Missing Tranzila configuration: ${tranzilaMissing.join(', ')}`);
            }
        }
    }

    get provider() {
        return process.env.PAYMENT_PROVIDER || 'mock';
    }

    get appBaseUrl() {
        return process.env.APP_BASE_URL || 'http://localhost:5000';
    }

    get tranzila() {
        return {
            terminalId: process.env.TRANZILA_TERMINAL_ID,
            secret: process.env.TRANZILA_SECRET,
            baseUrl: process.env.TRANZILA_BASE_URL || 'https://secure5.tranzila.com/cgi-bin/tranzila71u.cgi',
            callbackUrl: process.env.TRANZILA_CALLBACK_URL || `${this.appBaseUrl}/api/payment-links/callback/tranzila`,
            successUrl: process.env.TRANZILA_SUCCESS_URL || `${this.appBaseUrl}/pay/success`,
            failUrl: process.env.TRANZILA_FAIL_URL || `${this.appBaseUrl}/pay/fail`
        };
    }

    get cardcom() {
        return {
            terminalId: process.env.CARDCOM_TERMINAL_ID,
            secret: process.env.CARDCOM_SECRET,
            baseUrl: process.env.CARDCOM_BASE_URL,
            callbackUrl: process.env.CARDCOM_CALLBACK_URL || `${this.appBaseUrl}/api/payment-links/callback/cardcom`,
            successUrl: process.env.CARDCOM_SUCCESS_URL || `${this.appBaseUrl}/pay/success`,
            failUrl: process.env.CARDCOM_FAIL_URL || `${this.appBaseUrl}/pay/fail`
        };
    }

    get environment() {
        return process.env.NODE_ENV || 'development';
    }

    get isProduction() {
        return this.environment === 'production';
    }

    get isDevelopment() {
        return this.environment === 'development';
    }

    get isTest() {
        return this.environment === 'test';
    }

    get logLevel() {
        return process.env.LOG_LEVEL || (this.isProduction ? 'warn' : 'debug');
    }

    get paymentLinkExpiryDays() {
        return parseInt(process.env.PAYMENT_LINK_EXPIRY_DAYS) || 7;
    }

    get maxPaymentAmount() {
        return parseFloat(process.env.MAX_PAYMENT_AMOUNT) || 10000; // 10,000 ILS
    }

    get minPaymentAmount() {
        return parseFloat(process.env.MIN_PAYMENT_AMOUNT) || 0.01; // 1 agora
    }

    get supportedCurrencies() {
        return (process.env.SUPPORTED_CURRENCIES || 'ILS').split(',');
    }

    get defaultCurrency() {
        return process.env.DEFAULT_CURRENCY || 'ILS';
    }

    // Security settings
    get security() {
        return {
            enableSignatureVerification: process.env.ENABLE_SIGNATURE_VERIFICATION !== 'false',
            allowedCallbackIPs: process.env.ALLOWED_CALLBACK_IPS ?
                process.env.ALLOWED_CALLBACK_IPS.split(',') : [],
            enableHTTPS: process.env.ENABLE_HTTPS !== 'false',
            rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
            rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 20
        };
    }

    // Database settings
    get database() {
        return {
            mongodbUri: process.env.MONGODB_URI,
            connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
            maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10
        };
    }

    // Logging settings
    get logging() {
        return {
            level: this.logLevel,
            enableFileLogging: process.env.ENABLE_FILE_LOGGING !== 'false',
            logDirectory: process.env.LOG_DIRECTORY || 'logs',
            maxLogFiles: parseInt(process.env.MAX_LOG_FILES) || 5,
            maxLogSize: process.env.MAX_LOG_SIZE || '10m'
        };
    }

    // Email settings (for notifications)
    get email() {
        return {
            enabled: process.env.EMAIL_ENABLED === 'true',
            provider: process.env.EMAIL_PROVIDER || 'sendgrid',
            apiKey: process.env.EMAIL_API_KEY,
            fromEmail: process.env.EMAIL_FROM || 'noreply@luma-crm.com',
            templates: {
                paymentSuccess: process.env.EMAIL_TEMPLATE_PAYMENT_SUCCESS,
                paymentFailed: process.env.EMAIL_TEMPLATE_PAYMENT_FAILED,
                paymentExpired: process.env.EMAIL_TEMPLATE_PAYMENT_EXPIRED
            }
        };
    }

    // WhatsApp settings (for notifications)
    get whatsapp() {
        return {
            enabled: process.env.WHATSAPP_ENABLED === 'true',
            apiKey: process.env.WHATSAPP_API_KEY,
            phoneNumber: process.env.WHATSAPP_PHONE_NUMBER,
            templates: {
                paymentLink: process.env.WHATSAPP_TEMPLATE_PAYMENT_LINK
            }
        };
    }

    // Print configuration summary (without sensitive data)
    printConfigSummary() {
        console.log('📋 Payment Configuration Summary:');
        console.log(`   Provider: ${this.provider}`);
        console.log(`   Environment: ${this.environment}`);
        console.log(`   Base URL: ${this.appBaseUrl}`);
        console.log(`   Default Currency: ${this.defaultCurrency}`);
        console.log(`   Payment Link Expiry: ${this.paymentLinkExpiryDays} days`);
        console.log(`   Min Amount: ${this.minPaymentAmount} ${this.defaultCurrency}`);
        console.log(`   Max Amount: ${this.maxPaymentAmount} ${this.defaultCurrency}`);
        console.log(`   Log Level: ${this.logLevel}`);
        console.log(`   HTTPS Enabled: ${this.security.enableHTTPS}`);
        console.log(`   Signature Verification: ${this.security.enableSignatureVerification}`);

        if (this.provider === 'tranzila') {
            console.log(`   Tranzila Terminal ID: ${this.tranzila.terminalId ? '✅ Set' : '❌ Missing'}`);
            console.log(`   Tranzila Secret: ${this.tranzila.secret ? '✅ Set' : '❌ Not Set'}`);
        }

        console.log('📋 Configuration loaded successfully');
    }
}

// Create singleton instance
const paymentConfig = new PaymentConfig();

// Print configuration on startup
if (process.env.NODE_ENV !== 'test') {
    paymentConfig.printConfigSummary();
}

module.exports = paymentConfig;
