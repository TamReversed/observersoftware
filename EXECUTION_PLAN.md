# Execution plan: Observer website hardening

This plan is self-contained. You do not need any other document to carry it out. Finding IDs (SEC-01 and so on) refer to `REVIEW_REPORT.md` and are listed only so each task can be traced.

## Goal

Close the code-level findings from the October 2026 review of the Observer website: account-security gaps, header and policy tightening, removal of retired endpoints, a few public-page fixes, and admin dashboard usability and accessibility. Every decision is already made. Apply each change exactly as written.

## Project facts

- **Repo:** `/Users/mat/Documents/1. Development/000. Observer v2` (GitHub `TamReversed/observersoftware`). Start from `main`.
- **Stack:** Node (>= 20), Express 4, EJS views in `views/`, static files in `public/`. Storage is Postgres when `DATABASE_URL` is set and JSON files in `data/` otherwise. Local work uses JSON files.
- **Layout:** `server.js` (app setup), `routes/*.js`, `controllers/*.js`, `middleware/*.js`, `services/*.js`, `public/admin/*.html`, `public/scripts/*.js`, `public/styles/*.css`.
- **Local test account:** username `admin`, password `changeme123` (the default in `.env.example`; local only).

## How to run and verify locally

Start the server for testing (leave it running in the background):

```bash
DISABLE_RATE_LIMIT=1 PORT=3111 node server.js
```

Run the two test tools against it:

```bash
BASE=http://localhost:3111 node scripts/smoke-cms.js
```

```bash
node scripts/audit-routes.js
```

Baseline before any change: the smoke suite ends with `111 passed, 0 failed`, and the audit ends with `No admin route is missing login or CSRF protection.`

After every test run, restore the data files the tests touch:

```bash
git checkout data/ && echo "[]" > data/messages.json
```

Restart the server after changing any file outside `public/`.

## Git workflow

1. `git checkout main && git pull && git checkout -b review/hardening`
2. One commit per batch, message `Review hardening: <batch name>`.
3. Push and open one pull request against `main`. Do not merge it and do not deploy.

## Do not touch

- `public/assets/**` (images, film frames, fonts, icons)
- `refs/`, `node_modules/`, `.claude/`
- `database/schema.sql` (no schema changes are needed)
- `scripts/build-*.py`, `scripts/sync-content.js`, `scripts/migrate-to-postgres.js`, `scripts/set-password.js`, `scripts/reset-2fa.js`
- `docs/design-brief.md`, `docs/REDESIGN_PLAN.md`, `REVIEW_REPORT.md`
- Visible copy in `views/*.ejs`, except the one line added in task C3
- `data/` contents (restore them after tests, never commit changes there)
- `package-lock.json`, except through the `npm install` command in task B4

## Batch order and dependencies

| Batch | Tasks | Order inside the batch | Depends on |
|---|---|---|---|
| A. Sign-in and sessions | A1, A2, A3, A4 | Sequential (all edit `controllers/authController.js`) | none |
| B. Server, headers, routes | B1, B2, B3, B4, B5, B6 | Sequential (several edit `server.js`) | none |
| C. Public pages | C1, C2, C3, C4 | C1 then C2 (both edit `site.css`); C3 and C4 are independent | none |
| D. Admin dashboard | D1, D2, D3, D4, D5 | Sequential (shared files) | none |
| E. Film | E1 | single task | none |
| F. Tests and docs | F1, F2 | F1 then F2 | A, B, C, D, E all done |

Batches A, B, C, D and E are independent of each other and can run in parallel. Batch F runs last.

---

## Batch A: Sign-in and sessions

### A1. End sessions when sign-in details change (closes SEC-01)

**Why:** a password reset currently leaves old sessions signed in for 24 hours. A fingerprint of the account's secrets, stored in the session and checked on every request, ends them immediately. Do not add a database column for this.

**Files:** `middleware/auth.js`, `controllers/authController.js`, `controllers/totpController.js`.

**Changes:**

1. `middleware/auth.js`. Add `const crypto = require('crypto');` at the top with the other requires. Add this function above `sessionUser`:

   ```js
   // Changes whenever the account's password or one-time-code setup changes, which ends every older session
   function authFingerprint(user) {
     return crypto.createHash('sha256')
       .update('fp1|' + (user.password || '') + '|' + (user.totpEnabled ? String(user.totpSecret || '') : ''))
       .digest('hex').slice(0, 32);
   }
   ```

   Replace the whole `sessionUser` function with:

   ```js
   async function sessionUser(req) {
     if (!req.session || !req.session.userId) return null;
     const user = await usersService.findById(req.session.userId);
     if (!user) return null;
     if (req.session.authFp !== authFingerprint(user)) return null; // sign-in details changed since this session began
     return user;
   }
   ```

   Change the export line to `module.exports = { requireAuth, requireAdmin, roleOf, sessionUser, authFingerprint };`

2. `controllers/authController.js`.
   - Change the import line to `const { roleOf, sessionUser, authFingerprint } = require('../middleware/auth');`
   - In `establishSession`, add `req.session.authFp = authFingerprint(user);` directly after `req.session.username = user.username;`.
   - In `getStatus`, replace the body of the `try` block with:

     ```js
     const user = await sessionUser(req);
     if (user) {
       return res.json({
         authenticated: true,
         id: user.id,
         username: user.username,
         role: roleOf(user),
         hasPasskey: !!(user.webauthnCredentials && user.webauthnCredentials.length > 0),
         hasTotp: !!user.totpEnabled
       });
     }
     res.json({ authenticated: false });
     ```

   - In `startWebAuthnRegistration`, replace `user = await usersService.findById(req.session.userId);` with `user = await sessionUser(req);`.
   - In `resetPassword`, directly after `await usersService.updateById(id, { password: hashedPassword });` add:

     ```js
     // An admin changing their own password stays signed in on this session only
     if (id === req.session.userId) req.session.authFp = authFingerprint(await usersService.findById(id));
     ```

