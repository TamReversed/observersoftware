# Observer v2 Redesign: Handoff Plan

This is a self-contained execution plan for a fresh Claude session (Sonnet). Work through it top to bottom. Every decision the owner has already made is recorded here; do not re-ask them. Ask the owner only at the explicit **CHECKPOINT** lines.

---

## 0. Context

- **Repo:** `/Users/mat/Documents/1. Development/000. Observer v2` (GitHub `TamReversed/observersoftware`).
- **What it is:** the public website for **Observer**, a software studio operating as a subsidiary of **Techademy LLC**. Express 4 app (`server.js`) serving static HTML from `public/`, JSON API under `/api`, admin panel at `/observe` (login) and `/admin` (dashboard), blog, Postgres when `DATABASE_URL` is set (else JSON files in `data/`).
- **Hosting:** Railway. **Stay on Railway.** Do NOT use Higgsfield's website hosting (`create_website` / `deploy_website` / `publish_website`). Higgsfield is used ONLY to generate images and video.
- **Git:** work happens on branch `redesign/phase-0` (already created, no code changes yet). Commit after each numbered step with a clear message. **Never push or deploy without the owner saying so** (Railway deploys from the default branch).
- **Local dev:** `npm install` is done. Run with `npm run dev` (port 3000). `.claude/launch.json` defines a preview config named `observer`, so you can use the browser preview tool with `preview_start name:"observer"` (or `preview_start url:"http://localhost:3000"` if a server is already running).
- **Tooling available:** `ffmpeg` (Homebrew), `sips`. No `cwebp`/ImageMagick; use ffmpeg for WebP (`ffmpeg -i in.png -c:v libwebp -quality 80 out.webp`).
- **Why a redesign:** a prior Higgsfield attempt "was a swing and a miss". Root cause: AI images were bolted onto an existing template. This plan is **design-first**: brief, then mockup boards, then a palette-locked asset kit, then build the code TO the boards.

### Owner decisions (final, do not re-ask)

| Topic | Decision |
|---|---|
| Hosting | Keep Express repo + Railway |
| Primary offer | **Equal weight**: consulting AND products (DataDragon, TableFlow), presented as one studio that does both |
| Hero | **Scroll-driven film** (scroll scrubs a generated cinematic shot forward/backward) |
| Theme | **Dark, but not "AI dark"**: no blue glow, no galaxy/stars, no orbs, no purple |
| Logo | **Refine** the existing eye-in-hexagon mark into a clean family (do not invent a new mark) |
| Testimonials | None exist. **Hide the section entirely** until real ones are added. Never generate fake quotes or faces |
| Real assets the owner will supply later | Founder/team photos, real case-study numbers, real product screenshots |
| Placeholders | Generate placeholder files at **fixed filenames** (section 6.4). The owner will overwrite those files with real ones of the same name |

---

## 1. Verified findings (what's wrong today)

### Backend / security (fix in Phase A)
1. **CRITICAL, verified:** `routes/auth.js:13-14` exposes `POST /api/auth/webauthn/register/start|finish` with no auth. `authController.startWebAuthnRegistration` (`controllers/authController.js:114`) registers a passkey to any `username` in the body whose account has zero passkeys. The seeded admin starts with `webauthnCredentials: []` (`services/initService.js:31`), and `revokePasskeys` resets to `[]`. Result: anyone can register their passkey on the admin account and log in.
2. WebAuthn origin/rpID are derived from request headers (`authController.js:107-111`, `services/webauthnService.js:29-41`) instead of `config.webauthn.origin/rpID`.
3. No `req.session.regenerate()` on login (`authController.js:76`, `:407`): session fixation.
4. Lockout keyed only by username and also applied to passkey login start (`authController.js:14-38`, `:265`): anyone can lock the owner out. The `failedLogins` Map grows without limit.
5. `express-session` uses MemoryStore (`server.js:59`), and `generateCsrfToken` runs globally (`server.js:106`) **before** `express.static`, so every request (assets, bots) creates a stored session. This leaks memory and logs admins out on every deploy.
6. The contact form never notifies anyone (`controllers/messagesController.js:42-83`): it only stores the message. It has no length/type validation and no honeypot.
7. Persistence on Railway:
   - 8 data files fall back to `./data/x.json` because `config/index.js:31-38` only defines 5 paths. The affected controllers are faqs, categories, changelog, homepage, media, settings, navigation and testimonials (each at line ~7-8).
   - Uploads are written to `public/assets/products` (`controllers/uploadController.js:32`) inside the container and lost on redeploy.
8. `services/initService.js:41-234` re-seeds sample posts/work/capabilities whenever a table is empty. These include **invented client metrics** (false-advertising risk for an LLC).
9. `services/dbService.js` swallows DB errors and returns `[]`/`null` (around lines 34-37, 63-66).
10. `routes/posts.js:10` registers `GET /api/categories` with hard-coded data and shadows `routes/categories.js` (mounted later in `routes/index.js:32`).
11. `public/sw.js:88-99` caches every `/api/` GET, including `/api/admin/*` (visitor messages, users), in Cache Storage.
12. SEO/server: no robots.txt, sitemap or 404 handler. `/blog/:slug` returns 200 for missing posts. Pages are reachable at both `/x` and `/x.html`. All meta is client-side only.
13. Minor:
    - The upload extension regex isn't anchored (`uploadController.js:51`).
    - HSTS uses `preload` + `includeSubDomains` (`server.js:52`).
    - No compression and no static cache headers.
    - CSP has `'unsafe-inline'` in `scriptSrc`.

