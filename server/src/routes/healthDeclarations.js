const express = require('express');
const router = express.Router();
const HealthDeclaration = require('../models/HealthDeclaration');
const Client = require('../models/Client');
const Therapist = require('../models/Therapist');
const { sendEmail } = require('../services/emailService');
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// שליחת הצהרת בריאות מהאתר הפומבי - נשמרת רק אם קיימת לקוחה עם ת.ז. אצל המטפלת
router.post('/public/health-declaration', async (req, res) => {
    try {
        const { therapistId, fullName, idNumber, phone, email, answers } = req.body || {};
        if (!therapistId || !fullName || !idNumber || !phone || !answers) {
            return res.status(400).json({ success: false, message: 'חסרים שדות חובה' });
        }

        // נירמול ת.ז.
        const normalizedId = String(idNumber).replace(/\D/g, '').slice(0, 9);

        // בדיקה לקיום לקוחה עם תעודת זהות אצל המטפלת
        const client = await Client.findOne({ therapist: therapistId, nationalId: normalizedId });

        if (!client) {
            // לא לשמור הצהרה. ניתן להחזיר 202 ושגיאה ידידותית
            return res.status(202).json({
                success: true,
                saved: false,
                message: 'תודה! לא נמצאה לקוחה עם ת.ז. זו אצל המטפלת. ההצהרה לא נשמרה.'
            });
        }

        // צור הצהרת בריאות משויכת ללקוחה
        const declaration = new HealthDeclaration({
            client: client._id,
            therapist: therapistId,
            fullName,
            idNumber: normalizedId,
            phone,
            email,
            answers,
            clientName: fullName,
            clientEmail: email,
            clientPhone: phone,
            status: 'pending'
        });
        await declaration.save();

        // שליחת מייל למטפלת
        try {
            const therapist = await Therapist.findById(therapistId).select('email firstName lastName');
            if (therapist?.email) {
                const linkBase = process.env.APP_BASE_URL || process.env.CLIENT_URL || 'http://localhost:8000';
                const link = `${linkBase}/dashboard/clients/${client._id}`;
                await sendEmail({
                    to: therapist.email,
                    subject: 'התקבלה הצהרת בריאות חדשה',
                    html: `
                        <div style="direction:rtl;font-family:Arial,Helvetica,sans-serif;">
                          <p>שלום ${therapist.firstName || ''},</p>
                          <p>התקבלה הצהרת בריאות חדשה עבור הלקוחה <strong>${fullName}</strong> (ת.ז. ${normalizedId}).</p>
                          <p>טלפון: ${phone || ''} | אימייל: ${email || ''}</p>
                          <p><a href="${link}">לצפייה בתיק הלקוחה</a></p>
                        </div>
                    `
                });
            }
        } catch (e) { /* no-op */ }

        res.status(201).json({ success: true, saved: true, data: declaration });
    } catch (error) {
        res.status(500).json({ success: false, message: 'שגיאה בשליחת הצהרת בריאות', error: error.message });
    }
});

// יצירת הצהרת בריאות ציבורית (ללא אימות)
router.post('/public', async (req, res) => {
    try {
        console.log('Public Health Declaration POST request:', req.body);

        const {
            therapistId,
            clientName,
            clientEmail,
            clientPhone,
            idNumber,
            age,
            medicalConditions,
            medications,
            allergies,
            previousSurgeries,
            pregnancyStatus,
            breastfeeding,
            physicalLimitations,
            currentStress,
            previousTherapy,
            expectations,
            additionalInfo
        } = req.body;

        // בדיקת שדות חובה
        if (!therapistId || !clientName || !clientEmail || !clientPhone || !idNumber || !age) {
            return res.status(400).json({
                success: false,
                message: 'חסרים שדות חובה: שם, ת.ז., אימייל, טלפון וגיל נדרשים'
            });
        }

        // נירמול ת.ז. וחיפוש לקוחה
        const normalizedId = String(idNumber).replace(/\D/g, '').slice(0, 9);
        const client = await Client.findOne({ therapist: therapistId, nationalId: normalizedId });

        if (!client) {
            return res.status(202).json({
                success: true,
                saved: false,
                message: 'תודה! לא נמצאה לקוחה עם ת.ז. זו אצל המטפלת. ההצהרה לא נשמרה.'
            });
        }

        // יצירת הצהרת בריאות משויכת ללקוחה
        const declaration = new HealthDeclaration({
            therapist: therapistId,
            client: client._id,
            clientName,
            clientEmail,
            clientPhone,
            idNumber: normalizedId,
            age: parseInt(age),
            medicalConditions: medicalConditions || [],
            medications: medications || '',
            allergies: allergies || '',
            previousSurgeries: previousSurgeries || '',
            pregnancyStatus: pregnancyStatus || false,
            breastfeeding: breastfeeding || false,
            physicalLimitations: physicalLimitations || '',
            currentStress: currentStress || '',
            previousTherapy: previousTherapy || '',
            expectations: expectations || '',
            additionalInfo: additionalInfo || '',
            status: 'pending'
        });

        await declaration.save();

        try {
            const therapist = await Therapist.findById(therapistId).select('email firstName lastName');
            if (therapist?.email) {
                const linkBase = process.env.APP_BASE_URL || process.env.CLIENT_URL || 'http://localhost:8000';
                const link = `${linkBase}/dashboard/clients/${client._id}`;
                await sendEmail({
                    to: therapist.email,
                    subject: 'התקבלה הצהרת בריאות חדשה',
                    html: `
                        <div style="direction:rtl;font-family:Arial,Helvetica,sans-serif;">
                          <p>שלום ${therapist.firstName || ''},</p>
                          <p>התקבלה הצהרת בריאות חדשה עבור הלקוחה <strong>${clientName}</strong> (ת.ז. ${normalizedId}).</p>
                          <p>טלפון: ${clientPhone || ''} | אימייל: ${clientEmail || ''}</p>
                          <p><a href="${link}">לצפייה בתיק הלקוחה</a></p>
                        </div>
                    `
                });
            }
        } catch (e) { /* no-op */ }

        console.log('Public Health Declaration created successfully:', declaration._id);
        res.status(201).json({ success: true, saved: true, data: declaration });

    } catch (error) {
        console.error('Error creating public health declaration:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בשליחת הצהרת בריאות',
            error: error.message
        });
    }
});