3. `controllers/totpController.js`.
   - Add `const { authFingerprint } = require('../middleware/auth');` with the other requires.
   - In `enable`, directly after `delete req.session.pendingTotp;` (the one that follows the `updateById` call) add `req.session.authFp = authFingerprint(await usersService.findById(user.id));`.
   - In `disable`, directly before `res.json({ success: true });` add `req.session.authFp = authFingerprint(await usersService.findById(req.session.userId));`.

**Acceptance criteria:**
- Signing in works with password and with one-time code.
- After an admin resets another account's password, that account's existing session gets 401 on `/api/admin/posts`.
- Turning one-time codes on or off in your own session leaves that session signed in.

**Verification:** restart the server and run the smoke suite. Expected: `0 failed`. Task F1 adds a dedicated check for the 401.

**Risk and rollback:** every session created before this deploy has no fingerprint, so every signed-in person is signed out once and signs in again. If sign-in loops back to the sign-in page, the fingerprint is not being set in `establishSession`. Rollback: `git revert` the batch A commit.

### A2. Stop revealing usernames (closes SEC-02)

**Why:** usernames leak through the public posts API, through different answers from passkey start, and through sign-in timing.

**Files:** `controllers/postsController.js`, `controllers/authController.js`, `public/scripts/admin-login.js`.

**Changes:**

1. `controllers/postsController.js`.
   - In `getPosts`, inside the `.map(p => ({ ... }))` that builds `paginatedPosts`, add `author: undefined,` on the line before `content: undefined`.
   - In `getPostBySlug`, in the final `res.json({ ...post, ... })`, add `author: undefined,` directly after `...post,`.

2. `controllers/authController.js`.
   - Directly below the `LOCKOUT_DURATION` constant add:

     ```js
     // Compared against when the username does not exist, so the response takes as long as a real check
     const DUMMY_HASH = bcrypt.hashSync('observer-no-such-account', 12);
     ```

   - In `login`, replace

     ```js
     if (!user) {
       recordFailedLogin(key);
       return res.status(401).json({ error: 'Invalid credentials' });
     }

     const valid = await bcrypt.compare(password, user.password);
     if (!valid) {
     ```

     with

     ```js
     const valid = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
     if (!user || !valid) {
     ```

     (the two lines that follow, `recordFailedLogin(key);` and the 401 return, stay as they are).
   - In `startWebAuthnRegistration`, replace `const valid = user ? await bcrypt.compare(password, user.password) : false;` with:

     ```js
     const matches = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
     const valid = !!user && matches;
     ```

   - In `startWebAuthnLogin`, replace the two blocks

     ```js
     if (!user) {
       return res.status(401).json({ error: 'Invalid credentials' });
     }

     if (user.totpEnabled || !user.webauthnCredentials || user.webauthnCredentials.length === 0) {
       return res.status(400).json({ error: 'No passkey registered for this user' });
     }
     ```

     with

     ```js
     // One identical answer for "no such account", "no passkey" and "uses one-time codes"
     if (!user || user.totpEnabled || !user.webauthnCredentials || user.webauthnCredentials.length === 0) {
       return res.status(400).json({ error: 'Passkey sign-in is not available for this account.' });
     }
     ```

3. `public/scripts/admin-login.js`, in `withPasskey`. Replace the expression

   ```js
   s.j.error === 'No passkey registered for this user' ? 'No passkey is set up for that username. Use your password, or add a passkey after signing in.' : "Couldn't start passkey sign-in."
   ```

   with

   ```js
   s.status === 400 ? "Passkey sign-in isn't available for that username. Use your password or one-time code, or add a passkey after signing in." : "Couldn't start passkey sign-in."
   ```

**Acceptance criteria:**
- `GET /api/posts` and `GET /api/posts/<slug>` contain no `author` key.
- Passkey start returns the same status and body for an unknown username and for `admin`.
- Password sign-in with an unknown username takes about as long as with `admin` and a wrong password (both above 100 ms).

**Verification:**

```bash
curl -s localhost:3111/api/posts | grep -c '"author"'
```

Expected output: `0`.

```bash
cd /tmp && rm -f cj && T=$(curl -s -c cj localhost:3111/api/auth/csrf-token | python3 -c "import sys,json;print(json.load(sys.stdin)['csrfToken'])") && for u in no-such-user-zz admin; do curl -s -b cj -o /dev/null -w "$u %{http_code} %{time_total}s\n" -X POST -H "Content-Type: application/json" -H "X-CSRF-Token: $T" -d "{\"username\":\"$u\",\"password\":\"wrong-password-1\"}" localhost:3111/api/auth/login; done
```

Expected: both lines show `401` and a time above `0.1`.

**Risk and rollback:** server start takes about a quarter of a second longer (one hash at load). Revert the batch commit to roll back.

### A3. Cap password guesses per username across all addresses (closes SEC-03)

**Why:** the current lock is per network address only. A cap per username stops guessing from many addresses. The existing per-address lock stays so honest typos are still forgiven quickly.

**File:** `controllers/authController.js`.

**Changes:**

1. Below `const LOCKOUT_DURATION = ...` add `const USER_MAX_FAILED = 20; // across all addresses, per username`.
2. Below `lockoutKey` add:

   ```js
   function userKey(username) {
     return `user|${String(username || '').toLowerCase()}`;
   }
   ```

3. Change `isAccountLocked` to take a limit. Replace its first line `function isAccountLocked(key) {` with `function isAccountLocked(key, max = MAX_FAILED_ATTEMPTS) {` and replace `if (record.attempts >= MAX_FAILED_ATTEMPTS) {` with `if (record.attempts >= max) {`.
4. In `recordFailedLogin`, replace `const record = failedLogins.get(key) || { attempts: 0, lastAttempt: 0 };` with:

   ```js
   let record = failedLogins.get(key) || { attempts: 0, lastAttempt: 0 };
   if (Date.now() - record.lastAttempt > LOCKOUT_DURATION) record = { attempts: 0, lastAttempt: 0 }; // old failures no longer count
   ```

