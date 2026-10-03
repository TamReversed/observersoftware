// Ensure Web Crypto API is available for @simplewebauthn/server
// Node.js 18+ has Web Crypto API, but we need to ensure it's accessible
if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = require('crypto');
  globalThis.crypto = webcrypto;
}

const express = require('express');
const compression = require('compression');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { validateEnv } = require('./config/env');
const config = require('./config');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { initializeData } = require('./services/initService');
const { initializeSchema, isDatabaseEmpty, pool, query } = require('./services/database');
const postsStore = require('./services/postsStore');
const seoRoutes = require('./routes/seo');
const { migrate } = require('./scripts/migrate-to-postgres');

// Validate environment variables
validateEnv();

const app = express();

// Trust the platform proxy (Railway) so req.ip and secure cookies are correct
if (config.isProduction) {
  app.set('trust proxy', 1);
}

app.use(compression());

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: [
        "'self'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
        ...(config.isProduction ? [] : ["http://127.0.0.1:7242", "http://localhost:7242"])
      ],
      frameSrc: ["'none'"], // Prevent embedding in iframes (except self)
      frameAncestors: ["'none'"], // Prevent clickjacking - site cannot be embedded
      objectSrc: ["'none'"],
      baseUri: ["'self'"], // Prevent base tag hijacking
      formAction: ["'self'"], // Forms can only submit to same origin
      upgradeInsecureRequests: config.isProduction ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false, // Allow external resources
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: config.isProduction ? { maxAge: 31536000 } : false
}));

// Health check (before sessions; verifies the database when one is configured)
app.get('/health', async (req, res) => {
  try {
    if (config.database.useDatabase) {
      await query('SELECT 1');
    }
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'unavailable' });
  }
});

// Legacy .html URLs redirect to their clean equivalents
const CLEAN_URLS = {
  '/index.html': '/',
  '/work.html': '/work',
  '/products.html': '/products',
  '/blog.html': '/blog',
  '/contact.html': '/contact',
  '/terms.html': '/terms'
};
app.use((req, res, next) => {
  const target = CLEAN_URLS[req.path];
  if (target) return res.redirect(301, target);
  next();
});

// Static files come before sessions so asset requests never create a session
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, {
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));
app.use('/uploads', express.static(config.paths.uploadsDir, { maxAge: '30d' }));

// Request size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Sessions: stored in Postgres when available so deploys do not log admins out
let sessionStore;
if (config.database.useDatabase && pool) {
  const PgSession = require('connect-pg-simple')(session);
  sessionStore = new PgSession({ pool, tableName: 'session', createTableIfMissing: true });
}

app.use(session({
  store: sessionStore,
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: config.session.cookie
}));

// Rate limiting for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for contact form (prevent spam)
const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 messages per 15 minutes
  message: { error: 'Too many messages sent. Please wait a few minutes before sending another message.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, even successful ones
});

// General API rate limiting (more lenient for public endpoints)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window (increased for frontend page loads)
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/webauthn', loginLimiter); // Same limits for passkey auth
app.use('/api/messages', contactFormLimiter); // Stricter rate limit for contact form
app.use('/api', apiLimiter);

// API routes (CSRF validation applied per route)
app.use(routes);

// SEO routes (robots.txt, sitemap.xml)
app.use(seoRoutes);

const sendPage = (file) => (req, res) => res.sendFile(path.join(publicDir, file));

app.get('/work', sendPage('work.html'));
app.get('/products', sendPage('products.html'));
app.get('/blog', sendPage('blog.html'));
app.get('/contact', sendPage('contact.html'));
app.get('/terms', sendPage('terms.html'));
app.get('/coming-soon', sendPage('coming-soon.html'));

// Posts that do not exist (or are unpublished) return a real 404
app.get('/blog/:slug', async (req, res, next) => {
  try {
    const post = await postsStore.findBySlug(req.params.slug);
    if (!post || !post.published) {
      return res.status(404).sendFile(path.join(publicDir, '404.html'));
    }
    res.sendFile(path.join(publicDir, 'post.html'));
  } catch (err) {
    next(err);
  }
});

app.get('/admin', sendPage('admin/dashboard.html'));
app.get('/observe', sendPage('admin/login.html'));

// Keep /admin/login as redirect for backwards compatibility
app.get('/admin/login', (req, res) => {
  res.redirect('/observe');
});

// Unknown paths: JSON 404 for the API, the 404 page for everything else
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, '404.html'));
});

// Error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Initialize database if DATABASE_URL is set
    if (config.database.useDatabase) {
      await initializeSchema();
      console.log('✓ Database initialized');
      
      // Auto-migrate JSON data to database if database is empty
      const isEmpty = await isDatabaseEmpty();
      if (isEmpty) {
        console.log('Database is empty, checking for JSON data to migrate...');
        const fs = require('fs');
        const hasJsonData = 
          fs.existsSync(config.paths.capabilitiesFile) ||
          fs.existsSync(config.paths.workFile) ||
          fs.existsSync(config.paths.postsFile) ||
          fs.existsSync(config.paths.usersFile);
        
        if (hasJsonData) {
          console.log('Found JSON data files, migrating to database...');
          try {
            await migrate();
            console.log('✓ Data migration completed');
          } catch (error) {
            console.error('⚠ Migration failed, continuing with empty database:', error.message);
            // Don't exit - continue with empty database
          }
        } else {
          console.log('No JSON data files found, starting with empty database');
        }
      } else {
        console.log('Database already contains data, skipping migration');
      }
    }
    
    require('fs').mkdirSync(config.paths.uploadsDir, { recursive: true });

    // Initialize data (creates default admin user, sample data if needed)
    await initializeData();
    
    app.listen(config.port, () => {
      console.log(`Server running at http://localhost:${config.port}`);
      console.log(`Admin panel: http://localhost:${config.port}/observe`);
      if (config.database.useDatabase) {
        console.log('✓ Using PostgreSQL database');
      } else {
        console.log('✓ Using JSON file storage');
      }
      console.log('Security features enabled:');
      console.log('  ✓ Helmet.js security headers');
      console.log('  ✓ CSRF protection');
      console.log('  ✓ Rate limiting (login: 5/15min, API: 200/15min)');
      console.log('  ✓ Input validation');
      console.log('  ✓ Markdown sanitization');
      console.log('  ✓ File upload validation');
    });
  } catch (err) {
    console.error('Failed to initialize:', err);
    process.exit(1);
  }
}

startServer();
