// One-click backup of everything an editor can change. Never includes users, passwords,
// passkeys or contact-form messages.
const DataService = require('../services/dataService');
const DbService = require('../services/dbService');
const config = require('../config');

const store = (table, file) => (config.database.useDatabase ? new DbService(table) : new DataService(file));

const SOURCES = {
  posts: store('posts', config.paths.postsFile),
  work: store('work', config.paths.workFile),
  products: store('capabilities', config.paths.capabilitiesFile),
  faqs: store('faqs', config.paths.faqsFile),
  testimonials: store('testimonials', config.paths.testimonialsFile),
  categories: store('categories', config.paths.categoriesFile),
  settings: store('site_settings', config.paths.settingsFile)
};

async function exportBackup(req, res, next) {
  try {
    const backup = { exportedAt: new Date().toISOString(), note: 'Content backup. Users, passwords and messages are not included.' };
    for (const [name, svc] of Object.entries(SOURCES)) backup[name] = await svc.findAll();
    res.setHeader('Content-Disposition', `attachment; filename="observer-backup-${new Date().toISOString().slice(0, 10)}.json"`);
    res.setHeader('Cache-Control', 'no-store');
    res.type('application/json').send(JSON.stringify(backup, null, 2));
  } catch (error) {
    next(error);
  }
}

module.exports = { exportBackup };
