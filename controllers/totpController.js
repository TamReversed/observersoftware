// Sign in with a one-time code (username + the 6-digit code from Dashlane), plus setup/disable.
//
// Because the code is the ONLY factor for accounts that turn this on, it is defended heavily:
//  - 5 wrong tries lock the account for 15 min; each further 5 wrong tries doubles that, up to 24 h
//  - attempts for one username are processed one at a time, so parallel guessing cannot beat the counter
//  - each code works once; recovery codes are single-use and stored hashed
//  - the secret is encrypted at rest; the response never says whether a username exists
const bcrypt = require('bcrypt');
const DataService = require('../services/dataService');
const DbService = require('../services/dbService');
const totp = require('../services/totpService');
const config = require('../config');
const { establishSession } = require('./authController');

const usersService = config.database.useDatabase ? new DbService('users') : new DataService(config.paths.usersFile);

const FAIL = { error: 'That username or code is not right.' };
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const asArray = (v) => { if (Array.isArray(v)) return v; try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } };

// Usernames that do not exist (or have no code set up) get an identical failure counter and lock, kept in
// memory, so a "locked" answer never confirms that an account exists.
const decoys = new Map();
function decoyAttempt(name) {
  const now = Date.now();
  if (decoys.size > 5000) for (const [k, v] of decoys) if (v.until < now && now - v.at > 3600e3) decoys.delete(k);
  const d = decoys.get(name) || { failures: 0, until: 0, at: now };
  if (d.until > now) return { locked: true, until: d.until };
  d.failures += 1; d.at = now;
  if (d.failures % 5 === 0) d.until = now + lockMinutes(d.failures) * 60 * 1000;
  decoys.set(name, d);
  return d.until > now ? { locked: true, until: d.until } : { locked: false };
}

// ---- one attempt at a time per username
const chains = new Map();
function serial(key, fn) {
  const prev = chains.get(key) || Promise.resolve();
  const run = prev.catch(() => {}).then(fn);
  const tail = run.catch(() => {}).then(() => { if (chains.get(key) === tail) chains.delete(key); });
  chains.set(key, tail);
  return run;
}

const lockedUntil = (u) => (u.totpLockedUntil ? new Date(u.totpLockedUntil).getTime() : 0);
function lockMinutes(failures) {            // 5 -> 15, 10 -> 30, 15 -> 60 ... max 24 h
  const rounds = Math.floor(failures / 5);
  return Math.min(1440, 15 * 2 ** Math.max(0, rounds - 1));
}

// Checks a code (one-time code or recovery code) for a user. Updates counters. Returns { ok, locked, until }.
async function checkCode(user, rawCode) {
  const now = Date.now();
  if (lockedUntil(user) > now) return { ok: false, locked: true, until: lockedUntil(user) };

  const code = str(rawCode, 40);
  let ok = false;
  const updates = {};

  if (/^\s*\d{3}\s?\d{3}\s*$/.test(code)) {
    let secret;
    try { secret = totp.decrypt(user.totpSecret); } catch { secret = null; }
    const step = secret ? totp.verify(secret, code, { minStep: Number(user.totpLastStep) || 0 }) : null;
    if (step !== null) { ok = true; updates.totpLastStep = step; }
  } else if (totp.normaliseRecovery(code).length === 10) {
    const hash = totp.hashRecovery(code);
    const list = asArray(user.totpRecovery);
    const idx = list.findIndex((h) => totp.safeEqual(h, hash));
    if (idx >= 0) { ok = true; updates.totpRecovery = list.filter((_, i) => i !== idx); }
  }

  if (ok) {
    Object.assign(updates, { totpFailures: 0, totpLockedUntil: null });
    await usersService.updateById(user.id, updates);
    return { ok: true };
  }

  const failures = (Number(user.totpFailures) || 0) + 1;
  const upd = { totpFailures: failures };
  let until;
  if (failures % 5 === 0) { until = now + lockMinutes(failures) * 60 * 1000; upd.totpLockedUntil = new Date(until).toISOString(); }
  await usersService.updateById(user.id, upd);
  return { ok: false, locked: !!until, until };
}

const when = (ms) => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const lockedReply = (res, until) => res.status(429).json({
  error: `Too many wrong codes. This account is locked until ${when(until)}. Use a recovery code, or ask another admin to reset it.`
});

