const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
    constructor() {
        this.transporter = null;
        this.templates = {};
        this.init().catch(err => {
            console.error('Failed to initialize email service in constructor:', err);
        });
    }

    /**
     * Initialize email service based on environment
     */
    async init() {
        try {
            if (process.env.SENDGRID_API_KEY) {
                // Use SendGrid
                this.transporter = nodemailer.createTransport({
                    service: 'SendGrid',
                    auth: {
                        user: 'apikey',
                        pass: process.env.SENDGRID_API_KEY
                    }
                });
            } else if (process.env.MAILGUN_API_KEY) {
                // Use Mailgun
                this.transporter = nodemailer.createTransport({
                    host: `smtp.mailgun.org`,
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.MAILGUN_DOMAIN,
                        pass: process.env.MAILGUN_API_KEY
                    }
                });
            } else {
                // Use Gmail SMTP
                this.transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                    port: process.env.EMAIL_PORT || 587,
                    secure: false,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });
            }

            // Load email templates (non-blocking)
            try {
                await this.loadTemplates();
            } catch (templateError) {
                console.warn('Failed to load email templates:', templateError.message);
                // Continue without templates
            }

            console.log('Email service initialized successfully');
        } catch (error) {
            console.error('Email service initialization error:', error);
        }
    }

    /**
     * Load email templates from templates directory
     */
    async loadTemplates() {
        try {
            const templatesDir = path.join(__dirname, '../templates/emails');

            // Default templates if directory doesn't exist
            this.templates = {
                emailVerification: this.getDefaultEmailVerificationTemplate(),
                passwordReset: this.getDefaultPasswordResetTemplate(),
                welcome: this.getDefaultWelcomeTemplate(),
                appointmentConfirmation: this.getDefaultAppointmentTemplate(),
                appointmentReminder: this.getDefaultReminderTemplate()
            };

            // Try to load custom templates if they exist
            try {
                const files = await fs.readdir(templatesDir);

                for (const file of files) {
                    if (file.endsWith('.hbs')) {
                        const templateName = file.replace('.hbs', '');
                        const templatePath = path.join(templatesDir, file);
                        const templateContent = await fs.readFile(templatePath, 'utf8');
                        this.templates[templateName] = handlebars.compile(templateContent);
                    }
                }
            } catch (error) {
                console.log('Using default email templates');
            }
        } catch (error) {
            console.error('Error loading email templates:', error);
        }
    }

    /**
     * Send email
     */
    async sendEmail({ email, subject, template, data, html, text }) {
        try {
            if (!this.transporter) {
                throw new Error('Email service not initialized');
            }

            let htmlContent = html;
            let textContent = text;

            // Use template if provided
            if (template && this.templates[template]) {
                const templateData = {
                    ...data,
                    platformName: process.env.PLATFORM_NAME || 'Wellness Platform',
                    supportEmail: process.env.SUPPORT_EMAIL || 'support@wellness-platform.com',
                    currentYear: new Date().getFullYear()
                };

                htmlContent = this.templates[template](templateData);
                textContent = this.stripHtml(htmlContent);
            }

            const mailOptions = {
                from: process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || process.env.MAILGUN_FROM_EMAIL,
                to: email,
                subject: subject,
                html: htmlContent,
                text: textContent
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent successfully to ${email}`);
            return result;

        } catch (error) {
            console.error('Email sending error:', error);
            throw error;
        }
    }

    /**
     * Strip HTML tags for text version
     */
    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '');
    }

    /**
     * Default email verification template
     */
    getDefaultEmailVerificationTemplate() {
        const template = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>אימות כתובת אימייל</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{platformName}}</h1>
            <p>אימות כתובת אימייל</p>
        </div>
        <div class="content">
            <h2>שלום {{name}},</h2>
            <p>תודה שנרשמת ל-{{platformName}}!</p>
            <p>כדי להשלים את ההרשמה, אנא לחץ על הכפתור למטה לאימות כתובת האימייל שלך:</p>
            
            <div style="text-align: center;">
                <a href="{{verificationUrl}}" class="button">אימות כתובת אימייל</a>
            </div>
            
            <p>אם הכפתור לא עובד, העתק והדבק את הקישור הבא בדפדפן שלך:</p>
            <p style="word-break: break-all; color: #667eea;">{{verificationUrl}}</p>
            
            <p>הקישור תקף למשך 24 שעות.</p>
            
            <p>אם לא יצרת חשבון ב-{{platformName}}, אנא התעלם מהודעה זו.</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{platformName}}. כל הזכויות שמורות.</p>
            <p>לשאלות ותמיכה: <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
        </div>
    </div>
</body>
</html>`;

        return handlebars.compile(template);
    }

    /**
     * Default password reset template
     */
    getDefaultPasswordResetTemplate() {
        const template = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>איפוס סיסמה</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{platformName}}</h1>
            <p>איפוס סיסמה</p>
        </div>
        <div class="content">
            <h2>שלום {{name}},</h2>
            <p>קיבלנו בקשה לאיפוס הסיסמה שלך ב-{{platformName}}.</p>
            
            <div style="text-align: center;">
                <a href="{{resetUrl}}" class="button">איפוס סיסמה</a>
            </div>
            
            <p>אם הכפתור לא עובד, העתק והדבק את הקישור הבא בדפדפן שלך:</p>
            <p style="word-break: break-all; color: #667eea;">{{resetUrl}}</p>
            
            <div class="warning">
                <strong>חשוב:</strong> הקישור תקף למשך שעה אחת בלבד. אם לא ביקשת איפוס סיסמה, אנא התעלם מהודעה זו.
            </div>
            
            <p>אם יש לך שאלות, אל תהסס ליצור איתנו קשר.</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{platformName}}. כל הזכויות שמורות.</p>
            <p>לשאלות ותמיכה: <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
        </div>
    </div>
</body>
</html>`;

        return handlebars.compile(template);
    }

    /**
     * Default welcome template
     */
    getDefaultWelcomeTemplate() {
        const template = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ברוכים הבאים</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{platformName}}</h1>
            <p>ברוכים הבאים!</p>
        </div>
        <div class="content">
            <h2>שלום {{name}},</h2>
            <p>ברוכים הבאים ל-{{platformName}}!</p>
            <p>אנחנו שמחים שהצטרפת לקהילה שלנו. כאן תוכל למצוא את כל הכלים והשירותים שאתה צריך.</p>
            
            <div style="text-align: center;">
                <a href="{{loginUrl}}" class="button">התחבר לחשבון שלך</a>
            </div>
            
            <p>אם יש לך שאלות או זקוק לעזרה, אל תהסס ליצור איתנו קשר.</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{platformName}}. כל הזכויות שמורות.</p>
            <p>לשאלות ותמיכה: <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
        </div>
    </div>
</body>
</html>`;

        return handlebars.compile(template);
    }

    /**
     * Default appointment confirmation template
     */
    getDefaultAppointmentTemplate() {
        const template = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>אישור פגישה</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .appointment-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{platformName}}</h1>
            <p>אישור פגישה</p>
        </div>
        <div class="content">
            <h2>שלום {{clientName}},</h2>
            <p>הפגישה שלך אושרה בהצלחה!</p>
            
            <div class="appointment-details">
                <h3>פרטי הפגישה:</h3>
                <p><strong>תאריך:</strong> {{appointmentDate}}</p>
                <p><strong>שעה:</strong> {{appointmentTime}}</p>
                <p><strong>מטפל/ת:</strong> {{therapistName}}</p>
                <p><strong>סוג טיפול:</strong> {{treatmentType}}</p>
                <p><strong>משך:</strong> {{duration}} דקות</p>
                <p><strong>מחיר:</strong> ₪{{price}}</p>
            </div>
            
            <p>אם יש לך שאלות או צריך לבטל/לשנות את הפגישה, אנא צור קשר עם המטפל/ת.</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{platformName}}. כל הזכויות שמורות.</p>
            <p>לשאלות ותמיכה: <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
        </div>
    </div>
