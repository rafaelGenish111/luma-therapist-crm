const mongoose = require('mongoose');

const clientDocumentSchema = new mongoose.Schema({
    // קשר ללקוח
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: [true, 'לקוח הוא שדה חובה'],
    },

    // פרטי המסמך
    title: {
        type: String,
        required: [true, 'כותרת היא שדה חובה'],
        trim: true,
        maxlength: [200, 'כותרת לא יכולה להכיל יותר מ-200 תווים']
    },
    type: {
        type: String,
        enum: ['health', 'consent', 'report', 'other'],
        default: 'other'
    },
    url: {
        type: String,
        required: [true, 'URL הוא שדה חובה']
    },

    // פרטי העלאה
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: [true, 'מעלה המסמך הוא שדה חובה']
    },

    // פרטים נוספים
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'תיאור לא יכול להכיל יותר מ-500 תווים']
    },
    fileSize: {
        type: Number,
        min: [0, 'גודל קובץ לא יכול להיות שלילי']
    },
    mimeType: {
        type: String
    },
    isRequired: {
        type: Boolean,
        default: false
    },
    isCompleted: {
        type: Boolean,
        default: false
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
clientDocumentSchema.index({ clientId: 1, createdAt: -1 });
clientDocumentSchema.index({ type: 1 });
clientDocumentSchema.index({ uploadedBy: 1 });
clientDocumentSchema.index({ isRequired: 1 });
clientDocumentSchema.index({ isCompleted: 1 });

// Middleware לסינון מסמכים מחוקים
clientDocumentSchema.pre(/^find/, function () {
    if (!this.getOptions().includeDeleted && !this.getQuery().includeDeleted) {
        this.where({ deletedAt: null });
    }
});

// מתודות סטטיות
clientDocumentSchema.statics.findByClient = function (clientId, options = {}) {
    const query = { clientId: clientId };

    if (options.type) {
        query.type = options.type;
    }

    if (options.isRequired !== undefined) {
        query.isRequired = options.isRequired;
    }

    if (options.isCompleted !== undefined) {
        query.isCompleted = options.isCompleted;
    }

    return this.find(query).sort({ createdAt: -1 });
};

clientDocumentSchema.statics.findRequiredByClient = function (clientId) {
    return this.find({
        clientId: clientId,
        isRequired: true
    }).sort({ createdAt: -1 });
};

clientDocumentSchema.statics.findCompletedByClient = function (clientId) {
    return this.find({
        clientId: clientId,
        isCompleted: true
    }).sort({ createdAt: -1 });
};

// מתודות אינסטנס
clientDocumentSchema.methods.markAsCompleted = function () {
    this.isCompleted = true;
    return this.save();
};

clientDocumentSchema.methods.markAsIncomplete = function () {
    this.isCompleted = false;
    return this.save();
};

clientDocumentSchema.methods.softDelete = function () {
    this.deletedAt = new Date();
    return this.save();
};

// וירטואלים
clientDocumentSchema.virtual('formattedFileSize').get(function () {
    if (!this.fileSize) return 'לא ידוע';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(this.fileSize) / Math.log(k));
    return parseFloat((this.fileSize / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

clientDocumentSchema.virtual('isImage').get(function () {
    return this.mimeType && this.mimeType.startsWith('image/');
});

clientDocumentSchema.virtual('isPDF').get(function () {
    return this.mimeType === 'application/pdf';
});

// Middleware
clientDocumentSchema.pre('save', function (next) {
    // ניקוי URL
    if (this.url) {
        this.url = this.url.trim();
    }

    // ניקוי כותרת
    if (this.title) {
        this.title = this.title.trim();
    }

    next();
});

module.exports = mongoose.model('ClientDocument', clientDocumentSchema);


