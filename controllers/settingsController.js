const DbService = require('../services/dbService');
const DataService = require('../services/dataService');
const config = require('../config');

const settingsService = config.database.useDatabase
  ? new DbService('site_settings')
  : new DataService(config.paths.settingsFile || './data/settings.json');

// Get all settings (public - for rendering site)
async function getSettings(req, res, next) {
  try {
    const settings = await settingsService.findAll();
    // Convert array of {key, value} to object
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.json(settingsObj);
  } catch (error) {
    next(error);
  }
}

// Get all settings (admin - returns full records)
async function getAllSettings(req, res, next) {
  try {
    const settings = await settingsService.findAll();
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

// Get single setting by key
async function getSetting(req, res, next) {
  try {
    const { key } = req.params;
    const setting = await settingsService.findOne(s => s.key === key);
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.json(setting);
  } catch (error) {
    next(error);
  }
}

// Update setting by key
async function updateSetting(req, res, next) {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const existing = await settingsService.findOne(s => s.key === key);
    if (!existing) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    const updated = await settingsService.update(
      s => s.key === key,
      { value }
    );

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

// Bulk update settings
async function updateSettings(req, res, next) {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const existing = await settingsService.findOne(s => s.key === key);
      if (existing) {
        const updated = await settingsService.update(
          s => s.key === key,
          { value }
        );
        results.push(updated);
      }
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
  getAllSettings,
  getSetting,
  updateSetting,
  updateSettings
};
