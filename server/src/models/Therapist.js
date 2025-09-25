const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./User');

const therapistSchema = new mongoose.Schema({
    // פרטי התחברות
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },

    // פרטים אישיים
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date
    },

    // תמונת פרופיל
    profileImage: {
        type: String,
        validate: {
            validator: function (value) {
                if (!value) return true;
                return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(value);
            },
            message: 'כתובת תמונת פרופיל לא תקינה'
        }
    },
    profileImagePublicId: {
        type: String
    },

    // תיאור מקצועי ואישי
    professionalDescription: {
        type: String,
        trim: true,
        maxlength: [2000, 'תיאור מקצועי לא יכול להכיל יותר מ-2000 תווים']
    },
    personalStory: {
        type: String,
        trim: true,
        maxlength: [3000, 'סיפור אישי לא יכול להכיל יותר מ-3000 תווים']
    },
    aboutMe: {
        type: String,
        trim: true,
        maxlength: [1500, 'טקסט "עליי" לא יכול להכיל יותר מ-1500 תווים']
    },

    // קישור Calendly
    calendlyUrl: {
        type: String,
        trim: true,
        validate: {
            validator: function (value) {
                if (!value) return true;
                return /^https:\/\/calendly\.com\/.+/.test(value);
            },
            message: 'כתובת Calendly לא תקינה - חייבת להתחיל ב-https://calendly.com'
        }
    },

    // רשתות חברתיות וקישורים
    socialMedia: {
        facebook: {
            type: String,
            trim: true,
            validate: {
                validator: function (value) {
                    if (!value) return true;
                    return /^https?:\/\/(www\.)?facebook\.com\/.+/.test(value);
                },
                message: 'כתובת פייסבוק לא תקינה'
            }
        },
        instagram: {
            type: String,
            trim: true,
            validate: {
                validator: function (value) {
                    if (!value) return true;
                    return /^https?:\/\/(www\.)?instagram\.com\/.+/.test(value);
                },
                message: 'כתובת אינסטגרם לא תקינה'
            }
        },
        linkedin: {
            type: String,
            trim: true,
            validate: {
                validator: function (value) {
                    if (!value) return true;
                    return /^https?:\/\/(www\.)?linkedin\.com\/.+/.test(value);
                },
                message: 'כתובת לינקדאין לא תקינה'
            }
        },
        twitter: {
            type: String,
            trim: true,
            validate: {
                validator: function (value) {
                    if (!value) return true;
                    return /^https?:\/\/(www\.)?twitter\.com\/.+/.test(value);
                },
                message: 'כתובת טוויטר לא תקינה'
            }
        },
        youtube: {
            type: String,
            trim: true,
            validate: {
                validator: function (value) {
                    if (!value) return true;
                    return /^https?:\/\/(www\.)?youtube\.com\/.+/.test(value);
                },
                message: 'כתובת יוטיוב לא תקינה'
            }
        },
        website: {
            type: String,
            trim: true,
            validate: {
                validator: function (value) {
                    if (!value) return true;
                    return /^https?:\/\/.+/.test(value);
                },
                message: 'כתובת אתר לא תקינה'
            }
        }
    },

    // קישור וואטסאפ
    whatsappLink: {
        type: String,
        trim: true,
        validate: {
            validator: function (value) {
                if (!value) return true;
                return /^https?:\/\/wa\.me\/\d+/.test(value);
            },
            message: 'קישור וואטסאפ לא תקין (צריך להיות בפורמט https://wa.me/מספר)'
        }
    },

    // שעות עבודה
    workingHours: {
        sunday: { start: String, end: String, isWorking: { type: Boolean, default: false } },
        monday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        tuesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        wednesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        thursday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        friday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        saturday: { start: String, end: String, isWorking: { type: Boolean, default: false } }
    },

    // שפות
    languages: [{
        type: String,
        enum: ['עברית', 'אנגלית', 'ערבית', 'רוסית', 'צרפתית', 'ספרדית', 'גרמנית', 'אחר'],
        default: ['עברית']
    }],

    // פרטי מקצוע
    profession: {
        type: String,
        required: [true, 'מקצוע הוא שדה חובה'],
        enum: {
            values: [
                'פסיכולוגית', 'פסיכולוגית קלינית', 'פסיכולוגית חינוכית', 'פסיכולוגית התפתחותית',
                'עובדת סוציאלית', 'עובדת סוציאלית קלינית',
                'מטפלת זוגית', 'מטפלת משפחתית',
                'מטפלת באמנות', 'מטפלת בתנועה', 'מטפלת במוזיקה', 'מטפלת בדרמה',
                'מטפלת הוליסטית', 'רפלקסולוגית', 'קוסמטיקאית',
                'מטפלת ברפואה משלימה',
                'יועצת חינוכית', 'יועצת זוגית',
                'מאמנת אישית', 'מאמנת עסקית',
                'אחר'
            ],
            message: 'מקצוע חייב להיות אחד מהערכים המוגדרים'
        }
    },
    licenseNumber: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        validate: {
            validator: function (value) {
                if (!value) return true;
                return /^[A-Z0-9]{6,15}$/.test(value);
            },
            message: 'מספר רישיון חייב להכיל 6-15 תווים (אותיות וספרות)'
        }
    },
    experience: {
        type: Number,
        default: 0,
        min: [0, 'ניסיון לא יכול להיות שלילי'],
        max: [50, 'ניסיון לא יכול להיות יותר מ-50 שנים']
    },
    specializations: [{
        type: String,
        trim: true,
        maxlength: [100, 'התמחות לא יכולה להכיל יותר מ-100 תווים']
    }],
    education: [{
        degree: {
            type: String,
            required: true,
            trim: true
        },
        institution: {
            type: String,
            required: true,
            trim: true
        },
        year: {
            type: Number,
            required: true,
            min: [1950, 'שנת סיום חייבת להיות אחרי 1950'],
            max: [new Date().getFullYear(), 'שנת סיום לא יכולה להיות בעתיד']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'תיאור לא יכול להכיל יותר מ-500 תווים']
        }
    }],
    certifications: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        issuer: {
            type: String,
            required: true,
            trim: true
        },
        date: {
            type: Date,
            required: true
        },
        expiryDate: {
            type: Date
        },
        certificateNumber: {
            type: String,
            trim: true
        }
    }],

    // פרטי עסק
    businessName: {
        type: String,
        trim: true,
        maxlength: [100, 'שם עסק לא יכול להכיל יותר מ-100 תווים']
    },
    businessAddress: {
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
    businessPhone: {
        type: String,
        validate: {
            validator: function (value) {
                if (!value) return true; // אופציונלי

                // נרמול המספר - מסיר רווחים, מקפים ופלוסים
                const normalizedPhone = value.replace(/[\s\-\+]/g, '');

                // תמיכה בפורמטים ישראליים:
                // 0528553431 (מקומי)
                // 972528553431 (בינלאומי)
                // 528553431 (ללא קידומת)
                return /^(972|0)?5\d{8}$/.test(normalizedPhone) || /^(972|0)?\d{8,10}$/.test(normalizedPhone);
            },
            message: 'אנא הכנס מספר טלפון עסקי תקין (לדוגמה: 050-1234567)'
        }
    },
    businessEmail: {
        type: String,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'אנא הכנס אימייל עסקי תקין'
        ]
    },

    // פרטי תשלום
    hourlyRate: {
        type: Number,
        default: 0,
        min: [0, 'תעריף שעתי לא יכול להיות שלילי'],
        max: [10000, 'תעריף שעתי לא יכול להיות יותר מ-10,000']
    },
    currency: {
        type: String,
        enum: ['ILS', 'USD', 'EUR'],
        default: 'ILS'
    },
    paymentMethods: [{
        type: String,
        enum: ['cash', 'credit_card', 'bank_transfer', 'check', 'paypal', 'bit']
    }],

    // פרטי אתר אישי
    website: {
        subdomain: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true,
            match: [/^[a-z0-9-]+$/, 'תת-דומיין יכול להכיל רק אותיות, ספרות ומקפים']
        },
        customDomain: {
            type: String,
            trim: true,
            lowercase: true
        },
        isActive: {
            type: Boolean,
            default: false
        },
        theme: {
            type: String,
            default: 'default',
            enum: ['default', 'modern', 'classic', 'minimal', 'colorful']
        },
        settings: {
            showContactForm: { type: Boolean, default: true },
            showCalendar: { type: Boolean, default: true },
            showTestimonials: { type: Boolean, default: true },
            showServices: { type: Boolean, default: true },
            showAbout: { type: Boolean, default: true },
            showGallery: { type: Boolean, default: false }
        },
        calendly: {
            isEnabled: { type: Boolean, default: false },
            setupStatus: {
                type: String,
                enum: ['not_started', 'in_progress', 'completed', 'error'],
                default: 'not_started'
            },
            username: {
                type: String,
                trim: true,
                lowercase: true,
                match: [/^[a-z0-9-_]+$/, 'שם משתמש Calendly יכול להכיל רק אותיות באנגלית, ספרות, מקפים וקו תחתון']
            },
            embedCode: {
                type: String,
                trim: true,
                validate: {
                    validator: function (value) {
                        if (!value) return true;
                        // בדיקה בסיסית שהקוד נראה כמו Calendly embed
                        return value.includes('calendly.com') || value.includes('iframe') || value.includes('script');
                    },
                    message: 'קוד הטמעה לא תקין - וודא שהעתקת את הקוד הנכון מ-Calendly'
                }
            },
            embedConfig: {
                hideEventTypeDetails: { type: Boolean, default: false },
                hideGdprBanner: { type: Boolean, default: true },
                primaryColor: { type: String, default: '#4A90E2' },
                textColor: { type: String, default: '#333333' },
                backgroundColor: { type: String, default: '#FFFFFF' },
                hideGitcamFooter: { type: Boolean, default: true },
                hideCalendlyFooter: { type: Boolean, default: false },
                height: { type: Number, default: 630, min: 400, max: 1200 },
                branding: { type: Boolean, default: true },
                inlineEmbed: { type: Boolean, default: true },
                popupWidget: { type: Boolean, default: false }
            },
            eventTypes: [{
                name: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [100, 'שם סוג פגישה לא יכול להכיל יותר מ-100 תווים']
                },
                duration: {
                    type: Number,
                    required: true,
                    min: [15, 'משך פגישה מינימלי הוא 15 דקות'],
                    max: [480, 'משך פגישה מקסימלי הוא 8 שעות']
                },
                price: {
                    type: Number,
                    min: [0, 'מחיר לא יכול להיות שלילי']
                },
                description: {
                    type: String,
                    trim: true,
                    maxlength: [500, 'תיאור לא יכול להכיל יותר מ-500 תווים']
                },
                calendlyUrl: {
                    type: String,
                    trim: true,
                    validate: {
                        validator: function (value) {
                            if (!value) return true;
                            return /^https:\/\/calendly\.com\/.+/.test(value);
                        },
                        message: 'כתובת Calendly חייבת להתחיל ב-https://calendly.com/'
                    }
                },
                isActive: { type: Boolean, default: true }
            }],
            settings: {
                hideEventTypesDetails: { type: Boolean, default: false },
                hideGdprBanner: { type: Boolean, default: true },
                primaryColor: { type: String, default: '#4A90E2' },
                textColor: { type: String, default: '#333333' },
                backgroundColor: { type: String, default: '#FFFFFF' }
            },
            lastSyncAt: { type: Date },
            isVerified: { type: Boolean, default: false },

            // נתונים נוספים לשירותים החדשים
            userUri: { type: String }, // URI של המשתמש ב-Calendly
            scope: { type: String }, // היקף ההרשאות
            connectedAt: { type: Date }, // זמן חיבור ראשוני
            disconnectedAt: { type: Date }, // זמן ניתוק
            lastConnectionAttempt: { type: Date }, // ניסיון חיבור אחרון
            lastTokenRefresh: { type: Date }, // רענון טוקן אחרון

            // מידע על פרופיל Calendly
            calendlyProfile: {
                name: { type: String },
                email: { type: String },
                timezone: { type: String },
                avatar_url: { type: String }
            },

            // נתוני webhook subscriptions
            webhookSubscriptions: [{
                uri: { type: String },
                callback_url: { type: String },
                events: [{ type: String }],
                state: { type: String },
                createdAt: { type: Date }
            }],
            lastWebhookSync: { type: Date },

            // חיבור שיזם מנהל
            adminInitiatedConnection: {
                adminEmail: { type: String },
                timestamp: { type: Date }
            },

            // שגיאה אחרונה
            lastError: {
                message: { type: String },
                timestamp: { type: Date },
                code: { type: String }
            }
        }
    },

    // עיצוב אישי לאתר
    theme: {
        primaryColor: { type: String, default: '#4A90E2' },
        secondaryColor: { type: String, default: '#F5A623' },
        fontFamily: { type: String, default: 'Heebo' },
        logoUrl: { type: String, default: '' },
        backgroundUrl: { type: String, default: '' }
    },

    // תמונות ומדיה
    gallery: [{
        url: {
            type: String,
            required: true,
            validate: {
                validator: function (value) {
                    return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(value);
                },
                message: 'כתובת תמונה לא תקינה'
            }
        },
        caption: {
            type: String,
            trim: true,
            maxlength: [200, 'כיתוב לא יכול להכיל יותר מ-200 תווים']
        },
        order: {
            type: Number,
            default: 0
        }
    }],

    // הגדרות מערכת
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    // שדות השלמת פרופיל ואישור
    isApproved: {
        type: Boolean,
        default: false
    },
    isProfileComplete: {
        type: Boolean,
        default: false
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
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'premium', 'extended', 'enterprise'],
            default: 'free'
        },
        startDate: Date,
        endDate: Date,
        isActive: {
            type: Boolean,
            default: true
        },
        features: [{
            type: String,
            enum: [
                'unlimited_clients', 'unlimited_appointments', 'website_builder',
                'advanced_analytics', 'payment_processing', 'sms_notifications',
                'email_marketing', 'custom_domain', 'priority_support', 'calendly'
            ]
        }]
    },

    // עקיפת הגבלות תוכנית - מאפשר לתת גישה לפיצ'רים ספציפיים ללא תלות בתוכנית
    featureOverrides: {
        calendly: { type: Boolean, default: false },
        unlimitedClients: { type: Boolean, default: false },
        customDomain: { type: Boolean, default: false },
        advancedAnalytics: { type: Boolean, default: false },
        paymentProcessing: { type: Boolean, default: false },
        smsNotifications: { type: Boolean, default: false },
        emailMarketing: { type: Boolean, default: false },
        prioritySupport: { type: Boolean, default: false }
    },
    userType: {
        type: String,
        enum: ['THERAPIST'],
        default: 'THERAPIST'
    },

    // סטטיסטיקות
    stats: {
        totalClients: { type: Number, default: 0 },
        totalAppointments: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },
        completedSessions: { type: Number, default: 0 },
        cancelledSessions: { type: Number, default: 0 },
        calendlyBookings: { type: Number, default: 0 }
    },

    // יעדי הכנסות
    monthlyRevenueTarget: {
        type: Number,
        default: 15000,
        min: [0, 'יעד ההכנסות החודשי לא יכול להיות שלילי'],
        max: [1000000, 'יעד ההכנסות החודשי לא יכול להיות יותר מ-1,000,000']
    },

    // נתונים מוצפנים (טוקנים רגישים)
    encryptedData: {
        calendlyAccessToken: { type: String, select: false },
        calendlyRefreshToken: { type: String, select: false },
        calendlyToken: { type: String, select: false }, // legacy field
        apiTokens: { type: Map, of: String, select: false }
    },

    // דף הבית באתר האישי
    clinicImage: {
        type: String,
        default: ''
    },
    homeSummary: {
        type: String,
        default: ''
    },

    // הגדרות קמפיינים
    campaignSettings: {
        monthlyEmailLimit: {
            type: Number,
            default: function () {
                switch (this.subscription?.plan) {
                    case 'free': return 100;
                    case 'basic': return 500;
                    case 'premium': return 2000;
                    case 'extended': return 5000;
                    case 'enterprise': return -1;
                    default: return 100;
                }
            }
        },
        emailsSentThisMonth: { type: Number, default: 0 },
        lastResetDate: { type: Date, default: Date.now }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware להצפנת סיסמה
therapistSchema.pre('save', async function (next) {
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

// מתודה להשוואת סיסמאות
therapistSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// מתודה לקבלת שם מלא
therapistSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// מתודה לקבלת כתובת מלאה
therapistSchema.virtual('fullAddress').get(function () {
    if (!this.businessAddress) return '';
    const { street, city, zipCode } = this.businessAddress;
    return [street, city, zipCode].filter(Boolean).join(', ');
});

// מתודה לקבלת פרטי אתר
therapistSchema.virtual('websiteUrl').get(function () {
    if (this.website.customDomain) {
        return `https://${this.website.customDomain}`;
    }
    if (this.website.subdomain) {
        return `https://${this.website.subdomain}.wellness-platform.com`;
    }
    return null;
});

// מתודה לקבלת פרטי עסק
therapistSchema.virtual('businessFullAddress').get(function () {
    if (!this.businessAddress) return '';
    const { street, city, zipCode, country } = this.businessAddress;
    return [street, city, zipCode, country].filter(Boolean).join(', ');
});

// מתודה לקבלת משך ממוצע שירות
therapistSchema.virtual('averageSessionDuration').get(function () {
    if (!this.services || this.services.length === 0) return 0;
    const totalDuration = this.services.reduce((sum, service) => sum + service.duration, 0);
    return Math.round(totalDuration / this.services.length);
});

// הגדרת JSON
therapistSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.password;
        return ret;
    }
});

