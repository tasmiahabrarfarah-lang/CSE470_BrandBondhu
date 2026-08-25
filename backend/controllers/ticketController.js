import SupportTicket from '../models/SupportTicket.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Helper to generate unique ticket ID
const generateTicketId = () => {
  const timestamp = Date.now().toString().slice(-5);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TICK-${timestamp}${random}`;
};

// @desc    Submit a support ticket (FR-19.1)
// @route   POST /api/tickets
// @access  Public / Private
export const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, description, attachments, guestName, guestEmail } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Subject and description are required' });
    }

    const ticketData = {
      ticketId: generateTicketId(),
      subject,
      category: category || 'General Inquiry',
      priority: priority || 'Medium',
      description,
      attachments: attachments || [],
      status: 'Open',
    };

    if (req.user) {
      ticketData.userId = req.user.id;
    } else {
      if (!guestName || !guestEmail) {
        return res.status(400).json({ success: false, message: 'Name and email are required for guest support tickets' });
      }
      ticketData.guestInfo = { name: guestName, email: guestEmail };
    }

    const ticket = await SupportTicket.create(ticketData);

    // If logged in, create a notification
    if (req.user) {
      await Notification.create({
        userId: req.user.id,
        title: 'Support Ticket Created',
        message: `Your support ticket #${ticket.ticketId} "${ticket.subject}" has been received. Our team will respond shortly.`,
        type: 'system',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully',
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tickets (FR-19.2)
// @route   GET /api/tickets
// @access  Private
export const getTickets = async (req, res) => {
  try {
    const { status, category } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }

    if (status && status !== 'All') {
      query.status = status;
    }
    if (category && category !== 'All') {
      query.category = category;
    }

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'name email role profilePicture')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get ticket by ID or ticketId
// @route   GET /api/tickets/:id
// @access  Private
export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'name email role profilePicture')
      .populate('responses.senderId', 'name email role profilePicture');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    // Access control
    if (req.user.role !== 'admin' && ticket.userId?.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this ticket' });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add response/message to support ticket (FR-19.2)
// @route   POST /api/tickets/:id/responses
// @access  Private
export const addResponse = async (req, res) => {
  try {
    const { message, attachments } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Response message cannot be empty' });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    // Check permission
    const isOwner = ticket.userId && ticket.userId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this ticket' });
    }

    const responseObj = {
      senderId: req.user.id,
      senderRole: req.user.role,
      senderName: req.user.name,
      message,
      attachments: attachments || [],
    };

    ticket.responses.push(responseObj);

    // Status handling
    if (isAdmin && (ticket.status === 'Open' || ticket.status === 'Reopened')) {
      ticket.status = 'In Progress';
    } else if (isOwner && (ticket.status === 'Resolved' || ticket.status === 'Closed')) {
      ticket.status = 'Reopened'; // Alternate lifecycle path: Reopened
    }

    await ticket.save();

    // Send status change or new reply Notification (FR-19.3)
    if (isAdmin && ticket.userId) {
      await Notification.create({
        userId: ticket.userId,
        title: `Reply on Ticket #${ticket.ticketId}`,
        message: `Admin ${req.user.name} responded: "${message.substring(0, 50)}..."`,
        type: 'system',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Response added to ticket',
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update ticket status (FR-19.2, FR-19.3)
// @route   PUT /api/tickets/:id/status
// @access  Private
export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Open', 'In Progress', 'Resolved', 'Closed', 'Reopened'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket status' });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    const isOwner = ticket.userId && ticket.userId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update ticket status' });
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    await ticket.save();

    // Notify ticket creator when status changes (FR-19.3)
    if (ticket.userId && oldStatus !== status) {
      await Notification.create({
        userId: ticket.userId,
        title: `Ticket #${ticket.ticketId} Status Updated`,
        message: `Your ticket status changed from "${oldStatus}" to "${status}".`,
        type: 'alert',
      });
    }

    res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status}`,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Rate support experience after resolution (FR-19.4)
// @route   POST /api/tickets/:id/rate
// @access  Private
export const rateTicket = async (req, res) => {
  try {
    const { stars, feedback } = req.body;

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ success: false, message: 'Please provide a star rating between 1 and 5' });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    if (ticket.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Only ticket owner can rate support experience' });
    }

    if (ticket.status !== 'Resolved' && ticket.status !== 'Closed') {
      return res.status(400).json({ success: false, message: 'You can only rate resolved or closed tickets' });
    }

    ticket.rating = {
      stars,
      feedback: feedback || '',
      ratedAt: new Date(),
    };

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Thank you for rating your support experience!',
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get support ticket statistics (Admin)
// @route   GET /api/tickets/admin/stats
// @access  Private (Admin)
export const getTicketStats = async (req, res) => {
  try {
    const total = await SupportTicket.countDocuments();
    const open = await SupportTicket.countDocuments({ status: 'Open' });
    const inProgress = await SupportTicket.countDocuments({ status: 'In Progress' });
    const resolved = await SupportTicket.countDocuments({ status: 'Resolved' });
    const closed = await SupportTicket.countDocuments({ status: 'Closed' });

    const ratedTickets = await SupportTicket.find({ 'rating.stars': { $ne: null } });
    const avgRating = ratedTickets.length > 0
      ? (ratedTickets.reduce((acc, curr) => acc + curr.rating.stars, 0) / ratedTickets.length).toFixed(1)
      : '0.0';

    res.status(200).json({
      success: true,
      data: {
        total,
        open,
        inProgress,
        resolved,
        closed,
        ratedCount: ratedTickets.length,
        avgRating,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
