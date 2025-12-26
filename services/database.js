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
      
      // Better SQL parsing that handles dollar-quoted strings (functions)
      // Remove single-line comments first
      let cleanedSchema = schema.replace(/--.*$/gm, '');
      
      // Split statements more carefully, handling dollar-quoted function bodies
      const statements = [];
      let currentStatement = '';
      let inDollarQuote = false;
      let dollarTag = '';
      
      for (let i = 0; i < cleanedSchema.length; i++) {
        const char = cleanedSchema[i];
        
        // Check for dollar-quote start/end ($$ or $tag$)
        if (char === '$' && !inDollarQuote) {
          // Look ahead to find the closing $
          let j = i + 1;
          while (j < cleanedSchema.length && cleanedSchema[j] !== '$') {
            j++;
          }
          if (j < cleanedSchema.length) {
            dollarTag = cleanedSchema.substring(i, j + 1);
            inDollarQuote = true;
            currentStatement += dollarTag;
            i = j;
            continue;
          }
        } else if (inDollarQuote && cleanedSchema.substring(i, i + dollarTag.length) === dollarTag) {
          inDollarQuote = false;
          currentStatement += dollarTag;
          i += dollarTag.length - 1;
          continue;
        }
        
        currentStatement += char;
        
        // If we hit a semicolon and we're not in a dollar-quote, end the statement
        if (char === ';' && !inDollarQuote) {
          const trimmed = currentStatement.trim();
          if (trimmed.length > 0) {
            statements.push(trimmed);
          }
          currentStatement = '';
        }
      }
      
      // Add any remaining statement
      if (currentStatement.trim().length > 0) {
        statements.push(currentStatement.trim());
      }
      
      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await client.query(statement);
          } catch (err) {
            // Ignore "already exists" errors (idempotent)
            const errCode = err.code;
            const errMsg = err.message.toLowerCase();
            
            // PostgreSQL error codes for "already exists"
            if (errCode === '42P07' || // relation already exists
                errCode === '42710' || // duplicate object
                errCode === '42P16' || // invalid table definition
                errMsg.includes('already exists') ||
                errMsg.includes('duplicate')) {
              // Silently ignore - schema is already initialized
              continue;
            }
            
            // For other errors, log but don't fail completely
            console.warn(`Warning executing statement: ${err.message}`);
            console.warn(`Error code: ${errCode}`);
            console.warn(`Statement preview: ${statement.substring(0, 150)}...`);
            // Continue with other statements
          }
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

