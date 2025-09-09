import api from './api';

const healthDeclarationService = {
    // יצירת הצהרה חדשה (פומבית)
    create: (data) => api.post('/health-declarations/public', data),
    // שליפה לפי לקוח ספציפי (לשימוש בטאבים)
    getByClient: (clientId) => api.get('/health-declarations', { params: { clientId } }),
    // שליחה פומבית (ללא טוקן)
    submitPublic: (data) => api.post('/public/health-declaration', data),
    // שליפת כל ההצהרות (למטפלת)
    getAll: (params = {}) => api.get('/health-declarations', { params }),
    // שליפת תבניות פעילות (מהסופר־אדמין)
    getTemplates: () => api.get('/health-declaration-templates'),
    // שליפת הצהרה בודדת
    getById: (id) => api.get(`/health-declarations/${id}`),
    // עדכון סטטוס/הערות
    updateStatus: (id, data) => api.put(`/health-declarations/${id}/status`, data),
    // מחיקה
    delete: (id) => api.delete(`/health-declarations/${id}`),
};

export default healthDeclarationService; 