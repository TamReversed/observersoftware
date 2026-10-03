// Sign-in checks. The signed-in user is looked up on EVERY request, so deleting or demoting someone
// takes effect immediately (not when their session would have expired).
//
// Roles:
//   admin  - everything, including users, contact messages, settings and backups
//   editor - content only: posts, work, products, FAQs, testimonials, site content, images
// An account with no role (created before roles existed) is an admin. Any unrecognised role value is
// treated as editor (least access), never as admin.
const crypto = require('crypto');
const DataService = require('../services/dataService');
const DbService = require('../services/dbService');
const config = require('../config');

const usersService = config.database.useDatabase ? new DbService('users') : new DataService(config.paths.usersFile);

function roleOf(user) {
  if (!user) return null;
  if (user.role === undefined || user.role === null || user.role === '') return 'admin';
  return user.role === 'admin' ? 'admin' : 'editor';
}

// The account behind this request's session, or null (signed out, or the account was deleted)
// Changes whenever the account's password or one-time-code setup changes, which ends every older session
function authFingerprint(user) {
  return crypto.createHash('sha256')
    .update('fp1|' + (user.password || '') + '|' + (user.totpEnabled ? String(user.totpSecret || '') : ''))
    .digest('hex').slice(0, 32);
}

async function sessionUser(req) {
  if (!req.session || !req.session.userId) return null;
  const user = await usersService.findById(req.session.userId);
  if (!user) return null;
  if (req.session.authFp !== authFingerprint(user)) return null; // sign-in details changed since this session began
  return user;
}

function deny(req, res) {
  if (req.session && req.session.userId) req.session.destroy(() => {}); // the account no longer exists
  return res.status(401).json({ error: 'Unauthorized' });
}

// Any signed-in, existing account (admin or editor)
async function requireAuth(req, res, next) {
  try {
    const user = await sessionUser(req);
    if (!user) return deny(req, res);
    req.user = user;
    req.role = roleOf(user);
    next();
  } catch (error) { next(error); }
}

// Admins only
async function requireAdmin(req, res, next) {
  try {
    const user = await sessionUser(req);
    if (!user) return deny(req, res);
    req.user = user;
    req.role = roleOf(user);
    if (req.role !== 'admin') return res.status(403).json({ error: 'Only an admin can do this.' });
    next();
  } catch (error) { next(error); }
}

module.exports = { requireAuth, requireAdmin, roleOf, sessionUser, authFingerprint };
