# Observer website review

Reviewed 3 October 2026. Code at `main` commit `f8587c8` (PR #12 merged).

| | |
|---|---|
| Live site (read-only checks) | https://observersoftware-production.up.railway.app |
| Local copy (full checks, signed in with the seed test account) | http://localhost:3111, JSON-file storage |
| Stack | Node, Express 4, EJS pages, Postgres (JSON files locally), `express-session`, custom one-time-code and passkey sign-in, Resend for email, Railway hosting |
| Purpose | Marketing site for Observer (consulting, DataDragon, TableFlow) with a private admin area. Sensitive data: contact-form messages and admin sign-in secrets. |

The fixes are in `EXECUTION_PLAN.md`. Finding IDs here match the task references there.

## Executive summary

The site is in good shape on the things that usually go wrong. I found no critical or high-severity problems. Nobody can reach admin data without signing in, the public pages are free of script-injection holes, and no secrets are exposed in the site or its git history.

The real weaknesses are of three kinds:

- **Configuration and content on the live site.** The site tells search engines and link previews that it lives at `https://observersoftware.com`, which does not work over HTTPS. The live database also still shows test and placeholder content.
- **Account-security gaps.** A reset password does not sign out existing sessions, and admin usernames are discoverable.
- **The admin dashboard.** It is unusable on a phone and has keyboard and screen-reader gaps.

### Top 5 risks

1. **INFRA-01 (Medium).** Canonical links, the sitemap, link-preview images and passkeys all point at `https://observersoftware.com`, which fails over HTTPS. Search engines and shared links are being sent to a dead address.
2. **UX-01 (Medium).** The live site shows a post titled "Test", testimonials from "John Doe" and "Anonymous" with typos, five products and 20 generic work items. This undermines credibility for an LLC site.
3. **SEC-01 (Medium).** Resetting a password, resetting one-time codes or revoking passkeys leaves that account's existing sessions signed in for up to 24 hours.
4. **SEC-02 (Medium).** Admin usernames can be discovered three ways. A known username lets anyone lock that account's one-time-code sign-in for up to 24 hours at a time.
5. **PERF-01 (Medium).** The home page film downloads 23 MB on desktop and 14 MB on phones, over the design brief's budget of 15 MB and 6 MB.

### Counts by severity

| Severity | Count | IDs |
|---|---|---|
| Critical | 0 | |
| High | 0 | |
| Medium | 7 | SEC-01, SEC-02, INFRA-01, UX-01, UX-02, A11Y-01, PERF-01 |
| Low | 20 | SEC-03 to SEC-10, INFRA-02, UX-03 to UX-07, DES-01, DES-02, A11Y-02, A11Y-03, A11Y-04, PERF-02 |
| Informational | 6 | SEC-11, INFO-01 to INFO-05 |

### Not tested, and why

- **Signed-in behaviour on the live site.** Scope was read-only on production. All signed-in checks ran against the local copy, which uses JSON files, not Postgres.
- **Rate limits and lockouts on the live site.** Proving them needs repeated failed sign-ins, which the scope rules out. They were confirmed locally and in code.
- **Whether contact-form email actually sends.** That needs a real form submission on the live site. `RESEND_API_KEY` and the sender domain could not be seen from outside.
- **Passkey sign-in end to end.** It needs a physical authenticator, and the live passkey address does not match the Railway address (see INFRA-01).
- **Railway settings**: volume, environment variables, database backups, access controls. These are not visible from outside.
- **Malformed-URL handling on the live site.** One probe returned a 502 from Railway's edge, not from the app. I confirmed the site stayed healthy and did not repeat it. Locally the app answers 400.
- **Lighthouse scores.** Not re-run in this review; performance findings come from measured file sizes and headers.

### What checked out clean

| Area | Result |
|---|---|
| TLS | TLS 1.0 and 1.1 refused, 1.2 and 1.3 accepted, valid Let's Encrypt certificate, HTTP redirects to HTTPS, HSTS for one year |
| Session cookie | `HttpOnly`, `Secure`, `SameSite=Strict`, 24-hour life, new session ID on sign-in |
| Cross-origin | No CORS headers; `frame-ancestors 'none'` blocks framing |
| Exposed files | `.env`, `.git/HEAD`, `.DS_Store`, `package.json`, `server.js`, `data/users.json`, source maps, `/debug`: all 404 |
| Admin API without sign-in | All six admin endpoints probed return 401 |
| Path traversal | Four encoded traversal attempts on `/assets` and `/uploads`: all 404 |
| Reflected input | `/blog?q=` output is HTML-escaped |
| Stored content | Public templates escape all data; post and product markdown passes through DOMPurify |
| SQL | All values are parameterised; column names come from fixed field lists, never from request keys |
| CSRF | Every state-changing admin route checks the token (`scripts/audit-routes.js` reports none missing) |
| Uploads | Extension, MIME type and file signature checked; 5 MB limit; images re-encoded; served with `nosniff` |
| Secrets | None in client files. Git history holds only placeholder connection strings and an example session secret. |
| Third parties on public pages | None. No analytics, fonts or scripts from other origins. Public pages set no cookies, as the privacy page states. |
| Public-page accessibility | Skip link, landmarks, heading order, alt text, labels, error messages, focus styles, reduced-motion support, target sizes, and reflow at 320 px all pass. One contrast failure (DES-01). |
| One-time-code sign-in | Serialised attempts, escalating lockout, single-use codes, encrypted secret, identical answers for unknown usernames |

---

## Security

### SEC-01: Existing sessions survive a password or sign-in reset

- **Severity:** Medium. Needs a session to have been stolen or left open first, but then the standard remedy does not work.
- **Status:** Confirmed (source).
- **Location:** `controllers/authController.js:554-578` (`resetPassword`), `:581-595` (`revokePasskeys`); `controllers/totpController.js:179-189` (`adminReset`); `middleware/auth.js:22-25` (`sessionUser`); `services/initService.js:44-57` (`RESET_ADMIN_PASSWORD`).
- **Evidence:** `sessionUser` only checks that the account still exists. None of the reset paths touch the session store, and sessions last 24 hours (`config/index.js:24`).
- **Impact:** If someone gets into an account and the owner resets the password, the intruder stays signed in until their session expires.
- **Recommended fix:** Store a fingerprint of the account's sign-in secrets (password hash plus one-time-code secret) in the session at sign-in, and compare it on every request. Any reset changes the fingerprint and ends every session for that account. This needs no database change, unlike a session-version column. Side effect: everyone is signed out once when this deploys.

### SEC-02: Admin usernames are discoverable

- **Severity:** Medium. With one-time codes as the only factor, a known username is enough to lock the owner out repeatedly.
- **Status:** Confirmed (live and local).
- **Location:** `controllers/postsController.js:95-100, 136-142, 190`; `controllers/authController.js:89-95, 338-344`.
- **Evidence:**
  - The live `GET /api/posts` returns an `author` field on every post, holding the sign-in username of whoever wrote it.
  - Passkey start answers differently for real and unknown usernames (local): `401 {"error":"Invalid credentials"}` for an unknown name, `400 {"error":"No passkey registered for this user"}` for `admin`.
  - Password sign-in timing differs (local, three tries each): unknown username 1 to 2 ms, real username 224 to 230 ms. The password hash is only checked when the account exists.
- **Impact:** Anyone can learn valid usernames. Five wrong codes lock that account's code sign-in for 15 minutes, doubling up to 24 hours. Recovery codes and the reset script still work, so this is disruption, not a break-in.
- **Recommended fix:** Remove `author` from public API responses. Give passkey start one identical answer for every "cannot use a passkey" case. Run a dummy hash comparison when the username is unknown so timing is the same.

### SEC-03: Password sign-in is only throttled per network address, in memory

- **Severity:** Low. Needs many source addresses and a guessable password.
- **Status:** Confirmed (source).
- **Location:** `controllers/authController.js:15-59`; `server.js:139-151`.
- **Evidence:** The lockout key is `ip|username`. The limiter allows 10 failures per 15 minutes per address. Failure counts never decay below the lock threshold, and all of it resets on redeploy.
- **Impact:** An attacker rotating addresses gets five guesses per address per account with no overall cap.
- **Recommended fix:** Add a second counter per username across all addresses: 20 failures locks password sign-in for that username for 15 minutes. Reset stale counts after 15 quiet minutes. This keeps the forgiving per-address behaviour for honest typos.

### SEC-04: Content Security Policy allows inline scripts and a whole CDN

- **Severity:** Low. Defence in depth; no injection point was found.
- **Status:** Confirmed (live header and source).
- **Location:** `server.js:42-67`; `views/partials/head.ejs` (one inline script); `public/admin/login.html:73`, `public/admin/dashboard.html:810`.
- **Evidence:** Live header: `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net blob:`. The policy also allows Google Fonts origins and (outside production) `localhost:7242`, none of which the site uses. The passkey browser library loads from jsDelivr at version 9.0.1 (with an integrity hash) while the server library is 13.2.2.
- **Impact:** If an injection bug ever appears, this policy would not stop the script from running.
- **Recommended fix:** Move the one inline script to a file, self-host the exact passkey library file already in use (verified against its existing integrity hash), and reduce `script-src` to `'self'`. Self-hosting version 9.0.1 unchanged is chosen over upgrading to 13 because passkeys cannot be tested end to end right now.

### SEC-05: Wrong-typed input causes server errors

- **Severity:** Low.
- **Status:** Confirmed (local for sign-in; source for the others).
- **Location:** `middleware/validation.js:165-174`; `controllers/authController.js:97, 557-565`; `controllers/postsController.js:65-85`.
- **Evidence:** `POST /api/auth/login` with `"password":{"a":1}` returns 500 ("data and hash must be strings"). `GET /api/posts?search[]=x` and a post with no excerpt hit `.toLowerCase()` on a non-string. `limit` is unbounded.
- **Impact:** Noisy errors and an easy way to generate 500s. Production hides the detail.
- **Recommended fix:** Require strings in validation and coerce query values.

### SEC-06: Signed-in API responses can be stored by the browser

- **Severity:** Low.
- **Status:** Confirmed (source and local headers).
- **Location:** `server.js` (no cache header for `/api/admin`, `/api/auth`).
- **Evidence:** API responses carry an `ETag` and no `Cache-Control`. Only the backup download and preview pages set `no-store`.
- **Impact:** Contact messages and user lists may be kept in a shared computer's browser cache.
- **Recommended fix:** Send `Cache-Control: no-store` on `/api/admin`, `/api/auth` and `/api/upload`.

### SEC-07: Minor header gaps

- **Severity:** Low.
- **Status:** Confirmed (live headers).
- **Evidence:** No `Permissions-Policy`. `X-Frame-Options: SAMEORIGIN` disagrees with `frame-ancestors 'none'`. `/.well-known/security.txt` returns 404.
- **Recommended fix:** Add a deny-all `Permissions-Policy`, set frame options to `DENY`, and serve a `security.txt` that points to the contact page.

### SEC-08: The service worker stores draft preview pages

- **Severity:** Low.
- **Status:** Confirmed (source).
- **Location:** `public/sw.js:163-175`.
- **Evidence:** Every successful page navigation is written to Cache Storage, including `/?preview=1`, even though the server marks previews `no-store`.
- **Impact:** Unpublished copy stays in the admin's browser cache.
- **Recommended fix:** Skip any URL with a `preview` parameter in the service worker.

### SEC-09: Retired endpoints are still live

- **Severity:** Low.
- **Status:** Confirmed (live).
- **Location:** `routes/homepage.js`, `routes/navigation.js`, `routes/changelog.js` and their controllers.
- **Evidence:** Live `GET /api/navigation` returns 36 KB holding 90 header and 72 footer entries. `GET /api/homepage` returns old copy. Editors can still write to `/api/admin/homepage` and `/api/admin/navigation`. Nothing on the site reads them.
- **Impact:** Unused attack surface and stale public data.
- **Recommended fix:** Delete these three route files and controllers.

### SEC-10: Small hardening items

- **Severity:** Low.
- **Status:** Confirmed (source).
- **Evidence and fixes:**
  - `middleware/csrf.js:28` compares tokens with `!==`. Use a constant-time comparison.
  - `public/scripts/admin-dashboard.js:676` builds an image with an inline `onerror`, which the policy blocks, so broken previews show a broken-image icon. Attach the handler in script.
  - `public/scripts/admin-dashboard.js:1298` writes the first letter of a username without escaping. Escape it.

### SEC-11: One dependency advisory, not reachable

- **Severity:** Informational.
- **Status:** Confirmed (`npm audit`).
- **Evidence:** `uuid` below 11.1.1 has a moderate advisory for `v3`, `v5` and `v6` with a caller-supplied buffer. The site only calls `v4()`.
- **Recommended fix:** Upgrade to `uuid@^11.1.1` to clear the audit.

---

## Infrastructure

### INFRA-01: The configured site address does not work over HTTPS

- **Severity:** Medium.
- **Status:** Confirmed (live).
- **Evidence:**
  - Live pages emit `<link rel="canonical" href="https://observersoftware.com">`, and `og:url` and `og:image` on the same host. `robots.txt` and every sitemap entry use it too.
  - `https://observersoftware.com` does not answer. `http://observersoftware.com` returns a 301 from a parking service (`Server: hcdn`, nameservers `ns1.dns-parking.com`) to the Railway address.
  - `/api/auth/signin-config` reports the passkey address as `observersoftware.com`, so passkeys cannot work on the Railway address.
- **Impact:** Search engines are told the real page is at an address that fails. Link previews cannot load their image. Passkey sign-in is unavailable.
- **Recommended fix:** Owner action, not code. Add `observersoftware.com` as a custom domain on the Railway service and point DNS at it. Details are in the plan's "Requires human action" section.

### INFRA-02: The domain has no email protection records

- **Severity:** Low.
- **Status:** Confirmed for the records; whether Resend sends from this domain needs verification.
- **Evidence:** `observersoftware.com` has no MX, SPF, DMARC or CAA records, and no Resend DKIM record.
- **Impact:** Anyone can send email that appears to come from the domain. If Resend is set to send from it, notifications may be rejected.
- **Recommended fix:** Owner action: verify the domain in Resend and add SPF, DKIM and DMARC.

---

## Interface and content

### UX-01: The live site shows test and placeholder content

- **Severity:** Medium.
- **Status:** Confirmed (live).
- **Evidence:**
  - `/blog` and the sitemap list a post titled "Test".
  - `/api/testimonials` returns two published testimonials, by "John Doe" and "Anonymous". The home page renders one that includes "let's us" and "thigs".
  - `/api/capabilities` returns five products; the design is for two.
  - `/work` shows 20 items with 20 sector filters and no images.
- **Impact:** Visitors and prospective clients see unfinished content.
- **Recommended fix:** Owner action: run `scripts/sync-content.js` against the live database, then unpublish the test post and the testimonials in the admin.

### UX-02: The admin dashboard cannot be used on a phone

- **Severity:** Medium for the admin; no effect on visitors.
- **Status:** Confirmed (local, 375 px).
- **Location:** `public/styles/admin.css:1309-1324`.
- **Evidence:** Below 769 px the stylesheet sets `.sidebar { display: none }` with nothing in its place, so there is no way to reach any section. The header overflows and cuts off Logout.
- **Recommended fix:** Stack the sidebar above the editor on small screens and let the header wrap.

### UX-03: Work page filters push the content off the first screen on phones

- **Severity:** Low.
- **Status:** Confirmed (local and live, 375 px).
- **Location:** `public/styles/site.css:265`.
- **Evidence:** 20 filter links wrap across more than a full screen before the first case study.
- **Recommended fix:** Make the filter a single row that scrolls sideways on small screens.

### UX-04: Errors on pages show raw JSON

- **Severity:** Low.
- **Status:** Confirmed (local).
- **Location:** `middleware/errorHandler.js`.
- **Evidence:** `GET /blog/%E0%A4%A` returns `{"error":"Failed to decode param ..."}` to the browser. Any server error on a page does the same.
- **Recommended fix:** Render a styled error page for non-API requests.

### UX-05: The contact form does not link to the privacy page

- **Severity:** Low.
- **Status:** Confirmed.
- **Location:** `views/contact.ejs`.
- **Recommended fix:** Add one line under the button linking to `/privacy`.

### UX-06: The sitemap omits the privacy page

- **Severity:** Low.
- **Status:** Confirmed.
- **Location:** `routes/seo.js:7`.
- **Recommended fix:** Add `/privacy` to the list.

### UX-07: The terms page has no governing state or business address

- **Severity:** Low.
- **Status:** Likely. The live `/terms` text contains neither, which is what happens when `LEGAL_ADDRESS` and `GOVERNING_STATE` are unset.
- **Recommended fix:** Owner action: set both variables in Railway.

---

## Design

The public design is consistent: one type family, one accent colour, a steady spacing rhythm, no layout shift (every image has dimensions), and no horizontal scrolling from 320 px to 1440 px.

### DES-01: Framed buttons render as grey system buttons

- **Severity:** Low.
- **Status:** Confirmed (local, measured).
- **Location:** `public/styles/site.css:60`; seen on `/blog` (Search) and `/contact` (Send another message).
- **Evidence:** `.cta-framed` sets no background, so a `<button>` keeps the browser's grey fill. Measured text contrast is 4.37:1, below the 4.5:1 minimum (WCAG 1.4.3).
- **Recommended fix:** Give `button.cta-framed` a transparent background.

### DES-02: Admin primary buttons use white text on coral

- **Severity:** Low.
- **Status:** Confirmed (local, measured).
- **Location:** `public/styles/admin.css:104-108`.
- **Evidence:** White on `#E0565B` at 12 px measures 3.72:1 (WCAG 1.4.3 fails). The design brief requires the dark ground colour on the accent (5.1:1), and the stylesheet already defines `--color-on-accent` for it.
- **Recommended fix:** Use `var(--color-on-accent)`.

---

## Accessibility (admin dashboard)

Public pages pass; see the clean list above.

### A11Y-01: Items in the dashboard list cannot be opened with the keyboard

- **Severity:** Medium for a keyboard-only admin.
- **Status:** Confirmed (local).
- **Location:** `public/scripts/admin-dashboard.js:301-330`.
- **Evidence:** Each post, work item and message is a `<div>` with only a click handler: no `tabindex`, no role. WCAG 2.1.1 Keyboard and 4.1.2 Name, Role, Value.
- **Recommended fix:** Make each item focusable with a button role and Enter/Space handling.

### A11Y-02: Seven dashboard inputs have no accessible name

- **Severity:** Low.
- **Status:** Confirmed (local).
- **Location:** `public/admin/dashboard.html`: `workTagInput`, `capabilityIconSvg`, `capabilityIconLottieUrl`, `capabilityFeatureInput`, `screenshotFileInput`, `capabilityScreenshotInput`, `totpConfirm`.
- **Evidence:** No `<label>`, `aria-label` or `aria-labelledby`. WCAG 4.1.2 and 3.3.2.
- **Recommended fix:** Add an `aria-label` to each.

### A11Y-03: Dashboard confirmations are not announced

- **Severity:** Low.
- **Status:** Confirmed (local).
- **Location:** `public/admin/dashboard.html:808`.
- **Evidence:** The toast element has no live-region role. WCAG 4.1.3 Status Messages.
- **Recommended fix:** Add `role="status"` and `aria-live="polite"`.

### A11Y-04: The dashboard has no top-level heading

- **Severity:** Low.
- **Status:** Confirmed (local).
- **Evidence:** Headings start at level 2. WCAG 1.3.1 and 2.4.6.
- **Recommended fix:** Add a visually hidden `<h1>`.

---

## Performance

### PERF-01: The hero film is over its size budget

- **Severity:** Medium on phones.
- **Status:** Confirmed (measured on disk).
- **Location:** `public/assets/film/desktop` (23 MB), `public/assets/film/mobile` (14 MB); `public/scripts/film-scrub.js:38-40`.
- **Evidence:** `docs/design-brief.md` sets a budget of 15 MB desktop and 6 MB mobile. All 220 frames load after the page is idle, at four at a time. Data Saver and 2G/3G visitors already get every other frame.
- **Impact:** A phone visitor on mobile data downloads 14 MB for the home page.
- **Recommended fix:** On phone-width screens, load every other frame (about 7 MB). Frame resolution is unchanged, and the script already blends between neighbouring frames. The desktop size is left alone because the owner asked for the crisp 4K version. This changes how the film feels on phones, so the owner should look at it before merging.

### PERF-02: Replaced images can stay stale for returning visitors

- **Severity:** Low.
- **Status:** Confirmed (source).
- **Location:** `public/sw.js:143-161`.
- **Evidence:** The service worker serves `.png`, `.jpg` and `.svg` cache-first and never refreshes them. The site's workflow is to overwrite team photos and product screenshots at the same filename.
- **Impact:** A returning visitor keeps seeing the old placeholder after the owner replaces it.
- **Recommended fix:** Use network-first for these files. The server already answers with cheap 304 responses.

---

## Informational

- **INFO-01.** `/admin/dashboard.html` and its script load without sign-in. They hold no data, are marked `noindex`, and every data request needs a session.
- **INFO-02.** The footer links to the sign-in page ("Admin") and `robots.txt` names `/observe`. This is intentional: the owner asked for a visible way in.
- **INFO-03.** Resetting another user's password uses a browser `prompt()`, which shows the password as typed with no confirmation.
- **INFO-04.** Minimum password length is 8. Reasonable with the limits in place; a password manager's generated password is advised.
- **INFO-05.** The founder photo and product screenshots are still placeholders (`docs/REPLACE_ME.md`).
