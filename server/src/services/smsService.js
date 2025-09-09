const twilio = require('twilio');

class SmsService {
    constructor() {
        this.client = null;
        this.isConfigured = false;
        this.init();
    }

    init() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_FROM_NUMBER;

        if (accountSid && authToken && fromNumber) {
            try {
                this.client = twilio(accountSid, authToken);
                this.fromNumber = fromNumber;
                this.isConfigured = true;
                console.log('📱 SMS Service initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize SMS service:', error.message);
            }
        } else {
            console.log('⚠️ SMS Service not configured - missing Twilio credentials');
        }
    }

    async sendSms(to, message) {
        if (!this.isConfigured) {
            throw new Error('SMS service not configured');
        }

        try {
            // נרמול מספר טלפון ישראלי
            const normalizedPhone = this.normalizeIsraeliPhone(to);

            const result = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: normalizedPhone
            });

            console.log(`📱 SMS sent successfully to ${normalizedPhone}, SID: ${result.sid}`);
            return {
                success: true,
                sid: result.sid,
                to: normalizedPhone
            };
        } catch (error) {
            console.error('❌ Failed to send SMS:', error.message);
            throw new Error(`Failed to send SMS: ${error.message}`);
        }
    }

    normalizeIsraeliPhone(phone) {
        // הסרת רווחים, מקפים ופלוסים
        let normalized = phone.replace(/[\s\-\+]/g, '');

        // המרה לפורמט בינלאומי
        if (normalized.startsWith('0')) {
            normalized = '972' + normalized.substring(1);
        } else if (!normalized.startsWith('972')) {
            normalized = '972' + normalized;
        }

        return '+' + normalized;
    }

    async sendOtpSms(to, code, context = 'אימות') {
        const message = `קוד ${context} שלך: ${code}\nתקף ל-10 דקות בלבד.\nאל תשתף קוד זה עם אחרים.`;

        // Use mock mode in development if Twilio not configured
        if (process.env.NODE_ENV === 'development' && !this.isAvailable()) {
            return this.sendOtpSmsMock(to, code, context);
        }

        return this.sendSms(to, message);
    }

    isAvailable() {
        return this.isConfigured;
    }

    // Mock למצב פיתוח
    async sendSmsMock(to, message) {
        console.log('📱 SMS Mock - Would send to:', to);
        console.log('📱 SMS Mock - Message:', message);

        return {
            success: true,
            sid: 'mock_' + Date.now(),
            to: this.normalizeIsraeliPhone(to),
            mock: true
        };
    }

    async sendOtpSmsMock(to, code, context = 'אימות') {
        const message = `קוד ${context} שלך: ${code}\nתקף ל-10 דקות בלבד.\nאל תשתף קוד זה עם אחרים.`;
        return this.sendSmsMock(to, message);
    }
}

module.exports = new SmsService();
