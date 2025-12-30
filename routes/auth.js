const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validateCsrfToken } = require('../middleware/csrf');
const { validateLogin, validateId } = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Password login (legacy fallback)
router.post('/login', validateCsrfToken, validateLogin, asyncHandler(authController.login));

// WebAuthn Registration
router.post('/webauthn/register/start', validateCsrfToken, asyncHandler(authController.startWebAuthnRegistration));
router.post('/webauthn/register/finish', validateCsrfToken, asyncHandler(authController.finishWebAuthnRegistration));

// WebAuthn Authentication
router.post('/webauthn/login/start', validateCsrfToken, asyncHandler(authController.startWebAuthnLogin));
router.post('/webauthn/login/finish', validateCsrfToken, asyncHandler(authController.finishWebAuthnLogin));

// Other routes
router.post('/logout', validateCsrfToken, authController.logout);
router.get('/status', authController.getStatus);
router.get('/csrf-token', authController.getCsrfToken);

// User management (admin only)
router.get('/users', requireAuth, asyncHandler(authController.getUsers));
router.post('/users', requireAuth, validateCsrfToken, asyncHandler(authController.createUser));
router.put('/users/:id/password', requireAuth, validateCsrfToken, validateId, asyncHandler(authController.resetPassword));
router.delete('/users/:id/passkeys', requireAuth, validateCsrfToken, validateId, asyncHandler(authController.revokePasskeys));
router.delete('/users/:id', requireAuth, validateCsrfToken, validateId, asyncHandler(authController.deleteUser));

module.exports = router;




