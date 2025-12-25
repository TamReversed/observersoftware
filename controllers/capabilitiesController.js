const { v4: uuidv4 } = require('uuid');
const DataService = require('../services/dataService');
const { renderMarkdown } = require('../services/markdownService');
const config = require('../config');

const capabilitiesService = new DataService(config.paths.capabilitiesFile);

function getCapabilities(req, res, next) {
  try {
    const capabilities = capabilitiesService
      .findAll(c => c.published)
      .sort((a, b) => a.order - b.order);
    res.json(capabilities);
  } catch (error) {
    next(error);
  }
}

function getCapabilityById(req, res, next) {
  try {
    const capability = capabilitiesService.findById(req.params.id);

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

function getAllCapabilities(req, res, next) {
  try {
    const capabilities = capabilitiesService
      .findAll()
      .sort((a, b) => a.order - b.order);
    res.json(capabilities);
  } catch (error) {
    next(error);
  }
}

function createCapability(req, res, next) {
  try {
    const { title, description, longDescription, features, screenshots, externalUrl, published } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const capabilities = capabilitiesService.findAll();
    const maxOrder = capabilities.reduce((max, c) => Math.max(max, c.order || 0), 0);

    const newCapability = {
      id: uuidv4(),
      title,
      description,
      longDescription: longDescription || '',
      features: features || [],
      screenshots: screenshots || [],
      externalUrl: externalUrl || '',
      order: maxOrder + 1,
      published: !!published
    };

    capabilitiesService.create(newCapability);
    res.json(newCapability);
  } catch (error) {
    next(error);
  }
}

function updateCapability(req, res, next) {
  try {
    const { title, description, longDescription, features, screenshots, externalUrl, order, published } = req.body;
    const capability = capabilitiesService.findById(req.params.id);

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
    if (order !== undefined) updates.order = order;
    if (published !== undefined) updates.published = published;

    const updatedCapability = capabilitiesService.updateById(req.params.id, updates);
    res.json(updatedCapability);
  } catch (error) {
    next(error);
  }
}

function deleteCapability(req, res, next) {
  try {
    const deleted = capabilitiesService.deleteById(req.params.id);
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
