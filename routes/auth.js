const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validateCsrfToken } = require('../middleware/csrf');
const { validateLogin } = require('../middleware/validation');
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

module.exports = router;




