# brand/

This folder holds **your** brand pack: your company's or org's colors, fonts and logo, applied to everything Lore designs (documents, The Herald, the action-items tracker, charts). Everything here except this README is gitignored and never ships in a release.

- Set it up or refresh it: say "set up my brand" (`workflows/brand.md`).
- Turn it off without deleting it: set `"enabled": false` in `brand.json`.
- No pack here means Lore's own look.

What goes here: `brand.json` (manifest), `brand.css` (tokens and fonts), the logo file, `fonts/`, and `sources/` (where the brand came from). Starters: `templates/brand/`. The script that applies it: `scripts/apply-brand.py`.
