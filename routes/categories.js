const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { validateCsrfToken } = require('../middleware/csrf');
const { validateId } = require('../middleware/validation');
const categoriesController = require('../controllers/categoriesController');

// Public routes
router.get('/categories', asyncHandler(categoriesController.getCategories));
router.get('/categories/:type', asyncHandler(categoriesController.getCategoriesByType));

// Admin routes
router.get('/admin/categories', requireAuth, asyncHandler(categoriesController.getAllCategories));
router.post('/admin/categories', requireAuth, validateCsrfToken, asyncHandler(categoriesController.createCategory));
router.put('/admin/categories/:id', requireAuth, validateCsrfToken, validateId, asyncHandler(categoriesController.updateCategory));
router.delete('/admin/categories/:id', requireAuth, validateCsrfToken, validateId, asyncHandler(categoriesController.deleteCategory));

module.exports = router;
