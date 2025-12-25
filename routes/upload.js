const express = require('express');
const router = express.Router();
const { upload, uploadScreenshot } = require('../controllers/uploadController');
const { requireAuth } = require('../middleware/auth');

// Upload screenshot (requires authentication)
router.post('/upload/screenshot', requireAuth, upload.single('screenshot'), uploadScreenshot);

module.exports = router;