5. In `login`:
   - After `const key = lockoutKey(req, username);` add `const ukey = userKey(username);`.
   - Replace `if (isAccountLocked(key)) {` with `if (isAccountLocked(key) || isAccountLocked(ukey, USER_MAX_FAILED)) {`.
   - In that block's message, replace both `lockMinutesLeft(key)` calls with `lockMinutesLeft(isAccountLocked(key) ? key : ukey)`.
   - After each `recordFailedLogin(key);` inside `login` (there are two after task A2) add `recordFailedLogin(ukey);`.
   - After `clearFailedLogins(key);` add `clearFailedLogins(ukey);`.

**Acceptance criteria:** the smoke suite's existing lockout checks still pass (five wrong passwords lock an account from one address; other accounts are unaffected).

**Verification:** restart, run the smoke suite. Expected `0 failed`.

**Risk and rollback:** someone who knows a username can lock its password sign-in for 15 minutes with 20 wrong tries. One-time-code and passkey sign-in are unaffected. Revert the batch commit to roll back.

### A4. Reject wrong-typed input cleanly (closes SEC-05)

**Why:** objects and arrays where text is expected currently cause 500 errors.

**Files:** `middleware/validation.js`, `controllers/authController.js`, `controllers/postsController.js`.

**Changes:**

1. `middleware/validation.js`, in `validateLogin`. Insert `.isString().withMessage('Username is required').bail()` directly after `body('username')`, and `.isString().withMessage('Password is required').bail()` directly after `body('password')`.
2. `controllers/authController.js`.
   - `resetPassword`: replace `if (!password) {` with `if (typeof password !== 'string' || !password) {`.
   - `startWebAuthnRegistration`: replace `if (!username || !password) {` with `if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {`.
   - `startWebAuthnLogin`: replace `if (!username) {` with `if (typeof username !== 'string' || !username) {`.
3. `controllers/postsController.js`, in `getPosts`. Replace the first three lines of the `try` block (the destructuring of `req.query` and the two `parseInt` lines) with:

   ```js
   const search = typeof req.query.search === 'string' ? req.query.search.slice(0, 100) : '';
   const category = typeof req.query.category === 'string' ? req.query.category : '';
   const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
   const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 8));
   ```

   In the search filter in the same function, replace `p.excerpt.toLowerCase()` with `(p.excerpt || '').toLowerCase()` and `p.content.toLowerCase()` with `(p.content || '').toLowerCase()`.

**Acceptance criteria:** a JSON object as the password returns 400; `GET /api/posts?search[]=x` returns 200.

**Verification:**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "localhost:3111/api/posts?search[]=x&limit=99999"
```

Expected: `200`.

```bash
cd /tmp && rm -f cj && T=$(curl -s -c cj localhost:3111/api/auth/csrf-token | python3 -c "import sys,json;print(json.load(sys.stdin)['csrfToken'])") && curl -s -b cj -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" -H "X-CSRF-Token: $T" -d '{"username":"admin","password":{"a":1}}' localhost:3111/api/auth/login
```

Expected: `400`.

**Risk and rollback:** none expected. Revert the batch commit to roll back.

---

## Batch B: Server, headers, routes

### B1. Cache and browser-permission headers; constant-time token check (closes SEC-06, SEC-07 in part, SEC-10 in part)

**Files:** `server.js`, `middleware/csrf.js`.

**Changes:**

1. `server.js`, inside the `helmet({ ... })` options object, add this property after `hsts: ...` (add the comma): `xFrameOptions: { action: 'deny' }`.
2. `server.js`, directly after the closing `}));` of the `app.use(helmet(...))` call, add:

   ```js
   // The site uses none of these browser features
   app.use((req, res, next) => {
     res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()');
     next();
   });
   ```

3. `server.js`, directly above the line `// API routes (CSRF validation applied per route)`, add:

   ```js
   // Signed-in responses must never be kept in a browser or proxy cache
   app.use(['/api/admin', '/api/auth', '/api/upload'], (req, res, next) => {
     res.setHeader('Cache-Control', 'no-store');
     next();
   });
   ```

4. `middleware/csrf.js`. Add `const crypto = require('crypto');` at the top. Above `validateCsrfToken` add:

   ```js
   const sameToken = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length
     && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
   ```

   Replace `if (!token || !sessionToken || token !== sessionToken) {` with `if (!sameToken(token, sessionToken)) {`.

**Acceptance criteria:** the three headers below are present; the smoke suite passes.

**Verification:**

```bash
curl -sI localhost:3111/ | grep -iE "^(permissions-policy|x-frame-options):"
```

Expected: a `Permissions-Policy` line starting `camera=()` and `X-Frame-Options: DENY`.

```bash
curl -sI localhost:3111/api/auth/status | grep -i "^cache-control"
```

Expected: `Cache-Control: no-store`.

**Risk and rollback:** none expected. Revert the batch commit to roll back.

### B2. Tighten the Content Security Policy (closes SEC-04)

**Why:** `script-src` currently allows inline scripts and all of jsDelivr. The site needs neither once one inline script moves to a file and the passkey library is served locally. Keep the library at exactly version 9.0.1: do not upgrade it.

**Files:** `server.js`, `views/partials/head.ejs`, new `public/scripts/film-live.js`, new `public/vendor/simplewebauthn-browser-9.0.1.umd.min.js`, `public/admin/login.html`, `public/admin/dashboard.html`.

**Changes:**

1. Create `public/scripts/film-live.js` containing exactly:

   ```js
   // Runs before first paint: turns on the scroll-film layout only when the visitor allows motion
   if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) document.documentElement.classList.add('film-live');
   ```

2. `views/partials/head.ejs`. Replace the whole inline `<script>if (window.matchMedia(...)...</script>` line with `<script src="/scripts/film-live.js"></script>` (no `defer`, no `async`; it must run before the stylesheet below it).
3. Download the passkey library file:

   ```bash
   mkdir -p public/vendor && curl -sSf -o public/vendor/simplewebauthn-browser-9.0.1.umd.min.js https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@9.0.1/dist/bundle/index.umd.min.js
   ```

   Check it is the same file the pages already trust:

   ```bash
   openssl dgst -sha384 -binary public/vendor/simplewebauthn-browser-9.0.1.umd.min.js | openssl base64 -A
   ```

   Expected output, exactly: `9+Bm5pUMP2324xMjhRahdomA9HaTxP6JcMhbl3tUAcV2+Jiohq8/T+dGj/rx/MaM`. If it differs, delete the file, stop this task, and report it. Do not continue B2 with a different file.
