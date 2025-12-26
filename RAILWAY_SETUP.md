# Railway Deployment Setup for Data Persistence

## Problem
By default, Railway's filesystem is ephemeral - it gets wiped on each deployment. This means any edits you make in the admin panel on production will be lost when you deploy.

## Solution: Use Railway Persistent Volume

### Step 1: Create a Persistent Volume in Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the **"Volumes"** tab
4. Click **"New Volume"**
5. Name it `data` (or any name you prefer)
6. Set the mount path to `/data`
7. Click **"Create"**

### Step 2: Set Environment Variable

1. In your Railway service, go to the **"Variables"** tab
2. Add a new environment variable:
   - **Name**: `DATA_DIR`
   - **Value**: `/data`
3. Save the variable

### Step 3: Deploy

After setting up the volume and environment variable, your next deployment will:
- Use `/data` as the data directory (which is persisted across deployments)
- All admin panel edits will be saved to the persistent volume
- Your data will survive deployments, restarts, and updates

## Alternative: Use a Database

For production, consider migrating to a database (PostgreSQL, MongoDB, etc.) instead of JSON files. This provides:
- Better performance
- Built-in persistence
- Better concurrency handling
- Easier backups

## Current Setup

The application is configured to:
- Use `./data` directory locally (default)
- Use `/data` directory on Railway when `DATA_DIR` environment variable is set
- Track `capabilities.json` and `work.json` in Git (for initial seed data)
- Store runtime edits in the persistent volume (not in Git)

