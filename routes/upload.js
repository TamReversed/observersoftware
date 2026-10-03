const express = require('express');
const router = express.Router();
const { upload, uploadScreenshot } = require('../controllers/uploadController');
const { requireAuth } = require('../middleware/auth');
const { validateCsrfToken } = require('../middleware/csrf');

// Upload screenshot (requires authentication and CSRF)
// Multer errors (wrong type, too large) are client errors, not 500s
const handleUpload = (req, res, next) => {
  upload.single('screenshot')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

router.post('/upload/screenshot', requireAuth, validateCsrfToken, handleUpload, uploadScreenshot);

module.exports = router;

