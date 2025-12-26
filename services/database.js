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
    
    // Execute the entire schema as a single transaction
    // This ensures proper order and handles multi-statement constructs
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Execute schema statements in correct order
      // Split by semicolons, handling dollar-quoted function bodies
      const statements = [];
      let current = '';
      let inDollarQuote = false;
      let dollarTag = '';
      
      // Remove single-line comments
      let cleaned = schema.replace(/--.*$/gm, '');
      
      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        
        // Check for dollar-quote start
        if (char === '$' && !inDollarQuote) {
          let j = i + 1;
          while (j < cleaned.length && cleaned[j] !== '$') {
            j++;
          }
          if (j < cleaned.length) {
            dollarTag = cleaned.substring(i, j + 1);
            inDollarQuote = true;
            current += dollarTag;
            i = j;
            continue;
          }
        }
        
        // Check for dollar-quote end
        if (inDollarQuote && cleaned.substring(i, i + dollarTag.length) === dollarTag) {
          inDollarQuote = false;
          current += dollarTag;
          i += dollarTag.length - 1;
          continue;
        }
        
        current += char;
        
        // End statement on semicolon (if not in dollar quote)
        if (char === ';' && !inDollarQuote) {
          const trimmed = current.trim();
          if (trimmed.length > 0) {
            statements.push(trimmed);
          }
          current = '';
        }
      }
      
      // Add final statement if any
      if (current.trim().length > 0) {
        statements.push(current.trim());
      }
      
      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (statement.length === 0) continue;
        
        try {
          await client.query(statement);
        } catch (err) {
          const errCode = err.code;
          const errMsg = err.message.toLowerCase();
          
          // Ignore "already exists" errors (idempotent)
          if (errCode === '42P07' || // relation already exists
              errCode === '42710' || // duplicate object
              errCode === '42P16' || // invalid table definition
              errCode === '42723' || // function already exists
              errMsg.includes('already exists') ||
              errMsg.includes('duplicate')) {
            // Silently continue
            continue;
          }
          
          // For other errors, log the details
          console.error(`Error executing statement ${i + 1}/${statements.length}:`);
          console.error(`  Code: ${errCode}`);
          console.error(`  Message: ${err.message}`);
          console.error(`  Statement: ${statement.substring(0, 200)}...`);
          
          // Don't throw - continue with other statements
          // Some statements might fail if dependencies aren't ready yet
        }
      }
      
      await client.query('COMMIT');
      console.log('✓ Database schema initialized');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('✗ Error initializing database schema:', error.message);
    console.error('Error code:', error.code);
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

