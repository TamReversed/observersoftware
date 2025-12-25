const { v4: uuidv4 } = require('uuid');
const DataService = require('../services/dataService');
const config = require('../config');

const workService = new DataService(config.paths.workFile);

function getWork(req, res, next) {
  try {
    const work = workService
      .findAll(w => w.published)
      .sort((a, b) => a.order - b.order);
    res.json(work);
  } catch (error) {
    next(error);
  }
}

function getAllWork(req, res, next) {
  try {
    const work = workService
      .findAll()
      .sort((a, b) => a.order - b.order);
    res.json(work);
  } catch (error) {
    next(error);
  }
}

function createWork(req, res, next) {
  try {
    const { industry, problem, solution, tags, image, client, date, caseStudyUrl, published } = req.body;

    if (!industry || !problem || !solution) {
      return res.status(400).json({ error: 'Industry, problem, and solution are required' });
    }

    const work = workService.findAll();
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

    workService.create(newWork);
    res.json(newWork);
  } catch (error) {
    next(error);
  }
}

function updateWork(req, res, next) {
  try {
    const { industry, problem, solution, tags, image, client, date, caseStudyUrl, order, published } = req.body;
    const work = workService.findById(req.params.id);

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

    const updatedWork = workService.updateById(req.params.id, updates);
    res.json(updatedWork);
  } catch (error) {
    next(error);
  }
}

function deleteWork(req, res, next) {
  try {
    const deleted = workService.deleteById(req.params.id);
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



