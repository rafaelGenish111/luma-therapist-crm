const mongoose = require('mongoose');

const communicationLogSchema = new mongoose.Schema({
    // קשר ללקוח
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: [true, 'לקוח הוא שדה חובה'],
        index: true
    },

    // פרטי התקשורת
    channel: {
        type: String,
        enum: ['email', 'sms', 'whatsapp'],
        required: [true, 'ערוץ תקשורת הוא שדה חובה']
    },
    direction: {
        type: String,
        enum: ['outbound', 'inbound'],
        default: 'outbound'
    },
    subject: {
        type: String,
        trim: true,
        maxlength: [200, 'נושא לא יכול להכיל יותר מ-200 תווים']
    },
    body: {
        type: String,
        required: [true, 'תוכן ההודעה הוא שדה חובה'],
        trim: true
    },
    status: {
        type: String,
        enum: ['queued', 'sent', 'delivered', 'failed'],
        default: 'queued'
    },
    providerMessageId: {
        type: String
    },

    // מטא-דאטה
    meta: {
        type: mongoose.Schema.Types.Mixed
    },

    // פרטי שליחה
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist'
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    deliveredAt: {
        type: Date
    },
    failedAt: {
        type: Date
    },
    failureReason: {
        type: String,
        trim: true
    },

    // מחיקה רכה
    deletedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

// אינדקסים
communicationLogSchema.index({ clientId: 1, createdAt: -1 });
communicationLogSchema.index({ channel: 1 });
communicationLogSchema.index({ direction: 1 });
communicationLogSchema.index({ status: 1 });
communicationLogSchema.index({ sentBy: 1 });
communicationLogSchema.index({ providerMessageId: 1 });

// Middleware לסינון הודעות מחוקות
communicationLogSchema.pre(/^find/, function () {
    if (!this.getOptions().includeDeleted && !this.getQuery().includeDeleted) {
        this.where({ deletedAt: null });
    }
});

// מתודות סטטיות
communicationLogSchema.statics.findByClient = function (clientId, options = {}) {
    const query = { clientId: clientId };

    if (options.channel) {
        query.channel = options.channel;
    }

    if (options.direction) {
        query.direction = options.direction;
    }

    if (options.status) {
        query.status = options.status;
    }

    if (options.dateFrom) {
        query.createdAt = { $gte: new Date(options.dateFrom) };
    }

    if (options.dateTo) {
        if (query.createdAt) {
            query.createdAt.$lte = new Date(options.dateTo);
        } else {
            query.createdAt = { $lte: new Date(options.dateTo) };
        }
    }

    return this.find(query).sort({ createdAt: -1 });
};

communicationLogSchema.statics.findByChannel = function (channel, options = {}) {
    const query = { channel: channel };

    if (options.status) {
        query.status = options.status;
    }

    return this.find(query).sort({ createdAt: -1 });
};

communicationLogSchema.statics.findFailed = function (options = {}) {
    const query = { status: 'failed' };

    if (options.channel) {
        query.channel = options.channel;
    }

    if (options.dateFrom) {
        query.createdAt = { $gte: new Date(options.dateFrom) };
    }

    return this.find(query).sort({ createdAt: -1 });
};

// מתודות אינסטנס
communicationLogSchema.methods.markAsSent = function (providerMessageId = null) {
    this.status = 'sent';
    this.sentAt = new Date();
    if (providerMessageId) {
        this.providerMessageId = providerMessageId;
    }
    return this.save();
};

communicationLogSchema.methods.markAsDelivered = function () {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    return this.save();
};

communicationLogSchema.methods.markAsFailed = function (reason) {
    this.status = 'failed';
    this.failedAt = new Date();
    this.failureReason = reason;
    return this.save();
};

communicationLogSchema.methods.softDelete = function () {
    this.deletedAt = new Date();
    return this.save();
};

// וירטואלים
communicationLogSchema.virtual('isOutbound').get(function () {
    return this.direction === 'outbound';
});

communicationLogSchema.virtual('isInbound').get(function () {
    return this.direction === 'inbound';
});

communicationLogSchema.virtual('isSuccessful').get(function () {
    return ['sent', 'delivered'].includes(this.status);
});

communicationLogSchema.virtual('isFailed').get(function () {
    return this.status === 'failed';
});

communicationLogSchema.virtual('isPending').get(function () {
    return this.status === 'queued';
});

// Middleware
communicationLogSchema.pre('save', function (next) {
    // ניקוי תוכן
    if (this.body) {
        this.body = this.body.trim();
    }

    if (this.subject) {
        this.subject = this.subject.trim();
    }

    if (this.failureReason) {
        this.failureReason = this.failureReason.trim();
    }

    next();
});

module.exports = mongoose.model('CommunicationLog', communicationLogSchema);


