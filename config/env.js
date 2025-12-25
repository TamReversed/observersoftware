require('dotenv').config();

const requiredEnvVars = ['SESSION_SECRET'];

function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (isProduction && missing.length > 0) {
    console.error(`ERROR: Missing required environment variables in production: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (!isProduction && missing.length > 0) {
    console.warn(`WARNING: Missing environment variables (using defaults): ${missing.join(', ')}`);
  }
}

module.exports = { validateEnv };



