const CryptoJS = require('crypto-js');

/**
 * Encryption Utilities
 * כלים להצפנה ופענוח של נתונים רגישים
 */

/**
 * Encrypt sensitive data
 * הצפנת נתונים רגישים
 */
const encrypt = (text) => {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty');
  }

  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }

  if (process.env.ENCRYPTION_KEY.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }

  try {
    const encrypted = CryptoJS.AES.encrypt(
      text.toString(),
      process.env.ENCRYPTION_KEY
    ).toString();
    
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data
 * פענוח נתונים מוצפנים
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) {
    throw new Error('Encrypted text cannot be empty');
  }

  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }

  try {
    const bytes = CryptoJS.AES.decrypt(
      encryptedText,
      process.env.ENCRYPTION_KEY
    );
    
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Failed to decrypt data - invalid key or corrupted data');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Encrypt object with selective field encryption
 * הצפנת אובייקט עם בחירת שדות להצפנה
 */
const encryptObject = (obj, fieldsToEncrypt = []) => {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Object to encrypt must be a valid object');
  }

  const encrypted = { ...obj };
  
  fieldsToEncrypt.forEach(field => {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      encrypted[field] = encrypt(encrypted[field]);
    }
  });
  
  return encrypted;
};

/**
 * Decrypt object with selective field decryption
 * פענוח אובייקט עם בחירת שדות לפענוח
 */
const decryptObject = (obj, fieldsToDecrypt = []) => {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Object to decrypt must be a valid object');
  }

  const decrypted = { ...obj };
  
  fieldsToDecrypt.forEach(field => {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch (error) {
        console.warn(`Failed to decrypt field ${field}:`, error.message);
        // Keep original value if decryption fails
      }
    }
  });
  
  return decrypted;
};

/**
 * Hash password using bcrypt
 * הצפנת סיסמה עם bcrypt
 */
const hashPassword = async (password) => {
  const bcrypt = require('bcryptjs');
  
  if (!password) {
    throw new Error('Password cannot be empty');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Verify password against hash
 * בדיקת סיסמה מול hash
 */
const verifyPassword = async (password, hashedPassword) => {
  const bcrypt = require('bcryptjs');
  
  if (!password || !hashedPassword) {
    throw new Error('Password and hashed password are required');
  }

  try {
    const isValid = await bcrypt.compare(password, hashedPassword);
    return isValid;
  } catch (error) {
    console.error('Password verification error:', error);
    throw new Error('Failed to verify password');
  }
};

/**
 * Generate secure random token
 * יצירת token אקראי מאובטח
 */
const generateSecureToken = (length = 32) => {
  const crypto = require('crypto');
  
  if (length < 16) {
    throw new Error('Token length must be at least 16 characters');
  }

  try {
    const token = crypto.randomBytes(length).toString('hex');
    return token;
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate secure token');
  }
};

/**
 * Generate confirmation code
 * יצירת קוד אישור
 */
const generateConfirmationCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Encrypt Google OAuth tokens
 * הצפנת tokens של Google OAuth
 */
const encryptGoogleTokens = (tokens) => {
  if (!tokens || typeof tokens !== 'object') {
    throw new Error('Tokens must be a valid object');
  }

  const encryptedTokens = {};
  
  if (tokens.access_token) {
    encryptedTokens.access_token = encrypt(tokens.access_token);
  }
  
  if (tokens.refresh_token) {
    encryptedTokens.refresh_token = encrypt(tokens.refresh_token);
  }
  
  if (tokens.id_token) {
    encryptedTokens.id_token = encrypt(tokens.id_token);
  }
  
  return encryptedTokens;
};

/**
 * Decrypt Google OAuth tokens
 * פענוח tokens של Google OAuth
 */
const decryptGoogleTokens = (encryptedTokens) => {
  if (!encryptedTokens || typeof encryptedTokens !== 'object') {
    throw new Error('Encrypted tokens must be a valid object');
  }

  const decryptedTokens = {};
  
  if (encryptedTokens.access_token) {
    decryptedTokens.access_token = decrypt(encryptedTokens.access_token);
  }
  
  if (encryptedTokens.refresh_token) {
    decryptedTokens.refresh_token = decrypt(encryptedTokens.refresh_token);
  }
  
  if (encryptedTokens.id_token) {
    decryptedTokens.id_token = decrypt(encryptedTokens.id_token);
  }
  
  return decryptedTokens;
};

/**
 * Encrypt sensitive client data
 * הצפנת נתונים רגישים של לקוחות
 */
const encryptClientData = (clientData) => {
  const sensitiveFields = [
    'phone',
    'address',
    'notes',
    'medicalHistory',
    'emergencyContact'
  ];
  
  return encryptObject(clientData, sensitiveFields);
};

/**
 * Decrypt sensitive client data
 * פענוח נתונים רגישים של לקוחות
 */
const decryptClientData = (encryptedClientData) => {
  const sensitiveFields = [
    'phone',
    'address',
    'notes',
    'medicalHistory',
    'emergencyContact'
  ];
  
  return decryptObject(encryptedClientData, sensitiveFields);
};

/**
 * Encrypt appointment notes
 * הצפנת הערות פגישה
 */
const encryptAppointmentNotes = (appointment) => {
  const fieldsToEncrypt = ['notes', 'privateNotes'];
  return encryptObject(appointment, fieldsToEncrypt);
};

/**
 * Decrypt appointment notes
 * פענוח הערות פגישה
 */
const decryptAppointmentNotes = (encryptedAppointment) => {
  const fieldsToDecrypt = ['notes', 'privateNotes'];
  return decryptObject(encryptedAppointment, fieldsToDecrypt);
};

/**
 * Validate encryption key strength
 * בדיקת חוזק מפתח ההצפנה
 */
const validateEncryptionKey = (key) => {
  if (!key) {
    return { valid: false, message: 'Encryption key is required' };
  }
  
  if (key.length < 32) {
    return { valid: false, message: 'Encryption key must be at least 32 characters long' };
  }
  
  if (key.length > 128) {
    return { valid: false, message: 'Encryption key should not exceed 128 characters' };
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /^[0-9]+$/, // Only numbers
    /^[a-zA-Z]+$/, // Only letters
    /password/i,
    /secret/i,
    /key/i,
    /123456/,
    /abcdef/
  ];
  
  if (weakPatterns.some(pattern => pattern.test(key))) {
    return { valid: false, message: 'Encryption key appears to be weak' };
  }
  
  return { valid: true, message: 'Encryption key is valid' };
};

/**
 * Generate encryption key
 * יצירת מפתח הצפנה
 */
const generateEncryptionKey = (length = 64) => {
  const crypto = require('crypto');
  
  if (length < 32) {
    throw new Error('Key length must be at least 32 characters');
  }
  
  try {
    const key = crypto.randomBytes(length).toString('hex');
    return key;
  } catch (error) {
    console.error('Encryption key generation error:', error);
    throw new Error('Failed to generate encryption key');
  }
};

module.exports = {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateConfirmationCode,
  encryptGoogleTokens,
  decryptGoogleTokens,
  encryptClientData,
  decryptClientData,
  encryptAppointmentNotes,
  decryptAppointmentNotes,
  validateEncryptionKey,
  generateEncryptionKey
};