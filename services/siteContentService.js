// Editable site copy and images, with draft / publish / history.
// Stored in the existing settings store as three keys:
//   site_content_live, site_content_draft  (objects holding only the fields the owner has changed)
//   site_content_history                   (previous live versions, newest first, capped)
// Empty or missing fields fall back to DEFAULTS, so the site always has complete copy.
const { v4: uuidv4 } = require('uuid');
const DataService = require('./dataService');
const DbService = require('./dbService');
const config = require('../config');

const settingsStore = config.database.useDatabase
  ? new DbService('site_settings')
  : new DataService(config.paths.settingsFile);

const HISTORY_LIMIT = 20;
const KEYS = { live: 'site_content_live', draft: 'site_content_draft', history: 'site_content_history' };

// Every editable field. `max` is a hard server-side limit. Order here is the order in the editor.
const f = (path, label, group, type, max, def) => ({ path, label, group, type, max, default: def });
const FIELDS = [
  f('hero.c1Title', 'Headline 1 (the first thing visitors read)', 'Hero', 'text', 70, 'Software shaped by real work.'),
  f('hero.c1Text', 'Line under headline 1', 'Hero', 'textarea', 180, 'A small senior studio building focused software for teams that make things happen.'),
  f('hero.c2Title', 'Headline 2', 'Hero', 'text', 70, 'We watch how work actually happens.'),
  f('hero.c2Text', 'Line under headline 2', 'Hero', 'textarea', 180, 'We sit with the people doing the work and map what really happens, not what the diagram says.'),
  f('hero.c3Title', 'Headline 3', 'Hero', 'text', 70, "Then remove the steps that don't matter."),
  f('hero.c3Text', 'Line under headline 3', 'Hero', 'textarea', 180, 'Shadow notes and re-keyed data are requirements in disguise. We remove what does not earn its place.'),
  f('hero.c4Title', 'Headline 4', 'Hero', 'text', 70, "What's left is clear and stays that way."),
  f('hero.c4Text', 'Line under headline 4', 'Hero', 'textarea', 180, 'Lightweight systems that people can read at a glance and maintain for years.'),

  f('practices.consultingTitle', 'Consulting title', 'Two practices', 'text', 40, 'Consulting'),
  f('practices.consultingText', 'Consulting text', 'Two practices', 'textarea', 160, 'We watch how your teams really work and remove the steps that do not matter.'),
  f('practices.productsTitle', 'Products title', 'Two practices', 'text', 40, 'Products'),
  f('practices.productsText', 'Products text', 'Two practices', 'textarea', 160, 'DataDragon and TableFlow, built from the same habit.'),

  f('sections.workTitle', 'Selected work heading', 'Section headings', 'text', 60, 'Selected work'),
  f('sections.productsHeading', 'Products heading', 'Section headings', 'text', 60, 'Systems that fit the work.'),
  f('sections.engagementTitle', 'Engagement heading', 'Section headings', 'text', 60, 'How an engagement runs'),
  f('sections.insightsTitle', 'Insights heading', 'Section headings', 'text', 60, 'Insights'),

  f('steps.s1Title', 'Step 1 title', 'Engagement steps', 'text', 40, 'Observe'),
  f('steps.s1Text', 'Step 1 text', 'Engagement steps', 'textarea', 120, 'See the real workflow, not just the plan.'),
  f('steps.s2Title', 'Step 2 title', 'Engagement steps', 'text', 40, 'Find the friction'),
  f('steps.s2Text', 'Step 2 text', 'Engagement steps', 'textarea', 120, 'Spot what slows people and progress.'),
  f('steps.s3Title', 'Step 3 title', 'Engagement steps', 'text', 40, 'Remove the steps'),
  f('steps.s3Text', 'Step 3 text', 'Engagement steps', 'textarea', 120, 'Cut what is not essential and keep what works.'),
  f('steps.s4Title', 'Step 4 title', 'Engagement steps', 'text', 40, 'Keep it clear'),
  f('steps.s4Text', 'Step 4 text', 'Engagement steps', 'textarea', 120, 'A simpler path that stays maintainable.'),

  f('about.title', 'About heading', 'About', 'text', 60, 'A small senior team.'),
  f('about.note', 'Founder note', 'About', 'textarea', 240, 'We started Observer because people kept working around the software that was meant to help them.'),
  f('about.details', 'Supporting text', 'About', 'textarea', 400, 'Engagements are senior-led and deliberate. Scope stays tight, ownership stays clear, and decisions are recorded. Founded 2024. Observer is a Techademy LLC company.'),

  f('closing.headline', 'Closing headline', 'Closing', 'text', 70, 'Tell us where the work gets stuck.'),
  f('footer.tagline', 'Footer line', 'Footer', 'text', 120, 'Software shaped by real work. Observer is a Techademy LLC company.'),

  f('seo.homeTitle', 'Home page title (browser tab and search results)', 'Search and sharing', 'text', 70, 'Observer | Software shaped by real work'),
  f('seo.homeDescription', 'Home page description (search results and link previews)', 'Search and sharing', 'textarea', 160, 'Observer is a small senior studio that watches real workflows, finds friction and removes steps. Consulting and products from the same habit.'),

  f('images.founder', 'Founder photo (4:5 portrait works best)', 'Images', 'image', 140, ''),
  f('images.team1', 'Team photo 1 (optional)', 'Images', 'image', 140, ''),
  f('images.team2', 'Team photo 2 (optional)', 'Images', 'image', 140, '')
];
const FIELD_BY_PATH = Object.fromEntries(FIELDS.map((x) => [x.path, x]));

