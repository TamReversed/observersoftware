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
const testimonialsRoutes = require('./testimonials');
const faqsRoutes = require('./faqs');
const siteContentRoutes = require('./siteContent');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { exportBackup } = require('../controllers/exportController');

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
router.use('/api', testimonialsRoutes);
router.use('/api', faqsRoutes);
router.use('/api', siteContentRoutes);
router.get('/api/admin/export', requireAdmin, asyncHandler(exportBackup));

module.exports = router;



