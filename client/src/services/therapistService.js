import api, { therapistsApi } from './api';

// קבלת פרופיל המטפלת
export const getTherapistProfile = async () => {
    try {
        const response = await therapistsApi.getProfile();
        return response.data.data; // response.data הוא {success: true, data: {...}}
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// עדכון פרופיל המטפלת
export const updateTherapistProfile = async (profileData) => {
    try {
        const response = await api.put('/therapists/profile', profileData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// עדכון מצב אתר אישי (הדלקה/כיבוי)
export const setWebsiteActiveState = async (isActive) => {
    try {
        const response = await api.put('/therapists/profile', { website: { isActive } });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// העלאת תמונת פרופיל
export const uploadProfileImage = async (imageFile) => {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await api.post('/therapists/profile/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// מחיקת תמונת פרופיל
export const deleteProfileImage = async () => {
    try {
        const response = await therapistsApi.deleteProfileImage();
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// טעינת עיצוב אישי של המטפלת המחוברת
export const getOwnTheme = async () => {
    const response = await therapistsApi.getProfile();
    return response.data.theme;
};

// עדכון עיצוב אישי של המטפלת המחוברת
export const updateOwnTheme = async (theme) => {
    const response = await api.put('/therapists/profile/theme', theme);
    return response.data;
};

// טעינת עיצוב ציבורי לפי מזהה מטפלת
export const getPublicTheme = async (therapistId) => {
    const response = await api.get(`/therapists/${therapistId}/theme`);
    return response.data.data;
};

// העלאת תמונת קליניקה
export const uploadClinicImage = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await api.post('/therapists/profile/clinic-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

// מחיקת תמונת קליניקה
export const deleteClinicImage = async () => {
    const response = await therapistsApi.deleteClinicImage();
    return response.data;
};

// עדכון קישור Calendly
export const updateCalendlyLink = async (calendlyUrl) => {
    try {
        const response = await api.put('/therapists/calendly-link', { calendlyUrl });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}; 