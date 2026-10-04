# Observer: polish, wow and security pass

Reviewed 4 October 2026 on `main` at `1705c2d`. No site files were changed. Nothing here is implemented until you approve the plan in section 7.

Inputs used: Express 4 + EJS on Railway; live site `observersoftware-production.up.railway.app` (passive checks only); brand words calm, exact, quietly confident; one action "Start a conversation"; Higgsfield budget 150 credits; hero film and opening image are off-limits.

## 1. Executive summary

| Area | Score | Why |
|---|---|---|
| First impression | 8 | The hero says what Observer is and what to do next, and the tangle-to-line image is memorable. |
| Craft | 7.5 | Tight type and spacing system. Losses are in small things: default easing, missing pressed states, an abrupt image swap, a weak closing band. |
| Performance | 6 | Every page except home scores 98 to 100. Home scores 74 to 75 because the film download competes with first paint. |
| Accessibility | 9.5 | Lighthouse 100 on all three pages tested; yesterday's manual pass found no public-page failures. |
| Shareability | 6 | Share cards are well made, but they point at a domain that fails over HTTPS, so links will not unfurl. |
| Security | 8.5 | Yesterday's hardening is live and verified. What remains is owner-side: domain, email records. |

**Wow gap.** The site already has the hard part: one idea (a tangle resolving into a single coral line) carried by a real scroll film. What separates it from a Site of the Day is follow-through after the hero. The line that the film resolves never appears again with the same confidence, the page ends on a dim plate, moving between pages is a hard cut, and the home page's first paint is held back by its own film. The work is to make the rest of the site as exact as the hero.

**Top 5 moves**
1. Stop the film download from delaying first paint on home (P-01).
2. Replace the closing band with the resolved line as a calm horizon, and draw it in on scroll (C-01, moment 1).
3. Add page-to-page view transitions, CSS only (moment 2).
4. Fix the work preview's abrupt swap and stale image (C-02).
5. Get `observersoftware.com` serving over HTTPS so share cards unfurl (S-01, owner action).

## 2. Project map, design DNA, do not touch

**Routes:** `/`, `/work`, `/products`, `/products/:slug`, `/blog`, `/blog/:slug`, `/contact`, `/privacy`, `/terms`, a 404 page, an error page, `/observe` (sign-in), `/admin`.

**Where things live:** pages in `views/*.ejs` with partials in `views/partials/`; one stylesheet `public/styles/site.css` (28.6 KB, tokens at lines 8 to 21); scripts `public/scripts/site.js` (6.4 KB), `film-scrub.js` (10.6 KB), `film-live.js`; headers and CSP in `server.js`; images under `public/assets/`; image build scripts in `scripts/build-*.py`.

**Build:** there is no build step. The server ran in production mode locally without errors; Lighthouse ran against a local server.

**Design DNA**

| Token | Value |
|---|---|
| Colour | ground `#121113`, surface `#1b1a1c`, text `#ece8e4`, muted `#a39e99`, accent `#e0565b`, lines at 14% and 32% of text colour |
| Type | Geist 400/500/600, Geist Mono 400/500, self-hosted woff2 |
| Scale | display `clamp(2.5rem, 6.6vw, 5.75rem)` at 0.98 line-height and -0.04em; title up to 3.75rem; subtitle up to 2.25rem; body 17px at 1.6; mono labels 13px uppercase |
| Layout | max width 1360px, gutter `clamp(20px, 4vw, 56px)`, nav 72px |
| Radius | 0 everywhere |
| Motion | one curve `cubic-bezier(0.22, 1, 0.36, 1)`; durations 0.2s to 0.8s |
| Imagery | matte dark ground, fine luminous threads, haze, upper-left light, coral only on the resolved line |

**Inconsistencies found**
- Four raw colours bypass the tokens: `#ea6a6f` (twice, accent hover), `#d8d3ce`, `#d3cec9`.
- Nine transitions use the browser's default easing instead of `--ease` (site.css lines 53, 60, 63, 82, 165, 166, 318 and two more).
- Durations are ad hoc: 0.2, 0.22, 0.25, 0.3, 0.35, 0.55, 0.65, 0.8s.

**Do not touch:** palette B, Geist, sharp corners, the eye/hexagon logo, the hero film and opening image, the four hero headlines, the one-accent rule, the page architecture, CTA labels.

## 3. Findings

