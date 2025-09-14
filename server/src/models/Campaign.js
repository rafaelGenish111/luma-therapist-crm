const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    // פרטי הקמפיין
    name: {
        type: String,
        required: [true, 'שם הקמפיין הוא שדה חובה'],
        trim: true,
        maxlength: [100, 'שם הקמפיין לא יכול להכיל יותר מ-100 תווים']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'התיאור לא יכול להכיל יותר מ-500 תווים']
    },
    
    // תוכן המייל
    subject: {
        type: String,
        required: [true, 'נושא המייל הוא שדה חובה'],
        trim: true,
        maxlength: [200, 'נושא המייל לא יכול להכיל יותר מ-200 תווים']
    },
    content: {
        type: String,
        required: [true, 'תוכן המייל הוא שדה חובה']
    },
    previewText: {
        type: String,
        maxlength: [150, 'טקסט התצוגה המקדימה לא יכול להכיל יותר מ-150 תווים']
    },
    
    // נמענים
    recipientList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    }],
    recipientFilter: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    
    // סטטוס ותזמון
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'sending', 'sent', 'cancelled'],
        default: 'draft'
    },
    scheduledAt: {
        type: Date
    },
    sentAt: {
        type: Date
    },
    
    // סטטיסטיקות
    statistics: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 },
        bounced: { type: Number, default: 0 },
        failed: { type: Number, default: 0 }
    },
    
    // קישור למטפל
    therapist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: [true, 'מטפל הוא שדה חובה']
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
campaignSchema.index({ therapist: 1, createdAt: -1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ scheduledAt: 1 });

// Virtuals
campaignSchema.virtual('openRate').get(function() {
    if (this.statistics.sent === 0) return 0;
    return ((this.statistics.opened / this.statistics.sent) * 100).toFixed(2);
});

campaignSchema.virtual('clickRate').get(function() {
    if (this.statistics.sent === 0) return 0;
    return ((this.statistics.clicked / this.statistics.sent) * 100).toFixed(2);
});

// Middleware לסינון מחוקים
campaignSchema.pre(/^find/, function() {
    if (!this.getOptions().includeDeleted) {
        this.where({ deletedAt: null });
    }
});

module.exports = mongoose.model('Campaign', campaignSchema);