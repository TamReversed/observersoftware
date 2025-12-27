// Ensure Web Crypto API is available for @simplewebauthn/server
// Node.js 18+ has Web Crypto API, but we need to ensure it's accessible
if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = require('crypto');
  globalThis.crypto = webcrypto;
}

const express = require('express');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { validateEnv } = require('./config/env');
const config = require('./config');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { initializeData } = require('./services/initService');
const { generateCsrfToken, validateCsrfToken } = require('./middleware/csrf');
const { initializeSchema, isDatabaseEmpty } = require('./services/database');
const { migrate } = require('./scripts/migrate-to-postgres');

// Validate environment variables
validateEnv();

const app = express();

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://opnform.com", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: [
        "'self'", 
        "https://fonts.googleapis.com", 
        "https://cdn.jsdelivr.net", 
        "https://opnform.com",
        ...(config.isProduction ? [] : ["http://127.0.0.1:7242", "http://localhost:7242"])
      ],
      frameSrc: ["'self'", "https://opnform.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: config.isProduction ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false // Allow external resources
}));

// Request size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: config.session.cookie
}));

// Trust proxy in production (for Railway, Render, etc.)
if (config.isProduction) {
  app.set('trust proxy', 1);
}

// Rate limiting for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
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
app.use('/api', apiLimiter);

// CSRF protection - generate token for all requests
app.use(generateCsrfToken);

// Health check endpoint (for Railway/deployment monitoring)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (CSRF validation applied per route)
app.use(routes);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// SPA-style routing
app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'post.html'));
});

app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

app.get('/observe', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

// Keep /admin/login as redirect for backwards compatibility
app.get('/admin/login', (req, res) => {
  res.redirect('/observe');
});

app.get('/coming-soon', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'coming-soon.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
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
      console.log('  ✓ Rate limiting (login: 5/15min, API: 100/15min)');
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
