# Plan: Obsidian as Lore's Primary Filesystem

## Goal

When the Obsidian MCP is connected, the vault becomes Lore's primary store. Cross-references happen through wikilinks and backlinks instead of folder paths, eliminating duplicated context (a person's role written into every meeting note, etc.). When Obsidian is **not** connected, fall back to the current filesystem-based structure with no behavior change.

## Mode Detection

Add a check at session start, right after the Fresh Install detection in `CLAUDE.md`:

1. Attempt `mcp__obsidian__obsidian_list_files_in_vault`.
2. Success → **Obsidian mode**. Treat the vault as canonical for everything except the action-items artifact (which stays the source of truth as today).
3. Failure / tool missing → **Filesystem mode**. Current behavior, unchanged.

The agent should state the active mode once at session start so the user can override if needed.

## Mode Behavior

### Filesystem mode

No change. Workflows operate on `team/`, `stakeholders/`, `meetings/`, `decisions/`, etc. exactly as today.

### Obsidian mode

- All reads and writes go through `mcp__obsidian__*` tools, not direct file I/O.
- Cross-references use wikilinks (`[[Jane Doe]]`).
- Entity metadata lives in YAML frontmatter, not body prose.
- Categorization uses a hierarchical tag taxonomy.
- Periodic notes (daily, weekly) come from `obsidian_get_periodic_note`, not hand-rolled date files.
- Discovery uses `obsidian_simple_search` / `obsidian_complex_search` and backlinks, not `grep` / `glob`.
- Append-only updates use `obsidian_patch_content` under named headings, not full-file rewrites.

## Migration Map

| Filesystem-mode location | Obsidian-mode equivalent |
|---|---|
| `team/jane.md` | Note `Jane Doe` with frontmatter `type: person, role: direct-report`, tag `#person/direct-report` |
| `stakeholders/bob.md` | Note `Bob Smith` with `type: person, role: stakeholder/external` |
| `meetings/notes/2026-05-28-1on1-jane.md` | Note titled `2026-05-28 1on1 Jane Doe`, body opens with `[[Jane Doe]]`, frontmatter `type: meeting, kind: 1on1, attendees: [[Jane Doe]]` |
| `decisions/log.md` (one big file) | One note per decision, `type: decision`, tag `#decision/active`, linked to people/projects |
| `weekly-reviews/2026-05-28.md` | Periodic weekly note via `obsidian_get_periodic_note(period="weekly")` |
| `context.md` | Note `Context` at vault root (still the orientation doc); links out to `[[Role]]`, `[[Priorities]]`, `[[Team]]` |
| `inbox/documents/` | Notes tagged `#inbox/unprocessed`; tag removed when ingested |
| `inbox/action-items.snapshot.md` | **Unchanged.** Artifact IDB remains canonical. Snapshot file still read from disk. |
| `projects/[slug].md` | Note `[Project Name]` in `Projects/`, `type: project` frontmatter, tag `#project/<slug>`, status, tracker field |
| `strategy/*.md` (vision, roadmap only) | Notes tagged `#strategy`, linked from `[[Context]]`. Project-specific reference files belong in `Projects/`, not `Strategy/`. |
| `playbooks/*.md` | Notes tagged `#playbook`, kept as-is (committed templates) |

## Linking & Deduplication Rules

The point is to write each fact **once** and link to it everywhere.

- **People**: one note per person. Role, team, manager, history all live on that note. Meeting notes never restate role; they link `[[Jane Doe]]` and Obsidian's backlinks pane shows every meeting Jane appears in.
- **Projects / initiatives**: one note per project. Status, owner, stakeholders in frontmatter; meetings and decisions link to the project note.
- **Decisions**: one note per decision, links to affected people and projects. Backlinks on a person's note surface every decision involving them automatically.
- **Meeting notes**: title pattern `YYYY-MM-DD <kind> <subject>`. Body uses wikilinks for every attendee, project, and decision touched. Observations about a person are written to the person's note (under `## Observations`, append-only via `patch_content`), not buried in the meeting note.
- **Action items**: artifact remains canonical (hard rule from `CLAUDE.md`). The agent uses Obsidian search to gather context around an item, but does not push action items into the vault.

## Tag Taxonomy

Hierarchical, slash-delimited:

- `#person/direct-report`, `#person/peer`, `#person/manager`, `#person/stakeholder/internal`, `#person/stakeholder/external`
- `#meeting/1on1`, `#meeting/staff`, `#meeting/roundtable`, `#meeting/decision`, `#meeting/external`
- `#decision/active`, `#decision/superseded`, `#decision/proposed`
- `#project/<slug>`
- `#status/active`, `#status/blocked`, `#status/done`
- `#inbox/unprocessed`, `#inbox/needs-review`
- `#playbook`, `#strategy`

## Frontmatter Schemas

Person:
```yaml
type: person
role: direct-report | peer | manager | stakeholder/internal | stakeholder/external
team: <team-name>
manager: "[[Name]]"
start_date: YYYY-MM-DD
last_1on1: YYYY-MM-DD
```

Meeting:
```yaml
type: meeting
kind: 1on1 | staff | roundtable | decision | external
date: YYYY-MM-DD
attendees: ["[[Name1]]", "[[Name2]]"]
related_projects: ["[[Project]]"]
```

Decision:
```yaml
type: decision
date: YYYY-MM-DD
status: active | superseded | proposed
owner: "[[Name]]"
supersedes: "[[Decision Title]]"   # optional
projects: ["[[Project]]"]
```

