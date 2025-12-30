const { v4: uuidv4 } = require('uuid');
const DbService = require('../services/dbService');
const DataService = require('../services/dataService');
const config = require('../config');

const navigationService = config.database.useDatabase
  ? new DbService('navigation')
  : new DataService(config.paths.navigationFile || './data/navigation.json');

// Get all published navigation (public)
async function getNavigation(req, res, next) {
  try {
    let items = await navigationService.findAll(n => n.published);
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Group by location
    const grouped = {
      header: items.filter(n => n.location === 'header'),
      footer_nav: items.filter(n => n.location === 'footer_nav'),
      footer_links: items.filter(n => n.location === 'footer_links')
    };

    res.json(grouped);
  } catch (error) {
    next(error);
  }
}

// Get navigation by location (public)
async function getNavigationByLocation(req, res, next) {
  try {
    const { location } = req.params;
    const validLocations = ['header', 'footer_nav', 'footer_links'];
    if (!validLocations.includes(location)) {
      return res.status(400).json({ error: 'Invalid location' });
    }

    let items = await navigationService.findAll(
      n => n.location === location && n.published
    );
    items.sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(items);
  } catch (error) {
    next(error);
  }
}

// Get all navigation items (admin)
async function getAllNavigation(req, res, next) {
  try {
    let items = await navigationService.findAll();
    items.sort((a, b) => {
      if (a.location !== b.location) return a.location.localeCompare(b.location);
      return (a.order || 0) - (b.order || 0);
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
}

// Create navigation item
async function createNavigation(req, res, next) {
  try {
    const { location, label, url, isExternal, published } = req.body;

    if (!location || !label || url === undefined) {
      return res.status(400).json({ error: 'Location, label, and url are required' });
    }

    const validLocations = ['header', 'footer_nav', 'footer_links'];
    if (!validLocations.includes(location)) {
      return res.status(400).json({ error: 'Location must be: header, footer_nav, or footer_links' });
    }

    const items = await navigationService.findAll(n => n.location === location);
    const maxOrder = items.reduce((max, n) => Math.max(max, n.order || 0), 0);

    const newItem = {
      id: uuidv4(),
      location,
      label,
      url,
      order: maxOrder + 1,
      isExternal: !!isExternal,
      published: published !== false
    };

    const created = await navigationService.create(newItem);
    res.json(created);
  } catch (error) {
    next(error);
  }
}

// Update navigation item
async function updateNavigation(req, res, next) {
  try {
    const { id } = req.params;
    const { location, label, url, order, isExternal, published } = req.body;

    const item = await navigationService.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Navigation item not found' });
    }

    const updates = {};
    if (location !== undefined) {
      const validLocations = ['header', 'footer_nav', 'footer_links'];
      if (!validLocations.includes(location)) {
        return res.status(400).json({ error: 'Location must be: header, footer_nav, or footer_links' });
      }
      updates.location = location;
    }
    if (label !== undefined) updates.label = label;
    if (url !== undefined) updates.url = url;
    if (order !== undefined) updates.order = order;
    if (isExternal !== undefined) updates.isExternal = isExternal;
    if (published !== undefined) updates.published = published;

    const updated = await navigationService.updateById(id, updates);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

// Reorder navigation items
async function reorderNavigation(req, res, next) {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const results = [];
    for (let i = 0; i < items.length; i++) {
      const { id } = items[i];
      const updated = await navigationService.updateById(id, { order: i + 1 });
      if (updated) results.push(updated);
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
}

// Delete navigation item
async function deleteNavigation(req, res, next) {
  try {
    const { id } = req.params;

    const item = await navigationService.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Navigation item not found' });
    }

    await navigationService.deleteById(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNavigation,
  getNavigationByLocation,
  getAllNavigation,
  createNavigation,
  updateNavigation,
  reorderNavigation,
  deleteNavigation
};
