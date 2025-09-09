const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const clientSchema = new mongoose.Schema({
    // קשר למטפלת
    therapist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: [true, 'מטפלת היא שדה חובה']
    },

    // פרטים אישיים
    firstName: {
        type: String,
        required: [true, 'שם פרטי הוא שדה חובה'],
        trim: true,
        minlength: [2, 'שם פרטי חייב להכיל לפחות 2 תווים'],
        maxlength: [50, 'שם פרטי לא יכול להכיל יותר מ-50 תווים']
    },
    lastName: {
        type: String,
        required: [true, 'שם משפחה הוא שדה חובה'],
        trim: true,
        minlength: [2, 'שם משפחה חייב להכיל לפחות 2 תווים'],
        maxlength: [50, 'שם משפחה לא יכול להכיל יותר מ-50 תווים']
    },
    email: {
        type: String,
        required: [true, 'אימייל הוא שדה חובה'],
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'אנא הכנס אימייל תקין'
        ]
    },
    // פרטי התחברות ללקוח במידה ומתחבר
    password: {
        type: String,
        minlength: [6, 'סיסמה חייבת להכיל לפחות 6 תווים'],
        select: false
    },
    userType: {
        type: String,
        enum: ['CLIENT'],
        default: 'CLIENT'
    },
    phone: {
        type: String,
        required: [true, 'מספר טלפון הוא שדה חובה'],
        trim: true,
        match: [/^\d{3}-?\d{7}$/, 'מספר טלפון חייב להיות בפורמט 3 ספרות קידומת ו-7 ספרות מספר']
    },
    dateOfBirth: {
        type: Date
    },

    // פרטי כתובת
    street: {
        type: String,
        trim: true,
        maxlength: [100, 'רחוב לא יכול להכיל יותר מ-100 תווים']
    },
    houseNumber: {
        type: String,
        trim: true,
        match: [/^\d{1,4}[A-Za-zא-ת]?$/, 'מספר בית חייב להיות 1-4 ספרות, אפשרי אות אחת']
    },
    city: {
        type: String,
        trim: true,
        maxlength: [50, 'עיר לא יכולה להכיל יותר מ-50 תווים']
    },
    zip: {
        type: String,
        trim: true
    },
    country: {
        type: String,
        default: 'ישראל',
        trim: true
    },

    nationalId: {
        type: String,
        required: [true, 'תעודת זהות היא שדה חובה'],
        trim: true,
        unique: true,
        validate: {
            validator: function (value) {
                if (!value) return false;
                if (!/^\d{9}$/.test(value)) return false;
                // בדיקת תקינות ת.ז. ישראלית
                const digits = value.split('').map(Number);
                let sum = 0;
                for (let i = 0; i < 9; i++) {
                    let inc = digits[i] * ((i % 2) + 1);
                    if (inc > 9) inc -= 9;
                    sum += inc;
                }
                return sum % 10 === 0;
            },
            message: 'תעודת זהות אינה תקינה (חייבת 9 ספרות ועומדת בבדיקת תקינות)'
        }
    },

    // סטטוס וואטסאפ
    status: {
        type: String,
        enum: ['פניה ראשונית', 'לקוח קיים', 'לקוח פוטנציאלי', 'לא רלוונטי'],
        default: 'פניה ראשונית'
    },

    // תיאור כללי ומידע רפואי
    generalDescription: {
        type: String,
        maxlength: [2000, 'תיאור כללי לא יכול להכיל יותר מ-2000 תווים'],
        trim: true
    },
    referralReason: {
        type: String,
        maxlength: [1000, 'סיבת הפניה לא יכולה להכיל יותר מ-1000 תווים'],
        trim: true
    },
    medicalHistory: {
        type: String,
        maxlength: [3000, 'היסטוריה רפואית לא יכולה להכיל יותר מ-3000 תווים'],
        trim: true
    },
    currentMedications: {
        type: String,
        maxlength: [1000, 'תרופות נוכחיות לא יכולות להכיל יותר מ-1000 תווים'],
        trim: true
    },
    allergies: {
        type: String,
        maxlength: [500, 'אלרגיות לא יכולות להכיל יותר מ-500 תווים'],
        trim: true
    },
    emergencyContact: {
        name: {
            type: String,
            maxlength: [100, 'שם איש קשר לא יכול להכיל יותר מ-100 תווים'],
            trim: true
        },
        phone: {
            type: String,
            maxlength: [20, 'טלפון איש קשר לא יכול להכיל יותר מ-20 תווים'],
            trim: true
        },
        relationship: {
            type: String,
            maxlength: [50, 'קשר לא יכול להכיל יותר מ-50 תווים'],
            trim: true
        }
    },
    whatsapp: {
        type: String,
        trim: true,
        validate: {
            validator: function (value) {
                if (!value) return true;
                return /^https?:\/\/.+/.test(value);
            },
            message: 'קישור וואטסאפ חייב להתחיל ב-http או https'
        }
    },

    // תחומי עניין והערות
    interests: {
        type: String,
        trim: true,
        maxlength: [500, 'תחומי עניין לא יכולים להכיל יותר מ-500 תווים']
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [2000, 'הערות לא יכולות להכיל יותר מ-2000 תווים']
    },

    // אינטראקציות
    interactions: [{
        date: {
            type: Date,
            default: Date.now
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: [1000, 'טקסט אינטראקציה לא יכול להכיל יותר מ-1000 תווים']
        },
        type: {
            type: String,
            enum: ['general', 'phone', 'email', 'whatsapp', 'meeting'],
            default: 'general'
        },
        therapist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Therapist'
        }
    }],

    // מצב חשבון ונעילה
    isActive: {
        type: Boolean,
        default: true
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },

    // שדות נוספים מהרשמה
    medicalHistory: {
        type: [String],
        default: []
    },
    emergencyContact: {
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
        relation: { type: String, trim: true }
    },

    // סטטוס לקוח חדש
    clientStatus: {
        type: String,
        enum: ['new', 'active', 'completed', 'inactive'],
        default: 'new'
    },

    // מסמכים
    documents: [{
        name: { type: String, required: true },
        type: { type: String, required: true }, // 'medical', 'consent', 'other'
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist' },
        description: { type: String },
        isRequired: { type: Boolean, default: false },
        isCompleted: { type: Boolean, default: false }
    }],

    // היסטוריית תקשורת
    communicationHistory: [{
        type: { type: String, enum: ['sms', 'email', 'whatsapp'], required: true },
        subject: { type: String },
        content: { type: String, required: true },
        sentAt: { type: Date, default: Date.now },
        sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist' },
        status: { type: String, enum: ['sent', 'delivered', 'failed'], default: 'sent' },
        messageId: { type: String } // ID מהשירות החיצוני
    }],

    // הערות נוספות
    additionalNotes: {
        type: String,
        trim: true,
        maxlength: [2000, 'הערות נוספות לא יכולות להכיל יותר מ-2000 תווים']
    },

    // אימות דוא"ל
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        select: false
    },
    emailVerificationExpire: {
        type: Date,
        select: false
    },
    emailVerifiedAt: {
        type: Date
    }

}, {
    timestamps: true
});

