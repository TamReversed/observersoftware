const { v4: uuidv4 } = require('uuid');
const DataService = require('../services/dataService');
const DbService = require('../services/dbService');
const config = require('../config');

// Use database if available, otherwise fall back to JSON files
const workService = config.database.useDatabase
  ? new DbService('work')
  : new DataService(config.paths.workFile);

async function getWork(req, res, next) {
  try {
    let work = await workService.findAll(w => w.published);
    work.sort((a, b) => a.order - b.order);
    res.json(work);
  } catch (error) {
    next(error);
  }
}

async function getAllWork(req, res, next) {
  try {
    let work = await workService.findAll();
    work.sort((a, b) => a.order - b.order);
    res.json(work);
  } catch (error) {
    next(error);
  }
}

async function createWork(req, res, next) {
  try {
    const { industry, problem, solution, tags, image, client, date, caseStudyUrl, published } = req.body;

    if (!industry || !problem || !solution) {
      return res.status(400).json({ error: 'Industry, problem, and solution are required' });
    }

    const work = await workService.findAll();
    const maxOrder = work.reduce((max, w) => Math.max(max, w.order || 0), 0);

    const newWork = {
      id: uuidv4(),
      industry,
      problem,
      solution,
      tags: tags || [],
      image: image || '',
      client: client || '',
      date: date || '',
      caseStudyUrl: caseStudyUrl || '',
      order: maxOrder + 1,
      published: !!published
    };

    const created = await workService.create(newWork);
    res.json(created);
  } catch (error) {
    next(error);
  }
}

async function updateWork(req, res, next) {
  try {
    const { industry, problem, solution, tags, image, client, date, caseStudyUrl, order, published } = req.body;
    const work = await workService.findById(req.params.id);

    if (!work) {
      return res.status(404).json({ error: 'Work item not found' });
    }

    const updates = {};
    if (industry !== undefined) updates.industry = industry;
    if (problem !== undefined) updates.problem = problem;
    if (solution !== undefined) updates.solution = solution;
    if (tags !== undefined) updates.tags = tags;
    if (image !== undefined) updates.image = image;
    if (client !== undefined) updates.client = client;
    if (date !== undefined) updates.date = date;
    if (caseStudyUrl !== undefined) updates.caseStudyUrl = caseStudyUrl;
    if (order !== undefined) updates.order = order;
    if (published !== undefined) updates.published = published;

    const updatedWork = await workService.updateById(req.params.id, updates);
    res.json(updatedWork);
  } catch (error) {
    next(error);
  }
}

async function deleteWork(req, res, next) {
  try {
    const deleted = await workService.deleteById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Work item not found' });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getWork,
  getAllWork,
  createWork,
  updateWork,
  deleteWork
};