// Middleware
therapistSchema.pre('save', function (next) {
    // הגדרת תפקיד כמטפלת
    this.role = 'therapist';
    next();
});

// מתודות
therapistSchema.methods.getActiveServices = function () {
    return this.services.filter(service => service.isActive);
};

therapistSchema.methods.getApprovedTestimonials = function () {
    return this.testimonials.filter(testimonial => testimonial.isApproved);
};

therapistSchema.methods.updateStats = function () {
    // עדכון סטטיסטיקות - יושלם עם מודל הפגישות
    return this;
};

// Static methods
therapistSchema.statics.findByProfession = function (profession) {
    return this.find({ profession, isActive: true, isVerified: true });
};

therapistSchema.statics.findByLocation = function (city) {
    return this.find({
        'businessAddress.city': new RegExp(city, 'i'),
        isActive: true,
        isVerified: true
    });
};

therapistSchema.statics.findByRating = function (minRating = 4) {
    return this.find({
        'stats.averageRating': { $gte: minRating },
        isActive: true,
        isVerified: true
    }).sort({ 'stats.averageRating': -1 });
};

// מתודות לבדיקת הרשאות פיצ'רים
therapistSchema.methods.hasFeature = function (featureKey) {
    // בדיקה אם יש עקיפה ספציפית לפיצ'ר
    if (this.featureOverrides && this.featureOverrides[featureKey] === true) {
        return true;
    }

    // בדיקה לפי תוכנית
    const premiumPlans = ['premium', 'extended', 'enterprise'];
    if (premiumPlans.includes(this.subscription.plan)) {
        return true;
    }

    // בדיקה אם הפיצ'ר נכלל ברשימת הפיצ'רים של התוכנית
    if (this.subscription.features && this.subscription.features.includes(featureKey)) {
        return true;
    }

    return false;
};

