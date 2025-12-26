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

// Validate environment variables
validateEnv();

const app = express();

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "http://127.0.0.1:7242"],
      frameSrc: ["'none'"],
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

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.get('/coming-soon', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'coming-soon.html'));
});

// Error handler
app.use(errorHandler);

// Start server
initializeData().then(() => {
  app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
    console.log(`Admin panel: http://localhost:${config.port}/admin/login`);
    console.log('Security features enabled:');
    console.log('  ✓ Helmet.js security headers');
    console.log('  ✓ CSRF protection');
    console.log('  ✓ Rate limiting (login: 5/15min, API: 100/15min)');
    console.log('  ✓ Input validation');
    console.log('  ✓ Markdown sanitization');
    console.log('  ✓ File upload validation');
  });
}).catch(err => {
  console.error('Failed to initialize data:', err);
  process.exit(1);
});