// ---- POST /api/auth/totp/login   { username, code }
async function login(req, res, next) {
  try {
    const username = str(req.body.username, 50);
    const code = str(req.body.code, 40);
    if (!username || !code) return res.status(400).json({ error: 'Enter your username and the code.' });

    const result = await serial(username.toLowerCase(), async () => {
      const users = await usersService.findAll();
      const user = users.find((u) => u.username === username);
      if (!user || !user.totpEnabled || !user.totpSecret) {
        totp.verify(totp.newSecret(), code); // same amount of work as a real check, so timing reveals nothing
        return { unknown: true, ...decoyAttempt(username.toLowerCase()) };
      }
      const r = await checkCode(user, code);
      return { ...r, user };
    });

    if (result.locked) return lockedReply(res, result.until);
    if (result.unknown) return res.status(401).json(FAIL);
    if (!result.ok) return res.status(401).json(FAIL);

    establishSession(req, result.user, (err) => {
      if (err) return next(err);
      res.json({ success: true, username: result.user.username });
    });
  } catch (error) { next(error); }
}

// ---- POST /api/auth/totp/setup   (signed in) -> secret + QR; nothing is saved until the code is confirmed
async function setup(req, res, next) {
  try {
    const user = await usersService.findById(req.session.userId);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (user.totpEnabled) return res.status(400).json({ error: 'One-time codes are already turned on for this account.' });
    const secret = totp.newSecret();
    req.session.pendingTotp = { secret: totp.encrypt(secret), at: Date.now() };
    const url = totp.otpauthUrl(secret, user.username);
    res.json({ secret: secret.match(/.{1,4}/g).join(' '), otpauthUrl: url, qrSvg: await totp.qrSvg(url) });
  } catch (error) { next(error); }
}

// ---- POST /api/auth/totp/enable   { code } -> saves the secret, returns recovery codes ONCE
async function enable(req, res, next) {
  try {
    const user = await usersService.findById(req.session.userId);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (user.totpEnabled) { delete req.session.pendingTotp; return res.status(400).json({ error: 'One-time codes are already turned on for this account.' }); }
    const pending = req.session.pendingTotp;
    if (!pending || Date.now() - pending.at > 15 * 60 * 1000) {
      return res.status(400).json({ error: 'Setup expired. Start again.' });
    }
    const secret = totp.decrypt(pending.secret);
    const step = totp.verify(secret, str(req.body.code, 20));
    if (step === null) return res.status(400).json({ error: 'That code does not match. Check that Dashlane saved the key, then enter the current code.' });

    const recovery = totp.newRecoveryCodes(8);
    await usersService.updateById(user.id, {
      totpSecret: totp.encrypt(secret), totpEnabled: true, totpLastStep: step,
      totpRecovery: recovery.map(totp.hashRecovery), totpFailures: 0, totpLockedUntil: null
    });
    delete req.session.pendingTotp;
    res.json({ success: true, recoveryCodes: recovery });
  } catch (error) { next(error); }
}

// ---- POST /api/auth/totp/disable   { code }  (a current code or a recovery code proves it is really you)
async function disable(req, res, next) {
  try {
    const me = await usersService.findById(req.session.userId);
    if (!me) return res.status(401).json({ error: 'Unauthorized' });
    const result = await serial(me.username.toLowerCase(), async () => {
      const user = await usersService.findById(req.session.userId);
      if (!user || !user.totpEnabled) return { notOn: true };
      const r = await checkCode(user, req.body.code);
      if (r.ok) {
        await usersService.updateById(user.id, { totpEnabled: false, totpSecret: null, totpRecovery: [], totpLastStep: 0, totpFailures: 0, totpLockedUntil: null });
      }
      return r;
    });
    if (result.notOn) return res.status(400).json({ error: 'One-time codes are not turned on.' });
    if (result.locked) return lockedReply(res, result.until);
    if (!result.ok) return res.status(401).json({ error: 'That code is not right.' });
    res.json({ success: true });
  } catch (error) { next(error); }
}

// ---- DELETE /api/auth/users/:id/totp   (an admin resets another account that lost its device)
async function adminReset(req, res, next) {
  try {
    const { id } = req.params;
    if (id === req.session.userId) return res.status(400).json({ error: 'Use "Turn off" for your own account.' });
    const user = await usersService.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await serial(user.username.toLowerCase(), () => usersService.updateById(id, { totpEnabled: false, totpSecret: null, totpRecovery: [], totpLastStep: 0, totpFailures: 0, totpLockedUntil: null }));
    decoys.delete(user.username.toLowerCase());
    res.json({ success: true });
  } catch (error) { next(error); }
}

module.exports = { login, setup, enable, disable, adminReset };