therapistSchema.methods.hasCalendlyAccess = function () {
    return this.hasFeature('calendly');
};

therapistSchema.methods.getPlanLimitations = function () {
    const plan = this.subscription.plan;
    const limitations = {
        maxClients: 0,
        maxAppointments: 0,
        hasWebsiteBuilder: false,
        hasAdvancedAnalytics: false,
        hasCustomDomain: false,
        hasCalendly: false
    };

    switch (plan) {
        case 'free':
            limitations.maxClients = 5;
            limitations.maxAppointments = 10;
            break;
        case 'basic':
            limitations.maxClients = 25;
            limitations.maxAppointments = 100;
            limitations.hasWebsiteBuilder = true;
            break;
        case 'premium':
        case 'extended':
            limitations.maxClients = -1; // unlimited
            limitations.maxAppointments = -1; // unlimited
            limitations.hasWebsiteBuilder = true;
            limitations.hasAdvancedAnalytics = true;
            limitations.hasCustomDomain = true;
            limitations.hasCalendly = true;
            break;
        case 'enterprise':
            limitations.maxClients = -1;
            limitations.maxAppointments = -1;
            limitations.hasWebsiteBuilder = true;
            limitations.hasAdvancedAnalytics = true;
            limitations.hasCustomDomain = true;
            limitations.hasCalendly = true;
            break;
    }

    // החל עקיפות
    if (this.featureOverrides) {
        if (this.featureOverrides.unlimitedClients) limitations.maxClients = -1;
        if (this.featureOverrides.customDomain) limitations.hasCustomDomain = true;
        if (this.featureOverrides.advancedAnalytics) limitations.hasAdvancedAnalytics = true;
        if (this.featureOverrides.calendly) limitations.hasCalendly = true;
    }

    return limitations;
};

module.exports = mongoose.model('Therapist', therapistSchema); 