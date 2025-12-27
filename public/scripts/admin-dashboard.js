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

// State
let currentType = 'posts';
let items = { posts: [], work: [], capabilities: [], messages: [] };
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
const welcomeState = document.getElementById('welcomeState');
const toast = document.getElementById('toast');
const adminUser = document.getElementById('adminUser');

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
    // Get CSRF token on auth check
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
    select.innerHTML = '';
    categories.forEach(c => {
      const option = document.createElement('option');
      option.value = c.slug || '';
      option.textContent = c.name || '';
      select.appendChild(option);
    });
  } catch (e) {
    console.error('Failed to load categories:', e);
  }
}

// Load items
async function loadItems(type) {
  try {
    let endpoint;
    if (type === 'posts') {
      endpoint = '/api/admin/posts';
    } else if (type === 'messages') {
      endpoint = '/api/admin/messages';
    } else {
      endpoint = `/api/admin/${type}`;
    }
    const res = await fetch(endpoint);
    items[type] = await res.json();
    renderItemsList();
  } catch (e) {
    showToast(`Failed to load ${type}`, 'error');
  }
}

// Render items list
function renderItemsList() {
  const data = items[currentType];
  if (data.length === 0) {
    itemsList.innerHTML = `<div class="empty-state">No ${escapeHtml(currentType)} yet. Create your first!</div>`;
    return;
  }

  // Clear existing items
  itemsList.innerHTML = '';

  data.forEach(item => {
    const id = currentType === 'posts' ? item.slug : item.id;
    let title, subtitle;
    
    if (currentType === 'messages') {
      title = item.name || 'Unknown';
      subtitle = item.email || '';
    } else if (currentType === 'posts') {
      title = item.title;
      subtitle = item.categoryName || 'Uncategorized';
    } else if (currentType === 'work') {
      title = item.industry;
      subtitle = item.problem ? item.problem.substring(0, 40) + '...' : '';
    } else {
      title = item.title;
      subtitle = '';
    }
    
    const isActive = currentType === 'posts' ? currentItem?.slug === item.slug : currentItem?.id === item.id;

    const div = document.createElement('div');
    div.className = `list-item ${isActive ? 'active' : ''} ${currentType === 'messages' && !item.read ? 'unread' : ''}`;
    div.dataset.id = id;

    const titleDiv = document.createElement('div');
    titleDiv.className = 'list-item-title';
    titleDiv.textContent = title || '';

    const metaDiv = document.createElement('div');
    metaDiv.className = 'list-item-meta';

    if (currentType === 'messages') {
      const statusSpan = document.createElement('span');
      statusSpan.className = `item-status ${item.read ? 'read' : 'unread'}`;
      statusSpan.textContent = item.read ? 'Read' : 'New';
      metaDiv.appendChild(statusSpan);
      
      if (item.subject) {
        const subjectSpan = document.createElement('span');
        subjectSpan.textContent = item.subject.substring(0, 30) + (item.subject.length > 30 ? '...' : '');
        metaDiv.appendChild(subjectSpan);
      }
      
      const dateSpan = document.createElement('span');
      const date = new Date(item.createdAt);
      dateSpan.textContent = date.toLocaleDateString();
      metaDiv.appendChild(dateSpan);
    } else {
      const statusSpan = document.createElement('span');
      statusSpan.className = `item-status ${item.published ? 'published' : ''}`;
      statusSpan.textContent = item.published ? 'Published' : 'Draft';
      metaDiv.appendChild(statusSpan);

      if (subtitle) {
        const subtitleSpan = document.createElement('span');
        subtitleSpan.textContent = subtitle;
        metaDiv.appendChild(subtitleSpan);
      }
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

  // Update tabs
  document.querySelectorAll('.content-type-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.type === type);
  });

  // Update sidebar title
  const titles = { posts: 'Posts', work: 'Work', capabilities: 'Products', messages: 'Messages' };
  sidebarTitle.textContent = titles[type];
  
  // Hide "New" button for messages (read-only)
  const newItemBtn = document.getElementById('newItemBtn');
  if (newItemBtn) {
    newItemBtn.style.display = type === 'messages' ? 'none' : 'inline-flex';
  }

  // Hide all editors, show welcome
  document.querySelectorAll('.editor-form').forEach(f => f.style.display = 'none');
  welcomeState.style.display = 'flex';

  // Load and render
  loadItems(type);
}

// Select item for editing
function selectItem(item) {
  currentItem = item;
  isNewItem = false;
  welcomeState.style.display = 'none';

  // Hide all editors
  document.querySelectorAll('.editor-form').forEach(f => f.style.display = 'none');

  if (currentType === 'posts') {
    document.getElementById('postsEditor').style.display = 'block';
    document.getElementById('postsEditorTitle').textContent = 'Edit Post';
    document.getElementById('postTitle').value = item.title;
    document.getElementById('postExcerpt').value = item.excerpt || '';
    document.getElementById('postCategory').value = item.category || 'insights';
    document.getElementById('postContent').value = item.content;
    document.getElementById('postPublished').checked = item.published;
    document.getElementById('slugPreview').textContent = item.slug;
    document.getElementById('deletePostBtn').style.display = 'inline-flex';
  } else if (currentType === 'work') {
    document.getElementById('workEditor').style.display = 'block';
    document.getElementById('workEditorTitle').textContent = 'Edit Work Item';
    document.getElementById('workIndustry').value = item.industry || '';
    document.getElementById('workClient').value = item.client || '';
    document.getElementById('workProblem').value = item.problem || '';
    document.getElementById('workSolution').value = item.solution || '';
    document.getElementById('workDate').value = item.date || '';
    document.getElementById('workImage').value = item.image || '';
    document.getElementById('workCaseStudy').value = item.caseStudyUrl || '';
    document.getElementById('workPublished').checked = item.published;
    document.getElementById('deleteWorkBtn').style.display = 'inline-flex';
    workTags = item.tags || [];
    renderWorkTags();
  } else if (currentType === 'capabilities') {
    document.getElementById('capabilitiesEditor').style.display = 'block';
    document.getElementById('capabilitiesEditorTitle').textContent = 'Edit Capability';
    document.getElementById('capabilityTitle').value = item.title || '';
    document.getElementById('capabilityDescription').value = item.description || '';
    document.getElementById('capabilityLongDescription').value = item.longDescription || '';
    document.getElementById('capabilityExternalUrl').value = item.externalUrl || '';
    document.getElementById('capabilityOrder').value = item.order || '';
    document.getElementById('capabilityPublished').checked = item.published;
    document.getElementById('deleteCapabilityBtn').style.display = 'inline-flex';
    
    // Features
    capabilityFeatures = item.features || [];
    renderCapabilityFeatures();
    
    // Screenshots
    capabilityScreenshots = item.screenshots || [];
    renderCapabilityScreenshots();
    
    // Icon
    const icon = item.icon || { type: 'preset', preset: '' };
    selectedIconType = icon.type || 'preset';
    selectedPresetIcon = icon.preset || '';
    document.getElementById('capabilityIconSvg').value = icon.svg || '';
    document.getElementById('capabilityIconLottieUrl').value = icon.lottieUrl || '';
    
    updateIconTypeTabs();
    renderPresetIconGrid();
  } else if (currentType === 'messages') {
    document.getElementById('messagesViewer').style.display = 'block';
    document.getElementById('messagesViewerTitle').textContent = item.subject || 'Message';
    document.getElementById('messageFrom').textContent = item.name || 'Unknown';
    document.getElementById('messageEmail').textContent = item.email || '';
    document.getElementById('messageSubject').textContent = item.subject || '(No subject)';
    const date = new Date(item.createdAt);
    document.getElementById('messageDate').textContent = date.toLocaleString();
    document.getElementById('messageContent').textContent = item.message || '';
    
    // Show/hide mark as read button
    const markReadBtn = document.getElementById('markReadBtn');
    if (!item.read) {
      markReadBtn.style.display = 'inline-flex';
    } else {
      markReadBtn.style.display = 'none';
    }
    
    // Mark as read when viewing
    if (!item.read) {
      markMessageAsRead(item.id);
    }
  }

  renderItemsList();
}

// Mark message as read
async function markMessageAsRead(messageId) {
  try {
    const token = await getCsrfToken();
    const res = await authenticatedFetch(`/api/admin/messages/${messageId}/read`, {
      method: 'PUT',
      body: {}
    });
    if (res.ok) {
      // Reload messages to update read status
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
    document.getElementById('postsEditor').style.display = 'block';
    document.getElementById('postsEditorTitle').textContent = 'New Post';
    document.getElementById('postTitle').value = '';
    document.getElementById('postExcerpt').value = '';
    document.getElementById('postCategory').value = categories[0]?.slug || 'insights';
    document.getElementById('postContent').value = '';
    document.getElementById('postPublished').checked = false;
    document.getElementById('slugPreview').textContent = '-';
    document.getElementById('deletePostBtn').style.display = 'none';
  } else if (currentType === 'work') {
    document.getElementById('workEditor').style.display = 'block';
    document.getElementById('workEditorTitle').textContent = 'New Work Item';
    document.getElementById('workIndustry').value = '';
    document.getElementById('workClient').value = '';
    document.getElementById('workProblem').value = '';
    document.getElementById('workSolution').value = '';
    document.getElementById('workDate').value = '';
    document.getElementById('workImage').value = '';
    document.getElementById('workCaseStudy').value = '';
    document.getElementById('workPublished').checked = false;
    document.getElementById('deleteWorkBtn').style.display = 'none';
    workTags = [];
    renderWorkTags();
  } else if (currentType === 'capabilities') {
    document.getElementById('capabilitiesEditor').style.display = 'block';
    document.getElementById('capabilitiesEditorTitle').textContent = 'New Capability';
    document.getElementById('capabilityTitle').value = '';
    document.getElementById('capabilityDescription').value = '';
    document.getElementById('capabilityLongDescription').value = '';
    document.getElementById('capabilityExternalUrl').value = '';
    document.getElementById('capabilityOrder').value = '';
    document.getElementById('capabilityPublished').checked = false;
    document.getElementById('deleteCapabilityBtn').style.display = 'none';
    
    // Reset features
    capabilityFeatures = [];
    renderCapabilityFeatures();
    
    // Reset screenshots
    capabilityScreenshots = [];
    renderCapabilityScreenshots();
    
    // Reset icon
    selectedIconType = 'preset';
    selectedPresetIcon = '';
    document.getElementById('capabilityIconSvg').value = '';
    document.getElementById('capabilityIconLottieUrl').value = '';
    
    updateIconTypeTabs();
    renderPresetIconGrid();
  }

  renderItemsList();
}

// Work tags
function renderWorkTags() {
  const container = document.getElementById('workTagsContainer');
  const input = document.getElementById('workTagInput');
  container.innerHTML = workTags.map(tag => 
    `<span class="tag">${tag}<button class="tag-remove" data-tag="${tag}">&times;</button></span>`
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
  // Build icon object based on selected type
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
    if (!res.ok) {
      // Show detailed validation errors if available
      if (result.errors && Array.isArray(result.errors)) {
        const errorMessages = result.errors.map(err => `${err.param}: ${err.msg}`).join(', ');
        throw new Error(errorMessages || result.error || 'Validation failed');
      }
      throw new Error(result.error || 'Failed to save capability');
    }
    
    showToast(isNewItem ? 'Capability created!' : 'Capability saved!');
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

// Delete functions
async function deleteItem(type, id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

  try {
    let endpoint;
    if (type === 'posts') {
      endpoint = `/api/admin/posts/${id}`;
    } else if (type === 'messages') {
      endpoint = `/api/admin/messages/${id}`;
    } else {
      endpoint = `/api/admin/${type}/${id}`;
    }
    const res = await authenticatedFetch(endpoint, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    
    showToast('Deleted successfully');
    currentItem = null;
    document.querySelectorAll('.editor-form').forEach(f => f.style.display = 'none');
    document.getElementById('messagesViewer').style.display = 'none';
    welcomeState.style.display = 'flex';
    await loadItems(type);
  } catch (e) {
    showToast(e.message, 'error');
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
  
  // Add CSRF token
  const token = await getCsrfToken();
  if (token) {
    formData.append('csrfToken', token);
  }

  const uploadZone = document.getElementById('screenshotUploadZone');
  uploadZone.classList.add('uploading');

  try {
    const res = await fetch('/api/upload/screenshot', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': token || ''
      },
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
    console.error('Upload error:', error);
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
  
  // Normalize URL: ensure it starts with / for relative paths
  // If it's already a full URL (http/https), keep it as is
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    url = '/' + url;
  }
  
  // If it looks like just a filename, assume it's in /assets/products/
  if (url.includes('.') && !url.includes('/')) {
    url = `/assets/products/${url}`;
  }
  
  if (url && !capabilityScreenshots.includes(url)) {
    capabilityScreenshots.push(url);
    renderCapabilityScreenshots();
    input.value = '';
  }
}

// Drag and drop handlers
function setupScreenshotUpload() {
  const uploadZone = document.getElementById('screenshotUploadZone');
  const fileInput = document.getElementById('screenshotFileInput');
  
  if (!uploadZone || !fileInput) return;

  // Click to browse
  uploadZone.addEventListener('click', () => fileInput.click());

  // File input change
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        uploadScreenshot(file);
      }
    });
    fileInput.value = ''; // Reset input
  });

  // Drag and drop
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
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        uploadScreenshot(file);
      }
    });
  });

  // Paste from clipboard
  document.addEventListener('paste', async (e) => {
    // Only handle paste when in capabilities editor
    const capabilitiesEditor = document.getElementById('capabilitiesEditor');
    if (!capabilitiesEditor || capabilitiesEditor.style.display === 'none') return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          uploadScreenshot(file);
        }
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

// Event listeners
document.querySelectorAll('.content-type-tab').forEach(tab => {
  tab.addEventListener('click', () => switchType(tab.dataset.type));
});

document.getElementById('newItemBtn').addEventListener('click', newItem);
document.getElementById('savePostBtn').addEventListener('click', savePost);
document.getElementById('saveWorkBtn').addEventListener('click', saveWork);
document.getElementById('saveCapabilityBtn').addEventListener('click', saveCapability);

document.getElementById('deletePostBtn').addEventListener('click', () => {
  if (currentItem) deleteItem('posts', currentItem.slug, currentItem.title);
});
document.getElementById('deleteWorkBtn').addEventListener('click', () => {
  if (currentItem) deleteItem('work', currentItem.id, currentItem.industry);
});
document.getElementById('deleteCapabilityBtn').addEventListener('click', () => {
  if (currentItem) deleteItem('capabilities', currentItem.id, currentItem.title);
});
document.getElementById('deleteMessageBtn').addEventListener('click', () => {
  if (currentItem) deleteItem('messages', currentItem.id, currentItem.name || 'Message');
});
document.getElementById('markReadBtn').addEventListener('click', () => {
  if (currentItem && !currentItem.read) {
    markMessageAsRead(currentItem.id);
  }
});

document.getElementById('postTitle').addEventListener('input', (e) => {
  document.getElementById('slugPreview').textContent = slugify(e.target.value) || '-';
});

// Icon type tabs
document.querySelectorAll('.icon-type-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    selectedIconType = tab.dataset.iconType;
    updateIconTypeTabs();
  });
});

// Screenshot add button
document.getElementById('addScreenshotBtn')?.addEventListener('click', addScreenshot);
document.getElementById('capabilityScreenshotInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addScreenshot();
  }
});

// Setup screenshot upload (drag, drop, paste)
setupScreenshotUpload();

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/admin/login';
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    if (currentType === 'posts' && document.getElementById('postsEditor').style.display !== 'none') savePost();
    if (currentType === 'work' && document.getElementById('workEditor').style.display !== 'none') saveWork();
    if (currentType === 'capabilities' && document.getElementById('capabilitiesEditor').style.display !== 'none') saveCapability();
  }
});

// Init
checkAuth().then(authenticated => {
  if (authenticated) {
    loadCategories();
    loadItems('posts');
    // Initialize preset icon grid
    renderPresetIconGrid();
  }
});
