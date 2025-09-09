const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const ClientDocument = require('../models/ClientDocument');
const Client = require('../models/Client');

// הגדרת multer לעיבוד קבצים
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        // בדיקת סוגי קבצים מותרים
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('סוג קובץ לא נתמך'), false);
        }
    }
});

/**
 * העלאת מסמך חדש
 * POST /api/clients/:clientId/documents
 */
router.post('/clients/:clientId/documents',
    auth,
    authorize(['therapist', 'admin']),
    upload.single('file'),
    async (req, res) => {
        try {
            const { clientId } = req.params;
            const { title, type = 'other', description, isRequired = false } = req.body;
            const therapistId = req.user.id;

            // בדיקה שהלקוח קיים ושייך למטפלת
            const client = await Client.findById(clientId);
            if (!client) {
                return res.status(404).json({ error: 'לקוח לא נמצא' });
            }

            if (client.therapist.toString() !== therapistId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'אין הרשאה לגשת ללקוח זה' });
            }

            // בדיקת קובץ
            if (!req.file) {
                return res.status(400).json({ error: 'לא נבחר קובץ להעלאה' });
            }

            if (!title) {
                return res.status(400).json({ error: 'כותרת המסמך היא שדה חובה' });
            }

            console.log(`Uploading document for client ${clientId}: ${title}`);

            // העלאה ל-Cloudinary
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: `clients/${clientId}/documents`,
                        resource_type: 'auto',
                        public_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                stream.end(req.file.buffer);
            });

            // יצירת מסמך במסד הנתונים
            const document = new ClientDocument({
                clientId,
                title,
                type,
                url: uploadResult.secure_url,
                uploadedBy: therapistId,
                description,
                isRequired,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            });

            await document.save();

            console.log(`Document uploaded successfully: ${document._id}`);

            res.status(201).json({
                success: true,
                document
            });

        } catch (error) {
            console.error('Error uploading document:', error);

            if (error.message === 'סוג קובץ לא נתמך') {
                return res.status(400).json({ error: 'סוג קובץ לא נתמך' });
            }

            res.status(500).json({ error: 'שגיאה פנימית בשרת' });
        }
    }
);

/**
 * קבלת מסמכים של לקוח
 * GET /api/clients/:clientId/documents
 */
router.get('/clients/:clientId/documents', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { clientId } = req.params;
        const { type, isRequired, isCompleted, limit = 50, page = 1 } = req.query;
        const therapistId = req.user.id;

        // בדיקה שהלקוח קיים ושייך למטפלת
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ error: 'לקוח לא נמצא' });
        }

        if (client.therapist.toString() !== therapistId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'אין הרשאה לגשת ללקוח זה' });
        }

        console.log(`Fetching documents for client ${clientId}`);

        // בניית אפשרויות הסינון
        const options = {
            limit: parseInt(limit),
            page: parseInt(page)
        };

        if (type) options.type = type;
        if (isRequired !== undefined) options.isRequired = isRequired === 'true';
        if (isCompleted !== undefined) options.isCompleted = isCompleted === 'true';

        // קבלת המסמכים
        const documents = await ClientDocument.findByClient(clientId, options);

        // חישוב סטטיסטיקות
        const allDocuments = await ClientDocument.find({ clientId });
        const stats = {
            total: allDocuments.length,
            byType: {
                health: allDocuments.filter(d => d.type === 'health').length,
                consent: allDocuments.filter(d => d.type === 'consent').length,
                report: allDocuments.filter(d => d.type === 'report').length,
                other: allDocuments.filter(d => d.type === 'other').length
            },
            required: allDocuments.filter(d => d.isRequired).length,
            completed: allDocuments.filter(d => d.isCompleted).length
        };

        console.log(`Found ${documents.length} documents for client ${clientId}`);

        res.json({
            success: true,
            documents,
            stats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: allDocuments.length
            }
        });

    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

/**
 * מחיקת מסמך
 * DELETE /api/documents/:id
 */
router.delete('/documents/:id', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const therapistId = req.user.id;

        // בדיקה שהמסמך קיים ושייך למטפלת
        const document = await ClientDocument.findById(id);
        if (!document) {
            return res.status(404).json({ error: 'מסמך לא נמצא' });
        }

        // בדיקה שהלקוח שייך למטפלת
        const client = await Client.findById(document.clientId);
        if (!client) {
            return res.status(404).json({ error: 'לקוח לא נמצא' });
        }

        if (client.therapist.toString() !== therapistId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'אין הרשאה למחוק מסמך זה' });
        }

        console.log(`Deleting document ${id}`);

        // מחיקה מ-Cloudinary
        if (document.url) {
            try {
                const publicId = document.url.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (cloudinaryError) {
                console.warn('Failed to delete from Cloudinary:', cloudinaryError);
            }
        }

        // מחיקה לוגית מהמסד נתונים
        await document.softDelete();

        console.log(`Document deleted successfully: ${id}`);

        res.json({
            success: true,
            message: 'המסמך נמחק בהצלחה'
        });

    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

/**
 * עדכון סטטוס מסמך
 * PATCH /api/documents/:id/status
 */
router.patch('/documents/:id/status', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { isCompleted } = req.body;
        const therapistId = req.user.id;

        // בדיקה שהמסמך קיים ושייך למטפלת
        const document = await ClientDocument.findById(id);
        if (!document) {
            return res.status(404).json({ error: 'מסמך לא נמצא' });
        }

        // בדיקה שהלקוח שייך למטפלת
        const client = await Client.findById(document.clientId);
        if (!client) {
            return res.status(404).json({ error: 'לקוח לא נמצא' });
        }

        if (client.therapist.toString() !== therapistId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'אין הרשאה לעדכן מסמך זה' });
        }

        console.log(`Updating document status ${id}, isCompleted: ${isCompleted}`);

        // עדכון הסטטוס
        if (isCompleted) {
            await document.markAsCompleted();
        } else {
            await document.markAsIncomplete();
        }

        console.log(`Document status updated successfully: ${id}`);

        res.json({
            success: true,
            document
        });

    } catch (error) {
        console.error('Error updating document status:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

/**
 * קבלת מסמכים נדרשים של לקוח
 * GET /api/clients/:clientId/documents/required
 */
router.get('/clients/:clientId/documents/required', auth, authorize(['therapist', 'admin']), async (req, res) => {
    try {
        const { clientId } = req.params;
        const therapistId = req.user.id;

        // בדיקה שהלקוח קיים ושייך למטפלת
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ error: 'לקוח לא נמצא' });
        }

        if (client.therapist.toString() !== therapistId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'אין הרשאה לגשת ללקוח זה' });
        }

        console.log(`Fetching required documents for client ${clientId}`);

        // קבלת מסמכים נדרשים
        const requiredDocuments = await ClientDocument.findRequiredByClient(clientId);
        const completedDocuments = await ClientDocument.findCompletedByClient(clientId);

        res.json({
            success: true,
            required: requiredDocuments,
            completed: completedDocuments,
            progress: {
                total: requiredDocuments.length,
                completed: completedDocuments.length,
                percentage: requiredDocuments.length > 0
                    ? Math.round((completedDocuments.length / requiredDocuments.length) * 100)
                    : 0
            }
        });

    } catch (error) {
        console.error('Error fetching required documents:', error);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
    }
});

module.exports = router;
