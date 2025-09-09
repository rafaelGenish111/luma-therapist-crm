const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    // קשרים
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: [true, 'לקוח הוא שדה חובה'],
        index: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },

    // פרטי התשלום
    amount: {
        type: Number,
        required: [true, 'סכום הוא שדה חובה'],
        min: [0, 'סכום לא יכול להיות שלילי']
    },
    currency: {
        type: String,
        default: 'ILS'
    },
    method: {
        type: String,
        enum: ['card', 'cash', 'transfer', 'simulated'],
        required: [true, 'שיטת תשלום היא שדה חובה']
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
        index: true
    },

    // פרטי עסקה
    transactionId: {
        type: String
    },
    invoiceId: {
        type: String
    },
    invoiceUrl: {
        type: String
    },

    // מטא-דאטה
    meta: {
        type: mongoose.Schema.Types.Mixed
    },

    // יוצר התשלום
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist'
    }

}, {
    timestamps: true
});

// Middleware לסינון תשלומים מחוקים
paymentSchema.pre(/^find/, function () {
    if (!this.getOptions().includeDeleted && !this.getQuery().includeDeleted) {
        this.where({ deletedAt: null });
    }
});

// אינדקסים
paymentSchema.index({ clientId: 1, createdAt: -1 });
paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ invoiceId: 1 });

// וירטואלים
paymentSchema.virtual('formattedAmount').get(function () {
    return `${this.amount.toLocaleString()} ${this.currency}`;
});

paymentSchema.virtual('isOverdue').get(function () {
    if (!this.invoice.dueDate || this.status === 'paid') return false;
    return new Date() > this.invoice.dueDate;
});

// מתודות סטטיות
paymentSchema.statics.findByClient = function (clientId, options = {}) {
    const query = { clientId: clientId };

    if (options.status) {
        query.status = options.status;
    }

    return this.find(query).sort({ createdAt: -1 });
};

paymentSchema.statics.findByAppointment = function (appointmentId) {
    return this.find({ appointmentId: appointmentId }).sort({ createdAt: -1 });
};

// מתודות אינסטנס
paymentSchema.methods.markAsPaid = function () {
    this.status = 'paid';
    return this.save();
};

paymentSchema.methods.markAsFailed = function (errorMessage) {
    this.status = 'failed';
    this.meta = { ...this.meta, error: errorMessage };
    return this.save();
};

paymentSchema.methods.refund = function (reason) {
    this.status = 'refunded';
    this.meta = { ...this.meta, refundReason: reason, refundedAt: new Date() };
    return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);
