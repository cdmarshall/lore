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
WHERE (lead = this.file.link OR contains(stakeholders, this.file.link)) AND status != "done"
SORT status ASC, file.name ASC
```

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
status: active | blocked | done
lead: "[[Name]]"            # day-to-day lead; can be the user or any team member
stakeholders: ["[[Name]]"]
start_date: YYYY-MM-DD
phase: [current phase label]
tracker:                    # optional: Jira epic key, Asana/Linear URL, etc.
```

## Tag taxonomy (hierarchical, slash-delimited)

- People: `#person/direct-report`, `#person/peer`, `#person/manager`, `#person/stakeholder/internal`, `#person/stakeholder/external`, `#person/former`
- Meetings: `#meeting/1on1`, `#meeting/staff`, `#meeting/roundtable`, `#meeting/decision`, `#meeting/external`
- Decisions: `#decision/active`, `#decision/superseded`, `#decision/proposed`
- Projects: `#project/<slug>`
- Status: `#status/active`, `#status/blocked`, `#status/done`
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
