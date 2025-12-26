const { Pool } = require('pg');
const config = require('../config');

// Create PostgreSQL connection pool
// Railway automatically sets DATABASE_URL when PostgreSQL service is linked
let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Railway's internal networking uses private hostnames like postgres.railway.internal
    // SSL is typically required for Railway PostgreSQL
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } 
      : (process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased for Railway internal networking
  });

  // Test connection
  pool.on('connect', () => {
    console.log('✓ Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('✗ Unexpected error on idle PostgreSQL client', err);
    // Don't exit in production - let the app handle reconnection
    if (process.env.NODE_ENV !== 'production') {
      process.exit(-1);
    }
  });
} else {
  console.log('⚠ DATABASE_URL not set - will use JSON file storage');
}

// Initialize database schema
async function initializeSchema() {
  if (!pool) {
    throw new Error('Cannot initialize schema: DATABASE_URL not set');
  }
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Test connection first
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection verified');
    
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
        } catch (err) {
          // Ignore "already exists" errors (idempotent)
          if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
            throw err;
          }
        }
      }
    }
    
    console.log('✓ Database schema initialized');
  } catch (error) {
    console.error('✗ Error initializing database schema:', error.message);
    throw error;
  }
}

// Query helper
async function query(text, params) {
  if (!pool) {
    throw new Error('Database pool not initialized. DATABASE_URL must be set.');
  }
  
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  initializeSchema
};

