const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema({
    key: { type: String, required: true },
    label: { type: String, required: true },
    requiresDetails: { type: Boolean, default: false },
}, { _id: false });

const healthDeclarationTemplateSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // e.g., massage, psychology
    name: { type: String, required: true },
    conditions: { type: [conditionSchema], default: [] },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('HealthDeclarationTemplate', healthDeclarationTemplateSchema);




