const Charge = require('../models/Charge');
const Package = require('../models/Package');

function calculateAmountFromLineItems(lineItems) {
    return (lineItems || []).reduce((sum, item) => sum + (item.qty || 0) * (item.unitPrice || 0), 0);
}

async function ensureChargeForAppointment(appointment) {
    if (!appointment) return null;

    const therapistId = appointment.therapist;
    const clientId = appointment.client;

    // אם POLICY הוא PACKAGE ננסה לחייב חבילה
    if (appointment.billingPolicy === 'PACKAGE' && appointment.packageId) {
        const pkg = await Package.findById(appointment.packageId);
        if (pkg && pkg.remainingSessions > 0 && pkg.status === 'ACTIVE') {
            pkg.sessionsUsed = (pkg.sessionsUsed || 0) + 1;
            await pkg.save();
            // מסמנים שהפגישה סגורה מבחינה כספית
            appointment.paymentStatus = 'PAID';
            await appointment.save();
            return null;
        }
    }

    // בונים/מעדכנים חיוב
    const existingCharge = appointment.chargeId ? await Charge.findById(appointment.chargeId) : null;
    const lineItems = [{ type: 'SESSION', qty: 1, unitPrice: appointment.price || 0, note: 'טיפול' }];

    const amount = calculateAmountFromLineItems(lineItems);

    // קביעת סטטוס בלי הורדה סטטוס של חיוב קיים
    let status;
    if (appointment.status === 'cancelled') {
        status = existingCharge?.status || 'CANCELED';
        // אם קיימת מדיניות קנס, ניתן לשנות בהמשך; כרגע משאירים
    } else if (existingCharge?.status && ['PAID', 'WRITEOFF', 'REFUNDED', 'CANCELED'].includes(existingCharge.status)) {
        status = existingCharge.status; // לא מורידים סטטוס
    } else if ((existingCharge?.paidAmount || 0) >= amount) {
        status = 'PAID';
    } else if ((existingCharge?.paidAmount || 0) > 0) {
        status = 'PARTIALLY_PAID';
    } else {
        status = 'PENDING';
    }

    const payload = {
        therapistId,
        clientId,
        appointmentId: appointment._id,
        lineItems,
        amount,
        currency: appointment.currency || 'ILS',
        status
    };

    let charge;
    if (existingCharge) {
        // שמור paidAmount ואל תשכתב אם לא נדרש
        const preservedPaidAmount = existingCharge.paidAmount || 0;
        existingCharge.set(payload);
        existingCharge.paidAmount = preservedPaidAmount;
        existingCharge.audit.push({ action: 'UPDATED_FROM_APPOINTMENT' });
        charge = await existingCharge.save();
    } else {
        charge = await Charge.create({ ...payload, audit: [{ action: 'CREATED_FROM_APPOINTMENT' }] });
        appointment.chargeId = charge._id;
        await appointment.save();
    }

    // עדכון סטטוס תשלום בפגישה לפי מצב החיוב
    if (charge.status === 'PAID') {
        appointment.paymentStatus = 'PAID';
    } else if (charge.status === 'PARTIALLY_PAID') {
        appointment.paymentStatus = 'PARTIALLY_PAID';
    } else if (charge.status === 'PENDING') {
        appointment.paymentStatus = 'PENDING';
    } else {
        appointment.paymentStatus = appointment.paymentStatus || 'UNSET';
    }
    await appointment.save();

    return charge;
}

module.exports = {
    ensureChargeForAppointment
};


