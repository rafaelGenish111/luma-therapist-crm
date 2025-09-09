const mongoose = require('mongoose');

const TreatmentSessionSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
    },
    therapist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: true,
    },
    sessionNumber: {
        type: Number,
        default: 1,
    },
    sessionDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    sessionType: {
        type: String,
        enum: ['intake', 'followup', 'assessment', 'therapy', 'summary', 'emergency', 'consultation', 'other'],
        default: 'followup',
    },
    description: {
        type: String,
        required: true,
        maxlength: 5000,
    },
    nextSessionNotes: {
        type: String,
        maxlength: 2000,
    },
    progress: {
        type: String,
        enum: ['significant_improvement', 'improvement', 'stable', 'slight_decline', 'decline'],
    },
    mood: {
        type: String,
        enum: ['excellent', 'good', 'neutral', 'difficult', 'very_difficult'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

// Auto-increment session number for a given client
TreatmentSessionSchema.pre('save', async function (next) {
    if (this.isNew && !this.sessionNumber) {
        try {
            const lastSession = await this.constructor.findOne({
                client: this.client,
                therapist: this.therapist,
                isActive: true
            })
                .sort({ sessionNumber: -1 })
                .limit(1);
            this.sessionNumber = (lastSession ? lastSession.sessionNumber : 0) + 1;
        } catch (error) {
            console.error('Error in sessionNumber auto-increment:', error);
            this.sessionNumber = 1; // Fallback to 1
        }
    }
    next();
});

module.exports = mongoose.model('TreatmentSession', TreatmentSessionSchema);