const express = require('express');

const app = express();

app.use(express.json());

// Simple test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Server is working',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Default route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Luma Therapist CRM API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message
    });
});

module.exports = app;