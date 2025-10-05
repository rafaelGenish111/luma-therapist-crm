const asyncHandler = require('../middleware/asyncHandler');
const Appointment = require('../models/Appointment');
const Client = require('../models/Client');
const Therapist = require('../models/Therapist');
const TherapistAvailability = require('../models/TherapistAvailability');
const BlockedTime = require('../models/BlockedTime');
const GoogleCalendarSync = require('../models/GoogleCalendarSync');
const { syncAppointmentToGoogle, getEventsByDateRange } = require('../services/googleCalendar.service');
const { sendEmail } = require('../services/emailService');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Booking Controller
 * קונטרולר לניהול הזמנות ציבוריות
 */

// @desc    Get therapist public info
// @route   GET /api/booking/therapist/:id/info
// @access  Public
exports.getTherapistInfo = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Try to find by ID first, then by slug
    let therapist = await Therapist.findById(id);
    if (!therapist) {
        therapist = await Therapist.findOne({ slug: id });
    }

    if (!therapist) {
        return res.status(404).json({
            success: false,
            error: 'Therapist not found'
        });
    }

    // Return only public information
    const publicInfo = {
        _id: therapist._id,
        name: therapist.name,
        bio: therapist.bio,
        photo: therapist.photo,
        specialties: therapist.specialties,
        languages: therapist.languages,
        timezone: therapist.timezone,
        rating: therapist.rating || 0,
        reviewCount: therapist.reviewCount || 0,
        googleCalendarConnected: therapist.googleCalendarConnected,
        businessAddress: therapist.businessAddress,
        // Add any other public fields
    };

    res.status(200).json({
        success: true,
        data: publicInfo
    });
});

// @desc    Get available services for therapist
// @route   GET /api/booking/therapist/:id/services
// @access  Public
exports.getAvailableServices = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const therapist = await Therapist.findById(id);
    if (!therapist) {
        return res.status(404).json({
            success: false,
            error: 'Therapist not found'
        });
    }

    // Define available services (this could be moved to therapist model or separate service)
    const services = [
        {
            id: 'individual',
            name: 'טיפול פרטי',
            description: 'פגישת טיפול אישית עם המטפלת',
            duration: 60,
            price: therapist.defaultPrice || 300,
            category: 'therapy',
            image: '/images/individual-therapy.jpg'
        },
        {
            id: 'couple',
            name: 'טיפול זוגי',
            description: 'פגישת טיפול לזוגות',
            duration: 90,
            price: (therapist.defaultPrice || 300) * 1.5,
            category: 'therapy',
            image: '/images/couple-therapy.jpg'
        },
        {
            id: 'family',
            name: 'טיפול משפחתי',
            description: 'פגישת טיפול משפחתי',
            duration: 90,
            price: (therapist.defaultPrice || 300) * 1.5,
            category: 'therapy',
            image: '/images/family-therapy.jpg'
        },
        {
            id: 'group',
            name: 'טיפול קבוצתי',
            description: 'פגישת טיפול קבוצתי',
            duration: 120,
            price: (therapist.defaultPrice || 300) * 0.7,
            category: 'therapy',
            image: '/images/group-therapy.jpg'
        },
        {
            id: 'consultation',
            name: 'ייעוץ',
            description: 'פגישת ייעוץ קצרה',
            duration: 30,
            price: (therapist.defaultPrice || 300) * 0.5,
            category: 'consultation',
            image: '/images/consultation.jpg'
        }
    ];

    res.status(200).json({
        success: true,
        data: services
    });
});

