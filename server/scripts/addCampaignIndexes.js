const mongoose = require('mongoose');
require('dotenv').config();

// חיבור למסד הנתונים
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-platform', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ חובר למסד הנתונים');
    } catch (error) {
        console.error('❌ שגיאה בחיבור למסד הנתונים:', error);
        process.exit(1);
    }
};

// יצירת אינדקסים לקמפיינים
const addCampaignIndexes = async () => {
    try {
        const db = mongoose.connection.db;
        const collection = db.collection('campaigns');

        // אינדקס על therapistId
        await collection.createIndex({ therapistId: 1 });
        console.log('✅ נוצר אינדקס על therapistId');

        // אינדקס על status
        await collection.createIndex({ status: 1 });
        console.log('✅ נוצר אינדקס על status');

        // אינדקס על scheduledFor
        await collection.createIndex({ scheduledFor: 1 });
        console.log('✅ נוצר אינדקס על scheduledFor');

        // אינדקס מורכב על therapistId ו-status
        await collection.createIndex({ therapistId: 1, status: 1 });
        console.log('✅ נוצר אינדקס מורכב על therapistId ו-status');

        // אינדקס על createdAt
        await collection.createIndex({ createdAt: -1 });
        console.log('✅ נוצר אינדקס על createdAt');

        // אינדקס על recipients.email (אם יש)
        await collection.createIndex({ 'recipients.email': 1 });
        console.log('✅ נוצר אינדקס על recipients.email');

        console.log('🎉 כל האינדקסים נוצרו בהצלחה!');
    } catch (error) {
        console.error('❌ שגיאה ביצירת אינדקסים:', error);
    }
};

// יצירת אינדקסים לEmailLog
const addEmailLogIndexes = async () => {
    try {
        const db = mongoose.connection.db;
        const collection = db.collection('emaillogs');

        // אינדקס על campaignId
        await collection.createIndex({ campaignId: 1 });
        console.log('✅ נוצר אינדקס על campaignId בEmailLog');

        // אינדקס על recipientEmail
        await collection.createIndex({ recipientEmail: 1 });
        console.log('✅ נוצר אינדקס על recipientEmail בEmailLog');

        // אינדקס על status
        await collection.createIndex({ status: 1 });
        console.log('✅ נוצר אינדקס על status בEmailLog');

        // אינדקס על sentAt
        await collection.createIndex({ sentAt: -1 });
        console.log('✅ נוצר אינדקס על sentAt בEmailLog');

        // אינדקס מורכב על campaignId ו-status
        await collection.createIndex({ campaignId: 1, status: 1 });
        console.log('✅ נוצר אינדקס מורכב על campaignId ו-status בEmailLog');

        console.log('🎉 כל האינדקסים של EmailLog נוצרו בהצלחה!');
    } catch (error) {
        console.error('❌ שגיאה ביצירת אינדקסים של EmailLog:', error);
    }
};

// יצירת אינדקסים לEmailTemplate
const addEmailTemplateIndexes = async () => {
    try {
        const db = mongoose.connection.db;
        const collection = db.collection('emailtemplates');

        // אינדקס על therapistId
        await collection.createIndex({ therapistId: 1 });
        console.log('✅ נוצר אינדקס על therapistId בEmailTemplate');

        // אינדקס על isDefault
        await collection.createIndex({ isDefault: 1 });
        console.log('✅ נוצר אינדקס על isDefault בEmailTemplate');

        // אינדקס מורכב על therapistId ו-isDefault
        await collection.createIndex({ therapistId: 1, isDefault: 1 });
        console.log('✅ נוצר אינדקס מורכב על therapistId ו-isDefault בEmailTemplate');

        console.log('🎉 כל האינדקסים של EmailTemplate נוצרו בהצלחה!');
    } catch (error) {
        console.error('❌ שגיאה ביצירת אינדקסים של EmailTemplate:', error);
    }
};

// הרצת הסקריפט
const run = async () => {
    console.log('🚀 מתחיל יצירת אינדקסים...');

    await connectDB();
    await addCampaignIndexes();
    await addEmailLogIndexes();
    await addEmailTemplateIndexes();

    console.log('✅ סיום יצירת אינדקסים');
    process.exit(0);
};

run().catch(error => {
    console.error('❌ שגיאה כללית:', error);
    process.exit(1);
});
