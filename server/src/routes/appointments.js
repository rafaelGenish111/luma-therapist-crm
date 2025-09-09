const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { ensureChargeForAppointment } = require('../services/billingEngine');
const Client = require('../models/Client');
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// GET /api/appointments - קבלת כל הפגישות של המטפלת
router.get('/', auth, authorize(['manage_own_appointments']), async (req, res) => {
    try {
        const appointments = await Appointment.find({
            therapist: req.user.id,
            deletedAt: null
        })
            .populate('client', 'firstName lastName phone email')
            .sort({ date: 1 });
        res.json({ success: true, data: appointments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'שגיאה בקבלת פגישות', error: error.message });
    }
});

// GET /api/appointments/:id - קבלת פגישה ספציפית
router.get('/:id', auth, authorize(['manage_own_appointments']), async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            therapist: req.user.id,
            deletedAt: null
        })
            .populate('client', 'firstName lastName phone email');
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'פגישה לא נמצאה' });
        }
        res.json({ success: true, data: appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'שגיאה בקבלת פגישה', error: error.message });
    }
});

// POST /api/appointments - יצירת פגישה חדשה
router.post('/', auth, authorize(['manage_own_appointments']), async (req, res) => {
    try {
        const appointmentData = {
            ...req.body,
            therapist: req.user.id
        };

        // וידוא שהלקוח קיים ושייך למטפלת
        if (appointmentData.client) {
            const client = await Client.findOne({ _id: appointmentData.client, therapist: req.user.id });
            if (!client) {
                return res.status(400).json({ success: false, message: 'לקוח לא נמצא' });
            }
        }

        const appointment = new Appointment(appointmentData);
        await appointment.save();

        // יצירה/עדכון חיוב לפגישה
        try {
            await ensureChargeForAppointment(appointment);
        } catch (e) {
            console.warn('ensureChargeForAppointment failed on create:', e.message);
        }

        // החזרת הפגישה עם פרטי הלקוח
        await appointment.populate('client', 'firstName lastName phone email');

        res.status(201).json({ success: true, data: appointment, message: 'פגישה נוצרה בהצלחה' });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'נתונים לא תקינים', errors: error.errors });
        }
        res.status(500).json({ success: false, message: 'שגיאה ביצירת פגישה', error: error.message });
    }
});

// PUT /api/appointments/:id - עדכון פגישה
router.put('/:id', auth, authorize(['manage_own_appointments']), async (req, res) => {
    try {
        const appointment = await Appointment.findOneAndUpdate(
            { _id: req.params.id, therapist: req.user.id },
            req.body,
            { new: true, runValidators: true }
        ).populate('client', 'firstName lastName phone email');

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'פגישה לא נמצאה' });
        }

        // עדכון חיוב לאחר שינוי פרטי פגישה
        try {
            await ensureChargeForAppointment(appointment);
        } catch (e) {
            console.warn('ensureChargeForAppointment failed on update:', e.message);
        }

        res.json({ success: true, data: appointment, message: 'פגישה עודכנה בהצלחה' });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'נתונים לא תקינים', errors: error.errors });
        }
        res.status(500).json({ success: false, message: 'שגיאה בעדכון פגישה', error: error.message });
    }
});

// DELETE /api/appointments/:id - מחיקת פגישה
router.delete('/:id', auth, authorize(['manage_own_appointments']), async (req, res) => {
    try {
        const appointment = await Appointment.findOneAndDelete({ _id: req.params.id, therapist: req.user.id });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'פגישה לא נמצאה' });
        }

        res.json({ success: true, message: 'פגישה נמחקה בהצלחה' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'שגיאה במחיקת פגישה', error: error.message });
    }
});

// GET /api/clients/:clientId/appointments - קבלת פגישות של לקוח ספציפי עם הפרדת רשימות
router.get('/clients/:clientId/appointments', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { clientId } = req.params;
        const { scope = 'all', limit = 50, page = 1 } = req.query;
        const therapistId = req.user.id;

        // בדיקה שהלקוח קיים ושייך למטפלת
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ error: 'לקוח לא נמצא' });
        }

        if (client.therapist.toString() !== therapistId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'אין הרשאה לגשת ללקוח זה' });
        }

        console.log(`Fetching appointments for client ${clientId}, scope: ${scope}`);

        // בניית query בסיסי
        let query = {
            client: clientId,
            therapist: therapistId
        };

        // סינון לפי scope
        const now = new Date();
        switch (scope) {
            case 'upcoming':
                query.date = { $gte: now };
                break;
            case 'history':
                query.date = { $lt: now };
                break;
            case 'all':
            default:
                // אין סינון נוסף
                break;
        }

        // חישוב skip עבור pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // קבלת הפגישות
        const appointments = await Appointment.find(query)
            .populate('client', 'firstName lastName phone email')
            .sort({ date: scope === 'history' ? -1 : 1 }) // היסטוריה בסדר יורד, עתידיות בסדר עולה
            .skip(skip)
            .limit(parseInt(limit));

        // חישוב סטטיסטיקות
        const allAppointments = await Appointment.find({ client: clientId, therapist: therapistId });
        const stats = {
            total: allAppointments.length,
            upcoming: allAppointments.filter(apt => apt.date >= now).length,
            history: allAppointments.filter(apt => apt.date < now).length,
            byStatus: {
                scheduled: allAppointments.filter(apt => apt.status === 'scheduled').length,
                confirmed: allAppointments.filter(apt => apt.status === 'confirmed').length,
                completed: allAppointments.filter(apt => apt.status === 'completed').length,
                cancelled: allAppointments.filter(apt => apt.status === 'cancelled').length,
                no_show: allAppointments.filter(apt => apt.status === 'no_show').length
            },
            byPaymentStatus: {
                not_required: allAppointments.filter(apt => apt.paymentStatus === 'not_required').length,
                pending: allAppointments.filter(apt => apt.paymentStatus === 'pending').length,
                paid: allAppointments.filter(apt => apt.paymentStatus === 'paid').length,
                failed: allAppointments.filter(apt => apt.paymentStatus === 'failed').length
            }
        };

        console.log(`Found ${appointments.length} appointments for client ${clientId}`);

        res.json({
            success: true,
            appointments,
            stats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: allAppointments.length
            }
        });

    } catch (error) {
        console.error('Error fetching client appointments:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

// PATCH /api/appointments/:id - עדכון פגישה (סטטוס, סטטוס תשלום, סיבת ביטול)
router.patch('/:id', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paymentStatus, cancellationReason } = req.body;
        const therapistId = req.user.id;

        // בדיקה שהפגישה קיימת ושייכת למטפלת
        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ error: 'פגישה לא נמצאה' });
        }

        if (appointment.therapist.toString() !== therapistId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'אין הרשאה לעדכן פגישה זו' });
        }

        console.log(`Updating appointment ${id}:`, { status, paymentStatus, cancellationReason });

        // בניית אובייקט עדכון
        const updateData = {};
        if (status) updateData.status = status;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (cancellationReason !== undefined) updateData.cancellationReason = cancellationReason;

        // עדכון הפגישה
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('client', 'firstName lastName phone email');

        console.log(`Appointment updated successfully: ${id}`);

        res.json({
            success: true,
            appointment: updatedAppointment
        });

    } catch (error) {
        console.error('Error updating appointment:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'נתונים לא תקינים',
                details: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

module.exports = router; 