// ---- small path helpers
const getPath = (obj, p) => p.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
function setPath(obj, p, v) {
  const keys = p.split('.');
  let o = obj;
  keys.slice(0, -1).forEach((k) => { o[k] = o[k] && typeof o[k] === 'object' ? o[k] : {}; o = o[k]; });
  o[keys[keys.length - 1]] = v;
}
const flat = (obj) => Object.fromEntries(FIELDS.map((x) => [x.path, getPath(obj, x.path) || '']));

// ---- validation: only known fields, plain text only, hard length limits
function clean(input) {
  const content = {};
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { content, errors: ['Content must be an object'] };
  }
  for (const field of FIELDS) {
    const raw = getPath(input, field.path);
    if (raw === undefined || raw === null || raw === '') continue; // empty means "use the default"
    if (typeof raw !== 'string') { errors.push(`${field.label}: must be text`); continue; }
    let s = raw
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // control characters
      .replace(/\s*[—–]\s*/g, ' - ')                         // house style: no em/en dashes
      .trim();
    if (field.type !== 'textarea') s = s.replace(/\s+/g, ' ');       // single-line fields stay single-line
    if (!s) continue;
    if (s.length > field.max) { errors.push(`${field.label}: ${s.length} characters, the limit is ${field.max}`); continue; }
    if (field.type === 'image' && !/^\/uploads\/[A-Za-z0-9._-]{1,120}$/.test(s)) { errors.push(`${field.label}: must be an image uploaded here`); continue; }
    setPath(content, field.path, s);
  }
  return { content, errors };
}

// ---- defaults merged with overrides: always complete
function resolve(overrides) {
  const out = {};
  for (const field of FIELDS) {
    const v = getPath(overrides || {}, field.path);
    setPath(out, field.path, typeof v === 'string' && v ? v : field.default);
  }
  return out;
}

// ---- storage
async function read(key) {
  const row = await settingsStore.findOne((s) => s.key === key);
  return row ? row.value : undefined;
}
async function write(key, value) {
  const row = await settingsStore.findOne((s) => s.key === key);
  const stored = config.database.useDatabase && typeof value !== 'object' ? JSON.stringify(value) : value;
  if (row) await settingsStore.updateById(row.id, { value: stored });
  else await settingsStore.create({ id: uuidv4(), key, value: stored });
}

const object = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

async function getLive() { return object(await read(KEYS.live)); }
async function getDraft() {
  const draft = await read(KEYS.draft);
  return draft === undefined ? getLive() : object(draft);
}
async function getHistory() {
  const h = await read(KEYS.history);
  return Array.isArray(h) ? h : [];
}

async function status() {
  const [live, draft, history] = await Promise.all([getLive(), getDraft(), getHistory()]);
  return {
    live, draft,
    unpublished: JSON.stringify(flat(live)) !== JSON.stringify(flat(draft)),
    history: history.map((h) => ({ id: h.id, savedAt: h.savedAt, savedBy: h.savedBy }))
  };
}

async function saveDraft(input) {
  const { content, errors } = clean(input);
  if (errors.length) return { errors };
  await write(KEYS.draft, content);
  return { content };
}

async function publish(user) {
  const [live, draft, history] = await Promise.all([getLive(), getDraft(), getHistory()]);
  const { content, errors } = clean(draft); // re-validate before anything goes live
  if (errors.length) return { errors };
  if (JSON.stringify(flat(live)) === JSON.stringify(flat(content))) return { content, unchanged: true };
  const entry = { id: uuidv4(), savedAt: new Date().toISOString(), savedBy: user || 'unknown', content: live };
  await write(KEYS.history, [entry, ...history].slice(0, HISTORY_LIMIT));
  await write(KEYS.live, content);
  await write(KEYS.draft, content);
  return { content };
}

async function discardDraft() {
  await write(KEYS.draft, await getLive());
}

async function restoreToDraft(id) {
  const entry = (await getHistory()).find((h) => h.id === id);
  if (!entry) return null;
  const { content, errors } = clean(entry.content);
  if (errors.length) return { errors };
  await write(KEYS.draft, content);
  return { content };
}

// What the public pages render (live), or the draft when an admin is previewing
async function resolved({ draft = false } = {}) {
  return resolve(draft ? await getDraft() : await getLive());
}

const fieldMeta = () => FIELDS.map(({ path, label, group, type, max, default: def }) => ({ path, label, group, type, max, default: def }));

module.exports = { FIELDS, FIELD_BY_PATH, fieldMeta, clean, resolve, resolved, status, saveDraft, publish, discardDraft, restoreToDraft, getHistory, read, write };
