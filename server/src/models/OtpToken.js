const mongoose = require('mongoose');

const otpTokenSchema = new mongoose.Schema({
    userId: {
        type: String,
        index: true,
        required: true
    },
    payloadHash: {
        type: String,
        required: true
    }, // sha256 של ה-payloadString
    codeHash: {
        type: String,
        required: true
    },
    channel: {
        type: String,
        enum: ["sms", "email"],
        required: true
    },
    sentTo: String,
    attempts: {
        type: Number,
        default: 0
    },
    ip: String,
    ua: String, // User-Agent
    maxAttempts: {
        type: Number,
        default: 5
    }
}, {
    timestamps: true
});

// פג תוקף אחרי 10 דקות
otpTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

// אינדקס מורכב לחיפוש מהיר
otpTokenSchema.index({ userId: 1, payloadHash: 1, createdAt: -1 });

module.exports = mongoose.model('OtpToken', otpTokenSchema);
