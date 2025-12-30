const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { validateCsrfToken } = require('../middleware/csrf');
const homepageController = require('../controllers/homepageController');

// Public routes
router.get('/homepage', asyncHandler(homepageController.getHomepage));
router.get('/homepage/:section', asyncHandler(homepageController.getSection));

// Admin routes
router.get('/admin/homepage', requireAuth, asyncHandler(homepageController.getAllSections));
router.put('/admin/homepage/:section', requireAuth, validateCsrfToken, asyncHandler(homepageController.updateSection));

module.exports = router;
