# PostgreSQL Migration Guide

This project now supports PostgreSQL as the database backend. The system will automatically use PostgreSQL if `DATABASE_URL` is set, otherwise it falls back to JSON files.

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up PostgreSQL Database

**On Railway:**
1. Add a PostgreSQL service to your project
2. Railway will automatically set the `DATABASE_URL` environment variable
3. The app will automatically initialize the schema on startup

**Locally:**
1. Install PostgreSQL
2. Create a database:
   ```bash
   createdb observer_portfolio
   ```
3. Set `DATABASE_URL` in your `.env` file:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/observer_portfolio
   ```

### 3. Migrate Existing Data (Optional)

If you have existing data in JSON files that you want to migrate:

```bash
node scripts/migrate-to-postgres.js
```

This will:
- Create all database tables
- Migrate data from JSON files to PostgreSQL
- Skip duplicates (safe to run multiple times)

### 4. Start the Server

```bash
npm start
```

The server will:
- Automatically detect if `DATABASE_URL` is set
- Initialize the database schema if using PostgreSQL
- Fall back to JSON files if no database is configured

## What Changed

### New Files
- `database/schema.sql` - Database schema definition
- `services/database.js` - PostgreSQL connection pool
- `services/dbService.js` - Database service (replaces DataService for DB)
- `scripts/migrate-to-postgres.js` - Migration script

### Updated Files
- `config/index.js` - Added database configuration
- `controllers/capabilitiesController.js` - Updated to use async/await and support both DB and JSON
- `server.js` - Initializes database schema on startup

### Still Need Updates
The following controllers still need to be updated to use async/await:
- `controllers/workController.js`
- `controllers/postsController.js`
- `controllers/authController.js`
- `services/initService.js`

## How It Works

The system uses a **dual-mode approach**:

1. **If `DATABASE_URL` is set**: Uses PostgreSQL via `DbService`
2. **If `DATABASE_URL` is not set**: Uses JSON files via `DataService`

This allows you to:
- Develop locally with JSON files (no database setup needed)
- Deploy to production with PostgreSQL (just set `DATABASE_URL`)

## Database Schema

The database includes these tables:
- `users` - User accounts and WebAuthn credentials
- `capabilities` - Products/capabilities
- `work` - Work portfolio items
- `posts` - Blog posts

All JSON fields (arrays, objects) are stored as JSONB in PostgreSQL for efficient querying.

## Benefits of PostgreSQL

- ✅ Data persists across deployments
- ✅ Better performance for queries
- ✅ Built-in data integrity
- ✅ Easier backups
- ✅ Supports concurrent access
- ✅ No file system dependencies

