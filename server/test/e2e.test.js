const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app'); // נצטרך ליצור קובץ app נפרד
const mongoose = require('mongoose');

describe('E2E Tests - Complete Payment Flow', () => {
    let authToken;
    let clientId;
    let appointmentId;
    let paymentId;

    before(async () => {
        // התחברות למסד הנתונים
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-test');

        // יצירת משתמש מטפלת לבדיקות
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@therapist.com',
                password: 'test123'
            });

        authToken = loginResponse.body.token;
    });

    after(async () => {
        // ניקוי נתונים
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    describe('Complete Payment Flow', () => {
        it('should create appointment, mark as completed, create payment, and generate invoice', async () => {
            // Step 1: יצירת לקוח
            const clientResponse = await request(app)
                .post('/api/clients')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    firstName: 'יוסי',
                    lastName: 'כהן',
                    email: 'yossi@test.com',
                    phone: '050-1234567',
                    nationalId: '123456789'
                });

            expect(clientResponse.status).to.equal(201);
            clientId = clientResponse.body.data._id;

            // Step 2: יצירת פגישה
            const appointmentResponse = await request(app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    clientId,
                    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // מחר
                    time: '10:00',
                    duration: 60,
                    type: 'therapy',
                    notes: 'פגישה ראשונה'
                });

            expect(appointmentResponse.status).to.equal(201);
            appointmentId = appointmentResponse.body.data._id;

            // Step 3: סימון פגישה כ"הושלמה"
            const completeResponse = await request(app)
                .patch(`/api/appointments/${appointmentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    status: 'completed',
                    notes: 'פגישה הושלמה בהצלחה'
                });

            expect(completeResponse.status).to.equal(200);
            expect(completeResponse.body.data.status).to.equal('completed');

            // Step 4: יצירת תשלום "simulated"
            const paymentResponse = await request(app)
                .post(`/api/clients/${clientId}/payments`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    appointmentId,
                    amount: 200,
                    currency: 'ILS',
                    method: 'simulated',
                    description: 'תשלום פגישה'
                });

            expect(paymentResponse.status).to.equal(201);
            expect(paymentResponse.body.success).to.be.true;
            paymentId = paymentResponse.body.payment._id;

            // Step 5: יצירת חשבונית "מדומה"
            const invoiceResponse = await request(app)
                .post(`/api/payments/${paymentId}/invoice`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(invoiceResponse.status).to.equal(200);
            expect(invoiceResponse.body.success).to.be.true;
            expect(invoiceResponse.body.invoiceId).to.exist;
            expect(invoiceResponse.body.invoiceUrl).to.exist;

            // Step 6: בדיקה שהתשלום מופיע בכרטיס הלקוח
            const clientPaymentsResponse = await request(app)
                .get(`/api/clients/${clientId}/payments`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(clientPaymentsResponse.status).to.equal(200);
            expect(clientPaymentsResponse.body.success).to.be.true;
            expect(clientPaymentsResponse.body.payments).to.be.an('array');
            expect(clientPaymentsResponse.body.payments).to.have.length(1);
            expect(clientPaymentsResponse.body.payments[0]._id).to.equal(paymentId);
            expect(clientPaymentsResponse.body.payments[0].status).to.equal('paid');
        });
    });

    describe('Payment Statistics', () => {
        it('should return correct payment statistics', async () => {
            const statsResponse = await request(app)
                .get('/api/payments/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(statsResponse.status).to.equal(200);
            expect(statsResponse.body.success).to.be.true;
            expect(statsResponse.body.stats).to.have.property('total');
            expect(statsResponse.body.stats).to.have.property('paid');
            expect(statsResponse.body.stats).to.have.property('paidAmount');
            expect(statsResponse.body.stats.paid).to.be.at.least(1);
            expect(statsResponse.body.stats.paidAmount).to.be.at.least(200);
        });
    });

    describe('Webhook Integration', () => {
        it('should trigger webhook when payment is created', async () => {
            // יצירת תשלום נוסף לבדיקת webhook
            const paymentResponse = await request(app)
                .post(`/api/clients/${clientId}/payments`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    amount: 150,
                    currency: 'ILS',
                    method: 'simulated',
                    description: 'תשלום נוסף לבדיקת webhook'
                });

            expect(paymentResponse.status).to.equal(201);

            // בדיקה שה-webhook נקרא (במקרה שלנו זה רק log)
            // בעתיד נוכל לבדוק שה-webhook נשלח ל-n8n
        });
    });
});

describe('E2E Tests - Communication Flow', () => {
    let authToken;
    let clientId;

    before(async () => {
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@therapist.com',
                password: 'test123'
            });

        authToken = loginResponse.body.token;
    });

    it('should send communication and log it', async () => {
        // יצירת לקוח
        const clientResponse = await request(app)
            .post('/api/clients')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                firstName: 'שרה',
                lastName: 'לוי',
                email: 'sara@test.com',
                phone: '050-9876543'
            });

        expect(clientResponse.status).to.equal(201);
        clientId = clientResponse.body.data._id;

        // שליחת הודעה
        const communicationResponse = await request(app)
            .post(`/api/clients/${clientId}/communications`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                channel: 'email',
                subject: 'תזכורת לפגישה',
                body: 'שלום שרה, תזכורת לפגישה מחר בשעה 10:00'
            });

        expect(communicationResponse.status).to.equal(201);
        expect(communicationResponse.body.success).to.be.true;

        // בדיקת היסטוריית התקשורת
        const historyResponse = await request(app)
            .get(`/api/clients/${clientId}/communications`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(historyResponse.status).to.equal(200);
        expect(historyResponse.body.success).to.be.true;
        expect(historyResponse.body.communications).to.be.an('array');
        expect(historyResponse.body.communications).to.have.length(1);
        expect(historyResponse.body.communications[0].channel).to.equal('email');
        expect(historyResponse.body.communications[0].subject).to.equal('תזכורת לפגישה');
    });
});


