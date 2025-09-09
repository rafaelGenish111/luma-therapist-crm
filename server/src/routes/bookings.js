const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Therapist = require('../models/Therapist');
// const emailService = require('../utils/emailService'); // נשתמש בזה בעתיד

// ולידציה לבקשת קביעת תור
const validateBookingRequest = [
    body('therapistId')
        .isMongoId()
        .withMessage('מזהה מטפל לא תקין'),
    body('fullName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('שם מלא חייב להכיל 2-100 תווים'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('כתובת אימייל לא תקינה'),
    body('phone')
        .optional()
        .trim()
        .isLength({ min: 9, max: 15 })
        .withMessage('מספר טלפון חייב להכיל 9-15 ספרות'),
    body('requestedDate')
        .isISO8601()
        .withMessage('תאריך מבוקש לא תקין'),
    body('preferredTime')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('שעה מועדפת לא תקינה'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('הערות לא יכולות להכיל יותר מ-1000 תווים')
];

// פונקציה לטיפול בשגיאות ולידציה
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'נתונים לא תקינים',
            details: errors.array()
        });
    }
    next();
};

/**
 * POST /api/bookings/email
 * קביעת תור במייל
 */
router.post('/email', validateBookingRequest, handleValidationErrors, async (req, res) => {
    try {
        const {
            therapistId,
            fullName,
            email,
            phone,
            requestedDate,
            preferredTime,
            notes
        } = req.body;

        // בדיקה שהמטפל קיים
        const therapist = await Therapist.findById(therapistId);
        if (!therapist) {
            return res.status(404).json({
                success: false,
                error: 'מטפל לא נמצא'
            });
        }

        // בדיקה שהמטפל פעיל
        if (!therapist.isActive) {
            return res.status(400).json({
                success: false,
                error: 'המטפל אינו פעיל כרגע'
            });
        }

        // יצירת תוכן האימייל
        const emailContent = `
            <h2>בקשת קביעת תור חדשה</h2>
            <p><strong>מטפל:</strong> ${therapist.firstName} ${therapist.lastName}</p>
            <hr>
            <h3>פרטי המבקש:</h3>
            <p><strong>שם מלא:</strong> ${fullName}</p>
            <p><strong>אימייל:</strong> ${email}</p>
            ${phone ? `<p><strong>טלפון:</strong> ${phone}</p>` : ''}
            <p><strong>תאריך מבוקש:</strong> ${new Date(requestedDate).toLocaleDateString('he-IL')}</p>
            <p><strong>שעה מועדפת:</strong> ${preferredTime}</p>
            ${notes ? `<p><strong>הערות:</strong> ${notes}</p>` : ''}
            <hr>
            <p><small>בקשה זו נשלחה מהאתר האישי של ${therapist.firstName} ${therapist.lastName}</small></p>
        `;

        // שליחת אימייל למטפל (כרגע רק לוג)
        const therapistEmail = therapist.businessEmail || therapist.email;
        console.log('📧 Email to therapist would be sent to:', therapistEmail);
        console.log('📧 Subject:', `בקשת קביעת תור חדשה - ${fullName}`);
        console.log('📧 Content:', emailContent);

        // שליחת אימייל אישור למבקש (כרגע רק לוג)
        const confirmationContent = `
            <h2>בקשת קביעת תור התקבלה</h2>
            <p>שלום ${fullName},</p>
            <p>בקשתך לקביעת תור התקבלה בהצלחה!</p>
            <p><strong>פרטי הבקשה:</strong></p>
            <ul>
                <li><strong>מטפל:</strong> ${therapist.firstName} ${therapist.lastName}</li>
                <li><strong>תאריך מבוקש:</strong> ${new Date(requestedDate).toLocaleDateString('he-IL')}</li>
                <li><strong>שעה מועדפת:</strong> ${preferredTime}</li>
            </ul>
            <p>המטפל יחזור אליך בהקדם כדי לאשר את התור או להציע זמנים חלופיים.</p>
            <p>תודה,<br>צוות ${therapist.firstName} ${therapist.lastName}</p>
        `;

        console.log('📧 Confirmation email would be sent to:', email);
        console.log('📧 Subject:', `אישור בקשת קביעת תור - ${therapist.firstName} ${therapist.lastName}`);
        console.log('📧 Content:', confirmationContent);

        // לוג של הבקשה
        console.log(`Booking request received: ${fullName} (${email}) for ${therapist.firstName} ${therapist.lastName} on ${requestedDate} at ${preferredTime}`);

        res.json({
            success: true,
            message: 'בקשת קביעת תור נשלחה בהצלחה',
            data: {
                bookingId: Date.now().toString(), // מזהה זמני
                therapistName: `${therapist.firstName} ${therapist.lastName}`,
                requestedDate,
                preferredTime
            }
        });

    } catch (error) {
        console.error('Booking email error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בשליחת בקשת קביעת תור'
        });
    }
});

/**
 * GET /api/bookings/therapist/:therapistId/availability
 * בדיקת זמינות של מטפל (לעתיד)
 */
router.get('/therapist/:therapistId/availability', async (req, res) => {
    try {
        const { therapistId } = req.params;
        const { date } = req.query;

        const therapist = await Therapist.findById(therapistId);
        if (!therapist) {
            return res.status(404).json({
                success: false,
                error: 'מטפל לא נמצא'
            });
        }

        // כאן תהיה לוגיקה לבדיקת זמינות
        // כרגע מחזיר זמינות בסיסית
        const workingHours = therapist.workingHours || {};
        const requestedDate = new Date(date);

        // המרת היום לאנגלית
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = dayNames[requestedDate.getDay()];

        console.log('Checking availability for:', dayOfWeek, 'workingHours:', workingHours);

        if (workingHours[dayOfWeek]?.isWorking) {
            res.json({
                success: true,
                data: {
                    isAvailable: true,
                    workingHours: workingHours[dayOfWeek],
                    availableSlots: [
                        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
                        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
                    ]
                }
            });
        } else {
            res.json({
                success: true,
                data: {
                    isAvailable: false,
                    message: 'המטפל לא עובד ביום זה'
                }
            });
        }

    } catch (error) {
        console.error('Availability check error:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בבדיקת זמינות'
        });
    }
});

module.exports = router;
