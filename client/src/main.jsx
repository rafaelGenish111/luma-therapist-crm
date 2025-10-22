import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from 'react-query'
import App from './App'
import './index.css'
import './theme.css'
import './styles/dashboard.css'
import { AuthProvider } from './context/AuthContext'
import { CustomThemeProvider } from './context/ThemeContext'

// יצירת QueryClient
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 דקות
        },
    },
});

// רישום Service Worker מותנה לאזור האישי בלבד
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // רשום רק אם אנחנו ב-/dashboard
        if (window.location.pathname.startsWith('/dashboard')) {
            navigator.serviceWorker
                .register('/sw.js')
                .then(registration => {
                    console.log('SW registered:', registration);
                })
                .catch(error => {
                    console.log('SW registration failed:', error);
                });
        }
    });
}

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <CustomThemeProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </CustomThemeProvider>
        </QueryClientProvider>
    </React.StrictMode>
) 