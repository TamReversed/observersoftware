const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const workController = require('../controllers/workController');

// Public routes
router.get('/work', asyncHandler(workController.getWork));

// Admin routes
router.get('/admin/work', requireAuth, asyncHandler(workController.getAllWork));
router.post('/admin/work', requireAuth, asyncHandler(workController.createWork));
router.put('/admin/work/:id', requireAuth, asyncHandler(workController.updateWork));
router.delete('/admin/work/:id', requireAuth, asyncHandler(workController.deleteWork));

module.exports = router;

