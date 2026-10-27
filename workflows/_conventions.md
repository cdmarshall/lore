# Lore Conventions (shared)

Single source of truth for shared conventions. Read on demand from workflows (e.g. "see `_conventions.md` → Frontmatter schemas"). Not loaded every session.

## Storage-mode branching

Every workflow that touches entity data branches on storage mode. There are three: **Filesystem** (repo folders, the default), **Obsidian** (a vault on disk), and **Notion** (databases in the user's Notion workspace). Decide once per session:

1. Read `context.md` → **Notes for Lore** → **Vault Configuration**.
   - **`Backend: notion`** → **Notion mode.** Confirm with one cheap Notion call (fetch the recorded root page). Every workflow's **Obsidian-mode branch applies**, translated through `workflows/notion-kb.md` → "How Obsidian concepts map to Notion" (notes become database pages, frontmatter becomes properties, wikilinks become relations and page mentions, Dataview becomes data-source queries). Steps 2 to 4 below don't apply. If the connector is unreachable, say so and stop writing entity data; never fall back to the repo folders on your own, since that splits the knowledge base.
   - A vault path recorded (and no `Backend: notion`) → continue with step 2.
2. If a vault path is recorded, the session is **Obsidian mode**: the vault is canonical for entity context (people, projects, meetings, decisions, observations). Confirm the vault is live by probing the **Semantic Notes Vault MCP** (`system` info, or any `vault`/`dataview` call), NOT by `bash ls` on the recorded path.
   - **The vault often lives in iCloud (`iCloud~md~obsidian/...`), which is not mounted in the shell sandbox. A failed `bash ls` on that path means the shell can't see it, NOT that the vault is unreachable.** Never downgrade to Filesystem mode off a bash path check alone. Verified 2026-07-14: a bash-only check wrongly forced Filesystem mode for a whole 1:1 prep while the MCP was connected the entire time, dropping canonical observations and a required "Topics to Raise in Next 1:1" coaching item.
3. **If native reads against the vault path fail because the folder is not connected to this session, get it connected before concluding anything.** In Cowork, request the folder (the session's folder-access request tool, or ask the user to add it to the project). In Claude Code, ask the user to run `/add-dir <vault path>` (or relaunch with `--add-dir`). An unmounted vault at session start is the normal case, not a fault, and it is the most common reason a read against the vault path errors.
4. Fall back to **Filesystem mode** (entity data in repo folders `team/`, `stakeholders/`, `projects/`, `meetings/`, `decisions/`) only when either (a) no vault path is recorded, or (b) a vault path is recorded, the Semantic Notes Vault MCP is genuinely unreachable, AND native reads still fail after step 3. State which of these triggered the fallback. If the user has recorded that the vault is their only copy of entity data, say the vault is unreachable and stop rather than writing entity data into the repo folders, which would split the knowledge base in two.
5. The Quest Log is canonical for action items in **every** mode (see `workflows/action-items.md`).

Read the matching context file only: Obsidian mode reads `Context.md` from the vault root (adds wikilinks on entity tables); filesystem mode reads `context.md` at repo root. Same information; write updates to the active-mode file only, never both. Notion mode is the exception: `context.md` stays canonical (it holds the Vault Configuration that points at Notion), and the Notion **Context** page is a linked copy updated in the same step.

## Vault structure (Obsidian mode)

Personal entity data lives under a dedicated subfolder inside the user's vault. The repo still holds workflows, templates, playbooks, and scripts. Action items live in The Quest Log in either mode.

```
<vault-root>/
├── People/        one note per person (direct reports, peers, stakeholders)
├── Meetings/      one note per meeting; wikilinks to People
├── Transcripts/   transcripts the user dropped in themselves (Lore never copies recordings here; see Source references); .processed / .plaud-processed live in the repo
├── Decisions/     one note per decision; wikilinks to People and Projects
├── Projects/      one note per project/initiative
├── Inbox/         notes pending processing; tag #inbox/unprocessed
├── Daily/         periodic daily notes, named by date
├── Weekly/        periodic weekly notes
└── Archive/       archived entities, mirrored by origin (Archive/People/, Archive/Projects/, Archive/Meetings/)
```

Archiving is always propose-first and runs through vault-lint (`workflows/vault-lint.md`): synthesis written to the surviving entity note before the move, Index.md updated after. Wikilinks survive moves; Obsidian re-resolves them.

- Note titles double as wikilink targets. Person notes are titled with the person's full name so `[[Jane Doe]]` resolves. Meeting notes follow `YYYY-MM-DD <kind> <subject>` so they sort chronologically.
- Templates stay committed in the repo `templates/` folder. When writing to the vault, translate the template structure into the note (frontmatter, wikilinks, tags). Do not fork templates into the vault.
- Dotfile trackers (`.processed`, `.plaud-processed`, `.email-processed`, etc.) stay in the repo even in Obsidian mode; Obsidian ignores dotfiles and these are operational state, not entity data.

## Path resolution

- Vault paths are relative to the vault root. The default subfolder is `Lore/`; some users use none (entity folders at vault root) or several (e.g. one per org). Always confirm the active convention in `context.md` → "Vault Configuration" and substitute it wherever a workflow references `Lore/<subfolder>/` as a vault path.
- The vault-root filesystem path is recorded in "Vault Configuration". Prefix it to vault-relative paths for file operations; keep speaking vault-relative everywhere else.
- Cross-references use wikilinks, not folder paths: `[[Jane Doe]]`, not `Projects/... .md`.
- If a wikilink is ambiguous (two notes with the same title), use the piped form: `[[People/Jane Doe|Jane Doe]]`.

## Vault access tooling

- **Writes and plain reads always use native tools** (Read, Write, Edit, `bash ls`) against the vault path, in both modes. One write path keeps notes identical whether Obsidian is open or not; exact-string edits are verifiable by reading the file back.
- **Queries are MCP-first.** For Dataview DQL execution, graph/backlink traversal, Bases, and ranked vault search, assume Obsidian is open and prefer the **Semantic Notes Vault MCP** plugin (aaronsb/obsidian-mcp-plugin), scheduled runs included. Its tools (resolve by suffix; the server prefix differs per install): `dataview` (execute DQL), `graph` (links/backlinks traversal), `vault` (list/read/search operations), `bases`. If the server is unreachable (Obsidian closed) or errors, fall back automatically to the filesystem query patterns below. **"Unreachable" means the MCP itself failed when called, never that `bash ls` couldn't see the vault path: the vault is typically in iCloud and invisible to the shell sandbox, so probe the MCP directly before concluding anything about vault availability.** Never fail a workflow because the MCP is down; **no workflow may hard-require it.**
- **Filesystem query patterns (the fallback, and always valid):** find a note by name with `bash ls`; search content or frontmatter with Grep; find backlinks by Grepping for `[[Name]]` across the vault. **List-valued frontmatter fields (`stakeholders`, `attendees`, `projects`, `tags`) are usually multi-line YAML** (`stakeholders:` then `- '[[Name]]'` lines), so never match only on the key line: match the name anywhere in the frontmatter block (e.g. Grep the file for `[[Name]]`, then confirm the field by reading the block), or parse the block. Verified against real vault data: key-line-only matching silently dropped 6 of 22 results. Workflow steps say *what* to query ("projects where Jane is lead or stakeholder"); this section says *how*.
- **Retired MCPs:** do not use basic-memory or the older obsidian REST MCP. If their tools appear in a session, ignore them.

### Frontmatter hygiene (hard rules)

- Wikilink values in frontmatter are always quoted: `lead: "[[Jane Doe]]"`.
- Never use tabs in YAML.
- After any frontmatter edit, re-read the block and confirm it is still valid YAML. Malformed YAML silently drops the note out of Dataview views with no error.
- Treat existing ```dataview and ```base code fences as opaque. Never reformat or "fix" them.

## Vault index (Index.md)

`Index.md` at the vault root is the master catalog: one line per entity note (wikilink, key frontmatter, one-line hook), grouped People / Projects / Decisions, plus a Counts line. The agent reads it first for orientation, then drills into specific notes; it replaces broad discovery searches. **Maintenance rule:** any workflow step that creates, archives, or changes the status of an entity note updates the matching Index.md line (and Counts) in the same session. Vault-lint checks freshness.

## Linking and deduplication

- **One note per entity.** A person, project, or decision has exactly one note. Everything else links to it.
- **Backlinks replace cross-references.** To find every meeting Jane appears in, follow backlinks on `[[Jane Doe]]` (via the graph tool, or Grep for `[[Jane Doe]]`). Do not grep-scan meeting files by hand where a backlink query works.
- **Observations append to the entity's note,** not to the meeting note. Meeting notes summarize the meeting; person notes accumulate the running observation history.
- **Use Edit for incremental updates** (appending observations, adding a table row, updating one section). Prefer surgical edits over full rewrites.
- Each fact is written once. Role lives on the person's note; meeting notes wikilink rather than restating role.

## Person note structure

- **No H1 heading.** The filename is the title. Do not add a `# Name` line.
- **No Overview table.** Identity data (job title, role, team, manager, location, start date, status) lives entirely in frontmatter. Never create a `## Overview` table.
- **Single Observations section.** All observations live under one `## Observations` heading, formatted as `### YYYY-MM-DD - <short context>`, newest first. No thematic subsections. Append new entries at the top of the section (Edit, insert before the first existing `###`).
- **Active Projects is a Dataview block, never hand-maintained and never read as data.** The `## Active Projects` section holds the query below verbatim. Never hand-edit it or add project rows. To change a project's status/phase/membership, edit the project note itself. To answer "what projects is this person on," query `Projects/` frontmatter (`lead`, `stakeholders`) directly via the dataview MCP tool or Grep, not by reading this rendered block. The Dataview community plugin is required for it to render in Obsidian.

The Dataview block that must appear in the `## Active Projects` section of every person note:

```dataview
TABLE WITHOUT ID
  file.link AS Project,
  choice(lead = this.file.link, "Lead", "Stakeholder") AS Role,
  status AS Status,
  phase AS "Phase / latest"
FROM "Projects"
WHERE (lead = this.file.link OR contains(stakeholders, this.file.link)) AND status != "done" AND status != "backlog"
SORT status ASC, file.name ASC
```

`backlog` is excluded deliberately: a backlogged project is real and tracked, but it is not work in flight, so it does not belong in a person's active view. Query `Projects/` directly to see backlog items.

## Project status semantics

- `active`, work is moving; there is dated activity in the last 14 days.
- `blocked`, real and wanted, but stopped on a named external dependency. A note with recent *entries* that all say the work cannot proceed is `blocked`, not `active`.
- `backlog`, defined and intended, not yet sequenced into a sprint. Not stalled, just not started.
- `done`, finished or shipped. **Closing is a required step, not an optional one.** When a project finishes, set `status: done`, update the `#status/*` tag to match, and append a dated closing line to `## Current Phase`. A vault where nothing is ever closed reports every finished project as stale forever; this was the state of the vault on 2026-07-30, when 8 of 39 projects were still `active` after completing, 5 of them confirmed finished by the user in a single pass.

## Frontmatter schemas

**Person** (no `title:` field; filename is the title):
```yaml
type: person
job_title: <e.g. Product Manager>      # actual job title
role: direct-report | peer | manager | stakeholder/internal | stakeholder/external   # relationship, NOT job title
team: <team-name>
manager: "[[Name]]"
location: <city/region>
start_date: YYYY-MM-DD
status: active | incoming | departing | departed   # omit or "active" for current employees
aka: <fuller/legal name>           # optional; only if different from filename
last_1on1: YYYY-MM-DD             # direct reports only
departure_date: YYYY-MM-DD          # optional; only when departed
departure_reason: resigned | terminated | retired | transferred   # optional
tags: [person/direct-report]       # appropriate tag from taxonomy
```

`incoming` is an accepted offer or an offer in flight: the person will join and is worth a note, but has no start date yet. `departing` means notice is given and a `departure_date` is set, but the last day has not passed.

**Meeting:**
```yaml
type: meeting
kind: 1on1 | staff | roundtable | decision | external
date: YYYY-MM-DD
attendees: ["[[Name1]]", "[[Name2]]"]
related_projects: ["[[Project]]"]
source: plaud | notion-ai | teams | zoom | meet | file | other   # optional, see Source references
source_id: <recording or page id>                                # optional
source_url: <stable link>                                        # optional, never a signed URL
```

**Decision:**
```yaml
type: decision
date: YYYY-MM-DD
status: active | superseded | proposed
owner: "[[Name]]"
supersedes: "[[Decision Title]]"   # optional
projects: ["[[Project]]"]
```

**Project:**
```yaml
type: project
status: active | blocked | backlog | done
lead: "[[Name]]"            # day-to-day lead; can be the user or any team member
stakeholders: ["[[Name]]"]
start_date: YYYY-MM-DD
phase: [current phase label]
tracker:                    # optional: issue or project key/URL in the team's tracker (Linear, Jira, Asana)
```

## Tag taxonomy (hierarchical, slash-delimited)

- People: `#person/direct-report`, `#person/peer`, `#person/manager`, `#person/stakeholder/internal`, `#person/stakeholder/external`, `#person/former`
- Meetings: `#meeting/1on1`, `#meeting/staff`, `#meeting/roundtable`, `#meeting/decision`, `#meeting/external`
- Decisions: `#decision/active`, `#decision/superseded`, `#decision/proposed`
- Projects: `#project/<slug>`
- Status: `#status/active`, `#status/blocked`, `#status/backlog`, `#status/done`
- Inbox: `#inbox/unprocessed`, `#inbox/needs-review`
- Reference: `#playbook`, `#strategy`

## Periodic notes

Daily and Weekly notes are constructed by date; there is no auto-creation. Use today's date from the `<env>` block. To read or create a daily note, Read or Write `<vault-path>/Daily/YYYY-MM-DD.md` (Weekly is analogous). Always build the path from the current date explicitly.

## Two-step existence check (gitignored paths)

Before writing any file in a gitignored folder (`team/`, `stakeholders/`, `projects/`, `meetings/notes/`, `decisions/`, `weekly-reviews/`, `inbox/`, `outbox/`, `strategy/`, `context.md`, etc.):

1. `bash ls <target file path>` (direct existence check).
2. `bash ls <parent folder>` (catch name variations and near-matches).

If either shows the file exists (or something close), stop and Read it first, then append or update. Never overwrite. Never use `Glob` on gitignored folders: it silently returns nothing (git-filtered), which has caused an existing file to be overwritten. If any listing returns empty or only `.gitkeep`, assume a git-filtered result and re-check with `bash ls` before concluding the folder is empty. Hard rule, no exceptions.

## Source references, not copies (hard rule)

Meeting sources (Plaud and other recorders, Notion AI meeting notes, Teams/Zoom/Meet transcripts) already keep the full transcript. Lore reads a transcript to extract what matters and never writes a copy of it into the repo, the vault, or Notion: retyping it spends output tokens on data that already exists.

- **Store:** the meeting note (built from the source's own summary when there is one, per `process-transcript.md`), the extracted observations, decisions and action items, and a **source reference**: source type, source ID, a link if the source has a stable one, date and start time in the user's timezone, duration.
- **Copy verbatim only the user's own words:** notes they typed into the source, highlights they flagged (Plaud `mark_memo`), comments. Short, and nowhere else Lore controls. They go under `## Your notes` in the meeting note.
- **Where the reference lives: on the meeting note itself, never a separate transcript record.** Filesystem mode, a `Source:` first line; Obsidian mode, `source` / `source_id` / `source_url` frontmatter; Notion mode, `Source` / `Source ID` / `Source URL` properties on the meeting page. Notion AI meeting notes: `Source` = `notion-ai`, `Source URL` = the meeting-notes page; link it, never duplicate it.
- **Never store** expiring links (signed audio URLs).
- **Exceptions:** a transcript the user drops into `meetings/transcripts/` (or the vault's `Transcripts/`) is already stored; process it in place, don't copy it. A transcript pasted into chat with no other home: ask once whether to keep a copy before writing one.
- **Older installs** may hold full transcripts saved before this rule. Leave them; don't backfill or delete without the user asking.

## Decision-log discipline

A decision earns a log entry only if all three hold: (a) hard to reverse, (b) surprising without context (a future reader would ask "why did they do it this way?"), (c) the result of a real trade-off between genuine alternatives. If any is missing, it belongs in the meeting or project note, not the decision log. Always record the options considered, not just the outcome. Capture decisions inline the moment they crystallize, not batched at session end.

## Terminology and glossary

If `context.md` has a `## Terminology & Corrections` section, silently apply its corrections when processing transcripts or ingesting documents; never preserve incorrect spellings in output. It is also a living glossary: (a) if a term is used in a way that conflicts with its definition, flag the conflict rather than silently choosing a meaning; (b) if a new recurring term appears (codename, acronym, jargon) that the glossary lacks, propose adding it; (c) update entries inline when a term resolves, never in a batch. Older context files may use a plain corrections table; honor it the same way.

## Verification loops

Before declaring any multi-step operation done, name the observable signal that confirms it, then check that signal. Examples: after writing to The Quest Log, re-query the documents you wrote and report what changed and what was skipped; after writing or editing vault notes, Read at least one back to confirm the edit landed; after a triage run, reconcile items found vs items dispositioned and report the counts. "It should have worked" is not a signal.

## Recap sourcing (any workflow that summarizes a period)

Applies to every workflow whose output summarizes what happened over a window: `roundtable-prep`, `unrolled`, `morning-sync`, `1on1-prep`, `cadence`, `handoff`, and the Friday weekly review. A workflow that recaps a period and is not named here still follows this section.

**Sweep the agent sessions in the window.** A large share of the user's work happens inside agent sessions, not in Slack, email, or meeting notes, so a recap built only from messages and notes undercounts what they did. There are two populations and neither covers the other:

| Population | How to read it |
|---|---|
| **Cowork sessions** | Whatever session-history tools this session exposes (for example `list_sessions` plus `read_transcript`). The listing may carry no timestamps: date a session from its transcript, never from its position in a list. Skip child sessions (subagents of one already counted) and the session you are running in. If this session has no session-history tools, say so in the coverage line. |
| **Claude Code sessions** | The digest at `inbox/cc-sessions/sessions.jsonl`, written by `scripts/build-cc-session-digest.js` run **from Claude Code** (Cowork cannot read `~/.claude`; a Glob there may list files that Read then refuses). |

For the digest:

- One JSON object per session: `projectRoot`, `activeDates`, `start`, `end`, `userMessages`, `filesTouched`, `firstPrompt`.
- **Window on `activeDates`, never on `start`.** Sessions get resumed for days or weeks; filtering by start date drops resumed work out of the period it happened in.
- **`activeDates` are local calendar days in the zone of the machine that built the digest (the windowed `digest-*.md` it writes alongside names that zone); `start` and `end` are UTC instants.** Never slice a day out of `start`: evening work lands on the next UTC day and Friday work in the next ISO week. If that zone differs from `context.md`'s, the digest was built elsewhere and day assignments need re-checking.
- **Never total elapsed minutes into an hours figure.** Wall-clock span includes idle nights. Report distinct active days, session count, and files written.
- **Group by `projectRoot`**, which rolls git worktrees up into their project.
- `summary` is usually null; use `firstPrompt` plus `filesTouched` to say what a session was.
- **Missing or older than the window:** say so and offer the fix ("My view of your Claude Code sessions stops at <date>. Run `node scripts/build-cc-session-digest.js --days 90` from Claude Code in this repo and I'll pick it up."). Never silently omit the population.
- The digest is a table of contents, not an archive: opening prompts and file paths only, never conversation bodies.

Across both populations: count what you find as the user's work (artifacts shipped, decisions made, problems solved, things unblocked), reconcile rather than double-count (a session that produced an `outbox/` file and the file are one item), and **name the coverage in the artifact's source line** ("Cowork sessions plus Claude Code through 2026-10-09"). Never imply coverage you did not have.

Action items need no freshness gate: The Quest Log is read live (`workflows/action-items.md`). Say when you read it.

## Timezone (hard rule)

Every artifact that renders a time (briefs, triage records, meeting notes, filename `-HHMM` suffixes) converts through the user's timezone, **read from `context.md` → "Notes for Lore" → Timezone** as an IANA name (for example `America/Phoenix`).

- Convert explicitly: `TZ=<zone> date -d @<unix_ts>`, or format the ISO `Z` string against that zone. A bare `date` in the sandbox, local or cloud, is not evidence of the user's zone.
- **Never guess the zone from a state, city, or "Mountain time".** Some regions skip daylight saving while their neighbors observe it (Arizona, for one), so a region name can be wrong by an hour for most of the year. A wrong guess silently mislabels every timestamp in every brief until someone notices.
- No timezone recorded: ask, then record it. Do not proceed on a guess.

## Outlook draft body formatting (hard rule)

`outlook_create_draft` / `outlook_create_reply_draft` / `outlook_create_reply_all_draft` / `outlook_update_draft` take a `bodyType` and enforce it strictly.

- **Never use the `comment` parameter; always `body` + `bodyType`.** `comment` is plain text that the connector HTML-escapes before prepending it to the quoted original, so any markup reaches the recipient as visible `<p>` tags. The tell on inspection: `body.contentType: "html"` with the reply text escaped to `&lt;p&gt;` above a real-HTML quoted original.
- `bodyType: "text"` → plain prose only, never tag characters (they render literally). Separate paragraphs with a blank line; the connector converts newlines to `<br />`, including above an HTML quoted original.
- **Self-check before every draft call:** with `bodyType: "text"`, the `body` string contains zero `<` characters. If it has any, it was composed as HTML: strip to blank-line prose or switch to `"html"`. Check the string you are about to pass, not after the fact.
- `bodyType: "html"` → every paragraph in `<p>...</p>`, breaks as `<br>`, bare tags only, no attributes beyond `a[href|name|target]`. Never re-embed a quoted original's styled HTML through `outlook_update_draft`; it is rejected. To fix a reply draft's body, delete it and recreate it from the source message so the tool rebuilds the quote.
- Default to `"text"` for ordinary short replies; use `"html"` only for a list, a link, or paragraphs the blank-line convention would blur.
- A returned `id` and `webLink` do not prove the body is clean. If there is doubt about the bodyType used, read the draft back.
