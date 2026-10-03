const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { validateCsrfToken } = require('../middleware/csrf');
const { validateMessage } = require('../middleware/validation');
const messagesController = require('../controllers/messagesController');

// Public route - anyone can submit a message
router.post('/messages', validateMessage, asyncHandler(messagesController.createMessage));

// Admin routes - require authentication
router.get('/admin/messages', requireAuth, asyncHandler(messagesController.getAllMessages));
router.get('/admin/messages/unread-count', requireAuth, asyncHandler(messagesController.getUnreadCount));
router.get('/admin/messages/:id', requireAuth, asyncHandler(messagesController.getMessageById));
router.put('/admin/messages/:id/read', requireAuth, validateCsrfToken, asyncHandler(messagesController.markAsRead));
router.delete('/admin/messages/:id', requireAuth, validateCsrfToken, asyncHandler(messagesController.deleteMessage));

module.exports = router;

