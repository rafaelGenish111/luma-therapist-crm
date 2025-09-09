const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sessionsTotal: { type: Number, required: true, min: 1 },
    sessionsUsed: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'ILS' },
    status: { type: String, enum: ['ACTIVE', 'PAUSED', 'EXHAUSTED', 'CANCELLED'], default: 'ACTIVE', index: true }
}, {
    timestamps: true
});

packageSchema.virtual('remainingSessions').get(function () {
    return Math.max((this.sessionsTotal || 0) - (this.sessionsUsed || 0), 0);
});

module.exports = mongoose.model('Package', packageSchema);


