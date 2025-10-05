const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    therapistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: false
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    currency: {
        type: String,
        default: 'ILS',
        enum: ['ILS'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'expired', 'canceled'],
        default: 'pending',
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['credit', 'bit', 'paybox', 'gpay', 'apay'],
        required: false
    },
    paymentLinkId: {
        type: String,
        required: true,
        unique: true
    },
    provider: {
        type: String,
        enum: ['tranzila', 'cardcom', 'mock'],
        required: true
    },
    providerTxnId: {
        type: String,
        required: false
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ימים מהיום
        required: true
    },
    description: {
        type: String,
        required: false
    },
    // שדות נוספים לניהול
    checkoutUrl: {
        type: String,
        required: false
    },
    callbackData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// אינדקסים
paymentSchema.index({ paymentLinkId: 1 }, { unique: true });
paymentSchema.index({ status: 1 });
paymentSchema.index({ clientId: 1, therapistId: 1 });
paymentSchema.index({ expiresAt: 1 });
paymentSchema.index({ providerTxnId: 1 });

// Middleware לבדיקת תאריך פג
paymentSchema.pre('find', function () {
    const now = new Date();
    this.where({
        $or: [
            { expiresAt: { $gt: now } },
            { status: { $in: ['paid', 'failed', 'canceled'] } }
        ]
    });
});

// Method לבדיקת פג תוקף
paymentSchema.methods.isExpired = function () {
    return this.expiresAt < new Date() && this.status === 'pending';
};

// Method לעדכון סטטוס לפג
paymentSchema.methods.markAsExpired = function () {
    if (this.status === 'pending' && this.isExpired()) {
        this.status = 'expired';
        return this.save();
    }
    return Promise.resolve(this);
};

// Static method למציאת תשלומים פגי תוקף
paymentSchema.statics.findExpiredPayments = function () {
    return this.find({
        status: 'pending',
        expiresAt: { $lt: new Date() }
    });
};

// Static method לעדכון תשלומים פגי תוקף
paymentSchema.statics.updateExpiredPayments = function () {
    return this.updateMany(
        {
            status: 'pending',
            expiresAt: { $lt: new Date() }
        },
        { status: 'expired' }
    );
};

module.exports = mongoose.model('Payment', paymentSchema);