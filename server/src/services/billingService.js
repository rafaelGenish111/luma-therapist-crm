const { getBillingProvider, getProviderInfo, isSimulated } = require('./billing');
const { CreateChargeInput } = require('./billing/BillingProvider');
const Payment = require('../models/Payment');
const Client = require('../models/Client');
const Appointment = require('../models/Appointment');

/**
 * שירות תשלומים
 * משתמש בשכבת האבסטרקציה לספקי תשלומים
 */
class BillingService {
    constructor() {
        this.provider = getBillingProvider();
        this.providerInfo = getProviderInfo();
    }

    /**
     * יצירת תשלום חדש
     * @param {Object} paymentData - פרטי התשלום
     * @param {string} therapistId - מזהה המטפלת
     * @returns {Promise<Object>} תוצאת התשלום
     */
    async createPayment(paymentData, therapistId) {
        try {
            // יצירת תשלום במסד הנתונים
            const payment = new Payment({
                clientId: paymentData.clientId,
                appointmentId: paymentData.appointmentId,
                amount: paymentData.amount,
                currency: paymentData.currency || 'ILS',
                method: paymentData.method || 'simulated',
                status: 'pending',
                createdBy: therapistId,
                meta: {
                    description: paymentData.description,
                    ...paymentData.metadata
                }
            });

            await payment.save();

            // יצירת תשלום אצל הספק
            const chargeInput = new CreateChargeInput(
                paymentData.clientId,
                paymentData.amount,
                {
                    appointmentId: paymentData.appointmentId,
                    currency: paymentData.currency || 'ILS',
                    metadata: {
                        paymentId: payment._id.toString(),
                        description: paymentData.description,
                        ...paymentData.metadata
                    }
                }
            );

            const chargeResult = await this.provider.createCharge(chargeInput);

            // עדכון התשלום לפי התוצאה
            if (chargeResult.ok) {
                payment.status = 'paid';
                payment.transactionId = chargeResult.transactionId;
                payment.meta = {
                    ...payment.meta,
                    providerResponse: chargeResult.providerResponse
                };
            } else {
                payment.status = 'failed';
                payment.meta = {
                    ...payment.meta,
                    error: chargeResult.error,
                    providerResponse: chargeResult.providerResponse
                };
            }

            await payment.save();

            const result = {
                success: chargeResult.ok,
                payment: payment,
                transactionId: chargeResult.transactionId,
                error: chargeResult.error
            };

            // קריאה ל-webhook אם התשלום הצליח
            if (result.success) {
                try {
                    await fetch(`${process.env.BASE_URL || 'http://localhost:5000'}/api/hooks/payment-updated`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            paymentId: result.payment._id,
                            event: 'payment_created',
                            paymentData: result.payment
                        })
                    });
                } catch (webhookError) {
                    console.warn('Webhook call failed:', webhookError);
                    // לא נכשל אם ה-webhook נכשל
                }
            }

            return result;

        } catch (error) {
            console.error('Error creating payment:', error);
            throw new Error('שגיאה ביצירת התשלום');
        }
    }

    /**
     * יצירת חשבונית לתשלום
     * @param {string} paymentId - מזהה התשלום
     * @returns {Promise<Object>} תוצאת החשבונית
     */
    async createInvoice(paymentId) {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new Error('תשלום לא נמצא');
            }

            if (payment.status !== 'paid') {
                throw new Error('לא ניתן ליצור חשבונית לתשלום שלא שולם');
            }

            // יצירת חשבונית אצל הספק
            const invoiceResult = await this.provider.createInvoice(paymentId);

            if (invoiceResult.ok) {
                // עדכון התשלום עם פרטי החשבונית
                payment.invoiceId = invoiceResult.invoiceId;
                payment.invoiceUrl = invoiceResult.invoiceUrl;
                payment.meta = {
                    ...payment.meta,
                    invoiceProviderResponse: invoiceResult.providerResponse
                };
                await payment.save();
            }

            return {
                success: invoiceResult.ok,
                invoiceId: invoiceResult.invoiceId,
                invoiceUrl: invoiceResult.invoiceUrl,
                error: invoiceResult.error
            };

        } catch (error) {
            console.error('Error creating invoice:', error);
            throw new Error('שגיאה ביצירת החשבונית');
        }
    }

    /**
     * בדיקת סטטוס תשלום
     * @param {string} paymentId - מזהה התשלום
     * @returns {Promise<Object>} סטטוס התשלום
     */
    async checkPaymentStatus(paymentId) {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new Error('תשלום לא נמצא');
            }

            if (!payment.transactionId) {
                return {
                    status: payment.status,
                    message: 'אין מזהה עסקה לבדיקה'
                };
            }

            // בדיקת סטטוס אצל הספק
            const statusResult = await this.provider.checkChargeStatus(payment.transactionId);

            if (statusResult.ok) {
                // עדכון הסטטוס אם השתנה
                if (payment.status !== 'paid') {
                    payment.status = 'paid';
                    payment.meta = {
                        ...payment.meta,
                        lastStatusCheck: new Date().toISOString(),
                        providerStatusResponse: statusResult.providerResponse
                    };
                    await payment.save();
                }
            }

            return {
                status: payment.status,
                transactionId: payment.transactionId,
                lastChecked: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error checking payment status:', error);
            throw new Error('שגיאה בבדיקת סטטוס התשלום');
        }
    }

    /**
     * ביטול תשלום
     * @param {string} paymentId - מזהה התשלום
     * @param {string} reason - סיבת הביטול
     * @returns {Promise<Object>} תוצאת הביטול
     */
    async refundPayment(paymentId, reason = '') {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new Error('תשלום לא נמצא');
            }

            if (payment.status !== 'paid') {
                throw new Error('לא ניתן לבטל תשלום שלא שולם');
            }

            if (!payment.transactionId) {
                throw new Error('אין מזהה עסקה לביטול');
            }

            // ביטול אצל הספק
            const refundResult = await this.provider.refundCharge(payment.transactionId);

            if (refundResult.ok) {
                payment.status = 'refunded';
                payment.meta = {
                    ...payment.meta,
                    refundReason: reason,
                    refundedAt: new Date().toISOString(),
                    refundTransactionId: refundResult.transactionId,
                    providerRefundResponse: refundResult.providerResponse
                };
                await payment.save();
            }

            return {
                success: refundResult.ok,
                refundTransactionId: refundResult.transactionId,
                error: refundResult.error
            };

        } catch (error) {
            console.error('Error refunding payment:', error);
            throw new Error('שגיאה בביטול התשלום');
        }
    }

    /**
     * קבלת פרטי הספק הנוכחי
     * @returns {Object} פרטי הספק
     */
    getProviderInfo() {
        return this.providerInfo;
    }

    /**
     * בדיקה אם הספק הוא סימולציה
     * @returns {boolean} true אם זה ספק סימולציה
     */
    isSimulated() {
        return isSimulated();
    }

    /**
     * קבלת תשלומים של לקוח
     * @param {string} clientId - מזהה הלקוח
     * @param {Object} options - אפשרויות סינון
     * @returns {Promise<Array>} רשימת תשלומים
     */
    async getClientPayments(clientId, options = {}) {
        return Payment.findByClient(clientId, options);
    }

    /**
     * קבלת תשלומים של פגישה
     * @param {string} appointmentId - מזהה הפגישה
     * @returns {Promise<Array>} רשימת תשלומים
     */
    async getAppointmentPayments(appointmentId) {
        return Payment.findByAppointment(appointmentId);
    }

    /**
     * קבלת סטטיסטיקות תשלומים
     * @param {string} therapistId - מזהה המטפלת
     * @param {Object} filters - מסננים
     * @returns {Promise<Object>} סטטיסטיקות
     */
    async getPaymentStats(therapistId, filters = {}) {
        const query = { createdBy: therapistId };

        if (filters.dateFrom) {
            query.createdAt = { $gte: new Date(filters.dateFrom) };
        }

        if (filters.dateTo) {
            if (query.createdAt) {
                query.createdAt.$lte = new Date(filters.dateTo);
            } else {
                query.createdAt = { $lte: new Date(filters.dateTo) };
            }
        }

        const payments = await Payment.find(query);

        const stats = {
            total: payments.length,
            totalAmount: 0,
            paid: 0,
            paidAmount: 0,
            pending: 0,
            failed: 0,
            refunded: 0
        };

        payments.forEach(payment => {
            stats.totalAmount += payment.amount;

            switch (payment.status) {
                case 'paid':
                    stats.paid++;
                    stats.paidAmount += payment.amount;
                    break;
                case 'pending':
                    stats.pending++;
                    break;
                case 'failed':
                    stats.failed++;
                    break;
                case 'refunded':
                    stats.refunded++;
                    break;
            }
        });

        return stats;
    }
}

module.exports = new BillingService();