// יצירת הצהרת בריאות (עם אימות)
router.post('/', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        console.log('Health Declaration POST request:', req.body);

        const {
            therapistId,
            clientName,
            clientEmail,
            clientPhone,
            idNumber,
            age,
            medicalConditions,
            medications,
            allergies,
            previousSurgeries,
            pregnancyStatus,
            breastfeeding,
            physicalLimitations,
            currentStress,
            previousTherapy,
            expectations,
            additionalInfo
        } = req.body;

        if (!therapistId || !clientName || !clientEmail || !clientPhone || !idNumber || !age) {
            return res.status(400).json({
                success: false,
                message: 'חסרים שדות חובה: שם, ת.ז., אימייל, טלפון וגיל נדרשים'
            });
        }

        // צור הצהרת בריאות
        const declaration = new HealthDeclaration({
            therapist: therapistId,
            clientName,
            clientEmail,
            clientPhone,
            idNumber,
            age: parseInt(age),
            medicalConditions: medicalConditions || [],
            medications: medications || '',
            allergies: allergies || '',
            previousSurgeries: previousSurgeries || '',
            pregnancyStatus: pregnancyStatus || false,
            breastfeeding: breastfeeding || false,
            physicalLimitations: physicalLimitations || '',
            currentStress: currentStress || '',
            previousTherapy: previousTherapy || '',
            expectations: expectations || '',
            additionalInfo: additionalInfo || '',
            status: 'pending'
        });

        await declaration.save();

        console.log('Health Declaration created successfully:', declaration._id);
        res.status(201).json({ success: true, data: declaration });
    } catch (error) {
        console.error('Error creating health declaration:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בשליחת הצהרת בריאות',
            error: error.message
        });
    }
});

// שליפת כל ההצהרות של המטפלת
router.get('/', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        const criteria = { therapist: req.user.id };
        if (req.query.clientId) {
            criteria.client = req.query.clientId;
        }

        const declarations = await HealthDeclaration.find(criteria)
            .populate('client', 'firstName lastName nationalId phone email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: declarations });
    } catch (error) {
        res.status(500).json({ success: false, message: 'שגיאה בשליפת הצהרות', error: error.message });
    }
});

// שליפת הצהרה בודדת
router.get('/:id', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        const declaration = await HealthDeclaration.findOne({ _id: req.params.id, therapist: req.user.id })
            .populate('client', 'fullName idNumber phone email');
        if (!declaration) {
            return res.status(404).json({ success: false, message: 'הצהרה לא נמצאה' });
        }
        res.json({ success: true, data: declaration });
    } catch (error) {
        res.status(500).json({ success: false, message: 'שגיאה בשליפת הצהרה', error: error.message });
    }
});

// עדכון סטטוס/הערות
router.put('/:id/status', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        const { status, notes } = req.body;
        const declaration = await HealthDeclaration.findOneAndUpdate(
            { _id: req.params.id, therapist: req.user.id },
            { status, notes },
            { new: true }
        );
        if (!declaration) {
            return res.status(404).json({ success: false, message: 'הצהרה לא נמצאה' });
        }
        res.json({ success: true, data: declaration });
    } catch (error) {
        res.status(500).json({ success: false, message: 'שגיאה בעדכון הצהרה', error: error.message });
    }
});

// מחיקת הצהרה (אופציונלי)
router.delete('/:id', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        const declaration = await HealthDeclaration.findOneAndDelete({ _id: req.params.id, therapist: req.user.id });
        if (!declaration) {
            return res.status(404).json({ success: false, message: 'הצהרה לא נמצאה' });
        }
        res.json({ success: true, message: 'הצהרה נמחקה' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'שגיאה במחיקת הצהרה', error: error.message });
    }
});

module.exports = router; 