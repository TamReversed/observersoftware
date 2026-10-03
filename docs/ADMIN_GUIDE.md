# Admin guide

Sign in at `/observe`. Everything you can change without touching code lives here.

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