4. In `public/admin/login.html` and in `public/admin/dashboard.html`, replace the whole `<script src="https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@9.0.1/...></script>` tag with `<script src="/vendor/simplewebauthn-browser-9.0.1.umd.min.js"></script>`. Keep it in the same position.
5. `server.js`, in the `contentSecurityPolicy.directives` object, set these four directives to exactly:

   ```js
   scriptSrc: ["'self'"],
   styleSrc: ["'self'", "'unsafe-inline'"],
   fontSrc: ["'self'"],
   connectSrc: ["'self'"],
   ```

   Leave `defaultSrc`, `imgSrc`, `frameSrc`, `frameAncestors`, `objectSrc`, `baseUri`, `formAction` and `upgradeInsecureRequests` unchanged. `imgSrc` keeps `https:` because one live product screenshot is an external image.

**Acceptance criteria:**
- The response header `Content-Security-Policy` contains `script-src 'self';` with no `unsafe-inline`, no `jsdelivr` and no `blob:`.
- No file under `public/` or `views/` references `cdn.jsdelivr.net`.
- The home page still switches to the film layout, and the browser console shows no Content Security Policy errors on `/`, `/observe` and `/admin`.

**Verification:**

```bash
curl -sI localhost:3111/ | grep -i "^content-security-policy" | grep -o "script-src[^;]*"
```

Expected: `script-src 'self'`.

```bash
grep -rn "jsdelivr" public views server.js | wc -l
```

Expected: `0`.

Then open `http://localhost:3111/` in a browser. In the console run `document.documentElement.classList.contains('film-live')`: expected `true` (with reduced motion off). Run `document.querySelectorAll('script[type="application/ld+json"]').length`: expected `1`. Open `/observe` and run `typeof window.SimpleWebAuthnBrowser`: expected `"object"`. Read the console on `/`, `/observe` and `/admin` (signed in): expected no message containing `Content Security Policy`.

**Risk and rollback:** any inline `<script>` added later will be blocked; that is intended. If the film layout stops working, `film-live.js` is not loading before the stylesheet. Rollback: revert the batch commit.

### B3. Remove retired endpoints (closes SEC-09)

**Why:** nothing on the site reads the homepage, navigation or changelog APIs, yet they are public and editors can still write to two of them.

**Files:** delete `routes/homepage.js`, `routes/navigation.js`, `routes/changelog.js`, `controllers/homepageController.js`, `controllers/navigationController.js`, `controllers/changelogController.js`. Edit `routes/index.js` and `scripts/smoke-cms.js`.

**Changes:**

1. Delete the six files with `git rm`.
2. `routes/index.js`: remove the three `require` lines for `./changelog`, `./homepage` and `./navigation`, and the three `router.use('/api', ...)` lines that mount `changelogRoutes`, `homepageRoutes` and `navigationRoutes`.
3. `scripts/smoke-cms.js`: in the `denied` array, remove the entry `['GET', '/api/admin/changelog'],`.
4. Leave `public/scripts/admin-dashboard.js` and `public/admin/dashboard.html` alone for this task. Their old homepage, navigation and changelog editors have no button that opens them.

**Acceptance criteria:** the six endpoints below return 404; the server starts; smoke and audit pass.

**Verification:**

```bash
for p in /api/homepage /api/navigation /api/changelog /api/admin/homepage /api/admin/navigation /api/admin/changelog; do curl -s -o /dev/null -w "%{http_code} $p\n" localhost:3111$p; done
```

Expected: six lines starting `404`.

**Risk and rollback:** the stored rows stay in the database untouched. Rollback: revert the batch commit.

### B4. Clear the dependency advisory (closes SEC-11)

**Change:**

```bash
npm install uuid@^11.1.1
```

**Acceptance criteria and verification:**

```bash
npm audit --omit=dev | tail -1
```

Expected: `found 0 vulnerabilities`.

```bash
node -e "console.log(require('uuid').v4().length)"
```

Expected: `36`. Then restart the server and run the smoke suite: expected `0 failed`.

**Risk and rollback:** do not install version 12 or later (they cannot be loaded with `require`). Rollback: `git checkout package.json package-lock.json && npm install`.

### B5. Sitemap and security.txt (closes UX-06, SEC-07 remainder)

**File:** `routes/seo.js`.

**Changes:**

1. Replace the `STATIC_PAGES` line with `const STATIC_PAGES = ['/', '/work', '/products', '/blog', '/contact', '/privacy', '/terms'];`
2. Directly below the `/robots.txt` route add:

   ```js
   // Where security researchers can report a problem (RFC 9116)
   router.get('/.well-known/security.txt', (req, res) => {
     const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
     res.type('text/plain').send(
       `Contact: ${config.siteUrl}/contact\nExpires: ${expires}\nPreferred-Languages: en\nCanonical: ${config.siteUrl}/.well-known/security.txt\n`
     );
   });
   ```

**Verification:**

```bash
curl -s localhost:3111/sitemap.xml | grep -c "/privacy"
```

Expected: `1`.

```bash
curl -s localhost:3111/.well-known/security.txt | head -1
```

Expected: a line starting `Contact: https://`.

**Risk and rollback:** none. Revert the batch commit to roll back.

### B6. Show a real page for errors on pages (closes UX-04)

**Why:** a bad URL or a server error on a page currently shows raw JSON to visitors. API requests keep getting JSON.

**Files:** new `views/error.ejs`, `middleware/errorHandler.js`.

**Changes:**

