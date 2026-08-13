# Lore Conventions (shared)

Single source of truth for shared conventions. Read on demand from workflows (e.g. "see `_conventions.md` → Frontmatter schemas"). Not loaded every session.

## Storage-mode branching

Every workflow that touches entity data branches on storage mode. Decide once per session:

1. Read `context.md` → **Notes for Lore** → **Vault Configuration** for a recorded vault path.
2. If a vault path is recorded, the session is **Obsidian mode**: the vault is canonical for entity context (people, projects, meetings, decisions, observations). Confirm the vault is live by probing the **Semantic Notes Vault MCP** (`system` info, or any `vault`/`dataview` call), NOT by `bash ls` on the recorded path.
   - **The vault often lives in iCloud (`iCloud~md~obsidian/...`), which is not mounted in the shell sandbox. A failed `bash ls` on that path means the shell can't see it, NOT that the vault is unreachable.** Never downgrade to Filesystem mode off a bash path check alone. Verified 2026-07-14: a bash-only check wrongly forced Filesystem mode for a whole 1:1 prep while the MCP was connected the entire time, dropping canonical observations and a required "Topics to Raise in Next 1:1" coaching item.
3. Fall back to **Filesystem mode** (entity data in repo folders `team/`, `stakeholders/`, `projects/`, `meetings/`, `decisions/`) only when either (a) no vault path is recorded, or (b) a vault path is recorded but the Semantic Notes Vault MCP is genuinely unreachable AND native reads against the vault path also fail. State which of these triggered the fallback.
4. The action-items artifact is canonical for action items in **both** modes (see `workflows/action-items.md`).

Read the matching context file only: Obsidian mode reads `Context.md` from the vault root (adds wikilinks on entity tables); filesystem mode reads `context.md` at repo root. Same information; write updates to the active-mode file only, never both.

## Vault structure (Obsidian mode)

Personal entity data lives under a dedicated subfolder inside the user's vault. The repo still holds workflows, templates, playbooks, scripts, and the action-items snapshot.

```
<vault-root>/
├── People/        one note per person (direct reports, peers, stakeholders)
├── Meetings/      one note per meeting; wikilinks to People
├── Transcripts/   raw transcripts; .processed / .plaud-processed live in the repo, not here
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
status: active | departed          # omit or "active" for current employees
aka: <fuller/legal name>           # optional; only if different from filename
last_1on1: YYYY-MM-DD             # direct reports only
departure_date: YYYY-MM-DD          # optional; only when departed
departure_reason: resigned | terminated | retired | transferred   # optional
tags: [person/direct-report]       # appropriate tag from taxonomy
```

**Meeting:**
```yaml
type: meeting
kind: 1on1 | staff | roundtable | decision | external
date: YYYY-MM-DD
attendees: ["[[Name1]]", "[[Name2]]"]
related_projects: ["[[Project]]"]
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
tracker:                    # optional: Jira epic key, Asana/Linear URL, etc.

# Roadmap fields (added 2026-07-31). Required on any note that maps to a tracker epic.
swimlane: quoting-sales-dtc | ops-platform | service-retention | data-reporting
value_type: direct | enabling | obligation
roadmap_state: active | parked
annualized_benefit:         # dollars, integer, no formatting. Required when value_type is direct.
blocked_by: ["[[Other Project]]"]   # optional; cross-lane dependencies
channel: dtc                # optional; only where the item needs a visible channel tag
```

### The tracker side: labels, not hierarchy

Decided 2026-07-31. **The roadmap does not use Jira's Initiative hierarchy level.** Swimlane, value type, channel and parked state are all Jira **labels**; epics stay unparented.

| Label | Values |
|-------|--------|
| swimlane | `swimlane-quoting-sales-dtc`, `swimlane-ops-platform`, `swimlane-service-retention`, `swimlane-data-reporting` |
| value type | `value-direct`, `value-enabling`, `value-obligation` |
| channel | `channel-dtc` (optional, second axis) |
| parked | `roadmap-parked` (absence means active) |

Why labels beat a parent here:

