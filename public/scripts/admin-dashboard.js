// Preset Icons (matching the frontend icons.js)
const presetIcons = {
  "database": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 12V7a9 3 0 0 1 18 0v5M3 12a9 3 0 0 0 9 3 9 3 0 0 0 9-3"/></svg>`,
  "chart": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>`,
  "pieChart": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
  "trendingUp": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  "table": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>`,
  "grid": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  "list": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>`,
  "workflow": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>`,
  "gitBranch": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`,
  "repeat": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>`,
  "file": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`,
  "folder": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
  "users": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  "user": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  "lock": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  "shield": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  "settings": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  "mail": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  "messageSquare": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  "bell": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  "zap": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  "target": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  "compass": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  "layers": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  "box": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
  "cpu": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`,
  "activity": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  "code": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  "terminal": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>`,
  "search": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  "eye": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  "clock": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  "checkCircle": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`,
  "star": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  "globe": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  "link": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  "calendar": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  "package": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>`,
  "share": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>`,
  "filter": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
  "plug": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>`
};

// Content types configuration
const contentTypes = {
  // Content types with lists
  posts: { title: 'Posts', hasList: true, hasNew: true, endpoint: '/api/admin/posts' },
  work: { title: 'Work', hasList: true, hasNew: true, endpoint: '/api/admin/work' },
  capabilities: { title: 'Products', hasList: true, hasNew: true, endpoint: '/api/admin/capabilities' },
  messages: { title: 'Messages', hasList: true, hasNew: false, endpoint: '/api/admin/messages' },
  navigation: { title: 'Navigation', hasList: true, hasNew: true, endpoint: '/api/admin/navigation' },
  categories: { title: 'Categories', hasList: true, hasNew: true, endpoint: '/api/admin/categories' },
  testimonials: { title: 'Testimonials', hasList: true, hasNew: true, endpoint: '/api/admin/testimonials' },
  faqs: { title: 'FAQs', hasList: true, hasNew: true, endpoint: '/api/admin/faqs' },
  changelog: { title: 'Changelog', hasList: true, hasNew: true, endpoint: '/api/admin/changelog' },
  // Single-view types (no list)
  settings: { title: 'Settings', hasList: false, hasNew: false },
  homepage: { title: 'Homepage', hasList: false, hasNew: false },
  media: { title: 'Media', hasList: false, hasNew: false },
  users: { title: 'Users', hasList: false, hasNew: false }
};

// State
let currentType = 'posts';
let items = {};
let categories = [];
let currentItem = null;
let isNewItem = false;
let workTags = [];

// Capability-specific state
let capabilityFeatures = [];
let capabilityScreenshots = [];
let selectedIconType = 'preset';
let selectedPresetIcon = '';

// Elements
const itemsList = document.getElementById('itemsList');
const sidebarTitle = document.getElementById('sidebarTitle');
const sidebarListSection = document.getElementById('sidebarListSection');
const welcomeState = document.getElementById('welcomeState');
const toast = document.getElementById('toast');
const adminUser = document.getElementById('adminUser');
const newItemBtn = document.getElementById('newItemBtn');

// CSRF token management
let csrfToken = null;
async function getCsrfToken() {
  if (!csrfToken) {
    try {
      const res = await fetch('/api/auth/csrf-token');
      const data = await res.json();
      csrfToken = data.csrfToken;
    } catch (e) {
      console.error('Failed to get CSRF token:', e);
    }
  }
  return csrfToken;
}

// Helper function for authenticated fetch with CSRF
async function authenticatedFetch(url, options = {}) {
  const token = await getCsrfToken();
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'X-CSRF-Token': token || ''
  };

  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify({ ...options.body, csrfToken: token });
  } else if (options.body && typeof options.body === 'string') {
    try {
      const bodyObj = JSON.parse(options.body);
      options.body = JSON.stringify({ ...bodyObj, csrfToken: token });
    } catch {
      // If body is not JSON, add token as header only
    }
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin'
  });
}

// Check auth
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/status');
    const data = await res.json();
    if (!data.authenticated) {
      window.location.href = '/observe';
      return false;
    }
    adminUser.textContent = data.username;
    await getCsrfToken();
    return true;
  } catch {
    window.location.href = '/admin/login';
    return false;
  }
}

// Show toast
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type} visible`;
  setTimeout(() => toast.classList.remove('visible'), 3000);
}

// Slugify
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Load categories
async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    categories = await res.json();
    const select = document.getElementById('postCategory');
    if (select) {
      select.innerHTML = '';
      categories.forEach(c => {
        const option = document.createElement('option');
        option.value = c.slug || '';
        option.textContent = c.name || '';
        select.appendChild(option);
      });
    }
  } catch (e) {
    console.error('Failed to load categories:', e);
  }
}

// Load items for a content type
async function loadItems(type) {
  const config = contentTypes[type];
  if (!config || !config.hasList) return;

  try {
    const res = await fetch(config.endpoint);
    items[type] = await res.json();
    renderItemsList();

    // Update unread badge for messages
    if (type === 'messages') {
      const unread = items[type].filter(m => !m.read).length;
      const badge = document.getElementById('unreadBadge');
      if (badge) {
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'inline-block' : 'none';
      }
    }
  } catch (e) {
    showToast(`Failed to load ${type}`, 'error');
  }
}

