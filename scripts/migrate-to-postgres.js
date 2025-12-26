/**
 * Migration script to move data from JSON files to PostgreSQL
 * Run this once after setting up the database
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { initializeSchema, query } = require('../services/database');
const config = require('../config');

async function migrate() {
  try {
    console.log('Starting migration from JSON to PostgreSQL...');
    
    // Initialize schema
    await initializeSchema();
    console.log('✓ Schema initialized');
    
    // Migrate capabilities
    if (fs.existsSync(config.paths.capabilitiesFile)) {
      const capabilities = JSON.parse(fs.readFileSync(config.paths.capabilitiesFile, 'utf8'));
      console.log(`Migrating ${capabilities.length} capabilities...`);
      
      for (const cap of capabilities) {
        await query(
          `INSERT INTO capabilities (id, title, description, long_description, features, screenshots, external_url, icon, "order", published, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO NOTHING`,
          [
            cap.id,
            cap.title,
            cap.description,
            cap.longDescription || '',
            JSON.stringify(cap.features || []),
            JSON.stringify(cap.screenshots || []),
            cap.externalUrl || '',
            JSON.stringify(cap.icon || { type: 'preset', preset: '', svg: '', lottieUrl: '', lottieData: null }),
            cap.order || 0,
            cap.published || false,
            cap.createdAt || new Date().toISOString(),
            cap.updatedAt || new Date().toISOString()
          ]
        );
      }
      console.log('✓ Capabilities migrated');
    }
    
    // Migrate work
    if (fs.existsSync(config.paths.workFile)) {
      const work = JSON.parse(fs.readFileSync(config.paths.workFile, 'utf8'));
      console.log(`Migrating ${work.length} work items...`);
      
      for (const item of work) {
        await query(
          `INSERT INTO work (id, industry, problem, solution, tags, image, client, date, case_study_url, "order", published, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO NOTHING`,
          [
            item.id,
            item.industry,
            item.problem,
            item.solution,
            JSON.stringify(item.tags || []),
            item.image || '',
            item.client || '',
            item.date || '',
            item.caseStudyUrl || '',
            item.order || 0,
            item.published || false,
            item.createdAt || new Date().toISOString(),
            item.updatedAt || new Date().toISOString()
          ]
        );
      }
      console.log('✓ Work items migrated');
    }
    
    // Migrate posts
    if (fs.existsSync(config.paths.postsFile)) {
      const posts = JSON.parse(fs.readFileSync(config.paths.postsFile, 'utf8'));
      console.log(`Migrating ${posts.length} posts...`);
      
      for (const post of posts) {
        await query(
          `INSERT INTO posts (id, slug, title, excerpt, category, content, author, published_at, updated_at, published)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (slug) DO NOTHING`,
          [
            post.id,
            post.slug,
            post.title,
            post.excerpt || '',
            post.category || '',
            post.content,
            post.author,
            post.publishedAt || null,
            post.updatedAt || new Date().toISOString(),
            post.published || false
          ]
        );
      }
      console.log('✓ Posts migrated');
    }
    
    // Migrate users
    if (fs.existsSync(config.paths.usersFile)) {
      const users = JSON.parse(fs.readFileSync(config.paths.usersFile, 'utf8'));
      console.log(`Migrating ${users.length} users...`);
      
      for (const user of users) {
        await query(
          `INSERT INTO users (id, username, password, webauthn_credentials, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (username) DO NOTHING`,
          [
            user.id,
            user.username,
            user.password,
            JSON.stringify(user.webauthnCredentials || []),
            user.createdAt || new Date().toISOString()
          ]
        );
      }
      console.log('✓ Users migrated');
    }
    
    console.log('\n✓ Migration completed successfully!');
    
    // Only exit if run directly (not imported)
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('✗ Migration failed:', error);
    
    // Only exit if run directly (not imported)
    if (require.main === module) {
      process.exit(1);
    } else {
      // Re-throw if called from server startup
      throw error;
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };

