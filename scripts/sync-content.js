#!/usr/bin/env node
/**
 * Brings an EXISTING production database up to date with the redesign's content fixes.
 * The app only imports data/*.json into an empty database, so a live database keeps old rows.
 *
 * Fills gaps and removes invented figures; it never overwrites text you wrote yourself:
 *  - work: replaces a solution that still contains an invented statistic, fills a missing image, adds metrics
 *  - posts: fills a missing cover image, replaces em/en dashes in the body
 *  - capabilities (products): fills missing screenshots, replaces dashes in the long description
 *  - faqs: adds the starter questions only when the table is empty
 *
 * Usage:  node scripts/sync-content.js            (dry run, prints what would change)
 *         node scripts/sync-content.js --apply    (writes the changes)
 * Needs DATABASE_URL (e.g. `railway run node scripts/sync-content.js --apply`).
 */
require('./_use-public-db');
const fs = require('fs');
const path = require('path');
const { query, pool } = require('../services/database');

const apply = process.argv.includes('--apply');
const read = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', f), 'utf8'));
const dash = (t) => (typeof t === 'string' ? t.replace(/\s*[—–]\s*/g, ' - ') : t);
const hasStat = (t) => /\d+(\.\d+)?\s?%|\b\d+x\b|from \d+ to \d+/i.test(t || '');
let changes = 0;
const log = (msg) => { changes++; console.log(`${apply ? 'UPDATE' : 'would update'}: ${msg}`); };

async function run(sql, params) { if (apply) await query(sql, params); }

(async () => {
  if (!pool) { console.error('DATABASE_URL is not set.'); process.exit(1); }

  // work
  const work = (await query('SELECT id, industry, solution, image, metrics FROM work')).rows;
  for (const item of read('work.json')) {
    const row = work.find((w) => w.industry === item.industry);
    if (!row) continue;
    if (hasStat(row.solution) && row.solution !== item.solution) {
      log(`work "${item.industry}": remove invented statistic from solution`);
      await run('UPDATE work SET solution = $1 WHERE id = $2', [item.solution, row.id]);
    }
    if (!row.image && item.image) {
      log(`work "${item.industry}": set image`);
      await run('UPDATE work SET image = $1 WHERE id = $2', [item.image, row.id]);
    }
    if (row.metrics === null) await run("UPDATE work SET metrics = '[]'::jsonb WHERE id = $1", [row.id]);
  }

  // posts
  const posts = (await query('SELECT id, slug, content, cover_image FROM posts')).rows;
  const wanted = read('posts.json');
  for (const row of posts) {
    const item = wanted.find((p) => p.slug === row.slug);
    const content = dash(row.content);
    if (content !== row.content) {
      log(`post "${row.slug}": replace dashes in body`);
      await run('UPDATE posts SET content = $1 WHERE id = $2', [content, row.id]);
    }
    if (!row.cover_image && item && item.coverImage) {
      log(`post "${row.slug}": set cover image`);
      await run('UPDATE posts SET cover_image = $1 WHERE id = $2', [item.coverImage, row.id]);
    }
  }

  // products
  const caps = (await query('SELECT id, title, long_description, screenshots FROM capabilities')).rows;
  for (const item of read('capabilities.json')) {
    const row = caps.find((c) => c.title === item.title);
    if (!row) continue;
    const shots = Array.isArray(row.screenshots) ? row.screenshots : [];
    if (!shots.length) {
      log(`product "${item.title}": set screenshots`);
      await run('UPDATE capabilities SET screenshots = $1::jsonb WHERE id = $2', [JSON.stringify(item.screenshots), row.id]);
    }
    const long = dash(row.long_description);
    if (long !== row.long_description) {
      log(`product "${item.title}": replace dashes in description`);
      await run('UPDATE capabilities SET long_description = $1 WHERE id = $2', [long, row.id]);
    }
  }

  // faqs
  const faqCount = Number((await query('SELECT count(*) FROM faqs')).rows[0].count);
  if (faqCount === 0) {
    for (const f of read('faqs.json')) {
      log(`faq: add "${f.question}"`);
      await run('INSERT INTO faqs (question, answer, category, "order", published) VALUES ($1, $2, $3, $4, true)', [f.question, f.answer, f.category, f.order]);
    }
  }

  console.log(changes ? `\n${changes} change(s) ${apply ? 'applied' : 'found. Re-run with --apply to write them.'}` : 'Nothing to change.');
  await pool.end();
})().catch((err) => { console.error(err); process.exit(1); });
