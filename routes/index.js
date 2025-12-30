const express = require('express');
const router = express.Router();

// Existing routes
const authRoutes = require('./auth');
const postsRoutes = require('./posts');
const workRoutes = require('./work');
const capabilitiesRoutes = require('./capabilities');
const uploadRoutes = require('./upload');
const messagesRoutes = require('./messages');

// New admin panel routes
const settingsRoutes = require('./settings');
const categoriesRoutes = require('./categories');
const changelogRoutes = require('./changelog');
const homepageRoutes = require('./homepage');
const navigationRoutes = require('./navigation');
const mediaRoutes = require('./media');
const testimonialsRoutes = require('./testimonials');
const faqsRoutes = require('./faqs');

// Mount routes
router.use('/api/auth', authRoutes);
router.use('/api', postsRoutes);
router.use('/api', workRoutes);
router.use('/api', capabilitiesRoutes);
router.use('/api', uploadRoutes);
router.use('/api', messagesRoutes);

// Mount new routes
router.use('/api', settingsRoutes);
router.use('/api', categoriesRoutes);
router.use('/api', changelogRoutes);
router.use('/api', homepageRoutes);
router.use('/api', navigationRoutes);
router.use('/api', mediaRoutes);
router.use('/api', testimonialsRoutes);
router.use('/api', faqsRoutes);

module.exports = router;



