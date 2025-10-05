const mongoose = require('mongoose');

const blockedTimeSchema = new mongoose.Schema({
    therapistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: true
    },

    startTime: {
        type: Date,
        required: true
    },

    endTime: {
        type: Date,
        required: true
    },

    reason: {
        type: String,
        enum: ['vacation', 'sick', 'personal', 'training', 'other'],
        required: true
    },

    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'הערות לא יכולות להכיל יותר מ-500 תווים']
    },

    isRecurring: {
        type: Boolean,
        default: false
    },

    recurringPattern: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'biweekly', 'monthly']
        },
        endDate: {
            type: Date
        },
        parentBlockedTimeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BlockedTime'
        }
    }

}, {
    timestamps: true
});

// אינדקסים
blockedTimeSchema.index({ therapistId: 1, startTime: 1 });
blockedTimeSchema.index({ startTime: 1, endTime: 1 });

// וירטואלים
blockedTimeSchema.virtual('duration').get(function () {
    if (!this.startTime || !this.endTime) return null;
    return this.endTime.getTime() - this.startTime.getTime();
});

blockedTimeSchema.virtual('isActive').get(function () {
    const now = new Date();
    return this.startTime <= now && this.endTime >= now;
});

blockedTimeSchema.virtual('isPast').get(function () {
    return this.endTime < new Date();
});

blockedTimeSchema.virtual('isFuture').get(function () {
    return this.startTime > new Date();
});

// מתודות סטטיות
blockedTimeSchema.statics.getBlockedTimesForTherapist = function (therapistId, startDate, endDate) {
    return this.find({
        therapistId,
        startTime: { $gte: startDate },
        endTime: { $lte: endDate }
    }).sort({ startTime: 1 });
};

blockedTimeSchema.statics.getActiveBlockedTimes = function (therapistId) {
    const now = new Date();
    return this.find({
        therapistId,
        startTime: { $lte: now },
        endTime: { $gte: now }
    }).sort({ startTime: 1 });
};

blockedTimeSchema.statics.isTimeBlocked = function (therapistId, startTime, endTime) {
    return this.findOne({
        therapistId,
        $or: [
            {
                startTime: { $lte: startTime },
                endTime: { $gte: endTime }
            },
            {
                startTime: { $lt: endTime },
                endTime: { $gt: startTime }
            }
        ]
    });
};

// מתודות אינסטנס
blockedTimeSchema.methods.isOverlapping = function (startTime, endTime) {
    return (this.startTime < endTime && this.endTime > startTime);
};

blockedTimeSchema.methods.extend = function (newEndTime) {
    if (newEndTime > this.endTime) {
        this.endTime = newEndTime;
        return this.save();
    }
    return Promise.resolve(this);
};

blockedTimeSchema.methods.shorten = function (newEndTime) {
    if (newEndTime < this.endTime && newEndTime > this.startTime) {
        this.endTime = newEndTime;
        return this.save();
    }
    return Promise.resolve(this);
};

// Middleware
blockedTimeSchema.pre('save', function (next) {
    // וידוא שזמן התחלה לפני זמן סיום
    if (this.startTime >= this.endTime) {
        return next(new Error('זמן התחלה חייב להיות לפני זמן סיום'));
    }

    // אם זה recurring, וידוא שיש parentBlockedTimeId
    if (this.isRecurring && !this.recurringPattern.parentBlockedTimeId) {
        this.recurringPattern.parentBlockedTimeId = this._id;
    }

    next();
});

// Middleware לבדיקת חפיפות
blockedTimeSchema.pre('save', async function (next) {
    if (this.isNew) {
        const overlapping = await this.constructor.findOne({
            therapistId: this.therapistId,
            _id: { $ne: this._id },
            $or: [
                {
                    startTime: { $lte: this.startTime },
                    endTime: { $gte: this.endTime }
                },
                {
                    startTime: { $lt: this.endTime },
                    endTime: { $gt: this.startTime }
                }
            ]
        });

        if (overlapping) {
            return next(new Error('הזמן החסום חופף לזמן חסום קיים'));
        }
    }

    next();
});

// Indexes for performance optimization
blockedTimeSchema.index({ therapistId: 1, startTime: 1 });
blockedTimeSchema.index({ startTime: 1, endTime: 1 });
blockedTimeSchema.index({ isRecurring: 1, 'recurringPattern.parentBlockedTimeId': 1 });
blockedTimeSchema.index({ reason: 1 });

module.exports = mongoose.model('BlockedTime', blockedTimeSchema);
