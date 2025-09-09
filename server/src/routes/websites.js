const express = require('express');
const router = express.Router();
const SiteSettings = require('../models/SiteSettings');

// GET /api/websites - קבלת כל האתרים
router.get('/', async (req, res) => {
    res.json({ success: true, message: 'רשימת אתרים' });
});

// GET /api/websites/site-settings - Public site contact settings
router.get('/site-settings', async (req, res) => {
    try {
        const settings = await SiteSettings.getSingleton();
        const contact = settings?.contact || {};
        res.json({ success: true, data: { contact } });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Failed to load site settings' });
    }
});

module.exports = router; 