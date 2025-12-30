const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { validateCsrfToken } = require('../middleware/csrf');
const { validateId } = require('../middleware/validation');
const mediaController = require('../controllers/mediaController');

// Public route
router.get('/media', asyncHandler(mediaController.getMedia));

// Admin routes
router.get('/admin/media', requireAuth, asyncHandler(mediaController.getAllMedia));
router.get('/admin/media/:id', requireAuth, validateId, asyncHandler(mediaController.getMediaById));
router.post('/admin/media', requireAuth, validateCsrfToken, asyncHandler(mediaController.createMedia));
router.put('/admin/media/:id', requireAuth, validateCsrfToken, validateId, asyncHandler(mediaController.updateMedia));
router.delete('/admin/media/:id', requireAuth, validateCsrfToken, validateId, asyncHandler(mediaController.deleteMedia));

module.exports = router;
