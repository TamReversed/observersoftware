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
    
      // Execute schema statements
      // Don't use a transaction - if one statement fails, we want to continue with others
      // This makes the schema initialization idempotent
      const client = await pool.connect();
      try {
      
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
        
        // Check for dollar-quote start ($$ or $tag$)
        if (char === '$' && !inDollarQuote) {
          // Look for the matching closing $
          let j = i + 1;
          // Check if it's $$ (simple case)
          if (j < cleaned.length && cleaned[j] === '$') {
            dollarTag = '$$';
            inDollarQuote = true;
            current += dollarTag;
            i = j;
            continue;
          }
          // Otherwise look for $tag$ pattern
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
        if (inDollarQuote) {
          // Check if we've reached the closing dollar tag
          if (i + dollarTag.length <= cleaned.length) {
            const potentialEnd = cleaned.substring(i, i + dollarTag.length);
            if (potentialEnd === dollarTag) {
              inDollarQuote = false;
              current += dollarTag;
              i += dollarTag.length - 1;
              continue;
            }
          }
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
      
      // Execute each statement with better error handling
      console.log(`Executing ${statements.length} schema statements...`);
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (statement.length === 0) continue;
        
        // Log what we're executing (first 100 chars)
        const preview = statement.substring(0, 100).replace(/\s+/g, ' ');
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Executing statement ${i + 1}/${statements.length}: ${preview}...`);
        }
        
        try {
          await client.query(statement);
        } catch (err) {
          const errCode = err.code;
          const errMsg = err.message.toLowerCase();
          
          // Check error type
          const isCreateTable = statement.toUpperCase().includes('CREATE TABLE');
          const isCreateTrigger = statement.toUpperCase().includes('CREATE TRIGGER');
          const isCreateIndex = statement.toUpperCase().includes('CREATE INDEX');
          const isCreateFunction = statement.toUpperCase().includes('CREATE FUNCTION') || 
                                   statement.toUpperCase().includes('CREATE OR REPLACE FUNCTION');
          
          // Ignore "already exists" errors (idempotent) - but only for certain operations
          if (errCode === '42P07' || // relation already exists
              errCode === '42710' || // duplicate object
              errCode === '42P16' || // invalid table definition
              errCode === '42723' || // function already exists
              errCode === '42P17' || // cannot drop trigger (already exists)
              (errCode === '42P01' && isCreateIndex) || // index on non-existent table (might be ok if table doesn't exist yet)
              errMsg.includes('already exists') ||
              errMsg.includes('duplicate')) {
            // For CREATE TABLE IF NOT EXISTS, 42P07 is expected if table exists
            if (isCreateTable && errCode === '42P07') {
              continue; // Table already exists, that's fine
            }
            // For CREATE INDEX IF NOT EXISTS, 42P07 is expected
            if (isCreateIndex && errCode === '42P07') {
              continue; // Index already exists, that's fine
            }
            // For CREATE OR REPLACE FUNCTION, 42723 is expected
            if (isCreateFunction && errCode === '42723') {
              continue; // Function already exists, that's fine
            }
            // For other "already exists" cases, continue
            continue;
          }
          
          // For relation does not exist errors on CREATE TRIGGER, 
          // it means the table wasn't created - log but continue
          if (errCode === '42P01' && isCreateTrigger) {
            console.warn(`⚠ Cannot create trigger - table does not exist yet`);
            console.warn(`  Statement: ${preview}...`);
            console.warn(`  Error: ${err.message}`);
            console.warn(`  This might be a timing issue, continuing...`);
            continue;
          }
          
          // For relation does not exist on CREATE TABLE, that's unexpected
          // but might be a timing issue, so log and continue
          if (errCode === '42P01' && isCreateTable) {
            console.warn(`⚠ Cannot create table - unexpected error`);
            console.warn(`  Statement: ${preview}...`);
            console.warn(`  Error: ${err.message}`);
            continue;
          }
          
          // For relation does not exist on CREATE INDEX, log but continue
          // (index might be created before table in some edge cases)
          if (errCode === '42P01' && isCreateIndex) {
            console.warn(`Warning: Cannot create index - table does not exist yet`);
            console.warn(`  Statement: ${preview}...`);
            console.warn(`  This might be a timing issue, continuing...`);
            continue;
          }
          
          // For other errors, log the details but continue
          console.warn(`Warning executing statement ${i + 1}/${statements.length}:`);
          console.warn(`  Code: ${errCode}`);
          console.warn(`  Message: ${err.message}`);
          console.warn(`  Statement: ${preview}...`);
        }
      }
      
      console.log('✓ Database schema initialized');
    } catch (error) {
      console.error('✗ Error in schema initialization:', error.message);
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

// Check if database tables are empty
async function isDatabaseEmpty() {
  if (!pool) {
    return false;
  }
  
  try {
    // Check if any of the main tables have data
    const capabilitiesCount = await pool.query('SELECT COUNT(*) FROM capabilities');
    const workCount = await pool.query('SELECT COUNT(*) FROM work');
    const postsCount = await pool.query('SELECT COUNT(*) FROM posts');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    
    const totalCount = 
      parseInt(capabilitiesCount.rows[0].count) +
      parseInt(workCount.rows[0].count) +
      parseInt(postsCount.rows[0].count) +
      parseInt(usersCount.rows[0].count);
    
    return totalCount === 0;
  } catch (error) {
    // If tables don't exist yet, consider it empty
    if (error.code === '42P01') {
      return true;
    }
    console.warn('Error checking if database is empty:', error.message);
    return false;
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
  initializeSchema,
  isDatabaseEmpty
};