// @desc    Get available time slots
// @route   GET /api/booking/therapist/:id/slots
// @access  Public
exports.getAvailableSlots = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date, serviceType, duration, excludeAppointmentId } = req.query;

    if (!date) {
        return res.status(400).json({
            success: false,
            error: 'Date is required'
        });
    }

    const therapist = await Therapist.findById(id);
    if (!therapist) {
        return res.status(404).json({
            success: false,
            error: 'Therapist not found'
        });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0 for Sunday, 6 for Saturday

    // Get availability settings
    const availability = await TherapistAvailability.findOne({ therapistId: id });
    if (!availability) {
        return res.status(200).json({
            success: true,
            data: {
                date: date,
                slots: [],
                timezone: therapist.timezone || 'Asia/Jerusalem'
            }
        });
    }

    // Check if therapist is available on this day
    const weeklyScheduleForDay = availability.weeklySchedule.find(s => s.dayOfWeek === dayOfWeek);
    if (!weeklyScheduleForDay || !weeklyScheduleForDay.isAvailable) {
        return res.status(200).json({
            success: true,
            data: {
                date: date,
                slots: [],
                timezone: therapist.timezone || 'Asia/Jerusalem'
            }
        });
    }

    // Get existing appointments for this date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
        $or: [{ therapistId: id }, { therapist: id }],
        startTime: { $gte: startOfDay, $lt: endOfDay },
        status: { $in: ['pending', 'confirmed'] }
    };

    if (excludeAppointmentId) {
        query._id = { $ne: excludeAppointmentId };
    }

    const existingAppointments = await Appointment.find(query);

    // Get blocked times
    const blockedTimes = await BlockedTime.find({
        therapistId: id,
        startTime: { $gte: startOfDay, $lt: endOfDay }
    });

    // Get Google Calendar busy times if connected
    let googleBusyTimes = [];
    if (therapist.googleCalendarConnected) {
        const syncRecord = await GoogleCalendarSync.findOne({ therapistId: id });
        if (syncRecord && syncRecord.syncEnabled && syncRecord.syncDirection !== 'to-google') {
            try {
                const googleEvents = await getEventsByDateRange(id, startOfDay, endOfDay);
                googleBusyTimes = googleEvents.map(event => ({
                    startTime: new Date(event.start.dateTime || event.start.date),
                    endTime: new Date(event.end.dateTime || event.end.date)
                }));
            } catch (error) {
                logger.error(`Error fetching Google Calendar events for therapist ${id}:`, error);
            }
        }
    }

    // Combine all occupied times
    const allOccupiedSlots = [
        ...existingAppointments.map(app => ({ startTime: app.startTime, endTime: app.endTime })),
        ...blockedTimes.map(bt => ({ startTime: bt.startTime, endTime: bt.endTime })),
        ...googleBusyTimes
    ];

    // Sort occupied slots by start time
    allOccupiedSlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Calculate available slots
    const availableSlots = [];
    const appointmentDuration = parseInt(duration) || 60;

    for (const slot of weeklyScheduleForDay.timeSlots) {
        let currentSlotStart = new Date(`${targetDate.toISOString().split('T')[0]}T${slot.startTime}:00.000Z`);
        let slotEnd = new Date(`${targetDate.toISOString().split('T')[0]}T${slot.endTime}:00.000Z`);

        while (currentSlotStart.getTime() + appointmentDuration * 60000 <= slotEnd.getTime()) {
            const potentialAppointmentEnd = new Date(currentSlotStart.getTime() + appointmentDuration * 60000);
            const bufferEnd = new Date(potentialAppointmentEnd.getTime() + availability.bufferTime * 60000);

            let isAvailable = true;
            for (const occupied of allOccupiedSlots) {
                // Check for overlap with potential appointment + buffer
                if (
                    (currentSlotStart < occupied.endTime && potentialAppointmentEnd > occupied.startTime) ||
                    (currentSlotStart < occupied.endTime && bufferEnd > occupied.startTime)
                ) {
                    isAvailable = false;
                    break;
                }
            }

            // Check minimum notice
            if (availability.minNoticeHours > 0) {
                const minBookingTime = new Date(Date.now() + availability.minNoticeHours * 60 * 60 * 1000);
                if (currentSlotStart < minBookingTime) {
                    isAvailable = false;
                }
            }

            // Check advance booking days
            if (availability.advanceBookingDays > 0) {
                const maxBookingTime = new Date(Date.now() + availability.advanceBookingDays * 24 * 60 * 60 * 1000);
                if (currentSlotStart > maxBookingTime) {
                    isAvailable = false;
                }
            }

            if (isAvailable) {
                availableSlots.push({
                    startTime: currentSlotStart.toTimeString().slice(0, 5),
                    endTime: potentialAppointmentEnd.toTimeString().slice(0, 5),
                    available: true
                });
            }

            currentSlotStart = bufferEnd; // Move to the end of the potential appointment + buffer
        }
    }

    res.status(200).json({
        success: true,
        data: {
            date: date,
            slots: availableSlots,
            timezone: therapist.timezone || 'Asia/Jerusalem'
        }
    });
});

