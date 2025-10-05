const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    // קשרים
    therapistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: [true, 'מטפלת היא שדה חובה']
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: [true, 'לקוח הוא שדה חובה']
    },

    // פרטי הפגישה
    serviceType: {
        type: String,
        enum: ['individual', 'couple', 'family', 'group', 'workshop'],
        default: 'individual'
    },
    startTime: {
        type: Date,
        required: [true, 'זמן התחלה הוא שדה חובה']
    },
    endTime: {
        type: Date,
        required: [true, 'זמן סיום הוא שדה חובה']
    },
    duration: {
        type: Number, // בדקות
        required: true,
        min: [15, 'משך פגישה חייב להיות לפחות 15 דקות'],
        max: [480, 'משך פגישה לא יכול להיות יותר מ-8 שעות'],
        default: 60
    },

    // סטטוס פגישה
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
        default: 'pending'
    },

    // סנכרון עם Google Calendar
    googleEventId: {
        type: String,
        unique: true,
        sparse: true
    },
    googleCalendarSynced: {
        type: Boolean,
        default: false
    },

    // הערות
    notes: {
        type: String,
        trim: true,
        maxlength: [2000, 'הערות לא יכולות להכיל יותר מ-2000 תווים']
    },
    privateNotes: {
        type: String,
        trim: true,
        maxlength: [2000, 'הערות פרטיות לא יכולות להכיל יותר מ-2000 תווים']
    },

    // מיקום פגישה
    location: {
        type: String,
        enum: ['online', 'clinic', 'home'],
        default: 'clinic'
    },
    meetingUrl: {
        type: String,
        trim: true
    },

    // פגישות חוזרות
    recurringPattern: {
        isRecurring: {
            type: Boolean,
            default: false
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'biweekly', 'monthly']
        },
        endDate: {
            type: Date
        },
        parentAppointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment'
        }
    },

    // סטטוס תשלום
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'refunded'],
        default: 'unpaid'
    },
    paymentAmount: {
        type: Number,
        min: [0, 'סכום תשלום לא יכול להיות שלילי']
    },

    // תזכורות שנשלחו
    remindersSent: [{
        type: {
            type: String,
            enum: ['email', 'sms']
        },
        sentAt: {
            type: Date,
            default: Date.now
        }
    }],

    // ביטול פגישה
    cancellationReason: {
        type: String,
        trim: true,
        maxlength: [500, 'סיבת ביטול לא יכולה להכיל יותר מ-500 תווים']
    },
    cancelledBy: {
        type: String,
        enum: ['therapist', 'client', 'system']
    },
    cancelledAt: {
        type: Date
    },

    // שדות קיימים לשמירה על תאימות
    therapist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist'
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    date: {
        type: Date
    },
    type: {
        type: String,
        enum: ['פגישה ראשונה', 'טיפול רגיל', 'מעקב', 'ייעוץ', 'אחר'],
        default: 'טיפול רגיל'
    },
    price: {
        type: Number,
        min: [0, 'מחיר לא יכול להיות שלילי'],
        max: [10000, 'מחיר לא יכול להיות יותר מ-10,000']
    },
    billingPolicy: {
        type: String,
        enum: ['PREPAY', 'POSTPAY', 'PACKAGE'],
        default: 'POSTPAY'
    },
    currency: {
        type: String,
        default: 'ILS'
    },
    chargeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Charge',
        index: true
    },
    packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Package'
    },
    summary: {
        type: String,
        trim: true,
        maxlength: [5000, 'סיכום לא יכול להכיל יותר מ-5000 תווים']
    },
    reminderSent: {
        type: Boolean,
        default: false
    },
    reminderSentAt: {
        type: Date
    },
    deletedAt: {
        type: Date,
        default: null
    },
    autoDeleted: {
        type: Boolean,
        default: false
    },
    metadata: {
        documented: {
            type: Boolean,
            default: false
        },
        documentedAt: {
            type: Date
        }
    }

}, {
    timestamps: true
});

// Middleware לסינון פגישות מחוקות
appointmentSchema.pre(/^find/, function () {
    // לא להציג פגישות מחוקות אלא אם נבקש במפורש
    if (!this.getOptions().includeDeleted && !this.getQuery().includeDeleted) {
        this.where({ deletedAt: null });
    }
});

// אינדקסים
appointmentSchema.index({ therapistId: 1, startTime: 1 });
appointmentSchema.index({ clientId: 1, startTime: 1 });
appointmentSchema.index({ googleEventId: 1 });
appointmentSchema.index({ status: 1, startTime: 1 });
// אינדקסים קיימים לשמירה על תאימות
appointmentSchema.index({ therapist: 1, date: 1 });
appointmentSchema.index({ client: 1, date: 1 });

// וירטואלים
appointmentSchema.virtual('isPast').get(function () {
    const timeToCheck = this.startTime || this.date;
    return timeToCheck < new Date();
});

appointmentSchema.virtual('isToday').get(function () {
    const today = new Date();
    const appointmentDate = new Date(this.startTime || this.date);
    return today.toDateString() === appointmentDate.toDateString();
});

// מתודות סטטיות
appointmentSchema.statics.getUpcomingAppointments = function (therapistId, limit = 10) {
    return this.find({
        $or: [
            { therapistId: therapistId },
            { therapist: therapistId }
        ],
        $or: [
            { startTime: { $gte: new Date() } },
            { date: { $gte: new Date() } }
        ],
        status: { $in: ['confirmed', 'pending', 'מתוכננת', 'אושרה'] }
    })
        .populate('clientId client', 'firstName lastName phone email')
        .sort({ startTime: 1, date: 1 })
        .limit(limit);
};

appointmentSchema.statics.getTodayAppointments = function (therapistId) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return this.find({
        $or: [
            { therapistId: therapistId },
            { therapist: therapistId }
        ],
        $or: [
            { startTime: { $gte: startOfDay, $lt: endOfDay } },
            { date: { $gte: startOfDay, $lt: endOfDay } }
        ]
    })
        .populate('clientId client', 'firstName lastName phone email')
        .sort({ startTime: 1, date: 1 });
};

// מתודות אינסטנס
appointmentSchema.methods.markAsCompleted = function (summary) {
    this.status = 'completed';
    if (summary) {
        this.summary = summary;
    }
    return this.save();
};

appointmentSchema.methods.cancel = function (reason, cancelledBy = 'therapist') {
    this.status = 'cancelled';
    this.cancelledBy = cancelledBy;
    this.cancelledAt = new Date();
    if (reason) {
        this.cancellationReason = reason;
        this.notes = (this.notes || '') + `\nבוטל: ${reason}`;
    }
    return this.save();
};

appointmentSchema.methods.confirm = function () {
    this.status = 'confirmed';
    return this.save();
};

appointmentSchema.methods.addReminder = function (type) {
    this.remindersSent.push({
        type: type,
        sentAt: new Date()
    });
    return this.save();
};

// Middleware
appointmentSchema.pre('save', function (next) {
    // עדכון תזכורות אם הסטטוס השתנה
    if (this.isModified('status') && (this.status === 'confirmed' || this.status === 'אושרה')) {
        this.reminderSent = false;
        this.reminderSentAt = null;
    }

    // סינכרון שדות תאימות
    if (this.isModified('therapistId') && !this.therapist) {
        this.therapist = this.therapistId;
    }
    if (this.isModified('clientId') && !this.client) {
        this.client = this.clientId;
    }
    if (this.isModified('startTime') && !this.date) {
        this.date = this.startTime;
    }

    next();
});

module.exports = mongoose.model('Appointment', appointmentSchema); 