- **One primitive for every axis.** Channel cuts across swimlane, so a parent could only ever express one of them. Labels are additive.
- **Re-cutting the deck is a label change**, not a reparenting exercise.
- **No Jira admin required.** No custom fields to request, so the model can ship without waiting on anyone.
- The Initiative layer was vestigial: 28 initiatives, 0 owners, 0 dates, 3 with a written description, and 21 of 48 open epics had no parent anyway. A field that exists because the hierarchy has a slot for it is worse than no field, because it reads as meaningful.

The dollar figure is the one thing a label cannot carry. `annualized_benefit` lives in the vault note's frontmatter, or comes from a Planner export at generation time. No Jira number field is needed.

The generator's scope query is therefore label-based, never parent-based:

```
  AND labels in (swimlane-quoting-sales-dtc, swimlane-ops-platform,
                 swimlane-service-retention, swimlane-data-reporting)
```

An open epic with no swimlane label is a contract violation and gets named on the weekly page. That is the replacement for the old orphan problem, and it self-reports.

**Company targets go in the artifact header, not in Jira.** The 2 objectives that carried real numbers (`Increase Policy Retention (2026 Target: 90%)`, `Increase Policy Production (2026 Target: 60 PPA)`) are company goals. The monthly deck states them above the swimlanes. A Jira hierarchy level is a poor place to keep a goal.

### Roadmap field semantics

Added for the roadmap generator (`workflows/roadmap.md`). See `outbox/roadmap-swimlane-assignments.md` for the assignment record these were derived from.

- **`value_type` answers what kind of benefit, `roadmap_state` answers whether we are doing it.** They are independent. A parked epic still has a value type.
- **`value_type: direct` requires `annualized_benefit`.** The generator reports a missing benefit on a direct item as a contract violation by name. Enabling items report as "enables [outcome]"; obligation items report the risk retired.
- **`roadmap_state: parked`** means defined and deliberately not prioritized. Parked items appear in the Parked column of the monthly deck's On the Horizon slide and in the weekly page, never in Coming Up. Distinct from `status: backlog`, which is about the project's own lifecycle; a parked item can be `status: backlog` or `status: active`.

### Date confidence, 4 states

The first draft of this rule had 3 states and a hole: an epic with every child in a sprint but no date of its own matched neither Committed nor Unscheduled. That is the most common case in the vault, and it is exactly the Jira Plans rollup scenario. Corrected 2026-07-31 during the vault seeding, after 3 of the first 23 epics fell in the gap.

| State | Rule |
|-------|------|
| `committed` | The epic has a hand-set Target end or duedate, and every child sits in a sprint ending on or before it. |
| `rollup` | No date on the epic, but every child sits in a sprint. The date is derived from the latest child sprint's end. This is what Plans shows and presents as certain. |
| `provisional` | A date exists (hand-set or rollup) but some children are not in a sprint, so the date only reflects the scheduled subset. Report the ratio, e.g. "6 of 8 children scheduled". |
| `unscheduled` | No children in any sprint, or no children at all. |
| `at-risk` | A date exists and every child is scheduled, but evidence contradicts the date: it falls before dated work in the children, or it has already passed while the epic is open. Beats `committed` whenever both apply. |

Always record the evidence next to the label, as a ratio and a date: "rollup, 5 of 5 children scheduled, latest sprint ends 2026-08-09".


### Jira API constraints the generator must work around

Measured 2026-07-31 while seeding 43 notes. These are properties of the Atlassian MCP, not of Jira.

