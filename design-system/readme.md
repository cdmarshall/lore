# design-system

Pixel-fantasy design system for **Lore**, an AI second-brain / executive-assistant agent that lives in a folder of markdown files. Lore reads a `CLAUDE.md`, tracks your role, team, stakeholders, and action items, processes meeting transcripts, and ships designed HTML artifacts (a daily brief, an action-items tracker). Its name references accumulated knowledge in the D&D sense; its signet is the scroll 📜, stamped on every signed output.

This system gives Lore a distinct visual identity: **an 8/16-bit sprite aesthetic on a parchment-and-ink base** — ordered-dither textures, hard pixel shadows, square corners, a pixel blackletter display face, and a sprite scroll signet with a touch of arcane magic. Think "a scribe's desk rendered by a SNES."

## Sources

- **Product repo:** — agent logic (`CLAUDE.md`, `VOICE.md`, `workflows/`), the shipped artifact templates (`templates/brief.template.html`, `templates/action-items-artifact.template.html`), and product screenshots (`assets/daily-brief.png`, `assets/action-items.png`, copied into `assets/` here). Explore it to ground new designs in real product behavior.
- **Aesthetic reference:** https://www.tripwire.sh/dither-kit — ordered-dither charts/components for shadcn. We borrow its *language* (Bayer dithers, gradient washes, hatched fills), not its code.
- Base palette lifted verbatim from the repo's `brief.template.html` (paper/ink/gold CSS variables); status hues from the action-items artifact's badge family.

## Products / surfaces

1. **The Daily Brief** — a designed, self-contained HTML digest (masthead, "Needs you" cards with inline draft replies, "Worth knowing", "Knowledge base"). Template: `templates/daily-brief/`.
2. **Action Items** — the live tracker artifact (stat tiles, filter pills, priority-sorted rows, Lore/Specialist delegation chips). Template: `templates/action-items/`.
3. **Signed documents** — meeting notes, weekly reviews, talk tracks; anything carrying the scroll signet.

## CONTENT FUNDAMENTALS

Lore's voice is contract-enforced by `VOICE.md` in the repo. Every artifact this system styles must obey it:

- **Write like a competent colleague in a hurry.** Lead with the point. One idea per sentence. Active voice. Trust the reader.
- **Hard bans:** em dashes (repo-wide!), filler openers ("Just wanted to…"), hedging stacks, corporate connective tissue ("leverage", "circling back"), arrow chains in prose, "not X, it's Y" corrective juxtaposition, listicle payoff hooks ("here's the kicker").
- **Numbers as digits** (3, not three). No adjective where a fact will do ("dropped 40%," not "significantly dropped").
- **Length ceilings:** brief items 2 sentences; Slack replies 1–3 sentences; email under 150 words.
- **Grounding:** every real claim names its source ("blocks [[Q3 Billing Migration]]"). No source = flag, not fact.
- **Casing:** sentence case everywhere, including headings ("Needs you", "Worth knowing"). Small-caps/uppercase is a *typographic* treatment for labels, never shouting in copy.
- **Emoji:** exactly one, the scroll 📜, used as a signet on signed outputs ("Made by Lore 📜"). In this system the sprite scroll (`assets/scroll.svg`) replaces the emoji glyph wherever we control rendering.
- **Personality:** a playful mage-scribe — flavor lives in *structure* (mastheads like "The Monday Brief", a one-line italic "weather report") not in exclamation points. Example weather line: "Manageable Monday: three things genuinely need you before noon, the rest can wait."

## VISUAL FOUNDATIONS

