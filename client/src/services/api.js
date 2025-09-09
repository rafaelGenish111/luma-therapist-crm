import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // שימוש ב-proxy במקום כתובת מלאה
    withCredentials: true, // שליחת cookies (refreshToken)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - הוספת token לכל בקשה
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - טיפול בשגיאות
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token לא תקין - מחיקת token וניתוב להתחברות
            localStorage.removeItem('accessToken');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api; 