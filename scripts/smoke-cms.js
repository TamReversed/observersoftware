#!/usr/bin/env node
/**
 * Safety checks for the admin and site content features. Run against a running server:
 *   BASE=http://localhost:3000 ADMIN_USER=admin ADMIN_PASS=... node scripts/smoke-cms.js
 * Needs Node 20+. It restores the site content to the original text when it finishes.
 */
const totpLib = require('../services/totpService');
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


  console.log('\nOne-time code (Dashlane) sign-in');
  const TU = 'smoke-totp-' + Date.now().toString(36);
  const TP = 'Smoke-test-pass-9!';
  const mkUser = await admin.req('/api/auth/users', { method: 'POST', body: { username: TU, password: TP } });
  check('test user created', mkUser.status === 200, `status ${mkUser.status}`);
  const uid = ((await admin.req('/api/auth/users')).json || []).find((u) => u.username === TU);
  const dev = new Client();
  await dev.refreshCsrf();
  check('test user signs in with a password before codes are on', (await dev.req('/api/auth/login', { method: 'POST', body: { username: TU, password: TP } })).status === 200);
  await dev.refreshCsrf();
  const anonSetup = await anon.req('/api/auth/totp/setup', { method: 'POST', body: {} });
  check('setup needs a signed-in session', anonSetup.status === 401 || anonSetup.status === 403);
  const setup = await dev.req('/api/auth/totp/setup', { method: 'POST', body: {} });
  check('setup returns a key and QR code', setup.status === 200 && /^[A-Z2-7 ]{30,}$/.test(setup.json.secret) && /<svg/.test(setup.json.qrSvg) && /^otpauth:\/\/totp\//.test(setup.json.otpauthUrl));
  const key = setup.json.secret.replace(/\s/g, '');
  const badEnable = await dev.req('/api/auth/totp/enable', { method: 'POST', body: { code: '000000' } });
  check('wrong confirmation code does not turn it on', badEnable.status === 400);
  const cur = totpLib.stepAt();
  const code = (n) => totpLib.hotp(totpLib.base32Decode(key), cur + n);
  const enable = await dev.req('/api/auth/totp/enable', { method: 'POST', body: { code: code(0) } });
  const reEnable = await dev.req('/api/auth/totp/enable', { method: 'POST', body: { code: code(0) } });
  check('enable cannot overwrite codes that are already on', reEnable.status === 400);
  check('correct code turns it on and returns 8 recovery codes', enable.status === 200 && enable.json.recoveryCodes.length === 8);
  const recov = enable.json.recoveryCodes;
  check('recovery codes are not stored in readable form', !JSON.stringify((await admin.req('/api/admin/export')).json).includes(recov[0]));
  const pw = new Client(); await pw.refreshCsrf();
  const pwTry = await pw.req('/api/auth/login', { method: 'POST', body: { username: TU, password: TP } });
  const pwWrong = await (async () => { const c = new Client(); await c.refreshCsrf(); return c.req('/api/auth/login', { method: 'POST', body: { username: TU, password: 'definitely-wrong-pass' } }); })();
  check('password sign-in is refused for that account', pwTry.status === 401, `status ${pwTry.status}`);
  check('a correct password gets the same answer as a wrong one', pwTry.text === pwWrong.text);
  const wrong = new Client(); await wrong.refreshCsrf();
  const w1 = await wrong.req('/api/auth/totp/login', { method: 'POST', body: { username: TU, code: '123456' } });
  const w2 = await wrong.req('/api/auth/totp/login', { method: 'POST', body: { username: 'no-such-user-xyz', code: '123456' } });
  check('wrong code and unknown user give the same answer', w1.status === 401 && w2.status === 401 && w1.text === w2.text);
  const replay = await wrong.req('/api/auth/totp/login', { method: 'POST', body: { username: TU, code: code(0) } });
  check('the code used to turn it on cannot be reused', replay.status === 401);
  const good = new Client(); await good.refreshCsrf();
  const ok = await good.req('/api/auth/totp/login', { method: 'POST', body: { username: TU, code: code(1) } });
  check('next code signs in', ok.status === 200 && ok.json.success === true, `status ${ok.status}`);
  check('session is real', (await good.req('/api/auth/status')).json.authenticated === true && (await good.req('/api/auth/status')).json.hasTotp === true);
  const again = new Client(); await again.refreshCsrf();
  check('same code cannot sign in twice', (await again.req('/api/auth/totp/login', { method: 'POST', body: { username: TU, code: code(1) } })).status === 401);
  const farFuture = new Client(); await farFuture.refreshCsrf();
  check('a code far in the future is rejected', (await farFuture.req('/api/auth/totp/login', { method: 'POST', body: { username: TU, code: code(5) } })).status === 401);
  const rc = new Client(); await rc.refreshCsrf();
  const rc1 = await rc.req('/api/auth/totp/login', { method: 'POST', body: { username: TU, code: recov[0] } });
  check('a recovery code signs in', rc1.status === 200);
  const rc2 = new Client(); await rc2.refreshCsrf();
  check('a recovery code works only once', (await rc2.req('/api/auth/totp/login', { method: 'POST', body: { username: TU, code: recov[0] } })).status === 401);

  // parallel guessing must not beat the counter: of 12 simultaneous wrong guesses, only 5 may actually be tried
  const burst = await Promise.all(Array.from({ length: 12 }, async (_, i) => {
    const c = new Client(); await c.refreshCsrf();
    return c.req('/api/auth/totp/login', { method: 'POST', body: { username: TU, code: String(100000 + i * 7) } });
  }));
  const tried = burst.filter((r) => r.status === 401).length;
  const locked = burst.filter((r) => r.status === 429).length;
  check('12 parallel wrong guesses: the account locks on the 5th, so at most 4 are answered as wrong', tried <= 4 && locked >= 8, `tried ${tried}, locked ${locked}`);
  const lockedGood = new Client(); await lockedGood.refreshCsrf();
  const lockedTry = await lockedGood.req('/api/auth/totp/login', { method: 'POST', body: { username: TU, code: code(1) } });
  check('even the right code is refused while locked', lockedTry.status === 429 || lockedTry.status === 401);
  // unknown usernames lock exactly like real ones, so "locked" never confirms a name exists
  const ghost = 'ghost-' + Date.now().toString(36);
  const ghostRes = [];
  for (let i = 0; i < 7; i++) { const c = new Client(); await c.refreshCsrf(); ghostRes.push((await c.req('/api/auth/totp/login', { method: 'POST', body: { username: ghost, code: String(200000 + i) } })).status); }
  check('an unknown username locks on the 5th wrong try, just like a real account', ghostRes.slice(0, 4).every((x) => x === 401) && ghostRes.slice(4).every((x) => x === 429), ghostRes.join(','));
  check('the lock does not affect other accounts', (await (async () => { const c = new Client(); await c.refreshCsrf(); return c.req('/api/auth/login', { method: 'POST', body: { username: USER, password: PASS } }); })()).status === 200);

  // an admin can clear the account; then the password works again
  const reset = await admin.req(`/api/auth/users/${uid.id}/totp`, { method: 'DELETE', body: {} });
  check('admin can reset another account', reset.status === 200);
  const backIn = new Client(); await backIn.refreshCsrf();
  check('password sign-in works again after the reset', (await backIn.req('/api/auth/login', { method: 'POST', body: { username: TU, password: TP } })).status === 200);
  check('reset also cleared the lock', (await (async () => { const c = new Client(); await c.refreshCsrf(); return c.req('/api/auth/totp/login', { method: 'POST', body: { username: TU, code: '123456' } }); })()).status === 401);
  await admin.req(`/api/auth/users/${uid.id}`, { method: 'DELETE', body: {} });

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
