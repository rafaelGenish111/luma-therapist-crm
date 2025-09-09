const express = require('express');
const router = express.Router();
const { calendlyService } = require('../services/calendlyService');

/**
 * נתיבי OAuth עבור Calendly
 * מטפל בחזרה מתהליך האימות וביצוע החיבור
 */

// @route   GET /api/auth/calendly/callback
// @desc    טיפול בחזרה מ-OAuth של Calendly
// @access  Public (Calendly callback)
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;

        // בדיקת שגיאות מ-Calendly
        if (error) {
            console.error('Calendly OAuth error:', error);
            return res.redirect(`${process.env.CLIENT_URL}/dashboard/calendly?error=${encodeURIComponent(error)}`);
        }

        // בדיקת קיום קוד ו-state
        if (!code || !state) {
            const errorMsg = 'קוד או state חסרים מתגובת Calendly';
            console.error(errorMsg);
            return res.redirect(`${process.env.CLIENT_URL}/dashboard/calendly?error=${encodeURIComponent(errorMsg)}`);
        }

        // טיפול בקוד עם השירות
        const callbackResult = await calendlyService.handleOAuthCallback(code, state);

        if (!callbackResult.success) {
            console.error('OAuth callback failed:', callbackResult.error);
            return res.redirect(`${process.env.CLIENT_URL}/dashboard/calendly?error=${encodeURIComponent(callbackResult.error)}`);
        }

        const { returnUrl, therapistId, setupStatus, username } = callbackResult.data;

        // הפניה חזרה ללקוח עם פרמטרים של הצלחה
        const successUrl = new URL(returnUrl, process.env.CLIENT_URL);
        successUrl.searchParams.append('success', 'true');
        successUrl.searchParams.append('setupStatus', setupStatus);
        successUrl.searchParams.append('username', username);
        successUrl.searchParams.append('therapistId', therapistId);

        console.log(`Redirecting successful Calendly connection for therapist ${therapistId} to ${successUrl.toString()}`);

        res.redirect(successUrl.toString());

    } catch (error) {
        console.error('Error in Calendly OAuth callback:', error);
        const errorUrl = `${process.env.CLIENT_URL}/dashboard/calendly?error=${encodeURIComponent('שגיאה פנימית בחיבור Calendly')}`;
        res.redirect(errorUrl);
    }
});

// @route   GET /api/auth/calendly/status/:therapistId
// @desc    בדיקת סטטוס חיבור Calendly (לשימוש בדף ההמתנה)
// @access  Public (for status checking)
router.get('/status/:therapistId', async (req, res) => {
    try {
        const { therapistId } = req.params;

        const statusResult = await calendlyService.getConnectionStatus(therapistId);

        if (!statusResult.success) {
            return res.status(404).json({
                success: false,
                error: statusResult.error
            });
        }

        // החזרת מידע בסיסי בלבד (ללא נתונים רגישים)
        const { setupStatus, isConnected, username, connectedAt } = statusResult.data;

        res.json({
            success: true,
            data: {
                therapistId,
                setupStatus,
                isConnected,
                username: username || null,
                schedulingUrl: username ? `https://calendly.com/${username}` : null,
                connectedAt
            }
        });

    } catch (error) {
        console.error('Error checking Calendly status:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בבדיקת סטטוס'
        });
    }
});

// @route   POST /api/auth/calendly/refresh/:therapistId
// @desc    רענון טוקן גישה (לשימוש פנימי)
// @access  Private (requires admin)
router.post('/refresh/:therapistId', async (req, res) => {
    try {
        const { therapistId } = req.params;

        const refreshResult = await calendlyService.refreshAccessToken(therapistId);

        if (!refreshResult.success) {
            return res.status(400).json({
                success: false,
                error: refreshResult.error
            });
        }

        res.json({
            success: true,
            data: {
                therapistId,
                refreshed: refreshResult.refreshed,
                timestamp: new Date()
            },
            message: 'טוקן רוענן בהצלחה'
        });

    } catch (error) {
        console.error('Error refreshing Calendly token:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה ברענון טוקן'
        });
    }
});

module.exports = router;
