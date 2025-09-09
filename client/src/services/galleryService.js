import api from './api';

const galleryService = {
    // קבלת כל התמונות של המטפלת
    getAll: () => api.get('/gallery'),

    // קבלת גלריה פומבית
    getPublic: (therapistId, category = null) => {
        const params = category ? { category } : {};
        return api.get(`/gallery/public/${therapistId}`, { params });
    },

    // הוספת תמונה חדשה
    create: (formData) => api.post('/gallery', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),

    // עדכון תמונה
    update: (id, data) => api.put(`/gallery/${id}`, data),

    // מחיקת תמונה
    delete: (id) => api.delete(`/gallery/${id}`),

    // הפעלה/כיבוי תמונה
    toggle: (id) => api.put(`/gallery/${id}/toggle`),

    // קבלת קטגוריות
    getCategories: () => api.get('/gallery/categories')
};

export default galleryService; 