</body>
</html>`;

        return handlebars.compile(template);
    }

    /**
     * Send OTP email
     */
    async sendOtpEmail(email, code, context = 'אימות') {
        const subject = `קוד ${context} - ${process.env.PLATFORM_NAME || 'Wellness Platform'}`;

        const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>קוד ${context}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-code { 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0; 
            text-align: center; 
            border: 2px solid #667eea;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 3px;
            color: #667eea;
        }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${process.env.PLATFORM_NAME || 'Wellness Platform'}</h1>
            <p>קוד ${context}</p>
        </div>
        <div class="content">
            <h2>קוד ${context} שלך:</h2>
            
            <div class="otp-code">
                ${code}
            </div>
            
            <div class="warning">
                <p><strong>חשוב:</strong></p>
                <ul>
                    <li>הקוד תקף למשך 10 דקות בלבד</li>
                    <li>אל תשתף את הקוד עם אף אחד</li>
                    <li>אם לא ביקשת את הקוד, התעלם מההודעה</li>
                </ul>
            </div>
            
            <p>שימו לב: מדובר בקוד אבטחה לחתימה דיגיטלית. אנא וודאו שאתם נמצאים באתר הרשמי לפני הזנת הקוד.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.PLATFORM_NAME || 'Wellness Platform'}. כל הזכויות שמורות.</p>
            <p>לשאלות ותמיכה: <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@wellness-platform.com'}">${process.env.SUPPORT_EMAIL || 'support@wellness-platform.com'}</a></p>
        </div>
    </div>
</body>
</html>`;

        return this.sendEmail({
            email,
            subject,
            html,
            text: `קוד ${context} שלך: ${code}\n\nהקוד תקף למשך 10 דקות בלבד.\nאל תשתף את הקוד עם אף אחד.\n\nאם לא ביקשת את הקוד, התעלם מההודעה.`
        });
    }

    /**
     * Default appointment reminder template
     */
    getDefaultReminderTemplate() {
        const template = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>תזכורת פגישה</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .appointment-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
        .reminder { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{platformName}}</h1>
            <p>תזכורת פגישה</p>
        </div>
        <div class="content">
            <h2>שלום {{clientName}},</h2>
            <p>זוהי תזכורת לפגישה שלך מחר:</p>
            
            <div class="appointment-details">
                <h3>פרטי הפגישה:</h3>
                <p><strong>תאריך:</strong> {{appointmentDate}}</p>
                <p><strong>שעה:</strong> {{appointmentTime}}</p>
                <p><strong>מטפל/ת:</strong> {{therapistName}}</p>
                <p><strong>סוג טיפול:</strong> {{treatmentType}}</p>
                <p><strong>כתובת:</strong> {{location}}</p>
            </div>
            
            <div class="reminder">
                <strong>תזכורת:</strong> אנא הגיעו 10 דקות לפני תחילת הפגישה.
            </div>
            
            <p>אם יש לך שאלות או צריך לבטל/לשנות את הפגישה, אנא צור קשר עם המטפל/ת.</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{platformName}}. כל הזכויות שמורות.</p>
            <p>לשאלות ותמיכה: <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
        </div>
    </div>
</body>
</html>`;

        return handlebars.compile(template);
    }
}

// Create singleton instance
const emailService = new EmailService();

// Export both the class and the instance
module.exports = emailService;
module.exports.EmailService = EmailService; 