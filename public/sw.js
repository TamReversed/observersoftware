// Service Worker for PWA
// Cache static assets and API responses

const CACHE_VERSION = 'v3';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/blog',
  '/styles/styles.css',
  '/styles/blog.css',
  '/styles/post.css',
  '/styles/skeletons.css',
  '/styles/transitions.css',
  '/scripts/main.js',
  '/scripts/blog.js',
  '/scripts/post.js',
  '/scripts/home.js',
  '/scripts/work.js',
  '/scripts/skeletons.js',
  '/scripts/magnetic-buttons.js',
  '/scripts/reading-progress.js',
  '/scripts/share.js',
  '/scripts/table-of-contents.js',
  '/scripts/theme-toggle.js',
  '/scripts/page-transitions.js',
  '/scripts/logo.js',
  '/scripts/icons.js',
  '/favicon-eye.svg'
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('Cache addAll failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('static-') || name.startsWith('api-');
          })
          .filter((name) => {
            return name !== STATIC_CACHE && name !== API_CACHE;
          })
          .map((name) => {
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip external URLs - only cache same-origin resources
  // This prevents CSP violations when trying to cache external resources
  if (url.origin !== self.location.origin) {
    return; // Let browser handle external resources normally
  }

  // API requests: Network-first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline response if no cache
            return new Response(
              JSON.stringify({ error: 'Offline' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Static assets: Network-first for JS/CSS (to get latest code), cache-first for others
  if (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  ) {
    // For JS and CSS, use network-first to ensure latest code
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
      event.respondWith(
        fetch(request, { cache: 'no-cache' })
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            return caches.match(request);
          })
      );
    } else {
      // For other assets, use cache-first
      event.respondWith(
        caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
      );
    }
    return;
  }

  // HTML pages: Always fetch fresh (bypass cache for development)
  // This ensures we always get the latest HTML with updated scripts
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          // Only cache if response is ok and not a navigation request
          if (response.ok && request.mode === 'navigate') {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Only use cache as fallback if network completely fails
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Default: Network-first
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

