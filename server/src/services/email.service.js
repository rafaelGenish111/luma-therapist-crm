const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const ical = require('ical-generator');
const logger = require('../utils/logger');

/**
 * Email Service
 * שירות לשליחת אימיילים עם תבניות HTML
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.templates = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 5000; // 5 seconds
    }

    /**
     * אתחול transporter
     */
    async init() {
        try {
            this.transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Verify connection
            await this.transporter.verify();
            logger.info('Email service initialized successfully');

            // Load templates (non-blocking)
            try {
                await this.loadTemplates();
            } catch (error) {
                logger.warn('Failed to load email templates:', error.message);
                // Continue without templates - they're optional
            }
        } catch (error) {
            logger.error('Failed to initialize email service:', error);
            throw error;
        }
    }

    /**
     * טעינת תבניות אימייל
     */
    async loadTemplates() {
        const templatesDir = path.join(__dirname, '../templates/emails');
        const templateFiles = [
            'appointmentConfirmation.html',
            'appointmentReminder.html',
            'appointmentCancellation.html',
            'therapistNewBooking.html'
        ];

        for (const templateFile of templateFiles) {
            try {
                const templatePath = path.join(templatesDir, templateFile);
                const templateContent = await fs.readFile(templatePath, 'utf8');
                const template = handlebars.compile(templateContent);
                this.templates.set(templateFile.replace('.html', ''), template);
                logger.info(`Loaded email template: ${templateFile}`);
            } catch (error) {
                logger.error(`Failed to load template ${templateFile}:`, error);
            }
        }
    }

    /**
     * שליחת אימייל אישור פגישה
     */
    async sendAppointmentConfirmation(appointment, client, therapist) {
        try {
            const template = this.templates.get('appointmentConfirmation');
            if (!template) {
                throw new Error('Appointment confirmation template not found');
            }

            // הכנת נתונים לתבנית
            const templateData = {
                client: {
                    firstName: client.firstName,
                    lastName: client.lastName,
                    email: client.email,
                    phone: client.phone
                },
                therapist: {
                    name: therapist.name,
                    email: therapist.email,
                    phone: therapist.phone,
                    primaryColor: therapist.primaryColor || '#2196f3',
                    secondaryColor: therapist.secondaryColor || '#1976d2',
                    logo: therapist.logo,
                    businessAddress: therapist.businessAddress
                },
                appointment: {
                    _id: appointment._id,
                    serviceType: appointment.serviceType,
                    startTimeFormatted: this.formatDate(appointment.startTime, 'he-IL'),
                    timeFormatted: this.formatTime(appointment.startTime, 'he-IL'),
                    duration: appointment.duration,
                    location: appointment.location,
                    meetingUrl: appointment.meetingUrl,
                    notes: appointment.notes,
                    paymentAmount: appointment.paymentAmount,
                    paymentStatus: appointment.paymentStatus,
                    confirmationCode: appointment.confirmationCode
                },
                frontendUrl: process.env.FRONTEND_URL,
                canCancel: this.canCancelAppointment(appointment.startTime)
            };

            // יצירת HTML
            const html = template(templateData);

            // יצירת קובץ ICS
            const icsContent = this.createICSFile(appointment, client, therapist);

            // שליחת אימייל
            const mailOptions = {
                from: `"${therapist.name}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: client.email,
                subject: `אישור פגישה עם ${therapist.name}`,
                html: html,
                attachments: [
                    {
                        filename: `appointment-${appointment.confirmationCode}.ics`,
                        content: icsContent,
                        contentType: 'text/calendar'
                    }
                ]
            };

            const result = await this.sendWithRetry(mailOptions);
            logger.info(`Appointment confirmation email sent to ${client.email}`);
            return result;
        } catch (error) {
            logger.error('Failed to send appointment confirmation email:', error);
            throw error;
        }
    }

    /**
     * שליחת אימייל תזכורת
     */
    async sendAppointmentReminder(appointment, client, therapist, reminderType = '24h') {
        try {
            const template = this.templates.get('appointmentReminder');
            if (!template) {
                throw new Error('Appointment reminder template not found');
            }

            const reminderTypeText = this.getReminderTypeText(reminderType);
            const timeUntilAppointment = this.getTimeUntilAppointment(appointment.startTime);

            const templateData = {
                client: {
                    firstName: client.firstName,
                    lastName: client.lastName
                },
                therapist: {
                    name: therapist.name,
                    email: therapist.email,
                    phone: therapist.phone,
                    primaryColor: therapist.primaryColor || '#2196f3',
                    secondaryColor: therapist.secondaryColor || '#1976d2',
                    logo: therapist.logo,
                    businessAddress: therapist.businessAddress
                },
                appointment: {
                    serviceType: appointment.serviceType,
                    startTimeFormatted: this.formatDate(appointment.startTime, 'he-IL'),
                    timeFormatted: this.formatTime(appointment.startTime, 'he-IL'),
                    duration: appointment.duration,
                    location: appointment.location,
                    meetingUrl: appointment.meetingUrl,
                    notes: appointment.notes,
                    confirmationCode: appointment.confirmationCode
                },
                reminderType: reminderType,
                reminderTypeText: reminderTypeText,
                timeUntilAppointment: timeUntilAppointment,
                frontendUrl: process.env.FRONTEND_URL,
                canCancel: this.canCancelAppointment(appointment.startTime)
            };

            const html = template(templateData);

            const mailOptions = {
                from: `"${therapist.name}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: client.email,
                subject: `תזכורת: פגישה ${reminderTypeText} עם ${therapist.name}`,
                html: html
            };

            const result = await this.sendWithRetry(mailOptions);
            logger.info(`Appointment reminder email sent to ${client.email} (${reminderType})`);
            return result;
        } catch (error) {
            logger.error('Failed to send appointment reminder email:', error);
            throw error;
        }
    }

    /**
     * שליחת אימייל ביטול פגישה
     */
    async sendCancellationEmail(appointment, client, therapist, reason) {
        try {
            const template = this.templates.get('appointmentCancellation');
            if (!template) {
                throw new Error('Appointment cancellation template not found');
            }

            const refundInfo = this.calculateRefundInfo(appointment);

            const templateData = {
                client: {
                    firstName: client.firstName,
                    lastName: client.lastName
                },
                therapist: {
                    name: therapist.name,
                    email: therapist.email,
                    phone: therapist.phone,
                    primaryColor: therapist.primaryColor || '#2196f3',
                    secondaryColor: therapist.secondaryColor || '#1976d2',
                    logo: therapist.logo,
                    businessAddress: therapist.businessAddress,
                    id: therapist._id
                },
                appointment: {
                    serviceType: appointment.serviceType,
                    startTimeFormatted: this.formatDate(appointment.startTime, 'he-IL'),
                    timeFormatted: this.formatTime(appointment.startTime, 'he-IL'),
                    duration: appointment.duration,
                    paymentAmount: appointment.paymentAmount,
                    cancellationReason: reason
                },
                refundInfo: refundInfo,
                frontendUrl: process.env.FRONTEND_URL
            };

            const html = template(templateData);

            const mailOptions = {
                from: `"${therapist.name}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: client.email,
                subject: `ביטול פגישה - ${this.formatDate(appointment.startTime, 'he-IL')}`,
                html: html
            };

            const result = await this.sendWithRetry(mailOptions);
            logger.info(`Appointment cancellation email sent to ${client.email}`);
            return result;
        } catch (error) {
            logger.error('Failed to send cancellation email:', error);
            throw error;
        }
    }

    /**
     * שליחת התראה למטפלת
     */
    async sendTherapistNotification(appointment, client, therapist, notificationType = 'new_booking') {
        try {
            const template = this.templates.get('therapistNewBooking');
            if (!template) {
                throw new Error('Therapist notification template not found');
            }

            const notificationTypeText = this.getNotificationTypeText(notificationType);

            const templateData = {
                client: {
                    firstName: client.firstName,
                    lastName: client.lastName,
                    email: client.email,
                    phone: client.phone,
                    isGuest: client.isGuest
                },
                therapist: {
                    name: therapist.name,
                    email: therapist.email,
                    phone: therapist.phone,
                    primaryColor: therapist.primaryColor || '#2196f3',
                    secondaryColor: therapist.secondaryColor || '#1976d2',
                    logo: therapist.logo,
                    businessAddress: therapist.businessAddress,
                    id: therapist._id
                },
                appointment: {
                    _id: appointment._id,
                    serviceType: appointment.serviceType,
                    startTimeFormatted: this.formatDate(appointment.startTime, 'he-IL'),
                    timeFormatted: this.formatTime(appointment.startTime, 'he-IL'),
                    duration: appointment.duration,
                    location: appointment.location,
                    paymentAmount: appointment.paymentAmount,
                    status: appointment.status,
                    notes: appointment.notes,
                    confirmationCode: appointment.confirmationCode
                },
                notificationType: notificationType,
                notificationTypeText: notificationTypeText,
                dashboardUrl: process.env.DASHBOARD_URL || process.env.FRONTEND_URL
            };

            const html = template(templateData);

            const mailOptions = {
                from: `"Luma CRM" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: therapist.email,
                subject: `${notificationTypeText} - ${client.firstName} ${client.lastName}`,
                html: html
            };

            const result = await this.sendWithRetry(mailOptions);
            logger.info(`Therapist notification email sent to ${therapist.email} (${notificationType})`);
            return result;
        } catch (error) {
            logger.error('Failed to send therapist notification email:', error);
            throw error;
        }
    }

    /**
     * שליחת SMS תזכורת (placeholder)
     */
    async sendReminderSMS(appointment, client) {
        try {
            // TODO: Implement Twilio integration
            const smsText = this.buildSMSText(appointment);
            
            // Placeholder for SMS sending
            logger.info(`SMS reminder would be sent to ${client.phone}: ${smsText}`);
            
            return {
                success: true,
                message: 'SMS reminder sent successfully',
                messageId: `sms_${Date.now()}`
            };
        } catch (error) {
            logger.error('Failed to send SMS reminder:', error);
            throw error;
        }
    }

    /**
     * יצירת קובץ ICS
     */
    createICSFile(appointment, client, therapist) {
        try {
            const cal = ical({
                domain: process.env.DOMAIN || 'luma-crm.com',
                name: `פגישה עם ${therapist.name}`,
                timezone: therapist.timezone || 'Asia/Jerusalem'
            });

            const event = cal.createEvent({
                start: appointment.startTime,
                end: appointment.endTime,
                summary: `${appointment.serviceType} עם ${therapist.name}`,
                description: appointment.notes || `פגישה עם ${therapist.name}`,
                location: appointment.location === 'online' ? 'מפגש מקוון' : appointment.location,
                url: appointment.meetingUrl,
                organizer: {
                    name: therapist.name,
                    email: therapist.email
                },
                attendees: [{
                    name: `${client.firstName} ${client.lastName}`,
                    email: client.email
                }]
            });

            return cal.toString();
        } catch (error) {
            logger.error('Failed to create ICS file:', error);
            throw error;
        }
    }

    /**
     * החלפת placeholders בתבנית
     */
    replaceTemplatePlaceholders(template, data) {
        try {
            const compiledTemplate = handlebars.compile(template);
            return compiledTemplate(data);
        } catch (error) {
            logger.error('Failed to replace template placeholders:', error);
            throw error;
        }
    }

    /**
     * שליחת אימייל עם retry logic
     */
    async sendWithRetry(mailOptions, attempt = 1) {
        try {
            const result = await this.transporter.sendMail(mailOptions);
            return result;
        } catch (error) {
            if (attempt < this.retryAttempts) {
                logger.warn(`Email send attempt ${attempt} failed, retrying in ${this.retryDelay}ms:`, error.message);
                await this.delay(this.retryDelay);
                return this.sendWithRetry(mailOptions, attempt + 1);
            } else {
                logger.error(`Email send failed after ${this.retryAttempts} attempts:`, error);
                throw error;
            }
        }
    }

    // Helper methods

    formatDate(date, locale = 'he-IL') {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    }

    formatTime(date, locale = 'he-IL') {
        return new Date(date).toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    canCancelAppointment(startTime) {
        const appointmentDate = new Date(startTime);
        const now = new Date();
        const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
        return hoursUntilAppointment > 24;
    }

    getReminderTypeText(reminderType) {
        switch (reminderType) {
            case '24h':
                return 'מחר';
            case '1h':
                return 'בעוד שעה';
            case 'custom':
                return 'תזכורת מותאמת אישית';
            default:
                return 'תזכורת';
        }
    }

    getNotificationTypeText(notificationType) {
        switch (notificationType) {
            case 'new_booking':
                return 'פגישה חדשה נקבעה';
            case 'cancellation':
                return 'פגישה בוטלה';
            case 'reschedule':
                return 'פגישה שונתה';
            default:
                return 'התראה';
        }
    }

    getTimeUntilAppointment(startTime) {
        const appointmentDate = new Date(startTime);
        const now = new Date();
        const diffMs = appointmentDate - now;
        
        if (diffMs <= 0) {
            return 'הפגישה כבר התחילה';
        }

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours} שעות ו-${minutes} דקות`;
        } else {
            return `${minutes} דקות`;
        }
    }

    calculateRefundInfo(appointment) {
        const appointmentDate = new Date(appointment.startTime);
        const now = new Date();
        const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);

        // מדיניות החזר פשוטה - החזר מלא אם יותר מ-24 שעות
        if (hoursUntilAppointment > 24) {
            return {
                eligible: true,
                amount: appointment.paymentAmount,
                processingTime: '3-5 ימי עסקים',
                method: 'אותו אמצעי תשלום',
                instructions: 'ההחזר יתבצע אוטומטית'
            };
        } else {
            return {
                eligible: false,
                reason: 'ביטול פחות מ-24 שעות לפני הפגישה'
            };
        }
    }

    buildSMSText(appointment) {
        const therapistName = appointment.therapist?.name || 'המטפלת';
        const date = this.formatDate(appointment.startTime, 'he-IL');
        const time = this.formatTime(appointment.startTime, 'he-IL');
        
        return `תזכורת: פגישה עם ${therapistName} מחר ב-${time}. קוד אישור: ${appointment.confirmationCode}`;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new EmailService();
