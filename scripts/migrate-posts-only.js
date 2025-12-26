/**
 * Migration script to migrate only posts from JSON to PostgreSQL
 * Use this if posts didn't migrate during initial migration
 */

require('dotenv').config();
const fs = require('fs');
const { query } = require('../services/database');
const config = require('../config');

async function migratePosts() {
  try {
    console.log('Starting posts migration from JSON to PostgreSQL...');
    
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.error('✗ DATABASE_URL not set. Cannot migrate to database.');
      process.exit(1);
    }
    
    // Migrate posts
    if (fs.existsSync(config.paths.postsFile)) {
      const postsData = fs.readFileSync(config.paths.postsFile, 'utf8');
      if (!postsData || postsData.trim().length === 0) {
        console.log('Posts file exists but is empty, nothing to migrate.');
        process.exit(0);
      }
      
      const posts = JSON.parse(postsData);
      console.log(`Found ${posts.length} posts to migrate...`);
      
      let migrated = 0;
      let skipped = 0;
      let errors = 0;
      
      for (const post of posts) {
        try {
          // Ensure required fields exist
          if (!post.id) {
            console.warn('⚠ Post missing id, skipping:', post.title || post.slug);
            errors++;
            continue;
          }
          if (!post.slug) {
            console.warn('⚠ Post missing slug, skipping:', post.title || post.id);
            errors++;
            continue;
          }
          if (!post.title) {
            console.warn('⚠ Post missing title, skipping:', post.slug || post.id);
            errors++;
            continue;
          }
          
          const result = await query(
            `INSERT INTO posts (id, slug, title, excerpt, category, content, author, published_at, updated_at, published)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (slug) DO NOTHING
             RETURNING id`,
            [
              post.id,
              post.slug,
              post.title,
              post.excerpt || '',
              post.category || '',
              post.content || '',
              post.author || 'admin',
              post.publishedAt || null,
              post.updatedAt || new Date().toISOString(),
              post.published || false
            ]
          );
          
          if (result.rows.length > 0) {
            migrated++;
            console.log(`  ✓ Migrated: ${post.slug}`);
          } else {
            skipped++;
            console.log(`  ⊘ Skipped (already exists): ${post.slug}`);
          }
        } catch (error) {
          console.error(`  ✗ Error migrating post ${post.slug || post.id}:`, error.message);
          errors++;
        }
      }
      
      console.log('\n✓ Posts migration completed!');
      console.log(`  - ${migrated} posts inserted`);
      console.log(`  - ${skipped} posts skipped (already exist)`);
      if (errors > 0) {
        console.log(`  - ${errors} posts had errors`);
      }
    } else {
      console.log('✗ Posts file not found at:', config.paths.postsFile);
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migratePosts();

