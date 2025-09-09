import api from './api';

const clientService = {
    getAll: () => api.get('/clients'),
    getClient: (clientId) => api.get(`/clients/${clientId}`),
    createClient: (clientData) => api.post('/clients', clientData),
    updateClient: (clientId, clientData) => api.put(`/clients/${clientId}`, clientData),
    deleteClient: (clientId) => api.delete(`/clients/${clientId}`),

    // Additional client-related functions
    addInteraction: (clientId, interactionData) => api.post(`/clients/${clientId}/interactions`, interactionData),
    updateStatus: (clientId, status) => api.put(`/clients/${clientId}/status`, { status }),
    getClientStats: (clientId) => api.get(`/clients/${clientId}/stats`),
    searchClients: (searchTerm) => api.get(`/clients/search?q=${searchTerm}`),

    // Helper functions for client data formatting and validation
    formatClientName: (client) => {
        if (!client) return '';
        return `${client.firstName || ''} ${client.lastName || ''}`.trim();
    },

    formatClientPhone: (phone) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.startsWith('05') && digits.length === 10) {
            return `${digits.substring(0, 3)}-${digits.substring(3, 10)}`;
        }
        return phone; // Return as is if not a standard Israeli mobile
    },

    validateIsraeliId: (id) => {
        if (!id || typeof id !== 'string' || !/^\d{9}$/.test(id)) {
            return false;
        }
        const digits = id.split('').map(Number);
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            let inc = digits[i] * ((i % 2) + 1);
            if (inc > 9) inc -= 9;
            sum += inc;
        }
        return sum % 10 === 0;
    },

    validateEmail: (email) => {
        if (!email) return false;
        return /^\S+@\S+\.\S+$/.test(email);
    },

    validatePhone: (phone) => {
        if (!phone) return false;
        const normalized = phone.replace(/[\s-]/g, '');
        return /^(972|0)?5\d{8}$/.test(normalized) || /^(972|0)?\d{8,10}$/.test(normalized);
    },

    // Utility to clean form data before sending to API
    cleanClientFormData: (formData) => {
        const cleanedData = {};
        for (const key in formData) {
            const value = formData[key];
            // Filter out empty strings, nulls, and undefined for top-level fields
            if (value !== '' && value !== null && value !== undefined) {
                if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
                    // Recursively clean nested objects (e.g., emergencyContact)
                    const cleanedNested = Object.entries(value).reduce((acc, [nestedKey, nestedValue]) => {
                        if (nestedValue !== '' && nestedValue !== null && nestedValue !== undefined) {
                            acc[nestedKey] = nestedValue;
                        }
                        return acc;
                    }, {});
                    if (Object.keys(cleanedNested).length > 0) {
                        cleanedData[key] = cleanedNested;
                    }
                } else {
                    cleanedData[key] = value;
                }
            }
        }
        return cleanedData;
    }
};

export default clientService;