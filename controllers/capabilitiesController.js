const { v4: uuidv4 } = require('uuid');
const DataService = require('../services/dataService');
const DbService = require('../services/dbService');
const { renderMarkdown } = require('../services/markdownService');
const config = require('../config');

// Use database if available, otherwise fall back to JSON files
const capabilitiesService = config.database.useDatabase
  ? new DbService('capabilities')
  : new DataService(config.paths.capabilitiesFile);

async function getCapabilities(req, res, next) {
  try {
    const capabilities = await capabilitiesService.findAll(c => c.published);
    capabilities.sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(capabilities);
  } catch (error) {
    next(error);
  }
}

async function getCapabilityById(req, res, next) {
  try {
    const capability = await capabilitiesService.findById(req.params.id);

    if (!capability || !capability.published) {
      return res.status(404).json({ error: 'Capability not found' });
    }

    // Render markdown for longDescription
    const response = {
      ...capability,
      htmlContent: capability.longDescription ? renderMarkdown(capability.longDescription) : ''
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

async function getAllCapabilities(req, res, next) {
  try {
    const capabilities = await capabilitiesService.findAll();
    capabilities.sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(capabilities);
  } catch (error) {
    next(error);
  }
}

async function createCapability(req, res, next) {
  try {
    const { title, description, longDescription, features, screenshots, externalUrl, icon, order, published } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const capabilities = await capabilitiesService.findAll();
    const maxOrder = capabilities.reduce((max, c) => Math.max(max, c.order || 0), 0);

    const newCapability = {
      id: uuidv4(),
      title,
      description,
      longDescription: longDescription || '',
      features: features || [],
      screenshots: screenshots || [],
      externalUrl: externalUrl || '',
      icon: icon || { type: 'preset', preset: '', svg: '', lottieUrl: '', lottieData: null },
      order: order || maxOrder + 1,
      published: !!published
    };

    const created = await capabilitiesService.create(newCapability);
    res.json(created);
  } catch (error) {
    next(error);
  }
}

async function updateCapability(req, res, next) {
  try {
    const { title, description, longDescription, features, screenshots, externalUrl, icon, order, published } = req.body;
    const capability = await capabilitiesService.findById(req.params.id);

    if (!capability) {
      return res.status(404).json({ error: 'Capability not found' });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (longDescription !== undefined) updates.longDescription = longDescription;
    if (features !== undefined) updates.features = features;
    if (screenshots !== undefined) updates.screenshots = screenshots;
    if (externalUrl !== undefined) updates.externalUrl = externalUrl;
    if (icon !== undefined) updates.icon = icon;
    if (order !== undefined) updates.order = order;
    if (published !== undefined) updates.published = published;

    const updatedCapability = await capabilitiesService.updateById(req.params.id, updates);
    res.json(updatedCapability);
  } catch (error) {
    next(error);
  }
}

async function deleteCapability(req, res, next) {
  try {
    const deleted = await capabilitiesService.deleteById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Capability not found' });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCapabilities,
  getCapabilityById,
  getAllCapabilities,
  createCapability,
  updateCapability,
  deleteCapability
};
