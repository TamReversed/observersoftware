const { v4: uuidv4 } = require('uuid');
const DataService = require('../services/dataService');
const { slugify, calculateReadTime } = require('../utils/helpers');
const { renderMarkdown } = require('../services/markdownService');
const { CATEGORIES } = require('../utils/constants');
const config = require('../config');

const postsService = new DataService(config.paths.postsFile);

function getCategories(req, res) {
  res.json(CATEGORIES);
}

function getPosts(req, res, next) {
  try {
    const { search, category, page = 1, limit = 8 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    let posts = postsService
      .findAll(p => p.published)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Filter by category
    if (category) {
      posts = posts.filter(p => p.category === category);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.excerpt.toLowerCase().includes(searchLower) ||
        p.content.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const total = posts.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    // Paginate
    const paginatedPosts = posts.slice(startIndex, endIndex).map(p => ({
      ...p,
      readTime: calculateReadTime(p.content),
      categoryName: CATEGORIES.find(c => c.slug === p.category)?.name || p.category,
      content: undefined // Don't send full content in list
    }));

    res.json({
      posts: paginatedPosts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    next(error);
  }
}

function getPostBySlug(req, res, next) {
  try {
    const post = postsService.findBySlug(req.params.slug);

    if (!post || !post.published) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get related posts
    const allPosts = postsService.findAll();
    const relatedPosts = allPosts
      .filter(p => p.published && p.category === post.category && p.slug !== post.slug)
      .slice(0, 3)
      .map(p => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        readTime: calculateReadTime(p.content),
        publishedAt: p.publishedAt
      }));

    res.json({
      ...post,
      readTime: calculateReadTime(post.content),
      categoryName: CATEGORIES.find(c => c.slug === post.category)?.name || post.category,
      htmlContent: renderMarkdown(post.content),
      relatedPosts
    });
  } catch (error) {
    next(error);
  }
}

function getAllPosts(req, res, next) {
  try {
    const posts = postsService
      .findAll()
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .map(p => ({
        ...p,
        readTime: calculateReadTime(p.content),
        categoryName: CATEGORIES.find(c => c.slug === p.category)?.name || p.category
      }));
    res.json(posts);
  } catch (error) {
    next(error);
  }
}

function createPost(req, res, next) {
  try {
    const { title, excerpt, content, category, published } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const posts = postsService.findAll();
    const slug = slugify(title);

    // Check for duplicate slug
    if (posts.some(p => p.slug === slug)) {
      return res.status(400).json({ error: 'A post with this title already exists' });
    }

    const newPost = {
      id: uuidv4(),
      slug,
      title,
      excerpt: excerpt || title,
      category: category || 'insights',
      content,
      author: req.session.username,
      publishedAt: published ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
      published: !!published
    };

    postsService.create(newPost);
    res.json(newPost);
  } catch (error) {
    next(error);
  }
}

function updatePost(req, res, next) {
  try {
    const { title, excerpt, content, category, published } = req.body;
    const post = postsService.findBySlug(req.params.slug);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const newSlug = title ? slugify(title) : post.slug;

    // Check for duplicate slug (excluding current post)
    if (newSlug !== post.slug) {
      const posts = postsService.findAll();
      if (posts.some(p => p.slug === newSlug)) {
        return res.status(400).json({ error: 'A post with this title already exists' });
      }
    }

    const updates = {
      ...(title && { title, slug: newSlug }),
      ...(excerpt !== undefined && { excerpt }),
      ...(category !== undefined && { category }),
      ...(content !== undefined && { content }),
      ...(published !== undefined && { 
        published,
        publishedAt: published && !post.publishedAt ? new Date().toISOString() : post.publishedAt
      }),
      updatedAt: new Date().toISOString()
    };

    const updatedPost = postsService.updateBySlug(req.params.slug, updates);
    res.json(updatedPost);
  } catch (error) {
    next(error);
  }
}

function deletePost(req, res, next) {
  try {
    const deleted = postsService.deleteBySlug(req.params.slug);
    if (!deleted) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
  getPosts,
  getPostBySlug,
  getAllPosts,
  createPost,
  updatePost,
  deletePost
};



