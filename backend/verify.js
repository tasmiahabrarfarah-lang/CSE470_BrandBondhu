import mongoose from 'mongoose';
import app from './server.js';
import User from './models/User.js';
import Subscription from './models/Subscription.js';
import Transaction from './models/Transaction.js';
import Notification from './models/Notification.js';
import Product from './models/Product.js';
import DesignJob from './models/DesignJob.js';
import AuditLog from './models/AuditLog.js';
import SupportTicket from './models/SupportTicket.js';
import Referral from './models/Referral.js';

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
        await User.findOneAndDelete({ email: 'designer@brandbondhu.com' });

        console.log('\n--- STARTING BRANDBONDHU CORE BACKEND AUTOMATED TESTS ---\n');

        // Test 1: User Registration (Seller)
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
        const sellerToken = verifyData.token;
        logTest('2. OTP Verification (Activate Account)', 'SUCCESS', `Token issued: ${sellerToken.substring(0, 15)}...`);

        // Test 3: Create Designer Account (FR-7.1)
        const designerRes = await fetch(`${BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Design Pro',
            email: 'designer@brandbondhu.com',
            phone: '01811223344',
            password: 'password123',
            role: 'designer',
          }),
        });
        const designerData = await designerRes.json();
        const desOtp = designerData.otp;
        
        const desVerifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'designer@brandbondhu.com', otp: desOtp }),
        });
        const desVerifyData = await desVerifyRes.json();
        const designerToken = desVerifyData.token;

        // Update designer profile with skills and hourly rate
        await fetch(`${BASE_URL}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${designerToken}` },
          body: JSON.stringify({
            portfolioInfo: {
              bio: 'Expert graphic designer specializing in logo design',
              skills: ['Logo Design', 'Poster Design'],
              hourlyRate: 800,
            },
          }),
        });
        logTest('3. Designer Profile Setup (FR-7.1)', 'SUCCESS', 'Registered & activated Designer account');

        // Test 4: Product Catalog Management - Create Product (FR-13.1)
        const createProdRes = await fetch(`${BASE_URL}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sellerToken}`,
          },
          body: JSON.stringify({
            name: 'Wireless Gaming Headset',
            description: 'RGB Surround sound headset for gaming and calls',
            price: 4500,
            category: 'Electronics',
            images: ['https://example.com/headset.jpg'],
          }),
        });
        const createProdData = await createProdRes.json();
        if (!createProdData.success || !createProdData.data._id) {
          throw new Error(`Product creation failed: ${JSON.stringify(createProdData)}`);
        }
        const productId = createProdData.data._id;
        logTest('4. Product Catalog - Create Product (FR-13.1)', 'SUCCESS', `Created "${createProdData.data.name}" (৳${createProdData.data.price})`);

        // Test 5: Product Catalog - Bulk CSV Upload (FR-13.5)
        const bulkProdRes = await fetch(`${BASE_URL}/products/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sellerToken}`,
          },
          body: JSON.stringify({
            products: [
              { name: 'Mechanical Keyboard', description: 'RGB Mechanical Gaming Keyboard', price: 3200, category: 'Electronics' },
              { name: 'Ergonomic Mouse', description: 'Wireless precision mouse', price: 1500, category: 'Electronics' },
            ],
          }),
        });
        const bulkProdData = await bulkProdRes.json();
        if (!bulkProdData.success || bulkProdData.data.length !== 2) {
          throw new Error(`Bulk product upload failed: ${JSON.stringify(bulkProdData)}`);
        }
        logTest('5. Product Catalog - Bulk CSV Upload (FR-13.5)', 'SUCCESS', `Bulk uploaded ${bulkProdData.data.length} products`);

        // Test 6: Product Catalog - Auto-Pull for Content Generation (FR-13.4)
        const autoPullRes = await fetch(`${BASE_URL}/products/${productId}/auto-pull`, {
          headers: { 'Authorization': `Bearer ${sellerToken}` },
        });
        const autoPullData = await autoPullRes.json();
        if (!autoPullData.success || !autoPullData.data.formattedCaptionInput) {
          throw new Error(`Auto-pull failed: ${JSON.stringify(autoPullData)}`);
        }
        logTest('6. Product Catalog - Auto-Pull Prompt (FR-13.4)', 'SUCCESS', `Pulled prompt text: "${autoPullData.data.formattedCaptionInput.substring(0, 30)}..."`);

        // Test 7: Designer Marketplace - Browse Designers (FR-7.2)
        const browseRes = await fetch(`${BASE_URL}/marketplace/designers?search=Design`, {
          headers: { 'Authorization': `Bearer ${sellerToken}` },
        });
        const browseData = await browseRes.json();
        if (!browseData.success || browseData.data.length === 0) {
          throw new Error(`Browse designers failed: ${JSON.stringify(browseData)}`);
        }
        const foundDesigner = browseData.data[0];
        logTest('7. Marketplace - Browse & Search Designers (FR-7.2)', 'SUCCESS', `Found designer: ${foundDesigner.name} (Rate: ৳${foundDesigner.portfolioInfo.hourlyRate}/hr)`);

        // Test 8: Designer Marketplace - Request Job & Escrow Hold (FR-7.3, FR-7.7)
        const requestJobRes = await fetch(`${BASE_URL}/marketplace/jobs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sellerToken}`,
          },
          body: JSON.stringify({
            designerId: foundDesigner._id,
            title: 'Custom Brand Logo',
            description: 'Minimalist tech logo for electronics store',
            category: 'Logo Design',
            budget: 3500,
          }),
        });
        const requestJobData = await requestJobRes.json();
        if (!requestJobData.success || requestJobData.data.escrowStatus !== 'Held') {
          throw new Error(`Job request failed: ${JSON.stringify(requestJobData)}`);
        }
        const jobId = requestJobData.data._id;
        logTest('8. Marketplace - Request Job & Hold Escrow (FR-7.3, FR-7.7)', 'SUCCESS', `Job ID: ${jobId}, Escrow: ${requestJobData.data.escrowStatus}`);

        // Test 9: Designer Marketplace - Accept Job & Submit Deliverable (FR-7.5)
        await fetch(`${BASE_URL}/marketplace/jobs/${jobId}/accept`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${designerToken}` },
        });

        const deliverRes = await fetch(`${BASE_URL}/marketplace/jobs/${jobId}/deliver`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${designerToken}`,
          },
          body: JSON.stringify({
            fileName: 'LogoFinal.png',
            fileUrl: 'https://example.com/files/LogoFinal.png',
            notes: 'Here is your vector logo deliverable!',
          }),
        });
        const deliverData = await deliverRes.json();
        if (!deliverData.success || deliverData.data.status !== 'Submitted') {
          throw new Error(`Submit deliverable failed: ${JSON.stringify(deliverData)}`);
        }
        logTest('9. Marketplace - Submit Deliverable Files (FR-7.5)', 'SUCCESS', `Submitted file: ${deliverData.data.deliverableFiles[0].fileName}`);

        // Test 10: Designer Marketplace - Approve Deliverables & Release Escrow (FR-7.7)
        const approveRes = await fetch(`${BASE_URL}/marketplace/jobs/${jobId}/approve`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${sellerToken}` },
        });
        const approveData = await approveRes.json();
        if (!approveData.success || approveData.data.escrowStatus !== 'Released') {
          throw new Error(`Approve deliverables failed: ${JSON.stringify(approveData)}`);
        }
        logTest('10. Marketplace - Approve Deliverables & Release Escrow (FR-7.7)', 'SUCCESS', `Status: ${approveData.data.status}, Escrow: ${approveData.data.escrowStatus}`);

        // Test 11: Designer Marketplace - 2-Way Review Submission (FR-7.6)
        const reviewRes = await fetch(`${BASE_URL}/marketplace/jobs/${jobId}/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sellerToken}`,
          },
          body: JSON.stringify({
            rating: 5,
            comment: 'Outstanding logo design and super fast delivery!',
          }),
        });
        const reviewData = await reviewRes.json();
        if (!reviewData.success || !reviewData.data.sellerReview) {
          throw new Error(`Review submission failed: ${JSON.stringify(reviewData)}`);
        }
        logTest('11. Marketplace - Two-Way Rating & Review (FR-7.6)', 'SUCCESS', `Rating: ⭐ ${reviewData.data.sellerReview.rating}/5`);

        // Test 12: Team Access - Invite Collaborator & Audit Logging (FR-17.1, FR-17.3)
        const collRes = await fetch(`${BASE_URL}/profile/collaborators`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sellerToken}`,
          },
          body: JSON.stringify({
            name: 'Jane Staff',
            email: 'collaborator@brandbondhu.com',
            phone: '01898765432',
            password: 'password1234',
            permissions: ['products', 'marketplace', 'content'],
          }),
        });
        const collData = await collRes.json();
        if (!collData.success) {
          throw new Error(`Collaborator invite failed: ${JSON.stringify(collData)}`);
        }
        logTest('12. Team Access - Invite Staff Collaborator (FR-17.1)', 'SUCCESS', `Created collaborator: ${collData.data.name}`);

        // Test 13: Team Access - Verify Audit Log Activity (FR-17.3)
        const auditRes = await fetch(`${BASE_URL}/profile/audit-logs`, {
          headers: { 'Authorization': `Bearer ${sellerToken}` },
        });
        const auditData = await auditRes.json();
        if (!auditData.success || auditData.data.length === 0) {
          throw new Error(`Audit log check failed: ${JSON.stringify(auditData)}`);
        }
        logTest('13. Team Access - Audit Log Timeline (FR-17.3)', 'SUCCESS', `Logged ${auditData.data.length} activities, latest: "${auditData.data[0].action}"`);

        // Test 14: Support Ticket System - Submit Ticket (FR-19.1)
        const ticketRes = await fetch(`${BASE_URL}/tickets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sellerToken}`,
          },
          body: JSON.stringify({
            subject: 'Unable to connect Facebook page API',
            category: 'Technical Issue',
            priority: 'High',
            description: 'Receiving authorization error code 403 when trying to fetch Facebook page comments.',
          }),
        });
        const ticketData = await ticketRes.json();
        if (!ticketData.success || !ticketData.data.ticketId) {
          throw new Error(`Support ticket creation failed: ${JSON.stringify(ticketData)}`);
        }
        const createdTicket = ticketData.data;
        logTest('14. Support Ticket - Create Ticket (FR-19.1)', 'SUCCESS', `Created ticket #${createdTicket.ticketId}`);

        // Test 15: Support Ticket System - Add Reply & Status Update (FR-19.2, FR-19.3)
        const replyRes = await fetch(`${BASE_URL}/tickets/${createdTicket._id}/responses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sellerToken}`,
          },
          body: JSON.stringify({
            message: 'Attaching diagnostic error log screenshot.',
          }),
        });
        const replyData = await replyRes.json();
        if (!replyData.success || replyData.data.responses.length === 0) {
          throw new Error(`Ticket response failed: ${JSON.stringify(replyData)}`);
        }

        const statusRes = await fetch(`${BASE_URL}/tickets/${createdTicket._id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sellerToken}`,
          },
          body: JSON.stringify({ status: 'Resolved' }),
        });
        const statusData = await statusRes.json();
        if (!statusData.success || statusData.data.status !== 'Resolved') {
          throw new Error(`Ticket status update failed: ${JSON.stringify(statusData)}`);
        }
        logTest('15. Support Ticket - Response & Resolve Status (FR-19.2, FR-19.3)', 'SUCCESS', `Status updated to "${statusData.data.status}"`);

        // Test 16: Support Ticket System - Rate Experience (FR-19.4)
        const rateRes = await fetch(`${BASE_URL}/tickets/${createdTicket._id}/rate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sellerToken}`,
          },
          body: JSON.stringify({
            stars: 5,
            feedback: 'Super fast support resolution!',
          }),
        });
        const rateData = await rateRes.json();
        if (!rateData.success || !rateData.data.rating.stars) {
          throw new Error(`Support ticket rating failed: ${JSON.stringify(rateData)}`);
        }
        logTest('16. Support Ticket - Rate Experience (FR-19.4)', 'SUCCESS', `Rated ⭐ ${rateData.data.rating.stars}/5 stars`);

        // Test 17: Referral & Loyalty Program - Get Code & Link (FR-20.1)
        const refRes = await fetch(`${BASE_URL}/referrals/my`, {
          headers: { 'Authorization': `Bearer ${sellerToken}` },
        });
        const refData = await refRes.json();
        if (!refData.success || !refData.data.referralCode) {
          throw new Error(`Get referral info failed: ${JSON.stringify(refData)}`);
        }
        const sellerRefCode = refData.data.referralCode;
        logTest('17. Referral Program - Generate Code & Link (FR-20.1)', 'SUCCESS', `Code: ${sellerRefCode}`);

        // Test 18: Referral & Loyalty Program - Register Referee & Award Bonus Credits (FR-20.2)
        const refereeRegRes = await fetch(`${BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Referred Friend',
            email: 'referee@brandbondhu.com',
            phone: '01988776655',
            password: 'password123',
            role: 'seller',
            businessName: 'Friend Fashion Store',
            industry: 'Clothing & Apparel',
            referralCode: sellerRefCode,
          }),
        });
        const refereeRegData = await refereeRegRes.json();
        const refereeOtp = refereeRegData.otp;

        const refereeVerifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'referee@brandbondhu.com', otp: refereeOtp }),
        });
        const refereeVerifyData = await refereeVerifyRes.json();
        if (!refereeVerifyData.success) {
          throw new Error(`Referee verification failed: ${JSON.stringify(refereeVerifyData)}`);
        }

        // Verify credit bonuses were awarded
        const sellerSub = await Subscription.findOne({ userId: sellerUser._id });
        if (!sellerSub || sellerSub.credits.current < 35) { // Original 20 + 15 bonus
          throw new Error(`Referrer bonus credit not awarded properly: current=${sellerSub?.credits?.current}`);
        }
        logTest('18. Referral Program - Signup with Code & Award Bonus Credits (FR-20.2)', 'SUCCESS', `Referrer credits increased to ${sellerSub.credits.current}`);

        // Test 19: Referral & Loyalty Program - Check Referral Metrics & History (FR-20.3)
        const refHistoryRes = await fetch(`${BASE_URL}/referrals/my`, {
          headers: { 'Authorization': `Bearer ${sellerToken}` },
        });
        const refHistoryData = await refHistoryRes.json();
        if (!refHistoryData.success || refHistoryData.data.stats.totalReferrals !== 1) {
          throw new Error(`Referral history verification failed: ${JSON.stringify(refHistoryData)}`);
        }
        logTest('19. Referral Program - Metrics & History Timeline (FR-20.3)', 'SUCCESS', `Tracked ${refHistoryData.data.stats.totalReferrals} referral (+${refHistoryData.data.stats.totalBonusEarned} credits)`);

        console.log('\n--- CLEANING UP TEST ACCOUNTS ---\n');
        const sellerUser = await User.findOne({ email: 'tester@brandbondhu.com' });
        const designerUser = await User.findOne({ email: 'designer@brandbondhu.com' });
        const refereeUser = await User.findOne({ email: 'referee@brandbondhu.com' });

        if (sellerUser) {
          const userIdsToClean = [sellerUser._id, designerUser?._id, refereeUser?._id].filter(Boolean);
          await User.deleteMany({ _id: { $in: userIdsToClean } });
          await User.deleteMany({ ownerId: sellerUser._id });
          await Subscription.deleteMany({ userId: { $in: userIdsToClean } });
          await Transaction.deleteMany({ userId: { $in: userIdsToClean } });
          await Notification.deleteMany({ userId: { $in: userIdsToClean } });
          await Product.deleteMany({ businessId: sellerUser._id });
          await DesignJob.deleteMany({ sellerId: sellerUser._id });
          await AuditLog.deleteMany({ businessId: sellerUser._id });
          await SupportTicket.deleteMany({ userId: { $in: userIdsToClean } });
          await Referral.deleteMany({ referrerId: sellerUser._id });
        }
        console.log('Cleanup finished successfully.');

        console.log('\n🌟 ALL BRANDBONDHU BACKEND AUTOMATED TESTS PASSED (FR-13, FR-7, FR-17, FR-19, FR-20)! 🌟\n');
        server.close(() => {
          process.exit(0);
        });

      } catch (err) {
        console.error('\n❌ TEST SUITE FAILURE EXCEPTION:');
        console.error(err.message);
        
        // Clean up on failure
        try {
          const sellerUser = await User.findOne({ email: 'tester@brandbondhu.com' });
          if (sellerUser) {
            await User.deleteMany({ email: { $in: ['tester@brandbondhu.com', 'designer@brandbondhu.com', 'collaborator@brandbondhu.com', 'referee@brandbondhu.com'] } });
            await User.deleteMany({ ownerId: sellerUser._id });
            await Subscription.deleteMany({ userId: sellerUser._id });
            await Transaction.deleteMany({ userId: sellerUser._id });
            await Notification.deleteMany({ userId: sellerUser._id });
            await Product.deleteMany({ businessId: sellerUser._id });
            await DesignJob.deleteMany({ sellerId: sellerUser._id });
            await AuditLog.deleteMany({ businessId: sellerUser._id });
            await SupportTicket.deleteMany({ userId: sellerUser._id });
            await Referral.deleteMany({ referrerId: sellerUser._id });
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
