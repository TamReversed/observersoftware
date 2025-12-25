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
    dataDir: path.join(__dirname, '..', 'data'),
    usersFile: path.join(__dirname, '..', 'data', 'users.json'),
    postsFile: path.join(__dirname, '..', 'data', 'posts.json'),
    workFile: path.join(__dirname, '..', 'data', 'work.json'),
    capabilitiesFile: path.join(__dirname, '..', 'data', 'capabilities.json')
  },
  admin: {
    defaultUsername: process.env.ADMIN_USERNAME || 'admin',
    defaultPassword: process.env.ADMIN_PASSWORD || 'changeme123'
  }
};

module.exports = config;



