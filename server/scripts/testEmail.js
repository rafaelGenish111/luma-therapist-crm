const nodemailer = require('nodemailer');
require('dotenv').config();

// יצירת transporter לבדיקת הגדרות אימייל
const createTransporter = () => {
    const emailService = process.env.EMAIL_SERVICE || 'gmail';

    if (emailService === 'sendgrid') {
        // SendGrid configuration
        return nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
                user: 'apikey',
                pass: process.env.SENDGRID_API_KEY
            }
        });
    } else {
        // Gmail או SMTP אחר
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
};

// בדיקת חיבור לאימייל
const testEmailConnection = async () => {
    try {
        console.log('🔍 בודק הגדרות אימייל...');

        const transporter = createTransporter();

        // בדיקת חיבור
        await transporter.verify();
        console.log('✅ חיבור לאימייל הצליח!');

        return transporter;
    } catch (error) {
        console.error('❌ שגיאה בחיבור לאימייל:', error.message);

        if (error.message.includes('Invalid login')) {
            console.log('💡 טיפ: בדוק את EMAIL_USER ו-EMAIL_PASS ב-.env');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('💡 טיפ: בדוק את EMAIL_HOST ו-EMAIL_PORT ב-.env');
        }

        throw error;
    }
};

// שליחת אימייל בדיקה
const sendTestEmail = async (transporter) => {
    try {
        const testEmail = process.env.EMAIL_USER; // שליחה לעצמנו

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'פלטפורמת הרווחה'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: testEmail,
            subject: '🧪 בדיקת הגדרות אימייל - Luma',
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2B5A87;">🎉 בדיקת אימייל הצליחה!</h2>
                    <p>הגדרות האימייל במערכת פועלות תקין.</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                        זמן שליחה: ${new Date().toLocaleString('he-IL')}<br>
                        שרת: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}
                    </p>
                </div>
            `,
            text: `
                🎉 בדיקת אימייל הצליחה!
                
                הגדרות האימייל במערכת פועלות תקין.
                
                זמן שליחה: ${new Date().toLocaleString('he-IL')}
                שרת: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ אימייל בדיקה נשלח בהצלחה!');
        console.log('📧 Message ID:', info.messageId);
        console.log('📬 נשלח אל:', testEmail);

        return info;
    } catch (error) {
        console.error('❌ שגיאה בשליחת אימייל:', error.message);
        throw error;
    }
};

// בדיקת משתני סביבה
const checkEnvironmentVariables = () => {
    console.log('🔍 בודק משתני סביבה...');

    const requiredVars = [
        'EMAIL_USER',
        'EMAIL_PASS'
    ];

    const optionalVars = [
        'EMAIL_SERVICE',
        'EMAIL_HOST',
        'EMAIL_PORT',
        'EMAIL_FROM',
        'EMAIL_FROM_NAME',
        'SENDGRID_API_KEY'
    ];

    let missingRequired = [];
    let missingOptional = [];

    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            missingRequired.push(varName);
        }
    });

    optionalVars.forEach(varName => {
        if (!process.env[varName]) {
            missingOptional.push(varName);
        }
    });

    if (missingRequired.length > 0) {
        console.log('❌ משתני סביבה חסרים (חובה):');
        missingRequired.forEach(varName => {
            console.log(`   - ${varName}`);
        });
        return false;
    }

    if (missingOptional.length > 0) {
        console.log('⚠️  משתני סביבה חסרים (אופציונלי):');
        missingOptional.forEach(varName => {
            console.log(`   - ${varName}`);
        });
    }

    console.log('✅ כל משתני הסביבה הנדרשים קיימים');
    return true;
};

// הרצת הסקריפט
const run = async () => {
    try {
        console.log('🚀 מתחיל בדיקת הגדרות אימייל...\n');

        // בדיקת משתני סביבה
        if (!checkEnvironmentVariables()) {
            console.log('\n💡 הוסף את המשתנים החסרים לקובץ .env ונסה שוב');
            process.exit(1);
        }

        console.log('');

        // בדיקת חיבור
        const transporter = await testEmailConnection();

        // שליחת אימייל בדיקה
        await sendTestEmail(transporter);

        console.log('\n🎉 בדיקת אימייל הושלמה בהצלחה!');
        console.log('✅ המערכת מוכנה לשליחת קמפיינים');

    } catch (error) {
        console.error('\n❌ בדיקת אימייל נכשלה:', error.message);
        console.log('\n💡 עצות לפתרון:');
        console.log('1. בדוק את הגדרות האימייל ב-.env');
        console.log('2. ודא שהסיסמה נכונה (עבור Gmail, השתמש ב-App Password)');
        console.log('3. בדוק את הגדרות ה-SMTP');
        process.exit(1);
    }
};

// הרצה אם הקובץ נקרא ישירות
if (require.main === module) {
    run();
}

module.exports = {
    createTransporter,
    testEmailConnection,
    sendTestEmail,
    checkEnvironmentVariables
};
