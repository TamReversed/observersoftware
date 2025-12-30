const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { validateCsrfToken } = require('../middleware/csrf');
const { validateId } = require('../middleware/validation');
const testimonialsController = require('../controllers/testimonialsController');

// Public route
router.get('/testimonials', asyncHandler(testimonialsController.getTestimonials));

// Admin routes
router.get('/admin/testimonials', requireAuth, asyncHandler(testimonialsController.getAllTestimonials));
router.post('/admin/testimonials', requireAuth, validateCsrfToken, asyncHandler(testimonialsController.createTestimonial));
router.put('/admin/testimonials/:id', requireAuth, validateCsrfToken, validateId, asyncHandler(testimonialsController.updateTestimonial));
router.delete('/admin/testimonials/:id', requireAuth, validateCsrfToken, validateId, asyncHandler(testimonialsController.deleteTestimonial));

module.exports = router;
