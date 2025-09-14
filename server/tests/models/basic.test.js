// tests/models/basic.test.js
const { createMockTherapist, createMockClient } = require('../helpers/testHelpers');

describe('Basic Test Setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
    console.log('✅ Basic math test passed');
  });
  
  it('should have access to test helpers', () => {
    const therapist = createMockTherapist();
    
    expect(therapist.firstName).toBe('שרה');
    expect(therapist.email).toBe('sarah@example.com');
    expect(therapist.subscription.plan).toBe('free');
    
    console.log('✅ Test helpers working');
  });

  it('should create mock client data', () => {
    const client = createMockClient();
    
    expect(client.firstName).toBe('אור');
    expect(client.email).toBe('or@example.com');
    expect(client.status).toBe('active');
    
    console.log('✅ Mock client data working');
  });

  it('should handle overrides in mock data', () => {
    const therapist = createMockTherapist({
      firstName: 'מיכל',
      subscription: { plan: 'premium' }
    });
    
    expect(therapist.firstName).toBe('מיכל');
    expect(therapist.subscription.plan).toBe('premium');
    expect(therapist.lastName).toBe('כהן'); // נשאר מה-default
    
    console.log('✅ Mock data overrides working');
  });
});