// Render items list in sidebar
function renderItemsList() {
  const data = items[currentType] || [];

  if (data.length === 0) {
    itemsList.innerHTML = `<div class="empty-state">No ${escapeHtml(contentTypes[currentType]?.title || currentType)} yet.</div>`;
    return;
  }

  itemsList.innerHTML = '';

  data.forEach(item => {
    const id = currentType === 'posts' ? item.slug : item.id;
    let title, subtitle, statusClass, statusText;

    if (currentType === 'messages') {
      title = item.name || 'Unknown';
      subtitle = item.subject ? item.subject.substring(0, 30) : item.email;
      statusClass = item.read ? 'read' : 'unread';
      statusText = item.read ? 'Read' : 'New';
    } else if (currentType === 'posts') {
      title = item.title;
      subtitle = item.categoryName || 'Uncategorized';
      statusClass = item.published ? 'published' : '';
      statusText = item.published ? 'Published' : 'Draft';
    } else if (currentType === 'work') {
      title = item.industry;
      subtitle = item.problem ? item.problem.substring(0, 40) + '...' : '';
      statusClass = item.published ? 'published' : '';
      statusText = item.published ? 'Published' : 'Draft';
    } else if (currentType === 'capabilities') {
      title = item.title;
      subtitle = item.description?.substring(0, 40) || '';
      statusClass = item.published ? 'published' : '';
      statusText = item.published ? 'Published' : 'Draft';
    } else if (currentType === 'navigation') {
      title = item.label;
      subtitle = `${item.location} - ${item.url}`;
      statusClass = item.published ? 'published' : '';
      statusText = item.published ? 'Published' : 'Hidden';
    } else if (currentType === 'categories') {
      title = item.name;
      subtitle = item.type;
      statusClass = 'published';
      statusText = item.type;
    } else if (currentType === 'testimonials') {
      title = item.author_name;
      subtitle = item.author_company || item.content?.substring(0, 30);
      statusClass = item.published ? 'published' : '';
      statusText = item.published ? 'Published' : 'Draft';
    } else if (currentType === 'faqs') {
      title = item.question?.substring(0, 40);
      subtitle = item.category;
      statusClass = item.published ? 'published' : '';
      statusText = item.published ? 'Published' : 'Draft';
    } else if (currentType === 'changelog') {
      title = item.title;
      const date = new Date(item.date);
      subtitle = date.toLocaleDateString();
      statusClass = 'published';
      statusText = item.type;
    } else {
      title = item.title || item.name || item.id;
      subtitle = '';
      statusClass = item.published ? 'published' : '';
      statusText = item.published ? 'Published' : 'Draft';
    }

    const isActive = currentType === 'posts'
      ? currentItem?.slug === item.slug
      : currentItem?.id === item.id;

    const div = document.createElement('div');
    div.className = `list-item ${isActive ? 'active' : ''} ${currentType === 'messages' && !item.read ? 'unread' : ''}`;
    div.dataset.id = id;

    const titleDiv = document.createElement('div');
    titleDiv.className = 'list-item-title';
    titleDiv.textContent = title || '';

    const metaDiv = document.createElement('div');
    metaDiv.className = 'list-item-meta';

    const statusSpan = document.createElement('span');
    statusSpan.className = `item-status ${statusClass}`;
    statusSpan.textContent = statusText;
    metaDiv.appendChild(statusSpan);

    if (subtitle) {
      const subtitleSpan = document.createElement('span');
      subtitleSpan.textContent = subtitle;
      metaDiv.appendChild(subtitleSpan);
    }

    div.appendChild(titleDiv);
    div.appendChild(metaDiv);

    div.addEventListener('click', () => {
      const foundItem = currentType === 'posts'
        ? items[currentType].find(i => i.slug === id)
        : items[currentType].find(i => i.id === id);
      if (foundItem) selectItem(foundItem);
    });

    itemsList.appendChild(div);
  });
}

// Switch content type
function switchType(type) {
  currentType = type;
  currentItem = null;
  isNewItem = false;

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(nav => {
    nav.classList.toggle('active', nav.dataset.type === type);
  });

  // Hide all editors
  document.querySelectorAll('.editor-form').forEach(f => f.style.display = 'none');

  const config = contentTypes[type];

  // Show/hide sidebar list section
  if (config?.hasList) {
    sidebarListSection.style.display = 'flex';
    sidebarTitle.textContent = config.title;
    newItemBtn.style.display = config.hasNew ? 'inline-flex' : 'none';
    loadItems(type);
  } else {
    sidebarListSection.style.display = 'none';
  }

  // Handle special single-view types
  if (type === 'settings') {
    welcomeState.style.display = 'none';
    document.getElementById('settingsEditor').style.display = 'block';
    loadSettings();
  } else if (type === 'homepage') {
    welcomeState.style.display = 'none';
    document.getElementById('homepageEditor').style.display = 'block';
    loadHomepage();
  } else if (type === 'media') {
    welcomeState.style.display = 'none';
    document.getElementById('mediaEditor').style.display = 'block';
    loadMedia();
  } else if (type === 'users') {
    welcomeState.style.display = 'none';
    document.getElementById('usersEditor').style.display = 'block';
    loadUsers();
  } else {
    welcomeState.style.display = 'flex';
  }
}

// Select item for editing
function selectItem(item) {
  currentItem = item;
  isNewItem = false;
  welcomeState.style.display = 'none';

  document.querySelectorAll('.editor-form').forEach(f => f.style.display = 'none');

  if (currentType === 'posts') {
    showPostsEditor(item);
  } else if (currentType === 'work') {
    showWorkEditor(item);
  } else if (currentType === 'capabilities') {
    showCapabilitiesEditor(item);
  } else if (currentType === 'messages') {
    showMessagesViewer(item);
  } else if (currentType === 'navigation') {
    showNavigationEditor(item);
  } else if (currentType === 'categories') {
    showCategoriesEditor(item);
  } else if (currentType === 'testimonials') {
    showTestimonialsEditor(item);
  } else if (currentType === 'faqs') {
    showFaqsEditor(item);
  } else if (currentType === 'changelog') {
    showChangelogEditor(item);
  }

  renderItemsList();
}

// Show Posts Editor
function showPostsEditor(item) {
  document.getElementById('postsEditor').style.display = 'block';
  document.getElementById('postsEditorTitle').textContent = item ? 'Edit Post' : 'New Post';
  document.getElementById('postTitle').value = item?.title || '';
  document.getElementById('postExcerpt').value = item?.excerpt || '';
  document.getElementById('postCategory').value = item?.category || categories[0]?.slug || 'insights';
  document.getElementById('postContent').value = item?.content || '';
  document.getElementById('postPublished').checked = item?.published || false;
  document.getElementById('slugPreview').textContent = item?.slug || '-';
  document.getElementById('deletePostBtn').style.display = item ? 'inline-flex' : 'none';
}

