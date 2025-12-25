const express = require('express');
const session = require('express-session');
const path = require('path');
const { validateEnv } = require('./config/env');
const config = require('./config');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { initializeData } = require('./services/initService');

// Validate environment variables
validateEnv();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// API routes
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
  });
}).catch(err => {
  console.error('Failed to initialize data:', err);
  process.exit(1);
});
