// הגדרת מודל הרשאות למערכת Wellness Platform

const roles = {
    SUPER_ADMIN: ['*'], // כל ההרשאות
    ADMIN: [
        'admin',
        'manage_system',
        'cleanup_appointments',
        'restore_appointments',
        'view_scheduled_tasks',
        'manage_all_users',
        'manage_all_appointments',
        'view_system_analytics'
    ],
    THERAPIST: [
        'manage_own_profile',
        'manage_own_clients',
        'manage_own_appointments',
        'manage_own_website',
        'view_own_analytics',
        'manage_health_declarations',
        'manage_own_gallery',
        'manage_own_articles'
    ],
    CLIENT: [
        'view_own_appointments',
        'book_appointments',
        'fill_health_declaration'
    ],
    INSTITUTE_ADMIN: [
        // עתידי: הרשאות ניהול מכון
        'manage_institute_therapists',
        'manage_institute_clients',
        'view_institute_analytics',
        'manage_institute_appointments',
        'manage_institute_settings'
    ]
};

module.exports = roles; 