// @desc    Create booking
// @route   POST /api/booking/create
// @access  Public
exports.createBooking = asyncHandler(async (req, res) => {
    const {
        therapistId,
        serviceType,
        startTime,
        endTime,
        clientInfo,
        paymentMethod,
        createAccount
    } = req.body;

    // Validation
    if (!therapistId || !serviceType || !startTime || !endTime || !clientInfo) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }

    if (!clientInfo.name || !clientInfo.email || !clientInfo.phone) {
        return res.status(400).json({
            success: false,
            error: 'Missing required client information'
        });
    }

    // Check if therapist exists
    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
        return res.status(404).json({
            success: false,
            error: 'Therapist not found'
        });
    }

    // Check for conflicts (race condition protection)
    const conflicts = await checkConflictsInternal(therapistId, new Date(startTime), new Date(endTime));
    if (conflicts.length > 0) {
        return res.status(409).json({
            success: false,
            error: 'Time slot is no longer available',
            conflicts: conflicts
        });
    }

    let client;

    // Handle client creation or finding
    if (createAccount) {
        // Check if client already exists
        let existingClient = await Client.findOne({ email: clientInfo.email });

        if (existingClient) {
            client = existingClient;
        } else {
            // Create new client account
            client = await Client.create({
                firstName: clientInfo.name.split(' ')[0],
                lastName: clientInfo.name.split(' ').slice(1).join(' ') || '',
                email: clientInfo.email,
                phone: clientInfo.phone,
                isGuest: false,
                // Add other default fields as needed
            });
        }
    } else {
        // Create guest client record
        client = await Client.create({
            firstName: clientInfo.name.split(' ')[0],
            lastName: clientInfo.name.split(' ').slice(1).join(' ') || '',
            email: clientInfo.email,
            phone: clientInfo.phone,
            isGuest: true,
            notes: clientInfo.notes
        });
    }

    // Generate confirmation code
    const confirmationCode = generateConfirmationCode();

    // Create appointment
    const appointmentData = {
        therapistId,
        clientId: client._id,
        serviceType,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: Math.round((new Date(endTime) - new Date(startTime)) / 60000),
        location: 'clinic', // Default location, could be made configurable
        notes: clientInfo.notes,
        status: 'pending',
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
        paymentAmount: getServicePrice(serviceType, therapist),
        confirmationCode,
        // Compatibility fields
        therapist: therapistId,
        client: client._id,
        date: new Date(startTime),
        price: getServicePrice(serviceType, therapist),
        type: serviceType === 'individual' ? 'טיפול רגיל' : 'אחר'
    };

    const appointment = await Appointment.create(appointmentData);

    // Async sync to Google Calendar
    syncAppointmentToGoogle(appointment._id).catch(err => {
        logger.error(`Failed to sync appointment ${appointment._id} to Google Calendar:`, err);
    });

    // Send confirmation emails
    try {
        await sendBookingConfirmationEmail(appointment, client, therapist);
        await sendTherapistNotificationEmail(appointment, client, therapist);
    } catch (emailError) {
        logger.error('Error sending confirmation emails:', emailError);
        // Don't fail the booking if email fails
    }

    res.status(201).json({
        success: true,
        data: {
            appointmentId: appointment._id,
            confirmationCode: appointment.confirmationCode,
            clientId: client._id,
            appointment: appointment
        }
    });
});