1. Create `views/error.ejs` containing exactly:

   ```ejs
   <%- include('partials/head', { noindex: true }) %>
   <%- include('partials/nav') %>
   <main id="main" class="state">
     <div>
       <h1 class="title"><%= heading %></h1>
       <p><%= text %></p>
       <a class="cta-primary" href="/">Back to the start <%- include('partials/arrow') %></a>
     </div>
   </main>
   <%- include('partials/footer') %>
   <%- include('partials/end') %>
   ```

2. `middleware/errorHandler.js`. In `errorHandler`, directly above the line `const response = {`, insert:

   ```js
   // Pages get a real page; the API keeps getting JSON
   const wantsPage = !req.path.startsWith('/api') && req.accepts(['html', 'json']) === 'html';
   if (wantsPage && !res.headersSent) {
     try {
       const config = require('../config');
       res.locals.site = res.locals.site || {
         url: config.siteUrl, social: { linkedin: '', github: '' }, legal: {}, year: new Date().getFullYear(),
         content: require('../services/siteContentService').resolve({})
       };
       res.locals.path = res.locals.path || req.path;
       const serverFault = status >= 500;
       return res.status(status).render('error', {
         title: 'Something went wrong | Observer', description: 'This page could not be shown.',
         ogImage: '/assets/og/og-home.jpg', noindex: true,
         heading: serverFault ? 'Something went wrong.' : 'That address is not valid.',
         text: serverFault ? 'The problem is on our side. Please try again in a moment.' : 'Check the link and try again.'
       }, (renderError, html) => {
         if (renderError) return res.status(status).json({ error: message });
         res.send(html);
       });
     } catch (pageError) { /* fall through to the JSON answer */ }
   }
   ```

**Acceptance criteria:** a malformed page URL returns status 400 with an HTML page; a malformed API URL still returns JSON.

**Verification:**

```bash
curl -s -H "Accept: text/html" -w "\n%{http_code}\n" "localhost:3111/blog/%E0%A4%A" | grep -E "That address is not valid|^400$"
```

Expected: two lines, the heading and `400`.

```bash
curl -s "localhost:3111/api/posts/%E0%A4%A" | head -c 12
```

Expected: `{"error":"Fa`.

**Risk and rollback:** if the error template itself fails, the handler falls back to JSON. Revert the batch commit to roll back.

---

## Batch C: Public pages

### C1. Framed buttons lose the grey system background (closes DES-01)

**File:** `public/styles/site.css`.

**Change:** directly after the line that starts `.cta-framed:hover, .cta-framed:focus-visible {` add this line:

```css
button.cta-framed { background: transparent; color: var(--text); cursor: pointer; }
```

Add nothing else: the existing hover rule is more specific than this one, so the hover fill still applies.

**Acceptance criteria:** on `/blog` the Search button has a transparent background and its text contrast is at least 4.5:1.

**Verification:** open `http://localhost:3111/blog` and run in the console:

```js
getComputedStyle(document.querySelector('form.search button')).backgroundColor
```

Expected: `rgba(0, 0, 0, 0)`.

**Risk and rollback:** none. Revert the batch commit to roll back.

### C2. Work filters become one scrolling row on small screens (closes UX-03)

**File:** `public/styles/site.css`.

**Change:** inside the `@media (max-width: 900px)` block that contains `.work-index { grid-template-columns: 1fr; }`, replace the line

```css
.rail { position: static; display: flex; flex-wrap: wrap; gap: 8px 20px; }
```

with

```css
.rail { position: static; display: flex; flex-wrap: nowrap; gap: 0 20px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; -webkit-mask-image: linear-gradient(90deg, #000 86%, transparent); mask-image: linear-gradient(90deg, #000 86%, transparent); padding-right: 40px; }
.rail::-webkit-scrollbar { display: none; }
.rail a { flex: 0 0 auto; white-space: nowrap; }
```

**Acceptance criteria:** at 375 px wide, the filter row on `/work` is under 60 px tall and the page has no horizontal scroll.

**Verification:** open `http://localhost:3111/work` at 375 px wide and run:

```js
[Math.round(document.querySelector('.rail').getBoundingClientRect().height), document.documentElement.scrollWidth === innerWidth]
```

Expected: a first value below `60` and `true`.

**Risk and rollback:** none. Revert the batch commit to roll back.

### C3. Link the privacy page from the contact form (closes UX-05)

**File:** `views/contact.ejs`.

**Change:** directly after the line containing `id="contact-submit"` (the `<div>` that wraps the Send message button) add:

```ejs
          <p class="muted" style="font-size: 0.9rem">We use your details only to reply. See our <a href="/privacy">privacy notice</a>.</p>
```

**Verification:**

```bash
curl -s localhost:3111/contact | grep -c 'href="/privacy">privacy notice'
```

Expected: `1`.

**Risk and rollback:** none.

### C4. Service worker: fresh images, no stored previews (closes SEC-08, PERF-02)

**File:** `public/sw.js`.

**Changes:**

1. Change `const CACHE_VERSION = 'v5';` to `const CACHE_VERSION = 'v6';`.
2. Directly after the block that begins `// Never cache or intercept private/admin traffic` and ends with its `return;` and closing `}`, add:

   ```js
   // Draft previews are private: never store them
   if (url.searchParams.has('preview')) {
     return;
   }
   ```

3. Replace the comment line that begins `// Static assets: Network-first for JS/CSS` with `// Static assets: network first, cached copy as the offline fallback`.
4. In that same block, replace everything from the line `// For JS and CSS, use network-first to ensure latest code` down to the `return;` that ends that static-assets block (this removes the inner `if (...js/css...) { ... } else { ...cache-first... }`) with:

   ```js
   // Network first for every static file, so a replaced image or stylesheet shows up straight away.
   // The cached copy is only used when the network is unavailable.
   event.respondWith(
     fetch(request, { cache: 'no-cache' })
       .then((response) => {
         if (response.ok) {
           const responseClone = response.clone();
           caches.open(STATIC_CACHE).then((cache) => {
             cache.put(request, responseClone);
           });
         }
         return response;
       })
       .catch(() => caches.match(request))
   );
   return;
   ```

   The surrounding `if (url.pathname.endsWith('.css') || ... ) {` line and its closing `}` stay.

