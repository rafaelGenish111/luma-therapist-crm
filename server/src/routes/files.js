const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// GET /api/files - קבלת כל הקבצים
router.get('/', async (req, res) => {
    res.json({ success: true, message: 'רשימת קבצים' });
});

module.exports = router; 