// @desc    Verify booking exists
// @route   GET /api/booking/verify/:code
// @access  Public
exports.verifyBooking = asyncHandler(async (req, res) => {
    const { code } = req.params;

    const appointment = await Appointment.findOne({ confirmationCode: code })
        .populate('therapistId', 'name email phone')
        .populate('clientId', 'firstName lastName email phone');

    if (!appointment) {
        return res.status(404).json({
            success: false,
            error: 'Booking not found'
        });
    }

    // Return public information only
    const publicAppointment = {
        _id: appointment._id,
        serviceType: appointment.serviceType,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        duration: appointment.duration,
        status: appointment.status,
        location: appointment.location,
        meetingUrl: appointment.meetingUrl,
        notes: appointment.notes,
        paymentAmount: appointment.paymentAmount,
        paymentStatus: appointment.paymentStatus,
        confirmationCode: appointment.confirmationCode,
        therapist: {
            name: appointment.therapistId.name,
            email: appointment.therapistId.email,
            phone: appointment.therapistId.phone
        },
        client: {
            name: `${appointment.clientId.firstName} ${appointment.clientId.lastName}`,
            email: appointment.clientId.email,
            phone: appointment.clientId.phone
        }
    };

    res.status(200).json({
        success: true,
        data: publicAppointment
    });
});

// @desc    Cancel booking
// @route   POST /api/booking/:code/cancel
// @access  Public
exports.cancelBooking = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const { email, reason } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            error: 'Email is required'
        });
    }

    const appointment = await Appointment.findOne({ confirmationCode: code })
        .populate('clientId', 'email')
        .populate('therapistId', 'name email');

    if (!appointment) {
        return res.status(404).json({
            success: false,
            error: 'Booking not found'
        });
    }

    // Verify email matches
    if (appointment.clientId.email !== email) {
        return res.status(403).json({
            success: false,
            error: 'Email does not match booking'
        });
    }

    // Check cancellation policy (24 hours)
    const appointmentDate = new Date(appointment.startTime);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 24) {
        return res.status(400).json({
            success: false,
            error: 'Cannot cancel appointment less than 24 hours in advance'
        });
    }

    // Update appointment status
    appointment.status = 'cancelled';
    appointment.cancellationReason = reason;
    appointment.cancelledBy = 'client';
    appointment.cancelledAt = new Date();
    await appointment.save();

    // Delete from Google Calendar
    if (appointment.googleEventId) {
        try {
            await deleteGoogleEvent(appointment.therapistId._id, appointment.googleEventId);
        } catch (error) {
            logger.error(`Failed to delete Google Calendar event:`, error);
        }
    }

    // Send cancellation emails
    try {
        await sendCancellationEmail(appointment, appointment.clientId, appointment.therapistId);
    } catch (emailError) {
        logger.error('Error sending cancellation email:', emailError);
    }

    res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: appointment
    });
});