**Acceptance criteria:** the file parses; it contains no cache-first branch.

**Verification:**

```bash
node --check public/sw.js && grep -c "cache-first" public/sw.js
```

Expected: no syntax error and `0`.

**Risk and rollback:** returning visitors revalidate images on each visit (small 304 responses). Rollback: revert the batch commit and raise `CACHE_VERSION` to `v7`.

---

## Batch D: Admin dashboard

### D1. Readable primary buttons (closes DES-02)

**File:** `public/styles/admin.css`.

**Change:** in the `.btn-primary { ... }` rule, replace `color: white;` with `color: var(--color-on-accent);`.

**Verification:** sign in at `http://localhost:3111/observe`, then run in the console on `/admin`:

```js
getComputedStyle(document.querySelector('.btn-primary')).color
```

Expected: `rgb(18, 17, 19)`.

### D2. Make the dashboard usable on phones (closes UX-02)

**Files:** `public/styles/admin.css`, `public/scripts/admin-dashboard.js`.

**Changes:**

1. `admin.css`, inside the `@media (max-width: 768px)` block near the end of the original rules, replace

   ```css
   .sidebar {
     display: none;
   }
   ```

   with

   ```css
   .admin-header { padding: 0.75rem 1rem; flex-wrap: wrap; gap: 0.5rem; position: static; }
   .admin-nav { flex-wrap: wrap; gap: 0.5rem; }
   .admin-layout { min-height: 0; }
   .sidebar { display: flex; border-right: 0; border-bottom: 1px solid var(--color-border); overflow: visible; }
   .sidebar-list-section { max-height: 45vh; overflow-y: auto; }
   ```

2. `admin-dashboard.js`, append at the end of the file:

   ```js
   // Small screens: the editor sits below the menu, so bring it into view after a choice is made
   document.addEventListener('click', (e) => {
     if (!window.matchMedia('(max-width: 768px)').matches) return;
     if (!e.target.closest('.sidebar .nav-item, .sidebar .list-item, .sidebar .btn')) return;
     setTimeout(() => { const panel = document.getElementById('editorPanel'); if (panel) panel.scrollIntoView({ block: 'start' }); }, 0);
   });
   ```

**Acceptance criteria:** at 375 px wide the menu is visible, the Logout button is fully inside the viewport, there is no horizontal scroll, and pressing a menu item scrolls to the editor.

**Verification:** on `/admin` at 375 px wide, run:

```js
[getComputedStyle(document.querySelector('.sidebar')).display, document.getElementById('logoutBtn').getBoundingClientRect().right <= innerWidth, document.documentElement.scrollWidth === innerWidth]
```

Expected: `["flex", true, true]`.

### D3. Keyboard access to list items (closes A11Y-01)

**Files:** `public/scripts/admin-dashboard.js`, `public/styles/admin.css`.

**Changes:**

1. `admin-dashboard.js`, in the function that builds each list row, directly after the line `div.dataset.id = id;` add:

   ```js
   div.tabIndex = 0;
   div.setAttribute('role', 'button');
   div.addEventListener('keydown', (e) => {
     if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); div.click(); }
   });
   ```

2. `admin.css`, directly after the `.list-item:hover { ... }` rule add:

   ```css
   .list-item:focus-visible { outline: 2px solid var(--color-accent); outline-offset: -2px; }
   ```

**Acceptance criteria:** pressing Tab reaches each row in the Posts list, and Enter opens it.

**Verification:** on `/admin` run:

```js
(() => { const r = document.querySelector('.list-item'); return [r.tabIndex, r.getAttribute('role')]; })()
```

Expected: `[0, "button"]`. Then focus the first row with Tab and press Enter: the post editor opens.

### D4. Names, announcements and a heading (closes A11Y-02, A11Y-03, A11Y-04)

**File:** `public/admin/dashboard.html`.

**Changes:**

1. Add an `aria-label` attribute to each of these elements, found by `id`:

   | `id` | `aria-label` value |
   |---|---|
   | `workTagInput` | `Add a tag` |
   | `capabilityIconSvg` | `Custom icon SVG code` |
   | `capabilityIconLottieUrl` | `Lottie animation address` |
   | `capabilityFeatureInput` | `Add a feature` |
   | `screenshotFileInput` | `Upload screenshot images` |
   | `capabilityScreenshotInput` | `Screenshot image address` |
   | `totpConfirm` | `Current 6-digit code` |

2. Replace `<div class="toast" id="toast"></div>` with `<div class="toast" id="toast" role="status" aria-live="polite"></div>`.
3. Replace `<span class="admin-title">Observer Admin</span>` with `<h1 class="admin-title">Observer Admin</h1>`. The existing `.admin-title` rule already sets its size and weight.

**Verification:** on `/admin` run:

```js
[document.querySelectorAll('h1').length, document.getElementById('toast').getAttribute('role'), ['workTagInput','capabilityIconSvg','capabilityIconLottieUrl','capabilityFeatureInput','screenshotFileInput','capabilityScreenshotInput','totpConfirm'].every((i) => document.getElementById(i).getAttribute('aria-label'))]
```

Expected: `[1, "status", true]`.

### D5. Two small script fixes (closes SEC-10 remainder)

**File:** `public/scripts/admin-dashboard.js`.

**Changes:**

1. In `renderCapabilityScreenshots`, remove the attribute ` onerror="this.style.display='none'"` from the `<img>` template. Directly after the statement that assigns `container.innerHTML = ...` (after its closing `.join('');`) add:

   ```js
   container.querySelectorAll('img').forEach((img) => img.addEventListener('error', () => { img.style.display = 'none'; }));
   ```

2. In the users list template, replace `${user.username.charAt(0).toUpperCase()}` with `${escapeHtml(user.username.charAt(0).toUpperCase())}`.

**Verification:**

```bash
node --check public/scripts/admin-dashboard.js && grep -c "onerror=" public/scripts/admin-dashboard.js
```

Expected: no syntax error and `0`.

