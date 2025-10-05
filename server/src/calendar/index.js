// Services Export
module.exports.services = {
    googleAuthService: require('./services/googleAuth.service'),
    googleCalendarService: require('./services/googleCalendar.service'),
    syncService: require('./services/sync.service')
};

// Controllers Export
module.exports.controllers = {
    calendarController: require('./controllers/calendar.controller'),
    appointmentController: require('./controllers/appointment.controller'),
    availabilityController: require('./controllers/availability.controller')
};

// Routes Export
module.exports.routes = {
    calendarRoutes: require('./routes/calendar.routes'),
    appointmentRoutes: require('./routes/appointment.routes'),
    availabilityRoutes: require('./routes/availability.routes')
};

// Jobs Export
module.exports.jobs = {
    syncJobs: require('./jobs/syncJobs')
};
