import api from './api';

class PaymentLinksService {
    async createPaymentLink(data) {
        try {
            const response = await api.post('/payment-links/create', data);
            return response.data;
        } catch (error) {
            console.error('Error creating payment link:', error);
            throw error;
        }
    }

    async getPaymentDetails(paymentLinkId) {
        try {
            const response = await api.get(`/payment-links/${paymentLinkId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching payment details:', error);
            throw error;
        }
    }

    async startPayment(paymentLinkId) {
        try {
            const response = await api.post('/payment-links/start', {
                paymentLinkId
            });
            return response.data;
        } catch (error) {
            console.error('Error starting payment:', error);
            throw error;
        }
    }

    async cancelPayment(paymentLinkId) {
        try {
            const response = await api.post('/payment-links/cancel', {
                paymentLinkId
            });
            return response.data;
        } catch (error) {
            console.error('Error canceling payment:', error);
            throw error;
        }
    }

    async getPaymentHealth() {
        try {
            const response = await api.get('/payment-health/health');
            return response.data;
        } catch (error) {
            console.error('Error checking payment health:', error);
            throw error;
        }
    }
}

export default new PaymentLinksService();
