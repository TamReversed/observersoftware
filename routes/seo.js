const express = require('express');
const router = express.Router();
const config = require('../config');
const postsStore = require('../services/postsStore');
const { asyncHandler } = require('../middleware/errorHandler');

const STATIC_PAGES = ['/', '/work', '/products', '/blog', '/contact', '/privacy', '/terms'];

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    `User-agent: *\nDisallow: /admin\nDisallow: /observe\nDisallow: /api/\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`
  );
});

// Where security researchers can report a problem (RFC 9116)
router.get('/.well-known/security.txt', (req, res) => {
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  res.type('text/plain').send(
    `Contact: ${config.siteUrl}/contact\nExpires: ${expires}\nPreferred-Languages: en\nCanonical: ${config.siteUrl}/.well-known/security.txt\n`
  );
});

router.get('/sitemap.xml', asyncHandler(async (req, res) => {
  const posts = await postsStore.findAll((p) => p.published);
  const urls = STATIC_PAGES.map((p) => `  <url><loc>${escapeXml(config.siteUrl + (p === '/' ? '' : p))}</loc></url>`);

  for (const post of posts) {
    const lastmod = post.updatedAt || post.publishedAt;
    urls.push(
      `  <url><loc>${escapeXml(`${config.siteUrl}/blog/${post.slug}`)}</loc>` +
      (lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : '') +
      '</url>'
    );
  }

  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
  );
}));

module.exports = router;
