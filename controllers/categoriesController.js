const { v4: uuidv4 } = require('uuid');
const DbService = require('../services/dbService');
const DataService = require('../services/dataService');
const config = require('../config');

const categoriesService = config.database.useDatabase
  ? new DbService('categories')
  : new DataService(config.paths.categoriesFile || './data/categories.json');

// Helper to create slug from name
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Get all categories (public)
async function getCategories(req, res, next) {
  try {
    let categories = await categoriesService.findAll();
    categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(categories);
  } catch (error) {
    next(error);
  }
}

// Get categories by type (public)
async function getCategoriesByType(req, res, next) {
  try {
    const { type } = req.params;
    if (!['blog', 'work'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "blog" or "work"' });
    }

    let categories = await categoriesService.findAll(c => c.type === type);
    categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(categories);
  } catch (error) {
    next(error);
  }
}

// Get all categories (admin)
async function getAllCategories(req, res, next) {
  try {
    let categories = await categoriesService.findAll();
    categories.sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return (a.order || 0) - (b.order || 0);
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
}

// Create category
async function createCategory(req, res, next) {
  try {
    const { name, type, description } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    if (!['blog', 'work'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "blog" or "work"' });
    }

    const slug = slugify(name);

    // Check for duplicate slug
    const existing = await categoriesService.findOne(c => c.slug === slug);
    if (existing) {
      return res.status(400).json({ error: 'A category with this name already exists' });
    }

    // Get max order for this type
    const categories = await categoriesService.findAll(c => c.type === type);
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.order || 0), 0);

    const newCategory = {
      id: uuidv4(),
      name,
      slug,
      type,
      description: description || '',
      order: maxOrder + 1
    };

    const created = await categoriesService.create(newCategory);
    res.json(created);
  } catch (error) {
    next(error);
  }
}

// Update category
async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, order } = req.body;

    const category = await categoriesService.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updates = {};
    if (name !== undefined) {
      updates.name = name;
      updates.slug = slugify(name);

      // Check for duplicate slug (excluding current)
      const existing = await categoriesService.findOne(
        c => c.slug === updates.slug && c.id !== id
      );
      if (existing) {
        return res.status(400).json({ error: 'A category with this name already exists' });
      }
    }
    if (description !== undefined) updates.description = description;
    if (order !== undefined) updates.order = order;

    const updated = await categoriesService.updateById(id, updates);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

// Delete category
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    const category = await categoriesService.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await categoriesService.deleteById(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
  getCategoriesByType,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
