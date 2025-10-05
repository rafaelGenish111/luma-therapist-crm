const mongoose = require('mongoose');

const googleCalendarSyncSchema = new mongoose.Schema({
    therapistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: true,
        unique: true
    },

    // טוקנים מוצפנים
    googleAccessToken: {
        type: String,
        required: true,
        select: false // לא להציג בברירת מחדל
    },

    googleRefreshToken: {
        type: String,
        required: true,
        select: false // לא להציג בברירת מחדל
    },

    googleCalendarId: {
        type: String,
        default: 'primary'
    },

    syncEnabled: {
        type: Boolean,
        default: true
    },

    lastSyncedAt: {
        type: Date
    },

    syncDirection: {
        type: String,
        enum: ['two-way', 'to-google', 'from-google'],
        default: 'two-way'
    },

    privacyLevel: {
        type: String,
        enum: ['busy-only', 'generic', 'detailed'],
        default: 'generic'
    },

    // Webhook settings
    webhookChannelId: {
        type: String
    },

    webhookResourceId: {
        type: String
    },

    webhookExpiration: {
        type: Date
    },

    // שגיאות סנכרון
    syncErrors: [{
        error: {
            type: String,
            required: true
        },
        occurredAt: {
            type: Date,
            default: Date.now
        },
        errorCode: {
            type: String
        },
        resolved: {
            type: Boolean,
            default: false
        }
    }]

}, {
    timestamps: true
});

// אינדקסים
googleCalendarSyncSchema.index({ therapistId: 1 });
googleCalendarSyncSchema.index({ lastSyncedAt: 1 });
googleCalendarSyncSchema.index({ syncEnabled: 1 });

// וירטואלים
googleCalendarSyncSchema.virtual('isConnected').get(function () {
    return !!(this.googleAccessToken && this.googleRefreshToken);
});

googleCalendarSyncSchema.virtual('needsRefresh').get(function () {
    if (!this.lastSyncedAt) return true;
    const hoursSinceLastSync = (Date.now() - this.lastSyncedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastSync > 24; // רענון כל 24 שעות
});

googleCalendarSyncSchema.virtual('hasActiveWebhook').get(function () {
    return !!(this.webhookChannelId && this.webhookResourceId &&
        this.webhookExpiration && this.webhookExpiration > new Date());
});

// מתודות סטטיות
googleCalendarSyncSchema.statics.findByTherapist = function (therapistId) {
    return this.findOne({ therapistId }).select('+googleAccessToken +googleRefreshToken');
};

googleCalendarSyncSchema.statics.findConnectedTherapists = function () {
    return this.find({
        syncEnabled: true,
        googleAccessToken: { $exists: true },
        googleRefreshToken: { $exists: true }
    });
};

googleCalendarSyncSchema.statics.findNeedingSync = function () {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.find({
        syncEnabled: true,
        $or: [
            { lastSyncedAt: { $exists: false } },
            { lastSyncedAt: { $lt: oneDayAgo } }
        ]
    });
};

// מתודות אינסטנס
googleCalendarSyncSchema.methods.updateSyncTime = function () {
    this.lastSyncedAt = new Date();
    return this.save();
};

googleCalendarSyncSchema.methods.addSyncError = function (error, errorCode) {
    this.syncErrors.push({
        error,
        errorCode,
        occurredAt: new Date()
    });

    // שמירה על מקסימום 10 שגיאות אחרונות
    if (this.syncErrors.length > 10) {
        this.syncErrors = this.syncErrors.slice(-10);
    }

    return this.save();
};

googleCalendarSyncSchema.methods.clearSyncErrors = function () {
    this.syncErrors = [];
    return this.save();
};

googleCalendarSyncSchema.methods.setWebhook = function (channelId, resourceId, expiration) {
    this.webhookChannelId = channelId;
    this.webhookResourceId = resourceId;
    this.webhookExpiration = expiration;
    return this.save();
};

googleCalendarSyncSchema.methods.clearWebhook = function () {
    this.webhookChannelId = undefined;
    this.webhookResourceId = undefined;
    this.webhookExpiration = undefined;
    return this.save();
};

googleCalendarSyncSchema.methods.updateTokens = function (accessToken, refreshToken) {
    this.googleAccessToken = accessToken;
    this.googleRefreshToken = refreshToken;
    this.lastSyncedAt = new Date();
    return this.save();
};

googleCalendarSyncSchema.methods.disableSync = function () {
    this.syncEnabled = false;
    return this.save();
};

googleCalendarSyncSchema.methods.enableSync = function () {
    this.syncEnabled = true;
    return this.save();
};

// Middleware
googleCalendarSyncSchema.pre('save', function (next) {
    // וידוא שיש טוקנים אם הסנכרון מופעל
    if (this.syncEnabled && (!this.googleAccessToken || !this.googleRefreshToken)) {
        return next(new Error('לא ניתן להפעיל סנכרון ללא טוקנים תקינים'));
    }

    // ניקוי שגיאות ישנות
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.syncErrors = this.syncErrors.filter(error => error.occurredAt > oneWeekAgo);

    next();
});

// מתודה לקבלת טוקנים (רק עם select מפורש)
googleCalendarSyncSchema.methods.getTokens = function () {
    return {
        accessToken: this.googleAccessToken,
        refreshToken: this.googleRefreshToken
    };
};

module.exports = mongoose.model('GoogleCalendarSync', googleCalendarSyncSchema);
