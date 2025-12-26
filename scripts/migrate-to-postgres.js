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
      const capabilitiesData = fs.readFileSync(config.paths.capabilitiesFile, 'utf8');
      if (!capabilitiesData || capabilitiesData.trim().length === 0) {
        console.log('Capabilities file exists but is empty, skipping...');
      } else {
        const capabilities = JSON.parse(capabilitiesData);
        console.log(`Migrating ${capabilities.length} capabilities...`);
        
        let migrated = 0;
        let skipped = 0;
        
        for (const cap of capabilities) {
          try {
            const result = await query(
              `INSERT INTO capabilities (id, title, description, long_description, features, screenshots, external_url, icon, "order", published, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
               ON CONFLICT (id) DO NOTHING
               RETURNING id`,
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
            
            if (result.rows.length > 0) {
              migrated++;
            } else {
              skipped++;
            }
          } catch (error) {
            console.error(`Error migrating capability ${cap.id}:`, error.message);
          }
        }
        
        console.log(`✓ Capabilities migrated: ${migrated} inserted, ${skipped} skipped (already exist)`);
      }
    } else {
      console.log('Capabilities file not found, skipping capabilities migration');
    }
    
    // Migrate work
    if (fs.existsSync(config.paths.workFile)) {
      const workData = fs.readFileSync(config.paths.workFile, 'utf8');
      if (!workData || workData.trim().length === 0) {
        console.log('Work file exists but is empty, skipping...');
      } else {
        const work = JSON.parse(workData);
        console.log(`Migrating ${work.length} work items...`);
        
        let migrated = 0;
        let skipped = 0;
        
        for (const item of work) {
          try {
            const result = await query(
              `INSERT INTO work (id, industry, problem, solution, tags, image, client, date, case_study_url, "order", published, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
               ON CONFLICT (id) DO NOTHING
               RETURNING id`,
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
            
            if (result.rows.length > 0) {
              migrated++;
            } else {
              skipped++;
            }
          } catch (error) {
            console.error(`Error migrating work item ${item.id}:`, error.message);
          }
        }
        
        console.log(`✓ Work items migrated: ${migrated} inserted, ${skipped} skipped (already exist)`);
      }
    } else {
      console.log('Work file not found, skipping work migration');
    }
    
    // Migrate posts
    if (fs.existsSync(config.paths.postsFile)) {
      const postsData = fs.readFileSync(config.paths.postsFile, 'utf8');
      if (!postsData || postsData.trim().length === 0) {
        console.log('Posts file exists but is empty, skipping...');
      } else {
        const posts = JSON.parse(postsData);
        console.log(`Migrating ${posts.length} posts...`);
        
        let migrated = 0;
        let skipped = 0;
        let errors = 0;
        
        for (const post of posts) {
          try {
            // Ensure required fields exist
            if (!post.id) {
              console.warn('Post missing id, skipping:', post.title || post.slug);
              errors++;
              continue;
            }
            if (!post.slug) {
              console.warn('Post missing slug, skipping:', post.title || post.id);
              errors++;
              continue;
            }
            if (!post.title) {
              console.warn('Post missing title, skipping:', post.slug || post.id);
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
            } else {
              skipped++;
            }
          } catch (error) {
            console.error(`Error migrating post ${post.slug || post.id}:`, error.message);
            errors++;
          }
        }
        
        console.log(`✓ Posts migrated: ${migrated} inserted, ${skipped} skipped (already exist), ${errors} errors`);
      }
    } else {
      console.log('Posts file not found, skipping posts migration');
    }
    
    // Migrate users
    if (fs.existsSync(config.paths.usersFile)) {
      const usersData = fs.readFileSync(config.paths.usersFile, 'utf8');
      if (!usersData || usersData.trim().length === 0) {
        console.log('Users file exists but is empty, skipping...');
      } else {
        const users = JSON.parse(usersData);
        console.log(`Migrating ${users.length} users...`);
        
        let migrated = 0;
        let skipped = 0;
        
        for (const user of users) {
          try {
            const result = await query(
              `INSERT INTO users (id, username, password, webauthn_credentials, created_at)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (username) DO NOTHING
               RETURNING id`,
              [
                user.id,
                user.username,
                user.password,
                JSON.stringify(user.webauthnCredentials || []),
                user.createdAt || new Date().toISOString()
              ]
            );
            
            if (result.rows.length > 0) {
              migrated++;
            } else {
              skipped++;
            }
          } catch (error) {
            console.error(`Error migrating user ${user.username}:`, error.message);
          }
        }
        
        console.log(`✓ Users migrated: ${migrated} inserted, ${skipped} skipped (already exist)`);
      }
    } else {
      console.log('Users file not found, skipping users migration');
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

