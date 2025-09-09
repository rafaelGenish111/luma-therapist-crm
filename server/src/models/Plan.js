const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, trim: true },
    percentOff: { type: Number, min: 0, max: 100 },
    amountOff: { type: Number, min: 0 },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date }
}, { _id: false });

const planSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, trim: true }, // free | premium | extended | custom
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }, // מחיר חודשי בשקלים
    discountPrice: { type: Number, min: 0 }, // מחיר לאחר הנחה (אופציונלי)
    discountPercent: { type: Number, min: 0, max: 100, default: 0 }, // הנחת אחוזים (אופציונלי)
    coupons: { type: [couponSchema], default: [] }, // קודי קופון
    features: { type: [String], default: [] }, // מה כוללת התוכנית
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);


