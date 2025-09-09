const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// GET /api/notifications - קבלת כל ההתראות
router.get('/', async (req, res) => {
    res.json({ success: true, message: 'רשימת התראות' });
});

module.exports = router; 