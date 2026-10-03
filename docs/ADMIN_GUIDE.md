# Admin guide

Sign in at `/observe`. Everything you can change without touching code lives here.

## Roles and creating accounts

There are two roles.

| | Admin | Editor |
|---|---|---|
| Posts, Work, Products, Categories, FAQs, Testimonials | yes | yes |
| Site content (edit, preview, publish) and images | yes | yes |
| Their own one-time code or passkey | yes | yes |
| Users (create, delete, change roles, reset passwords) | yes | no |
| Contact messages | yes | no |
| Settings (social links) | yes | no |
| Download backup | yes | no |

**Create an account**: sign in as an admin, open **Users**, press **+ New User**, enter a username and a starting password (8+ characters), pick the role (Editor is pre-selected) and press **Create User**. Give the person those details; they sign in on the Password tab, then can add one-time codes or a passkey under **My sign-in**.

**Change a role**: in the Users list press **Make editor** or **Make admin** next to the person. It takes effect on their very next click, even if they are signed in. You cannot change your own role, and there must always be at least one admin.

**Remove someone**: **Delete**. Their open sessions stop working immediately.

Accounts made before roles existed are admins, so nobody loses access.

## Signing in, and what to do when it will not let you in

`/observe` has one form: type your **username**, pick **Password**, **One-time code** or **Passkey**, and press Sign in. The page remembers your last choice. Pick Password first if your password manager is not filling in.

**Common causes, in the order to check them**
1. **You changed `ADMIN_PASSWORD` in Railway and it did nothing.** That variable is only read the very first time the site starts. `RESET_ADMIN_PASSWORD` is **not a setting that already exists: you add it yourself**:
   1. Open railway.com, then your project, then click the **service** that runs the website (not the database).
   2. Open the **Variables** tab and press **New Variable** (or **Raw Editor**).
   3. Add `RESET_ADMIN_PASSWORD` = `true`, and add or edit `ADMIN_PASSWORD` = your new password.
   4. Press **Deploy** (Railway offers to apply the changes). Wait for it to finish.
   5. Sign in as `admin` with the new password. In the deploy log you will see "PASSWORD RESET".
   6. Go back to Variables and **delete `RESET_ADMIN_PASSWORD`** (otherwise the password resets on every deploy).
   It resets the account named by `ADMIN_USERNAME` (default `admin`), makes it an admin, and turns off its one-time codes.
2. **The account uses one-time codes.** Then only the One-time code tab works for it.
3. **Passkeys on the wrong address.** A passkey only works on the exact address it was created for. Set `WEBAUTHN_RP_ID` (your domain, for example `observersoftware.io`) and `WEBAUTHN_ORIGIN` (`https://observersoftware.io`) in Railway. The Passkey tab tells you when you are on a different address. Password and one-time codes work on any address.
4. **Too many wrong tries.** Five wrong passwords lock that account for 15 minutes; ten failures from one network pause that network for 15 minutes. Successful sign-ins never count. The message says how long to wait.
5. **Cookies blocked.** If you are told you signed in but the browser did not keep the session, allow cookies for the site and try again.

**Check the boot log.** When the site starts, Railway's deploy log prints a **Sign-in setup** report: which accounts exist and any mismatched settings (passkey address, missing volume, and so on).

**Set a password from a terminal instead** (hidden prompt, nothing saved in your shell history):

```
railway run node scripts/set-password.js admin
```

The scripts reach Railway's database through its public address automatically (`DATABASE_PUBLIC_URL`), because the private address only works inside Railway.

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

**Emergency reset** (you lost the vault and the recovery codes). From the project folder, or through Railway (this also lets your password work again):

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
