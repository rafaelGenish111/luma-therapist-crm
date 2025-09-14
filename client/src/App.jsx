import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'
import { useAuth } from './context/AuthContext'
import AccessibilityWidget from './components/AccessibilityWidget'
import CookieConsent from './components/CookieConsent'
import SessionWarning from './components/common/SessionWarning'
import SessionIndicator from './components/common/SessionIndicator'
import { useThemeSettings } from './context/ThemeContext'

// Layouts
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminHome from './pages/admin/AdminHome'
import AdminLayout from './layouts/AdminLayout'
import PlansPage from './pages/admin/PlansPage'
import HealthDeclarationsAdminPage from './pages/admin/HealthDeclarationsAdminPage'
import AdminSettingsPage from './pages/admin/SettingsPage'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OnboardingWizard from './pages/onboarding/OnboardingWizard'
import DashboardPage from './pages/dashboard/DashboardPage'
import ClientsPage from './pages/dashboard/therapist/ClientsPage'
import ClientCard from './pages/dashboard/therapist/ClientCard'
import AppointmentsPage from './pages/dashboard/therapist/AppointmentsPage'
import ArticlesPage from './pages/dashboard/therapist/ArticlesPage'
import GalleryPage from './pages/dashboard/therapist/GalleryPage'
import ProfilePage from './pages/dashboard/therapist/ProfilePage'
import SettingsPage from './pages/dashboard/therapist/SettingsPage'
import CalendlyPage from './pages/dashboard/therapist/CalendlyPage'
import HealthDeclarationsPage from './pages/dashboard/therapist/HealthDeclarationsPage'
import TreatmentTypesPage from './pages/dashboard/therapist/TreatmentTypesPage'
import ImportantInfoPage from './pages/dashboard/therapist/ImportantInfoPage'
import AccessibilityStatement from './pages/AccessibilityStatement'
import DesignPage from './pages/dashboard/therapist/DesignPage'
import CampaignsPage from './pages/dashboard/therapist/CampaignsPage';
// import WebsiteBuilderPage from './pages/dashboard/WebsiteBuilderPage'
// import SettingsPage from './pages/dashboard/SettingsPage'
// import ProfilePage from './pages/dashboard/ProfilePage'

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute'

// Website Pages
import { WebsiteLayout, Home, About, Articles, Gallery, BookAppointment, Contact } from './pages/website';
import ArticleDetail from './pages/website/ArticleDetail';
import HealthDeclaration from './pages/website/HealthDeclaration';
import TermsAndPrivacyPage from './pages/TermsAndPrivacyPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyRequest from './pages/PrivacyRequest';
import { AboutPage, ServicesPage, GalleryPage as PublicGalleryPage, TestimonialsPage, ContactPage } from './pages/public';

const App = () => {
    const { changeFontSize } = useThemeSettings();
    return (
        <div style={{
            width: '100%',
            overflowX: 'hidden',
            minHeight: '100vh'
        }}>
            <Router>
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
                        <Route path="therapists" element={<AdminDashboard />} />
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
                        <Route path="clients" element={<ClientsPage />} />
                        <Route path="clients/:clientId" element={<ClientCard />} />
                        <Route path="appointments" element={<AppointmentsPage />} />
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
                        <Route path="book" element={<BookAppointment />} />
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
                <AccessibilityWidget onFontSize={changeFontSize} />
                <CookieConsent />
                <SessionWarning />
                <SessionIndicator />
            </Router>
        </div>
    );
};

export default App 