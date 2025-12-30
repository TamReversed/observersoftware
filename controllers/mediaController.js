const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const DbService = require('../services/dbService');
const DataService = require('../services/dataService');
const config = require('../config');

const mediaService = config.database.useDatabase
  ? new DbService('media')
  : new DataService(config.paths.mediaFile || './data/media.json');

// Get all media (public - for display)
async function getMedia(req, res, next) {
  try {
    let media = await mediaService.findAll();
    media.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(media);
  } catch (error) {
    next(error);
  }
}

// Get all media with metadata (admin)
async function getAllMedia(req, res, next) {
  try {
    let media = await mediaService.findAll();
    media.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(media);
  } catch (error) {
    next(error);
  }
}

// Get single media item
async function getMediaById(req, res, next) {
  try {
    const { id } = req.params;
    const media = await mediaService.findById(id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.json(media);
  } catch (error) {
    next(error);
  }
}

// Create media record (called after file upload)
async function createMedia(req, res, next) {
  try {
    const { filename, originalFilename, path: filePath, mimeType, size, width, height, altText, tags } = req.body;

    if (!filename || !filePath || !mimeType) {
      return res.status(400).json({ error: 'Filename, path, and mimeType are required' });
    }

    const newMedia = {
      id: uuidv4(),
      filename,
      originalFilename: originalFilename || filename,
      path: filePath,
      mimeType,
      size: size || 0,
      width: width || null,
      height: height || null,
      altText: altText || '',
      tags: tags || [],
      uploadedBy: req.session.username
    };

    const created = await mediaService.create(newMedia);
    res.json(created);
  } catch (error) {
    next(error);
  }
}

// Update media metadata
async function updateMedia(req, res, next) {
  try {
    const { id } = req.params;
    const { altText, tags } = req.body;

    const media = await mediaService.findById(id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const updates = {};
    if (altText !== undefined) updates.altText = altText;
    if (tags !== undefined) updates.tags = tags;

    const updated = await mediaService.updateById(id, updates);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

// Delete media
async function deleteMedia(req, res, next) {
  try {
    const { id } = req.params;

    const media = await mediaService.findById(id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Try to delete the file
    try {
      const filePath = path.join(__dirname, '..', 'public', media.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.warn('Could not delete file:', fileError.message);
    }

    await mediaService.deleteById(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMedia,
  getAllMedia,
  getMediaById,
  createMedia,
  updateMedia,
  deleteMedia
};
