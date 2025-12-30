const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { validateCsrfToken } = require('../middleware/csrf');
const { validateId } = require('../middleware/validation');
const changelogController = require('../controllers/changelogController');

// Public route
router.get('/changelog', asyncHandler(changelogController.getChangelog));

// Admin routes
router.get('/admin/changelog', requireAuth, asyncHandler(changelogController.getAllChangelog));
router.post('/admin/changelog', requireAuth, validateCsrfToken, asyncHandler(changelogController.createChangelog));
router.put('/admin/changelog/:id', requireAuth, validateCsrfToken, validateId, asyncHandler(changelogController.updateChangelog));
router.delete('/admin/changelog/:id', requireAuth, validateCsrfToken, validateId, asyncHandler(changelogController.deleteChangelog));

module.exports = router;
