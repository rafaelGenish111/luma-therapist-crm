import api from './api';

const chargeService = {
    getByClient: async (clientId, { status } = {}) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        const res = await api.get(`/charges/clients/${clientId}?${params.toString()}`);
        return res.data;
    },

    ensureForAppointment: async (appointmentId) => {
        const res = await api.post(`/charges/appointments/${appointmentId}/ensure`);
        return res.data;
    }
};

export default chargeService;