**Risk and rollback for batch D:** changes are limited to the admin area. Rollback: revert the batch commit.

---

## Batch E: Film

### E1. Phones load every other film frame (closes PERF-01)

**Why:** phones currently download 14 MB of frames. Loading every other frame halves that. Frame resolution is unchanged and the script already blends neighbouring frames. Desktop is left as it is.

**File:** `public/scripts/film-scrub.js`.

**Change:** in `init`, replace

```js
var lean = conn.saveData || /(^|-)(slow-)?2g|3g/.test(conn.effectiveType || '');
```

with

```js
var lean = mobile || conn.saveData || /(^|-)(slow-)?2g|3g/.test(conn.effectiveType || '');
```

**Acceptance criteria:** at 375 px wide the home page requests about 111 mobile frames (the even-numbered ones plus the last), not 220; the film still plays through to the coral line when scrolled.

**Verification:** open `http://localhost:3111/` at 375 px wide with the network log open, wait 15 seconds, then run:

```js
performance.getEntriesByType('resource').filter((r) => r.name.includes('/assets/film/mobile/f_')).length
```

Expected: between `108` and `114`. Scroll the hero from top to bottom: the image changes smoothly and the last frame shows the coral line.

**Risk and rollback:** motion on phones is slightly less fine-grained. The owner reviews this on a real phone before the pull request is merged (see "Requires human action"). Rollback: restore the original line.

---

## Batch F: Tests and docs

### F1. Add regression checks

**File:** `scripts/smoke-cms.js`.

**Change:** directly above the line `console.log('\nBackup');` insert:

```js
  console.log('\nReview hardening');
  // sessions end when a password is reset
  await admin.req('/api/auth/users', { method: 'POST', body: { username: 'fp-check', password: 'Fp-check-pass-1', role: 'editor' } });
  const fp = new Client(); await fp.refreshCsrf();
  const fpIn = await fp.req('/api/auth/login', { method: 'POST', body: { username: 'fp-check', password: 'Fp-check-pass-1' } });
  await fp.refreshCsrf();
  check('a new account can sign in', fpIn.status === 200 && (await fp.req('/api/admin/posts')).status === 200);
  const fpRow = (await admin.req('/api/auth/users')).json.find((u) => u.username === 'fp-check');
  const fpReset = await admin.req(`/api/auth/users/${fpRow.id}/password`, { method: 'PUT', body: { password: 'Fp-check-pass-2' } });
  check('admin resets that password', fpReset.status === 200);
  check('the old session stops working at once', (await fp.req('/api/admin/posts')).status === 401);
  await admin.req(`/api/auth/users/${fpRow.id}`, { method: 'DELETE' });
  // usernames are not revealed
  check('public posts API does not reveal who wrote a post', !/"author"/.test((await anon.req('/api/posts')).text));
  const pk1 = await anon.req('/api/auth/webauthn/login/start', { method: 'POST', body: { username: 'no-such-user-zz' } });
  const pk2 = await anon.req('/api/auth/webauthn/login/start', { method: 'POST', body: { username: USER } });
  check('passkey start answers the same for unknown and real usernames', pk1.status === 400 && pk1.status === pk2.status && pk1.text === pk2.text);
  // wrong-typed input
  check('an object as the password is rejected cleanly', (await anon.req('/api/auth/login', { method: 'POST', body: { username: 'x', password: { a: 1 } } })).status === 400);
  check('an array as the search term does not break the posts API', (await anon.req('/api/posts?search[]=x')).status === 200);
  // headers
  const homeHeaders = (await anon.req('/')).headers;
  check('pages send a Permissions-Policy header', /camera=\(\)/.test(homeHeaders.get('permissions-policy') || ''));
  check('pages cannot be framed', homeHeaders.get('x-frame-options') === 'DENY');
  check('scripts are limited to this site', /script-src 'self'(;|$)/.test(homeHeaders.get('content-security-policy') || ''));
  check('signed-in API responses are not cached', (await admin.req('/api/admin/posts')).headers.get('cache-control') === 'no-store');
  // retired endpoints and new routes
  for (const p of ['/api/homepage', '/api/navigation', '/api/changelog']) check(`${p} is gone`, (await anon.req(p)).status === 404);
  check('sitemap lists the privacy page', /\/privacy<\/loc>/.test((await anon.req('/sitemap.xml')).text));
  check('security.txt is served', /^Contact: /.test((await anon.req('/.well-known/security.txt')).text));
  const badUrl = await anon.req('/blog/%E0%A4%A', { headers: { Accept: 'text/html' } });
  check('a bad page address shows a page, not JSON', badUrl.status === 400 && /<!DOCTYPE html>/i.test(badUrl.text));
```

`GET /api/auth/users` returns a plain array, which is what `.find` above relies on.

**Acceptance criteria and verification:** restart the server, then run:

```bash
BASE=http://localhost:3111 node scripts/smoke-cms.js | tail -3
```

Expected: `127 passed, 0 failed` (111 baseline, minus 1 removed changelog check, plus 17 new). Then:

```bash
node scripts/audit-routes.js | tail -1
```

Expected: `No admin route is missing login or CSRF protection.` Then restore the data files (command in "How to run and verify locally").

### F2. Update the admin guide

**File:** `docs/ADMIN_GUIDE.md`.

**Changes:**

1. In the section "Roles and creating accounts", directly after the paragraph that begins `**Remove someone**`, add this paragraph:

   `**Resetting a password or one-time code signs that person out everywhere.** Their open sessions stop working at once and they sign in again with the new details.`

2. In "Safety checks you can run", replace `# 48 checks:` with `# 127 checks:`.

**Verification:**

```bash
grep -c "signs that person out everywhere" docs/ADMIN_GUIDE.md
```

Expected: `1`.

---

## Regression checklist

Run with the server on port 3111 after all batches. Every item must pass before the pull request is opened.

