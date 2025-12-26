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
  paths: {
    // Use persistent volume path on Railway, or default to ./data
    // Railway persistent volumes are mounted at /data by default
    dataDir: (() => {
      const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
      return dataDir;
    })(),
    get usersFile() {
      return path.join(this.dataDir, 'users.json');
    },
    get postsFile() {
      return path.join(this.dataDir, 'posts.json');
    },
    get workFile() {
      return path.join(this.dataDir, 'work.json');
    },
    get capabilitiesFile() {
      return path.join(this.dataDir, 'capabilities.json');
    }
  },
  admin: {
    defaultUsername: process.env.ADMIN_USERNAME || 'admin',
    defaultPassword: process.env.ADMIN_PASSWORD || 'changeme123'
  },
  webauthn: {
    rpID: process.env.WEBAUTHN_RP_ID || (isProduction ? 'observersoftware.io' : 'localhost'),
    rpName: process.env.WEBAUTHN_RP_NAME || 'Observer',
    origin: process.env.WEBAUTHN_ORIGIN || (isProduction ? 'https://observersoftware.io' : 'http://localhost:3000')
  }
};

module.exports = config;




