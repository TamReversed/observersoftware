const { v4: uuidv4 } = require('uuid');
const DbService = require('../services/dbService');
const DataService = require('../services/dataService');
const config = require('../config');

const changelogService = config.database.useDatabase
  ? new DbService('changelog')
  : new DataService(config.paths.changelogFile || './data/changelog.json');

// Get all changelog entries (public)
async function getChangelog(req, res, next) {
  try {
    let entries = await changelogService.findAll();
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(entries);
  } catch (error) {
    next(error);
  }
}

// Get all changelog entries (admin)
async function getAllChangelog(req, res, next) {
  try {
    let entries = await changelogService.findAll();
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(entries);
  } catch (error) {
    next(error);
  }
}

// Create changelog entry
async function createChangelog(req, res, next) {
  try {
    const { title, description, details, type, date } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const validTypes = ['fix', 'feature', 'improvement', 'security'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ error: 'Type must be: fix, feature, improvement, or security' });
    }

    const entries = await changelogService.findAll();
    const maxOrder = entries.reduce((max, e) => Math.max(max, e.order || 0), 0);

    const newEntry = {
      id: uuidv4(),
      title,
      description,
      details: details || '',
      type: type || 'fix',
      date: date || new Date().toISOString().split('T')[0],
      order: maxOrder + 1
    };

    const created = await changelogService.create(newEntry);
    res.json(created);
  } catch (error) {
    next(error);
  }
}

// Update changelog entry
async function updateChangelog(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, details, type, date, order } = req.body;

    const entry = await changelogService.findById(id);
    if (!entry) {
      return res.status(404).json({ error: 'Changelog entry not found' });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (details !== undefined) updates.details = details;
    if (type !== undefined) {
      const validTypes = ['fix', 'feature', 'improvement', 'security'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Type must be: fix, feature, improvement, or security' });
      }
      updates.type = type;
    }
    if (date !== undefined) updates.date = date;
    if (order !== undefined) updates.order = order;

    const updated = await changelogService.updateById(id, updates);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

// Delete changelog entry
async function deleteChangelog(req, res, next) {
  try {
    const { id } = req.params;

    const entry = await changelogService.findById(id);
    if (!entry) {
      return res.status(404).json({ error: 'Changelog entry not found' });
    }

    await changelogService.deleteById(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getChangelog,
  getAllChangelog,
  createChangelog,
  updateChangelog,
  deleteChangelog
};
