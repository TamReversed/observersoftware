const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const postsRoutes = require('./posts');
const workRoutes = require('./work');
const capabilitiesRoutes = require('./capabilities');
const uploadRoutes = require('./upload');

router.use('/api/auth', authRoutes);
router.use('/api', postsRoutes);
router.use('/api', workRoutes);
router.use('/api', capabilitiesRoutes);
router.use('/api', uploadRoutes);

module.exports = router;



