// tests/setup/globalSetup.js
const testDb = require('./testDb');

// הגדרה גלובלית לפני כל הטסטים
beforeAll(async () => {
  await testDb.connect();
});

// ניקוי אחרי כל טסט
afterEach(async () => {
  await testDb.cleanup();
});

// סגירה אחרי כל הטסטים
afterAll(async () => {
  await testDb.disconnect();
});

// הגדרות נוספות
jest.setTimeout(30000); // 30 שניות timeout

// משתנים גלובליים לטסטים
global.testDb = testDb;