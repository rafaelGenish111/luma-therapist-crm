import apiClient from '../config/api.js';

// Auth Services
export const authApi = {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    register: (userData) => apiClient.post('/auth/register', userData),
    logout: () => apiClient.post('/auth/logout'),
    profile: () => apiClient.get('/auth/me'),
    refreshToken: () => apiClient.post('/auth/refresh'),
};

// Therapists Services
export const therapistsApi = {
    getAll: () => apiClient.get('/therapists'),
    getById: (id) => apiClient.get(`/therapists/${id}`),
    getProfile: () => apiClient.get('/therapists/profile'),
    create: (data) => apiClient.post('/therapists', data),
    update: (id, data) => apiClient.put(`/therapists/${id}`, data),
    delete: (id) => apiClient.delete(`/therapists/${id}`),
    deleteProfileImage: () => apiClient.delete('/therapists/profile/image'),
    deleteClinicImage: () => apiClient.delete('/therapists/profile/clinic-image'),
    updateRevenueTarget: (monthlyRevenueTarget) => apiClient.put('/therapists/revenue-target', { monthlyRevenueTarget })
};

// Clients Services
export const clientsApi = {
    getAll: () => apiClient.get('/clients'),
    getById: (id) => apiClient.get(`/clients/${id}`),
    create: (data) => apiClient.post('/clients', data),
    update: (id, data) => apiClient.put(`/clients/${id}`, data),
    delete: (id) => apiClient.delete(`/clients/${id}`),
};

// Appointments Services
export const appointmentsApi = {
    getAll: () => apiClient.get('/appointments'),
    getById: (id) => apiClient.get(`/appointments/${id}`),
    create: (data) => apiClient.post('/appointments', data),
    update: (id, data) => apiClient.put(`/appointments/${id}`, data),
    delete: (id) => apiClient.delete(`/appointments/${id}`),
};

// Campaigns Services
export const campaignsApi = {
    getAll: () => apiClient.get('/campaigns'),
    getById: (id) => apiClient.get(`/campaigns/${id}`),
    create: (data) => apiClient.post('/campaigns', data),
    update: (id, data) => apiClient.put(`/campaigns/${id}`, data),
    delete: (id) => apiClient.delete(`/campaigns/${id}`),
    send: (id) => apiClient.post(`/campaigns/${id}/send`),
    getStats: (id) => apiClient.get(`/campaigns/${id}/stats`),

    // Templates
    createTemplate: (data) => apiClient.post('/campaigns/templates', data),
    updateTemplate: (id, data) => apiClient.put(`/campaigns/templates/${id}`, data),
    deleteTemplate: (id) => apiClient.delete(`/campaigns/templates/${id}`),

    // Client Lists
    exportClientList: (data) => apiClient.post('/campaigns/client-lists/export', data),
    importClientList: (formData, options) => apiClient.post('/campaigns/client-lists/import', formData, options),
};

// Health Check
export const healthApi = {
    check: () => apiClient.get('/health'),
};

// Default export עם כל הAPIים
export default {
    auth: authApi,
    therapists: therapistsApi,
    clients: clientsApi,
    appointments: appointmentsApi,
    campaigns: campaignsApi,
    health: healthApi,

    // Direct API methods for backward compatibility
    get: (endpoint, options) => apiClient.get(endpoint.startsWith('/api') ? endpoint.slice(4) : endpoint, options),
    post: (endpoint, data, options) => apiClient.post(endpoint.startsWith('/api') ? endpoint.slice(4) : endpoint, data, options),
    put: (endpoint, data, options) => apiClient.put(endpoint.startsWith('/api') ? endpoint.slice(4) : endpoint, data, options),
    delete: (endpoint, options) => apiClient.delete(endpoint.startsWith('/api') ? endpoint.slice(4) : endpoint, options),
    patch: (endpoint, data, options) => apiClient.patch(endpoint.startsWith('/api') ? endpoint.slice(4) : endpoint, data, options),
}; 