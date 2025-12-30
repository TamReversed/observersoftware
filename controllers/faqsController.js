const { v4: uuidv4 } = require('uuid');
const DbService = require('../services/dbService');
const DataService = require('../services/dataService');
const config = require('../config');

const faqsService = config.database.useDatabase
  ? new DbService('faqs')
  : new DataService(config.paths.faqsFile || './data/faqs.json');

// Get published FAQs (public)
async function getFaqs(req, res, next) {
  try {
    let faqs = await faqsService.findAll(f => f.published);
    faqs.sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(faqs);
  } catch (error) {
    next(error);
  }
}

// Get FAQs by category (public)
async function getFaqsByCategory(req, res, next) {
  try {
    const { category } = req.params;
    let faqs = await faqsService.findAll(f => f.published && f.category === category);
    faqs.sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(faqs);
  } catch (error) {
    next(error);
  }
}

// Get all FAQs (admin)
async function getAllFaqs(req, res, next) {
  try {
    let faqs = await faqsService.findAll();
    faqs.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return (a.order || 0) - (b.order || 0);
    });
    res.json(faqs);
  } catch (error) {
    next(error);
  }
}

// Create FAQ
async function createFaq(req, res, next) {
  try {
    const { question, answer, category, published } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const faqs = await faqsService.findAll();
    const maxOrder = faqs.reduce((max, f) => Math.max(max, f.order || 0), 0);

    const newFaq = {
      id: uuidv4(),
      question,
      answer,
      category: category || 'general',
      order: maxOrder + 1,
      published: published !== false
    };

    const created = await faqsService.create(newFaq);
    res.json(created);
  } catch (error) {
    next(error);
  }
}

// Update FAQ
async function updateFaq(req, res, next) {
  try {
    const { id } = req.params;
    const { question, answer, category, order, published } = req.body;

    const faq = await faqsService.findById(id);
    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    const updates = {};
    if (question !== undefined) updates.question = question;
    if (answer !== undefined) updates.answer = answer;
    if (category !== undefined) updates.category = category;
    if (order !== undefined) updates.order = order;
    if (published !== undefined) updates.published = published;

    const updated = await faqsService.updateById(id, updates);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

// Reorder FAQs
async function reorderFaqs(req, res, next) {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const results = [];
    for (let i = 0; i < items.length; i++) {
      const { id } = items[i];
      const updated = await faqsService.updateById(id, { order: i + 1 });
      if (updated) results.push(updated);
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
}

// Delete FAQ
async function deleteFaq(req, res, next) {
  try {
    const { id } = req.params;

    const faq = await faqsService.findById(id);
    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    await faqsService.deleteById(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getFaqs,
  getFaqsByCategory,
  getAllFaqs,
  createFaq,
  updateFaq,
  reorderFaqs,
  deleteFaq
};
