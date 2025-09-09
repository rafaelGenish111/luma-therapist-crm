const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Models
const OtpToken = require('../models/OtpToken');
const SignedDeclaration = require('../models/SignedDeclaration');
const User = require('../models/User');
const Therapist = require('../models/Therapist');

// Services
const smsService = require('../services/smsService');
const emailService = require('../utils/emailService');

// Middleware
const { auth } = require('../middleware/auth');
const {
    otpLimiter,
    signatureLimiter,
    enforceHTTPS,
    auditLog,
    validateRequest
} = require('../middleware/security');

const router = express.Router();

// Helper functions
const sha256 = (str) => crypto.createHash('sha256').update(str, 'utf8').digest('hex');

const generateOtpCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const ensureStorageDir = () => {
    const storageDir = path.join(process.cwd(), 'storage', 'signed-documents');
    if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
    }
    return storageDir;
};

// @route   POST /api/esign/otp/start
// @desc    יצירת OTP ושליחתו לאימות חתימה דיגיטלית
// @access  Private
router.post('/otp/start',
    enforceHTTPS,
    auth,
    otpLimiter,
    validateRequest,
    auditLog('otp_start'),
    async (req, res) => {
        try {
            const userId = req.user.id;
            const { payload, channel } = req.body;

            if (!payload) {
                return res.status(400).json({
                    success: false,
                    message: 'חסר תוכן להצהרת בריאות'
                });
            }

            // Get user/therapist details
            let user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'משתמש לא נמצא'
                });
            }

            let therapist = null;
            if (user.userType === 'THERAPIST') {
                therapist = await Therapist.findById(userId);
            }

            // חישוב hash של ה-payload
            const payloadHash = sha256(payload);

            // יצירת קוד OTP
            const code = generateOtpCode();
            const codeHash = await bcrypt.hash(code, 12);

            // קביעת ערוץ שליחה
            let preferredChannel = channel;
            let deliveryTarget = null;

            if (preferredChannel === 'sms' && (user.phone || therapist?.phone)) {
                deliveryTarget = user.phone || therapist?.phone;
            } else if (user.email) {
                preferredChannel = 'email';
                deliveryTarget = user.email;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'לא נמצא ערוץ תקשורת זמין (טלפון או אימייל)'
                });
            }

            // מחיקת OTP ישנים עבור אותו payload
            await OtpToken.deleteMany({ userId, payloadHash });

            // שליחת הקוד
            let sentTo = '';
            try {
                if (preferredChannel === 'sms') {
                    if (process.env.NODE_ENV === 'development' && !smsService.isAvailable()) {
                        // Mock mode for development
                        await smsService.sendOtpSmsMock(deliveryTarget, code, 'חתימה דיגיטלית');
                        sentTo = smsService.normalizeIsraeliPhone(deliveryTarget);
                    } else {
                        const result = await smsService.sendOtpSms(deliveryTarget, code, 'חתימה דיגיטלית');
                        sentTo = result.to;
                    }
                } else {
                    await emailService.sendOtpEmail(deliveryTarget, code, 'חתימה דיגיטלית');
                    sentTo = deliveryTarget;
                }
            } catch (error) {
                console.error('Failed to send OTP:', error);
                return res.status(500).json({
                    success: false,
                    message: 'שגיאה בשליחת קוד אימות'
                });
            }

            // שמירת OTP Token
            await OtpToken.create({
                userId,
                payloadHash,
                codeHash,
                channel: preferredChannel,
                sentTo,
                ip: req.ip,
                ua: req.headers['user-agent'] || '',
                attempts: 0
            });

            res.json({
                success: true,
                sentTo: sentTo.includes('@') ? sentTo : sentTo.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3'),
                channel: preferredChannel
            });

        } catch (error) {
            console.error('OTP start error:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה פנימית בשרת'
            });
        }
    });

