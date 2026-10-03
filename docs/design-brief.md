# Observer design brief

Contract for every later phase. Edit this file (and say why) before deviating from it.

**Design read:** Observer is a small senior studio for operations, product and engineering leaders who are tired of software people have to work around. Register: calm, exact, quietly confident.

**Concept spine:** Noise resolving into a clear path. Observer watches messy real workflows and removes steps. Motifs: tangled threads that untangle into one line; an eye bringing something into focus; a precision instrument. Dividers are single clean lines. Case-study art shows "before tangle, after line".

**Delivery tier:** cinema (scroll-scrub hero, scroll chapters). As built: native scroll plus requestAnimationFrame easing on a canvas of pre-rendered frames. No GSAP, Lenis or any third-party script, which keeps the page light and CSP-safe.

**Animation mode:** animated-website. Journey shape: single-shot (one ~15 second continuous film, scrubbed end to end).

**Practices (equal weight):** Consulting and Products (DataDragon, TableFlow) are presented as one studio that does both.

## Journey (chapters over the film)

1. "Software shaped by real work." (establishing, the tangle)
2. "We watch how work actually happens." (camera pushes in)
3. "Then remove the steps that don't matter." (threads untangle)
4. "What's left is clear and stays that way." (single clean line). CTA: "Start a conversation".

World grammar: matte dark ground, fine luminous threads in the text tone, haze, upper-left light, shallow depth of field. The resolved line is the only accent colour. Subject centred; left and right thirds stay dark and empty (copy sits there). Mobile framing: centre-safe 4:5 crop.

Delivery budget: desktop frames at most 15 MB, mobile frames at most 6 MB.

## Palette (LOCKED: option B, Smoke + Signal Coral, picked by owner)

| Role | Hex | Contrast on ground |
|---|---|---|
| Ground | #121113 | |
| Surface | #1B1A1C | |
| Text | #ECE8E4 | 15.5:1 |
| Muted | #A39E99 | 7.1:1 (6.5:1 on surface) |
| Accent | #E0565B | 5.1:1 |

Defense: one warm decisive signal on neutral smoke. In the film the whole tangle is neutral white and ONLY the resolved line is coral, so the accent means "the answer".

Rules: exactly one accent, used sparingly (CTAs, the resolved line, focus rings). Button label on the accent is the ground colour #121113 (5.1:1), never white (3.7:1 fails AA). Coral never signals errors; form errors use text colour plus an icon and message, not red. Banned: near-black plus orange/amber, near-black plus neon cyan/blue/green, purple/violet glow, beige plus brass, and the legacy steel-blue (#7c9bdd) scheme.

## Type

Geist (display and body) plus Geist Mono (labels, metrics). No serif. Display: tight tracking, weight 500-600. Body: 16-18px, line-height 1.6, max 65ch. Corner language: all sharp (0-2px radius).

## Section plan (home)

1. Hero / film journey: pinned full-bleed scroll-scrub canvas, four chapters overlaid, copy in the left third.
2. Two practices: colour-blocked diptych. Consulting left, Products right, equal weight, one line and one inline CTA each.
3. Selected work: editorial list rows (title, sector, year, metrics if present). Hover/focus reveals the case-study image in a fixed frame.
4. Products: product panel stack, one full-width panel per product with a screenshot, two-line description, "Explore DataDragon" / "Explore TableFlow".
5. How an engagement runs: one full-bleed art-directed diagram with a 3-4 step caption row. No card trio, no numbering.
6. About / founder: split layout (used once). Founder portrait plus a short first-person note and the Techademy LLC line.
7. Insights: asymmetric, one large latest post and two compact rows.
8. Closing CTA band: oversized single line "Tell us where the work gets stuck." plus the CTA.
9. Footer: mark, nav, social links only if real, "Observer is a Techademy LLC company.", Privacy, Terms.

Eyebrow ration: at most 3 uppercase eyebrow labels on the home page.

## CTA inventory (one label per intent, site-wide)

| Label | Destination | Garment |
|---|---|---|
| Start a conversation | /contact | Primary: solid accent block, sharp corners, arrow nudges right on hover |
| See the work | /work | Underlined inline link plus arrow |
| Explore DataDragon / Explore TableFlow | /products/<slug> | Framed outline block |
| Read the note | /blog/<slug> | Plain text link |

Never also use "Contact us", "Get in touch" or "Let's talk".

## Copy rules

Headlines at most 8 words, sub-paragraphs at most 25. No em or en dashes in visible text (titles included, use "|"). No invented performance stats. No "Elevate / Seamless / Unleash". Founded 2024; senior team with long careers in enterprise platforms. Observer is a Techademy LLC company.

## Motion rules

One signature effect: the scroll film. Everything else is transform-only reveals that never start at opacity 0. All motion is gated by prefers-reduced-motion (static final frame, no pin). Removed: galaxy canvas, nebula and orbs, Three.js black hole, magnetic buttons, global hover glow, animated SVG gradients.

## Asset plan

Logo family (SVG), head kit, icon set (9 glyphs), OG cards (home, work, products, blog, contact), founder and team placeholders, DataDragon and TableFlow screenshot placeholders, case-study art per work item, blog covers, two section plates, engagement diagram, state art (404, offline, coming soon), hero film frames. Paths are listed in docs/REDESIGN_PLAN.md section 6.

## As built (deviations and additions)

- Hero film: single 15s take (Seedance 2.5, 1080p), encoded to 150 webp frames per size (desktop 1600px, mobile 720px 4:5 crop), neutral colour grade applied in post. The first frame matches the poster; the other 149 load after the page is idle.
- Layout: the scrubbing layout renders from first paint (`html.film-live`, set by a tiny inline script only when motion is allowed). Reduced motion or a failed manifest falls back to a static stacked layout with the final frame.
- Pages are server-rendered (EJS) for search engines. Blog search, category filters and pagination are plain query-string pages with no client JavaScript.
- Nav "About" links to `/#about`. Footer social links and testimonials render only when real data exists.
- Contact email is deliberately not printed on the site; the form is the channel.
- Case-study art exists for the first 8 work items; the other 12 render text-only.
