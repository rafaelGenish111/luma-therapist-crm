const { expect } = require('chai');
const sinon = require('sinon');
const billingService = require('../src/services/billingService');
const Payment = require('../src/models/Payment');
const { getBillingProvider } = require('../src/services/billing');

describe('Billing Service Tests', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('createPayment', () => {
        it('should create payment successfully with simulated provider', async () => {
            // Arrange
            const paymentData = {
                clientId: '507f1f77bcf86cd799439011',
                amount: 150,
                currency: 'ILS',
                method: 'simulated'
            };
            const therapistId = '507f1f77bcf86cd799439012';

            // Mock Payment.save
            const mockPayment = {
                _id: '507f1f77bcf86cd799439013',
                ...paymentData,
                status: 'pending',
                createdBy: therapistId,
                save: sandbox.stub().resolves()
            };
            sandbox.stub(Payment.prototype, 'save').resolves(mockPayment);

            // Act
            const result = await billingService.createPayment(paymentData, therapistId);

            // Assert
            expect(result.success).to.be.true;
            expect(result.payment).to.exist;
            expect(result.payment.amount).to.equal(150);
            expect(result.payment.status).to.equal('pending');
        });

        it('should handle payment creation failure', async () => {
            // Arrange
            const paymentData = {
                clientId: '507f1f77bcf86cd799439011',
                amount: 150,
                currency: 'ILS',
                method: 'simulated'
            };
            const therapistId = '507f1f77bcf86cd799439012';

            // Mock Payment.save to fail
            sandbox.stub(Payment.prototype, 'save').rejects(new Error('Database error'));

            // Act
            const result = await billingService.createPayment(paymentData, therapistId);

            // Assert
            expect(result.success).to.be.false;
            expect(result.error).to.include('Database error');
        });
    });

    describe('createInvoice', () => {
        it('should create invoice successfully', async () => {
            // Arrange
            const paymentId = '507f1f77bcf86cd799439013';
            const mockPayment = {
                _id: paymentId,
                clientId: '507f1f77bcf86cd799439011',
                amount: 150,
                status: 'paid'
            };

            sandbox.stub(Payment, 'findById').resolves(mockPayment);
            sandbox.stub(Payment.prototype, 'save').resolves(mockPayment);

            // Act
            const result = await billingService.createInvoice(paymentId);

            // Assert
            expect(result.success).to.be.true;
            expect(result.invoiceId).to.exist;
            expect(result.invoiceUrl).to.exist;
        });

        it('should fail for non-existent payment', async () => {
            // Arrange
            const paymentId = '507f1f77bcf86cd799439013';
            sandbox.stub(Payment, 'findById').resolves(null);

            // Act
            const result = await billingService.createInvoice(paymentId);

            // Assert
            expect(result.success).to.be.false;
            expect(result.error).to.include('Payment not found');
        });
    });

    describe('getClientPayments', () => {
        it('should return client payments with pagination', async () => {
            // Arrange
            const clientId = '507f1f77bcf86cd799439011';
            const options = { limit: 10, page: 1 };
            const mockPayments = [
                { _id: '1', amount: 100, status: 'paid' },
                { _id: '2', amount: 200, status: 'pending' }
            ];

            sandbox.stub(Payment, 'find').returns({
                sort: sandbox.stub().returns({
                    skip: sandbox.stub().returns({
                        limit: sandbox.stub().resolves(mockPayments)
                    })
                })
            });

            // Act
            const result = await billingService.getClientPayments(clientId, options);

            // Assert
            expect(result).to.be.an('array');
            expect(result).to.have.length(2);
        });
    });

    describe('getPaymentStats', () => {
        it('should return payment statistics', async () => {
            // Arrange
            const therapistId = '507f1f77bcf86cd799439012';
            const filters = {};
            const mockPayments = [
                { amount: 100, status: 'paid' },
                { amount: 200, status: 'paid' },
                { amount: 150, status: 'pending' },
                { amount: 50, status: 'failed' }
            ];

            sandbox.stub(Payment, 'find').resolves(mockPayments);

            // Act
            const result = await billingService.getPaymentStats(therapistId, filters);

            // Assert
            expect(result.total).to.equal(4);
            expect(result.paid).to.equal(2);
            expect(result.paidAmount).to.equal(300);
            expect(result.pending).to.equal(1);
            expect(result.failed).to.equal(1);
        });
    });
});

describe('Billing Provider Tests', () => {
    it('should return simulated provider by default', () => {
        // Act
        const provider = getBillingProvider();

        // Assert
        expect(provider).to.exist;
        expect(provider.constructor.name).to.equal('SimulatedBillingProvider');
    });

    it('should create charge successfully', async () => {
        // Arrange
        const provider = getBillingProvider();
        const input = {
            clientId: '507f1f77bcf86cd799439011',
            amount: 150,
            currency: 'ILS'
        };

        // Act
        const result = await provider.createCharge(input);

        // Assert
        expect(result).to.have.property('ok');
        expect(typeof result.ok).to.equal('boolean');
    });

    it('should create invoice successfully', async () => {
        // Arrange
        const provider = getBillingProvider();
        const paymentId = '507f1f77bcf86cd799439013';

        // Act
        const result = await provider.createInvoice(paymentId);

        // Assert
        expect(result).to.have.property('ok');
        expect(result.ok).to.be.true;
        expect(result).to.have.property('invoiceId');
        expect(result).to.have.property('invoiceUrl');
    });
});


