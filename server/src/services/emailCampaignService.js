// server/src/services/emailCampaignService.js
const nodemailer = require('nodemailer');
const { Campaign, EmailTemplate, EmailLog } = require('../models/Campaign');
const Client = require('../models/Client');

class EmailCampaignService {
    constructor() {
        this.transporter = this.createTransporter();
    }

    createTransporter() {
        // בהתאם להגדרות הסביבה
        if (process.env.EMAIL_SERVICE === 'gmail') {
            return nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        } else if (process.env.EMAIL_SERVICE === 'sendgrid') {
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: 'apikey',
                    pass: process.env.SENDGRID_API_KEY
                }
            });
        } else {
            // SMTP רגיל
            return nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        }
    }

    // יצירת קמפיין חדש
    async createCampaign(therapistId, campaignData) {
        try {
            const campaign = new Campaign({
                ...campaignData,
                therapist: therapistId
            });

            await campaign.save();
            return campaign;
        } catch (error) {
            throw new Error(`שגיאה ביצירת קמפיין: ${error.message}`);
        }
    }

    // קבלת רשימת קמפיינים
    async getCampaigns(therapistId, filters = {}) {
        try {
            const query = { therapist: therapistId };

            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.dateFrom) {
                query.createdAt = { $gte: new Date(filters.dateFrom) };
            }

            if (filters.dateTo) {
                query.createdAt = { ...query.createdAt, $lte: new Date(filters.dateTo) };
            }

            const campaigns = await Campaign.find(query)
                .populate('recipientList', 'firstName lastName email')
                .sort({ createdAt: -1 });

            return campaigns;
        } catch (error) {
            throw new Error(`שגיאה בקבלת קמפיינים: ${error.message}`);
        }
    }

    // שליחת קמפיין
    async sendCampaign(campaignId, therapistId) {
        try {
            const campaign = await Campaign.findOne({
                _id: campaignId,
                therapist: therapistId
            }).populate('recipientList');

            if (!campaign) {
                throw new Error('קמפיין לא נמצא');
            }

            if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
                throw new Error('לא ניתן לשלוח קמפיין זה');
            }

            // עדכון סטטוס לשליחה
            campaign.status = 'sending';
            campaign.sentAt = new Date();
            await campaign.save();

            // שליחה לכל לקוח
            const sendPromises = campaign.recipientList.map(client =>
                this.sendEmailToClient(campaign, client, therapistId)
            );

            const results = await Promise.allSettled(sendPromises);

            // חישוב סטטיסטיקות
            const sent = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            campaign.statistics.sent = sent;
            campaign.statistics.failed = failed;
            campaign.status = 'sent';
            await campaign.save();

            return {
                success: true,
                sent,
                failed,
                total: campaign.recipientList.length
            };
        } catch (error) {
            throw new Error(`שגיאה בשליחת קמפיין: ${error.message}`);
        }
    }

    // שליחת אימייל ללקוח יחיד
    async sendEmailToClient(campaign, client, therapistId) {
        try {
            // החלפת משתנים בתוכן
            const personalizedContent = this.personalizeContent(campaign.content, client);
            const personalizedSubject = this.personalizeContent(campaign.subject, client);

            // הוספת Tracking Pixel
            const trackingPixel = `<img src="${process.env.SERVER_URL}/api/email-tracking/${campaign._id}/${client._id}" style="display:none;" />`;
            const finalContent = personalizedContent + trackingPixel;

            const mailOptions = {
                from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
                to: client.email,
                subject: personalizedSubject,
                html: finalContent,
                headers: {
                    'X-Campaign-ID': campaign._id.toString(),
                    'X-Client-ID': client._id.toString()
                }
            };

            const result = await this.transporter.sendMail(mailOptions);

            // יצירת לוג
            await EmailLog.create({
                campaign: campaign._id,
                client: client._id,
                email: client.email,
                status: 'sent',
                sentAt: new Date(),
                messageId: result.messageId,
                therapist: therapistId
            });

            return result;
        } catch (error) {
            // יצירת לוג שגיאה
            await EmailLog.create({
                campaign: campaign._id,
                client: client._id,
                email: client.email,
                status: 'failed',
                errorMessage: error.message,
                therapist: therapistId
            });

            throw error;
        }
    }

    // החלפת משתנים בתוכן
    personalizeContent(content, client) {
        return content
            .replace(/\{\{firstName\}\}/g, client.firstName || '')
            .replace(/\{\{lastName\}\}/g, client.lastName || '')
            .replace(/\{\{fullName\}\}/g, `${client.firstName} ${client.lastName}`.trim())
            .replace(/\{\{email\}\}/g, client.email || '')
            .replace(/\{\{phone\}\}/g, client.phone || '')
            .replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString('he-IL'));
    }

    // מעקב פתיחות אימייל
    async trackEmailOpen(campaignId, clientId) {
        try {
            await EmailLog.findOneAndUpdate(
                { campaign: campaignId, client: clientId },
                {
                    status: 'opened',
                    openedAt: new Date(),
                    trackingPixelViewed: true
                }
            );

            // עדכון סטטיסטיקות קמפיין
            await Campaign.findByIdAndUpdate(campaignId, {
                $inc: { 'statistics.opened': 1 }
            });
        } catch (error) {
            console.error('Error tracking email open:', error);
        }
    }

    // מעקב קליקים
    async trackEmailClick(campaignId, clientId, url) {
        try {
            await EmailLog.findOneAndUpdate(
                { campaign: campaignId, client: clientId },
                {
                    status: 'clicked',
                    clickedAt: new Date(),
                    $push: { linksClicked: url }
                }
            );

            // עדכון סטטיסטיקות קמפיין
            await Campaign.findByIdAndUpdate(campaignId, {
                $inc: { 'statistics.clicked': 1 }
            });
        } catch (error) {
            console.error('Error tracking email click:', error);
        }
    }

    // קבלת סטטיסטיקות קמפיין
    async getCampaignStats(campaignId, therapistId) {
        try {
            const campaign = await Campaign.findOne({
                _id: campaignId,
                therapist: therapistId
            });

            if (!campaign) {
                throw new Error('קמפיין לא נמצא');
            }

            const logs = await EmailLog.find({ campaign: campaignId });

            const stats = {
                total: logs.length,
                sent: logs.filter(log => log.status === 'sent').length,
                delivered: logs.filter(log => log.status === 'delivered').length,
                opened: logs.filter(log => log.status === 'opened').length,
                clicked: logs.filter(log => log.status === 'clicked').length,
                bounced: logs.filter(log => log.status === 'bounced').length,
                failed: logs.filter(log => log.status === 'failed').length
            };

            stats.openRate = stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(2) : 0;
            stats.clickRate = stats.sent > 0 ? ((stats.clicked / stats.sent) * 100).toFixed(2) : 0;

            return stats;
        } catch (error) {
            throw new Error(`שגיאה בקבלת סטטיסטיקות: ${error.message}`);
        }
    }

    // יצירת תבנית אימייל
    async createTemplate(therapistId, templateData) {
        try {
            const template = new EmailTemplate({
                ...templateData,
                therapist: therapistId
            });

            await template.save();
            return template;
        } catch (error) {
            throw new Error(`שגיאה ביצירת תבנית: ${error.message}`);
        }
    }

    // קבלת תבניות
    async getTemplates(therapistId, category = null) {
        try {
            const query = { therapist: therapistId, isActive: true };

            if (category) {
                query.category = category;
            }

            const templates = await EmailTemplate.find(query).sort({ createdAt: -1 });
            return templates;
        } catch (error) {
            throw new Error(`שגיאה בקבלת תבניות: ${error.message}`);
        }
    }
}

module.exports = new EmailCampaignService();