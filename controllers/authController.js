const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const DataService = require('../services/dataService');
const DbService = require('../services/dbService');
const config = require('../config');
const { roleOf, sessionUser, authFingerprint } = require('../middleware/auth');
const webauthnService = require('../services/webauthnService');

// Use database if available, otherwise fall back to JSON files
const usersService = config.database.useDatabase
  ? new DbService('users')
  : new DataService(config.paths.usersFile);

// Failed login tracking for account lockout
const failedLogins = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const USER_MAX_FAILED = 20; // across all addresses, per username

// Compared against when the username does not exist, so the response takes as long as a real check
const DUMMY_HASH = bcrypt.hashSync('observer-no-such-account', 12);

function lockoutKey(req, username) {
  return `${req.ip}|${String(username || '').toLowerCase()}`;
}

function userKey(username) {
  return `user|${String(username || '').toLowerCase()}`;
}

function isAccountLocked(key, max = MAX_FAILED_ATTEMPTS) {
  const record = failedLogins.get(key);
  if (!record) return false;

  if (record.attempts >= max) {
    const timeSinceLockout = Date.now() - record.lastAttempt;
    if (timeSinceLockout < LOCKOUT_DURATION) {
      return true;
    }
    // Lockout expired, reset
    failedLogins.delete(key);
  }
  return false;
}

function lockMinutesLeft(key) {
  const record = failedLogins.get(key);
  if (!record) return 1;
  return Math.max(1, Math.ceil((record.lastAttempt + LOCKOUT_DURATION - Date.now()) / 60000));
}

function recordFailedLogin(key) {
  if (failedLogins.size > 1000) {
    const cutoff = Date.now() - LOCKOUT_DURATION;
    for (const [k, v] of failedLogins) {
      if (v.lastAttempt < cutoff) failedLogins.delete(k);
    }
  }
  let record = failedLogins.get(key) || { attempts: 0, lastAttempt: 0 };
  if (Date.now() - record.lastAttempt > LOCKOUT_DURATION) record = { attempts: 0, lastAttempt: 0 }; // old failures no longer count
  record.attempts++;
  record.lastAttempt = Date.now();
  failedLogins.set(key, record);
}

function clearFailedLogins(key) {
  failedLogins.delete(key);
}

// Start a fresh session (prevents session fixation) and sign the user in
function establishSession(req, user, cb) {
  req.session.regenerate((err) => {
    if (err) return cb(err);
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.authFp = authFingerprint(user);
    req.session.csrfToken = uuidv4();
    req.session.save(cb);
  });
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const key = lockoutKey(req, username);
    const ukey = userKey(username);

    // Check for account lockout
    if (isAccountLocked(key) || isAccountLocked(ukey, USER_MAX_FAILED)) {
      return res.status(429).json({
        error: `Too many wrong passwords for this account. Try again in ${lockMinutesLeft(isAccountLocked(key) ? key : ukey)} minute${lockMinutesLeft(isAccountLocked(key) ? key : ukey) === 1 ? '' : 's'}.`
      });
    }

    const users = await usersService.findAll();
    const user = users.find(u => u.username === username);

    const valid = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
    if (!user || !valid) {
      recordFailedLogin(key);
      recordFailedLogin(ukey);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Accounts with one-time codes turned on sign in ONLY with the code. Answer exactly like a wrong
    // password, so a correct password is never confirmed to someone who is guessing.
    if (user.totpEnabled) {
      recordFailedLogin(key);
      recordFailedLogin(ukey);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Successful login - clear failed attempts
    clearFailedLogins(key);
    clearFailedLogins(ukey);

    establishSession(req, user, (err) => {
      if (err) return next(err);
      res.json({ success: true, username: user.username });
    });
  } catch (error) {
    next(error);
  }
}

function logout(req, res) {
  req.session.destroy();
  res.json({ success: true });
}

async function getStatus(req, res, next) {
  try {
    const user = await sessionUser(req);
    if (user) {
      return res.json({
        authenticated: true,
        id: user.id,
        username: user.username,
        role: roleOf(user),
        hasPasskey: !!(user.webauthnCredentials && user.webauthnCredentials.length > 0),
        hasTotp: !!user.totpEnabled
      });
    }
    res.json({ authenticated: false });
  } catch (error) { next(error); }
}

// Public and non-secret: the address passkeys are tied to (it is in every passkey prompt anyway)
function getSigninConfig(req, res) {
  res.json({ passkeyRpId: config.webauthn.rpID, passkeyOrigins: String(config.webauthn.origin).split(',').map((o) => o.trim()) });
}

function getCsrfToken(req, res) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = uuidv4();
  }
  res.json({ csrfToken: req.session.csrfToken });
}

