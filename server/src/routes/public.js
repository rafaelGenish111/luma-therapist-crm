const express = require('express');
const router = express.Router();
const moment = require('moment');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Appointment = require('../models/Appointment');
const TherapistAvailability = require('../models/TherapistAvailability');
const BlockedTime = require('../models/BlockedTime');
const { ensureChargeForAppointment } = require('../services/billingEngine');
const emailService = require('../utils/emailService');

// Helpers
async function isSlotAvailable(therapistId, startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Overlapping appointments (pending/confirmed)
    const overlappingAppointments = await Appointment.find({
        therapist: therapistId,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
            { startTime: { $lt: end }, endTime: { $gt: start } },
            { date: { $lt: end }, $expr: { $gt: [{ $add: ['$date', { $multiply: ['$duration', 60000] }] }, start] } }
        ]
    }).limit(1);
    if (overlappingAppointments.length > 0) return false;

    // Overlapping blocked times
    const overlappingBlocks = await BlockedTime.find({
        therapistId,
        startTime: { $lt: end },
        endTime: { $gt: start }
    }).limit(1);
    if (overlappingBlocks.length > 0) return false;

    // Within weekly availability (if defined)
    const availability = await TherapistAvailability.findOne({ therapistId });
    if (!availability) return true; // no template => allow
    const day = moment(start).day();
    const schedule = availability.weeklySchedule.find(d => d.dayOfWeek === day);
    if (!schedule || !schedule.isAvailable) return false;
    const startStr = moment(start).format('HH:mm');
    const endStr = moment(end).format('HH:mm');
    return schedule.timeSlots.some(slot => startStr >= slot.startTime && endStr <= slot.endTime);
}

// GET /api/public/availability/slots?therapistId=&date=&duration=
router.get('/availability/slots', async (req, res) => {
    try {
        const { therapistId, date, duration = 60 } = req.query;
        if (!therapistId || !date) {
            return res.status(400).json({ success: false, message: 'therapistId ו-date הם שדות חובה' });
        }
        const day = moment(date);
        const startOfDay = day.clone().startOf('day');
        const endOfDay = day.clone().endOf('day');

        let availability = await TherapistAvailability.findOne({ therapistId });
        const slots = [];
        // Fallback: build schedule from therapist.workingHours if no availability doc
        let schedule = null;
        if (!availability) {
            const therapist = await Therapist.findById(therapistId).lean();
            if (therapist && therapist.workingHours) {
                const dayOfWeek = day.day();
                const map = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const key = map[dayOfWeek];
                const wh = therapist.workingHours[key];
                if (wh && wh.isWorking && wh.start && wh.end) {
                    schedule = { isAvailable: true, timeSlots: [{ startTime: wh.start, endTime: wh.end }] };
                    availability = { bufferTime: 15 }; // default buffer if missing
                }
            }
        } else {
            schedule = availability.weeklySchedule.find(d => d.dayOfWeek === day.day());
        }
        if (!schedule || !schedule.isAvailable) return res.json({ success: true, slots });

        for (const slot of schedule.timeSlots) {
            let current = day.clone().set({
                hour: parseInt(slot.startTime.split(':')[0]),
                minute: parseInt(slot.startTime.split(':')[1]),
                second: 0,
                millisecond: 0
            });
            const slotEnd = day.clone().set({
                hour: parseInt(slot.endTime.split(':')[0]),
                minute: parseInt(slot.endTime.split(':')[1]),
                second: 0,
                millisecond: 0
            });
            while (current.clone().add(duration, 'minutes').isSameOrBefore(slotEnd)) {
                const start = current.clone();
                const end = current.clone().add(duration, 'minutes');
                const available = await isSlotAvailable(therapistId, start.toDate(), end.toDate());
                if (available) {
                    slots.push({ startTime: start.toISOString(), endTime: end.toISOString() });
                }
                current.add(parseInt(duration) + ((availability && availability.bufferTime) || 0), 'minutes');
            }
        }
        res.json({ success: true, slots });
    } catch (e) {
        console.error('Public slots error:', e);
        res.status(500).json({ success: false, message: 'שגיאה בקבלת זמינות' });
    }
});