// Show Work Editor
function showWorkEditor(item) {
  document.getElementById('workEditor').style.display = 'block';
  document.getElementById('workEditorTitle').textContent = item ? 'Edit Work Item' : 'New Work Item';
  document.getElementById('workIndustry').value = item?.industry || '';
  document.getElementById('workClient').value = item?.client || '';
  document.getElementById('workProblem').value = item?.problem || '';
  document.getElementById('workSolution').value = item?.solution || '';
  document.getElementById('workDate').value = item?.date || '';
  document.getElementById('workImage').value = item?.image || '';
  document.getElementById('workCaseStudy').value = item?.caseStudyUrl || '';
  document.getElementById('workPublished').checked = item?.published || false;
  document.getElementById('deleteWorkBtn').style.display = item ? 'inline-flex' : 'none';
  workTags = item?.tags || [];
  renderWorkTags();
}

// Show Capabilities Editor
function showCapabilitiesEditor(item) {
  document.getElementById('capabilitiesEditor').style.display = 'block';
  document.getElementById('capabilitiesEditorTitle').textContent = item ? 'Edit Product' : 'New Product';
  document.getElementById('capabilityTitle').value = item?.title || '';
  document.getElementById('capabilityDescription').value = item?.description || '';
  document.getElementById('capabilityLongDescription').value = item?.longDescription || '';
  document.getElementById('capabilityExternalUrl').value = item?.externalUrl || '';
  document.getElementById('capabilityOrder').value = item?.order || '';
  document.getElementById('capabilityPublished').checked = item?.published || false;
  document.getElementById('deleteCapabilityBtn').style.display = item ? 'inline-flex' : 'none';

  capabilityFeatures = item?.features || [];
  renderCapabilityFeatures();

  capabilityScreenshots = item?.screenshots || [];
  renderCapabilityScreenshots();

  const icon = item?.icon || { type: 'preset', preset: '' };
  selectedIconType = icon.type || 'preset';
  selectedPresetIcon = icon.preset || '';
  document.getElementById('capabilityIconSvg').value = icon.svg || '';
  document.getElementById('capabilityIconLottieUrl').value = icon.lottieUrl || '';

  updateIconTypeTabs();
  renderPresetIconGrid();
}

// Show Messages Viewer
function showMessagesViewer(item) {
  document.getElementById('messagesViewer').style.display = 'block';
  document.getElementById('messagesViewerTitle').textContent = item.subject || 'Message';
  document.getElementById('messageFrom').textContent = item.name || 'Unknown';
  document.getElementById('messageEmail').textContent = item.email || '';
  document.getElementById('messageSubject').textContent = item.subject || '(No subject)';
  const date = new Date(item.createdAt);
  document.getElementById('messageDate').textContent = date.toLocaleString();
  document.getElementById('messageContent').textContent = item.message || '';

  const markReadBtn = document.getElementById('markReadBtn');
  markReadBtn.style.display = item.read ? 'none' : 'inline-flex';

  if (!item.read) {
    markMessageAsRead(item.id);
  }
}

// Show Navigation Editor
function showNavigationEditor(item) {
  document.getElementById('navigationEditor').style.display = 'block';
  document.getElementById('navigationEditorTitle').textContent = item ? 'Edit Navigation Item' : 'New Navigation Item';
  document.getElementById('navLocation').value = item?.location || 'header';
  document.getElementById('navLabel').value = item?.label || '';
  document.getElementById('navUrl').value = item?.url || '';
  document.getElementById('navOrder').value = item?.order ?? 0;
  document.getElementById('navExternal').checked = item?.is_external || false;
  document.getElementById('navPublished').checked = item?.published !== false;
  document.getElementById('deleteNavigationBtn').style.display = item ? 'inline-flex' : 'none';
}

// Show Categories Editor
function showCategoriesEditor(item) {
  document.getElementById('categoriesEditor').style.display = 'block';
  document.getElementById('categoriesEditorTitle').textContent = item ? 'Edit Category' : 'New Category';
  document.getElementById('categoryName').value = item?.name || '';
  document.getElementById('categoryType').value = item?.type || 'blog';
  document.getElementById('categoryOrder').value = item?.order ?? 0;
  document.getElementById('categorySlugPreview').textContent = item?.slug || '-';
  document.getElementById('deleteCategoryBtn').style.display = item ? 'inline-flex' : 'none';
}

// Show Testimonials Editor
function showTestimonialsEditor(item) {
  document.getElementById('testimonialsEditor').style.display = 'block';
  document.getElementById('testimonialsEditorTitle').textContent = item ? 'Edit Testimonial' : 'New Testimonial';
  document.getElementById('testimonialContent').value = item?.content || '';
  document.getElementById('testimonialAuthorName').value = item?.author_name || '';
  document.getElementById('testimonialAuthorTitle').value = item?.author_title || '';
  document.getElementById('testimonialAuthorCompany').value = item?.author_company || '';
  document.getElementById('testimonialRating').value = item?.rating || 5;
  document.getElementById('testimonialPublished').checked = item?.published || false;
  document.getElementById('deleteTestimonialBtn').style.display = item ? 'inline-flex' : 'none';
}

// Show FAQs Editor
function showFaqsEditor(item) {
  document.getElementById('faqsEditor').style.display = 'block';
  document.getElementById('faqsEditorTitle').textContent = item ? 'Edit FAQ' : 'New FAQ';
  document.getElementById('faqQuestion').value = item?.question || '';
  document.getElementById('faqAnswer').value = item?.answer || '';
  document.getElementById('faqCategory').value = item?.category || 'general';
  document.getElementById('faqOrder').value = item?.order ?? 0;
  document.getElementById('faqPublished').checked = item?.published !== false;
  document.getElementById('deleteFaqBtn').style.display = item ? 'inline-flex' : 'none';
}

