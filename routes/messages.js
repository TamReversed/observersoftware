const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validateCsrfToken } = require('../middleware/csrf');
const { validateMessage } = require('../middleware/validation');
const messagesController = require('../controllers/messagesController');

// Public route - anyone can submit a message
router.post('/messages', validateMessage, asyncHandler(messagesController.createMessage));

// Admin routes - require authentication
router.get('/admin/messages', requireAdmin, asyncHandler(messagesController.getAllMessages));
router.get('/admin/messages/unread-count', requireAdmin, asyncHandler(messagesController.getUnreadCount));
router.get('/admin/messages/:id', requireAdmin, asyncHandler(messagesController.getMessageById));
router.put('/admin/messages/:id/read', requireAdmin, validateCsrfToken, asyncHandler(messagesController.markAsRead));
router.delete('/admin/messages/:id', requireAdmin, validateCsrfToken, asyncHandler(messagesController.deleteMessage));

module.exports = router;

