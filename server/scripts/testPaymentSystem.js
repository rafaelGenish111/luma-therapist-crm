#!/usr/bin/env node

/**
 * Payment System Test Script
 * 
 * This script tests the payment system functionality
 * Run with: node scripts/testPaymentSystem.js
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_MODE = process.env.TEST_MODE || 'mock';

class PaymentSystemTester {
    constructor() {
        this.apiUrl = API_BASE_URL;
        this.testResults = [];
    }

    async runTests() {
        console.log('🧪 Starting Payment System Tests...');
        console.log(`📍 API Base URL: ${this.apiUrl}`);
        console.log(`🔧 Test Mode: ${TEST_MODE}`);
        console.log('='.repeat(50));

        try {
            // Test 1: Health Check
            await this.testHealthCheck();

            // Test 2: Create Payment Link
            await this.testCreatePaymentLink();

            // Test 3: Get Payment Details
            await this.testGetPaymentDetails();

            // Test 4: Start Payment
            await this.testStartPayment();

            // Test 5: Mock Callback
            await this.testMockCallback();

            // Test 6: Payment Stats
            await this.testPaymentStats();

            // Test 7: Cleanup
            await this.testCleanup();

            this.printResults();

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }

    async testHealthCheck() {
        console.log('\n🔍 Test 1: Health Check');
        try {
            const response = await axios.get(`${this.apiUrl}/api/payment-health/health`);

            if (response.status === 200) {
                console.log('✅ Health check passed');
                console.log(`   Provider: ${response.data.provider}`);
                console.log(`   Environment: ${response.data.environment}`);
                this.testResults.push({ test: 'Health Check', status: 'PASS' });
            } else {
                throw new Error(`Health check returned status ${response.status}`);
            }
        } catch (error) {
            console.log('❌ Health check failed:', error.message);
            this.testResults.push({ test: 'Health Check', status: 'FAIL', error: error.message });
        }
    }

    async testCreatePaymentLink() {
        console.log('\n🔍 Test 2: Create Payment Link');
        try {
            // First, we need to get a therapist and client
            const seedResponse = await axios.post(`${this.apiUrl}/api/payment-health/seed`);

            if (seedResponse.status === 200) {
                this.testPaymentLink = seedResponse.data.payment.paymentLink;
                this.testPaymentLinkId = seedResponse.data.payment.paymentLinkId;

                console.log('✅ Payment link created');
                console.log(`   Link: ${this.testPaymentLink}`);
                console.log(`   Amount: ₪${seedResponse.data.payment.amount}`);
                this.testResults.push({ test: 'Create Payment Link', status: 'PASS' });
            } else {
                throw new Error(`Seed request returned status ${seedResponse.status}`);
            }
        } catch (error) {
            console.log('❌ Create payment link failed:', error.message);
            this.testResults.push({ test: 'Create Payment Link', status: 'FAIL', error: error.message });
        }
    }

    async testGetPaymentDetails() {
        console.log('\n🔍 Test 3: Get Payment Details');
        try {
            if (!this.testPaymentLinkId) {
                throw new Error('No payment link ID available');
            }

            const response = await axios.get(`${this.apiUrl}/api/payment-links/${this.testPaymentLinkId}`);

            if (response.status === 200) {
                console.log('✅ Payment details retrieved');
                console.log(`   Therapist: ${response.data.therapistName}`);
                console.log(`   Amount: ₪${response.data.amount}`);
                console.log(`   Status: ${response.data.status}`);
                this.testResults.push({ test: 'Get Payment Details', status: 'PASS' });
            } else {
                throw new Error(`Get payment details returned status ${response.status}`);
            }
        } catch (error) {
            console.log('❌ Get payment details failed:', error.message);
            this.testResults.push({ test: 'Get Payment Details', status: 'FAIL', error: error.message });
        }
    }

    async testStartPayment() {
        console.log('\n🔍 Test 4: Start Payment');
        try {
            if (!this.testPaymentLinkId) {
                throw new Error('No payment link ID available');
            }

            const response = await axios.post(`${this.apiUrl}/api/payment-links/start`, {
                paymentLinkId: this.testPaymentLinkId
            });

            if (response.status === 200) {
                console.log('✅ Payment started');
                console.log(`   Checkout URL: ${response.data.checkoutUrl}`);
                this.testCheckoutUrl = response.data.checkoutUrl;
                this.testResults.push({ test: 'Start Payment', status: 'PASS' });
            } else {
                throw new Error(`Start payment returned status ${response.status}`);
            }
        } catch (error) {
            console.log('❌ Start payment failed:', error.message);
            this.testResults.push({ test: 'Start Payment', status: 'FAIL', error: error.message });
        }
    }

    async testMockCallback() {
        console.log('\n🔍 Test 5: Mock Callback');
        try {
            if (!this.testPaymentLinkId) {
                throw new Error('No payment link ID available');
            }

            const callbackData = {
                paymentLinkId: this.testPaymentLinkId,
                status: 'paid',
                providerTxnId: `test_${Date.now()}`,
                metadata: { test: true }
            };

            const response = await axios.post(`${this.apiUrl}/api/payment-links/callback/mock`, callbackData);

            if (response.status === 200) {
                console.log('✅ Mock callback processed');
                console.log(`   Status: ${callbackData.status}`);
                console.log(`   Transaction ID: ${callbackData.providerTxnId}`);
                this.testResults.push({ test: 'Mock Callback', status: 'PASS' });
            } else {
                throw new Error(`Mock callback returned status ${response.status}`);
            }
        } catch (error) {
            console.log('❌ Mock callback failed:', error.message);
            this.testResults.push({ test: 'Mock Callback', status: 'FAIL', error: error.message });
        }
    }

    async testPaymentStats() {
        console.log('\n🔍 Test 6: Payment Stats');
        try {
            const response = await axios.get(`${this.apiUrl}/api/payment-health/stats`);

            if (response.status === 200) {
                console.log('✅ Payment stats retrieved');
                console.log(`   Total Payments: ${response.data.stats.totalPayments}`);
                console.log(`   Total Amount: ₪${response.data.stats.totalAmount}`);
                console.log(`   Provider: ${response.data.stats.provider}`);
                this.testResults.push({ test: 'Payment Stats', status: 'PASS' });
            } else {
                throw new Error(`Payment stats returned status ${response.status}`);
            }
        } catch (error) {
            console.log('❌ Payment stats failed:', error.message);
            this.testResults.push({ test: 'Payment Stats', status: 'FAIL', error: error.message });
        }
    }

    async testCleanup() {
        console.log('\n🔍 Test 7: Cleanup');
        try {
            const response = await axios.post(`${this.apiUrl}/api/payment-health/cleanup`);

            if (response.status === 200) {
                console.log('✅ Cleanup completed');
                console.log(`   Modified: ${response.data.modifiedCount} payments`);
                this.testResults.push({ test: 'Cleanup', status: 'PASS' });
            } else {
                throw new Error(`Cleanup returned status ${response.status}`);
            }
        } catch (error) {
            console.log('❌ Cleanup failed:', error.message);
            this.testResults.push({ test: 'Cleanup', status: 'FAIL', error: error.message });
        }
    }

    printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 Test Results Summary');
        console.log('='.repeat(50));

        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const total = this.testResults.length;

        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Total: ${total}`);
        console.log(`🎯 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => {
                    console.log(`   - ${r.test}: ${r.error}`);
                });
        }

        console.log('\n🎉 Payment System Test Complete!');

        if (failed === 0) {
            console.log('🚀 All tests passed! Payment system is ready for production.');
        } else {
            console.log('⚠️  Some tests failed. Please review the errors above.');
            process.exit(1);
        }
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const tester = new PaymentSystemTester();
    tester.runTests().catch(error => {
        console.error('💥 Test suite crashed:', error);
        process.exit(1);
    });
}

module.exports = PaymentSystemTester;