// @desc    Reschedule booking
// @route   POST /api/booking/:code/reschedule
// @access  Public
exports.rescheduleBooking = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const { email, newStartTime, newEndTime } = req.body;

    if (!email || !newStartTime || !newEndTime) {
        return res.status(400).json({
            success: false,
            error: 'Email, newStartTime, and newEndTime are required'
        });
    }

    const appointment = await Appointment.findOne({ confirmationCode: code })
        .populate('clientId', 'email')
        .populate('therapistId', 'name email');

    if (!appointment) {
        return res.status(404).json({
            success: false,
            error: 'Booking not found'
        });
    }

    // Verify email matches
    if (appointment.clientId.email !== email) {
        return res.status(403).json({
            success: false,
            error: 'Email does not match booking'
        });
    }

    // Check rescheduling policy (24 hours)
    const appointmentDate = new Date(appointment.startTime);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 24) {
        return res.status(400).json({
            success: false,
            error: 'Cannot reschedule appointment less than 24 hours in advance'
        });
    }

    // Check for conflicts with new time
    const conflicts = await checkConflictsInternal(appointment.therapistId._id, new Date(newStartTime), new Date(newEndTime), appointment._id);
    if (conflicts.length > 0) {
        return res.status(409).json({
            success: false,
            error: 'New time slot is not available',
            conflicts: conflicts
        });
    }

    // Update appointment
    const oldStartTime = appointment.startTime;
    appointment.startTime = new Date(newStartTime);
    appointment.endTime = new Date(newEndTime);
    appointment.duration = Math.round((new Date(newEndTime) - new Date(newStartTime)) / 60000);
    await appointment.save();

    // Sync to Google Calendar
    syncAppointmentToGoogle(appointment._id).catch(err => {
        logger.error(`Failed to sync rescheduled appointment ${appointment._id} to Google Calendar:`, err);
    });

    // Send update emails
    try {
        await sendRescheduleEmail(appointment, appointment.clientId, appointment.therapistId, oldStartTime);
    } catch (emailError) {
        logger.error('Error sending reschedule email:', emailError);
    }

    res.status(200).json({
        success: true,
        message: 'Booking rescheduled successfully',
        data: appointment
    });
});

// @desc    Resend confirmation email
// @route   POST /api/booking/:code/resend-confirmation
// @access  Public
exports.resendConfirmation = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            error: 'Email is required'
        });
    }

    const appointment = await Appointment.findOne({ confirmationCode: code })
        .populate('clientId', 'email firstName lastName')
        .populate('therapistId', 'name email');

    if (!appointment) {
        return res.status(404).json({
            success: false,
            error: 'Booking not found'
        });
    }

    // Verify email matches
    if (appointment.clientId.email !== email) {
        return res.status(403).json({
            success: false,
            error: 'Email does not match booking'
        });
    }

    // Send confirmation email
    try {
        await sendBookingConfirmationEmail(appointment, appointment.clientId, appointment.therapistId);
        res.status(200).json({
            success: true,
            message: 'Confirmation email sent successfully'
        });
    } catch (emailError) {
        logger.error('Error sending confirmation email:', emailError);
        res.status(500).json({
            success: false,
            error: 'Failed to send confirmation email'
        });
    }
});

// Helper functions

