# Files and settings to replace with real material

Replace a placeholder by overwriting the file with the SAME NAME and similar aspect ratio. Nothing else needs to change.

## Images (public/assets/...)

| File | Size / aspect | What it is now | Replace with |
|---|---|---|---|
| `team/founder.jpg` | 1200x1500, 4:5 | Abstract dark tile (no person) | Real founder photo |
| `team/team-01.jpg`, `team/team-02.jpg` | 1200x1500, 4:5 | Abstract dark tiles. Hidden on the site while unchanged | Real team photos (optional) |
| `products/datadragon-01.png` .. `-03.png` | 1600x1000, 16:10 | Generated mock UI | Real DataDragon screenshots |
| `products/tableflow-01.png` .. `-03.png` | 1600x1000, 16:10 | Generated mock UI | Real TableFlow screenshots |

Case-study art exists for the first 8 work items only (`work/*.webp`). The other 12 items are text-only until you curate the list. The `icons/` set is used on the engagement steps and product panels.

## Admin panel (/observe, then /admin)

- Work: add real `metrics` (value + label pairs) per case study. The site shows metrics only when present. Delete or rewrite any case study you cannot stand behind.
- Testimonials: add real, permissioned quotes. The section stays hidden until at least one is published.
- FAQs: review the starter answers.
- Settings: contact email, legal address, governing state, LinkedIn and GitHub URLs. Footer social links render only when set.

## Existing Railway database (important)

The app only imports `data/*.json` into an EMPTY database, so your live Postgres keeps its old rows. To bring it up to date (removes the invented statistics, fills missing case-study images, post covers and product screenshots, replaces em/en dashes, adds starter FAQs only if you have none), run once:

```
railway run node scripts/sync-content.js          # dry run, lists changes
railway run node scripts/sync-content.js --apply  # writes them
```

It never overwrites text you wrote yourself, and is safe to re-run.

## Legal pages

`/privacy` and `/terms` describe how the site actually behaves (no analytics, no public cookies, contact messages stored and emailed). Have counsel review them. Set `LEGAL_ADDRESS` and `GOVERNING_STATE` in Railway to print the address and governing-law clause; they are omitted until set.

## Railway

Environment variables: `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`, `SITE_URL`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `DATA_DIR=/data`, optionally `LEGAL_ADDRESS`, `GOVERNING_STATE`. Attach a volume mounted at `/data`.

## Rebuilding assets

Raw generations live in `refs/raw/assets` (not committed). `scripts/build-site-assets.py` and `scripts/build-brand-assets.py` regenerate everything in `public/assets` from them.
