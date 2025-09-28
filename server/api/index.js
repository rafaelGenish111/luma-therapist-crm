// Minimal Vercel API handler
const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors({
    origin: [
        'https://luma-therapist-crm-frontend.vercel.app',
        'http://localhost:8000'
    ],
    credentials: true
}));
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Minimal server is working',
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Root
app.get('/', (req, res) => {
    res.json({ message: 'Luma API - Minimal Version' });
});

// Basic auth endpoint for testing
app.post('/api/auth/login', (req, res) => {
    res.status(501).json({
        error: 'Not implemented yet',
        message: 'Server is running but auth not configured'
    });
});

module.exports = app;