const checkConflictsInternal = async (therapistId, startTime, endTime, excludeAppointmentId = null) => {
    const query = {
        $or: [{ therapistId: therapistId }, { therapist: therapistId }],
        status: { $in: ['pending', 'confirmed'] },
        $or: [
            { startTime: { $lt: endTime, $gte: startTime } },
            { endTime: { $gt: startTime, $lte: endTime } },
            { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
        ]
    };

    if (excludeAppointmentId) {
        query._id = { $ne: excludeAppointmentId };
    }

    const conflictingAppointments = await Appointment.find(query);

    const conflictingBlockedTimes = await BlockedTime.find({
        therapistId,
        $or: [
            { startTime: { $lt: endTime, $gte: startTime } },
            { endTime: { $gt: startTime, $lte: endTime } },
            { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
        ]
    });

    return [...conflictingAppointments, ...conflictingBlockedTimes];
};

const generateConfirmationCode = () => {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
};

const getServicePrice = (serviceType, therapist) => {
    const basePrice = therapist.defaultPrice || 300;

    switch (serviceType) {
        case 'individual':
            return basePrice;
        case 'couple':
        case 'family':
            return Math.round(basePrice * 1.5);
        case 'group':
            return Math.round(basePrice * 0.7);
        case 'consultation':
            return Math.round(basePrice * 0.5);
        default:
            return basePrice;
    }
};

const sendBookingConfirmationEmail = async (appointment, client, therapist) => {
    const emailData = {
        to: client.email,
        subject: `אישור הזמנה - ${therapist.name}`,
        html: `
            <h2>אישור הזמנה</h2>
            <p>שלום ${client.firstName},</p>
            <p>הזמנתך אושרה בהצלחה!</p>
            
            <h3>פרטי הפגישה:</h3>
            <ul>
                <li>מטפלת: ${therapist.name}</li>
                <li>שירות: ${appointment.serviceType}</li>
                <li>תאריך ושעה: ${new Date(appointment.startTime).toLocaleString('he-IL')}</li>
                <li>משך: ${appointment.duration} דקות</li>
                <li>מחיר: ₪${appointment.paymentAmount}</li>
                <li>קוד אישור: ${appointment.confirmationCode}</li>
            </ul>
            
            <p>ניתן לנהל את ההזמנה בקישור: <a href="${process.env.FRONTEND_URL}/booking/manage/${appointment.confirmationCode}">ניהול הזמנה</a></p>
            
            <p>תודה שבחרת בנו!</p>
        `
    };

    return sendEmail(emailData);
};

const sendTherapistNotificationEmail = async (appointment, client, therapist) => {
    const emailData = {
        to: therapist.email,
        subject: `הזמנה חדשה - ${client.firstName} ${client.lastName}`,
        html: `
            <h2>הזמנה חדשה</h2>
            <p>שלום ${therapist.name},</p>
            <p>קיבלת הזמנה חדשה!</p>
            
            <h3>פרטי הפגישה:</h3>
            <ul>
                <li>לקוח: ${client.firstName} ${client.lastName}</li>
                <li>אימייל: ${client.email}</li>
                <li>טלפון: ${client.phone}</li>
                <li>שירות: ${appointment.serviceType}</li>
                <li>תאריך ושעה: ${new Date(appointment.startTime).toLocaleString('he-IL')}</li>
                <li>משך: ${appointment.duration} דקות</li>
                <li>מחיר: ₪${appointment.paymentAmount}</li>
                ${appointment.notes ? `<li>הערות: ${appointment.notes}</li>` : ''}
            </ul>
        `
    };

    return sendEmail(emailData);
};

const sendCancellationEmail = async (appointment, client, therapist) => {
    const emailData = {
        to: client.email,
        subject: `ביטול הזמנה - ${therapist.name}`,
        html: `
            <h2>ביטול הזמנה</h2>
            <p>שלום ${client.firstName},</p>
            <p>הזמנתך בוטלה בהצלחה.</p>
            
            <h3>פרטי הפגישה שבוטלה:</h3>
            <ul>
                <li>מטפלת: ${therapist.name}</li>
                <li>שירות: ${appointment.serviceType}</li>
                <li>תאריך ושעה: ${new Date(appointment.startTime).toLocaleString('he-IL')}</li>
                <li>סיבת הביטול: ${appointment.cancellationReason || 'לא צוינה'}</li>
            </ul>
            
            <p>ניתן ליצור הזמנה חדשה בכל עת.</p>
        `
    };

    return sendEmail(emailData);
};

const sendRescheduleEmail = async (appointment, client, therapist, oldStartTime) => {
    const emailData = {
        to: client.email,
        subject: `שינוי הזמנה - ${therapist.name}`,
        html: `
            <h2>שינוי הזמנה</h2>
            <p>שלום ${client.firstName},</p>
            <p>הזמנתך שונתה בהצלחה.</p>
            
            <h3>פרטי הפגישה המעודכנת:</h3>
            <ul>
                <li>מטפלת: ${therapist.name}</li>
                <li>שירות: ${appointment.serviceType}</li>
                <li>תאריך ושעה חדשים: ${new Date(appointment.startTime).toLocaleString('he-IL')}</li>
                <li>תאריך ושעה קודמים: ${new Date(oldStartTime).toLocaleString('he-IL')}</li>
                <li>משך: ${appointment.duration} דקות</li>
            </ul>
            
            <p>ניתן לנהל את ההזמנה בקישור: <a href="${process.env.FRONTEND_URL}/booking/manage/${appointment.confirmationCode}">ניהול הזמנה</a></p>
        `
    };

    return sendEmail(emailData);
};
