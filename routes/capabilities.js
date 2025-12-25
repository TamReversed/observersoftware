const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const capabilitiesController = require('../controllers/capabilitiesController');

// Public routes
router.get('/capabilities', asyncHandler(capabilitiesController.getCapabilities));
router.get('/capabilities/:id', asyncHandler(capabilitiesController.getCapabilityById));

// Admin routes
router.get('/admin/capabilities', requireAuth, asyncHandler(capabilitiesController.getAllCapabilities));
router.post('/admin/capabilities', requireAuth, asyncHandler(capabilitiesController.createCapability));
router.put('/admin/capabilities/:id', requireAuth, asyncHandler(capabilitiesController.updateCapability));
router.delete('/admin/capabilities/:id', requireAuth, asyncHandler(capabilitiesController.deleteCapability));

module.exports = router;

