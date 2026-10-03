const DbService = require('../services/dbService');
const DataService = require('../services/dataService');
const siteContent = require('../services/siteContentService');
const config = require('../config');

const settingsService = config.database.useDatabase
  ? new DbService('site_settings')
  : new DataService(config.paths.settingsFile);

// Only these keys can be read publicly or changed through the generic settings API.
// Site copy has its own draft/publish endpoints (site_content_* keys are never exposed here).
const PUBLIC_KEYS = ['site_name', 'tagline', 'meta_description', 'social_links'];
const EDITABLE_KEYS = ['site_name', 'tagline', 'meta_description', 'contact_email', 'social_links'];
const SOCIAL_KEYS = ['linkedin', 'github', 'twitter', 'instagram'];

const toMap = (rows, keys) => {
  const map = {};
  (Array.isArray(rows) ? rows : []).forEach((r) => { if (r && keys.includes(r.key)) map[r.key] = r.value; });
  return map;
};

// Returns an error string, or null if the value is acceptable (and normalised via `out`)
function validate(key, value, out) {
  if (key === 'social_links') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Social links must be an object';
    const links = {};
    for (const k of SOCIAL_KEYS) {
      const v = typeof value[k] === 'string' ? value[k].trim() : '';
      if (v && !/^https?:\/\/[^\s]{3,300}$/i.test(v)) return `${k}: enter a full web address starting with https://`;
      links[k] = v;
    }
    out.value = links;
    return null;
  }
  if (typeof value !== 'string') return `${key}: must be text`;
  const v = value.trim();
  if (v.length > 300) return `${key}: too long`;
  if (key === 'contact_email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Contact email is not valid';
  out.value = v;
  return null;
}

// Public: only the safe, public keys (never drafts, history or private settings)
async function getSettings(req, res, next) {
  try {
    res.json(toMap(await settingsService.findAll(), PUBLIC_KEYS));
  } catch (error) { next(error); }
}

// Admin: the editable settings as a simple object
async function getAllSettings(req, res, next) {
  try {
    res.json(toMap(await settingsService.findAll(), EDITABLE_KEYS));
  } catch (error) { next(error); }
}

async function getSetting(req, res, next) {
  try {
    const { key } = req.params;
    if (!EDITABLE_KEYS.includes(key)) return res.status(404).json({ error: 'Setting not found' });
    const row = await settingsService.findOne((s) => s.key === key);
    if (!row) return res.status(404).json({ error: 'Setting not found' });
    res.json(row);
  } catch (error) { next(error); }
}

async function saveMany(pairs, res) {
  const errors = [];
  const ready = [];
  for (const { key, value } of pairs) {
    if (!EDITABLE_KEYS.includes(key)) { errors.push(`${key}: not an editable setting`); continue; }
    const out = {};
    const err = validate(key, value, out);
    if (err) errors.push(err); else ready.push({ key, value: out.value });
  }
  if (errors.length) return res.status(400).json({ error: errors[0], errors });
  for (const { key, value } of ready) await siteContent.write(key, value); // creates the setting if it does not exist yet
  return res.json({ ok: true, saved: ready.map((r) => r.key) });
}

async function updateSetting(req, res, next) {
  try {
    if (req.body.value === undefined) return res.status(400).json({ error: 'Value is required' });
    await saveMany([{ key: req.params.key, value: req.body.value }], res);
  } catch (error) { next(error); }
}

// Accepts { settings: [{ key, value }] } (what the admin sends) or a plain { key: value } object
async function updateSettings(req, res, next) {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Settings are required' });
    let pairs;
    if (Array.isArray(body.settings)) pairs = body.settings.map((s) => ({ key: s && s.key, value: s && s.value }));
    else pairs = Object.entries(body).filter(([k]) => k !== 'csrfToken').map(([key, value]) => ({ key, value }));
    await saveMany(pairs, res);
  } catch (error) { next(error); }
}

module.exports = { getSettings, getAllSettings, getSetting, updateSetting, updateSettings };
