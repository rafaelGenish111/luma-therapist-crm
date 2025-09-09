const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // פרטי התחברות
    email: {
        type: String,
        required: [true, 'אימייל הוא שדה חובה'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'אנא הכנס אימייל תקין'
        ]
    },
    password: {
        type: String,
        required: [true, 'סיסמה היא שדה חובה'],
        minlength: [6, 'סיסמה חייבת להכיל לפחות 6 תווים'],
        select: false // לא להחזיר סיסמה בברירת מחדל
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
    phone: {
        type: String,
        required: [true, 'מספר טלפון הוא שדה חובה'],
        match: [
            /^[\+]?[1-9][\d]{0,15}$/,
            'אנא הכנס מספר טלפון תקין'
        ]
    },
    dateOfBirth: {
        type: Date,
        validate: {
            validator: function (value) {
                if (!value) return true;
                const age = Math.floor((new Date() - value) / (365.25 * 24 * 60 * 60 * 1000));
                return age >= 18 && age <= 120;
            },
            message: 'גיל חייב להיות בין 18 ל-120'
        }
    },

    // פרטי כתובת
    address: {
        street: {
            type: String,
            trim: true,
            maxlength: [100, 'רחוב לא יכול להכיל יותר מ-100 תווים']
        },
        city: {
            type: String,
            trim: true,
            maxlength: [50, 'עיר לא יכולה להכיל יותר מ-50 תווים']
        },
        zipCode: {
            type: String,
            trim: true,
            match: [/^\d{5,7}$/, 'מיקוד חייב להכיל 5-7 ספרות']
        },
        country: {
            type: String,
            default: 'ישראל',
            trim: true
        }
    },

    // תמונות ומדיה
    profileImage: {
        type: String,
        validate: {
            validator: function (value) {
                if (!value) return true;
                return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(value);
            },
            message: 'כתובת תמונה לא תקינה'
        }
    },

    // הגדרות מערכת
    role: {
        type: String,
        enum: {
            values: ['user', 'therapist', 'admin'],
            message: 'תפקיד חייב להיות אחד מהערכים: user, therapist, admin'
        },
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },

    // הגדרות פרטיות
    preferences: {
        language: {
            type: String,
            enum: ['he', 'en', 'ar'],
            default: 'he'
        },
        timezone: {
            type: String,
            default: 'Asia/Jerusalem'
        },
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: true },
            push: { type: Boolean, default: true }
        }
    },

    // היסטוריית התחברות
    lastLogin: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },

    // אימות דו-שלבי
    twoFactorAuth: {
        enabled: { type: Boolean, default: false },
        secret: { type: String, select: false },
        backupCodes: [{ type: String, select: false }]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('fullAddress').get(function () {
    if (!this.address) return '';
    const { street, city, zipCode, country } = this.address;
    return [street, city, zipCode, country].filter(Boolean).join(', ');
});

userSchema.virtual('age').get(function () {
    if (!this.dateOfBirth) return null;
    return Math.floor((new Date() - this.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
});

// Middleware להצפנת סיסמה
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const salt = await bcrypt.genSalt(saltRounds);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware לניהול ניסיונות התחברות
userSchema.pre('save', function (next) {
    if (this.isModified('loginAttempts') && this.loginAttempts === 0) {
        this.lockUntil = undefined;
    }
    next();
});

// מתודות
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incLoginAttempts = function () {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };
    if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // נעילת 2 שעות
    }

    return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function () {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Static methods
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActive = function () {
    return this.find({ isActive: true });
};

module.exports = mongoose.model('User', userSchema); 