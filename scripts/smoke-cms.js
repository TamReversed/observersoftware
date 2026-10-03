#!/usr/bin/env node
/**
 * Safety checks for the admin and site content features. Run against a running server:
 *   BASE=http://localhost:3000 ADMIN_USER=admin ADMIN_PASS=... node scripts/smoke-cms.js
 * Needs Node 20+. It restores the site content to the original text when it finishes.
 */
const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/$/, '');
const USER = process.env.ADMIN_USER || 'admin';
const PASS = process.env.ADMIN_PASS || 'changeme123';

let passed = 0;
const failures = [];
const check = (name, ok, detail) => {
  if (ok) { passed++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name}${detail ? ' -> ' + detail : ''}`); }
};

class Client {
  constructor() { this.cookies = {}; this.csrf = ''; }
  async req(path, { method = 'GET', body, csrf = true, headers = {} } = {}) {
    const h = { ...headers };
    const cookie = Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    if (cookie) h.Cookie = cookie;
    if (body !== undefined) h['Content-Type'] = 'application/json';
    if (csrf && this.csrf && method !== 'GET') h['X-CSRF-Token'] = this.csrf;
    const res = await fetch(BASE + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined, redirect: 'manual' });
    (res.headers.getSetCookie ? res.headers.getSetCookie() : []).forEach((c) => {
      const [pair] = c.split(';'); const i = pair.indexOf('=');
      this.cookies[pair.slice(0, i)] = pair.slice(i + 1);
    });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { status: res.status, text, json, headers: res.headers };
  }
  async refreshCsrf() { this.csrf = (await this.req('/api/auth/csrf-token')).json.csrfToken; }
}

(async () => {
  const anon = new Client();
  const admin = new Client();

  console.log('\nAnonymous visitors are locked out of admin routes');
  await anon.refreshCsrf();
  for (const [m, p] of [['GET', '/api/admin/site-content'], ['PUT', '/api/admin/site-content/draft'], ['POST', '/api/admin/site-content/publish'],
    ['POST', '/api/admin/site-content/discard'], ['GET', '/api/admin/export'], ['GET', '/api/admin/posts'], ['GET', '/api/admin/messages'],
    ['GET', '/api/admin/settings'], ['PUT', '/api/admin/settings'], ['POST', '/api/upload/screenshot'], ['GET', '/api/auth/users']]) {
    const r = await anon.req(p, { method: m, body: m === 'GET' ? undefined : {} });
    check(`${m} ${p} rejected (${r.status})`, r.status === 401 || r.status === 403);
  }
  const pub = await anon.req('/api/settings');
  check('public /api/settings never exposes drafts or history', pub.status === 200 && !/site_content/.test(pub.text));
  const prevAnon = await anon.req('/?preview=1');
  check('preview flag ignored without a login', prevAnon.status === 200 && !/preview-bar/.test(prevAnon.text));

  console.log('\nSigning in');
  await admin.refreshCsrf();
  const login = await admin.req('/api/auth/login', { method: 'POST', body: { username: USER, password: PASS } });
  check('password sign-in works', login.status === 200 && login.json && login.json.success, `status ${login.status}`);
  if (login.status !== 200) { console.log('\nCannot continue without a session.'); process.exit(1); }
  await admin.refreshCsrf();

  console.log('\nCSRF protection');
  const noCsrf = await admin.req('/api/admin/site-content/draft', { method: 'PUT', body: { content: {} }, csrf: false });
  check('change without CSRF token is blocked', noCsrf.status === 403, `status ${noCsrf.status}`);

  console.log('\nValidation');
  const state = await admin.req('/api/admin/site-content');
  check('editor data loads with field definitions', state.status === 200 && state.json.fields.length > 20);
  const tooLong = await admin.req('/api/admin/site-content/draft', { method: 'PUT', body: { content: { hero: { c1Title: 'x'.repeat(500) } } } });
  check('over-length text rejected', tooLong.status === 400);
  const badImg = await admin.req('/api/admin/site-content/draft', { method: 'PUT', body: { content: { images: { founder: 'https://evil.example/x.jpg' } } } });
  check('external image address rejected', badImg.status === 400);
  const badImg2 = await admin.req('/api/admin/site-content/draft', { method: 'PUT', body: { content: { images: { founder: '/uploads/../../etc/passwd' } } } });
  check('path-traversal image rejected', badImg2.status === 400);
  const notObj = await admin.req('/api/admin/site-content/draft', { method: 'PUT', body: { content: 'nope' } });
  check('non-object content rejected', notObj.status === 400);

  console.log('\nDraft, preview and publish');
  const marker = 'Smoke test headline <script>alert(1)</script>';
  const save = await admin.req('/api/admin/site-content/draft', { method: 'PUT', body: { content: { hero: { c1Title: marker + ' — dash' }, evil: { x: 1 } } } });
  check('draft saves', save.status === 200 && save.json.unpublished === true, `status ${save.status}`);
  check('em dash converted, unknown fields dropped', save.json && save.json.draft.hero.c1Title.includes(' - dash') && !save.json.draft.evil);
  const live1 = await anon.req('/');
  check('draft is NOT visible to the public', !live1.text.includes('Smoke test headline'));
  const prev = await admin.req('/?preview=1');
  check('admin preview shows the draft', prev.text.includes('Smoke test headline') && /preview-bar/.test(prev.text));
  check('markup in content is escaped (no script injection)', !prev.text.includes('<script>alert(1)</script>') && prev.text.includes('&lt;script&gt;'));
  check('preview is not cacheable or indexable', /no-store/.test(prev.headers.get('cache-control') || '') && /noindex/.test(prev.headers.get('x-robots-tag') || '') && /name="robots" content="noindex"/.test(prev.text));
  const pubRes = await admin.req('/api/admin/site-content/publish', { method: 'POST', body: {} });
  check('publish works', pubRes.status === 200 && pubRes.json.unpublished === false, `status ${pubRes.status}`);
  const live2 = await anon.req('/');
  check('published text is live and escaped', live2.text.includes('Smoke test headline') && !live2.text.includes('<script>alert(1)</script>'));
  const status2 = await admin.req('/api/admin/site-content');
  check('a restore point was kept', status2.json.history.length >= 1);

  console.log('\nHistory and restore');
  const first = status2.json.history[0];
  const restore = await admin.req(`/api/admin/site-content/restore/${first.id}`, { method: 'POST', body: {} });
  check('restore to draft works', restore.status === 200 && restore.json.unpublished === true);
  const badRestore = await admin.req('/api/admin/site-content/restore/not-a-uuid', { method: 'POST', body: {} });
  check('bad version id rejected', badRestore.status === 400);
  const discard = await admin.req('/api/admin/site-content/discard', { method: 'POST', body: {} });
  check('discard returns draft to live', discard.status === 200 && discard.json.unpublished === false);


  console.log('\nSettings (social links)');
  const badLink = await admin.req('/api/admin/settings', { method: 'PUT', body: { settings: [{ key: 'social_links', value: { linkedin: 'javascript:alert(1)' } }] } });
  check('javascript: link rejected', badLink.status === 400);
  const unknownKey = await admin.req('/api/admin/settings', { method: 'PUT', body: { settings: [{ key: 'site_content_live', value: { hero: { c1Title: 'sneaky' } } }] } });
  check('settings API cannot overwrite site content directly', unknownKey.status === 400);
  const goodLink = await admin.req('/api/admin/settings', { method: 'PUT', body: { settings: [{ key: 'social_links', value: { linkedin: 'https://linkedin.com/company/smoke-test' } }] } });
  check('valid link saves', goodLink.status === 200);
  const home = await anon.req('/');
  check('footer shows the saved link', home.text.includes('https://linkedin.com/company/smoke-test'));
  await admin.req('/api/admin/settings', { method: 'PUT', body: { settings: [{ key: 'social_links', value: { linkedin: '' } }] } });
  const home2 = await anon.req('/');
  check('footer link removed again', !home2.text.includes('smoke-test'));

  console.log('\nPosts and work: images and drafts');
  const extImg = await admin.req('/api/admin/posts', { method: 'POST', body: { title: 'Smoke test post', content: 'Hello', coverImage: 'https://evil.example/x.png', published: false } });
  check('post with external cover image rejected', extImg.status === 400);
  const mk = await admin.req('/api/admin/posts', { method: 'POST', body: { title: 'Smoke test post', content: 'Hello **world**', coverImage: '/assets/blog/welcome-to-observer.webp', published: false } });
  check('draft post created with local cover', mk.status === 200 && mk.json.coverImage === '/assets/blog/welcome-to-observer.webp', `status ${mk.status}`);
  const slug = mk.json && mk.json.slug;
  const anonDraft = await anon.req(`/blog/${slug}`);
  check('unpublished post is a 404 for the public', anonDraft.status === 404);
  const anonPrev = await anon.req(`/blog/${slug}?preview=1`);
  check('unpublished post stays hidden even with ?preview=1 and no login', anonPrev.status === 404);
  const adminPrev = await admin.req(`/blog/${slug}?preview=1`);
  check('admin can preview the unpublished post', adminPrev.status === 200 && adminPrev.text.includes('Smoke test post') && /preview-bar/.test(adminPrev.text));
  const sitemap = await anon.req('/sitemap.xml');
  check('unpublished post is not in the sitemap', !sitemap.text.includes(slug));
  if (slug) await admin.req(`/api/admin/posts/${slug}`, { method: 'DELETE', body: {} });
  const works = await admin.req('/api/admin/work');
  const w = works.json && works.json[0];
  if (w) {
    const body = { industry: w.industry, problem: w.problem, solution: w.solution, tags: w.tags, published: w.published };
    const wBad = await admin.req(`/api/admin/work/${w.id}`, { method: 'PUT', body: { ...body, image: 'https://evil.example/x.png' } });
    check('work item with external image rejected', wBad.status === 400);
    const wOk = await admin.req(`/api/admin/work/${w.id}`, { method: 'PUT', body: { ...body, image: w.image || '' } });
    check('work item saves with its own image', wOk.status === 200);
  }

  console.log('\nBackup');
  const exp = await admin.req('/api/admin/export');
  check('backup downloads', exp.status === 200 && exp.json && Array.isArray(exp.json.posts));
  check('backup contains no users, messages or password hashes', exp.json && !exp.json.users && !exp.json.messages && !/\$2[aby]\$\d\d\$/.test(exp.text));

  console.log('\nCleanup (restoring original site text)');
  await admin.req('/api/admin/site-content/draft', { method: 'PUT', body: { content: {} } });
  const back = await admin.req('/api/admin/site-content/publish', { method: 'POST', body: {} });
  const live3 = await anon.req('/');
  check('original text restored', back.status === 200 && !live3.text.includes('Smoke test headline'));
  await admin.req('/api/auth/logout', { method: 'POST', body: {} });

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log('Failed:\n - ' + failures.join('\n - ')); process.exit(1); }
})().catch((e) => { console.error('Test run crashed:', e); process.exit(1); });
