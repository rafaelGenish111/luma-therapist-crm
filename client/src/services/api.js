import apiClient from '../config/api.js';

// Auth Services
export const authApi = {
    login: (credentials) => apiClient.post('/api/auth/login', credentials),
    register: (userData) => apiClient.post('/api/auth/register', userData),
    logout: () => apiClient.post('/api/auth/logout'),
    profile: () => apiClient.get('/api/auth/me'),
    refreshToken: () => apiClient.post('/api/auth/refresh'),
};

// Therapists Services
export const therapistsApi = {
    getAll: () => apiClient.get('/api/therapists'),
    getById: (id) => apiClient.get(`/api/therapists/${id}`),
    create: (data) => apiClient.post('/api/therapists', data),
    update: (id, data) => apiClient.put(`/api/therapists/${id}`, data),
    delete: (id) => apiClient.delete(`/api/therapists/${id}`),
};

// Clients Services
export const clientsApi = {
    getAll: () => apiClient.get('/api/clients'),
    getById: (id) => apiClient.get(`/api/clients/${id}`),
    create: (data) => apiClient.post('/api/clients', data),
    update: (id, data) => apiClient.put(`/api/clients/${id}`, data),
    delete: (id) => apiClient.delete(`/api/clients/${id}`),
};

// Appointments Services
export const appointmentsApi = {
    getAll: () => apiClient.get('/api/appointments'),
    getById: (id) => apiClient.get(`/api/appointments/${id}`),
    create: (data) => apiClient.post('/api/appointments', data),
    update: (id, data) => apiClient.put(`/api/appointments/${id}`, data),
    delete: (id) => apiClient.delete(`/api/appointments/${id}`),
};

// Campaigns Services
export const campaignsApi = {
    getAll: () => apiClient.get('/api/campaigns'),
    getById: (id) => apiClient.get(`/api/campaigns/${id}`),
    create: (data) => apiClient.post('/api/campaigns', data),
    update: (id, data) => apiClient.put(`/api/campaigns/${id}`, data),
    delete: (id) => apiClient.delete(`/api/campaigns/${id}`),
    send: (id) => apiClient.post(`/api/campaigns/${id}/send`),
    getStats: (id) => apiClient.get(`/api/campaigns/${id}/stats`),

    // Templates
    createTemplate: (data) => apiClient.post('/api/campaigns/templates', data),
    updateTemplate: (id, data) => apiClient.put(`/api/campaigns/templates/${id}`, data),
    deleteTemplate: (id) => apiClient.delete(`/api/campaigns/templates/${id}`),

    // Client Lists
    exportClientList: (data) => apiClient.post('/api/campaigns/client-lists/export', data),
    importClientList: (formData, options) => apiClient.post('/api/campaigns/client-lists/import', formData, options),
};

// Health Check
export const healthApi = {
    check: () => apiClient.get('/api/health'),
};

// Default export עם כל הAPIים
export default {
    auth: authApi,
    therapists: therapistsApi,
    clients: clientsApi,
    appointments: appointmentsApi,
    campaigns: campaignsApi,
    health: healthApi,
}; 