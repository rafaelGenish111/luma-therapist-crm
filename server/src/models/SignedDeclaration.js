const mongoose = require('mongoose');

const signedDeclarationSchema = new mongoose.Schema({
    userId: {
        type: String,
        index: true,
        required: true
    },
    signerName: String,
    signerPhone: String,
    signerEmail: String,
    payload: Object, // התוכן המקורי של ההצהרה
    payloadHash: String, // sha256 של ה-payloadString
    pdfSha256: String, // hash של קובץ ה-PDF לבדיקת שלמות
    pdfPath: String, // נתיב או URL לקובץ
    signedAt: {
        type: Date,
        default: Date.now
    },
    ip: String,
    ua: String, // User-Agent
    method: {
        type: String,
        default: "AES-OTP"
    }, // שיטת חתימה
    version: {
        type: String,
        default: "v1"
    },
    // קישור למסמך ההצהרה המקורי אם רלוונטי
    originalDeclarationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthDeclaration'
    },
    // סטטוס המסמך
    status: {
        type: String,
        enum: ['active', 'revoked', 'expired'],
        default: 'active'
    },
    // תאריך תפוגה אופציונלי
    expiresAt: Date,
    // מטא-דאטה נוסף
    metadata: {
        fileSize: Number,
        mimeType: String,
        pages: Number
    }
}, {
    timestamps: true
});

// אינדקסים לחיפוש מהיר
signedDeclarationSchema.index({ userId: 1, signedAt: -1 });
signedDeclarationSchema.index({ payloadHash: 1 });
signedDeclarationSchema.index({ pdfSha256: 1 });
signedDeclarationSchema.index({ originalDeclarationId: 1 });

// מתודות סטטיות
signedDeclarationSchema.statics.findByDocumentId = function (documentId) {
    return this.findOne({
        $or: [
            { _id: documentId },
            { 'metadata.documentId': documentId }
        ]
    });
};

signedDeclarationSchema.statics.verifyIntegrity = function (documentId, currentPdfHash) {
    return this.findOne({ _id: documentId }).then(doc => {
        if (!doc) return { valid: false, reason: 'Document not found' };
        if (doc.pdfSha256 !== currentPdfHash) {
            return { valid: false, reason: 'Document has been tampered with' };
        }
        if (doc.status !== 'active') {
            return { valid: false, reason: `Document status: ${doc.status}` };
        }
        if (doc.expiresAt && doc.expiresAt < new Date()) {
            return { valid: false, reason: 'Document has expired' };
        }
        return { valid: true, document: doc };
    });
};

module.exports = mongoose.model('SignedDeclaration', signedDeclarationSchema);