// @route   POST /api/esign/otp/verify
// @desc    אימות קוד OTP ויצירת PDF חתום
// @access  Private
router.post('/otp/verify',
    enforceHTTPS,
    auth,
    signatureLimiter,
    validateRequest,
    auditLog('digital_signature'),
    async (req, res) => {
        try {
            const userId = req.user.id;
            const { payload, code } = req.body;

            if (!payload || !code) {
                return res.status(400).json({
                    success: false,
                    message: 'חסרים שדות נדרשים'
                });
            }

            const payloadHash = sha256(payload);

            // חיפוש OTP token
            const token = await OtpToken.findOne({
                userId,
                payloadHash
            }).sort({ createdAt: -1 });

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'קוד אימות לא נמצא או פג תוקפו'
                });
            }

            // בדיקת מספר ניסיונות
            if (token.attempts >= token.maxAttempts) {
                return res.status(429).json({
                    success: false,
                    message: 'יותר מדי ניסיונות שגויים. בקש קוד חדש.'
                });
            }

            // אימות הקוד
            const isValidCode = await bcrypt.compare(code, token.codeHash);

            if (!isValidCode) {
                // עדכון מספר ניסיונות
                token.attempts += 1;
                await token.save();

                return res.status(400).json({
                    success: false,
                    message: `קוד שגוי. נותרו ${token.maxAttempts - token.attempts} ניסיונות`
                });
            }

            // Get user details for signing
            const user = await User.findById(userId);
            let therapist = null;
            if (user.userType === 'THERAPIST') {
                therapist = await Therapist.findById(userId);
            }

            // יצירת מזהה ייחודי למסמך
            const signedDocumentId = crypto.randomUUID();
            const signedAt = new Date();

            // יצירת תיקיית אחסון
            const storageDir = ensureStorageDir();
            const pdfFileName = `${signedDocumentId}.pdf`;
            const pdfFilePath = path.join(storageDir, pdfFileName);

            // יצירת PDF חתום
            await createSignedPDF({
                filePath: pdfFilePath,
                payload,
                payloadHash,
                signedDocumentId,
                signedAt,
                signer: {
                    name: therapist ? `${therapist.firstName} ${therapist.lastName}` : user.email,
                    phone: user.phone || therapist?.phone || '',
                    email: user.email,
                    userId
                },
                auditTrail: {
                    ip: token.ip,
                    userAgent: token.ua,
                    channel: token.channel,
                    sentTo: token.sentTo
                }
            });

            // חישוב hash של קובץ ה-PDF
            const pdfBuffer = fs.readFileSync(pdfFilePath);
            const pdfSha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

            // שמירה במסד הנתונים
            const signedDeclaration = await SignedDeclaration.create({
                userId,
                signerName: therapist ? `${therapist.firstName} ${therapist.lastName}` : user.email,
                signerPhone: user.phone || therapist?.phone || '',
                signerEmail: user.email,
                payload: JSON.parse(payload),
                payloadHash,
                pdfSha256,
                pdfPath: pdfFilePath,
                signedAt,
                ip: token.ip,
                ua: token.ua,
                method: 'AES-OTP',
                metadata: {
                    fileSize: pdfBuffer.length,
                    mimeType: 'application/pdf',
                    pages: 1 // יש לחשב מספר עמודים אמיתי אם נדרש
                }
            });

            // מחיקת OTP token (משימוש חד פעמי)
            await OtpToken.deleteMany({ userId, payloadHash });

            res.json({
                success: true,
                signedDocumentId,
                downloadUrl: `/api/esign/download/${signedDocumentId}`,
                signedAt,
                fileSize: pdfBuffer.length
            });

        } catch (error) {
            console.error('OTP verify error:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה באימות הקוד'
            });
        }
    });

// @route   GET /api/esign/download/:documentId
// @desc    הורדת PDF חתום
// @access  Private
router.get('/download/:documentId',
    enforceHTTPS,
    auth,
    auditLog('document_download'),
    async (req, res) => {
        try {
            const { documentId } = req.params;
            const userId = req.user.id;

            // חיפוש המסמך
            const document = await SignedDeclaration.findOne({
                _id: documentId,
                userId // ודא שהמשתמש יכול להוריד רק מסמכים שלו
            });

            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'מסמך לא נמצא'
                });
            }

            // בדיקת קיום הקובץ
            if (!fs.existsSync(document.pdfPath)) {
                return res.status(404).json({
                    success: false,
                    message: 'קובץ המסמך לא נמצא במערכת'
                });
            }

            // הגדרת headers להורדה
            const fileName = `הצהרת_בריאות_חתומה_${document.signedAt.toISOString().split('T')[0]}.pdf`;

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Cache-Control', 'no-cache');

            // שליחת הקובץ
            res.sendFile(document.pdfPath);

        } catch (error) {
            console.error('Download error:', error);
            res.status(500).json({
                success: false,
                message: 'שגיאה בהורדת המסמך'
            });
        }
    });

// @route   POST /api/esign/verify-integrity
// @desc    אימות שלמות מסמך חתום
// @access  Private
router.post('/verify-integrity', auth, async (req, res) => {
    try {
        const { signedDocumentId } = req.body;
        const userId = req.user.id;

        if (!signedDocumentId) {
            return res.status(400).json({
                success: false,
                message: 'חסר מזהה מסמך'
            });
        }

        // חיפוש המסמך
        const document = await SignedDeclaration.findOne({
            _id: signedDocumentId,
            userId
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'מסמך לא נמצא'
            });
        }

        // בדיקת קיום הקובץ
        if (!fs.existsSync(document.pdfPath)) {
            return res.status(404).json({
                success: false,
                valid: false,
                reason: 'קובץ המסמך לא נמצא במערכת'
            });
        }

        // חישוב hash נוכחי של הקובץ
        const pdfBuffer = fs.readFileSync(document.pdfPath);
        const currentHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

        // השוואה עם hash המקורי
        const isValid = document.pdfSha256 === currentHash;

        // בדיקות נוספות
        const isActive = document.status === 'active';
        const notExpired = !document.expiresAt || document.expiresAt > new Date();

        res.json({
            success: true,
            valid: isValid && isActive && notExpired,
            details: {
                hashMatch: isValid,
                status: document.status,
                expired: document.expiresAt && document.expiresAt <= new Date(),
                signedAt: document.signedAt,
                method: document.method,
                version: document.version
            },
            expectedHash: document.pdfSha256,
            actualHash: currentHash
        });

    } catch (error) {
        console.error('Verify integrity error:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה באימות שלמות המסמך'
        });
    }
});

