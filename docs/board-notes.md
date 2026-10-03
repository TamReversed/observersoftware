# Board notes (read before building)

The boards in `refs/boards/` are the layout and style source of truth. They are NOT copy to ship. Build from them, but apply these corrections.

## Locked
- Palette B (see design-brief.md). The tangle is neutral white; only the resolved line and the primary CTA are coral.
- Layout families per section as in the boards: hero film, practices diptych, work list with hover frame, product panel stack, engagement diagram, founder split, insights asymmetric, closing band + footer, work index (left rail + staggered grid), contact (asymmetric, form right).

## Do NOT copy from the boards
- `about.jpg` shows a generated man named "Alex Rivera". Never use a generated face or invented name. Founder slot = abstract placeholder tile (`public/assets/team/founder.jpg`) until the owner supplies a real photo. Name line renders from settings, hidden if unset.
- Footer links (Careers, Pricing, Support, Capabilities, Approach, Guides, Research) are invented. Footer uses only real routes: Work, Products, Insights, Contact, Privacy, Terms.
- Post titles, work titles, sector names and dates on the boards are mock content. Real content comes from the data files.
- Tiny mono eyebrows ("01 / TWO PRACTICES", "PRODUCTS", "ABOUT / FOUNDER") exceed the eyebrow ration. Keep at most 3 on the home page.
- Button labels on coral must be #121113 (the contact "Send message" board shows a light label, which fails contrast).
- Thumbnails showing photoreal dunes are placeholders. Real covers are generated in Phase D in the tangle-to-line language.
- Case-study thumbnails on `page-work` use several coral strands. Real case-study art keeps coral to the single resolved path.

## Film
`storyboard.jpg` shows a push-in to a vanishing point ending on a coral beam. The hero film follows this move. Threads are slightly warm in the storyboard; grade the final film toward #ECE8E4 if it drifts.
