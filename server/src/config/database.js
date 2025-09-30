const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    // אם כבר מחובר, אל תנסה להתחבר שוב
    if (isConnected && mongoose.connection.readyState === 1) {
        console.log('✅ Using existing MongoDB connection');
        return mongoose.connection;
    }

    try {
        // נקה חיבורים ישנים אם יש
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        console.log('🔄 Connecting to MongoDB...');

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4, // מאלץ IPv4
            maxPoolSize: 1, // בserverless, pool של 1 מספיק
            minPoolSize: 1,
        });

        isConnected = true;
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        return conn.connection;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        isConnected = false;
        throw error;
    }
};

module.exports = connectDB;