// @route   GET /api/esign/history
// @desc    רשימת מסמכים חתומים של המשתמש
// @access  Private
router.get('/history', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const documents = await SignedDeclaration.find({ userId })
            .sort({ signedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-payload'); // לא מחזיר את התוכן המלא

        const total = await SignedDeclaration.countDocuments({ userId });

        res.json({
            success: true,
            documents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת היסטוריית מסמכים'
        });
    }
});

// Helper function to create signed PDF
async function createSignedPDF({ filePath, payload, payloadHash, signedDocumentId, signedAt, signer, auditTrail }) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'הצהרת בריאות חתומה דיגיטלית',
                    Author: signer.name,
                    Subject: 'חתימה דיגיטלית על הצהרת בריאות',
                    Creator: 'Wellness Platform',
                    Producer: 'Wellness Platform'
                }
            });

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Hebrew font support (if available)
            try {
                // doc.font('/path/to/hebrew-font.ttf');
            } catch (e) {
                // Fallback to default font
            }

            // Header
            doc.fontSize(20).text('הצהרת בריאות חתומה דיגיטלית', {
                align: 'center',
                underline: true
            });

            doc.moveDown(2);

            // Document info
            doc.fontSize(12);
            doc.text(`תאריך חתימה: ${signedAt.toLocaleString('he-IL')}`, { align: 'right' });
            doc.text(`מזהה מסמך: ${signedDocumentId}`, { align: 'right' });
            doc.text(`SHA-256(תוכן): ${payloadHash}`, { align: 'right' });
            doc.text(`שיטת חתימה: חתימה דיגיטלית מאובטחת (AES-OTP)`, { align: 'right' });

            doc.moveDown(1);

            // Signer info
            doc.fontSize(14).text('פרטי החותם:', { underline: true, align: 'right' });
            doc.fontSize(12);
            doc.text(`שם: ${signer.name}`, { align: 'right' });
            doc.text(`אימייל: ${signer.email}`, { align: 'right' });
            if (signer.phone) {
                doc.text(`טלפון: ${signer.phone}`, { align: 'right' });
            }

            doc.moveDown(1);

            // Content
            doc.fontSize(14).text('תוכן ההצהרה:', { underline: true, align: 'right' });
            doc.moveDown(0.5);

            // Parse and display payload nicely
            try {
                const parsedPayload = JSON.parse(payload);
                doc.fontSize(10);

                Object.entries(parsedPayload).forEach(([key, value]) => {
                    if (value && value !== '') {
                        doc.text(`${key}: ${JSON.stringify(value)}`, { align: 'right' });
                    }
                });
            } catch (e) {
                doc.fontSize(10).text(payload, { align: 'left' });
            }

            doc.moveDown(2);

            // Digital signature section
            doc.fontSize(14).text('חתימה דיגיטלית:', { underline: true, align: 'right' });
            doc.fontSize(10);
            doc.text('מסמך זה נחתם באופן דיגיטלי באמצעות אימות דו-שלבי (OTP).', { align: 'right' });
            doc.text('תוקף החתימה מובטח באמצעות הצפנה קריפטוגרפית ובדיקת שלמות.', { align: 'right' });

            doc.moveDown(1);

            // Audit trail
            doc.fontSize(12).text('מסלול ביקורת (Audit Trail):', { underline: true, align: 'right' });
            doc.fontSize(10);
            doc.text(`משתמש: ${signer.name} (${signer.userId})`, { align: 'right' });
            doc.text(`ערוץ אימות: ${auditTrail.channel} → ${auditTrail.sentTo}`, { align: 'right' });
            doc.text(`כתובת IP: ${auditTrail.ip}`, { align: 'right' });
            if (auditTrail.userAgent) {
                doc.text(`דפדפן: ${auditTrail.userAgent}`, { align: 'right' });
            }

            doc.moveDown(2);

            // Security notice
            doc.fontSize(10);
            doc.rect(50, doc.y, 500, 80).stroke();
            doc.text('הודעת אבטחה:', 60, doc.y + 10, { underline: true });
            doc.text('מסמך זה מוגן באמצעות חתימה דיגיטלית מתקדמת.', 60, doc.y + 5);
            doc.text('כל שינוי במסמך יזוהה ויפסול את החתימה.', 60, doc.y + 5);
            doc.text('לאימות שלמות המסמך, השתמש בפונקציית "אימות מסמך" במערכת.', 60, doc.y + 5);

            doc.end();

            stream.on('finish', resolve);
            stream.on('error', reject);

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = router;
