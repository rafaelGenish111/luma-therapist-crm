import api from './api';

const treatmentSessionService = {
    getAllForClient: (clientId) => api.get(`/treatment-sessions/client/${clientId}`),
    getById: (id) => api.get(`/treatment-sessions/${id}`),
    create: (sessionData) => api.post('/treatment-sessions', sessionData),
    update: (id, sessionData) => api.put(`/treatment-sessions/${id}`, sessionData),
    remove: (id) => api.delete(`/treatment-sessions/${id}`),
    getMetaLabels: () => api.get('/treatment-sessions/meta/labels'),
    getStatsForClient: (clientId) => api.get(`/treatment-sessions/client/${clientId}/stats`),
};

export default treatmentSessionService;