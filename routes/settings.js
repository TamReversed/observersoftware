const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { validateCsrfToken } = require('../middleware/csrf');
const settingsController = require('../controllers/settingsController');

// Public route - get settings for rendering
router.get('/settings', asyncHandler(settingsController.getSettings));

// Admin routes
router.get('/admin/settings', requireAuth, asyncHandler(settingsController.getAllSettings));
router.get('/admin/settings/:key', requireAuth, asyncHandler(settingsController.getSetting));
router.put('/admin/settings/:key', requireAuth, validateCsrfToken, asyncHandler(settingsController.updateSetting));
router.put('/admin/settings', requireAuth, validateCsrfToken, asyncHandler(settingsController.updateSettings));

module.exports = router;
