const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// GET /api/clients - קבלת כל הלקוחות של המטפלת
// מאפשר גישה לכל מטפלת (ROLE) גם אם אין לה הרשאות פרטניות ברשימה
router.get('/', auth, authorize(['THERAPIST', 'manage_own_clients']), async (req, res) => {
    try {
        // החזר שדות קלים לדרופדאון כברירת מחדל
        const clients = await Client.find({ therapist: req.user.id })
            .select('_id firstName lastName status createdAt')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, data: clients });
    } catch (error) {
        res.status(500).json({ success: false, message: 'שגיאה בקבלת לקוחות', error: error.message });
    }
});

// GET /api/clients/:id - קבלת לקוח ספציפי
router.get('/:id', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        const client = await Client.findOne({ _id: req.params.id, therapist: req.user.id });
        if (!client) {
            return res.status(404).json({ success: false, message: 'לקוח לא נמצא' });
        }
        res.json({ success: true, data: client });
    } catch (error) {
        res.status(500).json({ success: false, message: 'שגיאה בקבלת לקוח', error: error.message });
    }
});

// POST /api/clients - יצירת לקוח חדש
router.post('/', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        // ניקוי שדות ריקים כדי למנוע CastError (למשל תאריך ריק)
        const cleanedBody = Object.entries(req.body || {}).reduce((acc, [key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});

        const clientData = {
            ...cleanedBody,
            therapist: req.user.id
        };
        const client = new Client(clientData);
        await client.save();
        res.status(201).json({ success: true, data: client });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'נתוני לקוח לא תקינים',
                errors: error.errors
            });
        }
        if (error.code === 11000 && error.keyPattern?.nationalId) {
            return res.status(400).json({
                success: false,
                message: 'תעודת זהות זו כבר קיימת במערכת'
            });
        }
        console.error('Create client error:', error);
        res.status(500).json({ success: false, message: 'שגיאה ביצירת לקוח', error: error.message });
    }
});

// PUT /api/clients/:id - עדכון לקוח
router.put('/:id', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        const client = await Client.findOneAndUpdate(
            { _id: req.params.id, therapist: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!client) {
            return res.status(404).json({ success: false, message: 'לקוח לא נמצא' });
        }
        res.json({ success: true, data: client });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'נתוני לקוח לא תקינים',
                errors: error.errors
            });
        }
        if (error.code === 11000 && error.keyPattern?.nationalId) {
            return res.status(400).json({
                success: false,
                message: 'תעודת זהות זו כבר קיימת במערכת'
            });
        }
        console.error('Update client error:', error);
        res.status(500).json({ success: false, message: 'שגיאה בעדכון לקוח', error: error.message });
    }
});

// DELETE /api/clients/:id - מחיקת לקוח
router.delete('/:id', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        const client = await Client.findOneAndDelete({ _id: req.params.id, therapist: req.user.id });
        if (!client) {
            return res.status(404).json({ success: false, message: 'לקוח לא נמצא' });
        }
        res.json({ success: true, data: client });
    } catch (error) {
        res.status(500).json({ success: false, message: 'שגיאה במחיקת לקוח', error: error.message });
    }
});

// POST /api/clients/:id/interactions - הוספת אינטראקציה
router.post('/:id/interactions', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        const { text, type = 'general' } = req.body;
        const client = await Client.findOne({ _id: req.params.id, therapist: req.user.id });
        if (!client) {
            return res.status(404).json({ success: false, message: 'לקוח לא נמצא' });
        }
        client.interactions.push({ text, type, date: new Date() });
        await client.save();
        res.json({ success: true, data: client });
    } catch (error) {
        res.status(500).json({ success: false, message: 'שגיאה בהוספת אינטראקציה', error: error.message });
    }
});

// PUT /api/clients/:id/status - עדכון סטטוס לקוח
router.put('/:id/status', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        const { status } = req.body;
        const client = await Client.findOneAndUpdate(
            { _id: req.params.id, therapist: req.user.id },
            { status },
            { new: true }
        );
        if (!client) {
            return res.status(404).json({ success: false, message: 'לקוח לא נמצא' });
        }
        res.json({ success: true, data: client });
    } catch (error) {
        res.status(500).json({ success: false, message: 'שגיאה בעדכון סטטוס', error: error.message });
    }
});

module.exports = router; 