const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Charge = require('../models/Charge');
const Appointment = require('../models/Appointment');
const Client = require('../models/Client');
const { ensureChargeForAppointment } = require('../services/billingEngine');

// GET /api/charges/clients/:clientId - חיובים של לקוח
router.get('/clients/:clientId', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { clientId } = req.params;
        const { status } = req.query;
        const therapistId = req.user.id;

        const client = await Client.findById(clientId);
        if (!client) return res.status(404).json({ error: 'לקוח לא נמצא' });
        if (client.therapist.toString() !== therapistId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'אין הרשאה' });
        }

        let charges;
        if (status === 'open') {
            // רק חיובים עם יתרה אמיתית > 0
            charges = await Charge.find({ clientId, therapistId, status: { $in: ['PENDING', 'PARTIALLY_PAID'] } })
                .where('amount').gt(0)
                .populate('appointmentId', 'date duration status type')
                .sort({ createdAt: -1 });
            // סינון נוסף לפי balance מחושב (amount - paidAmount - discounts + tax + tip)
            charges = charges.filter(c => ((c.amount || 0) + (c.taxAmount || 0) + (c.tipAmount || 0) - (c.discountAmount || 0) - (c.paidAmount || 0)) > 0.0001);
        } else {
            const query = { clientId, therapistId };
            if (status) query.status = status;
            charges = await Charge.find(query)
                .populate('appointmentId', 'date duration status type')
                .sort({ createdAt: -1 });
        }

        const stats = {
            total: charges.length,
            open: charges.filter(c => ['PENDING', 'PARTIALLY_PAID'].includes(c.status)).length,
            paid: charges.filter(c => c.status === 'PAID').length
        };

        res.json({ success: true, charges, stats });
    } catch (error) {
        console.error('Error fetching charges:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

// POST /api/charges/appointments/:appointmentId/ensure - יצירה/עדכון חיוב לפגישה
router.post('/appointments/:appointmentId/ensure', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return res.status(404).json({ error: 'פגישה לא נמצאה' });
        if (appointment.therapist.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'אין הרשאה' });
        }

        const charge = await ensureChargeForAppointment(appointment);
        res.json({ success: true, charge });
    } catch (error) {
        console.error('Error ensuring charge:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

module.exports = router;


