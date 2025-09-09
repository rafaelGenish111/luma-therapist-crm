import api from './api';

const paymentService = {
    // קבלת כל התשלומים של מטפלת
    getAll: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
        if (filters.clientId) params.append('clientId', filters.clientId);

        return api.get(`/payments?${params.toString()}`);
    },

    // קבלת תשלומים של לקוח ספציפי
    getByClient: async (clientId, options = {}) => {
        const params = new URLSearchParams();

        if (options.limit) params.append('limit', options.limit);
        if (options.page) params.append('page', options.page);
        if (options.status) params.append('status', options.status);

        const response = await api.get(`/payments/clients/${clientId}/payments?${params.toString()}`);
        return response.data;
    },

    // קבלת תשלומים של פגישה ספציפית
    getByAppointment: async (appointmentId) => {
        return api.get(`/payments/appointment/${appointmentId}`);
    },

    // קבלת תשלום ספציפי
    getById: async (paymentId) => {
        return api.get(`/payments/${paymentId}`);
    },

    // יצירת תשלום חדש
    create: async (clientId, paymentData) => {
        const response = await api.post(`/payments/clients/${clientId}/payments`, paymentData);
        return response.data;
    },

    // עדכון תשלום
    update: async (paymentId, paymentData) => {
        return api.put(`/payments/${paymentId}`, paymentData);
    },

    // מחיקת תשלום
    delete: async (paymentId) => {
        return api.delete(`/payments/${paymentId}`);
    },

    // סימון תשלום כשולם
    markAsPaid: async (paymentId) => {
        return api.patch(`/payments/${paymentId}/mark-paid`);
    },

    // יצירת חשבונית
    generateInvoice: async (paymentId) => {
        const response = await api.post(`/payments/${paymentId}/invoice`);
        return response.data;
    },

    // הורדת חשבונית
    downloadInvoice: async (paymentId) => {
        return api.get(`/payments/${paymentId}/invoice/download`, {
            responseType: 'blob'
        });
    },

    // קבלת סטטיסטיקות תשלומים
    getStats: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);

        const response = await api.get(`/payments/stats?${params.toString()}`);
        return response.data;
    },

    // פורמט סכום
    formatAmount: (amount, currency = 'ILS') => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    // פורמט תאריך
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('he-IL');
    },

    // קבלת צבע סטטוס
    getStatusColor: (status) => {
        switch (status) {
            case 'paid':
                return 'success';
            case 'pending':
                return 'warning';
            case 'failed':
                return 'error';
            case 'refunded':
                return 'info';
            default:
                return 'default';
        }
    },

    // קבלת תרגום סטטוס
    getStatusLabel: (status) => {
        switch (status) {
            case 'paid':
                return 'שולם';
            case 'pending':
                return 'ממתין לתשלום';
            case 'failed':
                return 'נכשל';
            case 'refunded':
                return 'הוחזר';
            default:
                return status;
        }
    },

    // קבלת צבע שיטת תשלום
    getMethodColor: (method) => {
        switch (method) {
            case 'card':
                return 'primary';
            case 'cash':
                return 'success';
            case 'transfer':
                return 'info';
            case 'simulated':
                return 'warning';
            default:
                return 'default';
        }
    },

    // קבלת תרגום שיטת תשלום
    getMethodLabel: (method) => {
        switch (method) {
            case 'card':
                return 'כרטיס אשראי';
            case 'cash':
                return 'מזומן';
            case 'transfer':
                return 'העברה בנקאית';
            case 'simulated':
                return 'סימולציה';
            default:
                return method;
        }
    }
};

export default paymentService;
