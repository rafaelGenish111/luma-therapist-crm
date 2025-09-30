const mongoose = require('mongoose');

// Global cache for mongoose connection
let cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
    global.mongoose = cached;
}

const connectDB = async () => {
    // אם כבר מחוברים, החזר את החיבור הקיים
    if (cached.conn) {
        console.log('📦 Using cached MongoDB connection');
        return cached.conn;
    }

    // אם אין promise, צור חיבור חדש
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 45000,
        };

        console.log('📦 Creating new MongoDB connection...');
        cached.promise = mongoose.connect(process.env.MONGODB_URI, opts)
            .then((mongoose) => {
                console.log(`📦 MongoDB Connected: ${mongoose.connection.host}`);
                return mongoose;
            })
            .catch((error) => {
                console.error('❌ MongoDB connection error:', error);
                cached.promise = null; // Reset on error
                throw error;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
};

module.exports = connectDB;