const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD;
        
        if (!mongoURI) {
            console.error('❌ MONGODB_URI is not defined');
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        console.log('🔄 Connecting to MongoDB...');
        console.log('📍 URI prefix:', mongoURI.substring(0, 30) + '...');
        
        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 30000, // 30 seconds instead of 10
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000, // added this
        });

        console.log('✅ MongoDB Connected:', conn.connection.host);
        console.log('📦 Database:', conn.connection.name);

        return conn;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.error('Full error:', error);
        throw error;
    }
};

module.exports = connectDB;