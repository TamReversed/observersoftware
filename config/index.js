const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  port: process.env.PORT || 3000,
  isProduction,
  session: {
    secret: process.env.SESSION_SECRET || 'observer-dev-secret-key-2024',
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
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
      messagesFile: path.join(dataDir, 'messages.json')
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