// Show Changelog Editor
function showChangelogEditor(item) {
  document.getElementById('changelogEditor').style.display = 'block';
  document.getElementById('changelogEditorTitle').textContent = item ? 'Edit Changelog Entry' : 'New Changelog Entry';
  document.getElementById('changelogTitle').value = item?.title || '';
  document.getElementById('changelogDescription').value = item?.description || '';
  document.getElementById('changelogType').value = item?.type || 'fix';
  document.getElementById('changelogDate').value = item?.date || new Date().toISOString().split('T')[0];
  document.getElementById('deleteChangelogBtn').style.display = item ? 'inline-flex' : 'none';
}

// Mark message as read
async function markMessageAsRead(messageId) {
  try {
    const res = await authenticatedFetch(`/api/admin/messages/${messageId}/read`, {
      method: 'PUT',
      body: {}
    });
    if (res.ok) {
      await loadItems('messages');
    }
  } catch (e) {
    console.error('Failed to mark message as read:', e);
  }
}

// New item
function newItem() {
  currentItem = null;
  isNewItem = true;
  welcomeState.style.display = 'none';

  document.querySelectorAll('.editor-form').forEach(f => f.style.display = 'none');

  if (currentType === 'posts') {
    showPostsEditor(null);
  } else if (currentType === 'work') {
    showWorkEditor(null);
  } else if (currentType === 'capabilities') {
    showCapabilitiesEditor(null);
  } else if (currentType === 'navigation') {
    showNavigationEditor(null);
  } else if (currentType === 'categories') {
    showCategoriesEditor(null);
  } else if (currentType === 'testimonials') {
    showTestimonialsEditor(null);
  } else if (currentType === 'faqs') {
    showFaqsEditor(null);
  } else if (currentType === 'changelog') {
    showChangelogEditor(null);
  }

  renderItemsList();
}

// Work tags
function renderWorkTags() {
  const container = document.getElementById('workTagsContainer');
  container.innerHTML = workTags.map(tag =>
    `<span class="tag">${escapeHtml(tag)}<button class="tag-remove" data-tag="${escapeHtml(tag)}">&times;</button></span>`
  ).join('') + '<input type="text" class="tag-input" id="workTagInput" placeholder="Type and press Enter">';

  const newInput = document.getElementById('workTagInput');
  newInput.addEventListener('keydown', handleTagInput);

  container.querySelectorAll('.tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      workTags = workTags.filter(t => t !== btn.dataset.tag);
      renderWorkTags();
    });
  });
}

function handleTagInput(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const value = e.target.value.trim();
    if (value && !workTags.includes(value)) {
      workTags.push(value);
      renderWorkTags();
    }
    e.target.value = '';
  }
}

// Capability Features
function renderCapabilityFeatures() {
  const container = document.getElementById('capabilityFeaturesContainer');
  if (!container) return;

  container.innerHTML = capabilityFeatures.map(feature =>
    `<span class="tag">${escapeHtml(feature)}<button class="tag-remove" data-feature="${escapeHtml(feature)}">&times;</button></span>`
  ).join('') + '<input type="text" class="tag-input" id="capabilityFeatureInput" placeholder="Type feature and press Enter">';

  const newInput = document.getElementById('capabilityFeatureInput');
  if (newInput) {
    newInput.addEventListener('keydown', handleFeatureInput);
  }

  container.querySelectorAll('.tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      capabilityFeatures = capabilityFeatures.filter(f => f !== btn.dataset.feature);
      renderCapabilityFeatures();
    });
  });
}

function handleFeatureInput(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const value = e.target.value.trim();
    if (value && !capabilityFeatures.includes(value)) {
      capabilityFeatures.push(value);
      renderCapabilityFeatures();
    }
    e.target.value = '';
  }
}

// Capability Screenshots
function renderCapabilityScreenshots() {
  const container = document.getElementById('capabilityScreenshotsList');
  if (!container) return;

  container.innerHTML = capabilityScreenshots.map((url, index) =>
    `<div class="screenshot-item">
      <img src="${escapeHtml(url)}" alt="Screenshot ${index + 1}" onerror="this.style.display='none'">
      <span>${escapeHtml(url)}</span>
      <button class="screenshot-remove" data-index="${index}">&times;</button>
    </div>`
  ).join('');

  container.querySelectorAll('.screenshot-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      capabilityScreenshots.splice(index, 1);
      renderCapabilityScreenshots();
    });
  });
}

async function uploadScreenshot(file) {
  const formData = new FormData();
  formData.append('screenshot', file);

  const token = await getCsrfToken();
  if (token) {
    formData.append('csrfToken', token);
  }

  const uploadZone = document.getElementById('screenshotUploadZone');
  uploadZone.classList.add('uploading');

  try {
    const res = await fetch('/api/upload/screenshot', {
      method: 'POST',
      headers: { 'X-CSRF-Token': token || '' },
      body: formData
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await res.json();
    if (data.url && !capabilityScreenshots.includes(data.url)) {
      capabilityScreenshots.push(data.url);
      renderCapabilityScreenshots();
      showToast('Screenshot uploaded successfully', 'success');
    }
  } catch (error) {
    showToast(error.message || 'Failed to upload screenshot', 'error');
  } finally {
    uploadZone.classList.remove('uploading');
  }
}

function addScreenshot() {
  const input = document.getElementById('capabilityScreenshotInput');
  if (!input) return;

  let url = input.value.trim();
  if (!url) return;

  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    url = '/' + url;
  }

  if (url.includes('.') && !url.includes('/')) {
    url = `/assets/products/${url}`;
  }

  if (url && !capabilityScreenshots.includes(url)) {
    capabilityScreenshots.push(url);
    renderCapabilityScreenshots();
    input.value = '';
  }
}

// Setup screenshot upload
function setupScreenshotUpload() {
  const uploadZone = document.getElementById('screenshotUploadZone');
  const fileInput = document.getElementById('screenshotFileInput');

  if (!uploadZone || !fileInput) return;

  uploadZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(file => {
      if (file.type.startsWith('image/')) {
        uploadScreenshot(file);
      }
    });
    fileInput.value = '';
  });

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    Array.from(e.dataTransfer.files).forEach(file => {
      if (file.type.startsWith('image/')) {
        uploadScreenshot(file);
      }
    });
  });

  document.addEventListener('paste', async (e) => {
    const capabilitiesEditor = document.getElementById('capabilitiesEditor');
    if (!capabilitiesEditor || capabilitiesEditor.style.display === 'none') return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) uploadScreenshot(file);
      }
    }
  });
}

