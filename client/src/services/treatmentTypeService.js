import api from './api';

class TreatmentTypeService {
    /**
     * קבלת כל סוגי הטיפולים של מטפל (ציבורי)
     */
    async getByTherapist(therapistId) {
        try {
            const response = await api.get(`/treatment-types/therapist/${therapistId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching treatment types:', error);
            throw error;
        }
    }

    /**
     * קבלת כל סוגי הטיפולים של המטפל המחובר (פרטי)
     */
    async getAll() {
        try {
            const response = await api.get('/treatment-types');
            return response.data;
        } catch (error) {
            console.error('Error fetching treatment types:', error);
            throw error;
        }
    }

    /**
     * יצירת סוג טיפול חדש
     */
    async create(treatmentTypeData) {
        try {
            const response = await api.post('/treatment-types', treatmentTypeData);
            return response.data;
        } catch (error) {
            console.error('Error creating treatment type:', error);
            throw error;
        }
    }

    /**
     * עדכון סוג טיפול
     */
    async update(id, treatmentTypeData) {
        try {
            const response = await api.put(`/treatment-types/${id}`, treatmentTypeData);
            return response.data;
        } catch (error) {
            console.error('Error updating treatment type:', error);
            throw error;
        }
    }

    /**
     * מחיקת סוג טיפול
     */
    async delete(id) {
        try {
            const response = await api.delete(`/treatment-types/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting treatment type:', error);
            throw error;
        }
    }

    /**
     * שינוי סדר של סוגי טיפולים
     */
    async reorder(id, sortOrder) {
        try {
            const response = await api.patch(`/treatment-types/${id}/reorder`, { sortOrder });
            return response.data;
        } catch (error) {
            console.error('Error reordering treatment type:', error);
            throw error;
        }
    }

    /**
     * המרת דקות לפורמט קריא
     */
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours === 0) {
            return `${mins} דקות`;
        } else if (mins === 0) {
            return `${hours} שעות`;
        } else {
            return `${hours} שעות ${mins} דקות`;
        }
    }

    /**
     * המרת מחיר לפורמט קריא
     */
    formatPrice(price, currency = 'ILS') {
        return `${price} ${currency}`;
    }

    /**
     * יצירת סוגי טיפולים ברירת מחדל
     */
    getDefaultTreatmentTypes() {
        return [
            {
                name: 'פגישת יעוץ ראשונית',
                description: 'מתאים לפגישה הכרויות ראשונה',
                duration: 60,
                price: 300,
                currency: 'ILS',
                color: '#4A90E2'
            },
            {
                name: 'פגישת טיפול',
                description: 'מתאים למעקב וטיפול מתמשך',
                duration: 50,
                price: 250,
                currency: 'ILS',
                color: '#F5A623'
            },
            {
                name: 'פגישת המשך',
                description: 'מתאים למעקב וטיפול מתמשך',
                duration: 45,
                price: 200,
                currency: 'ILS',
                color: '#7ED321'
            }
        ];
    }
}

export default new TreatmentTypeService();


