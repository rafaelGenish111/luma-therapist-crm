require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const SiteSettings = require('../models/SiteSettings');

(async () => {
    try {
        await connectDB();
        const doc = await SiteSettings.getSingleton();
        if (!doc.contact || (!doc.contact.phone && !doc.contact.email)) {
            doc.contact = {
                phone: '+972-50-123-4567',
                email: 'info@luma.co.il',
                address: 'תל אביב, ישראל',
                whatsappLink: 'https://wa.me/972501234567',
                website: 'https://luma.co.il'
            };
            await doc.save();
            console.log('Seeded default site settings');
        } else {
            console.log('Site settings already exist');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();



