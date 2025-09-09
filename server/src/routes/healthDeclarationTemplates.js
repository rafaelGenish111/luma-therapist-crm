const express = require('express');
const router = express.Router();
const HealthDeclarationTemplate = require('../models/HealthDeclarationTemplate');

// Public: list active templates for therapists/website
router.get('/', async (req, res) => {
    try {
        const items = await HealthDeclarationTemplate.find({ isActive: true }).sort({ createdAt: -1 });
        res.json({ success: true, data: items });
    } catch (e) {
        res.status(500).json({ success: false, error: 'שגיאה בטעינת תבניות' });
    }
});

module.exports = router;




