# Obsidian Setup

> **DEPRECATED.** This workflow was written for the cyanheads obsidian-mcp-server. Lore now uses basic-memory as the vault MCP. Setup instructions for new users are in `README.md` → "Obsidian integration". The content below is preserved for reference but should not be followed directly -- tool names and parameter shapes no longer match.

For existing users (people who already have a `context.md` and accumulated filesystem-mode data) who connect Obsidian for the first time. Sets up the vault subfolder configuration and offers to migrate existing data.

## When to run this workflow

You (Lore) trigger this in two cases:

1. **Detected at session start.** Per `CLAUDE.md` → "Obsidian Detection", when the Obsidian MCP is connected AND `context.md` exists AND `context.md` has no **Vault Configuration** under **Notes for Lore**, offer this workflow:
   > "I noticed your Obsidian vault is connected, but your `context.md` doesn't have a Vault Configuration recorded yet. Want me to set it up? I can also migrate your existing people, decisions, and strategy docs into the vault while we're at it."
   If the user says yes, run this workflow. If no, leave a single line note in your reply that they can run it later by saying "set up Obsidian" or similar.

2. **Explicitly invoked.** The user says "set up Obsidian", "configure my vault", "migrate to Obsidian", or similar.

Do NOT run this workflow during fresh-install onboarding, that case is handled by Phase 7.5 in `workflows/onboarding.md`.

---

## Step 1, Confirm intent and scope

Open with a short framing:

> "Setting up your Obsidian vault as Lore's canonical store for entity data (people, meetings, decisions, projects). The workspace repo stays in place for workflows, templates, and the action-items artifact. Personal data moves into the vault so we get wikilinks and backlinks."

Then ask:

> "I'll do two things: (1) record your vault subfolder name in `context.md`, (2) optionally migrate your existing filesystem data into the vault. The migration is opt-in per data type, you can do all of it, some of it, or none. Sound good?"

Wait for confirmation.

---

## Step 2, Ask for subfolder name

Use AskUserQuestion-style multiple choice:

> "What should I call Lore's subfolder inside your vault?"

Present these options:
1. **`Lore/` (Recommended)** — the default; works for most users.
2. **`Lore - <YourOrg>/`** — useful if you plan to run separate Lore instances per org or context (e.g., `Lore - Acme/`, `Lore - Personal/`). Pick this if you want room to add more later.
3. **Other** — let the user type a custom name.

Record the chosen name; you'll use it throughout the rest of the workflow.

---

## Step 3, Write Vault Configuration to context.md

