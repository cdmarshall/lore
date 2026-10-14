# Brand: dress Lore's work in your company's look

All output follows VOICE.md. NO EM DASHES.

Lore ships in its own design system (`design-system/`: parchment, pixel faces, the scroll signet). A **brand pack** restyles every designed surface for the user's company or org: the signed document (1:1 preps, roundtable preps, reports, Unrolled), The Herald, the action-items tracker, and charts. The mechanism is committed; the pack itself is instance data in `brand/` and is gitignored, so it never ships in a release and an update never overwrites it.

> **Trigger phrases**: "set up my brand", "use my company's branding", "brand my artifacts", "refresh my brand", "turn off my brand". Also offered by the `2026-10-brand-layer` migration (`workflows/migrations.md`) and onboarding Phase 7.65.

## How it fits together

| Piece | Where | Committed? |
|-------|-------|-----------|
| Mapping layer: brand tokens onto Lore's tokens, dither and pixel treatments swapped for a clean base | `templates/brand/brand-layer.css` | yes |
| Starters for a new pack | `templates/brand/brand.template.json`, `brand.template.css` | yes |
| The script that applies a pack | `scripts/apply-brand.py` | yes |
| Hooks in each template: `<!--lore:brand-style-->`, `<!--lore:brand-logo-->`, `data-lore-title` | `templates/*.html` | yes |
| The pack: `brand.json`, `brand.css`, logo, `fonts/`, `sources/` | `brand/` | **no** (gitignored) |

**Rule for every surface (hard rule):** after filling an HTML template and writing it, run `python3 scripts/apply-brand.py <file>`. No pack means no change, so the step is always safe. When the output is published with the Artifact tool, make the publish copy with the same call: `python3 scripts/apply-brand.py <file> --artifact <file>.artifact.html --title "<page title>"`. It drops the doctype/html/head/body wrapper and keeps every `<style>`, so the published page carries the brand too.

**What a brand never changes:** Lore's scroll signet and the "Made by Lore" footer stay on every surface, and Lore stays credited when a surface is renamed ("Action items", "by Lore"). The brand changes how Lore's work looks, not who made it. VOICE.md still governs every word.

## Setup

### 1. Ask for sources (one message)

> "To dress my work in your brand I need whatever you have of: 1. your company website, 2. a link to the logo (an SVG is best), 3. your brand guidelines or design system (a PDF, a Notion or Drive page, a Figma file, a link). The website alone is enough to start."

Take what they give; don't block on the rest. If the user already customized Lore's look by editing `design-system/` or `templates/` (the migration detects this), treat those edits as a source too.

### 2. Gather the brand

Work from primary sources, in this order, and note each one for `brand/sources/README.md`.

- **Guidelines or design system.** Read it through the connector it lives in (Notion, Drive, Figma). Pull: logo rules (clear space, minimum size, don'ts, lockups), the full palette with tints and any color marked internal-only, type families with weights and the hierarchy (headline, eyebrow, body, metadata), corner radius, shadows, icon style, chart styling. A large PDF that the shell can't download: open its signed URL in the built-in browser, render pages with pdf.js, look at the pages, and sample swatch colors from the rendered canvas rather than reading hex labels by eye.
- **Website.** Open it in the built-in browser and read the live styles with `javascript_tool`: the most-used text and background colors and font families (computed styles), CSS custom properties from the stylesheets, button radius and casing, and the header logo (an inline `<svg>` can be copied as is; an `<img>` gives its URL). Never download a site's licensed web-font files.
- **Logo.** Prefer SVG. Use the full-color primary logo for light backgrounds.

### 3. Fonts

- **Open-licensed families** (Google Fonts and other OFL faces): `npm pack @fontsource/<family>` in the shell's scratch space (the npm registry is usually reachable when Google's font CDN is not), then copy the latin `woff2` files for the weights needed, plus the license, into `brand/fonts/`.
- **Licensed families** (Adobe Fonts, Monotype, a custom face): don't embed them. In `brand.css` list `local('<Font Name>')` first, so a machine with the font active renders the real face, then an embedded open look-alike. Tell the user which look-alike you chose and that dropping licensed web-font files into `brand/fonts/` upgrades it.
- Keep it to what the surfaces use, usually 3 to 4 body weights (light, light italic, regular, semibold) and 2 to 3 display weights. Every file is embedded in every output.

### 4. Write the pack

From the starters in `templates/brand/`:

1. **`brand/brand.css`:** `@font-face` rules (paths relative to `brand/`) and the `--brand-*` tokens. The token contract is the header of `templates/brand/brand-layer.css`. Map the brand onto Lore's roles: page and panel surfaces, ink scale, rules, **primary** (Lore's gold role: links, counts, CTAs, callout strips), **accent** (Lore's arcane role: Lore chips, the triage pile, Lore-ready; a brand's internal-use or secondary accent fits well), status colors, display/UI/body faces and weights, radius, soft shadows, logo height. Add brand-specific touches below the tokens only when the tokens can't express them.
2. **`brand/brand.json`:** name, logo file and its exact alt text, chart colors and series order (`charts`, read by `design-system/charts/chart-theme.js`), sources. Offer `titles` renames in the brand's plain voice; the pattern is `{ "title": "Action items", "subtitle": "by Lore" }` for `quest-log` and `{ "title": "Daily brief", "subtitle": "by Lore" }` for `herald`. Ask before renaming; some users like the fantasy names.
3. **The logo file** in `brand/`, and **`brand/sources/README.md`**: what came from where, and the judgment calls (font substitutes, which color took the accent role, logo placement).
4. Respect the logo rules you found: the logo sits alone in the masthead corner, never locked up with Lore's titles or a product name, and never recolored.

### 5. Preview before anything changes for real

1. `python3 scripts/apply-brand.py --check` reports what the pack holds.
2. Brand copies of 2 recent outputs (a 1:1 prep and a Herald from `outbox/`) into `outbox/brand-preview/` with `-o`, plus a copy of the tracker template. Look at them (render screenshots, or publish one preview artifact) and fix overflow, contrast, and wrapping. Show the user the before and after.
3. Iterate on tokens with the user until they're happy.

### 6. Turn it on

1. **The tracker:** republish it per `workflows/action-items.md` → "Updating the tracker's page" (branded copy, no `capabilities` field). Items are untouched.
2. **Record it** in `context.md` → Notes for Lore → Brand: name, date set up, and "pack in `brand/`".
3. From now on every surface brands itself through the rule above. Existing files in `outbox/` keep their old look unless the user asks to re-brand them (run the script on each).

## Refresh, change, turn off

- **Refresh** ("refresh my brand", new guidelines): re-read the sources in `brand/sources/README.md`, update the pack, preview, republish the tracker.
- **Turn off:** set `"enabled": false` in `brand/brand.json`, republish the tracker from the unbranded template. Nothing is deleted.
- **Corrections** ("the orange is wrong", "use the other logo"): fix the pack, not a single output, and note the decision in `brand/sources/README.md` (CLAUDE.md → Correction capture).

## Verification

Before saying it's done: `--check` passes; a branded document, Herald and tracker render with the brand faces, the logo, the signet, and "Made by Lore"; running the script twice gives the same file; `git status` shows nothing under `brand/` except `brand/README.md`.
