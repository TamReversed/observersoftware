const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { validateCsrfToken } = require('../middleware/csrf');
const c = require('../controllers/siteContentController');

// Every route here is admin-only; every change also needs the CSRF token
router.get('/admin/site-content', requireAuth, asyncHandler(c.get));
router.put('/admin/site-content/draft', requireAuth, validateCsrfToken, asyncHandler(c.saveDraft));
router.post('/admin/site-content/publish', requireAuth, validateCsrfToken, asyncHandler(c.publish));
router.post('/admin/site-content/discard', requireAuth, validateCsrfToken, asyncHandler(c.discard));
router.post('/admin/site-content/restore/:id', requireAuth, validateCsrfToken, asyncHandler(c.restore));

module.exports = router;
