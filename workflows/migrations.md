# Migrations: bringing an existing install up to the current structure

All output follows VOICE.md.

A Lore update replaces the committed files (workflows, templates, scripts) but never touches personal files (`context.md`, `team/`, `inbox/`, the vault). When a release changes how personal data is shaped or where it lives, that change is a **migration** listed here. Each one is idempotent, asks before anything the user would notice, and is recorded when done so it never runs twice.

> **Trigger phrases**: "run migrations", "finish the update", "migrate my setup". Also run automatically after `workflows/update.md` applies a release, and offered at session start when one is pending (`CLAUDE.md` → Session start).

## Bookkeeping

- `inbox/.migrations` is an append-only list of migration ids that are done, one per line, each with the date: `2026-10-quest-log-db 2026-10-14`. Two-step existence check before writing it (`_conventions.md`).
- A migration is **pending** when its id is not in that file and its detection check says the install needs it. A fresh install (onboarding just ran) needs none of them: onboarding writes every id below as done.
- Run pending migrations in the order listed. Tell the user up front what will happen, in one line per migration, and wait for a yes before starting any that is marked **asks**. Report what each one did.
- If a migration can't finish (a connector is missing, the user wants to do it later), leave its id out of the file and say what's left. It will be offered again.

## The list

### `2026-10-quest-log-db`: move the Quest Log onto its database (asks)

**Detect:** `context.md` has no "Notes for Lore" → "Quest Log" URL.

The old tracker lived in a Cowork-local artifact (id `the-quest-log`) backed by browser storage that only the page could see. The new one is a hosted artifact whose database Lore reads and writes directly (`workflows/action-items.md`).

1. **Get the old items.** In order of preference:
   - `inbox/action-items.snapshot.md`, if present and the user confirms it is current.
   - Otherwise ask the user to open the old Quest Log in the Cowork sidebar, click **Download snapshot**, and save the file into `inbox/`. If the old tracker no longer opens, or the user has nothing worth keeping, start empty.
2. **Create the new tracker** per `workflows/action-items.md` → "Creating the tracker", and record its URL and date in `context.md`.
3. **Import:** `ArtifactData` `list` of the new tracker (`out_dir`), then `node scripts/quest-log-ops.js --docs <out_dir> --import-snapshot <snapshot file> --out <dir>`, then one `ArtifactData` `batch` per `writes-N.json`. Every row keeps its historical dates; rows already present are skipped.
4. **Verify:** list again, compare counts per status with the script's report, and spot-check two items with the user.
5. **Retire the old one:** tell the user the old sidebar tracker is now frozen and can be deleted from Cowork; nothing reads it anymore. Do not delete it for them.
6. Also write `meta/settings` with team members from `team/` (or the knowledge base).

### `2026-10-timezone`: record the timezone (asks)

**Detect:** `context.md` → Notes for Lore has no Timezone line.

Ask for the IANA zone (never infer it from a city or region) and write it per `templates/context.template.md`. Every rendered time depends on it (`_conventions.md` → Timezone).

### `2026-10-connectors`: build the Connectors table

**Detect:** `context.md` → Tools & Integrations has no Connectors table.

Run `workflows/connectors.md` steps 1 to 4, pre-filling roles from what `context.md` and `triage-config.md` already say (an existing Slack project-channel list means Slack is the team-chat tool, and so on). Ask only about roles nothing answers. Keep the existing per-tool sub-sections; add the table above them.

### `2026-10-session-digest`: make room for the Claude Code digest

**Detect:** no `inbox/cc-sessions/` folder.

Create `inbox/cc-sessions/` (the update ships its `.gitkeep`; package installs may not). Mention once that `node scripts/build-cc-session-digest.js --days 90`, run from Claude Code, lets recaps count Claude Code sessions (`_conventions.md` → Recap sourcing).

### `2026-10-retire-snapshot-files`: stop treating old snapshot files as state

**Detect:** `inbox/action-items.snapshot.md` or `inbox/action-items-state.json` exists and `2026-10-quest-log-db` is done.

Nothing reads these any more. Offer to move them to `inbox/archive/` (create it if needed) so they don't confuse anyone later. Never delete them.

### `2026-10-knowledge-base-choice`: offer Notion as the knowledge base (asks, optional)

**Detect:** the Notion connector is connected and `context.md` → Vault Configuration doesn't say `Backend: notion`.

Offer once, in one line: "Notion can now hold your knowledge base (people, projects, meetings, decisions) with two-way links. Want me to move it there?" Yes → `workflows/notion-kb.md` → Migrating into Notion. No → record the id as done with "declined" so it isn't offered again; the user can still say "migrate to Notion" anytime.

## Adding a migration (maintainers)

Add a section here with a dated id, a detection check that reads only personal files or connector state, the steps, and whether it asks. Onboarding marks every id in this list done on a fresh install (`workflows/onboarding.md` → Phase 8, step 1a), so no extra wiring is needed. Add a row for it to The Keeper's Grimoire → "Your migrations" (`docs/grimoire.body.html`) and rebuild the guides (`CLAUDE.md` → Key behaviors → Guide upkeep). Never change or reuse an id that has shipped.
