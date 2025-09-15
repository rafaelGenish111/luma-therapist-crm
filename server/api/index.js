const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.NODE_ENV === 'production' 
            ? [
                process.env.CLIENT_URL,
                process.env.FRONTEND_URL,
                'https://luma-therapist-crm-frontend.vercel.app',
                'https://luma-therapist-crm.vercel.app'
              ]
            : [
                'http://localhost:8000',
                'http://localhost:3000',
                'http://127.0.0.1:8000',
                'http://127.0.0.1:3000'
              ];
        
        console.log('CORS check - Origin:', origin);
        console.log('CORS check - Allowed origins:', allowedOrigins);
        console.log('CORS check - NODE_ENV:', process.env.NODE_ENV);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('CORS allowed:', origin);
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests manually
app.options('*', (req, res) => {
    console.log('OPTIONS request for:', req.url);
    console.log('Origin:', req.headers.origin);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
});

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