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
      
      // Use a simpler approach: execute the entire schema file
      // PostgreSQL can handle multiple statements in one query
      // But we need to handle dollar-quoted function bodies
      
      // First, let's try executing the whole thing
      // If that fails, fall back to statement-by-statement
      try {
        await client.query(schema);
        console.log('✓ Schema executed as single query');
      } catch (err) {
        // If that fails, try statement by statement
        console.log('Executing schema statements individually...');
        
        // Remove comments
        let cleanedSchema = schema.replace(/--.*$/gm, '');
        
        // Split by semicolon, but be smarter about it
        // Use a regex that respects dollar-quoted strings
        const statements = [];
        let current = '';
        let depth = 0;
        let inDollarQuote = false;
        let dollarTag = '';
        
        for (let i = 0; i < cleanedSchema.length; i++) {
          const char = cleanedSchema[i];
          const nextChar = cleanedSchema[i + 1] || '';
          
          // Handle dollar-quoted strings
          if (char === '$' && !inDollarQuote) {
            // Find the closing $
            let tagEnd = i + 1;
            while (tagEnd < cleanedSchema.length && cleanedSchema[tagEnd] !== '$') {
              tagEnd++;
            }
            if (tagEnd < cleanedSchema.length) {
              dollarTag = cleanedSchema.substring(i, tagEnd + 1);
              inDollarQuote = true;
              current += dollarTag;
              i = tagEnd;
              continue;
            }
          } else if (inDollarQuote && cleanedSchema.substring(i, i + dollarTag.length) === dollarTag) {
            inDollarQuote = false;
            current += dollarTag;
            i += dollarTag.length - 1;
            continue;
          }
          
          current += char;
          
          // End statement on semicolon (if not in dollar quote)
          if (char === ';' && !inDollarQuote) {
            const trimmed = current.trim();
            if (trimmed.length > 0 && !trimmed.match(/^\s*$/)) {
              statements.push(trimmed);
            }
            current = '';
          }
        }
        
        // Execute statements one by one
        for (const statement of statements) {
          const trimmed = statement.trim();
          if (trimmed.length > 0) {
            try {
              await client.query(trimmed);
            } catch (err) {
              // Ignore "already exists" errors
              const errCode = err.code;
              const errMsg = err.message.toLowerCase();
              
              if (errCode === '42P07' || // relation already exists
                  errCode === '42710' || // duplicate object
                  errCode === '42P16' || // invalid table definition
                  errMsg.includes('already exists') ||
                  errMsg.includes('duplicate')) {
                continue; // Skip
              }
              
              // Log other errors but continue
              console.warn(`SQL warning: ${err.message} (code: ${errCode})`);
              console.warn(`Statement: ${trimmed.substring(0, 100)}...`);
            }
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

