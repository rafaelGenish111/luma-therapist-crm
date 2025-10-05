import api from './api';

const chargeService = {
    getByClient: async (clientId, { status } = {}) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        const res = await api.get(`/charges/clients/${clientId}?${params.toString()}`);
        console.log('💰 chargeService.getByClient response:', res);
        // axios מחזיר את הנתונים ב-response.data
        return res.data;
    },

    ensureForAppointment: async (appointmentId) => {
        const res = await api.post(`/charges/appointments/${appointmentId}/ensure`);
        console.log('💰 chargeService.ensureForAppointment response:', res);
        // axios מחזיר את הנתונים ב-response.data
        return res.data;
    }
};

export default chargeService;


