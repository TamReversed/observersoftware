const bcrypt = require('bcrypt');
const DataService = require('../services/dataService');
const DbService = require('../services/dbService');
const config = require('../config');
const webauthnService = require('../services/webauthnService');
const { getRpIDFromOrigin } = require('../services/webauthnService');

// Use database if available, otherwise fall back to JSON files
const usersService = config.database.useDatabase
  ? new DbService('users')
  : new DataService(config.paths.usersFile);

// Failed login tracking for account lockout
const failedLogins = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function isAccountLocked(username) {
  const record = failedLogins.get(username);
  if (!record) return false;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    const timeSinceLockout = Date.now() - record.lastAttempt;
    if (timeSinceLockout < LOCKOUT_DURATION) {
      return true;
    }
    // Lockout expired, reset
    failedLogins.delete(username);
  }
  return false;
}

function recordFailedLogin(username) {
  const record = failedLogins.get(username) || { attempts: 0, lastAttempt: 0 };
  record.attempts++;
  record.lastAttempt = Date.now();
  failedLogins.set(username, record);
}

function clearFailedLogins(username) {
  failedLogins.delete(username);
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check for account lockout
    if (isAccountLocked(username)) {
      return res.status(429).json({
        error: 'Account temporarily locked due to too many failed attempts. Please try again later.'
      });
    }

    const users = await usersService.findAll();
    const user = users.find(u => u.username === username);

    if (!user) {
      recordFailedLogin(username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      recordFailedLogin(username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Successful login - clear failed attempts
    clearFailedLogins(username);

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ success: true, username: user.username });
  } catch (error) {
    next(error);
  }
}

function logout(req, res) {
  req.session.destroy();
  res.json({ success: true });
}

async function getStatus(req, res) {
  if (req.session && req.session.userId) {
    const user = await usersService.findById(req.session.userId);
    res.json({
      authenticated: true,
      username: req.session.username,
      hasPasskey: user && user.webauthnCredentials && user.webauthnCredentials.length > 0
    });
  } else {
    res.json({ authenticated: false });
  }
}

function getCsrfToken(req, res) {
  res.json({ csrfToken: req.session.csrfToken || null });
}

// Helper to get origin from request
function getOriginFromRequest(req) {
  const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const host = req.headers.host || req.get('host');
  return `${protocol}://${host}`;
}

// WebAuthn Registration - Start
async function startWebAuthnRegistration(req, res, next) {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const users = await usersService.findAll();
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.webauthnCredentials) {
      user.webauthnCredentials = [];
      await usersService.updateById(user.id, { webauthnCredentials: [] });
    }

    if (user.webauthnCredentials.length > 0) {
      return res.status(400).json({ error: 'User already has a passkey registered' });
    }

    const origin = getOriginFromRequest(req);

    try {
      const options = await webauthnService.generateRegistrationOptionsForUser(
        user.id,
        user.username,
        user.webauthnCredentials,
        origin
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

    const origin = getOriginFromRequest(req);
    const rpID = getRpIDFromOrigin(origin);

    const options = {
      challenge: req.session.webauthnChallenge,
      rpID: rpID,
      origin: origin
    };

    try {
      const verification = await webauthnService.verifyRegistration(options, response, origin);

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

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check for account lockout
    if (isAccountLocked(username)) {
      return res.status(429).json({
        error: 'Account temporarily locked due to too many failed attempts. Please try again later.'
      });
    }

    const users = await usersService.findAll();
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.webauthnCredentials || user.webauthnCredentials.length === 0) {
      return res.status(400).json({ error: 'No passkey registered for this user' });
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

    const origin = getOriginFromRequest(req);

    try {
      const options = await webauthnService.generateAuthenticationOptionsForUser(
        user.id,
        validCredentials,
        origin
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

    const credential = user.webauthnCredentials.find(cred => cred.id === response.id);

    if (!credential) {
      recordFailedLogin(user.username);
      return res.status(400).json({ error: 'Credential not found. Please register a new passkey.' });
    }

    const origin = getOriginFromRequest(req);
    let rpID;
    try {
      rpID = new URL(origin).hostname;
    } catch {
      rpID = (req.headers.host || '').split(':')[0];
    }

    const options = {
      challenge: req.session.webauthnChallenge,
      rpID: rpID,
      origin: origin
    };

    const verification = await webauthnService.verifyAuthentication(
      options,
      response,
      credential,
      origin
    );

    if (!verification.verified) {
      recordFailedLogin(user.username);
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
    clearFailedLogins(user.username);

    // Create session
    req.session.userId = user.id;
    req.session.username = user.username;

    // Clear WebAuthn session
    delete req.session.webauthnChallenge;
    delete req.session.webauthnUserId;
    delete req.session.webauthnType;
    delete req.session.webauthnTimestamp;

    res.json({ success: true, username: user.username });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  logout,
  getStatus,
  getCsrfToken,
  startWebAuthnRegistration,
  finishWebAuthnRegistration,
  startWebAuthnLogin,
  finishWebAuthnLogin
};
