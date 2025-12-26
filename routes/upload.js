const express = require('express');
const router = express.Router();
const { upload, uploadScreenshot } = require('../controllers/uploadController');
const { requireAuth } = require('../middleware/auth');
const { validateCsrfToken } = require('../middleware/csrf');

// Upload screenshot (requires authentication and CSRF)
router.post('/upload/screenshot', requireAuth, validateCsrfToken, upload.single('screenshot'), uploadScreenshot);

module.exports = router;