Project:
```yaml
type: project
status: active | blocked | done
owner: "[[Name]]"
stakeholders: ["[[Name]]"]
start_date: YYYY-MM-DD
```

## Workflow Changes

For each workflow in `workflows/`, add an "Obsidian mode" branch. The filesystem-mode branch stays as-is.

- **onboarding**: still writes `Context`, but in Obsidian mode it also creates seed notes for each named direct report and stakeholder as wikilink stubs, then suggests the user fill in details over time.
- **process-transcript**: creates the meeting note in the vault; for each attendee mentioned, appends a dated observation block under `## Observations` on the person's note via `obsidian_patch_content`. No duplicated role/context in the meeting note body.
- **1on1-prep**: instead of `grep meetings/notes/`, runs `obsidian_simple_search` for the person's name and pulls the backlinks pane equivalent via `obsidian_complex_search`. Recent observations and open commitments are gathered from the person's note + linked meetings.
- **roundtable-prep**: searches the past week of meeting notes via `obsidian_get_recent_changes` + tag filter `#meeting`.
- **morning-sync**: uses `obsidian_get_periodic_note(period="daily")` for today's note, creating it if missing, with a checklist seeded from the action-items snapshot.
- **ingest** / **ingest-notes**: drop into vault as `#inbox/unprocessed`, then process in place rather than moving files between folders.
- **plaud-sync**: transcripts land in the vault under a `Transcripts/` folder; `.plaud-processed` and `.processed` still tracked as flat files in the vault root (Obsidian ignores dotfiles).
- **email-triage**: unchanged storage-wise (outputs to `outbox/` on disk), but the day's briefing also gets appended to today's periodic note as a section.
- **action-items**: unchanged. Hard rule.

## Tools to Lean On

- `obsidian_simple_search` for fuzzy name/topic lookups.
- `obsidian_complex_search` for JsonLogic queries against frontmatter (e.g., all people where `role == "direct-report"`).
- `obsidian_get_periodic_note(period=...)` for daily / weekly / monthly notes.
- `obsidian_patch_content` for surgical appends under headings, never read-and-rewrite for incremental updates.
- `obsidian_get_recent_changes` for "what's new since last session."
- `obsidian_batch_get_file_contents` for pulling a person + their recent meetings in one call.

## CLAUDE.md Changes (landed)

1. ✅ Added **Obsidian Detection** section parallel to Fresh Install Detection.
2. ✅ Added **Vault Structure (Obsidian Mode)** section showing the `Lore/` subfolder layout.
3. ✅ Added **Obsidian Mode Conventions** section (linking rules, tag taxonomy, frontmatter schemas, tool guidance, path resolution).
4. ✅ Added a Workflows-table note explaining that workflows opt into Obsidian mode incrementally.
5. ✅ Updated the **Templates** Key Behavior to describe template translation in Obsidian mode.
6. ✅ Added an **Obsidian-mode entity rule** Key Behavior (one note per entity, wikilinks, backlinks, no duplication).

## Decisions (resolved)

- **Vault location.** External to `lore/`. The repo and the vault are separate. Versioning of vault contents is the user's responsibility (e.g., the vault may be in iCloud, Syncthing, or its own Git repo).
- **Vault subfolder.** Lore operates from a dedicated subfolder inside the vault, not the vault root, so we don't pollute the user's existing notes. The default subfolder name is `Lore/`. Users with multiple orgs can override by recording the chosen name in `context.md` under "Notes for Lore" → "Vault Configuration" (e.g., Colton uses `Lore - Rate/` to leave room for future `Lore - <OtherOrg>/` instances).
- **Templates.** Stay committed in the repo's `templates/` folder. The agent translates the template structure when writing into the vault (applies frontmatter, converts cross-references to wikilinks, applies tags). Templates are not forked into the vault.

## Open Questions

- **Concurrent edits.** User editing in Obsidian app while the agent edits via API. `patch_content` is safer than full-file overwrites; we should prefer it everywhere.
- **Migration of existing data.** If the user has existing files in `team/`, `stakeholders/`, etc., a one-shot migration script should: (a) write each into the vault under `Lore/`, (b) extract role/metadata into frontmatter, (c) rewrite cross-references as wikilinks. Opt-in only.
- **Action items hard rule.** Still applies. The vault never becomes a source of truth for action items. Re-affirmed in the new CLAUDE.md section.
- **Gitignored content.** The repo's personal folders stay gitignored. Vault contents are external to the repo entirely.

## Suggested Rollout

1. ✅ Land the CLAUDE.md changes (detection + conventions) with no workflow changes. Agent behavior stays filesystem-mode until workflows are updated.
2. ✅ Update `process-transcript` as the pilot workflow.
3. ✅ Migrate `plaud-sync` (primary transcript ingestion path for the user).
4. ✅ One-shot migration of existing filesystem data into the vault (people, stakeholders, decisions, strategy). Meetings + transcripts being moved manually by the user; folders pre-populated with `_README.md` convention placeholders.
5. ✅ Establish `projects/` as a first-class folder. Create `templates/project.template.md`, add `Projects/` to vault structure and active folders, migrate `strategy/aspire-north.md` to `projects/aspire-north.md` as the pilot project file, update workflows with project-awareness sections.
6. ⏳ Validate that backlinks and observation appends work as expected over a week of real meetings.
7. ⏳ Roll out remaining workflows: `ingest-notes`, `ingest`, `1on1-prep`, `roundtable-prep`, `morning-sync`, `onboarding`. (`triage` ships Obsidian-aware; the legacy `email-triage` workflow has been retired in favor of `triage`.)

— 📜 Lore
