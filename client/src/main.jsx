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

// רישום Service Worker רק אחרי שהדף נטען
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      registration => {
        console.log('SW registered:', registration);
      },
      error => {
        console.log('SW registration failed:', error);
      }
    );
  });
} 