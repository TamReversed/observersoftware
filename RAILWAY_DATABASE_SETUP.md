# Railway PostgreSQL Setup

## Quick Setup

1. **Add PostgreSQL Service**
   - In your Railway project, click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically create the database

2. **Link Services**
   - In your app service settings, go to "Variables" tab
   - Railway automatically adds `DATABASE_URL` when services are linked
   - The connection string will use Railway's internal networking: `postgresql://user:pass@postgres.railway.internal:5432/railway`

3. **Deploy**
   - Push your code to trigger a deployment
   - The app will automatically:
     - Detect `DATABASE_URL`
     - Initialize the database schema
     - Start using PostgreSQL instead of JSON files

## Verify Connection

After deployment, check your logs. You should see:
```
✓ Connected to PostgreSQL database
✓ Database connection verified
✓ Database schema initialized
✓ Using PostgreSQL database
```

## Troubleshooting

### DATABASE_URL not set
- Make sure PostgreSQL service is added to your project
- Make sure services are linked (Railway does this automatically)
- Check the "Variables" tab in your app service - `DATABASE_URL` should be there

### Connection errors
- Railway uses internal networking (`postgres.railway.internal`)
- SSL is required - the code handles this automatically
- Connection timeout is set to 10 seconds for Railway's internal network

### Schema initialization errors
- The schema uses `IF NOT EXISTS` - safe to run multiple times
- If you see "already exists" errors, that's normal - they're ignored

## Manual Connection String (if needed)

If for some reason Railway doesn't set `DATABASE_URL` automatically, you can construct it:

```
postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway
```

Get the password from your PostgreSQL service's "Variables" tab (look for `PGPASSWORD` or check the service's connection details).

## Migration from JSON

If you have existing data in JSON files:

1. Deploy with PostgreSQL first (schema will initialize)
2. SSH into your Railway service or use Railway's CLI
3. Run: `node scripts/migrate-to-postgres.js`

Or wait - the app will work with empty database, and you can add data through the admin panel.

