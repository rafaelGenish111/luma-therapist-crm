const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD;

        console.log('🔄 Attempting MongoDB connection...');
        console.log('📊 NODE_ENV:', process.env.NODE_ENV);
        console.log('🔑 MONGODB_URI exists:', !!mongoURI);

        if (!mongoURI) {
            throw new Error('❌ MONGODB_URI is not defined in environment variables');
        }

        // Log first 30 chars of URI for debugging (hide password)
        const uriPrefix = mongoURI.substring(0, 30);
        console.log('📍 URI prefix:', uriPrefix + '...');

        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 45000,
        });

        console.log('✅ MongoDB Connected:', conn.connection.host);
        console.log('📦 Database name:', conn.connection.name);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('🔌 MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('📦 MongoDB connection closed through app termination');
            process.exit(0);
        });

        return conn;
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error.message);
        console.error('📋 Full error:', error);
        throw error;
    }
};

module.exports = connectDB;