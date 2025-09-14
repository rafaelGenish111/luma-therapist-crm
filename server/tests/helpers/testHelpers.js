// tests/helpers/testHelpers.js (גרסה סופית)
const mongoose = require('mongoose');

/**
 * יוצר ObjectId חדש לטסטים
 */
const createObjectId = () => new mongoose.Types.ObjectId();

/**
 * יוצר נתוני מטפלת לדוגמה
 */
const createMockTherapist = (overrides = {}) => {
  return {
    firstName: 'שרה',
    lastName: 'כהן',
    email: 'sarah@example.com',
    password: 'TestPassword123!', // הוספת password נדרש
    phone: '+972501234567',
    profession: 'פסיכולוגית', // ערך תקין מהמודל
    subscription: {
      plan: 'free',
      isActive: true,
      features: []
    },
    featureOverrides: {},
    isVerified: true,
    isActive: true,
    ...overrides
  };
};

/**
 * יוצר נתוני לקוח לדוגמה
 */
const createMockClient = (overrides = {}) => {
  return {
    firstName: 'אור',
    lastName: 'לוי',
    email: 'or@example.com',
    phone: '+972507654321',
    birthDate: new Date('1990-05-15'),
    status: 'active',
    ...overrides
  };
};

/**
 * יוצר נתוני מסמך לדוגמה
 */
const createMockDocument = (clientId, uploadedBy, overrides = {}) => {
  return {
    clientId,
    uploadedBy,
    title: 'הצהרת בריאות',
    type: 'health',
    url: 'https://example.com/document.pdf',
    fileSize: 1024000, // 1MB
    mimeType: 'application/pdf',
    isRequired: true,
    isCompleted: false,
    ...overrides
  };
};

/**
 * יוצר נתוני חבילה לדוגמה
 */
const createMockPackage = (therapistId, clientId, overrides = {}) => {
  return {
    therapistId,
    clientId,
    name: 'חבילת 10 פגישות',
    sessionsTotal: 10,
    sessionsUsed: 0,
    balanceAmount: 1000,
    currency: 'ILS',
    status: 'ACTIVE',
    ...overrides
  };
};

/**
 * המתנה לזמן קצר (שימושי לטסטים אסינכרוניים)
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * יוצר תאריך רנדומלי בטווח
 */
const randomDate = (start = new Date(2020, 0, 1), end = new Date()) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

/**
 * יוצר מייל רנדומלי לטסטים
 */
const randomEmail = () => {
  const domains = ['example.com', 'test.co.il', 'demo.org'];
  const names = ['test', 'demo', 'sample', 'mock'];
  const name = names[Math.floor(Math.random() * names.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const random = Math.floor(Math.random() * 1000);
  return `${name}${random}@${domain}`;
};

module.exports = {
  createObjectId,
  createMockTherapist,
  createMockClient,
  createMockDocument,
  createMockPackage,
  sleep,
  randomDate,
  randomEmail
};