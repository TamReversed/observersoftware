# Admin guide

Sign in at `/observe`. Everything you can change without touching code lives here.

## Signing in with Dashlane one-time codes

You can make the 6-digit code from Dashlane (it changes every 30 seconds) your only sign-in: type your username, then the code. No password.

**Turn it on (once)**
1. Sign in the usual way, open **Users**, and press **Set up one-time codes**.
2. In Dashlane, add a 2FA / one-time code to your Observer login. Scan the QR code with Dashlane, or choose manual entry and paste the key shown under it.
3. Type the code Dashlane now shows and press **Turn on**.
4. **Save the 8 recovery codes** (shown once). Keep them in a Dashlane secure note. Each works one time.

**Signing in afterwards**: go to `/observe`, enter your username and the code. With Dashlane's browser extension the code can fill itself in; a pasted 6-digit code submits automatically. Lost your phone or vault? Press "Use a recovery code instead".

**What happens to the other sign-in methods**: once codes are on, that account's password and passkeys stop working for sign-in. To go back, press **Turn off** (needs a current code or a recovery code).

**Protections, and the honest trade-off**: a code on its own is weaker than a password plus a code, so the account defends itself. Five wrong tries lock it for 15 minutes, and each further five doubles that (up to 24 hours). Each code works once, and guesses made at the same moment still count one by one. Someone who knows your username can deliberately trigger a lockout, which only delays you: use a recovery code, ask another admin to press **Reset one-time code**, or run the emergency script below.

**Emergency reset** (you lost the vault and the recovery codes). From the project folder, or through Railway:

```
node scripts/reset-2fa.js admin
railway run node scripts/reset-2fa.js admin
```

This turns codes off and clears any lock, so the password works again. Only someone with access to the server can run it.

**Railway note**: the secret is stored encrypted using a key derived from `SESSION_SECRET`. If you ever change `SESSION_SECRET`, codes stop validating and you will need the reset above. To avoid that, set a separate `TOTP_ENCRYPTION_KEY` (any long random string) once and never change it.

## What you can edit

| Where | What it controls |
|---|---|
| **Site content** | The home page words (hero headlines, the two practices, section headings, engagement steps, About, closing line, footer line), the home page title and description for search results, and the founder and team photos |
| **Posts** | Blog posts, each with an optional cover image and a Preview button |
| **Work** | Case studies, their image, and real metrics (one `value \| label` per line) |
| **Products** | DataDragon and TableFlow, including screenshots |
| **Testimonials / FAQs** | Each section stays hidden on the site until at least one is published |
| **Settings** | LinkedIn and GitHub links for the footer, and the backup download |
| **Messages** | Contact form submissions |
| **Users** | Admin accounts and passkeys |

## Editing site content safely

1. Open **Site content**, change any text or upload a photo.
2. **Save draft** (or Ctrl/Cmd+S). Visitors see nothing yet.
3. **Preview** opens the real home page with your changes. A coral bar at the bottom says Preview, and only you can see it.
4. **Publish** makes it live. The previous live version is kept automatically.
5. Changed your mind? **Discard changes** returns the draft to what is live. **History** lists earlier live versions; **Restore to draft** brings one back, then preview and publish it.

Leave a field empty (or press "Use original text") to use the original wording. Fields have a character limit, shown under each box. Plain text only: the site never displays HTML you type. Em and en dashes are converted to hyphens to match the site style.

## Posts, work and products

A post, work item or testimonial with **Published** switched off is a draft. Visitors cannot see it. For posts, **Preview** opens it as it will appear.

Images must be uploaded here (JPEG, PNG, WebP or GIF, up to 5 MB). Links to images on other websites are rejected on purpose.

Uploads are tidied automatically: photos are rotated the right way up, hidden metadata such as GPS location is removed, and very large images are scaled down. Visitors on modern browsers are served a much smaller WebP copy, so a big phone photo will not slow the page down. Replacing an image file updates the optimised copy by itself.

## Backups

**Download backup** (sidebar or Settings) saves one JSON file with your posts, work, products, FAQs, testimonials and site content. It never includes passwords, passkeys or contact messages. Download one before any big edit session.

## Safety checks you can run

With the server running (`npm run dev`):

```
npm run test:smoke      # 48 checks: locked-out visitors, CSRF, drafts stay private, escaping, backups, images
node scripts/audit-routes.js   # lists every route that changes data and whether it needs login
```

Both should end with no failures.

## Things to know

- Changing a post's **title** changes its web address (slug). Old links to it will stop working.
- Uploaded images live in `DATA_DIR/uploads`. On Railway that must be a volume (see `docs/REPLACE_ME.md`), or uploads disappear on redeploy.
- On an existing production database, run `scripts/sync-content.js` once after the first deploy (see `docs/REPLACE_ME.md`).
- The Homepage, Navigation, Media and Changelog sections were removed from the admin because they no longer controlled anything on the site.
