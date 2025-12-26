const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { validateCsrfToken } = require('../middleware/csrf');
const { validateCapability, validateId } = require('../middleware/validation');
const capabilitiesController = require('../controllers/capabilitiesController');

// Public routes
router.get('/capabilities', asyncHandler(capabilitiesController.getCapabilities));
router.get('/capabilities/:id', validateId, asyncHandler(capabilitiesController.getCapabilityById));

// Admin routes
router.get('/admin/capabilities', requireAuth, asyncHandler(capabilitiesController.getAllCapabilities));
router.post('/admin/capabilities', requireAuth, validateCsrfToken, validateCapability, asyncHandler(capabilitiesController.createCapability));
router.put('/admin/capabilities/:id', requireAuth, validateCsrfToken, validateId, validateCapability, asyncHandler(capabilitiesController.updateCapability));
router.delete('/admin/capabilities/:id', requireAuth, validateCsrfToken, validateId, asyncHandler(capabilitiesController.deleteCapability));

module.exports = router;

