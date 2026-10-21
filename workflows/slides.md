# Slides: decks in the user's brand

All output follows VOICE.md. NO EM DASHES.

> **Trigger phrases**: "make a deck", "slides for", "build a presentation", "pitch deck", "turn this into slides", "add a slide". Also any workflow that ends in a deck.

A deck is made from the **Slides** artifact type (Artifact tool), not a .pptx, unless the user names PowerPoint; then use the pptx skill and pick the look the same way (step 1). The Slides type's own SKILL.md governs the files and the format. This workflow decides only **which look the deck wears**, and it runs before any typeface or color is chosen.

## 1. Pick the look (first match wins)

1. **The user named one for this deck** ("use our design system", "plain", "Lore's parchment look") → that.
2. **A brand pack is on** (`brand/brand.json` exists and `enabled` is not false; `python3 scripts/apply-brand.py --check` reports it):
   - **a. A brand design system is recorded** (`context.md` → Notes for Lore → Brand → **Design system:** URL) → that is the deck's design system. It counts as the one "this session's instructions name" in the Slides type's step 1, so it wins over any account default. Install it exactly as the type's step 3 says. If it can't be read, say so in one line and fall to b.
   - **b. No design system recorded** → dress the deck from the pack directly (section 2). After the deck is delivered, offer once: "Want me to turn your brand pack into a design system, so every deck picks it up natively?" Yes → `workflows/brand.md` → Setup → 6. Turn it on → item 3, "Brand design system".
3. **No pack, or the pack is off** → the standard Slides look: follow the Slides type's step 1 unchanged (an account default design system if one is marked, else its own look).

**Never dress a deck in Lore's own `design-system/`** (parchment, pixel faces, dithers) unless the user asks for it by name. That system styles Lore's own surfaces, not the user's presentations, whatever `design-system/SKILL.md` says about slides.

Say the choice in one line before the first slide goes out: "Building it in the THREE brand design system", "in your THREE brand pack", or "in the standard Slides look". That line is the observable check that this step ran.

## 2. Dressing a deck from the pack (1, case b)

Read `brand/brand.css`, `brand/brand.json` and `brand/sources/README.md` (logo rules, judgment calls). Map the pack onto the Slides type's design rules:

| Slides needs | Take it from |
|---|---|
| Two background tones | `--brand-bg` and `--brand-band` (or `--brand-tint` for a warm panel) |
| Text colors | `--brand-ink`, `--brand-ink-soft`, `--brand-ink-faint` |
| Accent and the statement slide | `--brand-primary` (deep and soft variants for depth); `--brand-info` or `--brand-accent` as a second accent |
| Chart and series colors | `brand.json` → `charts.series`, in order, resolved through `charts.colors` |
| Headings | `--brand-font-display` at `--brand-display-weight`; eyebrows in `--brand-font-ui` uppercase with `--brand-label-tracking` |
| Body | `--brand-font-body` at `--brand-body-weight` |
| Card corners | `--brand-radius` |

- **Fonts:** upload the `brand/fonts/` woff2 files the slides use (one per family and weight, four faces at most) as assets and list each in `project/deck.json` → `faces` with its `/_blob/<id>` src. A face the pack lists only as `local('…')` (a licensed font with no file) can't travel with a deck: use the embedded look-alike the pack names, and never fetch licensed font files.
- **Logo:** upload the file `brand.json` → `logo.file` names and use its `alt`. It goes on the cover and may sit in the footer band; alone, never locked up with a title, never recolored, with the clear space `brand/sources/README.md` records.
- **Linked cloud session:** `brand/` is on the user's computer. Stage only the font files and the logo (`device_stage_files`) so they can be uploaded; read the CSS and JSON in place with `device_bash`.
- Brand colors may set their own contrast, but text still needs to be readable; check any light-on-copper pairing.

## 3. Build and deliver

Follow the Slides type's SKILL.md for everything else. VOICE.md governs every word on the slides and in speaker notes. No signet and no "Made by Lore" on slides: the user presents the deck as their own.

Deliver the deck's link. A correction to the look ("the orange is off", "use the white logo") is fixed in the pack or the brand design system, not only in this deck, and noted in `brand/sources/README.md` (CLAUDE.md → Correction capture).
