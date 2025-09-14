const emailLogSchema = new mongoose.Schema({
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed'],
        default: 'queued'
    },
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    bouncedAt: Date,
    unsubscribedAt: Date,
    errorMessage: String,
    messageId: String, // ID מספק האימייל
    trackingPixelViewed: { type: Boolean, default: false },
    linksClicked: [String],
    therapist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: true
    }
}, {
    timestamps: true
});

emailLogSchema.index({ campaign: 1, status: 1 });
emailLogSchema.index({ client: 1, createdAt: -1 });
emailLogSchema.index({ therapist: 1, createdAt: -1 });

const EmailLog = mongoose.model('EmailLog', emailLogSchema);

module.exports = { Campaign, EmailTemplate, EmailLog };