const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    // קשרים
    therapist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: [true, 'מטפלת היא שדה חובה']
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: [true, 'לקוח הוא שדה חובה']
    },

    // פרטי הפגישה
    date: {
        type: Date,
        required: [true, 'תאריך ושעה הם שדה חובה']
    },
    duration: {
        type: Number, // בדקות
        required: true,
        min: [15, 'משך פגישה חייב להיות לפחות 15 דקות'],
        max: [480, 'משך פגישה לא יכול להיות יותר מ-8 שעות'],
        default: 60
    },

    // סוג וסטטוס
    type: {
        type: String,
        enum: ['פגישה ראשונה', 'טיפול רגיל', 'מעקב', 'ייעוץ', 'אחר'],
        default: 'טיפול רגיל'
    },
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
        default: 'scheduled'
    },

    // מיקום ומחיר
    location: {
        type: String,
        trim: true,
        maxlength: [200, 'מיקום לא יכול להכיל יותר מ-200 תווים']
    },
    price: {
        type: Number,
        min: [0, 'מחיר לא יכול להיות שלילי'],
        max: [10000, 'מחיר לא יכול להיות יותר מ-10,000']
    },

    // חיוב/תמחור
    billingPolicy: {
        type: String,
        enum: ['PREPAY', 'POSTPAY', 'PACKAGE'],
        default: 'POSTPAY'
    },
    currency: {
        type: String,
        default: 'ILS'
    },
    paymentStatus: {
        type: String,
        enum: ['UNSET', 'PENDING', 'PAID', 'PARTIALLY_PAID'],
        default: 'UNSET'
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

    // הערות
    notes: {
        type: String,
        trim: true,
        maxlength: [2000, 'הערות לא יכולות להכיל יותר מ-2000 תווים']
    },
    summary: {
        type: String,
        trim: true,
        maxlength: [5000, 'סיכום לא יכול להכיל יותר מ-5000 תווים']
    },

    paymentAmount: {
        type: Number,
        min: [0, 'סכום תשלום לא יכול להיות שלילי']
    },

    // סיבת ביטול
    cancellationReason: {
        type: String,
        trim: true,
        maxlength: [500, 'סיבת ביטול לא יכולה להכיל יותר מ-500 תווים']
    },

    // תזכורות
    reminderSent: {
        type: Boolean,
        default: false
    },
    reminderSentAt: {
        type: Date
    },

    // מחיקה רכה
    deletedAt: {
        type: Date,
        default: null
    },
    autoDeleted: {
        type: Boolean,
        default: false
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
appointmentSchema.index({ therapist: 1, date: 1 });
appointmentSchema.index({ client: 1, date: 1 });
appointmentSchema.index({ status: 1, date: 1 });

// וירטואלים
appointmentSchema.virtual('endTime').get(function () {
    if (!this.date || !this.duration) return null;
    return new Date(this.date.getTime() + this.duration * 60000);
});

appointmentSchema.virtual('isPast').get(function () {
    return this.date < new Date();
});

appointmentSchema.virtual('isToday').get(function () {
    const today = new Date();
    const appointmentDate = new Date(this.date);
    return today.toDateString() === appointmentDate.toDateString();
});

// מתודות סטטיות
appointmentSchema.statics.getUpcomingAppointments = function (therapistId, limit = 10) {
    return this.find({
        therapist: therapistId,
        date: { $gte: new Date() },
        status: { $in: ['מתוכננת', 'אושרה'] }
    })
        .populate('client', 'firstName lastName phone email')
        .sort({ date: 1 })
        .limit(limit);
};

appointmentSchema.statics.getTodayAppointments = function (therapistId) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return this.find({
        therapist: therapistId,
        date: { $gte: startOfDay, $lt: endOfDay }
    })
        .populate('client', 'firstName lastName phone email')
        .sort({ date: 1 });
};

// מתודות אינסטנס
appointmentSchema.methods.markAsCompleted = function (summary) {
    this.status = 'בוצעה';
    if (summary) {
        this.summary = summary;
    }
    return this.save();
};

appointmentSchema.methods.cancel = function (reason) {
    this.status = 'בוטלה';
    if (reason) {
        this.notes = (this.notes || '') + `\nבוטל: ${reason}`;
    }
    return this.save();
};

// Middleware
appointmentSchema.pre('save', function (next) {
    // עדכון תזכורות אם הסטטוס השתנה
    if (this.isModified('status') && this.status === 'אושרה') {
        this.reminderSent = false;
        this.reminderSentAt = null;
    }
    next();
});

module.exports = mongoose.model('Appointment', appointmentSchema); 