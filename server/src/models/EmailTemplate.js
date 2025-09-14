const emailTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'שם התבנית הוא שדה חובה'],
        trim: true,
        maxlength: [100, 'שם התבנית לא יכול להכיל יותר מ-100 תווים']
    },
    category: {
        type: String,
        enum: ['general', 'birthday', 'holiday', 'reminder', 'followup', 'welcome', 'newsletter'],
        default: 'general'
    },
    subject: {
        type: String,
        required: [true, 'נושא המייל הוא שדה חובה'],
        trim: true
    },
    htmlContent: {
        type: String,
        required: [true, 'תוכן המייל הוא שדה חובה']
    },
    previewText: {
        type: String,
        maxlength: [150, 'טקסט התצוגה המקדימה לא יכול להכיל יותר מ-150 תווים']
    },
    variables: [{
        name: String,
        description: String,
        example: String
    }],
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    therapist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: [true, 'מטפל הוא שדה חובה']
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

emailTemplateSchema.index({ therapist: 1, category: 1 });
emailTemplateSchema.pre(/^find/, function() {
    if (!this.getOptions().includeDeleted) {
        this.where({ deletedAt: null });
    }
});

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);
