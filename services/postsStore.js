const DataService = require('./dataService');
const DbService = require('./dbService');
const config = require('../config');

// Shared posts store for server-level routes (slug checks, sitemap)
module.exports = config.database.useDatabase
  ? new DbService('posts')
  : new DataService(config.paths.postsFile);