| ID | Area | Severity | Where | Evidence | Fix | Effort |
|---|---|---|---|---|---|---|
| P-01 | Performance | High | `public/scripts/film-scrub.js:194`, `:40` | Home LCP (the H1) is 10.1s mobile and 25.4s desktop under Lighthouse throttling, although it renders in under 240 ms unthrottled. The frame queue starts at page load and its 111 to 220 requests compete with fonts and CSS. | Start the frame queue 2 seconds after load or on first scroll, whichever comes first, and fetch frames with `priority: 'low'`. | S |
| P-02 | Performance | Medium | `views/partials/head.ejs:31` | Lighthouse reports 1,330 ms of render-blocking on mobile; `film-live.js` is a blocking request for a 2-line script. | Inline it and allow it in the CSP by its SHA-256 hash. `script-src` stays free of `unsafe-inline`. | S |
| P-03 | Performance | Low | `public/styles/site.css:2-6`, `head.ejs:30` | Only Geist Medium is preloaded; body text (Regular) swaps in late. No metric-matched fallback. | Preload Geist Regular; add a `size-adjust` fallback face. | S |
| C-01 | Craft | Medium | `views/home.ejs:155` | The closing band uses the old dim `curve.webp`. It is the last image on the page and the weakest. | New image: the coral line as a level horizon (candidate A below). | S |
| C-02 | Craft | Medium | `views/home.ejs:71`, `public/scripts/site.js` (work preview) | The preview image swaps instantly, and rows without art leave the previous row's image showing. | Cross-fade over 300 ms; rows without art show a neutral plate. | S |
| C-03 | Craft | Low | `public/styles/site.css` lines listed above | Default easing on nine transitions; eight different durations. | Use `--ease` everywhere; three duration tokens (160 ms, 320 ms, 640 ms). | S |
| C-04 | Craft | Low | `public/styles/site.css:53-63` | Only the primary button has a pressed state. Framed buttons, inline links, nav links and work rows have none; the submit button has no busy style. | Add `:active` and `[aria-busy]` styles. | S |
| C-05 | Craft | Low | `public/styles/site.css` | Four raw hex values outside tokens. | Add `--accent-hover` and `--text-soft`. | S |
| C-06 | Craft | Low | `public/styles/site.css` | No print stylesheet; a post or case study prints white-on-dark with the nav. | Add a small `@media print` block. | S |
| C-07 | Craft | Low | `public/sw.js:21` | `console.log` in production. | Remove. | S |
| C-08 | Content | Medium | `data/work.json`, `docs/REPLACE_ME.md` | 12 of 20 work items have no art; founder photo and product screenshots are placeholders. | Owner: real photo and screenshots. Art for the 12 items is a Proposal (section 5). | M |
| S-01 | Shareability | Medium | Railway + DNS | `https://observersoftware.com` does not answer; canonical and `og:image` use it. Links will show no preview in iMessage, Slack, LinkedIn or Discord. | Owner: add the custom domain in Railway and point DNS at it. | S |
| S-02 | Shareability | Medium | Live database | The "Test" post is still in the live sitemap and two sample testimonials are still published. | Owner: run `scripts/sync-content.js`, unpublish them. | S |

Polish sweep (one item): hero art is one 4096 px file for all desktop widths (fine, and off-limits); admin dashboard styles were not re-reviewed in this pass.

**Clean:** typography (balanced headings, pretty body wrap, 52ch leads), contrast, focus rings, selection colour, reduced-motion handling, image dimensions (CLS 0 on every page), share images (1200×630 with real rendered text), favicon set, structured data, 404 page art.

## 4. Security report

No new findings. Re-verified today:

- **Live headers:** CSP with `script-src 'self'`, HSTS one year with subdomains, `X-Frame-Options: DENY`, `Permissions-Policy`, `nosniff`, `Referrer-Policy`, COOP and CORP all present; `security.txt` returns 200.
- **Dependencies:** `npm audit` reports 0 vulnerabilities.
- **Source:** no secrets, no source maps, no EXIF or GPS data in shipped images, no unsafe HTML sinks on public pages.

The header config is already in `server.js` (helmet), so there is nothing to paste. P-02 adds one hash to `script-src`.

**Still open, owner-side**
1. Custom domain over HTTPS (S-01). After that, HSTS preload becomes possible.
2. Email records: no SPF, DKIM or DMARC on `observersoftware.com`.
3. `LEGAL_ADDRESS` and `GOVERNING_STATE` in Railway.

**Post-deploy checks to run after the domain is live**

```bash
curl -sI https://observersoftware.com/ | grep -iE "strict-transport|content-security|x-frame"
```

