const Therapist = require('../models/Therapist');
const { Campaign } = require('../models/Campaign');

// Middleware לבדיקת מגבלות קמפיינים
const checkCampaignLimits = async (req, res, next) => {
    try {
        const therapistId = req.user.id;
        const { recipients } = req.body;

        // קבלת מידע על המטפל
        const therapist = await Therapist.findById(therapistId);
        if (!therapist) {
            return res.status(404).json({ error: 'מטפל לא נמצא' });
        }

        // בדיקת מגבלות חודשיות
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        // איפוס מונה אימיילים אם זה חודש חדש
        if (!therapist.campaignSettings?.lastResetDate ||
            new Date(therapist.campaignSettings.lastResetDate) < startOfMonth) {

            await Therapist.findByIdAndUpdate(therapistId, {
                'campaignSettings.emailsSentThisMonth': 0,
                'campaignSettings.lastResetDate': currentDate
            });

            therapist.campaignSettings.emailsSentThisMonth = 0;
        }

        // בדיקת מגבלת אימיילים חודשית
        const monthlyLimit = therapist.campaignSettings?.monthlyEmailLimit || 100;
        const emailsSent = therapist.campaignSettings?.emailsSentThisMonth || 0;

        if (emailsSent + recipients.length > monthlyLimit && monthlyLimit !== -1) {
            return res.status(400).json({
                error: 'חרגת ממגבלת האימיילים החודשית',
                limit: monthlyLimit,
                sent: emailsSent,
                requested: recipients.length,
                remaining: monthlyLimit - emailsSent
            });
        }

        // בדיקת מגבלת נמענים לקמפיין יחיד
        const maxRecipients = process.env.MAX_CAMPAIGN_RECIPIENTS || 1000;
        if (recipients.length > maxRecipients) {
            return res.status(400).json({
                error: 'יותר מדי נמענים לקמפיין יחיד',
                maxRecipients,
                requested: recipients.length
            });
        }

        // שמירת המידע ב-request לשימוש בהמשך
        req.campaignLimits = {
            monthlyLimit,
            emailsSent,
            remaining: monthlyLimit - emailsSent,
            maxRecipients
        };

        next();
    } catch (error) {
        console.error('שגיאה בבדיקת מגבלות קמפיינים:', error);
        res.status(500).json({ error: 'שגיאה בבדיקת מגבלות' });
    }
};

// Middleware לעדכון מונה אימיילים אחרי שליחה
const updateEmailCount = async (req, res, next) => {
    try {
        const therapistId = req.user.id;
        const emailsSent = req.campaignLimits?.requested || req.body.recipients?.length || 0;

        if (emailsSent > 0) {
            await Therapist.findByIdAndUpdate(therapistId, {
                $inc: { 'campaignSettings.emailsSentThisMonth': emailsSent }
            });
        }

        next();
    } catch (error) {
        console.error('שגיאה בעדכון מונה אימיילים:', error);
        // לא נעצור את התהליך בגלל שגיאה זו
        next();
    }
};

// Middleware לבדיקת הרשאות קמפיינים
const checkCampaignPermissions = (requiredPermission) => {
    return (req, res, next) => {
        // כאן ניתן להוסיף בדיקת הרשאות ספציפיות
        // כרגע כל המטפלים המאומתים יכולים לנהל קמפיינים
        next();
    };
};

module.exports = {
    checkCampaignLimits,
    updateEmailCount,
    checkCampaignPermissions
};
