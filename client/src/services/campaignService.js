// client/src/services/campaignService.js
import api from './api';

class CampaignService {
    // קבלת כל הקמפיינים
    async getAll(params = {}) {
        const searchParams = new URLSearchParams();
        
        if (params.status) searchParams.append('status', params.status);
        if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
        if (params.dateTo) searchParams.append('dateTo', params.dateTo);
        if (params.page) searchParams.append('page', params.page);
        if (params.limit) searchParams.append('limit', params.limit);

        const url = `/campaigns${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return await api.get(url);
    }

    // קבלת קמפיין ספציפי
    async getById(id) {
        return await api.get(`/campaigns/${id}`);
    }

    // יצירת קמפיין חדש
    async create(campaignData) {
        return await api.post('/campaigns', campaignData);
    }

    // עדכון קמפיין
    async update(id, campaignData) {
        return await api.put(`/campaigns/${id}`, campaignData);
    }

    // מחיקת קמפיין
    async delete(id) {
        return await api.delete(`/campaigns/${id}`);
    }

    // שליחת קמפיין
    async send(id) {
        return await api.post(`/campaigns/${id}/send`);
    }

    // קבלת סטטיסטיקות קמפיין
    async getStats(id) {
        return await api.get(`/campaigns/${id}/stats`);
    }

    // Templates Management
    
    // קבלת תבניות אימייל
    async getTemplates(category = null) {
        const url = category 
            ? `/campaigns/templates/list?category=${category}`
            : '/campaigns/templates/list';
        return await api.get(url);
    }

    // יצירת תבנית חדשה
    async createTemplate(templateData) {
        return await api.post('/campaigns/templates', templateData);
    }

    // עדכון תבנית
    async updateTemplate(id, templateData) {
        return await api.put(`/campaigns/templates/${id}`, templateData);
    }

    // מחיקת תבנית
    async deleteTemplate(id) {
        return await api.delete(`/campaigns/templates/${id}`);
    }

    // Client Lists Management
    
    // קבלת רשימת לקוחות עם פילטרים
    async getClientLists(filters = {}) {
        const searchParams = new URLSearchParams();
        
        if (filters.search) searchParams.append('search', filters.search);
        if (filters.hasEmail) searchParams.append('hasEmail', filters.hasEmail);
        if (filters.lastTreatment) searchParams.append('lastTreatment', filters.lastTreatment);
        if (filters.tags) searchParams.append('tags', filters.tags);

        const url = `/campaigns/client-lists/all${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return await api.get(url);
    }

    // ייצוא רשימת לקוחות
    async exportClientList(clientIds = [], format = 'csv') {
        return await api.post('/campaigns/client-lists/export', {
            clientIds,
            format
        });
    }

    // יבוא רשימת לקוחות
    async importClientList(file, format = 'csv') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('format', format);

        return await api.post('/campaigns/client-lists/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }

    // Utility Functions
    
    // בדיקת תקינות תוכן המייל
    validateEmailContent(content) {
        const errors = [];
        
        if (!content.trim()) {
            errors.push('תוכן המייל לא יכול להיות רק');
        }
        
        if (content.length > 50000) {
            errors.push('תוכן המייל ארוך מדי (מקסימום 50,000 תווים)');
        }
        
        // בדיקת משתנים תקינים
        const variables = content.match(/\{\{([^}]+)\}\}/g) || [];
        const validVariables = ['firstName', 'lastName', 'fullName', 'email', 'phone', 'currentDate'];
        
        variables.forEach(variable => {
            const varName = variable.replace(/[{}]/g, '');
            if (!validVariables.includes(varName)) {
                errors.push(`משתנה לא תקין: ${variable}`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // תצוגה מקדימה של תוכן מותאם אישית
    previewPersonalizedContent(content, sampleClient = null) {
        const defaultClient = {
            firstName: 'שם פרטי לדוגמה',
            lastName: 'שם משפחה לדוגמה',
            email: 'example@email.com',
            phone: '050-1234567'
        };
        
        const client = sampleClient || defaultClient;
        
        return content
            .replace(/\{\{firstName\}\}/g, client.firstName || '')
            .replace(/\{\{lastName\}\}/g, client.lastName || '')
            .replace(/\{\{fullName\}\}/g, `${client.firstName} ${client.lastName}`.trim())
            .replace(/\{\{email\}\}/g, client.email || '')
            .replace(/\{\{phone\}\}/g, client.phone || '')
            .replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString('he-IL'));
    }

    // חישוב הערכת זמן שליחה
    estimateSendTime(recipientCount) {
        // הערכה של 5 מיילים בשנייה
        const emailsPerSecond = 5;
        const estimatedSeconds = Math.ceil(recipientCount / emailsPerSecond);
        
        if (estimatedSeconds < 60) {
            return `כ-${estimatedSeconds} שניות`;
        } else if (estimatedSeconds < 3600) {
            const minutes = Math.ceil(estimatedSeconds / 60);
            return `כ-${minutes} דקות`;
        } else {
            const hours = Math.ceil(estimatedSeconds / 3600);
            return `כ-${hours} שעות`;
        }
    }

    // יצירת לינק מעקב
    createTrackingLink(originalUrl, campaignId, clientId) {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const encodedUrl = encodeURIComponent(originalUrl);
        return `${baseUrl}/campaigns/tracking/click/${campaignId}/${clientId}?url=${encodedUrl}`;
    }

    // תבניות מוכנות
    getDefaultTemplates() {
        return [
            {
                name: 'ברכת יום הולדת',
                category: 'birthday',
                subject: 'יום הולדת שמח {{firstName}}! 🎉',
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
                        <h2 style="color: #0BB5CF; text-align: center;">יום הולדת שמח!</h2>
                        <p>שלום {{firstName}},</p>
                        <p>אנחנו רוצים לאחל לך יום הולדת שמח ומלא בריאות ואושר!</p>
                        <p>תודה שאת חלק מהמשפחה שלנו.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background: linear-gradient(145deg, #0BB5CF, #19C7DC); color: white; padding: 15px 30px; border-radius: 25px; display: inline-block;">
                                🎂 יום הולדת שמח! 🎂
                            </div>
                        </div>
                        <p>בברכה,<br>הצוות שלנו</p>
                    </div>
                `
            },
            {
                name: 'תזכורת לפגישה',
                category: 'reminder',
                subject: 'תזכורת לפגישה מחר - {{firstName}}',
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
                        <h2 style="color: #0BB5CF;">תזכורת לפגישה</h2>
                        <p>שלום {{firstName}},</p>
                        <p>רצינו להזכיר לך שיש לך פגישה מחר אצלנו.</p>
                        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <strong>פרטי הפגישה:</strong><br>
                            תאריך: מחר<br>
                            זמן: [הזמן יופיע כאן]<br>
                            כתובת: [הכתובת שלך]
                        </div>
                        <p>במידה ואת צריכה לדחות או לבטל, אנא צרי קשר מראש.</p>
                        <p>נתראה מחר!</p>
                        <p>בברכה,<br>הצוות שלנו</p>
                    </div>
                `
            },
            {
                name: 'ברכת חג',
                category: 'holiday',
                subject: 'ברכות לחג - {{firstName}}',
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
                        <h2 style="color: #0BB5CF; text-align: center;">ברכות לחג!</h2>
                        <p>שלום {{firstName}},</p>
                        <p>אנחנו רוצים לאחל לך חג שמח ומלא בריאות, אושר ואהבה עם המשפחה והחברים.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background: linear-gradient(145deg, #0BB5CF, #19C7DC); color: white; padding: 20px; border-radius: 15px;">
                                ✨ חג שמח! ✨
                            </div>
                        </div>
                        <p>תודה שאת חלק מהקהילה שלנו.</p>
                        <p>בברכות החג,<br>הצוות שלנו</p>
                    </div>
                `
            },
            {
                name: 'הודעת עדכון כללית',
                category: 'general',
                subject: 'עדכון חשוב - {{firstName}}',
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
                        <h2 style="color: #0BB5CF;">עדכון חשוב</h2>
                        <p>שלום {{firstName}},</p>
                        <p>רצינו לעדכן אותך על [נושא העדכון].</p>
                        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #0BB5CF;">
                            <strong>מה חדש:</strong><br>
                            [כאן יופיע תוכן העדכון]
                        </div>
                        <p>לשאלות נוספות, אנו כאן בשבילך.</p>
                        <p>בברכה,<br>הצוות שלנו</p>
                    </div>
                `
            },
            {
                name: 'מעקב אחרי טיפול',
                category: 'followup',
                subject: 'איך את מרגישה אחרי הטיפול? - {{firstName}}',
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
                        <h2 style="color: #0BB5CF;">איך את מרגישה?</h2>
                        <p>שלום {{firstName}},</p>
                        <p>רצינו לבדוק איך את מרגישה אחרי הטיפול האחרון שלך.</p>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>כמה שאלות קצרות:</strong></p>
                            <ul>
                                <li>איך את מרגישה באופן כללי?</li>
                                <li>האם יש שיפור בבעיה שלשמה הגעת?</li>
                                <li>האם יש משהו שמפריע או מטריד אותך?</li>
                            </ul>
                        </div>
                        <p>את יכולה לחזור אלי בטלפון או במייל, או לקבוע פגישת המשך.</p>
                        <p>חשוב לי לדעת שאת מרגישה טוב!</p>
                        <p>בברכה,<br>[השם שלך]</p>
                    </div>
                `
            }
        ];
    }

    // קבלת הצעות לשיפור קמפיין
    getCampaignSuggestions(campaignStats) {
        const suggestions = [];
        
        if (campaignStats.openRate < 20) {
            suggestions.push({
                type: 'warning',
                message: 'שיעור הפתיחה נמוך - נסי לשפר את נושא המייל',
                action: 'שנה נושא המייל להיות יותר מעניין וקצר'
            });
        }
        
        if (campaignStats.clickRate < 5) {
            suggestions.push({
                type: 'info',
                message: 'שיעור הקליקים נמוך - הוסיפי יותר קישורים וקריאות לפעולה',
                action: 'הוסיפי כפתורים בולטים וקריאות לפעולה ברורות'
            });
        }
        
        if (campaignStats.bounced > campaignStats.sent * 0.05) {
            suggestions.push({
                type: 'error',
                message: 'שיעור גבוה של מיילים שלא הגיעו ליעדם',
                action: 'בדקי ועדכני כתובות מייל לא תקינות ברשימת הלקוחות'
            });
        }
        
        return suggestions;
    }
}

export default new CampaignService();