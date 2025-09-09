import api from './api';

const documentService = {
    // קבלת מסמכים של לקוח
    getByClient: async (clientId, options = {}) => {
        const params = new URLSearchParams();
        if (options.type) params.append('type', options.type);
        if (options.isRequired !== undefined) params.append('isRequired', options.isRequired);
        if (options.isCompleted !== undefined) params.append('isCompleted', options.isCompleted);
        if (options.limit) params.append('limit', options.limit);
        if (options.page) params.append('page', options.page);
        return api.get(`/documents/clients/${clientId}/documents?${params.toString()}`);
    },

    // העלאת מסמך
    upload: async (clientId, file, metadata = {}) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('clientId', clientId);
        formData.append('type', metadata.type || 'other');
        formData.append('description', metadata.description || '');
        formData.append('isRequired', metadata.isRequired || false);

        return api.post(`/documents/clients/${clientId}/documents`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // הורדת מסמך
    download: async (documentId) => {
        return api.get(`/documents/${documentId}/download`, {
            responseType: 'blob'
        });
    },

    // מחיקת מסמך
    delete: async (documentId) => {
        return api.delete(`/documents/${documentId}`);
    },

    // עדכון פרטי מסמך
    update: async (documentId, metadata) => {
        return api.put(`/documents/${documentId}`, metadata);
    },

    // סימון מסמך כהשלם
    markAsCompleted: async (documentId) => {
        return api.patch(`/documents/${documentId}/status`, { isCompleted: true });
    },

    // קבלת תבניות מסמכים נדרשים
    getRequiredTemplates: async () => {
        return api.get('/documents/templates/required');
    },

    // יצירת מסמך מתבנית
    createFromTemplate: async (clientId, templateId, data = {}) => {
        return api.post('/documents/template', {
            clientId,
            templateId,
            data
        });
    },

    // קבלת סטטיסטיקות מסמכים
    getStats: async (clientId) => {
        return api.get(`/documents/stats/${clientId}`);
    },

    // פורמט גודל קובץ
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // קבלת אייקון סוג מסמך
    getTypeIcon: (type) => {
        switch (type) {
            case 'medical':
                return '🏥';
            case 'consent':
                return '📋';
            case 'invoice':
                return '🧾';
            case 'contract':
                return '📄';
            case 'image':
                return '🖼️';
            case 'pdf':
                return '📕';
            default:
                return '📎';
        }
    },

    // קבלת צבע סוג מסמך
    getTypeColor: (type) => {
        switch (type) {
            case 'health':
                return 'error';
            case 'consent':
                return 'warning';
            case 'report':
                return 'info';
            default:
                return 'default';
        }
    },

    // בדיקת הרחבת קובץ מותרת
    isAllowedFileType: (fileName) => {
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'];
        const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        return allowedExtensions.includes(extension);
    },

    // קבלת רשימת סוגי מסמכים
    getDocumentTypes: () => {
        return [
            { value: 'health', label: 'הצהרת בריאות' },
            { value: 'consent', label: 'טופס הסכמה' },
            { value: 'report', label: 'דוח רפואי' },
            { value: 'other', label: 'אחר' }
        ];
    }
};

export default documentService;
