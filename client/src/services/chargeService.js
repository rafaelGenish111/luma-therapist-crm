import api from './api';

const chargeService = {
    getByClient: async (clientId, { status } = {}) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        const res = await api.get(`/charges/clients/${clientId}?${params.toString()}`);
        // ה-API מחזיר את הנתונים ישירות, לא עטוף ב-data
        return res;
    },

    ensureForAppointment: async (appointmentId) => {
        const res = await api.post(`/charges/appointments/${appointmentId}/ensure`);
        // ה-API מחזיר את הנתונים ישירות, לא עטוף ב-data
        return res;
    }
};

export default chargeService;


