require('dotenv').config();
const mongoose = require('../config/database'); // אם זה מחזיר connect, ודאי חיבור
const User = require('../models/User');

(async () => {
    try {
        await require('../config/database')(); // אם הפונקציה נקראת connectDB
        const email = 'rafaelgenish111@gmail.com';
        const password = 'Noam2012!!';
        const firstName = 'רפאל';
        const lastName = 'גניש';
        const phone = '+972528553431';

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ email, password, firstName, lastName, phone, role: 'admin' });
            await user.save();
            console.log('Admin נוצר');
        } else {
            user.role = 'admin';
            if (!user.phone) user.phone = phone;
            if (password) user.password = password; // ירוץ hashing ב-pre save אם תרצה/י להחליף סיסמה
            await user.save();
            console.log('המשתמש עודכן ל-admin');
        }
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
})();