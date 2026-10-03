const express = require('express');
const router = express.Router();
const config = require('../config');
const content = require('../services/contentService');
const siteContent = require('../services/siteContentService');
const { asyncHandler } = require('../middleware/errorHandler');

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '');

// Locals every page needs
router.use(asyncHandler(async (req, res, next) => {
  const settings = await content.getSettings();
  // ?preview=1 shows unpublished changes, but only to a signed-in admin
  const preview = req.query.preview === '1' && !!(req.session && req.session.userId);
  if (preview) {
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');
  }
  res.locals.preview = preview;
  res.locals.site = {
    url: config.siteUrl, social: settings.social, legal: settings, year: new Date().getFullYear(),
    content: await siteContent.resolved({ draft: preview })
  };
  res.locals.path = req.path;
  res.locals.fmtDate = fmtDate;
  next();
}));

const orgLd = (site) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Observer',
  url: site.url,
  logo: `${site.url}/icon-512.png`,
  description: 'Observer is a software studio that watches real workflows, finds friction and removes steps.',
  parentOrganization: { '@type': 'Organization', name: 'Techademy LLC' },
  sameAs: [site.social.linkedin, site.social.github].filter(Boolean)
});

const crumbs = (site, items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: site.url + p }))
});

router.get('/', asyncHandler(async (req, res) => {
  const [work, products, blog, testimonials] = await Promise.all([
    content.getWork(), content.getProducts(), content.getPosts({ limit: 3 }), content.getTestimonials()
  ]);
  const c = res.locals.site.content;
  const team = [
    c.images.team1 || (content.isPlaceholder('team/team-01.jpg') ? '' : '/assets/team/team-01.jpg'),
    c.images.team2 || (content.isPlaceholder('team/team-02.jpg') ? '' : '/assets/team/team-02.jpg')
  ].filter(Boolean);
  res.render('home', {
    title: c.seo.homeTitle,
    description: c.seo.homeDescription,
    c, founderImage: c.images.founder || '/assets/team/founder.jpg', team,
    ogImage: '/assets/og/og-home.jpg',
    jsonLd: [orgLd(res.locals.site)],
    navOver: true,
    work: work.slice(0, 5), products, posts: blog.posts, testimonials, isPlaceholder: content.isPlaceholder
  });
}));

router.get('/work', asyncHandler(async (req, res) => {
  const all = await content.getWork();
  const sectors = [...new Set(all.map((w) => w.tags[0]).filter(Boolean))];
  const sector = sectors.includes(req.query.sector) ? req.query.sector : '';
  res.render('work', {
    title: 'Work | Observer',
    description: 'Selected engagements where Observer removed steps from complex workflows, platforms and teams.',
    ogImage: '/assets/og/og-work.jpg',
    jsonLd: [crumbs(res.locals.site, [['Home', '/'], ['Work', '/work']])],
    items: sector ? all.filter((w) => w.tags[0] === sector) : all, sectors, sector
  });
}));

router.get('/products', asyncHandler(async (req, res) => {
  res.render('products', {
    title: 'Products | Observer',
    description: 'DataDragon and TableFlow: systems that fit the work, built from the same habit of watching real workflows.',
    ogImage: '/assets/og/og-products.jpg',
    jsonLd: [crumbs(res.locals.site, [['Home', '/'], ['Products', '/products']])],
    products: await content.getProducts()
  });
}));

router.get('/products/:slug', asyncHandler(async (req, res, next) => {
  const product = await content.getProduct(req.params.slug);
  if (!product) return next();
  const { renderMarkdown } = require('../services/markdownService');
  res.render('product', {
    title: `${product.title} | Observer`,
    description: product.description,
    ogImage: '/assets/og/og-products.jpg',
    jsonLd: [
      crumbs(res.locals.site, [['Home', '/'], ['Products', '/products'], [product.title, `/products/${product.slug}`]]),
      { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: product.title, description: product.description,
        applicationCategory: 'BusinessApplication', publisher: { '@type': 'Organization', name: 'Observer' } }
    ],
    product, longHtml: renderMarkdown(product.longDescription || ''), isPlaceholder: content.isPlaceholder
  });
}));

router.get('/blog', asyncHandler(async (req, res) => {
  const category = content.categories.some((c) => c.slug === req.query.category) ? req.query.category : '';
  const q = String(req.query.q || '').slice(0, 100);
  const result = await content.getPosts({ category, q, page: parseInt(req.query.page, 10) || 1 });
  res.render('blog', {
    title: 'Insights | Observer',
    description: 'Notes on software, design and building systems that work the way people actually do.',
    ogImage: '/assets/og/og-blog.jpg',
    jsonLd: [crumbs(res.locals.site, [['Home', '/'], ['Insights', '/blog']])],
    ...result, category, q, categories: content.categories, noindex: !!(q || req.query.page > 1)
  });
}));

router.get('/blog/:slug', asyncHandler(async (req, res, next) => {
  const post = await content.getPost(req.params.slug, { preview: res.locals.preview });
  if (!post) return next();
  const site = res.locals.site;
  const cover = post.coverImage || '';
  res.render('post', {
    title: `${post.title} | Observer`,
    description: post.excerpt || post.title,
    ogImage: cover || '/assets/og/og-blog.jpg',
    ogType: 'article',
    jsonLd: [
      crumbs(site, [['Home', '/'], ['Insights', '/blog'], [post.title, `/blog/${post.slug}`]]),
      { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.excerpt,
        datePublished: post.publishedAt, dateModified: post.updatedAt || post.publishedAt,
        image: site.url + (cover || '/assets/og/og-blog.jpg'),
        author: { '@type': 'Organization', name: 'Observer' }, publisher: { '@type': 'Organization', name: 'Observer' },
        mainEntityOfPage: `${site.url}/blog/${post.slug}` }
    ],
    post
  });
}));

router.get('/contact', asyncHandler(async (req, res) => {
  res.render('contact', {
    title: 'Start a conversation | Observer',
    description: 'Send a short note with the workflow, the constraints and where people get stuck. Observer replies with a simple next step.',
    ogImage: '/assets/og/og-contact.jpg',
    jsonLd: [crumbs(res.locals.site, [['Home', '/'], ['Contact', '/contact']])],
    faqs: await content.getFaqs()
  });
}));

['privacy', 'terms'].forEach((name) => {
  router.get(`/${name}`, (req, res) => {
    const privacy = name === 'privacy';
    res.render('legal', {
      title: `${privacy ? 'Privacy' : 'Terms'} | Observer`,
      description: privacy ? 'How Observer handles the information you send through this site.' : 'The terms that apply when you use the Observer website.',
      ogImage: '/assets/og/og-home.jpg', doc: name
    });
  });
});

module.exports = router;
