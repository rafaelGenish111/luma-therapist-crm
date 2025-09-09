const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema({
    contact: {
        phone: { type: String, default: '' },
        email: { type: String, default: '' },
        address: { type: String, default: '' },
        whatsappLink: { type: String, default: '' },
        website: { type: String, default: '' },
        facebook: { type: String, default: '' },
        instagram: { type: String, default: '' },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, collection: 'site_settings' });

// יחיד: נשמור רשומה יחידה
SiteSettingsSchema.statics.getSingleton = async function () {
    let doc = await this.findOne();
    if (!doc) {
        doc = await this.create({});
    }
    return doc;
};

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);



