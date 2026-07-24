import Transaction from '../models/Transaction.js';
import Subscription from '../models/Subscription.js';
import Notification from '../models/Notification.js';
import { SUBSCRIPTION_TIERS } from './subscriptionController.js';
import { sendEmail } from '../utils/email.js';

// @desc    Initiate a simulated payment process
// @route   POST /api/payments/initiate
// @access  Private (Seller only)
export const initiatePayment = async (req, res) => {
  try {
    const { tier, gateway } = req.body;

    if (!SUBSCRIPTION_TIERS[tier]) {
      return res.status(400).json({ success: false, message: 'Invalid subscription tier selected' });
    }

    if (!['bkash', 'nagad', 'card'].includes(gateway)) {
      return res.status(400).json({ success: false, message: 'Invalid payment gateway selection' });
    }

    const plan = SUBSCRIPTION_TIERS[tier];
    const amount = plan.price;

    // Generate unique txn reference
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
    const transactionId = `TXN-${gateway.toUpperCase()}-${randomHex}`;

    // Generate invoice sequence
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceNum = `INV-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

    const transaction = await Transaction.create({
      userId: req.user.id,
      amount,
      currency: 'BDT',
      paymentGateway: gateway,
      paymentStatus: 'pending',
      transactionId,
      subscriptionTier: tier,
      invoiceNumber: invoiceNum,
    });

    res.status(200).json({
      success: true,
      message: 'Payment initialized successfully',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Confirm payment and upgrade subscription
// @route   POST /api/payments/confirm
// @access  Private (Seller only)
export const confirmPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;

    const transaction = await Transaction.findOne({ transactionId, userId: req.user.id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction record not found' });
    }

    if (transaction.paymentStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Transaction already completed' });
    }

    // Set payment status to completed
    transaction.paymentStatus = 'completed';
    await transaction.save();

    // Fetch corresponding tier specifications
    const tierConfig = SUBSCRIPTION_TIERS[transaction.subscriptionTier];

    // Find and update or create subscription details
    let subscription = await Subscription.findOne({ userId: req.user.id });
    if (!subscription) {
      subscription = new Subscription({ userId: req.user.id });
    }

    subscription.tier = transaction.subscriptionTier;
    subscription.status = 'active';
    subscription.credits.current = (subscription.credits.current || 0) + tierConfig.credits;
    subscription.credits.total = tierConfig.credits;
    subscription.startDate = new Date();
    subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Add 30 days
    await subscription.save();

    // Trigger in-app notification
    await Notification.create({
      userId: req.user.id,
      title: 'Payment Completed',
      message: `Your payment of ${transaction.amount} BDT via ${transaction.paymentGateway.toUpperCase()} was successful. ${tierConfig.name} plan activated with ${tierConfig.credits} credits!`,
      type: 'payment',
    });

    // Send transactional invoice email details
    const emailBody = `
      Hello ${req.user.name},
      
      Thank you for your purchase on BrandBondhu!
      
      Your payment has been successfully processed. Here is a summary:
      - Invoice Number: ${transaction.invoiceNumber}
      - Transaction ID: ${transaction.transactionId}
      - Plan: ${tierConfig.name}
      - Amount Paid: ${transaction.amount} BDT
      - Payment Method: ${transaction.paymentGateway.toUpperCase()}
      - Expiry Date: ${subscription.endDate.toLocaleDateString()}
      
      You can download your detailed printable receipt from your Account Billing dashboard.
      
      Best Regards,
      Team BrandBondhu
    `;

    await sendEmail({
      to: req.user.email,
      subject: `BrandBondhu - Payment Invoice ${transaction.invoiceNumber}`,
      text: emailBody,
    });

    res.status(200).json({
      success: true,
      message: 'Payment completed and subscription active',
      data: {
        transaction,
        subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all billing transactions for current user
// @route   GET /api/payments/history
// @access  Private (Seller only)
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
