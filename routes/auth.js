const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const authController = require('../controllers/authController');

router.post('/login', asyncHandler(authController.login));
router.post('/logout', authController.logout);
router.get('/status', authController.getStatus);

module.exports = router;