// WebAuthn origin and RP ID come from configuration, never from request headers
const expectedOrigin = config.webauthn.origin.includes(',')
  ? config.webauthn.origin.split(',').map(o => o.trim())
  : config.webauthn.origin;
const primaryOrigin = Array.isArray(expectedOrigin) ? expectedOrigin[0] : expectedOrigin;

// WebAuthn Registration - Start
// Requires either an authenticated session or the account password.
async function startWebAuthnRegistration(req, res, next) {
  try {
    let user;
    let key;
    const sessionAuthenticated = !!(req.session && req.session.userId);

    if (sessionAuthenticated) {
      user = await sessionUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } else {
      const { username, password } = req.body;

      if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      key = lockoutKey(req, username);
      if (isAccountLocked(key)) {
        return res.status(429).json({
          error: `Too many wrong passwords for this account. Try again in ${lockMinutesLeft(key)} minute${lockMinutesLeft(key) === 1 ? '' : 's'}.`
        });
      }

      const users = await usersService.findAll();
      user = users.find(u => u.username === username);
      const matches = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
      const valid = !!user && matches;

      if (!valid || user.totpEnabled) {
        recordFailedLogin(key);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      clearFailedLogins(key);
    }

    if (typeof user.webauthnCredentials === 'string') {
      try { user.webauthnCredentials = JSON.parse(user.webauthnCredentials); } catch { user.webauthnCredentials = []; }
    }
    if (!Array.isArray(user.webauthnCredentials)) {
      user.webauthnCredentials = [];
    }

    // Only a signed-in admin may add an additional passkey
    if (!sessionAuthenticated && user.webauthnCredentials.length > 0) {
      return res.status(400).json({ error: 'User already has a passkey registered' });
    }

    try {
      const options = await webauthnService.generateRegistrationOptionsForUser(
        user.id,
        user.username,
        user.webauthnCredentials,
        primaryOrigin
      );

      req.session.webauthnChallenge = options.challenge;
      req.session.webauthnUserId = user.id;
      req.session.webauthnType = 'registration';
      req.session.webauthnTimestamp = Date.now();

      res.json(options);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to generate registration options' });
    }
  } catch (error) {
    next(error);
  }
}

// WebAuthn Registration - Finish
async function finishWebAuthnRegistration(req, res, next) {
  try {
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ error: 'Registration response is required' });
    }

    if (!response.id || !response.type || response.type !== 'public-key') {
      return res.status(400).json({ error: 'Invalid registration response format' });
    }

    if (!response.response?.clientDataJSON || !response.response?.attestationObject) {
      return res.status(400).json({ error: 'Registration response missing required fields' });
    }

    // Verify session state
    if (!req.session.webauthnChallenge ||
        !req.session.webauthnUserId ||
        req.session.webauthnType !== 'registration') {
      return res.status(400).json({ error: 'Invalid registration session' });
    }

    // Check challenge expiration (15 minutes)
    const challengeAge = Date.now() - (req.session.webauthnTimestamp || 0);
    if (challengeAge > 15 * 60 * 1000) {
      delete req.session.webauthnChallenge;
      delete req.session.webauthnUserId;
      delete req.session.webauthnType;
      delete req.session.webauthnTimestamp;
      return res.status(400).json({ error: 'Registration session expired. Please try again.' });
    }

    const userId = req.session.webauthnUserId;
    const user = await usersService.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const options = {
      challenge: req.session.webauthnChallenge,
      rpID: config.webauthn.rpID,
      origin: primaryOrigin
    };

    try {
      const verification = await webauthnService.verifyRegistration(options, response, expectedOrigin);

      if (!verification.verified) {
        return res.status(400).json({ error: 'Registration verification failed' });
      }

      const newCredential = verification.credential;
      if (!newCredential?.id || !newCredential?.publicKey) {
        return res.status(500).json({ error: 'Invalid credential data received' });
      }

      const updatedCredentials = Array.isArray(user.webauthnCredentials)
        ? [...user.webauthnCredentials]
        : [];
      updatedCredentials.push(newCredential);

      await usersService.updateById(userId, {
        webauthnCredentials: updatedCredentials
      });

      // Clear session
      delete req.session.webauthnChallenge;
      delete req.session.webauthnUserId;
      delete req.session.webauthnType;
      delete req.session.webauthnTimestamp;

      res.json({ success: true, message: 'Passkey registered successfully' });
    } catch (error) {
      const errorResponse = { error: 'Registration verification failed' };

      if (error.message?.includes('user could not be verified') ||
          error.message?.includes('User verification was required')) {
        errorResponse.userMessage = 'Please complete verification (PIN, fingerprint, or face ID) when prompted, then try again.';
      }

      return res.status(500).json(errorResponse);
    }
  } catch (error) {
    next(error);
  }
}

