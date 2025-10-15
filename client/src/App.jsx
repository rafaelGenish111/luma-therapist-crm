import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from './context/AuthContext'
import AccessibilityWidget from './components/AccessibilityWidget'
import CookieConsent from './components/CookieConsent'
import SessionWarning from './components/common/SessionWarning'
import SessionIndicator from './components/common/SessionIndicator'
import { useThemeSettings } from './context/ThemeContext'

// Layouts (keep as regular imports - these are lightweight)
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'
import AdminLayout from './layouts/AdminLayout'

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute'

// Website Pages (keep as regular imports - these are lightweight)
import { WebsiteLayout, Home, About, Articles, Gallery, BookAppointment, Contact, PublicBooking } from './pages/website';
import ArticleDetail from './pages/website/ArticleDetail';
import HealthDeclaration from './pages/website/HealthDeclaration';
import TermsAndPrivacyPage from './pages/TermsAndPrivacyPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyRequest from './pages/PrivacyRequest';
import PaymentPage from './pages/PaymentPage';
import { AboutPage, ServicesPage, GalleryPage as PublicGalleryPage, TestimonialsPage, ContactPage } from './pages/public';

// Lazy load all heavy pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const OnboardingWizard = lazy(() => import('./pages/onboarding/OnboardingWizard'));
const DashboardPage = lazy(() => import('./pages/dashboard/therapist/DashboardPage'));
const ClientsPage = lazy(() => import('./pages/dashboard/therapist/ClientsPage'));
const AppointmentsPage = lazy(() => import('./pages/dashboard/therapist/AppointmentsPage'));
const ArticlesPage = lazy(() => import('./pages/dashboard/therapist/ArticlesPage'));
const GalleryPage = lazy(() => import('./pages/dashboard/therapist/GalleryPage'));
const ProfilePage = lazy(() => import('./pages/dashboard/therapist/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/dashboard/therapist/SettingsPage'));
const CalendlyPage = lazy(() => import('./pages/dashboard/therapist/CalendlyPage'));
const HealthDeclarationsPage = lazy(() => import('./pages/dashboard/therapist/HealthDeclarationsPage'));
const TreatmentTypesPage = lazy(() => import('./pages/dashboard/therapist/TreatmentTypesPage'));
const ImportantInfoPage = lazy(() => import('./pages/dashboard/therapist/ImportantInfoPage'));
const AccessibilityStatement = lazy(() => import('./pages/AccessibilityStatement'));
const DesignPage = lazy(() => import('./pages/dashboard/therapist/DesignPage'));
const CampaignsPage = lazy(() => import('./pages/dashboard/therapist/CampaignsPage'));
const CalendarPage = lazy(() => import('./pages/dashboard/CalendarPage'));
const CalendarSettings = lazy(() => import('./pages/dashboard/CalendarSettings'));
const ClientCard = lazy(() => import('./pages/dashboard/therapist/ClientCard'));

// Admin pages (lazy)
const AdminHome = lazy(() => import('./pages/admin/AdminHome'));
const PlansPage = lazy(() => import('./pages/admin/PlansPage'));
const HealthDeclarationsAdminPage = lazy(() => import('./pages/admin/HealthDeclarationsAdminPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const TherapistManagement = lazy(() => import('./pages/admin/TherapistManagement'));

// Loading fallback component
const LoadingFallback = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="100vh"
    sx={{ backgroundColor: '#f5f5f5' }}
  >
    <CircularProgress size={60} />
  </Box>
);

const App = () => {
    const { changeFontSize } = useThemeSettings();
    return (
        <div style={{
            width: '100%',
            overflowX: 'hidden',
            minHeight: '100vh'
        }}>
            <Router>
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute requiredRole="ADMIN">
                                    <AdminLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<AdminHome />} />
                            <Route path="therapists" element={<TherapistManagement />} />
                            <Route path="plans" element={<PlansPage />} />
                            <Route path="health-declarations" element={<HealthDeclarationsAdminPage />} />
                            <Route path="settings" element={<AdminSettingsPage />} />
                        </Route>
                        <Route path="/register" element={<RegisterPage />} />
                        <Route
                            path="/onboarding"
                            element={
                                <ProtectedRoute>
                                    <OnboardingWizard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <DashboardLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<DashboardPage />} />
                            <Route path="calendar" element={<CalendarPage />} />
                            <Route path="calendar/settings" element={<CalendarSettings />} />
                            <Route path="clients" element={<ClientsPage />} />
                            <Route path="clients/:clientId" element={<ClientCard />} />
                            {/* הפניה: דף תורים ישן -> דף יומן */}
                            <Route path="appointments" element={<Navigate to="/dashboard/calendar" replace />} />
                            <Route path="articles" element={<ArticlesPage />} />
                            <Route path="articles/:id" element={<ArticlesPage />} />
                            <Route path="gallery" element={<GalleryPage />} />
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="calendly" element={<CalendlyPage />} />
                            <Route path="treatment-types" element={<TreatmentTypesPage />} />
                            <Route path="important-info" element={<ImportantInfoPage />} />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="health-declarations" element={<HealthDeclarationsPage />} />
                            <Route path="design" element={<DesignPage />} />
                            <Route path="campaigns" element={<CampaignsPage />} />
                        </Route>
                        <Route path="/accessibility-statement" element={<AccessibilityStatement />} />
                        <Route path="/terms" element={<TermsOfUse />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/privacy-request" element={<PrivacyRequest />} />
                        <Route path="/pay/:paymentLinkId" element={<PaymentPage />} />

                        {/* דפים ציבוריים */}
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/services" element={<ServicesPage />} />
                        <Route path="/gallery" element={<PublicGalleryPage />} />
                        <Route path="/testimonials" element={<TestimonialsPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/website/:therapistId" element={<WebsiteLayout />}>
                            <Route index element={<Home />} />
                            <Route path="about" element={<About />} />
                            <Route path="articles" element={<Articles />} />
                            <Route path="articles/:articleSlug" element={<ArticleDetail />} />
                            <Route path="gallery" element={<Gallery />} />
                            <Route path="health-declaration" element={<HealthDeclaration />} />
                            <Route path="book" element={<PublicBooking />} />
                            <Route path="contact" element={<Contact />} />
                        </Route>
                        {/* דוגמה לראוט עם הרשאה */}
                        {/*
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute requiredPermission="admin_action">
                                <AdminPage />
                            </ProtectedRoute>
                        }
                    />
                    */}
                    </Routes>
                </Suspense>
                <AccessibilityWidget onFontSize={changeFontSize} />
                <CookieConsent />
                <SessionWarning />
                <SessionIndicator />
            </Router>
        </div>
    );
};

export default App 