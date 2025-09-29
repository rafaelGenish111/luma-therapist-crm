const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD;
        
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        console.log('🔄 Attempting MongoDB connection...');
        console.log('📍 URI prefix:', mongoURI.substring(0, 20) + '...');
        
        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 30000, // 30 seconds instead of 5
            socketTimeoutMS: 45000,
        });

        console.log('✅ MongoDB Connected:', conn.connection.host);
        return conn;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        throw error; // Re-throw to be caught by startServer
    }
};

module.exports = connectDB; 