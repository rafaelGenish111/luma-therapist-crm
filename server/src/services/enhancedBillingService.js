const Payment = require('../models/Payment');
const Charge = require('../models/Charge');
const Appointment = require('../models/Appointment');
const Client = require('../models/Client');
const { getBillingProvider } = require('./billing');

class EnhancedBillingService {
    constructor() {
        this.paymentProvider = getBillingProvider();
    }

    async processPayment(paymentData) {
        try {
            console.log('💳 Enhanced Billing Service - Processing payment:', {
                clientId: paymentData.clientId,
                amount: paymentData.amount,
                method: paymentData.method
            });

            // Validate client exists
            const client = await Client.findById(paymentData.clientId);
            if (!client) {
                throw new Error('Client not found');
            }

            // Prepare payment data for provider
            const providerPaymentData = {
                amount: paymentData.amount,
                currency: paymentData.currency || 'ILS',
                method: paymentData.method,
                description: paymentData.description || 'תשלום עבור טיפול',
                clientInfo: {
                    id: client._id,
                    name: client.firstName + ' ' + client.lastName,
                    email: client.email,
                    phone: client.phone,
                    address: client.address
                },
                cardData: paymentData.cardData,
                metadata: paymentData.metadata || {}
            };

            // Process payment with provider
            const paymentResult = await this.paymentProvider.createCharge(providerPaymentData);

            if (!paymentResult.ok) {
                // For simulation, we'll still create a payment record but mark it as failed
                const payment = new Payment({
                    clientId: paymentData.clientId,
                    amount: paymentData.amount,
                    currency: paymentData.currency || 'ILS',
                    method: paymentData.method === 'simulation' ? 'simulated' : paymentData.method,
                    status: 'failed',
                    transactionId: null,
                    createdBy: paymentData.therapistId,
                    meta: {
                        ...paymentData.metadata,
                        providerResponse: paymentResult.providerResponse,
                        error: paymentResult.error,
                        provider: this.paymentProvider.constructor.name
                    }
                });

                await payment.save();

                return {
                    success: false,
                    payment: payment,
                    error: paymentResult.error || 'Payment processing failed'
                };
            }

            // Create payment record in database
            const payment = new Payment({
                clientId: paymentData.clientId,
                amount: paymentData.amount,
                currency: paymentData.currency || 'ILS',
                method: paymentData.method === 'simulation' ? 'simulated' : paymentData.method,
                status: 'paid',
                transactionId: paymentResult.transactionId,
                createdBy: paymentData.therapistId,
                meta: {
                    ...paymentData.metadata,
                    providerResponse: paymentResult.providerResponse,
                    provider: this.paymentProvider.constructor.name
                }
            });

            await payment.save();

            // Update related charges
            if (paymentData.chargeIds && paymentData.chargeIds.length > 0) {
                await this.updateChargesAfterPayment(paymentData.chargeIds, payment._id, paymentResult.amount);
            }

            // Update appointment if specified
            if (paymentData.appointmentId) {
                await this.updateAppointmentAfterPayment(paymentData.appointmentId, payment._id);
            }

            console.log('💳 Enhanced Billing Service - Payment processed successfully:', {
                paymentId: payment._id,
                transactionId: paymentResult.transactionId,
                amount: paymentResult.amount
            });

            return {
                success: true,
                payment: payment,
                transactionId: paymentResult.transactionId,
                invoice: paymentResult.invoice,
                message: paymentResult.message
            };

        } catch (error) {
            console.error('💳 Enhanced Billing Service - Payment processing failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateChargesAfterPayment(chargeIds, paymentId, paymentAmount) {
        try {
            let remainingAmount = paymentAmount;

            for (const chargeId of chargeIds) {
                if (remainingAmount <= 0) break;

                const charge = await Charge.findById(chargeId);
                if (!charge) continue;

                const currentPaidAmount = charge.paidAmount || 0;
                const remainingChargeAmount = charge.amount - currentPaidAmount;
                const amountToApply = Math.min(remainingAmount, remainingChargeAmount);

                charge.paidAmount = currentPaidAmount + amountToApply;
                charge.payments.push(paymentId);

                // Update status based on payment
                if (charge.paidAmount >= charge.amount) {
                    charge.status = 'PAID';
                } else if (charge.paidAmount > 0) {
                    charge.status = 'PARTIALLY_PAID';
                }

                await charge.save();
                remainingAmount -= amountToApply;

                console.log('💳 Enhanced Billing Service - Updated charge:', {
                    chargeId: charge._id,
                    paidAmount: charge.paidAmount,
                    status: charge.status
                });
            }
        } catch (error) {
            console.error('Error updating charges after payment:', error);
        }
    }

    async updateAppointmentAfterPayment(appointmentId, paymentId) {
        try {
            const appointment = await Appointment.findById(appointmentId);
            if (appointment) {
                appointment.paymentId = paymentId;
                appointment.paymentStatus = 'paid';
                await appointment.save();

                console.log('💳 Enhanced Billing Service - Updated appointment payment status:', {
                    appointmentId: appointment._id,
                    paymentId: paymentId
                });
            }
        } catch (error) {
            console.error('Error updating appointment after payment:', error);
        }
    }

    async getPaymentHistory(clientId, options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                method,
                startDate,
                endDate
            } = options;

            const query = { clientId: clientId };

            if (status) query.status = status;
            if (method) query.method = method;
            if (startDate || endDate) {
                query.processedAt = {};
                if (startDate) query.processedAt.$gte = new Date(startDate);
                if (endDate) query.processedAt.$lte = new Date(endDate);
            }

            const payments = await Payment.find(query)
                .populate('client', 'firstName lastName email phone')
                .sort({ processedAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Payment.countDocuments(query);

            return {
                success: true,
                payments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting payment history:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getPaymentSummary(clientId) {
        try {
            const payments = await Payment.find({ clientId: clientId });
            
            const summary = {
                totalPayments: payments.length,
                totalAmount: 0,
                paidAmount: 0,
                pendingAmount: 0,
                byMethod: {},
                byStatus: {},
                recentPayments: []
            };

            payments.forEach(payment => {
                summary.totalAmount += payment.amount;
                
                if (payment.status === 'completed' || payment.status === 'paid') {
                    summary.paidAmount += payment.amount;
                } else {
                    summary.pendingAmount += payment.amount;
                }

                // Count by method
                summary.byMethod[payment.method] = (summary.byMethod[payment.method] || 0) + 1;
                
                // Count by status
                summary.byStatus[payment.status] = (summary.byStatus[payment.status] || 0) + 1;
            });

            // Get recent payments
            summary.recentPayments = payments
                .sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt))
                .slice(0, 5)
                .map(payment => ({
                    id: payment._id,
                    amount: payment.amount,
                    method: payment.method,
                    status: payment.status,
                    processedAt: payment.processedAt
                }));

            return {
                success: true,
                summary
            };
        } catch (error) {
            console.error('Error getting payment summary:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async refundPayment(paymentId, refundData) {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.status !== 'completed' && payment.status !== 'paid') {
                throw new Error('Only completed payments can be refunded');
            }

            // Process refund with provider
            const refundResult = await this.paymentProvider.refundPayment(
                payment.transactionId,
                refundData.amount || payment.amount,
                refundData.reason || 'Refund requested'
            );

            if (!refundResult.success) {
                throw new Error(refundResult.error || 'Refund processing failed');
            }

            // Update payment record
            payment.status = 'refunded';
            payment.refundedAmount = refundData.amount || payment.amount;
            payment.refundedAt = new Date();
            payment.refundReason = refundData.reason;
            payment.refundId = refundResult.refundId;

            await payment.save();

            // Update related charges
            await this.updateChargesAfterRefund(paymentId, refundData.amount || payment.amount);

            console.log('💳 Enhanced Billing Service - Refund processed:', {
                paymentId: payment._id,
                refundId: refundResult.refundId,
                amount: refundData.amount || payment.amount
            });

            return {
                success: true,
                refund: {
                    id: refundResult.refundId,
                    amount: refundData.amount || payment.amount,
                    status: refundResult.status,
                    processedAt: new Date()
                }
            };

        } catch (error) {
            console.error('Error processing refund:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateChargesAfterRefund(paymentId, refundAmount) {
        try {
            const charges = await Charge.find({ payments: paymentId });
            let remainingRefund = refundAmount;

            for (const charge of charges) {
                if (remainingRefund <= 0) break;

                const refundFromCharge = Math.min(remainingRefund, charge.paidAmount);
                charge.paidAmount -= refundFromCharge;
                charge.status = charge.paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING';
                
                await charge.save();
                remainingRefund -= refundFromCharge;
            }
        } catch (error) {
            console.error('Error updating charges after refund:', error);
        }
    }

    async getPaymentMethods() {
        return {
            success: true,
            methods: [
                {
                    id: 'simulation',
                    name: 'סימולציה',
                    description: 'תשלום סימולציה לבדיקות',
                    enabled: process.env.ENABLE_SIMULATION_PAYMENTS === 'true',
                    icon: '🧪'
                },
                {
                    id: 'credit_card',
                    name: 'כרטיס אשראי',
                    description: 'תשלום בכרטיס אשראי',
                    enabled: process.env.ENABLE_CREDIT_CARD_PAYMENTS === 'true',
                    icon: '💳'
                },
                {
                    id: 'cash',
                    name: 'מזומן',
                    description: 'תשלום במזומן',
                    enabled: process.env.ENABLE_CASH_PAYMENTS === 'true',
                    icon: '💵'
                },
                {
                    id: 'bank_transfer',
                    name: 'העברה בנקאית',
                    description: 'העברה בנקאית',
                    enabled: process.env.ENABLE_BANK_TRANSFER_PAYMENTS === 'true',
                    icon: '🏦'
                }
            ]
        };
    }

    async validatePaymentData(paymentData) {
        const errors = [];

        if (!paymentData.clientId) {
            errors.push('Client ID is required');
        }

        if (!paymentData.amount || paymentData.amount <= 0) {
            errors.push('Valid amount is required');
        }

        if (!paymentData.method) {
            errors.push('Payment method is required');
        }

        if (paymentData.method === 'credit_card' && !paymentData.cardData) {
            errors.push('Credit card data is required for credit card payments');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    async getPaymentStatus(transactionId) {
        try {
            const payment = await Payment.findOne({ transactionId });
            if (!payment) {
                throw new Error('Payment not found');
            }

            // Get fresh status from provider if needed
            const providerStatus = await this.paymentProvider.getPaymentStatus(transactionId);
            
            return {
                success: true,
                payment: {
                    id: payment._id,
                    transactionId: payment.transactionId,
                    amount: payment.amount,
                    currency: payment.currency,
                    method: payment.method,
                    status: payment.status,
                    processedAt: payment.processedAt,
                    providerStatus: providerStatus
                }
            };
        } catch (error) {
            console.error('Error getting payment status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new EnhancedBillingService();
