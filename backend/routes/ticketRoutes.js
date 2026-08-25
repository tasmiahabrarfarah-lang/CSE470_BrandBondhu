import express from 'express';
import {
  createTicket,
  getTickets,
  getTicketById,
  addResponse,
  updateTicketStatus,
  rateTicket,
  getTicketStats,
} from '../controllers/ticketController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public submission or protected submission
router.post('/', (req, res, next) => {
  // Check if token exists, apply protect middleware optionally
  if (req.headers.authorization || (req.cookies && req.cookies.token)) {
    return protect(req, res, next);
  }
  next();
}, createTicket);

// Authenticated ticket routes
router.get('/', protect, getTickets);
router.get('/admin/stats', protect, authorize('admin'), getTicketStats);
router.get('/:id', protect, getTicketById);
router.post('/:id/responses', protect, addResponse);
router.put('/:id/status', protect, updateTicketStatus);
router.post('/:id/rate', protect, rateTicket);

export default router;
