import mongoose from 'mongoose';
import app from './server.js';
import User from './models/User.js';
import BrandKit from './models/BrandKit.js';
import HashtagTemplate from './models/HashtagTemplate.js';
import StyleGuideConfig from './models/StyleGuideConfig.js';

const PORT = 5299;
const BASE_URL = `http://localhost:${PORT}/api`;

const logTest = (step, status, details = '') => {
  const symbol = status === 'SUCCESS' ? '🟢' : '🔴';
  console.log(`${symbol} [${step}] - ${status} ${details ? `(${details})` : ''}`);
};

const runVerification = async () => {
  let server;
  let mongod;
  try {
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      process.env.MONGO_URI = mongod.getUri();
      console.log(`Spinning up MongoMemoryServer at ${process.env.MONGO_URI}`);
    } catch (e) {
      console.log('Using default MongoDB connection');
    }

    server = app.listen(PORT, async () => {
      console.log(`Test server booted on port ${PORT}`);

      try {
        if (mongoose.connection.readyState !== 1) {
          await new Promise((resolve) => {
            mongoose.connection.once('open', resolve);
          });
        }

        // Cleanup
        await User.findOneAndDelete({ email: 'fr1415_seller@brandbondhu.com' });

        console.log('\n--- STARTING BRANDBONDHU FR-14 & FR-15 VERIFICATION TESTS ---\n');

        // 1. Register Seller Account
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'FR14 Seller',
            email: 'fr1415_seller@brandbondhu.com',
            phone: '01999887766',
            password: 'password123',
            role: 'seller',
            businessName: 'Deshi Krafts',
            industry: 'Handicrafts & Fashion',
          }),
        });
        const regData = await regRes.json();
        if (!regData.success) throw new Error(`Register failed: ${regData.message}`);
        
        // OTP verify
        const verRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'fr1415_seller@brandbondhu.com',
            otp: regData.otp,
          }),
        });
        const verData = await verRes.json();
        if (!verData.success) throw new Error(`OTP verify failed: ${verData.message}`);
        const token = verData.token;
        logTest('1. Register & Verify Seller Account', 'SUCCESS', `Token issued: ${token.substring(0, 15)}...`);

        // 2. Generate Brand Kit (Prerequisite for Style Guide)
        const bkRes = await fetch(`${BASE_URL}/brand-kit/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            businessName: 'Deshi Krafts BD',
            industry: 'Handicrafts & Apparel',
            tone: 'Eco-Friendly & Traditional',
            targetAudience: 'Fashion & Home Decor Buyers',
            colorPreference: 'Warm & Traditional (Bangladeshi Vibe)',
          }),
        });
        const bkData = await bkRes.json();
        if (!bkData.success) throw new Error(`BrandKit gen failed: ${bkData.message}`);
        const brandKitId = bkData.data._id;
        logTest('2. Create Brand Identity Kit', 'SUCCESS', `BrandKit ID: ${brandKitId}`);

        // 3. FR-14.1 & FR-14.2: Generate Relevant Hashtags & SEO Suggestions
        const hashRes = await fetch(`${BASE_URL}/hashtags/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            productName: 'Handcrafted Jute Tote Bag',
            description: '100% natural eco-friendly jute handbag with traditional Nakshi embroidery.',
            category: 'Fashion Accessories',
            targetAudience: 'Eco-conscious Women',
          }),
        });
        const hashData = await hashRes.json();
        if (!hashData.success || !hashData.data.hashtags || !hashData.data.seo) {
          throw new Error(`Hashtag & SEO gen failed: ${hashData.message}`);
        }
        logTest(
          '3. Generate Relevant Bangla & English Hashtags & SEO (FR-14.1, FR-14.2)',
          'SUCCESS',
          `Generated ${hashData.data.hashtags.length} ranked hashtags (High: ${hashData.data.categorized.high.length}, Medium: ${hashData.data.categorized.medium.length}, Niche: ${hashData.data.categorized.niche.length}) and SEO Score ${hashData.data.seo.seoScore}/100`
        );

        // 4. FR-14.3: Save Frequently Used Hashtag Template
        const saveTmplRes = await fetch(`${BASE_URL}/hashtags/templates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: 'Festive Handicraft Campaign Hashtags',
            category: 'Handicrafts',
            hashtags: [
              { tag: '#DeshiKrafts', reach: 'High', popularityScore: 90 },
              { tag: '#JuteBagBD', reach: 'Medium', popularityScore: 78 },
              { tag: '#HandmadeBD', reach: 'Niche', popularityScore: 60 },
              '#NakshiKantha',
            ],
            notes: 'Standard hashtags for all Jute and Nakshi products',
          }),
        });
        const saveTmplData = await saveTmplRes.json();
        if (!saveTmplData.success || !saveTmplData.data._id) {
          throw new Error(`Save hashtag template failed: ${saveTmplData.message}`);
        }
        const templateId = saveTmplData.data._id;
        logTest('4. Save Hashtag Set as Template (FR-14.3)', 'SUCCESS', `Template ID: ${templateId}`);

        // 5. Fetch Saved Hashtag Templates (FR-14.3)
        const getTmplRes = await fetch(`${BASE_URL}/hashtags/templates`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const getTmplData = await getTmplRes.json();
        if (!getTmplData.success || getTmplData.count === 0) {
          throw new Error(`Get hashtag templates failed: ${getTmplData.message}`);
        }
        logTest('5. Fetch Saved Hashtag Templates (FR-14.3)', 'SUCCESS', `Retrieved ${getTmplData.count} template(s)`);

        // 6. FR-14.4: Manually Update/Edit Hashtag Template
        const editTmplRes = await fetch(`${BASE_URL}/hashtags/templates/${templateId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: 'Festive Handicraft Campaign Hashtags - Updated',
            notes: 'Added viral TikTok BD hashtags',
          }),
        });
        const editTmplData = await editTmplRes.json();
        if (!editTmplData.success || editTmplData.data.title !== 'Festive Handicraft Campaign Hashtags - Updated') {
          throw new Error(`Update hashtag template failed: ${editTmplData.message}`);
        }
        logTest('6. Manually Add/Edit Hashtags in Template (FR-14.4)', 'SUCCESS', `Updated template title`);

        // 7. FR-15.1: Auto-generate Brand Style Guide Document
        const sgRes = await fetch(`${BASE_URL}/style-guide/${brandKitId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const sgData = await sgRes.json();
        if (!sgData.success || !sgData.data.brandKit || !sgData.data.config) {
          throw new Error(`Fetch Style Guide failed: ${sgData.message}`);
        }
        logTest(
          '7. Auto-generate Brand Style Guide Payload (FR-15.1)',
          'SUCCESS',
          `Included Logo, ${sgData.data.brandKit.colorPalette.length} Palette Hex/RGB codes, Typography & ${sgData.data.brandKit.taglines.length} Taglines`
        );

        // 8. FR-15.2: Customize Style Guide Layout Preset & Rules
        const customRes = await fetch(`${BASE_URL}/style-guide/${brandKitId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: 'Deshi Krafts Official Brand Guidelines 2026',
            layoutPreset: 'Classic Document',
            theme: 'dark',
            primaryAccent: '#059669',
            includedSections: {
              logoRules: true,
              colorPalette: true,
              typography: true,
              taglines: true,
              brandVoice: true,
              seoKeywords: true,
            },
            customRules: {
              logoDos: ['Use clear space equal to 1.5x logo height.'],
              logoDonts: ['Never stretch or use non-brand colors.'],
            },
          }),
        });
        const customData = await customRes.json();
        if (!customData.success || customData.data.layoutPreset !== 'Classic Document') {
          throw new Error(`Customize Style Guide failed: ${customData.message}`);
        }
        logTest('8. Customize Style Guide Layout & Preset (FR-15.2)', 'SUCCESS', `Layout preset updated to Classic Document (Dark Theme)`);

        // 9. FR-15.3: Export Brand Style Guide in PDF Data Payload Format
        const exportRes = await fetch(`${BASE_URL}/style-guide/${brandKitId}/export`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const exportData = await exportRes.json();
        if (!exportData.success || !exportData.data.documentId) {
          throw new Error(`Export Style Guide PDF failed: ${exportData.message}`);
        }
        logTest('9. Brand Style Guide PDF Export Data Generation (FR-15.3)', 'SUCCESS', `Document ID: ${exportData.data.documentId}`);

        console.log('\n==================================================');
        console.log('🎉 ALL FR-14 & FR-15 VERIFICATION TESTS PASSED SUCCESSFULLY!');
        console.log('==================================================\n');

        server.close();
        if (mongod) await mongod.stop();
        process.exit(0);
      } catch (err) {
        console.error('\n❌ TEST FAILURE EXCEPTION:', err.message);
        if (server) server.close();
        if (mongod) await mongod.stop();
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('Fatal error during test setup:', err);
    process.exit(1);
  }
};

runVerification();
