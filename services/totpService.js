// One-time codes (TOTP, RFC 6238) for admin sign-in: the 6-digit code that rotates every 30 seconds
// and that Dashlane (or any authenticator app) generates. No third-party OTP library: HMAC-SHA1 from Node crypto.
const crypto = require('crypto');
const QRCode = require('qrcode');
const config = require('../config');

const STEP = 30;          // seconds per code
const DIGITS = 6;
const WINDOW = 1;         // also accept the previous and next code (clock drift)
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf) {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
function base32Decode(str) {
  let bits = 0, value = 0; const out = [];
  for (const ch of str.replace(/[\s=-]/g, '').toUpperCase()) {
    const i = B32.indexOf(ch); if (i < 0) throw new Error('bad base32');
    value = (value << 5) | i; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

const newSecret = () => base32Encode(crypto.randomBytes(20)); // 160 bits

function hotp(secretBuf, counter, digits = DIGITS) {
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac('sha1', secretBuf).update(msg).digest();
  const o = h[h.length - 1] & 15;
  const code = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(code % 10 ** digits).padStart(digits, '0');
}

const stepAt = (ms = Date.now()) => Math.floor(ms / 1000 / STEP);
const safeEqual = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

// Returns the matching time step (so it can be remembered and never accepted twice), or null
function verify(secretB32, code, { now = Date.now(), minStep = 0 } = {}) {
  const clean = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean)) return null;
  const secret = base32Decode(secretB32);
  const cur = stepAt(now);
  let hit = null;
  for (let d = -WINDOW; d <= WINDOW; d++) {            // always check all three: constant work
    const step = cur + d;
    if (safeEqual(hotp(secret, step), clean) && step > minStep && hit === null) hit = step;
  }
  return hit;
}

function otpauthUrl(secretB32, account) {
  const label = encodeURIComponent(`Observer:${account}`);
  return `otpauth://totp/${label}?secret=${secretB32}&issuer=Observer&algorithm=SHA1&digits=${DIGITS}&period=${STEP}`;
}
const qrSvg = (url) => QRCode.toString(url, { type: 'svg', margin: 3, errorCorrectionLevel: 'M' });

// ---- secrets are encrypted at rest (AES-256-GCM). Key: TOTP_ENCRYPTION_KEY if set, else derived from SESSION_SECRET.
const key = () => crypto.createHash('sha256').update('observer-totp|' + (process.env.TOTP_ENCRYPTION_KEY || config.session.secret)).digest();
function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return ['v1', iv.toString('base64'), c.getAuthTag().toString('base64'), enc.toString('base64')].join('.');
}
function decrypt(blob) {
  const [v, iv, tag, enc] = String(blob || '').split('.');
  if (v !== 'v1') throw new Error('bad secret');
  const d = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(enc, 'base64')), d.final()]).toString('utf8');
}

// ---- recovery codes: 10 characters from an unambiguous alphabet (about 50 bits each), stored hashed
const RC_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newRecoveryCodes(n = 8) {
  return Array.from({ length: n }, () => {
    const b = crypto.randomBytes(10); let s = '';
    for (let i = 0; i < 10; i++) s += RC_ALPHABET[b[i] % RC_ALPHABET.length];
    return `${s.slice(0, 5)}-${s.slice(5)}`;
  });
}
const normaliseRecovery = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const hashRecovery = (c) => crypto.createHash('sha256').update('observer-recovery|' + normaliseRecovery(c)).digest('hex');

module.exports = { newSecret, verify, otpauthUrl, qrSvg, encrypt, decrypt, newRecoveryCodes, hashRecovery, normaliseRecovery, stepAt, hotp, base32Decode, safeEqual, STEP };