// אינדקסים
clientSchema.index({ therapist: 1, createdAt: -1 });
clientSchema.index({ therapist: 1, status: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ phone: 1 });

// וירטואלים
clientSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

clientSchema.virtual('age').get(function () {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

// מתודות סטטיות
clientSchema.statics.findByTherapist = function (therapistId, options = {}) {
    const query = { therapist: therapistId };

    if (options.status) {
        query.status = options.status;
    }

    if (options.search) {
        query.$or = [
            { firstName: { $regex: options.search, $options: 'i' } },
            { lastName: { $regex: options.search, $options: 'i' } },
            { email: { $regex: options.search, $options: 'i' } },
            { phone: { $regex: options.search, $options: 'i' } }
        ];
    }

    return this.find(query).sort({ createdAt: -1 });
};

// מתודות אינסטנס
clientSchema.methods.addInteraction = function (text, type = 'general', therapistId = null) {
    this.interactions.push({
        date: new Date(),
        text,
        type,
        therapist: therapistId
    });
    return this.save();
};

clientSchema.methods.updateStatus = function (newStatus) {
    this.status = newStatus;
    return this.save();
};

// Middleware
clientSchema.pre('save', function (next) {
    // ניקוי אימייל
    if (this.email) {
        this.email = this.email.toLowerCase().trim();
    }

    // ניקוי טלפון
    if (this.phone) {
        this.phone = this.phone.replace(/\s/g, '');
    }

    next();
});

// אפס נעילה כאשר מאפסים ניסיונות
clientSchema.pre('save', function (next) {
    if (this.isModified('loginAttempts') && this.loginAttempts === 0) {
        this.lockUntil = undefined;
    }
    next();
});

// הצפנת סיסמה (אם קיימת)
clientSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    try {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const salt = await bcrypt.genSalt(saltRounds);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Client', clientSchema); 