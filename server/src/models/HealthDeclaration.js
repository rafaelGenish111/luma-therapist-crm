const mongoose = require('mongoose');

const healthDeclarationSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true },

    // Basic client info
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: { type: String, required: true },
    idNumber: { type: String, required: true },
    age: { type: Number, required: true },

    // Medical conditions and history
    medicalConditions: [{ type: String }],
    medications: { type: String },
    allergies: { type: String },
    previousSurgeries: { type: String },
    pregnancyStatus: { type: Boolean, default: false },
    breastfeeding: { type: Boolean, default: false },
    physicalLimitations: { type: String },

    // Mental health (for psychology)
    currentStress: { type: String },
    previousTherapy: { type: String },

    // General
    expectations: { type: String },
    additionalInfo: { type: String },

    // Legacy fields for backward compatibility
    fullName: { type: String },
    idNumber: { type: String },
    phone: { type: String },
    email: { type: String },
    answers: { type: Object }, // כל התשובות מהטופס

    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('HealthDeclaration', healthDeclarationSchema); 