- **`searchJiraIssuesUsingJql` ignores `fields`.** Full descriptions always return, so results overflow the token limit fast. Use `searchResultMode: "count"` to size a query first (~350 tokens), then page with `maxResults: 3` and `nextPageToken`.
- **`getJiraIssue` does respect `fields`.** `["summary","status","duedate","description"]` costs a few hundred tokens. Prefer it for single issues.
- **Target end values cannot be read.** The field is silently dropped from responses. Its value can only be bounded by JQL comparison (`"Target end" >= x AND "Target end" <= y`). Any generator needing exact target dates has to binary-search them or use a different access path. This is the single biggest blocker to automating the confidence label.
- **Sprint end dates are not exposed.** Membership is queryable (`sprint is not EMPTY`, `openSprints()`), the end date is not. So `committed` can never be fully verified through this MCP; the on-or-before clause stays an assumption. Name the sprint rather than asserting its end date.
- **Concurrent sessions cross-contaminate.** Running parallel agents against this MCP returned other sessions' payloads repeatedly on 2026-07-31, including full ticket bodies from a sibling batch. Always check the `webUrl` or `key` in a response matches the JQL sent, and do not fan out parallel Jira work.
- **Overflow files are readable.** When a response spills to `/var/folders/…`, the native Read tool reaches it, and `Grep -o` for `"key":` and `"summary":` extracts child data more cheaply than re-querying.

- **Notes with no `jira` key and `type: project`** are pre-tracker ideas: real work that exists in the user's head but not in the tracker. The weekly page lists these separately as gap detection. Do not delete them and do not invent epic keys for them.

## Tag taxonomy (hierarchical, slash-delimited)

- People: `#person/direct-report`, `#person/peer`, `#person/manager`, `#person/stakeholder/internal`, `#person/stakeholder/external`, `#person/former`
- Meetings: `#meeting/1on1`, `#meeting/staff`, `#meeting/roundtable`, `#meeting/decision`, `#meeting/external`
- Decisions: `#decision/active`, `#decision/superseded`, `#decision/proposed`
- Projects: `#project/<slug>`
- Status: `#status/active`, `#status/blocked`, `#status/backlog`, `#status/done`
- Roadmap: `#roadmap/direct`, `#roadmap/enabling`, `#roadmap/obligation`
- Inbox: `#inbox/unprocessed`, `#inbox/needs-review`
- Reference: `#playbook`, `#strategy`

## Periodic notes

Daily and Weekly notes are constructed by date; there is no auto-creation. Use today's date from the `<env>` block. To read or create a daily note, Read or Write `<vault-path>/Daily/YYYY-MM-DD.md` (Weekly is analogous). Always build the path from the current date explicitly.

## Two-step existence check (gitignored paths)

Before writing any file in a gitignored folder (`team/`, `stakeholders/`, `projects/`, `meetings/notes/`, `decisions/`, `weekly-reviews/`, `inbox/`, `outbox/`, `strategy/`, `context.md`, etc.):

1. `bash ls <target file path>` (direct existence check).
2. `bash ls <parent folder>` (catch name variations and near-matches).

If either shows the file exists (or something close), stop and Read it first, then append or update. Never overwrite. Never use `Glob` on gitignored folders: it silently returns nothing (git-filtered), which has caused an existing file to be overwritten. If any listing returns empty or only `.gitkeep`, assume a git-filtered result and re-check with `bash ls` before concluding the folder is empty. Hard rule, no exceptions.

## Decision-log discipline

A decision earns a log entry only if all three hold: (a) hard to reverse, (b) surprising without context (a future reader would ask "why did they do it this way?"), (c) the result of a real trade-off between genuine alternatives. If any is missing, it belongs in the meeting or project note, not the decision log. Always record the options considered, not just the outcome. Capture decisions inline the moment they crystallize, not batched at session end.

## Terminology and glossary

If `context.md` has a `## Terminology & Corrections` section, silently apply its corrections when processing transcripts or ingesting documents; never preserve incorrect spellings in output. It is also a living glossary: (a) if a term is used in a way that conflicts with its definition, flag the conflict rather than silently choosing a meaning; (b) if a new recurring term appears (codename, acronym, jargon) that the glossary lacks, propose adding it; (c) update entries inline when a term resolves, never in a batch. Older context files may use a plain corrections table; honor it the same way.

## Verification loops

Before declaring any multi-step operation done, name the observable signal that confirms it, then check that signal. Examples: after an action-items push, confirm the build script succeeded and report the op count applied; after writing or editing vault notes, Read at least one back to confirm the edit landed; after a triage run, reconcile items found vs items dispositioned and report the counts. "It should have worked" is not a signal.
