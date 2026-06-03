# basic-memory Migration Plan

> Migrate vault MCP from cyanheads/obsidian-mcp-server to basic-memory.
> Vault path: `/Users/cmarshall/Library/Mobile Documents/iCloud~md~obsidian/Documents/Lore - Rate`
>
> **Status as of 2026-06-03**: Phases 1–6 complete. Phase 7 (commit) remaining.

---

## Phase 1: Install basic-memory

Run these in your terminal. `uv` will handle downloading Python 3.12 automatically.

```bash
# Install basic-memory globally via uv
uv tool install basic-memory

# Confirm it's installed and check version
basic-memory --version
```

---

## Phase 2: Register the vault as a basic-memory project

Use `--default` in the `add` command to register and set default in one step (avoids a known CLI bug -- see Troubleshooting below):

```bash
bm project add lore "/Users/cmarshall/Library/Mobile Documents/iCloud~md~obsidian/Documents/Lore - Rate" --default

# Confirm it registered correctly
bm project list
```

Expected output from `project list` should show `lore` pointing at your vault path and marked as default.

### Gotcha: basic-memory creates a "main" project by default

On first install, basic-memory may auto-create a `main` project pointing at `~/basic-memory`. You don't need it. Remove it:

```bash
bm project remove main
```

If that returns "main not found", the project exists in the config but wasn't registered through the CLI. Edit the config directly (see Troubleshooting below).

### Gotcha: `bm project default <name>` may silently fail

If you run `bm project default lore` and see "No default project is currently set", the command may have failed without setting anything. Always verify with `bm project list`. If `lore` is not marked as default, fix it manually (see Troubleshooting below).

---

## Phase 3: Let basic-memory index the vault

```bash
# Run doctor to check file-to-DB consistency and trigger initial indexing
basic-memory doctor

# Optional: check overall status
basic-memory status
```

This builds the SQLite index over your existing notes. It will take a moment for a large vault. You only need to do this once; after that the index stays current automatically.

---

## Phase 4: Wire basic-memory into Cowork / Claude Code

Claude Code (which powers Cowork) reads MCP config from `~/.claude.json` (global) or `.claude/settings.json` (project-level). Check which one has your current Obsidian MCP entry:

```bash
# Check global config
cat ~/.claude.json | python3 -m json.tool | grep -A5 obsidian

# Check project-level config
cat /Users/cmarshall/src/lore/.claude/settings.json 2>/dev/null | python3 -m json.tool | grep -A5 obsidian
```

Once you find it, open that file in your editor and:

1. **Remove** the existing `obsidian` or `obsidian-mcp` entry.
2. **Add** the basic-memory entry:

```json
"basic-memory": {
  "command": "uvx",
  "args": ["basic-memory", "mcp"]
}
```

> `uvx` is ephemeral (no auto-update), but that's fine for local use. If you want auto-updates, switch to `"command": "basic-memory", "args": ["mcp"]` after the `uv tool install` in Phase 1.

**Restart Claude Desktop / Cowork** after saving the config file.

---

## Phase 5: Verify the connection

In a new Cowork session, confirm the tools are available:

```
Ask: "List my basic-memory projects"
```

Lore will call `list_memory_projects` and should return the `lore` project pointing at your vault. Then do a quick read test:

```
Ask: "Read the People folder from the vault"
```

Lore should call `list_directory(dir_name: "People/")` and return your person notes.

---

## Phase 6: Update workflow files ✓ COMPLETE

All workflow files have been updated. For reference, the tool substitution table:

| Old (obsidian-mcp-server) | New (basic-memory) |
|---|---|
| `obsidian_search_notes` | `search_notes` |
| `obsidian_get_note` | `read_note` |
| `obsidian_list_notes` | `list_directory` |
| `obsidian_append_to_note` | `write_note` (new notes) or `edit_note(operation: "append")` (existing) |
| `obsidian_patch_note` (append under heading) | `edit_note(operation: "find_replace")` |
| `obsidian_replace_in_note` | `edit_note(operation: "find_replace")` |
| `obsidian_manage_frontmatter` | `edit_note(operation: "find_replace")` on the specific key |
| `mcp__obsidian__obsidian_*` | corresponding `mcp__basic-memory__*` equivalent |
| `target: {"type": "path", "path": "..."}` | plain string identifier |
| `mode: "jsonlogic"` queries | `note_types: [...]` and `metadata_filters: {...}` |
| `mode: "text"` queries | `search_type: "hybrid"` (or omit; hybrid is default) |
| periodic note calls | construct from today's date: `read_note("Daily/YYYY-MM-DD")` |

---

## Phase 7: Commit the changes