Read `context.md`. Locate the **Notes for Lore** section (it may also be titled "Notes for Claude" in older installs; treat them as equivalent and rename the heading to "Notes for Lore" if it's the old name).

Add (or update) a **Vault Configuration** subsection at the top of that section:

```markdown
### Vault Configuration

- **Obsidian vault subfolder**: `<chosen name>/`
- This is the active subfolder name. Whenever a workflow file references `Lore/<subfolder>/` as a vault path, substitute `<chosen name>/<subfolder>/`.
- Active subfolders: `<chosen name>/People/`, `<chosen name>/Meetings/`, `<chosen name>/Transcripts/`, `<chosen name>/Decisions/`, `<chosen name>/Strategy/`. Periodic notes (Daily/Weekly) will land under the same prefix when configured.
```

If the user is running this because they're moving from `Lore/` to `Lore - <Something>/` (or vice versa), update the existing subsection.

---

## Step 4, Survey existing filesystem data

Use `bash ls` (not `Glob`, per `CLAUDE.md`'s gitignored-folder rule) to list each personal folder:

- `team/`
- `stakeholders/`
- `projects/`
- `decisions/` (specifically `decisions/log.md`)
- `strategy/`
- `meetings/notes/`
- `meetings/transcripts/`
- `weekly-reviews/`

Count what's in each. Report back to the user with the counts:

> "Here's what I found in your filesystem:
> - `team/`: N direct report profiles
> - `stakeholders/`: N stakeholder profiles
> - `projects/`: N project files
> - `decisions/log.md`: ~N decisions (rough count from headings)
> - `strategy/`: N strategy docs
> - `meetings/notes/`: N meeting notes
> - `meetings/transcripts/`: N transcripts
> - `weekly-reviews/`: N weekly review entries
>
> Which would you like to migrate?"

Use AskUserQuestion with `multiSelect: true`. Options:
1. **People** (team + stakeholders → `<vault subfolder>/People/`) — Recommended; everything else benefits from people being in place
2. **Projects** (project files → `<vault subfolder>/Projects/`)
3. **Decisions** (split `decisions/log.md` into one note per decision under `<vault subfolder>/Decisions/`)
4. **Strategy** (vision/roadmap docs only → `<vault subfolder>/Strategy/`)
5. **Meetings + Transcripts** (raw move, no transformation; wikilinking can happen later)
6. **Skip migration for now** (just record the config, migrate later)

If the user picks "Skip", jump to Step 7.

> **Note on Strategy vs Projects**: Before migrating `strategy/`, scan its files. Any file that is a project reference doc (SOW, vendor engagement brief, scoped initiative spec) should be migrated to `Projects/` instead of `Strategy/`. `Strategy/` in the vault is for vision, roadmap, and positioning content only.

---

## Step 5, Execute migration

For each selected category, dispatch a focused subagent (or do inline if scope is small) using the patterns established in the workspace's prior migration. The agents should:

- **Always preserve original filesystem content.** Don't delete the source files; the user may want them as a backup. They can clean up later.
- **Apply wikilink transformations** using a canonical name map built from `context.md` (direct reports from the My Team table; stakeholders from the Key Stakeholders table). For names that appear in profiles but aren't in those tables, ask the user before linking.
- **Add the appropriate frontmatter** per the schemas in `CLAUDE.md` → "Obsidian Mode Conventions" → "Frontmatter schemas".
- **Tag per the taxonomy** in the same section.
- **No em dashes** anywhere.
- **One MCP call per file write** (`mcp__obsidian__obsidian_append_to_note`, which creates the file if it doesn't exist).

### People migration

Source: `team/*.md` and `stakeholders/*.md`.
Destination: `<vault subfolder>/People/<Full Name>.md`.

Build the canonical name map from `context.md`'s My Team and Key Stakeholders tables. Apply frontmatter:

```yaml
---
type: person
role: direct-report | peer | manager | stakeholder/internal | stakeholder/external
team: <team>
manager: "[[<Manager Full Name>]]"   # direct reports only
start_date: YYYY-MM-DD               # if known
last_1on1: YYYY-MM-DD                # if discoverable from Observations
tags: [person/<role>]
---
```

Internal vs external: if the stakeholder's profile says "Company: <user's company>" or similar, internal. Vendors / partners (Aspire North-like) are external. When ambiguous, default to internal.

### Projects migration

Source: `projects/*.md`.
Destination: `<vault subfolder>/Projects/<Project Title>.md`.

Use the project file's `# Heading` as the note title. Apply frontmatter from the status table in the file:

```yaml
---
type: project
status: active | blocked | done
owner: "[[<Owner Full Name>]]"
stakeholders: ["[[Name1]]", "[[Name2]]"]
start_date: YYYY-MM-DD
phase: [current phase label from Status table]
tracker:     # populate from Tracker field in Status table; omit if N/A
tags: [project/<slug>, status/<status>]
---
```

Apply wikilinks for any canonical names in the body. The `## Team` section names should become `[[Full Name]]` wikilinks. Add `related_projects: ["[[<This Project>]]"]` to any meeting notes that reference this project.

### Decisions migration

Source: `decisions/log.md`.
Destination: one note per decision under `<vault subfolder>/Decisions/<YYYY-MM-DD> <Title>.md`.

Split on `### YYYY-MM-DD - <Title>` headings. Skip template / placeholder entries. Apply frontmatter:

```yaml
---
type: decision
date: YYYY-MM-DD
status: active | superseded | proposed
owner: "[[<Decision Maker>]]"
projects: ["[[<Project>]]"]
tags: [decision/<status>]
---
```

Sanitize filesystem-unsafe characters in titles (`:` → ` -`, `/` → ` or `, etc.).

### Strategy migration

**Important**: `strategy/` holds only genuine strategy documents (vision, roadmap, positioning). Project-specific reference files belong in `projects/` and should be migrated under "Projects migration" above, not here. If any files in `strategy/` look like project reference docs (SOWs, vendor briefs, scoped initiative specs), surface them to the user and suggest migrating them as project files instead.

Source: `strategy/*.md` (vision/roadmap content only).
Destination: `<vault subfolder>/Strategy/<Original Filename Title-Cased>.md`.

Frontmatter:

```yaml
---
type: strategy
tags: [strategy]
---
```

Apply wikilinks for any canonical names that appear in the body.

### Meetings + Transcripts migration

This is a RAW MOVE. No transformations. No frontmatter additions. No wikilink rewriting. Just copy the file contents byte-for-byte to the destination.

Source: `meetings/notes/*.md` → `<vault subfolder>/Meetings/`.
Source: `meetings/transcripts/*.md` → `<vault subfolder>/Transcripts/`.

After the move, suggest a follow-up pass to wikilink the meeting bodies (a separate task; not part of this initial migration to keep scope manageable).

---

## Step 6, Verify

After all migrations complete:

1. List each `<vault subfolder>/<category>/` folder via `mcp__obsidian__obsidian_list_notes` and confirm counts match expectations.
2. Spot-check 2-3 files per category by reading them back and confirming frontmatter and wikilinks are clean.
3. If meetings or transcripts were moved, confirm the source folders in the repo are still intact (we keep them as a backup).
4. Report the final counts to the user.

---

## Step 7, Wrap up

Tell the user:

> "Your vault is configured and ready. From here on, Lore writes new people, meetings, decisions, and projects to `<vault subfolder>/` automatically when workflows run. The filesystem copies in this repo are untouched, you can keep them as a backup or delete them whenever you're comfortable."

Then suggest next steps based on what was migrated:

- **If People was migrated**: "Try saying 'prep for my 1:1 with [name]', I'll pull from the vault note now."
- **If Meetings was migrated raw**: "When you're ready, I can run a wikilink pass over the migrated meeting notes to add `attendees:` frontmatter and link names in the body. Just say 'wikilink my meetings'."
- **If nothing was migrated**: "Config is in place. New data will land in the vault from here on. You can run this workflow again later to migrate existing filesystem content."

Finally, remind them they can edit `context.md` directly to change the subfolder name later if they ever need to.

— 📜 Lore
