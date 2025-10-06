const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['SESSION', 'DISCOUNT', 'CANCELLATION_FEE', 'TIP'],
        required: true
    },
    qty: { type: Number, default: 1, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    note: { type: String, trim: true }
}, { _id: false });

const auditEntrySchema = new mongoose.Schema({
    ts: { type: Date, default: Date.now },
    action: { type: String, required: true },
    by: { type: String, default: 'system' },
    meta: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const chargeSchema = new mongoose.Schema({
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },

    status: {
        type: String,
        enum: ['DRAFT', 'PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'CANCELED', 'REFUNDED', 'WRITEOFF'],
        default: 'PENDING',
    },

    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    tipAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'ILS' },

    lineItems: { type: [lineItemSchema], default: [] },

    // קישור לתשלומים שבוצעו על חיוב זה
    payments: { type: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' } ], default: [] },

    dueAt: { type: Date },
    issuedAt: { type: Date },
    paidAt: { type: Date },

    provider: { type: String, enum: ['STRIPE', 'TR-ZILLA', 'NONE'], default: 'NONE' },
    providerChargeId: { type: String },
    providerInvoiceId: { type: String },

    invoiceNumber: { type: String },
    pdfUrl: { type: String },

    audit: { type: [auditEntrySchema], default: [] }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

chargeSchema.index({ clientId: 1, status: 1 });
chargeSchema.index({ therapistId: 1, status: 1 });

chargeSchema.virtual('balance').get(function () {
    const gross = (this.amount || 0) + (this.taxAmount || 0) + (this.tipAmount || 0) - (this.discountAmount || 0);
    return Math.max(gross - (this.paidAmount || 0), 0);
});

module.exports = mongoose.model('Charge', chargeSchema);


