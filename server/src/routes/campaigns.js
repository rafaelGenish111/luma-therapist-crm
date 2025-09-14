// server/src/routes/campaigns.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const emailCampaignService = require('../services/emailCampaignService');
const { Campaign, EmailTemplate, EmailLog } = require('../models/Campaign');
const Client = require('../models/Client');

// GET /api/campaigns - קבלת רשימת קמפיינים
router.get('/', auth, authorize(['manage_campaigns']), async (req, res) => {
    try {
        const { status, dateFrom, dateTo, page = 1, limit = 10 } = req.query;
        
        const filters = {};
        if (status) filters.status = status;
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;

        const campaigns = await emailCampaignService.getCampaigns(req.user.id, filters);
        
        res.json({
            success: true,
            data: campaigns,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: campaigns.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/campaigns - יצירת קמפיין חדש
router.post('/', auth, authorize(['manage_campaigns']), async (req, res) => {
    try {
        const { name, description, subject, content, recipientList, scheduledAt } = req.body;

        // בדיקות תקינות
        if (!name || !subject || !content) {
            return res.status(400).json({
                success: false,
                error: 'שדות חובה חסרים'
            });
        }

        // וידוא שהלקוחות שייכים למטפל
        if (recipientList && recipientList.length > 0) {
            const clientsCount = await Client.countDocuments({
                _id: { $in: recipientList },
                therapist: req.user.id
            });
            
            if (clientsCount !== recipientList.length) {
                return res.status(400).json({
                    success: false,
                    error: 'חלק מהלקוחות אינם שייכים למטפל'
                });
            }
        }

        const campaignData = {
            name,
            description,
            subject,
            content,
            recipientList: recipientList || [],
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null
        };

        const campaign = await emailCampaignService.createCampaign(req.user.id, campaignData);

        res.status(201).json({
            success: true,
            data: campaign,
            message: 'קמפיין נוצר בהצלחה'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/campaigns/:id - קבלת פרטי קמפיין
router.get('/:id', auth, authorize(['manage_campaigns']), async (req, res) => {
    try {
        const campaign = await Campaign.findOne({
            _id: req.params.id,
            therapist: req.user.id
        }).populate('recipientList', 'firstName lastName email phone');

        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: 'קמפיין לא נמצא'
            });
        }

        res.json({
            success: true,
            data: campaign
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/campaigns/:id - עדכון קמפיין
router.put('/:id', auth, authorize(['manage_campaigns']), async (req, res) => {
    try {
        const campaign = await Campaign.findOne({
            _id: req.params.id,
            therapist: req.user.id
        });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: 'קמפיין לא נמצא'
            });
        }

        // לא ניתן לערוך קמפיין שנשלח
        if (campaign.status === 'sent') {
            return res.status(400).json({
                success: false,
                error: 'לא ניתן לערוך קמפיין שנשלח'
            });
        }

        const updatedCampaign = await Campaign.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: updatedCampaign,
            message: 'קמפיין עודכן בהצלחה'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/campaigns/:id - מחיקת קמפיין
router.delete('/:id', auth, authorize(['manage_campaigns']), async (req, res) => {
    try {
        const campaign = await Campaign.findOne({
            _id: req.params.id,
            therapist: req.user.id
        });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: 'קמפיין לא נמצא'
            });
        }

        // מחיקה רכה
        campaign.deletedAt = new Date();
        await campaign.save();

        res.json({
            success: true,
            message: 'קמפיין נמחק בהצלחה'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/campaigns/:id/send - שליחת קמפיין
router.post('/:id/send', auth, authorize(['manage_campaigns']), async (req, res) => {
    try {
        const result = await emailCampaignService.sendCampaign(req.params.id, req.user.id);

        res.json({
            success: true,
            data: result,
            message: 'קמפיין נשלח בהצלחה'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/campaigns/:id/stats - סטטיסטיקות קמפיין
router.get('/:id/stats', auth, authorize(['manage_campaigns']), async (req, res) => {
    try {
        const stats = await emailCampaignService.getCampaignStats(req.params.id, req.user.id);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Email Templates Routes

// GET /api/campaigns/templates/list - קבלת תבניות
router.get('/templates/list', auth, authorize(['manage_campaigns']), async (req, res) => {
    try {
        const { category } = req.query;
        const templates = await emailCampaignService.getTemplates(req.user.id, category);

        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/campaigns/templates - יצירת תבנית
router.post('/templates', auth, authorize(['manage_campaigns']), async (req, res) => {
    try {
        const template = await emailCampaignService.createTemplate(req.user.id, req.body);

        res.status(201).json({
            success: true,
            data: template,
            message: 'תבנית נוצרה בהצלחה'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/campaigns/templates/:id - עדכון תבנית
router.put('/templates/:id', auth, authorize(['manage_email_templates']), async (req, res) => {
    try {
        const template = await EmailTemplate.findOne({
            _id: req.params.id,
            therapist: req.user.id
        });

        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'תבנית לא נמצאה'
            });
        }

        const updatedTemplate = await EmailTemplate.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: updatedTemplate,
            message: 'תבנית עודכנה בהצלחה'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/campaigns/templates/:id - מחיקת תבנית
router.delete('/templates/:id', auth, authorize(['manage_email_templates']), async (req, res) => {
    try {
        const template = await EmailTemplate.findOne({
            _id: req.params.id,
            therapist: req.user.id
        });

        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'תבנית לא נמצאה'
            });
        }

        // מחיקה רכה
        template.deletedAt = new Date();
        await template.save();

        res.json({
            success: true,
            message: 'תבנית נמחקה בהצלחה'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Client Lists Routes

// GET /api/campaigns/client-lists/all - קבלת רשימות לקוחות עם פילטרים
router.get('/client-lists/all', auth, authorize(['manage_campaigns']), async (req, res) => {
    try {
        const { search, hasEmail, lastTreatment, tags } = req.query;
        
        const query = { therapist: req.user.id };
        
        // פילטר לקוחות עם אימייל בלבד
        if (hasEmail === 'true') {
            query.email = { $exists: true, $ne: '' };
        }
        
        // חיפוש טקסט
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        // פילטר לפי תאריך טיפול אחרון
        if (lastTreatment) {
            const date = new Date();
            if (lastTreatment === 'week') {
                date.setDate(date.getDate() - 7);
            } else if (lastTreatment === 'month') {
                date.setMonth(date.getMonth() - 1);
            } else if (lastTreatment === '3months') {
                date.setMonth(date.getMonth() - 3);
            }
            query.lastAppointment = { $gte: date };
        }

        const clients = await Client.find(query)
            .select('firstName lastName email phone lastAppointment tags')
            .sort({ firstName: 1 });

        res.json({
            success: true,
            data: clients,
            total: clients.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/campaigns/client-lists/export - ייצוא רשימת לקוחות
router.post('/client-lists/export', auth, authorize(['export_client_lists']), async (req, res) => {
    try {
        const { clientIds, format = 'csv' } = req.body;
        
        let clients;
        if (clientIds && clientIds.length > 0) {
            clients = await Client.find({
                _id: { $in: clientIds },
                therapist: req.user.id
            });
        } else {
            clients = await Client.find({ therapist: req.user.id });
        }

        if (format === 'csv') {
            const csvData = clients.map(client => ({
                'שם פרטי': client.firstName,
                'שם משפחה': client.lastName,
                'אימייל': client.email,
                'טלפון': client.phone,
                'תאריך הוספה': client.createdAt?.toLocaleDateString('he-IL')
            }));

            res.json({
                success: true,
                data: csvData,
                message: 'רשימה יוצאה בהצלחה'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/campaigns/client-lists/import - יבוא רשימת לקוחות
router.post('/client-lists/import', auth, authorize(['manage_campaigns']), async (req, res) => {
    try {
        // כאן תוכל להוסיף לוגיקה ליבוא קבצי CSV/Excel
        res.json({
            success: true,
            message: 'יבוא רשימה יהיה זמין בקרוב'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Email Tracking Routes

// GET /api/campaigns/tracking/open/:campaignId/:clientId - מעקב פתיחת אימייל
router.get('/tracking/open/:campaignId/:clientId', async (req, res) => {
    try {
        await emailCampaignService.trackEmailOpen(req.params.campaignId, req.params.clientId);
        
        // החזרת תמונה שקופה של 1x1 פיקסל
        const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        res.writeHead(200, {
            'Content-Type': 'image/gif',
            'Content-Length': pixel.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(pixel);
    } catch (error) {
        res.status(500).end();
    }
});

// GET /api/campaigns/tracking/click/:campaignId/:clientId - מעקב קליקים
router.get('/tracking/click/:campaignId/:clientId', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (url) {
            await emailCampaignService.trackEmailClick(
                req.params.campaignId, 
                req.params.clientId, 
                decodeURIComponent(url)
            );
            
            // הפניה לכתובת המקורית
            res.redirect(decodeURIComponent(url));
        } else {
            res.status(400).send('Missing URL parameter');
        }
    } catch (error) {
        res.status(500).send('Tracking error');
    }
});

// Campaign Management Routes

// POST /api/campaigns/:id/schedule - תזמון קמפיין
router.post('/:id/schedule', auth, authorize(['manage_campaigns']), async (req, res) => {
    try {
        const { scheduledAt } = req.body;
        
        if (!scheduledAt) {
            return res.status(400).json({
                success: false,
                error: 'תאריך תזמון נדרש'
            });
        }

        const campaign = await Campaign.findOne({
            _id: req.params.id,
            therapist: req.user.id
        });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: 'קמפיין לא נמצא'
            });
        }

        if (campaign.status !== 'draft') {
            return res.status(400).json({
                success: false,
                error: 'ניתן לתזמן רק קמפיינים בטיוטה'
            });
        }

        campaign.scheduledAt = new Date(scheduledAt);
        campaign.status = 'scheduled';
        await campaign.save();

        res.json({
            success: true,
            data: campaign,
            message: 'קמפיין תוזמן בהצלחה'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/campaigns/:id/duplicate - שכפול קמפיין
router.post('/:id/duplicate', auth, authorize(['manage_campaigns']), async (req, res) => {
    try {
        const originalCampaign = await Campaign.findOne({
            _id: req.params.id,
            therapist: req.user.id
        });

        if (!originalCampaign) {
            return res.status(404).json({
                success: false,
                error: 'קמפיין לא נמצא'
            });
        }

        const duplicatedCampaign = new Campaign({
            name: `${originalCampaign.name} - עותק`,
            description: originalCampaign.description,
            subject: originalCampaign.subject,
            content: originalCampaign.content,
            recipientList: originalCampaign.recipientList,
            therapist: req.user.id,
            status: 'draft'
        });

        await duplicatedCampaign.save();

        res.status(201).json({
            success: true,
            data: duplicatedCampaign,
            message: 'קמפיין שוכפל בהצלחה'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/campaigns/:id/logs - לוגי שליחה של קמפיין
router.get('/:id/logs', auth, authorize(['view_campaign_stats']), async (req, res) => {
    try {
        const { page = 1, limit = 50, status } = req.query;
        
        const query = {
            campaign: req.params.id,
            therapist: req.user.id
        };
        
        if (status) {
            query.status = status;
        }

        const logs = await EmailLog.find(query)
            .populate('client', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await EmailLog.countDocuments(query);

        res.json({
            success: true,
            data: logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/campaigns/dashboard/overview - סקירה כללית
router.get('/dashboard/overview', auth, authorize(['manage_campaigns']), async (req, res) => {
    try {
        const therapistId = req.user.id;
        
        // סטטיסטיקות בסיסיות
        const totalCampaigns = await Campaign.countDocuments({ therapist: therapistId });
        const sentCampaigns = await Campaign.countDocuments({ 
            therapist: therapistId, 
            status: 'sent' 
        });
        const draftCampaigns = await Campaign.countDocuments({ 
            therapist: therapistId, 
            status: 'draft' 
        });

        // סטטיסטיקות אימיילים
        const totalEmailsSent = await EmailLog.countDocuments({ 
            therapist: therapistId,
            status: { $in: ['sent', 'delivered', 'opened', 'clicked'] }
        });
        const totalEmailsOpened = await EmailLog.countDocuments({ 
            therapist: therapistId,
            status: { $in: ['opened', 'clicked'] }
        });

        // חישוב אחוזים
        const openRate = totalEmailsSent > 0 ? 
            ((totalEmailsOpened / totalEmailsSent) * 100).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                totalCampaigns,
                sentCampaigns,
                draftCampaigns,
                totalEmailsSent,
                openRate: parseFloat(openRate)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;