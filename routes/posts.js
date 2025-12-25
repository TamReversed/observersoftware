const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const postsController = require('../controllers/postsController');

// Public routes
router.get('/categories', postsController.getCategories);
router.get('/posts', asyncHandler(postsController.getPosts));
router.get('/posts/:slug', asyncHandler(postsController.getPostBySlug));

// Admin routes
router.get('/admin/posts', requireAuth, asyncHandler(postsController.getAllPosts));
router.post('/admin/posts', requireAuth, asyncHandler(postsController.createPost));
router.put('/admin/posts/:slug', requireAuth, asyncHandler(postsController.updatePost));
router.delete('/admin/posts/:slug', requireAuth, asyncHandler(postsController.deletePost));

module.exports = router;