// WebAuthn Authentication - Start
async function startWebAuthnLogin(req, res, next) {
  try {
    const { username } = req.body;

    if (typeof username !== 'string' || !username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const users = await usersService.findAll();
    const user = users.find(u => u.username === username);

    // One identical answer for "no such account", "no passkey" and "uses one-time codes"
    if (!user || user.totpEnabled || !user.webauthnCredentials || user.webauthnCredentials.length === 0) {
      return res.status(400).json({ error: 'Passkey sign-in is not available for this account.' });
    }

    // Validate credentials
    let credentials = user.webauthnCredentials;
    if (typeof credentials === 'string') {
      try {
        credentials = JSON.parse(credentials);
      } catch {
        return res.status(500).json({ error: 'Credential data corrupted. Please re-register.' });
      }
    }

    if (!Array.isArray(credentials)) {
      return res.status(500).json({ error: 'Invalid credential format. Please re-register.' });
    }

    const validCredentials = credentials.filter(cred =>
      cred && typeof cred === 'object' &&
      typeof cred.id === 'string' &&
      typeof cred.publicKey === 'string'
    );

    if (validCredentials.length === 0) {
      return res.status(400).json({ error: 'No valid passkeys found. Please re-register.' });
    }

    try {
      const options = await webauthnService.generateAuthenticationOptionsForUser(
        user.id,
        validCredentials,
        primaryOrigin
      );

      req.session.webauthnChallenge = options.challenge;
      req.session.webauthnUserId = user.id;
      req.session.webauthnType = 'authentication';
      req.session.webauthnTimestamp = Date.now();

      res.json(options);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to generate authentication options' });
    }
  } catch (error) {
    next(error);
  }
}

// WebAuthn Authentication - Finish
async function finishWebAuthnLogin(req, res, next) {
  try {
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ error: 'Authentication response is required' });
    }

    if (!req.session.webauthnChallenge ||
        !req.session.webauthnUserId ||
        req.session.webauthnType !== 'authentication') {
      return res.status(400).json({ error: 'Invalid authentication session' });
    }

    // Check challenge expiration
    const challengeAge = Date.now() - (req.session.webauthnTimestamp || 0);
    if (challengeAge > 15 * 60 * 1000) {
      delete req.session.webauthnChallenge;
      delete req.session.webauthnUserId;
      delete req.session.webauthnType;
      delete req.session.webauthnTimestamp;
      return res.status(400).json({ error: 'Authentication session expired. Please try again.' });
    }

    const userId = req.session.webauthnUserId;
    const user = await usersService.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.totpEnabled) {
      return res.status(400).json({ error: 'Invalid authentication session' });
    }

    const credential = user.webauthnCredentials.find(cred => cred.id === response.id);

    const failKey = lockoutKey(req, user.username);

    if (!credential) {
      recordFailedLogin(failKey);
      return res.status(400).json({ error: 'Credential not found. Please register a new passkey.' });
    }

    const options = {
      challenge: req.session.webauthnChallenge,
      rpID: config.webauthn.rpID,
      origin: primaryOrigin
    };

    const verification = await webauthnService.verifyAuthentication(
      options,
      response,
      credential,
      expectedOrigin
    );

    if (!verification.verified) {
      recordFailedLogin(failKey);
      return res.status(401).json({ error: 'Authentication verification failed' });
    }

    // Update credential counter
    const credentialIndex = user.webauthnCredentials.findIndex(cred => cred.id === response.id);
    if (credentialIndex !== -1) {
      user.webauthnCredentials[credentialIndex].counter = verification.newCounter;
      await usersService.updateById(userId, {
        webauthnCredentials: user.webauthnCredentials
      });
    }

    // Clear failed logins on success
    clearFailedLogins(failKey);

    // New session (also discards the WebAuthn challenge state)
    establishSession(req, user, (err) => {
      if (err) return next(err);
      res.json({ success: true, username: user.username });
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// USER MANAGEMENT (Admin only)
// ============================================

// Get all users (admin)
async function getUsers(req, res, next) {
  try {
    const users = await usersService.findAll();
    // Remove sensitive data
    const safeUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      hasPasskey: u.webauthnCredentials && u.webauthnCredentials.length > 0,
      passkeyCount: u.webauthnCredentials ? u.webauthnCredentials.length : 0,
      hasTotp: !!u.totpEnabled,
      role: roleOf(u),
      createdAt: u.createdAt
    }));
    res.json(safeUsers);
  } catch (error) {
    next(error);
  }
}

