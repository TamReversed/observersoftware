const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { validateCsrfToken } = require('../middleware/csrf');
const { validateId } = require('../middleware/validation');
const faqsController = require('../controllers/faqsController');

// Public routes
router.get('/faqs', asyncHandler(faqsController.getFaqs));
router.get('/faqs/:category', asyncHandler(faqsController.getFaqsByCategory));

// Admin routes
router.get('/admin/faqs', requireAuth, asyncHandler(faqsController.getAllFaqs));
router.post('/admin/faqs', requireAuth, validateCsrfToken, asyncHandler(faqsController.createFaq));
router.put('/admin/faqs/reorder', requireAuth, validateCsrfToken, asyncHandler(faqsController.reorderFaqs));
router.put('/admin/faqs/:id', requireAuth, validateCsrfToken, validateId, asyncHandler(faqsController.updateFaq));
router.delete('/admin/faqs/:id', requireAuth, validateCsrfToken, validateId, asyncHandler(faqsController.deleteFaq));

module.exports = router;
