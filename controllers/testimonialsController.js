const { v4: uuidv4 } = require('uuid');
const DbService = require('../services/dbService');
const DataService = require('../services/dataService');
const config = require('../config');

const testimonialsService = config.database.useDatabase
  ? new DbService('testimonials')
  : new DataService(config.paths.testimonialsFile || './data/testimonials.json');

// Get published testimonials (public)
async function getTestimonials(req, res, next) {
  try {
    let testimonials = await testimonialsService.findAll(t => t.published);
    testimonials.sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(testimonials);
  } catch (error) {
    next(error);
  }
}

// Get all testimonials (admin)
async function getAllTestimonials(req, res, next) {
  try {
    let testimonials = await testimonialsService.findAll();
    testimonials.sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(testimonials);
  } catch (error) {
    next(error);
  }
}

// Create testimonial
async function createTestimonial(req, res, next) {
  try {
    const { content, author_name, author_title, author_company, author_image, rating, published } = req.body;

    if (!content || !author_name) {
      return res.status(400).json({ error: 'Content and author name are required' });
    }

    const testimonials = await testimonialsService.findAll();
    const maxOrder = testimonials.reduce((max, t) => Math.max(max, t.order || 0), 0);

    const newTestimonial = {
      id: uuidv4(),
      content,
      author_name,
      author_title: author_title || '',
      author_company: author_company || '',
      author_image: author_image || '',
      rating: Math.min(5, Math.max(1, rating || 5)),
      order: maxOrder + 1,
      published: !!published
    };

    const created = await testimonialsService.create(newTestimonial);
    res.json(created);
  } catch (error) {
    next(error);
  }
}

// Update testimonial
async function updateTestimonial(req, res, next) {
  try {
    const { id } = req.params;
    const { content, author_name, author_title, author_company, author_image, rating, order, published } = req.body;

    const testimonial = await testimonialsService.findById(id);
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    const updates = {};
    if (content !== undefined) updates.content = content;
    if (author_name !== undefined) updates.author_name = author_name;
    if (author_title !== undefined) updates.author_title = author_title;
    if (author_company !== undefined) updates.author_company = author_company;
    if (author_image !== undefined) updates.author_image = author_image;
    if (rating !== undefined) updates.rating = Math.min(5, Math.max(1, rating));
    if (order !== undefined) updates.order = order;
    if (published !== undefined) updates.published = published;

    const updated = await testimonialsService.updateById(id, updates);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

// Delete testimonial
async function deleteTestimonial(req, res, next) {
  try {
    const { id } = req.params;

    const testimonial = await testimonialsService.findById(id);
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    await testimonialsService.deleteById(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTestimonials,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
};