```bash
dig +short TXT _dmarc.observersoftware.com
```

## 5. Higgsfield asset brief

**Model:** `gpt_image_2_5`, the same model that made yesterday's Consulting and Products panels, so the new image matches them. Balance at start 597.25.

**Visual bible:** matte near-black smoky ground `#121113`; fine silver-white luminous threads; soft key light from the upper left; shallow depth of field; fine grain; coral `#E0565B` only on the single resolved line; no people, text, logos, purple, blue, neon or orange. Mood: restrained, exact, quietly confident.

**Slot generated: closing band** (`views/home.ejs:155`, 16:9, headline sits upper left). Three candidates are in `refs/raw/closing/` with `contact-sheet.jpg`:

| Rank | Candidate | Why |
|---|---|---|
| 1 | A, horizon | The coral line runs level across the lower third to a bright point at the right. It reads as the hero's line, arrived and calm, and leaves the whole upper left for the headline. |
| 2 | C, arc | Clean, but close to the image being replaced. |
| 3 | B, knot | The knot pulls the eye away from the headline and call to action. |

**Credits:** about 0.4 spent on the three candidates. Finishing candidate A needs one 4K upscale, about 9.4 credits (yesterday's upscales cost that each). Total for this pass about 10 of 150.

**Proposal, not in the plan:** art for the 12 work items without images, about 1 credit for candidates plus 9.4 per upscale (about 115 credits for all 12). Worth doing only after the live work list is cleaned up (S-02).

No video is proposed: the hero film is the site's one motion piece and is off-limits.

## 6. Signature moments

**1. The line arrives.** As the closing band scrolls into view, the coral horizon draws from left to right, then the headline and button settle.
- Fit: it bookends the hero. The film resolves the line; the page ends on it.
- How: a CSS mask on the new image animated with a scroll-driven timeline (`animation-timeline: view()`).
- Degrades: browsers without scroll timelines, and reduced motion, show the finished image.
- Cost: CSS only, no JavaScript. Files: `site.css`, `home.ejs`.

**2. Pages morph, not cut.** Moving between pages cross-fades, and the page title slides into place while the nav stays put.
- How: `@view-transition { navigation: auto; }` plus `view-transition-name` on the nav and page heading.
- Degrades: unsupported browsers navigate as they do now; disabled under reduced motion.
- Cost: about 10 lines of CSS, no JavaScript, no CSP change. Files: `site.css`.

**3. The button pulls a line.** On hover or focus, a 1px coral line extends from the right edge of the primary button while the arrow advances; pressing it compresses 1px.
- Fit: the brand's one motif, applied to the one action.
- Degrades: no hover on touch, so the button is unchanged there; instant under reduced motion.
- Cost: CSS only. Files: `site.css`.

## 7. Implementation plan (waiting for approval)

Branch `review/polish`, one commit per ID.

**Quick wins (under an hour)**
1. P-01 delay and deprioritise the frame queue.
2. P-02 inline `film-live` with a CSP hash.
3. C-07 remove the console log.
4. C-03 and C-05 easing, duration and colour tokens.
5. C-04 pressed and busy states.

**This week**
6. C-01 upscale candidate A (about 9.4 credits), build it into `public/assets/plates/closing.webp`, wire it in.
7. C-02 work preview cross-fade.
8. P-03 font preload and fallback face.
9. C-06 print stylesheet.

**Signature moments**
10. Moment 2 (view transitions).
11. Moment 3 (button line).
12. Moment 1 (closing line draw), after step 6.

**Owner actions:** S-01, S-02, email records, real photo and screenshots.

## 8. Verification checklist

Baseline to beat (Lighthouse, local):

| Page | Mobile perf | Mobile LCP | Desktop perf | Desktop LCP |
|---|---|---|---|---|
| Home | 74 | 10.1 s | 75 | 25.4 s |
| Work | 98 | 2.3 s | 100 | 0.6 s |
| Contact | 99 | 1.8 s | 100 | 0.4 s |

Accessibility, best practices and SEO are 100 on all three; CLS is 0.

After implementation:
- Re-run Lighthouse on the three pages; target home LCP at or under 2.5 s on mobile.
- Run `node scripts/smoke-cms.js` (127 checks) and `node scripts/audit-routes.js`.
- Confirm the CSP header still has `script-src` without `unsafe-inline`, and the console shows no CSP errors on `/`, `/work`, `/contact`.
- Keyboard pass through home and the contact form.
- Screenshots of home at 375, 768, 1440 px, with reduced motion on and off.
