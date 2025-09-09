import api from './api';

class CommunicationService {
    /**
     * קבלת היסטוריית תקשורת של לקוח
     * @param {string} clientId - מזהה הלקוח
     * @param {Object} options - אפשרויות סינון
     * @returns {Promise<Object>} נתוני התקשורת
     */
    async getByClient(clientId, options = {}) {
        const params = new URLSearchParams();

        if (options.channel) params.append('channel', options.channel);
        if (options.direction) params.append('direction', options.direction);
        if (options.status) params.append('status', options.status);
        if (options.dateFrom) params.append('dateFrom', options.dateFrom);
        if (options.dateTo) params.append('dateTo', options.dateTo);
        if (options.limit) params.append('limit', options.limit);
        if (options.page) params.append('page', options.page);

        const response = await api.get(`/communications/clients/${clientId}?${params.toString()}`);
        return response.data;
    }

    /**
     * שליחת הודעה ללקוח
     * @param {string} clientId - מזהה הלקוח
     * @param {Object} data - פרטי ההודעה
     * @returns {Promise<Object>} תוצאת השליחה
     */
    async sendMessage(clientId, data) {
        const response = await api.post(`/communications/clients/${clientId}/communications`, data);
        return response.data;
    }

    /**
     * קבלת הודעות שנכשלו
     * @param {Object} options - אפשרויות סינון
     * @returns {Promise<Object>} הודעות שנכשלו
     */
    async getFailed(options = {}) {
        const params = new URLSearchParams();

        if (options.channel) params.append('channel', options.channel);
        if (options.dateFrom) params.append('dateFrom', options.dateFrom);
        if (options.dateTo) params.append('dateTo', options.dateTo);
        if (options.limit) params.append('limit', options.limit);
        if (options.page) params.append('page', options.page);

        const response = await api.get(`/communications/failed?${params.toString()}`);
        return response.data;
    }

    /**
     * ניסיון חוזר לשליחת הודעה
     * @param {string} communicationId - מזהה ההודעה
     * @returns {Promise<Object>} תוצאת הניסיון החוזר
     */
    async retryMessage(communicationId) {
        const response = await api.post(`/communications/${communicationId}/retry`);
        return response.data;
    }

    /**
     * קבלת סטטיסטיקות תקשורת
     * @param {Object} options - אפשרויות סינון
     * @returns {Promise<Object>} סטטיסטיקות
     */
    async getStats(options = {}) {
        const params = new URLSearchParams();

        if (options.dateFrom) params.append('dateFrom', options.dateFrom);
        if (options.dateTo) params.append('dateTo', options.dateTo);

        const response = await api.get(`/communications/stats?${params.toString()}`);
        return response.data;
    }

    /**
     * קבלת צבע לערוץ תקשורת
     * @param {string} channel - ערוץ התקשורת
     * @returns {string} צבע
     */
    getChannelColor(channel) {
        switch (channel) {
            case 'email':
                return 'primary';
            case 'sms':
                return 'secondary';
            case 'whatsapp':
                return 'success';
            default:
                return 'default';
        }
    }

    /**
     * קבלת תווית לערוץ תקשורת
     * @param {string} channel - ערוץ התקשורת
     * @returns {string} תווית
     */
    getChannelLabel(channel) {
        switch (channel) {
            case 'email':
                return 'אימייל';
            case 'sms':
                return 'SMS';
            case 'whatsapp':
                return 'WhatsApp';
            default:
                return channel;
        }
    }

    /**
     * קבלת צבע לסטטוס
     * @param {string} status - סטטוס ההודעה
     * @returns {string} צבע
     */
    getStatusColor(status) {
        switch (status) {
            case 'queued':
                return 'warning';
            case 'sent':
                return 'info';
            case 'delivered':
                return 'success';
            case 'failed':
                return 'error';
            default:
                return 'default';
        }
    }

    /**
     * קבלת תווית לסטטוס
     * @param {string} status - סטטוס ההודעה
     * @returns {string} תווית
     */
    getStatusLabel(status) {
        switch (status) {
            case 'queued':
                return 'בתור';
            case 'sent':
                return 'נשלח';
            case 'delivered':
                return 'נמסר';
            case 'failed':
                return 'נכשל';
            default:
                return status;
        }
    }
}

export default new CommunicationService();