- **Colors.** Parchment paper (`--paper #faf9f6`, band `#f3f0e8`, scroll parchment `#f6efdc`), warm ink (`#26221c` / soft / faint), gold as the signet metal (`#a9862f`, deep `#856a22`), and one magic accent: **arcane purple** (`#6b4f8e`, bright `#7f63b8`, glow `#c9b8ea`) reserved for sparkles, delegation-to-Lore chips, and magical moments. Status hues are muted heraldic: danger `#a4432f`, warn `#b06f2a`, success `#3f6b52`, info `#3a5878`, each with a `-soft` tint. Max 1–2 background colors per artifact (paper + band).
- **Type.** `--font-display: 'Jacquard 24'` (pixel blackletter) for mastheads and big numerals only, always ≥28px. `--font-pixel: 'Jersey 15'` for UI chrome: labels, chips, buttons, counts, nav (chosen over Pixelify Sans for numeral legibility; keep it ≥14px). **Never bold the pixel faces**: Jacquard 24 and Jersey 15 ship one weight (400), so any heavier `font-weight` gets synthesized and the strokes bleed together; use color, size, or letter-spacing for emphasis instead. `--font-serif: Georgia` stack for body copy — long-form reading stays humane; pixel fonts never set paragraphs. Mono for file paths. Labels: uppercase pixel font, tracking `0.08–0.14em`, 13–15px.
- **Dither, not gradients.** Any tonal transition is an ordered dither (8×8 Bayer tiles in `assets/dither/`, tiled with `image-rendering: pixelated`, background-size 16–32px for chunk). Washes (`wash-ink/gold/arcane.png`) ramp density vertically — use as footers, card underlays, section separators. Never a CSS gradient, never a blur.
- **Corners & borders.** Radius is 0 everywhere. Primary containers: `2px solid var(--ink)`. Hairlines: `1px solid var(--rule)`. A "sprite corner" treatment (stepped corners via clip-path or corner pixels) marks hero containers.
- **Shadows.** Hard pixel offsets only: `--shadow-sprite: 3px 3px 0` ink at 22%. No blur radius, ever. Arcane variant for magical elements.
- **Backgrounds.** Flat paper; parchment `#f6efdc` panels for scroll-flavored content; dither washes for depth. No photos, no illustrations except the sprite assets.
- **Animation.** Stepped, not eased: `steps()` timing (e.g. `transition: transform 0.12s steps(2))`, sprite-frame sparkle twinkles via `@keyframes` with `steps()`. Nothing floats or fades smoothly; things *snap*.
- **Hover:** background shifts one dither density up (or `-soft` tint fills); text to `--ink`. **Press:** translate(2px,2px) + shadow collapses to `--shadow-press` — the button physically "sits down."
- **Layout.** 4px pixel grid (`--px`), 720px reading column for documents. Section heads: pixel-font label + 1px rule, count badges in gold-soft.
- **Cards** are white, square-cornered, 1px rule border (2px ink for hero cards), sprite shadow, 18–20px padding.
- **Imagery** is sprite art only: the scroll signet at 16/32/64/128px (always integer multiples of the 20×24 grid, `image-rendering: pixelated`). Warm, low-saturation palette.
- **Transparency/blur:** none. Overlays use dither density instead of alpha.

## ICONOGRAPHY

- **The signet:** `assets/scroll.svg` (20×24 pixel grid, also `scroll.png`). Use at integer scales with `image-rendering: pixelated`. It replaces the 📜 emoji in all designed surfaces; the emoji remains for plain-markdown outputs.
- **Icon set:** the repo has no icon system (it used emoji + unicode glyphs: ✓ `\2713`, ○ `\25CB`, ▸ `\25B8`, → `\2192`). Keep unicode glyphs for inline marks (checks, disclosure carets, arrows) — they render in the pixel font and stay on-theme. For richer icons use **pixelarticons** from CDN (`https://unpkg.com/pixelarticons@1.8.1/svg/<name>.svg`, MIT, 1px-grid style that matches) — recolor via CSS `filter` or inline the path. This is a flagged substitution: no native set existed.
- **Dither tiles:** `assets/dither/` — `ink|gold|arcane|paper` at densities 06/12/25/50, plus vertical `wash-*` ramps. These are brand texture, not decoration; use sparingly (one wash per artifact).
- **Never** use other emoji, rounded-line icon sets (Lucide etc.), or hand-drawn SVG one-offs.

## Fonts

No font binaries ship with the repo. Substitutions from Google Fonts (loaded via `tokens/fonts.css`): **Jacquard 24** (display) and **Jersey 15** (UI). Body serif is the system Georgia stack from the original brief template — no file needed. If the brand later licenses real pixel faces, replace the `@import` with `@font-face` rules.

## Brand packs

A user can restyle every surface in their company's brand with a brand pack (`brand/` at the repo root, gitignored; `workflows/brand.md`). `templates/brand/brand-layer.css` maps the pack's `--brand-*` tokens onto the tokens below and swaps dither, pixel faces and sprite shadows for a clean base; `scripts/apply-brand.py` injects it. The sprite signet and "Made by Lore" stay in every brand. Charts pick up a pack's colors through `window.LORE_BRAND` (see `charts/chart-theme.js`). When you add a token or a template, extend `brand-layer.css` so branded installs follow.

## Index

- `styles.css` — global entry; imports everything in `tokens/`.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `effects.css` (shadows, borders, dither URLs), `fonts.css`.
- `assets/` — `scroll.svg`/`scroll.png` (signet sprite), `dither/` tiles, product screenshots (`daily-brief.png`, `action-items.png`) from the repo.
- `charts/` — the dithered chart theme for every data visual Lore draws: `chart-theme.js` (Chart.js: Bayer-dither fills, pixel chrome, square everything, no easing), usage rules in its README, specimen in `demo.html`.
- `components/core/` — Button, Badge, Chip, Panel, SectionHead, StatTile, Signet.
- `components/forms/` — Input, Checkbox, ProgressBar.
- `guidelines/` — foundation specimen cards (Design System tab).
- `templates/daily-brief/`, `templates/action-items/` — the two core product artifacts, redesigned in this system.
- `thumbnail.html`, `SKILL.md`.

## Intentional additions

- **Sprite scroll signet** (`assets/scroll.svg`) — designed at the user's explicit request to replace the 📜 emoji.
- **Arcane purple accent** — new, harmonized with the brief's Slack-chip purple; gives "magic" a reserved color.
- **Component set** — the repo defines HTML templates, not React components; the set here is authored to cover what those templates need.
