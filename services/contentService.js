const fs = require('fs');
const path = require('path');
const DataService = require('./dataService');
const DbService = require('./dbService');
const postsStore = require('./postsStore');
const { renderMarkdown } = require('./markdownService');
const { slugify, calculateReadTime } = require('../utils/helpers');
const { CATEGORIES } = require('../utils/constants');
const config = require('../config');

const store = (table, file) => (config.database.useDatabase ? new DbService(table) : new DataService(file));

const settingsStore = store('site_settings', config.paths.settingsFile);
const workStore = store('work', config.paths.workFile);
const capabilitiesStore = store('capabilities', config.paths.capabilitiesFile);
const testimonialsStore = store('testimonials', config.paths.testimonialsFile);
const faqsStore = store('faqs', config.paths.faqsFile);

const byOrder = (a, b) => (a.order || 0) - (b.order || 0);
const ensureArray = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};

// Placeholder images the owner has not replaced yet (matched by file size)
let placeholderCache;
function placeholders() {
  if (placeholderCache) return placeholderCache;
  try {
    placeholderCache = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'assets', 'placeholders.json'), 'utf8'));
  } catch { placeholderCache = {}; }
  return placeholderCache;
}
function isPlaceholder(rel) {
  const original = placeholders()[rel];
  if (original === undefined) return false;
  try { return fs.statSync(path.join(__dirname, '..', 'public', 'assets', rel)).size === original; } catch { return true; }
}

async function getSettings() {
  const rows = await settingsStore.findAll();
  const s = {};
  (Array.isArray(rows) ? rows : []).forEach((r) => { if (r && r.key) s[r.key] = r.value; });
  const social = s.social_links && typeof s.social_links === 'object' ? s.social_links : {};
  return {
    social: {
      linkedin: /^https?:\/\//.test(social.linkedin || '') ? social.linkedin : '',
      github: /^https?:\/\//.test(social.github || '') ? social.github : ''
    },
    legalAddress: process.env.LEGAL_ADDRESS || '',
    governingState: process.env.GOVERNING_STATE || ''
  };
}

async function getWork() {
  const items = (await workStore.findAll((w) => w.published)).sort(byOrder);
  return items.map((w) => ({
    ...w,
    slug: slugify(w.industry || w.id),
    tags: ensureArray(w.tags),
    metrics: ensureArray(w.metrics).filter((m) => m && m.value && m.label),
    year: (w.date || '').slice(0, 4)
  }));
}

async function getProducts() {
  const items = (await capabilitiesStore.findAll((c) => c.published)).sort(byOrder);
  return items.map((c) => ({
    ...c,
    slug: slugify(c.title),
    features: ensureArray(c.features),
    screenshots: ensureArray(c.screenshots)
  }));
}

async function getProduct(slug) {
  return (await getProducts()).find((p) => p.slug === slug) || null;
}

function decoratePost(p) {
  return {
    ...p,
    categoryName: (CATEGORIES.find((c) => c.slug === p.category) || {}).name || p.category || '',
    readTime: calculateReadTime(p.content || ''),
    date: p.publishedAt || p.updatedAt || null
  };
}

async function getPosts({ category, q, page = 1, limit = 8 } = {}) {
  let posts = (await postsStore.findAll((p) => p.published))
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  if (category) posts = posts.filter((p) => p.category === category);
  if (q) {
    const needle = q.toLowerCase();
    posts = posts.filter((p) => `${p.title} ${p.excerpt} ${p.content}`.toLowerCase().includes(needle));
  }
  const total = posts.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const current = Math.min(Math.max(1, page), pages);
  return { posts: posts.slice((current - 1) * limit, current * limit).map(decoratePost), total, pages, page: current };
}

async function getPost(slug) {
  const raw = await postsStore.findBySlug(slug);
  if (!raw || !raw.published) return null;
  const post = decoratePost(raw);
  // The page supplies its own h1: drop a leading title heading and demote any other h1
  post.html = renderMarkdown(raw.content)
    .replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, '')
    .replace(/<h1/g, '<h2').replace(/<\/h1>/g, '</h2>');
  const related = (await getPosts({ limit: 50 })).posts.filter((p) => p.slug !== slug);
  post.related = related.filter((p) => p.category === raw.category).concat(related).filter((p, i, a) => a.findIndex((x) => x.slug === p.slug) === i).slice(0, 2);
  return post;
}

async function getTestimonials() {
  return (await testimonialsStore.findAll((t) => t.published)).sort(byOrder);
}

async function getFaqs() {
  return (await faqsStore.findAll((f) => f.published)).sort(byOrder);
}

module.exports = {
  getSettings, getWork, getProducts, getProduct, getPosts, getPost,
  getTestimonials, getFaqs, isPlaceholder, categories: CATEGORIES
};
