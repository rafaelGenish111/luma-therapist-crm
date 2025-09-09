const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'כותרת התמונה נדרשת'],
        trim: true,
        maxlength: [100, 'כותרת לא יכולה להיות יותר מ-100 תווים']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'תיאור לא יכול להיות יותר מ-500 תווים']
    },
    imageUrl: {
        type: String,
        required: [true, 'URL התמונה נדרש']
    },
    imagePublicId: {
        type: String,
        required: [true, 'מזהה התמונה נדרש']
    },
    category: {
        type: String,
        required: [true, 'קטגוריה נדרשת'],
        enum: {
            values: ['clinic', 'massage', 'therapy', 'wellness', 'other'],
            message: 'קטגוריה חייבת להיות אחת מהערכים: clinic, massage, therapy, wellness, other'
        }
    },
    therapist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: [true, 'מטפלת נדרשת']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    tags: [{
        type: String,
        trim: true
    }],
    altText: {
        type: String,
        trim: true,
        maxlength: [200, 'טקסט חלופי לא יכול להיות יותר מ-200 תווים']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// אינדקסים
gallerySchema.index({ therapist: 1, category: 1 });
gallerySchema.index({ therapist: 1, isActive: 1 });
gallerySchema.index({ category: 1, isActive: 1 });

// וירטואלים
gallerySchema.virtual('categoryLabel').get(function () {
    const categories = {
        clinic: 'קליניקה',
        massage: 'עיסויים',
        therapy: 'טיפולים',
        wellness: 'בריאות',
        other: 'אחר'
    };
    return categories[this.category] || this.category;
});

// מתודות סטטיות
gallerySchema.statics.findByTherapist = function (therapistId) {
    return this.find({ therapist: therapistId, isActive: true }).sort({ order: 1, createdAt: -1 });
};

gallerySchema.statics.findByCategory = function (category) {
    return this.find({ category, isActive: true }).sort({ order: 1, createdAt: -1 });
};

// מתודות אינסטנס
gallerySchema.methods.toPublicJSON = function () {
    const obj = this.toObject();
    delete obj.therapist;
    return obj;
};

module.exports = mongoose.model('Gallery', gallerySchema); 