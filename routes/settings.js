const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validateCsrfToken } = require('../middleware/csrf');
const settingsController = require('../controllers/settingsController');

// Public route - get settings for rendering
router.get('/settings', asyncHandler(settingsController.getSettings));

// Admin routes
router.get('/admin/settings', requireAdmin, asyncHandler(settingsController.getAllSettings));
router.get('/admin/settings/:key', requireAdmin, asyncHandler(settingsController.getSetting));
router.put('/admin/settings/:key', requireAdmin, validateCsrfToken, asyncHandler(settingsController.updateSetting));
router.put('/admin/settings', requireAdmin, validateCsrfToken, asyncHandler(settingsController.updateSettings));

module.exports = router;
