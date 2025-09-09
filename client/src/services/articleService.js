import api from './api';

const articleService = {
    // קבלת כל המאמרים של המטפלת
    getAll: () => api.get('/articles'),

    // קבלת מאמרים פומביים
    getPublic: (params = {}) => api.get('/articles/public', { params }),

    // קבלת מאמר לפי slug
    getBySlug: (slug) => api.get(`/articles/${slug}`),

    // יצירת מאמר חדש
    create: (formData) => api.post('/articles', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),

    // עדכון מאמר
    update: (id, data) => api.put(`/articles/${id}`, data),

    // מחיקת מאמר
    delete: (id) => api.delete(`/articles/${id}`),

    // פרסום/ביטול פרסום מאמר
    togglePublish: (id) => api.put(`/articles/${id}/publish`),

    // קבלת קטגוריות
    getCategories: () => api.get('/articles/categories')
};

export default articleService; 