1. **Smoke and audit:** `127 passed, 0 failed`; audit reports nothing missing.
2. **Home page:** loads with status 200; scrolling the hero plays the film to the coral line; the four headlines appear in turn; no console errors.
3. **Reduced motion:** with the browser's reduced-motion setting on, the home page shows the static stacked hero.
4. **Public pages:** `/work`, `/products`, `/products/datadragon`, `/blog`, `/blog/welcome-to-observer`, `/contact`, `/privacy`, `/terms` each return 200; an unknown path returns the 404 page.
5. **Contact form:** on the local server, submitting valid details shows "Thank you."; an empty submit shows field messages. Restore `data/messages.json` afterwards.
6. **Sign in:** `/observe` with `admin` and the local password reaches `/admin`. The One-time code and Passkey tabs still switch.
7. **Dashboard:** open a post, change nothing, press Save: a toast confirms. Open Site content, press Preview: the preview bar shows. Open Users: the list shows role badges.
8. **Phone width (375 px):** `/work` filter is one row; `/admin` shows the menu; no page scrolls sideways.
9. **Sign out:** Logout returns to `/observe`, and `/api/admin/posts` then returns 401.

## Re-test pass

Re-run the original check for each closed finding and confirm the expected result.

| Finding | Check | Expected |
|---|---|---|
| SEC-01 | Smoke check "the old session stops working at once" | passes |
| SEC-02 | `curl -s localhost:3111/api/posts \| grep -c '"author"'` | `0` |
| SEC-02 | Smoke check "passkey start answers the same..." | passes |
| SEC-02 | The timing command in task A2 | both above 0.1 s |
| SEC-03 | Existing smoke lockout checks | pass |
| SEC-04 | The `script-src` command in task B2 | `script-src 'self'` |
| SEC-05 | The two commands in task A4 | `200`, `400` |
| SEC-06 | `curl -sI localhost:3111/api/auth/status \| grep -i cache-control` | `no-store` |
| SEC-07 | The header command in task B1; `curl -s -o /dev/null -w "%{http_code}" localhost:3111/.well-known/security.txt` | headers present; `200` |
| SEC-08, PERF-02 | `grep -c "searchParams.has('preview')" public/sw.js`; `grep -c "cache-first" public/sw.js` | `1`; `0` |
| SEC-09 | The six-endpoint command in task B3 | six `404` lines |
| SEC-10 | `grep -c "timingSafeEqual" middleware/csrf.js`; `grep -c "onerror=" public/scripts/admin-dashboard.js` | `1`; `0` |
| SEC-11 | `npm audit --omit=dev \| tail -1` | `found 0 vulnerabilities` |
| UX-02 | Console check in task D2 | `["flex", true, true]` |
| UX-03 | Console check in task C2 | below 60, `true` |
| UX-04 | First command in task B6 | heading and `400` |
| UX-05 | Command in task C3 | `1` |
| UX-06 | First command in task B5 | `1` |
| DES-01 | Console check in task C1 | `rgba(0, 0, 0, 0)` |
| DES-02 | Console check in task D1 | `rgb(18, 17, 19)` |
| A11Y-01 | Console check in task D3 | `[0, "button"]` |
| A11Y-02, 03, 04 | Console check in task D4 | `[1, "status", true]` |
| PERF-01 | Console check in task E1 | 108 to 114 |

---

## Requires human action

These cannot be done from the code. Items 1 to 5 do not depend on the code tasks and can be done at any time. Item 6 comes before the pull request is merged. Items 7 and 8 come after it is deployed.

1. **Make `observersoftware.com` serve the site over HTTPS (INFRA-01).**
   1. In Railway: open the project, click the website service, open **Settings**, then **Networking**, press **Custom Domain** and add `observersoftware.com`. Railway shows a DNS record to create.
   2. At the domain's DNS host (the nameservers are `ns1.dns-parking.com` and `ns2.dns-parking.com`): remove the current forwarding or parking setup and add the record Railway showed.
   3. Wait until Railway shows the domain as active with a certificate.
   4. Check: `curl -sI https://observersoftware.com/health` returns `200`.
   5. Leave `SITE_URL`, `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN` as they are; they already use this domain. Passkeys start working once the domain does.

2. **Clean up live content (UX-01).** Do this in order:
   1. Sign in on the live site and press **Download backup**.
   2. Run `railway run node scripts/sync-content.js` from the project folder (see `docs/REPLACE_ME.md`).
   3. In the admin: unpublish or delete the post titled "Test"; unpublish the two testimonials ("John Doe" and "Anonymous") until real ones exist; check that Products shows only DataDragon and TableFlow and that Work shows the intended items.

3. **Email records (INFRA-02).** In Resend, add and verify the domain you send from, and create the SPF and DKIM records it lists at your DNS host. Then add a DMARC record: name `_dmarc`, type TXT, value `v=DMARC1; p=quarantine; rua=mailto:` followed by an address you read. Send yourself a contact-form message on the live site to confirm the notification arrives.

4. **Railway variables (UX-07 and earlier setup).** In the website service's **Variables** tab, set `LEGAL_ADDRESS` and `GOVERNING_STATE` so the terms page is complete. Confirm `DATA_DIR=/data` with a volume mounted at `/data`, and that `TOTP_ENCRYPTION_KEY` is set (set it once and never change it). After the next deploy, read the "Sign-in setup" lines in the deploy log: they list any setting that is still wrong.

5. **Legal copy.** Read `/privacy` and `/terms` on the live site and confirm they describe the business correctly. The technical claims on the privacy page (no cookies on public pages, no analytics, Railway and Resend as providers) were checked and are accurate.

6. **Review the film on a phone before merging (PERF-01, task E1).** Open the pull request's branch locally on a phone, or use a narrow browser window, and scroll the home page hero. If the motion is not acceptable, ask for task E1 to be reverted before merging; nothing else depends on it.

7. **After deploying.** Everyone is signed out once (task A1). Sign in again, then check `https://<site>/health` returns `ok` and that `/observe` and `/admin` work.

8. **Replace placeholder images.** The founder photo and product screenshots are still placeholders; see `docs/REPLACE_ME.md`. After task C4, returning visitors see replaced images immediately.

No keys or passwords need rotating: no secret was found exposed.