// POST /api/public/appointments
router.post('/appointments', async (req, res) => {
    try {
        const {
            therapistId,
            client = {},
            startTime,
            endTime,
            duration = 60,
            serviceType = 'individual',
            location = 'online',
            notes = ''
        } = req.body;

        if (!therapistId || !startTime) {
            return res.status(400).json({ success: false, message: 'therapistId ו-startTime הם שדות חובה' });
        }

        const therapist = await Therapist.findById(therapistId);
        if (!therapist || therapist.isActive === false) {
            return res.status(404).json({ success: false, message: 'מטפל לא נמצא או אינו פעיל' });
        }

        const start = new Date(startTime);
        const calcEnd = endTime ? new Date(endTime) : new Date(new Date(start).getTime() + Number(duration) * 60000);
        const available = await isSlotAvailable(therapistId, start, calcEnd);
        if (!available) {
            return res.status(400).json({ success: false, message: 'הזמן המבוקש אינו זמין' });
        }

        // Find or create client under therapist
        let firstName = client.firstName || (client.fullName ? client.fullName.split(' ')[0] : 'לקוח');
        let lastName = client.lastName || (client.fullName ? client.fullName.split(' ').slice(1).join(' ') : '');
        const email = client.email;
        const phone = client.phone;

        let clientDoc = null;
        if (email) {
            clientDoc = await Client.findOne({ email, therapist: therapistId });
        }
        if (!clientDoc) {
            clientDoc = await Client.create({
                therapist: therapistId,
                firstName,
                lastName,
                email,
                phone
            });
        }

        // Determine confirmation policy
        const autoConfirm = therapist.calendarSettings?.autoConfirmBookings === true;

        const appointment = new Appointment({
            therapistId,
            therapist: therapistId,
            clientId: clientDoc._id,
            client: clientDoc._id,
            startTime: start,
            endTime: calcEnd,
            duration: Number(duration),
            serviceType,
            location,
            notes,
            status: autoConfirm ? 'confirmed' : 'pending',
            paymentAmount: 0,
            paymentStatus: 'unpaid',
            recurringPattern: { isRecurring: false }
        });
        await appointment.save();

        try { await ensureChargeForAppointment(appointment); } catch (e) { }

        // Notify therapist about new booking (always), with status info
        try {
            await emailService.init();
            const therapistEmail = therapist.businessEmail || therapist.email;
            if (therapistEmail) {
                await emailService.sendEmail({
                    email: therapistEmail,
                    subject: 'הוזמנה פגישה חדשה באתר האישי',
                    html: `<p>שלום ${therapist.firstName},</p>
                           <p>הוזמנה פגישה חדשה ${autoConfirm ? 'ואושרה אוטומטית' : 'וממתינה לאישורך'}:</p>
                           <ul>
                             <li><strong>תאריך:</strong> ${moment(start).format('DD/MM/YYYY')}</li>
                             <li><strong>שעה:</strong> ${moment(start).format('HH:mm')} - ${moment(calcEnd).format('HH:mm')}</li>
                             <li><strong>לקוח:</strong> ${clientDoc.firstName} ${clientDoc.lastName || ''} (${clientDoc.email || ''})</li>
                           </ul>
                           <p>סטטוס: ${autoConfirm ? 'confirmed' : 'pending'}</p>`
                });
            }
        } catch (e) {
            console.warn('Failed to send booking email notification:', e.message);
        }

        await appointment.populate('client', 'firstName lastName phone email');
        res.status(201).json({ success: true, data: appointment });
    } catch (e) {
        console.error('Public create appointment error:', e);
        res.status(500).json({ success: false, message: 'שגיאה ביצירת פגישה' });
    }
});

module.exports = router;


