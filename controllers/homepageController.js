const DbService = require('../services/dbService');
const DataService = require('../services/dataService');
const config = require('../config');

const homepageService = config.database.useDatabase
  ? new DbService('homepage_content')
  : new DataService(config.paths.homepageFile || './data/homepage.json');

// Get all homepage sections (public)
async function getHomepage(req, res, next) {
  try {
    const sections = await homepageService.findAll();
    // Convert array to object keyed by section
    const content = {};
    sections.forEach(s => {
      content[s.section] = s.content;
    });
    res.json(content);
  } catch (error) {
    next(error);
  }
}

// Get specific section (public)
async function getSection(req, res, next) {
  try {
    const { section } = req.params;
    const sectionData = await homepageService.findOne(s => s.section === section);
    if (!sectionData) {
      return res.status(404).json({ error: 'Section not found' });
    }
    res.json(sectionData.content);
  } catch (error) {
    next(error);
  }
}

// Get all sections (admin - full records)
async function getAllSections(req, res, next) {
  try {
    const sections = await homepageService.findAll();
    res.json(sections);
  } catch (error) {
    next(error);
  }
}

// Update section
async function updateSection(req, res, next) {
  try {
    const { section } = req.params;
    const { content } = req.body;

    if (content === undefined) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const existing = await homepageService.findOne(s => s.section === section);
    if (!existing) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const updated = await homepageService.update(
      s => s.section === section,
      { content }
    );

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHomepage,
  getSection,
  getAllSections,
  updateSection
};