// Icon Type Tabs
function updateIconTypeTabs() {
  document.querySelectorAll('.icon-type-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.iconType === selectedIconType);
  });

  document.getElementById('iconPresetContent').style.display = selectedIconType === 'preset' ? 'block' : 'none';
  document.getElementById('iconSvgContent').style.display = selectedIconType === 'svg' ? 'block' : 'none';
  document.getElementById('iconLottieContent').style.display = selectedIconType === 'lottie' ? 'block' : 'none';
}

// Preset Icon Grid
function renderPresetIconGrid() {
  const grid = document.getElementById('iconPresetGrid');
  if (!grid) return;

  grid.innerHTML = Object.entries(presetIcons).map(([name, svg]) =>
    `<div class="icon-preset-item ${selectedPresetIcon === name ? 'selected' : ''}" data-icon="${name}" title="${name}">
      ${svg}
    </div>`
  ).join('');

  grid.querySelectorAll('.icon-preset-item').forEach(item => {
    item.addEventListener('click', () => {
      selectedPresetIcon = item.dataset.icon;
      grid.querySelectorAll('.icon-preset-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
    });
  });
}

// Save functions
async function savePost() {
  const data = {
    title: document.getElementById('postTitle').value.trim(),
    excerpt: document.getElementById('postExcerpt').value.trim(),
    category: document.getElementById('postCategory').value,
    content: document.getElementById('postContent').value.trim(),
    published: document.getElementById('postPublished').checked
  };

  if (!data.title || !data.content) {
    showToast('Title and content are required', 'error');
    return;
  }

  const btn = document.getElementById('savePostBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const url = isNewItem ? '/api/admin/posts' : `/api/admin/posts/${currentItem.slug}`;
    const res = await authenticatedFetch(url, {
      method: isNewItem ? 'POST' : 'PUT',
      body: data
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    showToast(isNewItem ? 'Post created!' : 'Post saved!');
    await loadItems('posts');
    const saved = items.posts.find(p => p.slug === result.slug);
    if (saved) selectItem(saved);
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Post';
  }
}

async function saveWork() {
  const data = {
    industry: document.getElementById('workIndustry').value.trim(),
    problem: document.getElementById('workProblem').value.trim(),
    solution: document.getElementById('workSolution').value.trim(),
    client: document.getElementById('workClient').value.trim(),
    date: document.getElementById('workDate').value,
    image: document.getElementById('workImage').value.trim(),
    caseStudyUrl: document.getElementById('workCaseStudy').value.trim(),
    tags: workTags,
    published: document.getElementById('workPublished').checked
  };

  if (!data.industry || !data.problem || !data.solution) {
    showToast('Industry, problem, and solution are required', 'error');
    return;
  }

  const btn = document.getElementById('saveWorkBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const url = isNewItem ? '/api/admin/work' : `/api/admin/work/${currentItem.id}`;
    const res = await authenticatedFetch(url, {
      method: isNewItem ? 'POST' : 'PUT',
      body: data
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    showToast(isNewItem ? 'Work item created!' : 'Work item saved!');
    await loadItems('work');
    const saved = items.work.find(w => w.id === result.id);
    if (saved) selectItem(saved);
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Work';
  }
}

async function saveCapability() {
  const icon = {
    type: selectedIconType,
    preset: selectedIconType === 'preset' ? selectedPresetIcon : '',
    svg: selectedIconType === 'svg' ? document.getElementById('capabilityIconSvg').value.trim() : '',
    lottieUrl: selectedIconType === 'lottie' ? document.getElementById('capabilityIconLottieUrl').value.trim() : '',
    lottieData: null
  };

  const data = {
    title: document.getElementById('capabilityTitle').value.trim(),
    description: document.getElementById('capabilityDescription').value.trim(),
    longDescription: document.getElementById('capabilityLongDescription').value.trim(),
    features: capabilityFeatures,
    screenshots: capabilityScreenshots,
    externalUrl: document.getElementById('capabilityExternalUrl').value.trim(),
    order: parseInt(document.getElementById('capabilityOrder').value) || 1,
    icon: icon,
    published: document.getElementById('capabilityPublished').checked
  };

  if (!data.title || !data.description) {
    showToast('Title and description are required', 'error');
    return;
  }

  const btn = document.getElementById('saveCapabilityBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const url = isNewItem ? '/api/admin/capabilities' : `/api/admin/capabilities/${currentItem.id}`;
    const res = await authenticatedFetch(url, {
      method: isNewItem ? 'POST' : 'PUT',
      body: data
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to save');

    showToast(isNewItem ? 'Product created!' : 'Product saved!');
    await loadItems('capabilities');
    const saved = items.capabilities.find(c => c.id === result.id);
    if (saved) selectItem(saved);
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Capability';
  }
}

async function saveNavigation() {
  const data = {
    location: document.getElementById('navLocation').value,
    label: document.getElementById('navLabel').value.trim(),
    url: document.getElementById('navUrl').value.trim(),
    order: parseInt(document.getElementById('navOrder').value) || 0,
    is_external: document.getElementById('navExternal').checked,
    published: document.getElementById('navPublished').checked
  };

  if (!data.label || !data.url) {
    showToast('Label and URL are required', 'error');
    return;
  }

  const btn = document.getElementById('saveNavigationBtn');
  btn.disabled = true;

  try {
    const url = isNewItem ? '/api/admin/navigation' : `/api/admin/navigation/${currentItem.id}`;
    const res = await authenticatedFetch(url, {
      method: isNewItem ? 'POST' : 'PUT',
      body: data
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    showToast(isNewItem ? 'Navigation created!' : 'Navigation saved!');
    await loadItems('navigation');
    const saved = items.navigation.find(n => n.id === result.id);
    if (saved) selectItem(saved);
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function saveCategory() {
  const data = {
    name: document.getElementById('categoryName').value.trim(),
    type: document.getElementById('categoryType').value,
    order: parseInt(document.getElementById('categoryOrder').value) || 0
  };

  if (!data.name) {
    showToast('Name is required', 'error');
    return;
  }

  const btn = document.getElementById('saveCategoryBtn');
  btn.disabled = true;

  try {
    const url = isNewItem ? '/api/admin/categories' : `/api/admin/categories/${currentItem.id}`;
    const res = await authenticatedFetch(url, {
      method: isNewItem ? 'POST' : 'PUT',
      body: data
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    showToast(isNewItem ? 'Category created!' : 'Category saved!');
    await loadItems('categories');
    await loadCategories(); // Refresh dropdown
    const saved = items.categories.find(c => c.id === result.id);
    if (saved) selectItem(saved);
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function saveTestimonial() {
  const data = {
    content: document.getElementById('testimonialContent').value.trim(),
    author_name: document.getElementById('testimonialAuthorName').value.trim(),
    author_title: document.getElementById('testimonialAuthorTitle').value.trim(),
    author_company: document.getElementById('testimonialAuthorCompany').value.trim(),
    rating: parseInt(document.getElementById('testimonialRating').value) || 5,
    published: document.getElementById('testimonialPublished').checked
  };

  if (!data.content || !data.author_name) {
    showToast('Quote and author name are required', 'error');
    return;
  }

  const btn = document.getElementById('saveTestimonialBtn');
  btn.disabled = true;

  try {
    const url = isNewItem ? '/api/admin/testimonials' : `/api/admin/testimonials/${currentItem.id}`;
    const res = await authenticatedFetch(url, {
      method: isNewItem ? 'POST' : 'PUT',
      body: data
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    showToast(isNewItem ? 'Testimonial created!' : 'Testimonial saved!');
    await loadItems('testimonials');
    const saved = items.testimonials.find(t => t.id === result.id);
    if (saved) selectItem(saved);
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function saveFaq() {
  const data = {
    question: document.getElementById('faqQuestion').value.trim(),
    answer: document.getElementById('faqAnswer').value.trim(),
    category: document.getElementById('faqCategory').value,
    order: parseInt(document.getElementById('faqOrder').value) || 0,
    published: document.getElementById('faqPublished').checked
  };

  if (!data.question || !data.answer) {
    showToast('Question and answer are required', 'error');
    return;
  }

  const btn = document.getElementById('saveFaqBtn');
  btn.disabled = true;

  try {
    const url = isNewItem ? '/api/admin/faqs' : `/api/admin/faqs/${currentItem.id}`;
    const res = await authenticatedFetch(url, {
      method: isNewItem ? 'POST' : 'PUT',
      body: data
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    showToast(isNewItem ? 'FAQ created!' : 'FAQ saved!');
    await loadItems('faqs');
    const saved = items.faqs.find(f => f.id === result.id);
    if (saved) selectItem(saved);
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function saveChangelog() {
  const data = {
    title: document.getElementById('changelogTitle').value.trim(),
    description: document.getElementById('changelogDescription').value.trim(),
    type: document.getElementById('changelogType').value,
    date: document.getElementById('changelogDate').value
  };

  if (!data.title || !data.description) {
    showToast('Title and description are required', 'error');
    return;
  }

  const btn = document.getElementById('saveChangelogBtn');
  btn.disabled = true;

  try {
    const url = isNewItem ? '/api/admin/changelog' : `/api/admin/changelog/${currentItem.id}`;
    const res = await authenticatedFetch(url, {
      method: isNewItem ? 'POST' : 'PUT',
      body: data
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    showToast(isNewItem ? 'Changelog created!' : 'Changelog saved!');
    await loadItems('changelog');
    const saved = items.changelog.find(c => c.id === result.id);
    if (saved) selectItem(saved);
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// Delete functions
async function deleteItem(type, id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

  try {
    const config = contentTypes[type];
    const endpoint = `${config.endpoint}/${id}`;
    const res = await authenticatedFetch(endpoint, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');

    showToast('Deleted successfully');
    currentItem = null;
    document.querySelectorAll('.editor-form').forEach(f => f.style.display = 'none');
    welcomeState.style.display = 'flex';
    await loadItems(type);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// Settings functions
async function loadSettings() {
  try {
    const res = await fetch('/api/admin/settings');
    const settings = await res.json();

    document.getElementById('settingSiteName').value = settings.site_name || '';
    document.getElementById('settingTagline').value = settings.tagline || '';
    document.getElementById('settingMetaDescription').value = settings.meta_description || '';
    document.getElementById('settingContactEmail').value = settings.contact_email || '';

    const social = settings.social_links || {};
    document.getElementById('settingSocialGithub').value = social.github || '';
    document.getElementById('settingSocialLinkedin').value = social.linkedin || '';
    document.getElementById('settingSocialTwitter').value = social.twitter || '';
    document.getElementById('settingSocialInstagram').value = social.instagram || '';
  } catch (e) {
    showToast('Failed to load settings', 'error');
  }
}

async function saveSettings() {
  const settings = [
    { key: 'site_name', value: document.getElementById('settingSiteName').value.trim() },
    { key: 'tagline', value: document.getElementById('settingTagline').value.trim() },
    { key: 'meta_description', value: document.getElementById('settingMetaDescription').value.trim() },
    { key: 'contact_email', value: document.getElementById('settingContactEmail').value.trim() },
    { key: 'social_links', value: {
      github: document.getElementById('settingSocialGithub').value.trim(),
      linkedin: document.getElementById('settingSocialLinkedin').value.trim(),
      twitter: document.getElementById('settingSocialTwitter').value.trim(),
      instagram: document.getElementById('settingSocialInstagram').value.trim()
    }}
  ];

  const btn = document.getElementById('saveSettingsBtn');
  btn.disabled = true;

  try {
    const res = await authenticatedFetch('/api/admin/settings', {
      method: 'PUT',
      body: { settings }
    });
    if (!res.ok) throw new Error('Failed to save');
    showToast('Settings saved!');
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// Homepage functions
async function loadHomepage() {
  try {
    const res = await fetch('/api/admin/homepage');
    const sections = await res.json();

    const hero = sections.hero || {};
    document.getElementById('homepageHeroTitle').value = hero.title || '';
    document.getElementById('homepageHeroSubtitle').value = hero.subtitle || '';
    document.getElementById('homepageHeroCta').value = hero.cta || '';

    const about = sections.about || {};
    document.getElementById('homepageAboutTitle').value = about.title || '';
    document.getElementById('homepageAboutContent').value = about.content || '';

    const values = sections.values || {};
    document.getElementById('homepageValue1Title').value = values.value1?.title || '';
    document.getElementById('homepageValue1Description').value = values.value1?.description || '';
    document.getElementById('homepageValue2Title').value = values.value2?.title || '';
    document.getElementById('homepageValue2Description').value = values.value2?.description || '';
    document.getElementById('homepageValue3Title').value = values.value3?.title || '';
    document.getElementById('homepageValue3Description').value = values.value3?.description || '';
  } catch (e) {
    showToast('Failed to load homepage content', 'error');
  }
}

async function saveHomepage() {
  const sections = [
    { section: 'hero', content: {
      title: document.getElementById('homepageHeroTitle').value.trim(),
      subtitle: document.getElementById('homepageHeroSubtitle').value.trim(),
      cta: document.getElementById('homepageHeroCta').value.trim()
    }},
    { section: 'about', content: {
      title: document.getElementById('homepageAboutTitle').value.trim(),
      content: document.getElementById('homepageAboutContent').value.trim()
    }},
    { section: 'values', content: {
      value1: { title: document.getElementById('homepageValue1Title').value.trim(), description: document.getElementById('homepageValue1Description').value.trim() },
      value2: { title: document.getElementById('homepageValue2Title').value.trim(), description: document.getElementById('homepageValue2Description').value.trim() },
      value3: { title: document.getElementById('homepageValue3Title').value.trim(), description: document.getElementById('homepageValue3Description').value.trim() }
    }}
  ];

  const btn = document.getElementById('saveHomepageBtn');
  btn.disabled = true;

  try {
    for (const { section, content } of sections) {
      await authenticatedFetch(`/api/admin/homepage/${section}`, {
        method: 'PUT',
        body: { content }
      });
    }
    showToast('Homepage content saved!');
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// Media functions
async function loadMedia() {
  try {
    const res = await fetch('/api/admin/media');
    const mediaItems = await res.json();

    const grid = document.getElementById('mediaGrid');
    if (mediaItems.length === 0) {
      grid.innerHTML = '<div class="empty-state">No media uploaded yet</div>';
      return;
    }

    grid.innerHTML = mediaItems.map(item => `
      <div class="media-item" data-id="${item.id}">
        <img src="${item.path}" alt="${escapeHtml(item.alt_text || item.original_filename)}" onerror="this.src='/assets/placeholder.svg'">
        <div class="media-item-overlay">
          <span class="media-item-name">${escapeHtml(item.original_filename)}</span>
        </div>
        <div class="media-item-actions">
          <button class="media-item-btn copy" title="Copy URL" onclick="copyMediaUrl('${item.path}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="media-item-btn delete" title="Delete" onclick="deleteMedia('${item.id}', '${escapeHtml(item.original_filename)}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    showToast('Failed to load media', 'error');
  }
}

function copyMediaUrl(url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast('URL copied to clipboard');
  });
}

async function deleteMedia(id, name) {
  if (!confirm(`Delete "${name}"?`)) return;

  try {
    const res = await authenticatedFetch(`/api/admin/media/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    showToast('Media deleted');
    loadMedia();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// Users functions
async function loadUsers() {
  try {
    const res = await fetch('/api/auth/users');
    const users = await res.json();

    const panel = document.getElementById('usersListPanel');
    if (users.length === 0) {
      panel.innerHTML = '<div class="empty-state">No users found</div>';
      return;
    }

    panel.innerHTML = users.map(user => `
      <div class="user-card" data-id="${user.id}">
        <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
        <div class="user-info">
          <div class="user-name">${escapeHtml(user.username)}</div>
          <div class="user-meta">
            ${user.hasPasskey ? '<span class="user-badge passkey">Passkey</span>' : '<span class="user-badge password">Password</span>'}
          </div>
        </div>
        <div class="user-actions">
          <button class="btn btn-ghost" onclick="resetUserPassword('${user.id}', '${escapeHtml(user.username)}')">Reset Password</button>
          ${user.hasPasskey ? `<button class="btn btn-ghost" onclick="revokeUserPasskeys('${user.id}', '${escapeHtml(user.username)}')">Revoke Passkeys</button>` : ''}
          <button class="btn btn-danger" onclick="deleteUser('${user.id}', '${escapeHtml(user.username)}')">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    showToast('Failed to load users', 'error');
  }
}

async function resetUserPassword(id, username) {
  const newPassword = prompt(`Enter new password for ${username}:`);
  if (!newPassword) return;

  if (newPassword.length < 8) {
    showToast('Password must be at least 8 characters', 'error');
    return;
  }

  try {
    const res = await authenticatedFetch(`/api/auth/users/${id}/password`, {
      method: 'PUT',
      body: { password: newPassword }
    });
    if (!res.ok) throw new Error('Failed to reset password');
    showToast('Password reset successfully');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function revokeUserPasskeys(id, username) {
  if (!confirm(`Revoke all passkeys for ${username}? They will need to use password login.`)) return;

  try {
    const res = await authenticatedFetch(`/api/auth/users/${id}/passkeys`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to revoke passkeys');
    showToast('Passkeys revoked');
    loadUsers();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function deleteUser(id, username) {
  if (!confirm(`Delete user ${username}? This cannot be undone.`)) return;

  try {
    const res = await authenticatedFetch(`/api/auth/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete user');
    showToast('User deleted');
    loadUsers();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function showNewUserForm() {
  document.getElementById('usersEditor').style.display = 'none';
  document.getElementById('newUserForm').style.display = 'block';
  document.getElementById('newUsername').value = '';
  document.getElementById('newPassword').value = '';
}

async function createUser() {
  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value;

  if (!username || !password) {
    showToast('Username and password are required', 'error');
    return;
  }

  if (password.length < 8) {
    showToast('Password must be at least 8 characters', 'error');
    return;
  }

  try {
    const res = await authenticatedFetch('/api/auth/users', {
      method: 'POST',
      body: { username, password }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create user');
    }
    showToast('User created');
    document.getElementById('newUserForm').style.display = 'none';
    document.getElementById('usersEditor').style.display = 'block';
    loadUsers();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// Event listeners - Navigation
document.querySelectorAll('.nav-item').forEach(nav => {
  nav.addEventListener('click', () => switchType(nav.dataset.type));
});

// Event listeners - Buttons
newItemBtn?.addEventListener('click', newItem);
document.getElementById('savePostBtn')?.addEventListener('click', savePost);
document.getElementById('saveWorkBtn')?.addEventListener('click', saveWork);
document.getElementById('saveCapabilityBtn')?.addEventListener('click', saveCapability);
document.getElementById('saveNavigationBtn')?.addEventListener('click', saveNavigation);
document.getElementById('saveCategoryBtn')?.addEventListener('click', saveCategory);
document.getElementById('saveTestimonialBtn')?.addEventListener('click', saveTestimonial);
document.getElementById('saveFaqBtn')?.addEventListener('click', saveFaq);
document.getElementById('saveChangelogBtn')?.addEventListener('click', saveChangelog);
document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);
document.getElementById('saveHomepageBtn')?.addEventListener('click', saveHomepage);

// Delete buttons
document.getElementById('deletePostBtn')?.addEventListener('click', () => {
  if (currentItem) deleteItem('posts', currentItem.slug, currentItem.title);
});
document.getElementById('deleteWorkBtn')?.addEventListener('click', () => {
  if (currentItem) deleteItem('work', currentItem.id, currentItem.industry);
});
document.getElementById('deleteCapabilityBtn')?.addEventListener('click', () => {
  if (currentItem) deleteItem('capabilities', currentItem.id, currentItem.title);
});
document.getElementById('deleteMessageBtn')?.addEventListener('click', () => {
  if (currentItem) deleteItem('messages', currentItem.id, currentItem.name || 'Message');
});
document.getElementById('deleteNavigationBtn')?.addEventListener('click', () => {
  if (currentItem) deleteItem('navigation', currentItem.id, currentItem.label);
});
document.getElementById('deleteCategoryBtn')?.addEventListener('click', () => {
  if (currentItem) deleteItem('categories', currentItem.id, currentItem.name);
});
document.getElementById('deleteTestimonialBtn')?.addEventListener('click', () => {
  if (currentItem) deleteItem('testimonials', currentItem.id, currentItem.author_name);
});
document.getElementById('deleteFaqBtn')?.addEventListener('click', () => {
  if (currentItem) deleteItem('faqs', currentItem.id, currentItem.question);
});
document.getElementById('deleteChangelogBtn')?.addEventListener('click', () => {
  if (currentItem) deleteItem('changelog', currentItem.id, currentItem.title);
});

document.getElementById('markReadBtn')?.addEventListener('click', () => {
  if (currentItem && !currentItem.read) markMessageAsRead(currentItem.id);
});

// User management
document.getElementById('newUserBtn')?.addEventListener('click', showNewUserForm);
document.getElementById('cancelNewUserBtn')?.addEventListener('click', () => {
  document.getElementById('newUserForm').style.display = 'none';
  document.getElementById('usersEditor').style.display = 'block';
});
document.getElementById('createUserBtn')?.addEventListener('click', createUser);

// Slug previews
document.getElementById('postTitle')?.addEventListener('input', (e) => {
  document.getElementById('slugPreview').textContent = slugify(e.target.value) || '-';
});
document.getElementById('categoryName')?.addEventListener('input', (e) => {
  document.getElementById('categorySlugPreview').textContent = slugify(e.target.value) || '-';
});

// Icon type tabs
document.querySelectorAll('.icon-type-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    selectedIconType = tab.dataset.iconType;
    updateIconTypeTabs();
  });
});

// Screenshot handling
document.getElementById('addScreenshotBtn')?.addEventListener('click', addScreenshot);
document.getElementById('capabilityScreenshotInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addScreenshot();
  }
});

// Setup screenshot upload
setupScreenshotUpload();

// Media upload
document.getElementById('mediaFileUpload')?.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      await uploadMediaFile(file);
    }
  }
  e.target.value = '';
});

async function uploadMediaFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const token = await getCsrfToken();
  if (token) formData.append('csrfToken', token);

  try {
    const res = await fetch('/api/admin/media', {
      method: 'POST',
      headers: { 'X-CSRF-Token': token || '' },
      body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    showToast('File uploaded');
    loadMedia();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  try {
    await authenticatedFetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {}
  window.location.href = '/admin/login';
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    if (currentType === 'posts' && document.getElementById('postsEditor').style.display !== 'none') savePost();
    if (currentType === 'work' && document.getElementById('workEditor').style.display !== 'none') saveWork();
    if (currentType === 'capabilities' && document.getElementById('capabilitiesEditor').style.display !== 'none') saveCapability();
    if (currentType === 'navigation' && document.getElementById('navigationEditor').style.display !== 'none') saveNavigation();
    if (currentType === 'categories' && document.getElementById('categoriesEditor').style.display !== 'none') saveCategory();
    if (currentType === 'testimonials' && document.getElementById('testimonialsEditor').style.display !== 'none') saveTestimonial();
    if (currentType === 'faqs' && document.getElementById('faqsEditor').style.display !== 'none') saveFaq();
    if (currentType === 'changelog' && document.getElementById('changelogEditor').style.display !== 'none') saveChangelog();
    if (currentType === 'settings') saveSettings();
    if (currentType === 'homepage') saveHomepage();
  }
});

// Init
checkAuth().then(authenticated => {
  if (authenticated) {
    loadCategories();
    loadItems('posts');
    renderPresetIconGrid();
  }
});
