const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

// Security: Require strong credentials in production
if (isProduction) {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error('Production requires SESSION_SECRET environment variable (min 32 characters)');
  }
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'changeme123') {
    throw new Error('Production requires ADMIN_PASSWORD environment variable (cannot be default)');
  }
}

const config = {
  port: process.env.PORT || 3000,
  siteUrl: (process.env.SITE_URL || 'https://observersoftware.io').replace(/\/+$/, ''),
  isProduction,
  session: {
    secret: process.env.SESSION_SECRET || 'observer-dev-secret-key-2024',
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict' // Upgraded from 'lax' for better CSRF protection
    }
  },
  paths: (() => {
    // Use persistent volume path on Railway, or default to ./data
    // Set DATA_DIR=/data in Railway environment variables to use persistent volume
    const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
    return {
      dataDir,
      usersFile: path.join(dataDir, 'users.json'),
      postsFile: path.join(dataDir, 'posts.json'),
      workFile: path.join(dataDir, 'work.json'),
      capabilitiesFile: path.join(dataDir, 'capabilities.json'),
      messagesFile: path.join(dataDir, 'messages.json'),
      settingsFile: path.join(dataDir, 'settings.json'),
      homepageFile: path.join(dataDir, 'homepage.json'),
      navigationFile: path.join(dataDir, 'navigation.json'),
      mediaFile: path.join(dataDir, 'media.json'),
      categoriesFile: path.join(dataDir, 'categories.json'),
      changelogFile: path.join(dataDir, 'changelog.json'),
      testimonialsFile: path.join(dataDir, 'testimonials.json'),
      faqsFile: path.join(dataDir, 'faqs.json'),
      uploadsDir: path.join(dataDir, 'uploads')
    };
  })(),
  admin: {
    defaultUsername: process.env.ADMIN_USERNAME || 'admin',
    defaultPassword: process.env.ADMIN_PASSWORD || 'changeme123'
  },
  webauthn: {
    rpID: process.env.WEBAUTHN_RP_ID || (isProduction ? 'observersoftware.io' : 'localhost'),
    rpName: process.env.WEBAUTHN_RP_NAME || 'Observer',
    origin: process.env.WEBAUTHN_ORIGIN || (isProduction ? 'https://observersoftware.io' : 'http://localhost:3000')
  },
  database: {
    url: process.env.DATABASE_URL,
    // Use database if DATABASE_URL is set, otherwise fall back to JSON files
    useDatabase: !!process.env.DATABASE_URL
  }
};

module.exports = config;




