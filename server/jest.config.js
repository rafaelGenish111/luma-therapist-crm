// jest.config.js
module.exports = {
    // סביבת הטסטים
    testEnvironment: 'node',
    
    // איפה למצוא את הטסטים
    testMatch: ['**/tests/**/*.test.js'],
    
    // הגדרות coverage
    collectCoverage: true,
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/index.js', // לא נבדוק את נקודת הכניסה
      '!src/config/**', // לא נבדוק קונפיגורציה
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    
    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup/globalSetup.js'],
    
    // זמן המתנה לטסטים
    testTimeout: 30000,
    
    // ניקוי mocks בין טסטים
    clearMocks: true,
    
    // דפוס למציאת טסטים
    verbose: true
  };