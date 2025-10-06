const mongoose = require('mongoose');

const treatmentTypeSchema = new mongoose.Schema({
    therapistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    duration: {
        type: Number, // בדקות
        required: true,
        min: 15,
        max: 480 // 8 שעות מקסימום
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'ILS',
        enum: ['ILS', 'USD', 'EUR']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    color: {
        type: String,
        default: '#4A90E2',
        validate: {
            validator: function (v) {
                return /^#[0-9A-F]{6}$/i.test(v);
            },
            message: 'צבע חייב להיות בפורמט hex (#RRGGBB)'
        }
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    calendlyEventTypeId: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// אינדקסים
treatmentTypeSchema.index({ therapistId: 1, isActive: 1 });
treatmentTypeSchema.index({ therapistId: 1, sortOrder: 1 });

// וירטואל פילד למשך זמן בפורמט קריא
treatmentTypeSchema.virtual('durationFormatted').get(function () {
    const hours = Math.floor(this.duration / 60);
    const minutes = this.duration % 60;

    if (hours === 0) {
        return `${minutes} דקות`;
    } else if (minutes === 0) {
        return `${hours} שעות`;
    } else {
        return `${hours} שעות ${minutes} דקות`;
    }
});

// וירטואל פילד למחיר בפורמט קריא
treatmentTypeSchema.virtual('priceFormatted').get(function () {
    return `${this.price} ${this.currency}`;
});

// מתודות סטטיות
treatmentTypeSchema.statics.findByTherapist = function (therapistId, options = {}) {
    const query = { therapistId, isActive: true };
    return this.find(query)
        .sort({ sortOrder: 1, createdAt: 1 })
        .limit(options.limit || 50);
};

treatmentTypeSchema.statics.findActiveByTherapist = function (therapistId) {
    return this.find({ therapistId, isActive: true })
        .sort({ sortOrder: 1, createdAt: 1 });
};

// מתודות אינסטנס
treatmentTypeSchema.methods.toPublicJSON = function () {
    return {
        id: this._id,
        name: this.name,
        description: this.description,
        duration: this.duration,
        durationFormatted: this.durationFormatted,
        price: this.price,
        priceFormatted: this.priceFormatted,
        currency: this.currency,
        color: this.color,
        sortOrder: this.sortOrder
    };
};

// Middleware לפני שמירה
treatmentTypeSchema.pre('save', function (next) {
    // אם זה טיפול חדש ולא נקבע sortOrder, קבע אותו לפי הזמן הנוכחי
    if (this.isNew && this.sortOrder === 0) {
        this.sortOrder = Date.now();
    }
    next();
});

module.exports = mongoose.model('TreatmentType', treatmentTypeSchema);