### Frontend / design / content (fixed by Phases B-F)
- **Visible empty states.** The homepage shows "No testimonials yet." (`public/scripts/home.js` ~490). The contact page shows "No FAQs available." above its H1.
- **No mobile nav.** `.nav__links` is `display:none` below 640px (`public/styles/styles.css` ~1742), with no hamburger.
- **AI tells** (Higgsfield's own design guide bans these):
  - near-black + blue accent
  - light serif display on a centred dark hero
  - galaxy canvas, nebula and orbs
  - Three.js particle "black hole"
  - global hover glow on all text (`styles.css:67-80`)
  - three equal cards (Seek/Learn/Integrate)
  - an uppercase eyebrow label on nearly every section
  - em-dashes in copy and titles ("Observer — Purposeful Software")
  - fake precise stats ("70%", "40%", "60%")
- **Logo implemented 3 different ways:**
  - rainbow animated gradient (`index.html:51-73`)
  - a different palette on contact/terms
  - a 221 KB 1024px PNG used as a 28px icon on `blog.html:39`
- **`public/favicon.ico` is not an ICO file.** It's a text data-URI containing an emoji.
- **Copy contradictions.** "Over the past decade" vs "Est. 2024". © 2025 footer. Blog author shows as handle "tamreversed".
- **Placeholder links.** LinkedIn/GitHub go to `/coming-soon`. The product modal CTA is `href="#"`.
- **No imagery anywhere.** `data/work.json` images are empty, `capabilities.json` screenshots are `[]`, and the image fallback is the emoji 🖼️.
- **Wasted weight.**
  - Three.js (~600 KB) loads on index/contact/terms but is unused there.
  - Lottie loads but is unused.
  - `mesh-background.js` is 42 KB.
  - The logo PNG/JPEG are 220-240 KB each.
- **SEO gaps.** No og:image, canonical, JSON-LD, robots or sitemap. Work/products/posts/FAQ content exists only after JS runs.
- **Accessibility.** Tertiary text contrast ~3.8:1. Heading order is broken. Inputs have no visible focus ring. Decorative SVGs lack `aria-hidden`.
- **Legal.** Terms has no legal entity/address/governing law/contact email. "IP addresses for tracking" contradicts the "no tracking" claim. The cookie banner says cookies "keep you logged in" (public visitors never log in).

---

## 2. Execution order

| Phase | What | Higgsfield credits |
|---|---|---|
| A | Security + foundation fixes (backend) | 0 |
| B | Design brief (`docs/design-brief.md`) | 0 |
| C | Storyboard + per-section mockup boards | ~10-14 images |
| D | Asset kit (logo family, icons, OG, case-study art, placeholders, state art) | ~20-25 images |
| E | Hero film + encode to frame sequences | 1 video (+1 re-roll max) |
| F | Rebuild public pages to the boards (server-rendered) | 0 |
| G | Content + legal pages | 0 |
| H | Quality gate, then hand back to owner for deploy | 0 |

Check `balance` before Phase C and after each phase. If any single batch would exceed ~150 credits, or the running total passes 600, **CHECKPOINT: ask the owner** before continuing. Starting balance on 2026-10-03: 1,007.5 credits (Plus plan).

---

## 3. Phase A: Security + foundation (do first, commit per step)

Run `npm run dev` after each step and smoke-test with `curl`. Keep diffs tight and match the surrounding code style (CommonJS, 2-space indent, `asyncHandler`, `next(error)`).

### A1. Close the passkey takeover (CRITICAL)
Goal: registering a passkey requires proving you are the user, either with an authenticated session or with the user's password.

`controllers/authController.js`:
- In `startWebAuthnRegistration`:
  - Read `{ username, password }`.
  - If `req.session.userId` is set, load that user and **ignore the body username**.
  - Otherwise require both `username` and `password`, run the lockout check (A4 key), find the user, and `bcrypt.compare(password, user.password)`. On any failure call `recordFailedLogin(key)` and return `401 { error: 'Invalid credentials' }`. Never reveal whether the user exists; return 401, not 404.
- Keep the "already has a passkey" check, but **only** when the caller is not session-authenticated. A logged-in admin may add an additional passkey.
- `finishWebAuthnRegistration` already uses `req.session.webauthnUserId`, which is set only after the check above. No change except A2.

`routes/auth.js`: no `requireAuth` on `register/start` (the password path must work from the login page), but the controller now enforces auth as above.

Client (`public/scripts/admin-login.js` ~695-777, `public/admin/login.html` ~118-180):
- The register flow must send the password. Read it from the existing `#password` input.
- If it's empty, open the "Use password" `<details>` (or reveal the password form) and show: "Enter your password below, then select Register Passkey."
- Send `{ username, password, csrfToken }` to `register/start`.
- After success, clear the password field.

Test:
- `curl` with only `{username:"admin"}` → 401.
- With a wrong password → 401.
- With the right password → 200 options.
- Remember CSRF: GET `/api/auth/csrf-token` first with a cookie jar (`-c/-b`).

### A2. Fixed WebAuthn origin / rpID
- In `authController.js`, delete `getOriginFromRequest` and use `config.webauthn.origin` everywhere. Pass `rpID: config.webauthn.rpID` in the options objects (registration finish ~line 203-210, login finish ~368-380).
- In `services/webauthnService.js`, remove/stop using header-derived origin (lines ~29-41) and `getRpIDFromOrigin` fallbacks. Use `config.webauthn.rpID` / `config.webauthn.origin`.
- `config/index.js`: production defaults are `observersoftware.io` / `https://observersoftware.io`. Allow `WEBAUTHN_ORIGIN` to be a comma-separated list. If so, pass an array as `expectedOrigin` (SimpleWebAuthn accepts arrays).
- **CHECKPOINT (report only, don't block):** tell the owner that in Railway they must set `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN` to the domain they actually use to log in. Passkeys registered under a different domain (e.g. a `*.up.railway.app` host) will stop working and need re-registering.

### A3. Session fixation
In both `login` and `finishWebAuthnLogin`, replace the direct assignment:
```js
req.session.regenerate((err) => {
  if (err) return next(err);
  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.csrfToken = require('uuid').v4();
  req.session.save((err2) => {
    if (err2) return next(err2);
    res.json({ success: true, username: user.username });
  });
});
```
(Clear the webauthn* session keys before regenerating; regenerate discards them anyway.) Check that the dashboard JS re-fetches `/api/auth/csrf-token` after load (grep `csrf-token` in `public/scripts/`). If it caches a token from the login page, make it fetch fresh.

### A4. Lockout that can't be weaponised
- Key = `${req.ip}|${username.toLowerCase()}`.
- Remove the lockout check from `startWebAuthnLogin` (passkeys aren't guessable). Keep recording failures in `finishWebAuthnLogin` against the same key.
- Prune the Map: on each `recordFailedLogin`, if `failedLogins.size > 1000`, delete entries whose `lastAttempt` is older than `LOCKOUT_DURATION`.
- Note: `app.set('trust proxy', 1)` is set in production (`server.js:67`). Move it **above** the session and rate-limit middleware so `req.ip` and secure cookies are correct.

### A5. Persistent sessions + CSRF only where needed
- `npm i connect-pg-simple`. In `server.js`, when `config.database.useDatabase`, use:
  ```js
  const PgSession = require('connect-pg-simple')(session);
  store: new PgSession({ pool: <existing pg pool>, tableName: 'session', createTableIfMissing: true })
  ```
  Find the pool in `services/database.js` (export it if not exported). Otherwise keep MemoryStore (dev only).
- Remove the global `app.use(generateCsrfToken)` (`server.js:106`).
  - Make `getCsrfToken` in `authController.js` create the token if missing (`req.session.csrfToken ||= uuidv4()`).
  - Apply `generateCsrfToken` only to the `/api` router.
  - Verify that public pages that POST (contact form, newsletter if any) call `/api/auth/csrf-token` first. Grep `csrf` in `public/scripts/*.js`.
- Static assets must not create sessions: `express.static` must be mounted **before** `session(...)`. Reorder so static files and `/health` are served before session middleware.

### A6. Contact form that actually reaches the owner
- `middleware/validation.js`: add `validateMessage` using express-validator:
  - `name`: string, trimmed, 1-100
  - `email`: isEmail, normalised, ≤254
  - `company`: optional, ≤200
  - `message`: string, 1-5000
  - all other fields rejected or ignored
  Apply it on the POST route in `routes/messages.js` (or wherever `createMessage` is routed).
- Honeypot: add a visually hidden input `name="website"` (`tabindex="-1" autocomplete="off"`, hidden via an off-screen CSS class, not `display:none`) to the contact form. In the controller, if `req.body.website` is non-empty, respond `200 { success: true }` and store nothing.
- Email notification via Resend's HTTP API, using Node's global `fetch` (no new dependency). Create `services/notifyService.js`:
  ```js
  async function notifyNewMessage(msg) {
    const key = process.env.RESEND_API_KEY, to = process.env.CONTACT_TO_EMAIL, from = process.env.CONTACT_FROM_EMAIL;
    if (!key || !to || !from) { console.warn('Contact notification skipped: RESEND_API_KEY/CONTACT_TO_EMAIL/CONTACT_FROM_EMAIL not set'); return; }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, reply_to: msg.email, subject: `New enquiry from ${msg.name}`, text: `${msg.name} <${msg.email}>\n${msg.company || ''}\n\n${msg.message}` })
    });
    if (!res.ok) console.error('Contact notification failed', res.status, await res.text());
  }
  ```
  Call it after storing, inside try/catch. A failed email must not fail the request.
- Add `RESEND_API_KEY`, `CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL` to `.env.example` with comments.
- **CHECKPOINT (report only):** the owner must create a Resend account, verify the sending domain, and set those 3 vars in Railway. Never ask for the key value in chat.

### A7. Persistence on Railway
- `config/index.js` `paths`: add `settingsFile`, `homepageFile`, `navigationFile`, `mediaFile`, `categoriesFile`, `changelogFile`, `testimonialsFile`, `faqsFile` (all `path.join(dataDir, '<name>.json')`), plus `uploadsDir: path.join(dataDir, 'uploads')`.
- In the 8 controllers, drop the `|| './data/x.json'` fallbacks and use `config.paths.*`.
- `controllers/uploadController.js`:
  - Write to `config.paths.uploadsDir` (mkdir recursive on boot).
  - Return URLs under `/uploads/...`.
  - In `server.js`, add `app.use('/uploads', express.static(config.paths.uploadsDir, { maxAge: '30d' }))`.
  - Keep serving the old `public/assets/products` path so existing URLs don't break.
- Fix the extension regex to `/^\.(jpe?g|png|gif|webp)$/i` and read only the first 12 bytes for the magic-number check (`fs.openSync` + `fs.readSync`).
- Multer errors should return 400 with a message.
- **CHECKPOINT (report only):** the owner should attach a Railway volume mounted at `/data` and set `DATA_DIR=/data` (needed for uploads even when Postgres is used).

### A8. Stop re-seeding fake content
- `services/initService.js`: always ensure the admin user exists. Seed sample posts/work/capabilities **only** when `process.env.SEED_SAMPLE_CONTENT === 'true'`.
- Remove every invented client metric from the sample data, and from `data/work.json` / `data/posts.json`. Phrases like "reduced handoffs by 70%", "delivery velocity increased by 40%", "reducing unused features by 60%", "60% to 90%" and "roughly 60%" must go. Grep for `%` in `data/` and `services/initService.js`.
- Add an optional `metrics` array field to work items (`[{ "value": "", "label": "" }]`), empty by default. The redesign renders metrics only when present. The owner will fill real numbers via the admin panel. If the admin work editor is a fixed form, add a simple metrics editor (value + label rows) to it.

### A9. DB errors surface as errors
`services/dbService.js`: in every catch that returns `[]`/`null`, log and **rethrow**. Confirm controllers pass errors to `next()` so `middleware/errorHandler.js` returns 500.

### A10. Small route / caching / header fixes
- Delete `router.get('/categories', ...)` from `routes/posts.js`. Verify `public/scripts/blog.js` still gets a compatible shape from `routes/categories.js`; adapt the client if the shape differs.
- `public/sw.js`: never cache `/api/admin`, `/api/auth` or `/api/messages` (network-only), and bump the cache version constants so old caches are deleted on activate. Also make sure `/admin` and `/observe` HTML are never cached.
- `server.js`:
  - `npm i compression`; add `app.use(compression())` near the top.
  - Static: `express.static(publicDir, { maxAge: '7d', setHeaders: (res, p) => { if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); } })`.
  - HSTS: `{ maxAge: 31536000 }` without `includeSubDomains`/`preload` (re-add only if the owner confirms every subdomain is HTTPS).
- `/health`: if using the DB, run `SELECT 1` and return 503 on failure.
- Remove verbose WebAuthn debug `console.log`s in `services/webauthnService.js` (~161-300), or guard them with `if (!config.isProduction)`.

### A11. SEO plumbing (server)
- `GET /robots.txt`:
  ```
  User-agent: *
  Disallow: /admin
  Disallow: /observe
  Disallow: /api/
  Sitemap: https://observersoftware.io/sitemap.xml
  ```
  Use `config.siteUrl` (add `SITE_URL` env, default `https://observersoftware.io`).
- `GET /sitemap.xml`: static pages (`/`, `/work`, `/products`, `/blog`, `/contact`, `/privacy`, `/terms`) plus every published post `/blog/<slug>` with `lastmod`.
- 301 redirect `/<page>.html` → `/<page>` (index.html → `/`). Update all internal links to clean URLs.
- `/blog/:slug`: look up the post; if not found or unpublished, return a 404 status with the 404 page.
- Final catch-all 404 handler (before `errorHandler`) that sends `public/404.html` with status 404 (the page itself is built in Phase F).

**Phase A done when:**
- the server boots clean
- the curl tests in A1 pass
- the contact POST validates and the honeypot works
- `/robots.txt`, `/sitemap.xml` and `/nope` (404) respond correctly
- everything is committed

Report a short summary to the owner, including the 3 Railway env/volume checkpoints (A2, A6, A7).

---

## 4. Phase B: Design brief (`docs/design-brief.md`)

Write the brief **before** any generation. It is the contract every later phase follows; edit it (and say why) rather than silently deviating. ~40-60 lines. Every line must be specific. "Modern and clean" or "blue accent" means it isn't done.

### Required contents

- **Design read:** "Observer is a small senior studio for ops/product/engineering leaders who are tired of software people have to work around. Register: calm, exact, quietly confident."
- **Concept spine:** **"Noise resolving into a clear path."** Observer watches messy real workflows and removes steps. Visual motifs: tangled threads/lines that untangle into one line; an eye/lens bringing something into focus; a precision-instrument feel. Every section should echo this (dividers as single clean lines, case-study art showing "before tangle / after line", and so on).
- **Delivery tier:** `cinema` (Lenis + GSAP ScrollTrigger, scroll-scrub hero, scroll chapters).
- **Animation mode:** `animated-website`. Journey shape: `single-shot` (one ~15s continuous film).
- **Journey (chapters over the film), headline ≤8 words each, no em-dashes:**
  1. "Software shaped by real work." (establishing: the tangle)
  2. "We watch how work actually happens." (camera pushes in)
  3. "Then remove the steps that don't matter." (threads untangle)
  4. "What's left is clear and stays that way." (single clean line). Primary CTA "Start a conversation".
- **Locked palette:** dark, NOT AI-dark. Hard bans:
  - near-black + orange/amber
  - near-black + neon cyan/blue/green
  - purple/violet glow
  - beige + brass
  - the current `#7c9bdd` steel-blue scheme

  Offer the owner these three candidates, rendered on the hero board in Phase C (one hero board per palette):

  | Option | Ground | Surface | Text | Muted | Accent | One-line defense |
  |---|---|---|---|---|---|---|
  | A "Ink + Celadon" | `#0F1211` | `#171B19` | `#E9ECE6` | `#9AA39D` | `#9CC5B0` | Calm, clinical clarity; green-grey reads "healthy system" without being neon |
  | B "Smoke + Signal Coral" | `#121113` | `#1B1A1C` | `#ECE8E4` | `#A39E99` | `#E0565B` | One warm decisive signal on neutral smoke; reads "we point at the problem" |
  | C "Night Moss + Chartreuse" | `#0E0F0C` | `#171914` | `#EDEEE6` | `#9EA195` | `#C6D35A` | Unexpected, confident, instrument-panel feel |

  Exactly one accent, saturation <80%, used sparingly (CTAs, the clean line, focus rings). Muted text must pass WCAG AA (≥4.5:1) on ground. Verify with a contrast calculation and adjust lightness if needed.
- **Locked type:** **Geist** (display + body) + **Geist Mono** (labels, metrics, code). Both are on Google Fonts (CSP already allows `fonts.googleapis.com`/`fonts.gstatic.com`). No serif (drop Source Serif 4). Display: tight tracking, weight 500-600. Body: 16-18px, line-height 1.6, max 65ch.
- **Corner language:** all-sharp (0-2px radius) site-wide, to suit the precision-instrument spine.
- **Section plan (home):** one layout family per section, no consecutive repeats, ≥4 families:
  1. **Hero / film journey**: pinned full-bleed scroll-scrub canvas with the 4 chapters overlaid (left-aligned copy in the left third; subject is centre-safe).
  2. **Two practices**: colour-blocked diptych. Left: "Consulting" (workflow and systems engagements). Right: "Products" (DataDragon, TableFlow). Equal weight. Each half has one line and one inline CTA.
  3. **Selected work**: editorial list rows (title, sector, year, metrics if present). Hovering/focusing a row reveals its generated case-study image in a fixed frame. Links to `/work/<slug>` or `/work#slug`.
  4. **Products**: product panel stack, one full-width panel per product with a screenshot (placeholder file until the owner supplies real ones), 2-line description and "Explore DataDragon".
  5. **How an engagement runs**: one full-bleed art-directed diagram image (generated) with a 3-4 step caption row beneath. Not a card trio. No "001 ·" numbering.
  6. **About / founder**: split, used only once on the page. Founder portrait (placeholder file) + a short note in first person + "Techademy LLC" line.
  7. **Insights**: asymmetric: 1 large latest post + 2 compact rows. Not three equal cards.
  8. **Closing CTA band**: an oversized single-line headline ("Tell us where the work gets stuck.") + the CTA.
  9. **Footer**: Observer mark; nav; LinkedIn/GitHub **only if real URLs are provided, else omit**; "© 2026 Techademy LLC. Observer is a Techademy LLC company."; Privacy; Terms.
- **Eyebrow ration:** max ceil(9/3)=3 uppercase eyebrow labels on the whole home page.
- **CTA inventory (one label per intent, site-wide):**

  | Label | Destination | Garment |
  |---|---|---|
  | "Start a conversation" | `/contact` | Primary: solid accent block, sharp corners, arrow nudges right on hover |
  | "See the work" | `/work` | Underlined inline link + arrow |
  | "Explore DataDragon" / "Explore TableFlow" | product detail | Framed outline block |
  | "Read the note" | blog posts | Text link |

  Never also use "Contact us", "Get in touch" or "Let's talk".
- **Copy rules:**
  - Headline ≤8 words; sub-paragraph ≤25 words.
  - **Zero em/en-dashes** in visible text (titles included: use "Observer | Software shaped by real work").
  - No invented performance stats.
  - No "Elevate/Seamless/Unleash".
  - Fix the "decade" vs "Est. 2024" contradiction: use "Founded 2024. Senior team with long careers in enterprise platforms."
- **Asset plan:** list everything from Phase D with target paths.
- **Motion rules:**
  - One signature effect (the film).
  - Everything else is transform-only reveals that fire on mount or scroll **without** starting at opacity 0.
  - Every animation is gated by `prefers-reduced-motion`. Reduced motion means a static final frame with no pin.
  - Remove: galaxy canvas, nebula/orbs, Three.js black hole, magnetic buttons, global hover glow, SVG `<animate>` gradients.

**CHECKPOINT:** show the owner the brief (summarise in chat, link the file) **together with** the Phase C hero boards for palettes A/B/C, and ask them to pick a palette. Generate the 3 hero boards first (section 5), then ask.

---

## 5. Phase C: Storyboard + mockup boards (Higgsfield)

### Higgsfield tool usage (applies to Phases C-E)
- Tools are deferred MCP tools with prefix `mcp__1043eebe-7d50-4c69-8891-d857385f2891__`. Load the schemas once with ToolSearch, for example: `select:mcp__1043eebe-7d50-4c69-8891-d857385f2891__generate_image,mcp__1043eebe-7d50-4c69-8891-d857385f2891__generate_image_batch,mcp__1043eebe-7d50-4c69-8891-d857385f2891__generate_video,mcp__1043eebe-7d50-4c69-8891-d857385f2891__jobs_wait,mcp__1043eebe-7d50-4c69-8891-d857385f2891__job_display,mcp__1043eebe-7d50-4c69-8891-d857385f2891__show_generation_by_ids,mcp__1043eebe-7d50-4c69-8891-d857385f2891__models_explore,mcp__1043eebe-7d50-4c69-8891-d857385f2891__balance,mcp__1043eebe-7d50-4c69-8891-d857385f2891__remove_background,mcp__1043eebe-7d50-4c69-8891-d857385f2891__upscale_image`.
- **Before the first call, run `models_explore action:"get"`** for each model you use to confirm parameter names, aspect ratios and media roles. Don't guess. Suggested models:
  - **Mockup boards, storyboard, art-directed imagery:** `gpt_image_2` (art direction, text in layout) or `nano_banana_pro` (photoreal, reference-driven). Request the highest quality setting.
  - **Logo family / icon set / vector-ish brand assets:** `recraft_v4_1` with `model_type: "vector"` (or `"utility_vector"`), `colors: [<palette hexes>]`, `background_color: <ground hex>`.
  - **Hero film:** `seedance_2_5` (mode `omni_reference` with the storyboard as `image_references`, duration 15, resolution 1080p, `generate_audio: false`, aspect 16:9). Alternative: `flux_3_video`.
- Use the `*_batch` tools for independent images, then `jobs_wait`, then ONE `show_generation_by_ids` to display them to the owner.
- Download results with `curl -L -o <path> "<url>"`. Working files and rejects go in `refs/` (create it; add `refs/raw/` to `.gitignore` for big raw files but commit the chosen boards in `refs/boards/`). Only final, used assets go in `public/assets/`.
- Do not pass `use_unlim` unless the owner asks.
- Every asset prompt (not boards) ends with: "no text, no letters, no logos, no watermark".
- If a generation is flagged NSFW falsely, remove mood words ("intimate", "ambient", "seamless loop feel") and re-describe it plainly.

### C1. Three hero palette boards (before the palette CHECKPOINT)
Prompt template (16:9, one per palette A/B/C):
> Website design mockup, desktop landing page hero section for "Observer", a small senior software studio. Deep dark theme, ground {GROUND}, text {TEXT}, single accent {ACCENT} used only on one button and one thin line. Full-bleed cinematic background: fine luminous threads tangled in the centre of the frame, beginning to straighten into a single clean line, generous negative space on the left third. Left-aligned headline "Software shaped by real work." in a crisp geometric grotesk (Geist-like), medium weight, tight tracking; one short sub-line; one sharp-cornered solid accent button "Start a conversation". Minimal single-line top nav: Observer eye-in-hexagon mark, Work, Products, Insights, About, Contact. Sharp corners, precision-instrument feel, award-winning web design, professional layout, clear hierarchy. No browser chrome, no watermark, no glow blobs, no stars, no purple.

Show all 3 to the owner with the brief. **CHECKPOINT: the owner picks palette A, B or C** (or asks for a tweak). Lock it in `docs/design-brief.md`.

### C2. Film storyboard (1 image, 16:9)
> Storyboard sheet, 6 panels in a 3x2 grid, showing six keyframes of ONE single continuous slow camera push-in, NOT six different scenes. Matte dark ground {GROUND}. Panel 1: a dense chaotic tangle of hundreds of fine luminous threads in {TEXT} tone, centred, crossing and looping like an overgrown workflow diagram, soft volumetric haze. Panels 2 to 5: the camera moves steadily closer; redundant loops progressively dissolve into faint particles; remaining strands relax and align. Panel 6: one single clean line of light in {ACCENT} running calmly through the centre toward a vanishing point, surrounded by dark negative space. Consistent lens, consistent lighting from upper left, shallow depth of field, cinematic, photoreal. No text, no letters, no panel numbers, no people, no logos.

Show it to the owner (don't block on a reply). Re-roll only on their feedback (max 2).

### C3. Section boards (one per remaining home section + 2 inner pages), 16:9, all in the locked palette
Sections: Two practices diptych · Selected work list · Products panel stack · Engagement diagram · Founder/about · Insights · Closing CTA band + footer · `/work` index page · `/contact` page.

Template:
> Website design mockup, desktop section: {SECTION ROLE + exact planned copy}. Deep dark theme, ground {GROUND}, surface {SURFACE}, text {TEXT}, muted {MUTED}, single accent {ACCENT} used sparingly. Typography: crisp geometric grotesk (Geist-like) with monospace labels. Layout: {LAYOUT FAMILY from the brief + composition anchor}. Sharp corners, thin 1px dividers, precision-instrument aesthetic; motif of tangled lines resolving into one clean line. Professional layout, clear hierarchy and spacing, award-winning web design. No browser chrome, no watermark, no glowing blobs, no stars, no purple, no three identical cards.

Vary the composition anchor per board (at least 3 different anchors). Look at every board. Re-roll anything that looks like a template (centred dark hero with a glow, identical card trio, dashboard spam), max 2 re-rolls total. Save the chosen boards to `refs/boards/<section>.png` and commit. **The boards are the design source of truth for Phase F.**

---

## 6. Phase D: Asset kit (submit as one batch after the boards are locked)

All prompts carry the locked hexes and the spine motif, and end with "no text, no letters, no logos, no watermark". Downscale for the web: hero/section images ≤2000px wide. Export WebP (quality ~80) + keep a JPG/PNG fallback only where needed.

### D1. Logo family (refine the existing mark)
- Reference: `public/favicon-eye.svg` / `public/favicon.svg` (eye inside a hexagon). Read the SVG to describe it accurately.
- Generate with `recraft_v4_1` (`model_type: "vector"`, `colors: [TEXT, ACCENT]`, `background_color: GROUND`):
  > Minimal geometric logo mark: a single-weight line eye inside a regular hexagon, precise 2px-equivalent stroke, the pupil a small solid circle in {ACCENT}, rest in {TEXT}, perfectly symmetrical, flat, no gradients
  Generate 2-3 candidates.
- **Final deliverable is a hand-cleaned SVG** derived from the chosen candidate and the original geometry, using `currentColor` for strokes and an accent fill on the pupil:
  - `public/assets/brand/observer-mark.svg` (mark only)
  - `public/assets/brand/observer-wordmark.svg` (mark + "Observer" set in Geist 600, converted to paths if possible, or as `<text>` with a font fallback)
  - `public/favicon.svg` (simplified: thicker stroke, legible at 16px)
- **Replace all three current logo implementations** (rainbow inline SVG in `index.html`, the variants in `contact.html`/`terms.html`, the PNG in `blog.html`/`coming-soon.html`) with one shared include or `<img src="/assets/brand/observer-mark.svg">`.
- Head kit, generated from the SVG with ffmpeg/sips:
  - `public/favicon.ico` (a **real ICO**, 32px; `ffmpeg -i favicon-32.png favicon.ico`)
  - `favicon-16.png`, `favicon-32.png`
  - `apple-touch-icon.png` (180, opaque GROUND background, padded)
  - `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` (mark inside the 80% safe zone)
  - `public/site.webmanifest` (name "Observer", `theme_color`/`background_color` = GROUND)
  - `<meta name="theme-color" content="{GROUND}">`
- Delete the old heavy logo PNG/JPEG files once nothing references them (grep first).

### D2. Custom icon set
One `recraft_v4_1` vector image: a 3x3 grid of 9 line glyphs in {TEXT} with accent details, consistent 2px stroke, sharp joins, on a solid {GROUND}. Glyphs:
- observe (eye)
- friction (snag in a line)
- remove step (line with a segment lifting away)
- data (stacked strata)
- flow (table rows to arrow)
- architecture (nodes)
- governance (balanced bars)
- research (magnifier over path)
- delivery (line reaching a point)

Slice into 9 files at 256px (ffmpeg crop), run each through `remove_background` (or key out the solid ground), and save as `public/assets/icons/<name>.png` (+ WebP). These replace the generic icons in work tags, products and the engagement diagram. Library icons are OK only for form/UI chrome.

### D3. Social / OG cards (1200x630, generate wide, not crops)
`public/assets/og/og-home.jpg`, `og-work.jpg`, `og-products.jpg`, `og-blog.jpg`, `og-contact.jpg`.

Same template: GROUND field, the tangle-to-line motif on the right two-thirds, empty left third. Generate the art without text, then composite the page title into the left third with ffmpeg `drawtext` using a downloaded Geist TTF (OG images are static files, so the title must be baked in).

Per-post OG: use `og-blog.jpg` unless the post has a cover (D6).

### D4. Placeholders the owner will replace (FIXED FILENAMES; keep these exact paths)
Create `docs/REPLACE_ME.md` listing each file, its required size/aspect, and what the real one should be. The code must reference exactly these paths so swapping the file is all it takes.

| Path | Size / aspect | Placeholder content to generate | Real replacement |
|---|---|---|---|
| `public/assets/team/founder.jpg` | 1200x1500, 4:5 | Abstract placeholder: dark GROUND field with a soft out-of-focus light shape and the eye mark faintly embossed. **No human face** (a fake person on an LLC site is misleading) | Real founder photo |
| `public/assets/team/team-01.jpg`, `team-02.jpg` | 1200x1500, 4:5 | Same abstract treatment, slight variations | Real team photos (optional; hide the slot if the file still matches the placeholder; see below) |
| `public/assets/products/datadragon-01.png` … `-03.png` | 1600x1000, 16:10 | Generated dark product-UI mockups matching the palette: (01) a plain-language query box with an answer card, (02) insight cards with a small chart, (03) a data lineage graph | Real DataDragon screenshots |
| `public/assets/products/tableflow-01.png` … `-03.png` | 1600x1000, 16:10 | (01) a visual workflow builder, (02) a two-way sync table view, (03) an approval flow | Real TableFlow screenshots |

- Product UI placeholder prompt (`gpt_image_2`, 16:10):
  > High-fidelity dark-mode SaaS application screenshot, {SCREEN DESCRIPTION}, ground {GROUND}, panels {SURFACE}, text {TEXT}, single accent {ACCENT}, Geist-like UI typography, sharp corners, realistic but uncluttered, flat front-on screenshot, no device frame, no browser chrome, no logos, no watermark
  UI text in these is acceptable.
- Placeholder detection: add `data-placeholder` handling in code. Keep a small JSON `public/assets/placeholders.json` listing the placeholder filenames with their byte size. The server (or the build of the page) marks `team-01/02` slots hidden if the file size still matches, so unreplaced optional team slots don't show. Founder and product slots always show.
- Also list in `REPLACE_ME.md`: real case-study metrics (enter via admin → Work → metrics), LinkedIn/GitHub URLs, legal address/governing state, contact email, Resend env vars.

### D5. Case-study art (one per work item in `data/work.json`), 16:10, 1600x1000
Abstract, editorial, palette-locked, each depicting the item's specific "before tangle / after clean line" story:
- **Architecture/coordination:** several parallel lanes of threads converging through a single clean interface node.
- **Platform governance:** scattered competing arrows aligning into one ordered queue of light.
- **Product strategy:** a field of unused branching paths fading, one worn path glowing.
- **Agile delivery:** a jittering zig-zag line settling into a steady rhythm.
- One more per extra work item, derived from its title.

Common suffix:
> abstract cinematic 3D render, fine luminous lines on matte {GROUND}, accent {ACCENT} only on the resolved path, soft haze, shallow depth of field, no text, no letters, no logos, no watermark

Save to `public/assets/work/<work-id-or-slug>.webp` and set the `image` field in `data/work.json` (and via admin/DB if Postgres is the live store: note this for the owner).

### D6. Blog covers (16:9, 1600x900), one per existing post in `data/posts.json`
Same abstract language, subject derived from the post title (e.g. "welcome" = an eye opening onto a single line; "unnecessary features" = pruned branches; "real workflow" = a worn footpath of light across a dark field). Save to `public/assets/blog/<slug>.webp`. Add a `coverImage` field to posts (schema: if Postgres, add the column additively in `database/schema.sql` with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS cover_image TEXT`, and map it in the controller).

### D7. Section plates + engagement diagram
- 2 atmospheric plates (2000x1200): a very subtle GROUND-to-SURFACE haze with faint line texture, for the diptych and the closing band backgrounds. Must keep text contrast ≥ AA.
- Engagement diagram (21:9, 2400x1030):
  > art-directed diagram image, left to right: a tangle of threads (observe), a magnifying lens isolating one knot (find friction), segments lifting away (remove steps), one clean line continuing (maintain); palette-locked, elegant, editorial, no text, no letters
  Captions are HTML beneath it.

### D8. State artwork (1:1, 1200x1200)
- `public/assets/states/404.webp`: a single thread that ends abruptly in darkness.
- `public/assets/states/offline.webp`: the eye mark half-closed.
- `public/assets/states/coming-soon.webp`: a thread being drawn, unfinished.

**Coherence check:** after the kit lands, view all assets together **once** (a single contact sheet via `ffmpeg -i ... -filter_complex tile`). Re-generate any piece whose grade fights the boards (name the hexes harder). Make sure everything in `public/assets/` is referenced by a page (gate item).

---

## 7. Phase E: Hero film + scroll-scrub frames

### E1. Generate (ONE call)
`seedance_2_5`, mode `omni_reference`, storyboard job/media as `image_references` (**not** `start_image`), duration 15, 1080p, 16:9, `generate_audio: false`, `bitrate_mode: "high"`. Prompt:
> Single continuous 15-second shot with no cuts. Matte dark background {GROUND}. In the centre of frame, a dense chaotic tangle of hundreds of fine luminous threads in {TEXT} tone, looping and crossing like an overgrown workflow diagram, soft volumetric haze. The camera pushes in slowly at constant speed. As it advances, redundant loops gradually dissolve into faint drifting particles, and the remaining strands relax, align and converge into one single clean line of light in {ACCENT} that runs calmly through the centre toward a distant vanishing point. Ends on the single line surrounded by calm dark negative space. Keep the subject centred; the left and right thirds stay dark and empty. Locked exposure, locked white balance, no flicker, minimal motion blur, no camera shake, slow steady motion only, cinematic photoreal. No text, no letters, no logos, no people.

Budget: one re-roll max if it's off-grade or has a cut. If the re-roll drifts, keep the better take and grade it toward the palette with ffmpeg (`eq`/`colorbalance`/`curves`).

Save the raw file to `refs/raw/hero-film.mp4` (gitignored).

### E2. Encode to image sequences (canvas scrub; more reliable than `video.currentTime` scrubbing on iOS)
```bash
mkdir -p public/assets/film/desktop public/assets/film/mobile
# Desktop: 150 frames (10 fps over 15 s), 1600px wide
ffmpeg -i refs/raw/hero-film.mp4 -vf "fps=10,scale=1600:-2:flags=lanczos" -c:v libwebp -quality 72 -compression_level 6 public/assets/film/desktop/f_%03d.webp
# Mobile: same frames, centre-cropped to 9:16-safe 4:5 then 720px wide
ffmpeg -i refs/raw/hero-film.mp4 -vf "fps=10,crop=ih*4/5:ih,scale=720:-2:flags=lanczos" -c:v libwebp -quality 68 public/assets/film/mobile/f_%03d.webp
# Posters = first and last frames (for first paint and reduced motion)
cp public/assets/film/desktop/f_001.webp public/assets/film/poster-start.webp
cp "$(ls public/assets/film/desktop/f_*.webp | tail -1)" public/assets/film/poster-end.webp
du -sh public/assets/film/desktop public/assets/film/mobile
```
Byte budget: desktop ≤ 15 MB total, mobile ≤ 6 MB. If over, lower the quality or use fps=8. Write `public/assets/film/manifest.json` with `{ "count": N, "desktop": "/assets/film/desktop/f_%03d.webp", "mobile": "/assets/film/mobile/f_%03d.webp" }`.

### E3. Scrub engine (vanilla JS, `public/scripts/film-scrub.js`)
- Markup: a `<section class="film" style="height: 400vh">` containing a `position: sticky; top: 0; height: 100dvh` wrapper with a `<canvas>` and the 4 chapter `<article>`s (server-rendered, real text, in DOM order).
- Load GSAP + ScrollTrigger + Lenis from jsDelivr (CSP already allows `cdn.jsdelivr.net`). Pin versions. Bridge Lenis to GSAP with `lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0)`.
- Choose the mobile set when `matchMedia('(max-width: 767px)')`.
- Paint `poster-start` immediately on load (screenshot-safe at scroll 0). Then preload frames in priority order: every 10th first, then fill in. On each ScrollTrigger `onUpdate`, compute `idx = Math.round(progress*(N-1))` and draw the nearest **loaded** frame with cover-fit on a DPR-aware canvas inside `requestAnimationFrame`. Never put per-frame values in DOM attributes or re-layout.
- Chapters: use the same ScrollTrigger progress to switch the active chapter (transform/clip only, never fade from opacity 0). The active state must also be visible to screen readers (`aria-current` on the chapter) and not hover-only.
- Use `pinSpacing` sensibly. Verify a full-page screenshot has no large blank band after the film.
- `prefers-reduced-motion: reduce`: no pin, no frame loading; render `poster-end.webp` as a static image with all 4 chapters stacked as normal content.
- Resize: re-fit the canvas on `resize` (debounced).
- Teardown is not needed (multi-page site), but avoid leaks.

---

## 8. Phase F: Rebuild the public site to the boards

### F1. Server-rendered pages
Pages must contain their real content in the HTML for SEO (work, products, posts, FAQ). Add **EJS** (`npm i ejs`, `app.set('view engine','ejs')`, `views/` dir) with partials:
- `partials/head.ejs`: title, description, canonical, OG/Twitter tags, JSON-LD slot, fonts, CSS.
- `partials/nav.ejs`: mark, links, mobile menu button.
- `partials/footer.ejs`.

Routes render from the same data services the API uses (`DbService`/`DataService` via the controllers' service instances; factor a small `services/contentService.js` to avoid duplication):

| Route | View |
|---|---|
| `/` | `views/home.ejs` |
| `/work` | `views/work.ejs` |
| `/products` | `views/products.ejs` |
| `/products/:slug` | `views/product.ejs` (new; detail page per product with screenshots gallery) |
| `/blog` | `views/blog.ejs` (server-render first page; keep client JS for search/filter/pagination) |
| `/blog/:slug` | `views/post.ejs` (server-render title/meta/body via `markdownService`; 404 if missing) |
| `/contact` | `views/contact.ejs` |
| `/privacy`, `/terms` | `views/privacy.ejs`, `views/terms.ejs` |
| 404 | `views/404.ejs` |
| `coming-soon`, `offline` | Retire `coming-soon` unless something still needs it; keep `offline.html` static for the service worker |

Leave the admin HTML (`public/admin/*`) as-is apart from the logo swap.

### F2. Styles
Replace `public/styles/styles.css` with a fresh `public/styles/site.css` built from the brief's tokens:
- `:root` custom properties for the locked palette, type scale, spacing scale, `--radius: 0`.
- One theme (dark) on every section.
- Real `:focus-visible` rings in ACCENT on links, buttons and inputs.
- Use `min-h-dvh` semantics (`100dvh`), never `100vh`, for full-height blocks.
- Explicitly declared mobile collapse for every multi-column section.
- Muted text ≥ 4.5:1.
- No global hover glow.

Each CTA from the inventory gets its **own** class/component (`.cta-primary`, `.cta-inline`, `.cta-framed`, `.cta-text`); no shared generic `.btn` style. Delete unused CSS files once nothing references them.

### F3. Navigation
- Single-line desktop nav ≤80px tall.
- **Mobile:** a menu button (`aria-expanded`, `aria-controls`) opening a full-screen panel. Focus trap while open, Esc closes it, body scroll locked.
- Clean URLs only.

### F4. Remove the weight
Delete or unreference:
- the Three.js import maps
- `galaxy-background.js`, `mesh-background.js`, the black-hole scripts
- Lottie
- magnetic-button code
- SVG `<animate>` gradients
- nebula/orb elements

Grep `public/` for `three`, `lottie`, `galaxy`, `nebula`, `orb`, `magnetic`, `mesh-background`. Keep the service worker, but register it site-wide only if it's still useful (it must follow A10's no-cache rules).

### F5. Content rendering rules
- Testimonials section: render only if `testimonials.length > 0` (published). Otherwise omit the whole section, heading included.
- FAQ: render only if there are FAQs. Otherwise omit. Write 5-6 real FAQs into `data/faqs.json` from the brief (what an engagement looks like, timelines, who you work with, pricing approach "scoped per engagement after a short call", products vs consulting, data handling). Mark them for owner review in `REPLACE_ME.md`.
- Work metrics render only when `metrics[]` has non-empty values.
- Product modal CTA: link to `/products/<slug>`. If `externalUrl` is set, also show "Visit <product>" opening in a new tab.
- Blog author: show "Observer team" (or the founder's real name once provided via `settings`), never the handle.
- Footer social links: only render if `settings.social.linkedin/github` are real URLs.

### F6. SEO / meta (in `partials/head.ejs`)
- Unique title + description per page.
- `<link rel="canonical" href="{SITE_URL}{path}">`.
- `og:title/description/url/type/image`, with the absolute image URL from D3 (posts: their cover).
- `twitter:card=summary_large_image`.
- JSON-LD:
  - Home: `Organization` (name "Observer", `parentOrganization`: `{ "@type": "Organization", "name": "Techademy LLC" }`, url, logo, sameAs only for real profiles).
  - Products: one `SoftwareApplication` each.
  - Posts: `BlogPosting` with `datePublished` and `image`.
  - Inner pages: `BreadcrumbList`.

### F7. Accessibility pass
- Heading order (one h1 per page, no skipped levels).
- `alt` text on every content image; `alt=""` + `aria-hidden` on decorative ones.
- Contact form: labels above inputs, error text below, `autocomplete` attrs (`name`, `email`, `organization`), an `aria-live="polite"` status region.
- The product modal (if kept) gets `role="dialog"`, `aria-modal`, a focus trap and Esc to close. Remove `aria-hidden` from the open dialog.

---

## 9. Phase G: Content + legal

- **Privacy page** `/privacy` (split out of `terms.html`) and **Terms** `/terms`:
  - Legal entity "Techademy LLC" (Observer is a Techademy LLC company).
  - Contact email placeholder `{{CONTACT_EMAIL}}`. **Do not invent an address or state.** Put `{{LEGAL_ADDRESS}}` and `{{GOVERNING_STATE}}` in `REPLACE_ME.md`, and have the views render them from `settings` (add fields) so the owner fills them in admin. If unset, omit those sentences rather than printing placeholders.
- Make the privacy text match reality: only essential cookies (session for the admin area; CSRF), no analytics, no tracking. Remove "IP addresses for tracking purposes". Contact-form data is stored and emailed to the owner via Resend.
- Cookie banner: "This site uses only essential cookies. No tracking or analytics." Better still, since public pages no longer set cookies after A5, show the banner only on `/observe` and `/admin`, or remove it entirely and keep the privacy statement. Pick the latter unless analytics are added later.
- Copy pass on every visible string: no em/en-dashes, one CTA label per intent, ≤8-word headlines, plain functional copy, © 2026.
- The blog keeps its existing posts. Fix the author display (F5) and add covers (D6).

---

## 10. Phase H: Quality gate (all must pass before handing back)

Run and fix until clean:
```bash
# Placeholders / template tokens left in views (except REPLACE_ME.md)
grep -rnE "lorem|TODO|\{\{[A-Z_]+\}\}|<\.\.\.>" views public --include=*.ejs --include=*.html --include=*.js | grep -v REPLACE_ME
# Em/en dashes in visible text
grep -rn "—\|–" views public/*.html data/*.json
# Banned palette remnants
grep -rniE "#7c9bdd|#4facfe|#43e97b|#667eea|#764ba2|#8b5cf6|#a855f7|#7c3aed|#22d3ee|#3b82f6" public/styles views
# Dead effects
grep -rniE "three(\.module)?\.js|lottie|galaxy|nebula|magnetic|mesh-background" views public --include=*.ejs --include=*.html --include=*.js
# 100vh usage
grep -rn "100vh" public/styles
# Every asset referenced
for f in $(find public/assets -type f \( -name "*.webp" -o -name "*.png" -o -name "*.jpg" -o -name "*.svg" \) ! -path "*/film/*"); do n=$(basename "$f"); grep -rq "$n" views public/scripts public/styles data public/*.webmanifest || echo "UNUSED $f"; done
```
Then check:
- [ ] Phase A curl tests still pass. `npm audit --omit=dev` has no high/critical issues (fix or report).
- [ ] `prefers-reduced-motion` respected everywhere (test with the browser preview's emulation or by toggling the media query in devtools).
- [ ] Browser preview at desktop and `resize_window preset:"mobile"`:
  - every page renders
  - the mobile menu works
  - the film scrubs both directions
  - no blank band after the film
  - no console errors (`read_console_messages onlyErrors:true`)
  - reset with `preset:"desktop"` afterwards
- [ ] Lighthouse (if available via `npx lighthouse http://localhost:3000 --only-categories=performance,accessibility,best-practices,seo --quiet --chrome-flags="--headless"`): target ≥90 on all four. Report the actual numbers honestly.
- [ ] View source of `/`, `/work`, `/products`, `/blog/<slug>`: real content, title, canonical, OG and JSON-LD are present without JS.
- [ ] `docs/REPLACE_ME.md` is complete.
- [ ] Commits are clean and on the branch.

### Hand back to the owner
- Summarise what changed, the Lighthouse scores, and the credits used (from `balance`).
- List what the owner must do:
  - Railway env vars: `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`, `SITE_URL`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `DATA_DIR=/data`
  - Attach a volume at `/data`
  - Replace the placeholder files from `REPLACE_ME.md`
  - Enter real metrics, legal address/state and social URLs in admin
  - Re-register their passkey if the domain changed
- **Ask before pushing or opening a PR.** If they say yes: push the branch and open a PR to the default branch (PR body ends with the attribution line from the session's system reminder).

---

## 11. Guardrails

- Never generate fake testimonials, fake people presented as team members, or invented performance statistics.
- Never put secrets in chat or code. Env vars only.
- Don't use Higgsfield website hosting tools. Don't publish anything to the Higgsfield community feed.
- Don't push, deploy or open PRs without an explicit owner "yes".
- Keep the admin panel working throughout. After Phase A and again after Phase F, log in at `/observe` with the local dev admin (from `.env` / defaults) and confirm the dashboard loads and saves a work item.
- If something in this plan turns out wrong against the actual code, fix it the sensible way and note the deviation in your final summary.
