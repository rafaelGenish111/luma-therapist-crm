import api, { therapistsApi } from './api';

// קבלת פרופיל המטפלת
export const getTherapistProfile = async () => {
    try {
        const response = await therapistsApi.getProfile();
        console.log('Raw API response:', response);
        console.log('Response type:', typeof response);
        console.log('Response success:', response.success);
        console.log('Response data:', response.data);

        // אם התגובה לא מוצלחת
        if (!response.success) {
            console.log('API returned success: false, error:', response.error);
            throw new Error(response.error || 'שגיאה בטעינת פרופיל');
        }

        console.log('API returned success: true, checking data...');

        // אם אין נתונים או שהם ריקים
        if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
            console.log('No profile data found');
            return null;
        }

        console.log('Profile data found, returning:', response.data);
        return response.data; // response הוא {success: true, data: {...}}
    } catch (error) {
        console.error('getTherapistProfile error:', error);
        console.error('Error response:', error.response);
        console.error('Error message:', error.message);

        // אם השגיאה היא בגלל הודעת שגיאה מהשרת
        if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }

        throw error.response?.data || error.message || new Error('שגיאה לא ידועה');
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
        console.log('Uploading profile image:', imageFile.name, imageFile.type, imageFile.size);

        const formData = new FormData();
        formData.append('image', imageFile);

        console.log('FormData created, sending request...');
        const token = localStorage.getItem('accessToken');
        console.log('Token exists:', !!token);

        const response = await api.post('/therapists/profile/image', formData);
        console.log('Upload response:', response);
        console.log('Upload response data:', response.data);

        // השרת מחזיר: { success: true, data: { profileImage, profileImagePublicId, provider }, message }
        if (response.success) {
            return response; // החזרת התגובה המלאה
        } else {
            throw new Error(response.error || 'שגיאה בהעלאת תמונה');
        }
    } catch (error) {
        console.error('Upload error:', error);
        console.error('Error response:', error.response);
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
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
    return response.theme;
};

// עדכון עיצוב אישי של המטפלת המחוברת
export const updateOwnTheme = async (theme) => {
    const response = await api.put('/therapists/profile/theme', theme);
    return response.data;
};

// טעינת עיצוב ציבורי לפי מזהה מטפלת
export const getPublicTheme = async (therapistId) => {
    const response = await api.get(`/therapists/${therapistId}/theme`);
    return response.data;
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