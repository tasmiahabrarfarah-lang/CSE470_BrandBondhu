import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import productRoutes from './routes/productRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import brandKitRoutes from './routes/brandKitRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';
import hashtagRoutes from './routes/hashtagRoutes.js';
import styleGuideRoutes from './routes/styleGuideRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import { seedPrebuiltTemplates } from './controllers/templateController.js';
import { seedSubscriptionTiers } from './controllers/subscriptionController.js';
import { seedDefaultAdmin } from './controllers/authController.js';
import ticketRoutes from './routes/ticketRoutes.js';
import referralRoutes from './routes/referralRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// CORS configurations
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Parsing middlewares
app.use(express.json());
app.use(cookieParser());

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/brand-kit', brandKitRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/hashtags', hashtagRoutes);
app.use('/api/style-guide', styleGuideRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/referrals', referralRoutes);

// Base API status route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', project: 'BrandBondhu', timestamp: new Date() });
});

// Resolve directory paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Production Static assets handler (Vercel/General deployment support)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('BrandBondhu API running in development mode');
  });
}

// Global Express error handler
app.use((err, req, res, next) => {
  console.error(`Error Stack: ${err.stack}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export default app;
