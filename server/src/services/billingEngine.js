const Charge = require('../models/Charge');
const Package = require('../models/Package');

function calculateAmountFromLineItems(lineItems) {
    return (lineItems || []).reduce((sum, item) => sum + (item.qty || 0) * (item.unitPrice || 0), 0);
}

async function ensureChargeForAppointment(appointment) {
    console.log('💰 ensureChargeForAppointment called with:', {
        appointmentId: appointment?._id,
        therapist: appointment?.therapist,
        client: appointment?.client,
        price: appointment?.price,
        status: appointment?.status
    });

    if (!appointment) {
        console.log('⚠️ No appointment provided');
        return null;
    }

    const therapistId = appointment.therapist;
    const clientId = appointment.client;

    if (!therapistId || !clientId) {
        console.error('❌ Missing therapistId or clientId:', { therapistId, clientId });
        throw new Error('Missing therapistId or clientId for charge creation');
    }

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

    // ✨ אם אין מחיר (amount = 0) ואין חיוב קיים, לא ליצור חיוב חדש
    if (amount === 0 && !existingCharge) {
        console.log('ℹ️ No charge created - amount is 0 and no existing charge');
        appointment.paymentStatus = 'UNSET';
        await appointment.save();
        return null;
    }

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
    } else if (appointment.status === 'completed') {
        // פגישה שהסתיימה - חיוב ממתין לתשלום
        status = 'PENDING';
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
        console.log('📝 Updating existing charge:', existingCharge._id);
        // שמור paidAmount ואל תשכתב אם לא נדרש
        const preservedPaidAmount = existingCharge.paidAmount || 0;
        existingCharge.set(payload);
        existingCharge.paidAmount = preservedPaidAmount;
        existingCharge.audit.push({ action: 'UPDATED_FROM_APPOINTMENT' });
        charge = await existingCharge.save();
        console.log('✅ Charge updated successfully');
    } else {
        console.log('➕ Creating new charge with payload:', payload);
        charge = await Charge.create({ ...payload, audit: [{ action: 'CREATED_FROM_APPOINTMENT' }] });
        console.log('✅ Charge created:', charge._id);
        appointment.chargeId = charge._id;
        await appointment.save();
        console.log('✅ Appointment updated with chargeId');
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


