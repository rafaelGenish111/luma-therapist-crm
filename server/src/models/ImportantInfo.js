const mongoose = require('mongoose');

const importantInfoSchema = new mongoose.Schema({
    therapistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: true,
        index: true
    },
    title: {
        type: String,
        default: 'מידע חשוב',
        trim: true,
        maxlength: 100
    },
    items: [{
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },
        isActive: {
            type: Boolean,
            default: true
        },
        sortOrder: {
            type: Number,
            default: 0
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// אינדקסים
importantInfoSchema.index({ therapistId: 1, isActive: 1 });

// מתודות סטטיות
importantInfoSchema.statics.findByTherapist = function (therapistId) {
    return this.findOne({ therapistId, isActive: true });
};

importantInfoSchema.statics.findOrCreateByTherapist = async function (therapistId) {
    let info = await this.findOne({ therapistId });

    if (!info) {
        // יצירת מידע ברירת מחדל
        info = new this({
            therapistId,
            title: 'מידע חשוב',
            items: [
                { text: 'ביטול פגישה - עד 24 שעות מראש', sortOrder: 1 },
                { text: 'תשלום במזומן או העברה בנקאית', sortOrder: 2 },
                { text: 'פגישות זמינות ימים א\'-ה\' 9:00-17:00', sortOrder: 3 },
                { text: 'אפשרות לפגישות בזום לפי בקשה', sortOrder: 4 }
            ]
        });
        await info.save();
    }

    return info;
};

// מתודות אינסטנס
importantInfoSchema.methods.toPublicJSON = function () {
    return {
        id: this._id,
        title: this.title,
        items: this.items
            .filter(item => item.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(item => ({
                id: item._id,
                text: item.text
            }))
    };
};

// Middleware לפני שמירה
importantInfoSchema.pre('save', function (next) {
    // עדכון sortOrder אם לא נקבע
    this.items.forEach((item, index) => {
        if (item.sortOrder === 0) {
            item.sortOrder = index + 1;
        }
    });
    next();
});

module.exports = mongoose.model('ImportantInfo', importantInfoSchema);


