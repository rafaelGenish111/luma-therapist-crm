const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'כותרת המאמר נדרשת'],
        trim: true,
        maxlength: [200, 'כותרת לא יכולה להיות יותר מ-200 תווים']
    },
    subtitle: {
        type: String,
        trim: true,
        maxlength: [300, 'כותרת משנה לא יכולה להיות יותר מ-300 תווים']
    },
    content: {
        type: String,
        required: [true, 'תוכן המאמר נדרש'],
        minlength: [50, 'תוכן המאמר חייב להכיל לפחות 50 תווים']
    },
    excerpt: {
        type: String,
        trim: true,
        maxlength: [500, 'תקציר לא יכול להיות יותר מ-500 תווים']
    },
    imageUrl: {
        type: String,
        required: false
    },
    imagePublicId: {
        type: String,
        required: false
    },
    therapist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: [true, 'מטפלת נדרשת']
    },
    category: {
        type: String,
        required: [true, 'קטגוריה נדרשת'],
        enum: {
            values: ['health', 'wellness', 'therapy', 'tips', 'news', 'other'],
            message: 'קטגוריה חייבת להיות אחת מהערכים: health, wellness, therapy, tips, news, other'
        }
    },
    tags: [{
        type: String,
        trim: true
    }],
    isPublished: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    readTime: {
        type: Number,
        default: 5 // בדקות
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    seoTitle: {
        type: String,
        trim: true,
        maxlength: [60, 'כותרת SEO לא יכולה להיות יותר מ-60 תווים']
    },
    seoDescription: {
        type: String,
        trim: true,
        maxlength: [160, 'תיאור SEO לא יכול להיות יותר מ-160 תווים']
    },
    slug: {
        type: String,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// אינדקסים
articleSchema.index({ therapist: 1, isPublished: 1 });
articleSchema.index({ category: 1, isPublished: 1 });
// slug כבר מוגדר unique: true בשדה, אין צורך באינדקס כפול
// articleSchema.index({ slug: 1 });
articleSchema.index({ tags: 1, isPublished: 1 });
articleSchema.index({ isFeatured: 1, isPublished: 1 });

// וירטואלים
articleSchema.virtual('categoryLabel').get(function () {
    const categories = {
        health: 'בריאות',
        wellness: 'בריאות כללית',
        therapy: 'טיפולים',
        tips: 'טיפים',
        news: 'חדשות',
        other: 'אחר'
    };
    return categories[this.category] || this.category;
});

articleSchema.virtual('url').get(function () {
    return `/articles/${this.slug}`;
});

// Middleware pre-save ליצירת slug
articleSchema.pre('save', function (next) {
    // יצירת slug אם הוא ריק או לא קיים
    if (!this.slug || this.slug === '') {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // אם יש slug ריק, נמחק אותו כדי שהאינדקס לא ייכשל
    if (this.slug === '') {
        this.slug = undefined;
    }

    next();
});

// מתודות סטטיות
articleSchema.statics.findPublished = function () {
    return this.find({ isPublished: true, publishedAt: { $lte: new Date() } }).sort({ publishedAt: -1 });
};

articleSchema.statics.findByTherapist = function (therapistId) {
    return this.find({ therapist: therapistId }).sort({ createdAt: -1 });
};

articleSchema.statics.findFeatured = function () {
    return this.find({ isFeatured: true, isPublished: true, publishedAt: { $lte: new Date() } }).sort({ publishedAt: -1 });
};

// מתודות אינסטנס
articleSchema.methods.publish = function () {
    this.isPublished = true;
    this.publishedAt = new Date();
    return this.save();
};

articleSchema.methods.unpublish = function () {
    this.isPublished = false;
    this.publishedAt = null;
    return this.save();
};

articleSchema.methods.incrementViews = function () {
    this.views += 1;
    return this.save();
};

articleSchema.methods.toPublicJSON = function () {
    const obj = this.toObject();
    delete obj.therapist;
    return obj;
};

module.exports = mongoose.model('Article', articleSchema); 