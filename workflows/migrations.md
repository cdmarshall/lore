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
   - Otherwise ask the user to open the old Quest Log in the Cowork sidebar, click **Download snapshot**, and save the file into `inbox/`. The old tracker only exists in Cowork's sidebar, so a user working in Claude Code switches to Cowork for this one step. If the old tracker no longer opens, or the user has nothing worth keeping, start empty.
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

### `2026-10-meeting-source-refs`: retire the Notion Transcripts database (asks)

**Detect:** `context.md` → Vault Configuration says `Backend: notion` and still lists a **Transcripts** data source.

Transcripts now stay in their source; the reference lives on the meeting page (`_conventions.md` → Source references, not copies).

1. **Add properties** to the Meetings data source if missing: `ADD COLUMN "Source" SELECT('recorder':blue, 'notion-ai':purple, 'zoom':green, 'teams':orange, 'meet':yellow, 'file':gray, 'other':default); ADD COLUMN "Source ID" RICH_TEXT; ADD COLUMN "Source URL" URL`.
2. **Copy the references:** for every Transcripts row with a `Meeting` relation, set `Source` and `Source ID` on that meeting page (skip a meeting that already has them). If the transcript page body holds the user's own notes or highlights (not transcript text), add them to the meeting page under `## Your notes`. List any rows with no meeting for the user.
3. **Verify:** count meetings with a `Source ID` against Transcripts rows that had a meeting.
4. **Ask** whether to move the Transcripts database to Notion's trash (restorable from there for 30 days) or leave it in place. Never trash it without a yes. On a yes, first drop the Meetings `Transcript` relation (`DROP COLUMN "Transcript"`) so meeting pages carry no dead link, then trash the data source. Either way, remove the Transcripts line from `context.md` → Vault Configuration so nothing writes to it again.

### `2026-10-brand-layer`: offer your company's brand, and rescue a customized look (asks, optional)

**Detect:** `brand/brand.json` does not exist.

Lore can now dress its documents, The Herald, the action-items tracker and charts in the user's company or org brand, kept in a gitignored pack that updates never touch (`workflows/brand.md`).

1. **Look for a hand-customized look first.** Some installs changed Lore's styling by editing committed files, which the next update overwrites. Compare them against the shipped release:
   `python3 -c "import hashlib,json,pathlib;m=json.load(open('release-manifest.json'))['files'];print('\n'.join(f for f,h in m.items() if f.startswith(('design-system/','templates/')) and f.endswith(('.css','.html','.js')) and pathlib.Path(f).is_file() and hashlib.sha256(pathlib.Path(f).read_bytes()).hexdigest()!=h))"`
   Any file it prints was edited locally. In a git install, `git diff --stat -- design-system templates` says the same.
2. **Offer once, in one or two lines.** With customized files: "You've customized Lore's look in <files>. The next update would overwrite that. Want me to move it into a brand pack so it sticks? I'd also take your website, a logo link and your brand guidelines or design system, if you have them." Without: "Lore can now dress its documents, brief and tracker in your company's brand. Want to set it up? I'd need your website and, if you have them, a link to your logo and your brand guidelines or design system."
3. **Yes:** run `workflows/brand.md` → Setup, using the customized files (and their diff against the release) as one of the sources. Only after the pack previews correctly, tell the user the customized files can go back to the release version at the next update; never revert them yourself.
4. **No:** record the id as done with "declined". The user can say "set up my brand" anytime.

### `2026-10-brand-slides`: slide decks in your brand (asks, optional)

**Detect:** `brand/brand.json` exists with `enabled` not false, and `context.md` → Notes for Lore → Brand has no **Design system:** URL.

Decks now pick their look per `workflows/slides.md`: the brand comes first, Lore's parchment never. They already read the pack directly, so nothing breaks without this. The migration offers the native path.

1. **Offer once:** "Lore now builds your slide decks in your brand. Want me to turn your brand pack into a design system that decks pick up natively? It takes a few minutes; nothing else changes."
2. **Yes:** `workflows/brand.md` → Setup → 6. Turn it on → item 3, "Brand design system". Add the **Design system:** line to `context.md` → Brand if the section predates it.
3. **No:** record the id as done with "declined". The user can say "build my brand design system" anytime.

## Adding a migration (maintainers)

Add a section here with a dated id, a detection check that reads only personal files or connector state, the steps, and whether it asks. Onboarding marks every id in this list done on a fresh install (`workflows/onboarding.md` → Phase 8, step 1a), so no extra wiring is needed. Add a row for it to The Keeper's Grimoire → "Your migrations" (`docs/grimoire.body.html`) and rebuild the guides (`CLAUDE.md` → Key behaviors → Guide upkeep). Never change or reuse an id that has shipped.
