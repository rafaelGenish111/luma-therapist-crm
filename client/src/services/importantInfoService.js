import api from './api';

class ImportantInfoService {
    /**
     * קבלת מידע חשוב של מטפל (ציבורי)
     */
    async getByTherapist(therapistId) {
        try {
            const response = await api.get(`/important-info/therapist/${therapistId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching important info:', error);
            throw error;
        }
    }

    /**
     * קבלת מידע חשוב של המטפל המחובר (פרטי)
     */
    async getAll() {
        try {
            const response = await api.get('/important-info');
            return response.data;
        } catch (error) {
            console.error('Error fetching important info:', error);
            throw error;
        }
    }

    /**
     * עדכון מידע חשוב
     */
    async update(data) {
        try {
            const response = await api.put('/important-info', data);
            return response.data;
        } catch (error) {
            console.error('Error updating important info:', error);
            throw error;
        }
    }

    /**
     * הוספת פריט חדש
     */
    async addItem(text) {
        try {
            const response = await api.post('/important-info/items', { text });
            return response.data;
        } catch (error) {
            console.error('Error adding important info item:', error);
            throw error;
        }
    }

    /**
     * עדכון פריט
     */
    async updateItem(itemId, text) {
        try {
            const response = await api.put(`/important-info/items/${itemId}`, { text });
            return response.data;
        } catch (error) {
            console.error('Error updating important info item:', error);
            throw error;
        }
    }

    /**
     * מחיקת פריט
     */
    async deleteItem(itemId) {
        try {
            const response = await api.delete(`/important-info/items/${itemId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting important info item:', error);
            throw error;
        }
    }

    /**
     * שינוי סדר של פריטים
     */
    async reorderItem(itemId, sortOrder) {
        try {
            const response = await api.patch(`/important-info/items/${itemId}/reorder`, { sortOrder });
            return response.data;
        } catch (error) {
            console.error('Error reordering important info item:', error);
            throw error;
        }
    }

    /**
     * יצירת מידע ברירת מחדל
     */
    getDefaultImportantInfo() {
        return {
            title: 'מידע חשוב',
            items: [
                { text: 'ביטול פגישה - עד 24 שעות מראש', sortOrder: 1 },
                { text: 'תשלום במזומן או העברה בנקאית', sortOrder: 2 },
                { text: 'פגישות זמינות ימים א\'-ה\' 9:00-17:00', sortOrder: 3 },
                { text: 'אפשרות לפגישות בזום לפי בקשה', sortOrder: 4 }
            ]
        };
    }
}

export default new ImportantInfoService();