// User-management writes run one at a time, so two requests cannot both pass the "at least one admin" check.
let userLock = Promise.resolve();
function exclusive(fn) {
  const run = userLock.then(fn, fn);
  userLock = run.catch(() => {});
  return run;
}

// Create new user (admin)
async function createUser(req, res, next) {
  return exclusive(async () => {
  try {
    const { username, password } = req.body;
    const role = req.body.role === undefined ? 'editor' : req.body.role;

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    if (role !== 'admin' && role !== 'editor') {
      return res.status(400).json({ error: 'Role must be admin or editor' });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Username must be 3-50 characters' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check for existing user
    const users = await usersService.findAll();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = {
      id: require('uuid').v4(),
      username,
      password: hashedPassword,
      role,
      webauthnCredentials: []
    };

    await usersService.create(newUser);
    res.json({ success: true, username: newUser.username, role });
  } catch (error) {
    next(error);
  }
  });
}

// Reset user password (admin)
async function resetPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await usersService.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await usersService.updateById(id, { password: hashedPassword });
    // An admin changing their own password stays signed in on this session only
    if (id === req.session.userId) req.session.authFp = authFingerprint(await usersService.findById(id));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// Revoke all passkeys for a user (admin)
async function revokePasskeys(req, res, next) {
  try {
    const { id } = req.params;

    const user = await usersService.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await usersService.updateById(id, { webauthnCredentials: [] });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// Change someone's role (admin only). You cannot change your own, and the last admin cannot be demoted.
async function updateRole(req, res, next) {
  return exclusive(async () => {
  try {
    const { id } = req.params;
    const role = req.body.role;
    if (role !== 'admin' && role !== 'editor') return res.status(400).json({ error: 'Role must be admin or editor' });
    if (id === req.session.userId) return res.status(400).json({ error: 'You cannot change your own role.' });
    const user = await usersService.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (role === 'editor' && roleOf(user) === 'admin') {
      const admins = (await usersService.findAll()).filter((u) => roleOf(u) === 'admin');
      if (admins.length <= 1) return res.status(400).json({ error: 'There must be at least one admin.' });
    }
    await usersService.updateById(id, { role });
    res.json({ success: true, role });
  } catch (error) { next(error); }
  });
}

// Delete user (admin)
async function deleteUser(req, res, next) {
  return exclusive(async () => {
  try {
    const { id } = req.params;

    const user = await usersService.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (user.id === req.session.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Ensure at least one admin remains
    const users = await usersService.findAll();
    if (roleOf(user) === 'admin' && users.filter((u) => roleOf(u) === 'admin').length <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }

    await usersService.deleteById(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
  });
}

module.exports = {
  establishSession,
  getSigninConfig,
  login,
  logout,
  getStatus,
  getCsrfToken,
  startWebAuthnRegistration,
  finishWebAuthnRegistration,
  startWebAuthnLogin,
  finishWebAuthnLogin,
  // User management
  getUsers,
  createUser,
  updateRole,
  resetPassword,
  revokePasskeys,
  deleteUser
};
