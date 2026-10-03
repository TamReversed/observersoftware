const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validateCsrfToken } = require('../middleware/csrf');
const { validateLogin, validateId } = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');
const authController = require('../controllers/authController');
const totpController = require('../controllers/totpController');

// Password login (legacy fallback)
router.post('/login', validateCsrfToken, validateLogin, asyncHandler(authController.login));

// WebAuthn Registration
router.post('/webauthn/register/start', validateCsrfToken, asyncHandler(authController.startWebAuthnRegistration));
router.post('/webauthn/register/finish', validateCsrfToken, asyncHandler(authController.finishWebAuthnRegistration));

// WebAuthn Authentication
router.post('/webauthn/login/start', validateCsrfToken, asyncHandler(authController.startWebAuthnLogin));
router.post('/webauthn/login/finish', validateCsrfToken, asyncHandler(authController.finishWebAuthnLogin));

// One-time code sign-in (the 6-digit code from Dashlane) and its setup
router.post('/totp/login', validateCsrfToken, asyncHandler(totpController.login));
router.post('/totp/setup', requireAuth, validateCsrfToken, asyncHandler(totpController.setup));
router.post('/totp/enable', requireAuth, validateCsrfToken, asyncHandler(totpController.enable));
router.post('/totp/disable', requireAuth, validateCsrfToken, asyncHandler(totpController.disable));
router.delete('/users/:id/totp', requireAuth, validateCsrfToken, validateId, asyncHandler(totpController.adminReset));

// Other routes
router.post('/logout', validateCsrfToken, authController.logout);
router.get('/status', authController.getStatus);
router.get('/csrf-token', authController.getCsrfToken);
router.get('/signin-config', authController.getSigninConfig);

// User management (admin only)
router.get('/users', requireAuth, asyncHandler(authController.getUsers));
router.post('/users', requireAuth, validateCsrfToken, asyncHandler(authController.createUser));
router.put('/users/:id/password', requireAuth, validateCsrfToken, validateId, asyncHandler(authController.resetPassword));
router.delete('/users/:id/passkeys', requireAuth, validateCsrfToken, validateId, asyncHandler(authController.revokePasskeys));
router.delete('/users/:id', requireAuth, validateCsrfToken, validateId, asyncHandler(authController.deleteUser));

module.exports = router;




