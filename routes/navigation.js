const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { validateCsrfToken } = require('../middleware/csrf');
const { validateId } = require('../middleware/validation');
const navigationController = require('../controllers/navigationController');

// Public routes
router.get('/navigation', asyncHandler(navigationController.getNavigation));
router.get('/navigation/:location', asyncHandler(navigationController.getNavigationByLocation));

// Admin routes
router.get('/admin/navigation', requireAuth, asyncHandler(navigationController.getAllNavigation));
router.post('/admin/navigation', requireAuth, validateCsrfToken, asyncHandler(navigationController.createNavigation));
router.put('/admin/navigation/reorder', requireAuth, validateCsrfToken, asyncHandler(navigationController.reorderNavigation));
router.put('/admin/navigation/:id', requireAuth, validateCsrfToken, validateId, asyncHandler(navigationController.updateNavigation));
router.delete('/admin/navigation/:id', requireAuth, validateCsrfToken, validateId, asyncHandler(navigationController.deleteNavigation));

module.exports = router;
