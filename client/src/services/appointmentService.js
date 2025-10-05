import api from './api';

class AppointmentService {
    /**
     * קבלת פגישות של לקוח
     * @param {string} clientId - מזהה הלקוח
     * @param {Object} options - אפשרויות סינון
     * @returns {Promise<Object>} נתוני הפגישות
     */
    async getByClient(clientId, options = {}) {
        const params = new URLSearchParams();

        if (options.scope) params.append('scope', options.scope);
        if (options.limit) params.append('limit', options.limit);
        if (options.page) params.append('page', options.page);

        try {
            const response = await api.get(`/appointments/clients/${clientId}/appointments?${params.toString()}`);
            console.log('📅 getByClient raw response:', response);
            console.log('📅 getByClient response.data:', response.data);
            // axios מחזיר את הנתונים ב-response.data
            return response.data || { appointments: [], stats: {} };
        } catch (error) {
            console.error('Error fetching appointments:', error);
            return { appointments: [], stats: {} };
        }
    }

    /**
     * יצירת פגישה חדשה
     * @param {Object} appointmentData - פרטי הפגישה
     * @returns {Promise<Object>} הפגישה שנוצרה
     */
    async create(appointmentData) {
        const response = await api.post('/appointments', appointmentData);
        return response.data;
    }

    /**
     * עדכון פגישה
     * @param {string} appointmentId - מזהה הפגישה
     * @param {Object} updateData - נתונים לעדכון
     * @returns {Promise<Object>} הפגישה המעודכנת
     */
    async update(appointmentId, updateData) {
        const response = await api.put(`/appointments/${appointmentId}`, updateData);
        return response.data;
    }

    /**
     * מחיקת פגישה
     * @param {string} appointmentId - מזהה הפגישה
     * @returns {Promise<Object>} תוצאת המחיקה
     */
    async delete(appointmentId) {
        const response = await api.delete(`/appointments/${appointmentId}`);
        return response.data;
    }

    /**
     * קבלת פגישה ספציפית
     * @param {string} appointmentId - מזהה הפגישה
     * @returns {Promise<Object>} פרטי הפגישה
     */
    async getById(appointmentId) {
        const response = await api.get(`/appointments/${appointmentId}`);
        return response.data;
    }

    /**
     * קבלת כל הפגישות של המטפלת
     * @param {Object} options - אפשרויות סינון
     * @returns {Promise<Object>} רשימת הפגישות
     */
    async getAll(options = {}) {
        const params = new URLSearchParams();

        if (options.status) params.append('status', options.status);
        if (options.dateFrom) params.append('dateFrom', options.dateFrom);
        if (options.dateTo) params.append('dateTo', options.dateTo);
        if (options.limit) params.append('limit', options.limit);
        if (options.page) params.append('page', options.page);

        const response = await api.get('/appointments');
        return response.data;
    }

    /**
     * קבלת צבע לסטטוס פגישה
     * @param {string} status - סטטוס הפגישה
     * @returns {string} צבע
     */
    getStatusColor(status) {
        switch (status) {
            case 'scheduled':
                return 'info';
            case 'confirmed':
                return 'primary';
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'error';
            case 'no_show':
                return 'warning';
            default:
                return 'default';
        }
    }

    /**
     * קבלת תווית לסטטוס פגישה
     * @param {string} status - סטטוס הפגישה
     * @returns {string} תווית
     */
    getStatusLabel(status) {
        switch (status) {
            case 'scheduled':
                return 'מתוכננת';
            case 'confirmed':
                return 'מאושרת';
            case 'completed':
                return 'הושלמה';
            case 'cancelled':
                return 'בוטלה';
            case 'no_show':
                return 'לא הגיע';
            default:
                return status;
        }
    }

    /**
     * קבלת צבע לסטטוס תשלום
     * @param {string} paymentStatus - סטטוס התשלום
     * @returns {string} צבע
     */
    getPaymentStatusColor(paymentStatus) {
        switch (paymentStatus) {
            case 'not_required':
                return 'default';
            case 'pending':
                return 'warning';
            case 'paid':
                return 'success';
            case 'failed':
                return 'error';
            default:
                return 'default';
        }
    }

    /**
     * קבלת תווית לסטטוס תשלום
     * @param {string} paymentStatus - סטטוס התשלום
     * @returns {string} תווית
     */
    getPaymentStatusLabel(paymentStatus) {
        switch (paymentStatus) {
            case 'not_required':
                return 'לא נדרש';
            case 'pending':
                return 'ממתין';
            case 'paid':
                return 'שולם';
            case 'failed':
                return 'נכשל';
            default:
                return paymentStatus;
        }
    }

    /**
     * פורמט תאריך
     * @param {string} dateString - תאריך
     * @returns {string} תאריך מעוצב
     */
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * פורמט זמן
     * @param {string} dateString - תאריך
     * @returns {string} זמן מעוצב
     */
    formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * בדיקה אם פגישה היא בעתיד
     * @param {string} dateString - תאריך הפגישה
     * @returns {boolean} true אם הפגישה בעתיד
     */
    isUpcoming(dateString) {
        return new Date(dateString) > new Date();
    }

    /**
     * בדיקה אם פגישה היא בעבר
     * @param {string} dateString - תאריך הפגישה
     * @returns {boolean} true אם הפגישה בעבר
     */
    isPast(dateString) {
        return new Date(dateString) < new Date();
    }
}

export default new AppointmentService(); 