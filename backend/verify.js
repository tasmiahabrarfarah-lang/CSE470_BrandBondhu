import mongoose from 'mongoose';
import app from './server.js';
import User from './models/User.js';
import Subscription from './models/Subscription.js';
import Transaction from './models/Transaction.js';
import Notification from './models/Notification.js';

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api`;

const logTest = (step, status, details = '') => {
  const symbol = status === 'SUCCESS' ? '🟢' : '🔴';
  console.log(`${symbol} [${step}] - ${status} ${details ? `(${details})` : ''}`);
};

const runTests = async () => {
  let server;
  try {
    // Start server programmatically
    server = app.listen(PORT, async () => {
      console.log(`Test server booted on port ${PORT}`);
      
      try {
        // Wait for mongoose connection
        if (mongoose.connection.readyState !== 1) {
          await new Promise((resolve) => {
            mongoose.connection.once('open', resolve);
          });
        }

        // Clean up previous test runs if any
        await User.findOneAndDelete({ email: 'tester@brandbondhu.com' });
        await User.findOneAndDelete({ email: 'collaborator@brandbondhu.com' });

        console.log('\n--- STARTING BRANDBONDHU CORE BACKEND AUTOMATED TESTS ---\n');

        // Test 1: User Registration
        const registerRes = await fetch(`${BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Seller',
            email: 'tester@brandbondhu.com',
            phone: '01712345678',
            password: 'password123',
            role: 'seller',
            businessName: 'Tester Electronics',
            industry: 'Technology',
          }),
        });
        const registerData = await registerRes.json();
        
        if (!registerData.success || !registerData.otp) {
          throw new Error(`Registration failed: ${registerData.message}`);
        }
        logTest('1. Register Seller Account', 'SUCCESS', `Simulated OTP received: ${registerData.otp}`);

        const otp = registerData.otp;

        // Test 2: OTP Verification
        const verifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'tester@brandbondhu.com',
            otp,
          }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success || !verifyData.token) {
          throw new Error(`OTP Verification failed: ${verifyData.message}`);
        }
        const token = verifyData.token;
        logTest('2. OTP Verification (Activate Account)', 'SUCCESS', `Token issued: ${token.substring(0, 15)}...`);

        // Test 3: Log In
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'tester@brandbondhu.com',
            password: 'password123',
          }),
        });
        const loginData = await loginRes.json();
        if (!loginData.success) {
          throw new Error(`Login failed: ${loginData.message}`);
        }
        logTest('3. Login (Authenticate User)', 'SUCCESS', `User authenticated as role: ${loginData.user.role}`);

        // Test 4: Get Profile & Check Subscription defaults
        const subRes = await fetch(`${BASE_URL}/subscriptions/my`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const subData = await subRes.json();
        if (!subData.success || subData.data.tier !== 'free') {
          throw new Error(`Default subscription assertion failed: ${JSON.stringify(subData)}`);
        }
        logTest('4. Fetch Default Subscription limits', 'SUCCESS', `Default Tier: ${subData.data.tier}, Credits: ${subData.data.credits.current}/${subData.data.credits.total}`);

        // Test 5: Consume Credits (Simulate AI Action)
        const consumeRes = await fetch(`${BASE_URL}/subscriptions/consume`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: 5 }),
        });
        const consumeData = await consumeRes.json();
        if (!consumeData.success || consumeData.currentCredits !== 15) {
          throw new Error(`Credit consumption failed: ${JSON.stringify(consumeData)}`);
        }
        logTest('5. Consume AI Credits (Credits Deduction)', 'SUCCESS', `Credits remaining: ${consumeData.currentCredits}`);

        // Test 6: Payment Initiation
        const payInitRes = await fetch(`${BASE_URL}/payments/initiate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            tier: 'premium',
            gateway: 'bkash',
          }),
        });
        const payInitData = await payInitRes.json();
        if (!payInitData.success || !payInitData.data.transactionId) {
          throw new Error(`Payment initiation failed: ${JSON.stringify(payInitData)}`);
        }
        const txnId = payInitData.data.transactionId;
        const invoiceNum = payInitData.data.invoiceNumber;
        logTest('6. Payment Initiation (bKash Gateway)', 'SUCCESS', `TxnID: ${txnId}, Invoice: ${invoiceNum}`);

        // Test 7: Confirm Payment & Upgrade Subscription
        const confirmRes = await fetch(`${BASE_URL}/payments/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ transactionId: txnId }),
        });
        const confirmData = await confirmRes.json();
        if (!confirmData.success || confirmData.data.subscription.tier !== 'premium') {
          throw new Error(`Payment confirmation failed: ${JSON.stringify(confirmData)}`);
        }
        logTest('7. Payment Confirmation & Billing Upgrade', 'SUCCESS', `Upgraded Tier: ${confirmData.data.subscription.tier}, New Total Credits: ${confirmData.data.subscription.credits.current}`);

        // Test 8: Get Notifications
        const notifRes = await fetch(`${BASE_URL}/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const notifData = await notifRes.json();
        if (!notifData.success || notifData.data.length === 0) {
          throw new Error(`No notifications found: ${JSON.stringify(notifData)}`);
        }
        logTest('8. Fetch Alerts (Notification System)', 'SUCCESS', `Fetched notifications count: ${notifData.data.length}, latest: "${notifData.data[0].title}"`);

        // Test 9: Create Collaborator (FR-17)
        const user = await User.findOne({ email: 'tester@brandbondhu.com' });
        const collRes = await fetch(`${BASE_URL}/profile/collaborators`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: 'Jane Staff',
            email: 'collaborator@brandbondhu.com',
            phone: '01898765432',
            password: 'password1234',
            permissions: ['content', 'analytics'],
          }),
        });
        const collData = await collRes.json();
        if (!collData.success) {
          throw new Error(`Collaborator invite failed: ${JSON.stringify(collData)}`);
        }
        logTest('9. Invite Staff (Collaborator Access)', 'SUCCESS', `Collaborator name: ${collData.data.name}`);

        console.log('\n--- CLEANING UP TEST ACCOUNTS ---\n');
        await User.findOneAndDelete({ email: 'tester@brandbondhu.com' });
        await User.findOneAndDelete({ email: 'collaborator@brandbondhu.com' });
        await Subscription.deleteMany({ userId: user._id });
        await Transaction.deleteMany({ userId: user._id });
        await Notification.deleteMany({ userId: user._id });
        console.log('Cleanup finished successfully.');

        console.log('\n🌟 ALL CORE FUNCTIONAL TESTS PASSED SUCCESSFULLY! 🌟\n');
        server.close(() => {
          process.exit(0);
        });

      } catch (err) {
        console.error('\n❌ TEST SUITE FAILURE EXCEPTION:');
        console.error(err.message);
        
        // Clean up on failure
        try {
          const user = await User.findOne({ email: 'tester@brandbondhu.com' });
          if (user) {
            await User.findOneAndDelete({ email: 'tester@brandbondhu.com' });
            await User.findOneAndDelete({ email: 'collaborator@brandbondhu.com' });
            await Subscription.deleteMany({ userId: user._id });
            await Transaction.deleteMany({ userId: user._id });
            await Notification.deleteMany({ userId: user._id });
          }
        } catch (cleanupErr) {
          console.error('Cleanup on failure failed:', cleanupErr.message);
        }

        if (server) {
          server.close(() => {
            process.exit(1);
          });
        } else {
          process.exit(1);
        }
      }
    });
  } catch (globalErr) {
    console.error('Test server error:', globalErr);
    process.exit(1);
  }
};

runTests();
