const crypto = require('crypto');

/**
 * Utility להצפנת וניתוח טוקנים רגישים
 * משתמש ב-AES-256-GCM להצפנה בטוחה
 */

class EncryptionUtil {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.secretKey = process.env.ENCRYPTION_KEY;

        if (!this.secretKey) {
            throw new Error('ENCRYPTION_KEY environment variable is required');
        }

        // הקי חייב להיות 32 בתים ל-AES-256
        if (this.secretKey.length !== 64) { // 32 bytes in hex = 64 characters
            throw new Error('ENCRYPTION_KEY must be 64 characters (32 bytes in hex)');
        }

        this.key = Buffer.from(this.secretKey, 'hex');
    }

    /**
     * מצפין טקסט או אובייקט
     * @param {string|object} data - הנתונים להצפנה
     * @returns {string} - המחרוזת המוצפנת (base64)
     */
    encrypt(data) {
        try {
            const text = typeof data === 'string' ? data : JSON.stringify(data);

            // יצירת IV אקראי
            const iv = crypto.randomBytes(16);

            // יצירת cipher
            const cipher = crypto.createCipherGCM(this.algorithm, this.key, iv);

            // הצפנה
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            // קבלת tag לאימות
            const authTag = cipher.getAuthTag();

            // שילוב IV, authTag והנתונים המוצפנים
            const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;

            // החזרה כ-base64
            return Buffer.from(combined).toString('base64');
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    /**
     * מפענח טקסט מוצפן
     * @param {string} encryptedData - הנתונים המוצפנים (base64)
     * @returns {string} - הטקסט המפוענח
     */
    decrypt(encryptedData) {
        try {
            // פענוח מ-base64
            const combined = Buffer.from(encryptedData, 'base64').toString('utf8');

            // פיצול החלקים
            const parts = combined.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }

            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];

            // יצירת decipher
            const decipher = crypto.createDecipherGCM(this.algorithm, this.key, iv);
            decipher.setAuthTag(authTag);

            // פענוח
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    /**
     * מצפין אובייקט ומחזיר אותו כ-JSON מפוענח
     * @param {object} obj - האובייקט להצפנה
     * @returns {object} - האובייקט המפוענח
     */
    encryptObject(obj) {
        const encrypted = this.encrypt(obj);
        return { encrypted };
    }

    /**
     * מפענח אובייקט מוצפן
     * @param {object} encryptedObj - האובייקט המוצפן
     * @returns {object} - האובייקט המפוענח
     */
    decryptObject(encryptedObj) {
        if (!encryptedObj.encrypted) {
            throw new Error('Object does not contain encrypted data');
        }

        const decrypted = this.decrypt(encryptedObj.encrypted);
        return JSON.parse(decrypted);
    }

    /**
     * יוצר hash בטוח של נתונים
     * @param {string} data - הנתונים ל-hash
     * @returns {string} - ה-hash
     */
    hash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * משווה נתונים עם hash
     * @param {string} data - הנתונים המקוריים
     * @param {string} hash - ה-hash להשוואה
     * @returns {boolean} - האם התואמים
     */
    verifyHash(data, hash) {
        return this.hash(data) === hash;
    }

    /**
     * יוצר טוקן אקראי
     * @param {number} length - אורך הטוקן בבתים (ברירת מחדל: 32)
     * @returns {string} - טוקן אקראי (hex)
     */
    generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * יוצר מזהה ייחודי קצר
     * @returns {string} - מזהה ייחודי
     */
    generateShortId() {
        return crypto.randomBytes(8).toString('hex');
    }
}

// יצירת instance יחיד
const encryptionUtil = new EncryptionUtil();

module.exports = {
    encryptionUtil,
    EncryptionUtil,

    // פונקציות נוחות
    encrypt: (data) => encryptionUtil.encrypt(data),
    decrypt: (data) => encryptionUtil.decrypt(data),
    encryptObject: (obj) => encryptionUtil.encryptObject(obj),
    decryptObject: (obj) => encryptionUtil.decryptObject(obj),
    hash: (data) => encryptionUtil.hash(data),
    verifyHash: (data, hash) => encryptionUtil.verifyHash(data, hash),
    generateToken: (length) => encryptionUtil.generateToken(length),
    generateShortId: () => encryptionUtil.generateShortId()
};
