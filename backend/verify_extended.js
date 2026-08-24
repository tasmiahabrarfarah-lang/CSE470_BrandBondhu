import mongoose from 'mongoose';
import app from './server.js';
import User from './models/User.js';
import Subscription from './models/Subscription.js';
import Transaction from './models/Transaction.js';
import Notification from './models/Notification.js';
import BrandKit from './models/BrandKit.js';
import ScheduledPost from './models/ScheduledPost.js';
import SocialComment from './models/SocialComment.js';
import DesignJob from './models/DesignJob.js';
import SubscriptionTier from './models/SubscriptionTier.js';

const PORT = 5199;
const BASE_URL = `http://localhost:${PORT}/api`;

const logTest = (step, status, details = '') => {
  const symbol = status === 'SUCCESS' ? '🟢' : '🔴';
  console.log(`${symbol} [${step}] - ${status} ${details ? `(${details})` : ''}`);
};

const runTests = async () => {
  let server;
  let mongod;
  try {
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      process.env.MONGO_URI = mongod.getUri();
      console.log(`Spinning up MongoMemoryServer at ${process.env.MONGO_URI}`);
    } catch (e) {
      // Fallback
    }

    server = app.listen(PORT, async () => {
      console.log(`Test server booted on port ${PORT}`);

      try {
        if (mongoose.connection.readyState !== 1) {
          await new Promise((resolve) => {
            mongoose.connection.once('open', resolve);
          });
        }

        // Clean up previous runs
        await User.deleteMany({ email: { $in: ['admin-test@brandbondhu.com', 'seller-test@brandbondhu.com', 'designer-test@brandbondhu.com'] } });

        console.log('\n--- STARTING BRANDBONDHU ADMIN & GAMIFICATION EXTENDED TESTS ---\n');

        // 1. Create Test Admin, Seller, Designer
        // We'll create admin directly in DB for safety since signup blocks admin role
        const adminUser = await User.create({
          name: 'Super Admin',
          email: 'admin-test@brandbondhu.com',
          phone: '01900000001',
          password: 'adminpassword',
          role: 'admin',
          status: 'active'
        });

        // Register test seller via register endpoint
        const registerSellerRes = await fetch(`${BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Gamified Seller',
            email: 'seller-test@brandbondhu.com',
            phone: '01900000002',
            password: 'sellerpassword',
            role: 'seller',
            businessName: 'Retro Clothing',
            industry: 'Fashion'
          })
        });
        const registerSellerData = await registerSellerRes.json();
        
        // Verify OTP to activate seller
        const verifySellerRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'seller-test@brandbondhu.com', otp: registerSellerData.otp })
        });
        const verifySellerData = await verifySellerRes.json();
        const sellerToken = verifySellerData.token;

        // Register test designer
        const registerDesignerRes = await fetch(`${BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Pro Designer',
            email: 'designer-test@brandbondhu.com',
            phone: '01900000003',
            password: 'designerpassword',
            role: 'designer'
          })
        });
        const registerDesignerData = await registerDesignerRes.json();
        await fetch(`${BASE_URL}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'designer-test@brandbondhu.com', otp: registerDesignerData.otp })
        });

        logTest('1. Create Admin, Seller, Designer', 'SUCCESS', 'Admin created directly; Seller and Designer activated via register/OTP flow');

        // Login as Admin to get Admin Token
        const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin-test@brandbondhu.com', password: 'adminpassword' })
        });
        const adminLoginData = await adminLoginRes.json();
        const adminToken = adminLoginData.token;
        logTest('2. Admin Log-In', 'SUCCESS', `Token issued: ${adminToken.substring(0, 15)}...`);

        // 2. Test Admin view user accounts list
        const viewUsersRes = await fetch(`${BASE_URL}/admin/users`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const viewUsersData = await viewUsersRes.json();
        if (!viewUsersData.success || viewUsersData.count < 3) {
          throw new Error('Admin failed to retrieve correct user list count');
        }
        logTest('3. Admin Retrieve User Accounts', 'SUCCESS', `Found ${viewUsersData.count} total accounts`);

        // 3. Test User Suspension Workflow
        const testSeller = await User.findOne({ email: 'seller-test@brandbondhu.com' });
        const suspendRes = await fetch(`${BASE_URL}/admin/users/${testSeller._id}/suspend`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const suspendData = await suspendRes.json();
        if (!suspendData.success || suspendData.data.status !== 'suspended') {
          throw new Error('Admin suspension endpoint failed');
        }
        logTest('4. Admin Suspend Seller Account', 'SUCCESS', `Status updated to: ${suspendData.data.status}`);

        // Confirm suspended seller is blocked from API calls
        const sellerProfileBlockRes = await fetch(`${BASE_URL}/gamification/profile`, {
          headers: { 'Authorization': `Bearer ${sellerToken}` }
        });
        if (sellerProfileBlockRes.status !== 403) {
          throw new Error(`Suspended user API call returned status ${sellerProfileBlockRes.status} instead of 403`);
        }
        logTest('5. Verify Suspended Account API Block', 'SUCCESS', 'Suspended seller got 403 Forbidden');

        // Confirm suspended seller is blocked from logging in
        const sellerLoginBlockRes = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'seller-test@brandbondhu.com', password: 'sellerpassword' })
        });
        if (sellerLoginBlockRes.status !== 403) {
          throw new Error('Suspended user login attempt allowed');
        }
        logTest('6. Verify Suspended Account Login Block', 'SUCCESS', 'Login attempt returned 403 Forbidden');

        // Unsuspend Seller
        const unsuspendRes = await fetch(`${BASE_URL}/admin/users/${testSeller._id}/unsuspend`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const unsuspendData = await unsuspendRes.json();
        if (!unsuspendData.success || unsuspendData.data.status !== 'active') {
          throw new Error('Admin unsuspension endpoint failed');
        }
        logTest('7. Admin Unsuspend Seller Account', 'SUCCESS', `Status updated to: ${unsuspendData.data.status}`);

        // 4. Test Marketplace Dispute Resolution
        const testDesigner = await User.findOne({ email: 'designer-test@brandbondhu.com' });
        // Create Design Job in Escrow
        const designJob = await DesignJob.create({
          sellerId: testSeller._id,
          designerId: testDesigner._id,
          requestedBy: testSeller._id,
          title: 'Retro Logo Poster',
          description: 'A poster for Retro Clothing',
          budget: 1500,
          escrowStatus: 'Held',
          status: 'Accepted'
        });

        // Seller raises dispute
        designJob.status = 'Disputed';
        designJob.disputeDetails = {
          raisedBy: testSeller._id,
          reason: 'Designer missed the deadline and stopped replying'
        };
        await designJob.save();
        logTest('8. Create Marketplace Dispute Ticket', 'SUCCESS', `Job ID: ${designJob._id}, Status: Disputed`);

        // Admin fetches dispute tickets
        const getDisputesRes = await fetch(`${BASE_URL}/admin/disputes`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const getDisputesData = await getDisputesRes.json();
        if (!getDisputesData.success || getDisputesData.count === 0) {
          throw new Error('Disputes listing endpoint failed');
        }
        logTest('9. Admin Fetch Dispute Tickets', 'SUCCESS', `Found ${getDisputesData.count} open disputes`);

        // Admin resolves dispute - refund seller
        const resolveRes = await fetch(`${BASE_URL}/admin/disputes/${designJob._id}/resolve`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            resolution: 'Designer did not provide timely updates. Refunding funds to seller.',
            resolveTo: 'seller'
          })
        });
        const resolveData = await resolveRes.json();
        if (!resolveData.success || resolveData.data.status !== 'Closed' || resolveData.data.escrowStatus !== 'Refunded') {
          throw new Error(`Resolve dispute failed: ${JSON.stringify(resolveData)}`);
        }
        logTest('10. Admin Moderate Dispute (Refund Seller)', 'SUCCESS', `Status: ${resolveData.data.status}, Escrow: ${resolveData.data.escrowStatus}`);

        // 5. Test Subscription Dynamic Pricing Tier Management
        const getPlansRes = await fetch(`${BASE_URL}/subscriptions/plans`);
        const getPlansData = await getPlansRes.json();
        const basicTierId = getPlansData.data.basic._id;

        const updateTierRes = await fetch(`${BASE_URL}/admin/pricing-tiers/${basicTierId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            name: 'Basic Brand Pro',
            price: 1199,
            credits: 150
          })
        });
        const updateTierData = await updateTierRes.json();
        if (!updateTierData.success || updateTierData.data.price !== 1199 || updateTierData.data.credits !== 150) {
          throw new Error('Dynamic subscription plan update failed');
        }
        logTest('11. Admin Manage Subscription Plans', 'SUCCESS', `Updated "Basic" pricing to: ৳${updateTierData.data.price}, Credits: ${updateTierData.data.credits}`);

        // 6. Test Gamification (Branding Score & Streak & Badges)
        // Let's seed Brand Kit Completeness assets
        await BrandKit.create({
          businessId: testSeller._id,
          createdBy: testSeller._id,
          versionName: 'V1',
          isActive: true,
          questionnaire: {
            businessName: 'Retro Clothing',
            industry: 'Fashion'
          },
          logo: {
            url: 'https://example.com/retro.png'
          },
          colorPalette: [{ hex: '#ff0000', type: 'primary' }],
          typography: { headingFont: 'Inter' },
          taglines: [{ en: 'Retro is Back', bn: 'রেট্রো ব্যাক' }]
        });

        // Let's seed posting consistency: 3 posts published in consecutive days
        const t = new Date();
        const d1 = new Date(); d1.setDate(t.getDate());
        const d2 = new Date(); d2.setDate(t.getDate() - 1);
        const d3 = new Date(); d3.setDate(t.getDate() - 2);

        await ScheduledPost.create([
          { businessId: testSeller._id, createdBy: testSeller._id, title: 'Post 1', caption: { activeText: 'P1' }, status: 'Published', publishedAt: d1 },
          { businessId: testSeller._id, createdBy: testSeller._id, title: 'Post 2', caption: { activeText: 'P2' }, status: 'Published', publishedAt: d2 },
          { businessId: testSeller._id, createdBy: testSeller._id, title: 'Post 3', caption: { activeText: 'P3' }, status: 'Published', publishedAt: d3 }
        ]);

        // Let's seed engagement: 1 positive comment
        await SocialComment.create({
          userId: testSeller._id,
          content: 'I love these retro shirts!',
          sentiment: 'positive'
        });

        // Fetch Seller's Gamification profile
        const gamificationRes = await fetch(`${BASE_URL}/gamification/profile`, {
          headers: { 'Authorization': `Bearer ${sellerToken}` }
        });
        const gamificationData = await gamificationRes.json();
        if (!gamificationData.success || gamificationData.data.brandingScore === 0) {
          throw new Error(`Gamification calculator returned zero or failed: ${JSON.stringify(gamificationData)}`);
        }

        // Expected Branding Score calculation:
        // Brand Kit: Complete (questionnaire=10, logo=10, colorPalette=5, typography=5) = 30 pts.
        // Posting Consistency: 3 posts = 15 pts + 3-Day streak = 9 pts. Total consistency = 24 pts.
        // Engagement: 1 positive comment = 5 pts.
        // Total Branding Score = 30 + 24 + 5 = 59 pts.
        if (gamificationData.data.brandingScore !== 59 || gamificationData.data.streakDays !== 3) {
          throw new Error(`Gamification calculator score/streak mismatch. Got Score: ${gamificationData.data.brandingScore}, Streak: ${gamificationData.data.streakDays}`);
        }
        logTest('12. Gamification Brand Score Recalculation', 'SUCCESS', `Calculated Branding Score: ${gamificationData.data.brandingScore}/100, Streak: ${gamificationData.data.streakDays}-Day`);

        // Check if "Brand Complete" badge was awarded
        const hasBrandCompleteBadge = gamificationData.data.badges.some(b => b.name === 'Brand Complete');
        if (!hasBrandCompleteBadge) {
          throw new Error('Seller did not receive the "Brand Complete" badge despite having all brand assets');
        }
        logTest('13. Gamification Badge Awards Check', 'SUCCESS', 'Awarded "Brand Complete" badge successfully');

        // Confirm notification was triggered for the badge
        const notificationsRes = await fetch(`${BASE_URL}/notifications`, {
          headers: { 'Authorization': `Bearer={${sellerToken}}`, 'Authorization': `Bearer ${sellerToken}` }
        });
        const notificationsData = await notificationsRes.json();
        const badgeNotification = notificationsData.data.some(n => n.title.includes('New Badge Earned'));
        if (!badgeNotification) {
          throw new Error('Badge award system notification was not created');
        }
        logTest('14. Gamification Notification System Integration', 'SUCCESS', 'Created in-app notification alert for badge award');

        // 7. Leaderboard and Opt-In Toggle
        // Toggle Opt-In
        const toggleLeaderboardRes = await fetch(`${BASE_URL}/gamification/leaderboard/toggle`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sellerToken}`
          },
          body: JSON.stringify({ optIn: true })
        });
        const toggleLeaderboardData = await toggleLeaderboardRes.json();
        if (!toggleLeaderboardData.success || !toggleLeaderboardData.optInLeaderboard) {
          throw new Error('Toggle opt-in leaderboard failed');
        }
        logTest('15. Gamification Leaderboard Toggle Opt-In', 'SUCCESS', 'Enabled opt-in visibility');

        // Fetch leaderboard ranking
        const leaderboardRes = await fetch(`${BASE_URL}/gamification/leaderboard`, {
          headers: { 'Authorization': `Bearer ${sellerToken}` }
        });
        const leaderboardData = await leaderboardRes.json();
        if (!leaderboardData.success || leaderboardData.data.length === 0) {
          throw new Error('Retrieve leaderboard rankings failed');
        }
        logTest('16. Retrieve Leaderboard Rankings (Same Industry)', 'SUCCESS', `Rank 1: ${leaderboardData.data[0].name} (Score: ${leaderboardData.data[0].brandingScore})`);

        // 8. Platform Analytics (Revenue & Usage stats check)
        const getAnalyticsRes = await fetch(`${BASE_URL}/admin/analytics`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const getAnalyticsData = await getAnalyticsRes.json();
        if (!getAnalyticsData.success || getAnalyticsData.data.usage.brandKits === 0) {
          throw new Error('Platform analytics details failed');
        }
        logTest('17. Admin View Platform-Wide Usage & Revenue Analytics', 'SUCCESS', `Platform has ${getAnalyticsData.data.users.total} users, ${getAnalyticsData.data.usage.brandKits} brand kits, and ৳${getAnalyticsData.data.revenue.totalRevenue} revenue`);

        console.log('\n--- CLEANING UP EXTENDED TEST ACCOUNTS ---\n');
        await User.deleteMany({ _id: { $in: [adminUser._id, testSeller._id, testDesigner._id] } });
        await Subscription.deleteMany({ userId: testSeller._id });
        await Notification.deleteMany({ userId: { $in: [testSeller._id, testDesigner._id] } });
        await BrandKit.deleteMany({ businessId: testSeller._id });
        await ScheduledPost.deleteMany({ businessId: testSeller._id });
        await SocialComment.deleteMany({ userId: testSeller._id });
        await DesignJob.deleteMany({ _id: designJob._id });
        
        // Reset basic pricing tier back to default
        await SubscriptionTier.findByIdAndUpdate(basicTierId, {
          name: 'Basic Brand',
          price: 999,
          credits: 100
        });

        console.log('Cleanup finished successfully.');
        console.log('\n🌟 ALL ADMIN AND GAMIFICATION TEST RUNS PASSED SUCCESSFULLY! 🌟\n');
        
        server.close(() => {
          process.exit(0);
        });

      } catch (err) {
        console.error('\n❌ TEST SUITE FAILURE EXCEPTION:');
        console.error(err.stack || err.message);

        // Clean up on failure
        try {
          const testSeller = await User.findOne({ email: 'seller-test@brandbondhu.com' });
          if (testSeller) {
            await User.deleteMany({ email: { $in: ['admin-test@brandbondhu.com', 'seller-test@brandbondhu.com', 'designer-test@brandbondhu.com'] } });
            await Subscription.deleteMany({ userId: testSeller._id });
            await Notification.deleteMany({ userId: testSeller._id });
            await BrandKit.deleteMany({ businessId: testSeller._id });
            await ScheduledPost.deleteMany({ businessId: testSeller._id });
            await SocialComment.deleteMany({ userId: testSeller._id });
            await DesignJob.deleteMany({ sellerId: testSeller._id });
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