```bash
cd /Users/cmarshall/src/lore
git add CLAUDE.md context.md README.md basic-memory-migration-plan.md \
  workflows/process-transcript.md workflows/ingest-notes.md workflows/triage.md \
  workflows/plaud-sync.md workflows/ingest.md workflows/1on1-prep.md \
  workflows/roundtable-prep.md workflows/onboarding.md workflows/obsidian-setup.md
git commit -m "migrate: replace obsidian-mcp-server with basic-memory as vault MCP

CLAUDE.md:
- Obsidian Detection probe changed from obsidian_list_notes to list_memory_projects
- Added MCP layer note clarifying basic-memory replaces cyanheads server
- First Things First: read Context.md via read_note() instead of obsidian_get_note
- Vault Structure: periodic notes now constructed from date (no periodic type support)
- Obsidian Mode Conventions: rewrote 'Tools to lean on' section with full
  basic-memory API reference (read_note, list_directory, search_notes, write_note,
  edit_note with all operations, build_context, recent_activity)
- Frontmatter updates: find_replace pattern instead of obsidian_manage_frontmatter
- Path resolution: no Lore/ prefix for this vault; updated wikilink guidance
- Creating Outputs: project updates use edit_note(find_replace) instead of obsidian_patch_note

context.md (Notes for Lore > Vault Configuration):
- Added vault path, MCP name (basic-memory), and project name (lore)
- Updated periodic notes path convention (Daily/YYYY-MM-DD.md)

README.md (Obsidian integration section):
- Replaced all cyanheads/obsidian-mcp-server references with basic-memory
- Updated 'What this gives you': semantic search, no Obsidian-must-be-open requirement,
  edit_note instead of obsidian_patch_note
- Updated Daily/Weekly notes description (date-named files, no periodic machinery)
- Rewrote Setup section as 5 clear steps with correct commands
- Added Troubleshooting subsection covering two real CLI bugs encountered during
  migration: bm project default silent failure and bm project remove not found,
  both with Python config-edit workarounds; plus bm reindex for index issues

workflows/process-transcript.md:
- obsidian_patch_note -> edit_note(find_replace) in Storage Mode header and Section 5
- obsidian_search_notes -> search_notes; removed target discriminator syntax

workflows/ingest-notes.md:
- mcp__obsidian__obsidian_append_to_note -> write_note for new meeting notes
- Both obsidian_patch_note calls -> edit_note(find_replace) for observations and
  project updates

workflows/triage.md:
- Connector table: Obsidian row replaced with basic-memory (search_notes, read_note,
  edit_note, write_note)
- obsidian_search_notes/obsidian_get_note in drafting step -> search_notes/read_note
- obsidian_patch_note in knowledge-base refresh -> edit_note(find_replace)
- obsidian_patch_note in group-chat KB candidate apply -> edit_note

workflows/plaud-sync.md:
- obsidian_get_note/write -> write_note for transcript save
- obsidian_search_notes -> search_notes for duplicate check
- 'via the Obsidian MCP' phrasing removed; write_note with params shown
- Path prefix corrected (no Lore/ for this vault)

workflows/ingest.md:
- obsidian_patch_note + mcp__obsidian__obsidian_append_to_note ->
  edit_note(find_replace) / write_note with correct parameter guidance

workflows/1on1-prep.md:
- obsidian_search_notes -> search_notes with note_types filter for project lookup

workflows/roundtable-prep.md:
- obsidian_search_notes(mode: jsonlogic) -> search_notes(note_types, metadata_filters)

workflows/onboarding.md:
- Phase 7.5 detection: mcp__obsidian__obsidian_list_notes -> list_memory_projects
- Vault seed: mcp__obsidian__obsidian_append_to_note -> write_note

workflows/obsidian-setup.md:
- Added DEPRECATED notice at top; content preserved for reference only

basic-memory-migration-plan.md:
- Promoted from outbox/ to repo root so it syncs with the codebase
- Phase 6 marked complete; Phase 7 commit message updated to reflect full scope"
```

---

## Troubleshooting

### `bm project default <name>` reports "No default project is currently set"

This error can appear even when the project exists. The command may have failed silently. Always verify:

```bash
bm project list
```

If `lore` is not marked as default, set it manually by editing the config:

```bash
python3 -c "
import json, pathlib
p = pathlib.Path.home() / '.basic-memory/config.json'
c = json.loads(p.read_text())
c['default_project'] = 'lore'
p.write_text(json.dumps(c, indent=2))
print('Done. Config:', json.dumps(c, indent=2))
"
```

Verify again with `bm project list`.

### `bm project remove main` reports "main not found"

basic-memory may create a `main` project entry in the config that wasn't registered via the CLI, so the `remove` command can't find it by name. Edit the config directly:

```bash
python3 -c "
import json, pathlib
p = pathlib.Path.home() / '.basic-memory/config.json'
c = json.loads(p.read_text())
c['projects'] = [proj for proj in c.get('projects', []) if proj.get('name') != 'main']
p.write_text(json.dumps(c, indent=2))
print('Done. Remaining projects:', [proj.get('name') for proj in c['projects']])
"
```

---

## Rollback

If something doesn't work, rolling back is easy:

1. Re-add the obsidian MCP entry to your Claude Code config and restart.
2. Revert `CLAUDE.md` and `context.md` with `git checkout HEAD~1 CLAUDE.md context.md`.
3. basic-memory leaves your vault files completely untouched -- it only writes a local SQLite index at `~/.basic-memory/`. Nothing to clean up in the vault.

---

## Notes

- basic-memory requires **Python 3.12+**. `uv` handles this automatically; you don't need to install Python separately.
- The SQLite index lives at `~/.basic-memory/`. It is separate from iCloud and will not sync to other devices. If you get a new Mac, just re-run Phases 2-3.
- basic-memory does not require Obsidian to be open. The vault files are read directly.
- Semantic/hybrid search indexes are built lazily. Search quality improves as basic-memory processes more of the vault.
- If notes disappear from search or `doctor` reports inconsistencies, run `bm reindex` to rebuild.

— 📜 Lore
