import axios from 'axios';

// זיהוי אוטומטי של כתובת השרת
const getBaseURL = () => {
    // בפרודקשן - כתובת השרת בVercel
    if (import.meta.env.PROD) {
        return import.meta.env.VITE_API_URL || 'https://luma-therapist-crm-hnku.vercel.app/api';
    }
    // בפיתוח - דרך ה-proxy
    return '/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000 // 60 שניות timeout
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

// Response interceptor - טיפול בשגיאות ורענון טוקן
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // אם קיבלנו 401 ולא ניסינו כבר לרענן
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // נסה לרענן את הטוקן
                const refreshResponse = await axios.post(
                    `${getBaseURL()}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                if (refreshResponse.data?.success) {
                    const newToken = refreshResponse.data.data.accessToken;
                    localStorage.setItem('accessToken', newToken);
                    
                    // נסה שוב את הבקשה המקורית
                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // אם הרענון נכשל, נקה והפנה להתחברות
                localStorage.removeItem('accessToken');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;