const mongoose = require('mongoose');

const therapistAvailabilitySchema = new mongoose.Schema({
    therapistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: true,
        unique: true
    },

    // לוח זמנים שבועי
    weeklySchedule: [{
        dayOfWeek: {
            type: Number,
            required: true,
            min: 0,
            max: 6 // 0=ראשון, 1=שני, ..., 6=שבת
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        timeSlots: [{
            startTime: {
                type: String,
                required: true,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'זמן התחלה חייב להיות בפורמט HH:mm']
            },
            endTime: {
                type: String,
                required: true,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'זמן סיום חייב להיות בפורמט HH:mm']
            }
        }]
    }],

    // הגדרות נוספות
    bufferTime: {
        type: Number,
        default: 15, // דקות בין פגישות
        min: [0, 'זמן חיץ לא יכול להיות שלילי'],
        max: [120, 'זמן חיץ לא יכול להיות יותר מ-120 דקות']
    },

    maxDailyAppointments: {
        type: Number,
        default: 8,
        min: [1, 'מספר מקסימלי של פגישות ביום חייב להיות לפחות 1'],
        max: [20, 'מספר מקסימלי של פגישות ביום לא יכול להיות יותר מ-20']
    },

    advanceBookingDays: {
        type: Number,
        default: 60, // כמה ימים קדימה אפשר לקבוע
        min: [1, 'מספר ימי הזמנה מראש חייב להיות לפחות 1'],
        max: [365, 'מספר ימי הזמנה מראש לא יכול להיות יותר מ-365']
    },

    minNoticeHours: {
        type: Number,
        default: 24, // כמה שעות מראש צריך לקבוע
        min: [1, 'זמן הודעה מינימלי חייב להיות לפחות שעה'],
        max: [168, 'זמן הודעה מינימלי לא יכול להיות יותר מ-168 שעות (שבוע)']
    },

    timezone: {
        type: String,
        default: 'Asia/Jerusalem',
        enum: [
            'Asia/Jerusalem',
            'Asia/Tel_Aviv',
            'UTC',
            'America/New_York',
            'Europe/London',
            'Europe/Paris',
            'Asia/Tokyo'
        ]
    }

}, {
    timestamps: true
});

// אינדקסים
therapistAvailabilitySchema.index({ therapistId: 1 });

// וירטואלים
therapistAvailabilitySchema.virtual('isAvailableToday').get(function () {
    const today = new Date().getDay();
    const todaySchedule = this.weeklySchedule.find(schedule => schedule.dayOfWeek === today);
    return todaySchedule ? todaySchedule.isAvailable : false;
});

// מתודות סטטיות
therapistAvailabilitySchema.statics.getAvailabilityForTherapist = function (therapistId) {
    return this.findOne({ therapistId }).populate('therapistId', 'firstName lastName');
};

therapistAvailabilitySchema.statics.getAvailableTimeSlots = function (therapistId, date) {
    const dayOfWeek = new Date(date).getDay();
    return this.findOne({ therapistId })
        .then(availability => {
            if (!availability) return [];

            const daySchedule = availability.weeklySchedule.find(schedule => schedule.dayOfWeek === dayOfWeek);
            if (!daySchedule || !daySchedule.isAvailable) return [];

            return daySchedule.timeSlots;
        });
};

// מתודות אינסטנס
therapistAvailabilitySchema.methods.isAvailableAtTime = function (dayOfWeek, time) {
    const daySchedule = this.weeklySchedule.find(schedule => schedule.dayOfWeek === dayOfWeek);
    if (!daySchedule || !daySchedule.isAvailable) return false;

    return daySchedule.timeSlots.some(slot => {
        return time >= slot.startTime && time <= slot.endTime;
    });
};

therapistAvailabilitySchema.methods.addTimeSlot = function (dayOfWeek, startTime, endTime) {
    let daySchedule = this.weeklySchedule.find(schedule => schedule.dayOfWeek === dayOfWeek);

    if (!daySchedule) {
        daySchedule = {
            dayOfWeek,
            isAvailable: true,
            timeSlots: []
        };
        this.weeklySchedule.push(daySchedule);
    }

    daySchedule.timeSlots.push({ startTime, endTime });
    return this.save();
};

therapistAvailabilitySchema.methods.removeTimeSlot = function (dayOfWeek, startTime, endTime) {
    const daySchedule = this.weeklySchedule.find(schedule => schedule.dayOfWeek === dayOfWeek);
    if (!daySchedule) return this.save();

    daySchedule.timeSlots = daySchedule.timeSlots.filter(slot =>
        !(slot.startTime === startTime && slot.endTime === endTime)
    );

    return this.save();
};

therapistAvailabilitySchema.methods.setDayAvailability = function (dayOfWeek, isAvailable) {
    let daySchedule = this.weeklySchedule.find(schedule => schedule.dayOfWeek === dayOfWeek);

    if (!daySchedule) {
        daySchedule = {
            dayOfWeek,
            isAvailable,
            timeSlots: []
        };
        this.weeklySchedule.push(daySchedule);
    } else {
        daySchedule.isAvailable = isAvailable;
    }

    return this.save();
};

// Middleware
therapistAvailabilitySchema.pre('save', function (next) {
    // וידוא שכל timeSlots תקינים
    this.weeklySchedule.forEach(daySchedule => {
        daySchedule.timeSlots.forEach(slot => {
            if (slot.startTime >= slot.endTime) {
                return next(new Error('זמן התחלה חייב להיות לפני זמן סיום'));
            }
        });
    });

    next();
});

// Indexes for performance optimization
therapistAvailabilitySchema.index({ therapistId: 1 }, { unique: true });
therapistAvailabilitySchema.index({ 'weeklySchedule.dayOfWeek': 1 });
therapistAvailabilitySchema.index({ timezone: 1 });

module.exports = mongoose.model('TherapistAvailability', therapistAvailabilitySchema);
