# Action Items

Display current action items from the inbox in a single consolidated table.

## File Schema

`inbox/action-items.md` has three sections: **Active**, **Completed**, and **Archived**.

### Active table schema
```
| Date | From | Subject | Action Needed | Due | Agent | Notes |
|------|------|---------|---------------|-----|-------|-------|
```

- **Date** — ISO date (YYYY-MM-DD) or blank
- **From** — source context (person, meeting, email thread)
- **Subject** — short title for the action item
- **Action Needed** — full description of what to do
- **Due** — one of: `ASAP`, `Soon`, `This week`, `TBD`, or `YYYY-MM-DD`
- **Agent** — `Y` if this task can be delegated to a product agent; `N` or blank otherwise
- **Notes** — free-text notes; blank by default

### Adding a new action item

Append a new row to the Active table with all 7 columns:

```
| YYYY-MM-DD | From | Subject | Action Needed | Due | Agent | Notes |
```

- Agent should be `Y` or `N` (or blank if unknown)
- Notes should be blank unless the user provides them
- Always preserve the exact column order: Date, From, Subject, Action Needed, Due, Agent, Notes

### Completed table schema
```
| Date | From | Subject | Resolution | Completed |
```

### Archived table schema
```
| Date | From | Subject | Action Needed | Archived |
```

---

## Live Artifact (Cowork Sidebar)

The action items are also available as a live Cowork artifact (id: `action-items`) that renders in the Cowork sidebar. It shows all active items with priority badges, filter pills, search, inline edits, due date picker, agent toggle, notes, quick-add row, and a Refresh button.

**Where it lives:** Cowork's artifact system (not in the lore folder). The canonical HTML template ships at `templates/action-items-artifact.template.html`. It is fully self-contained and self-loading.

**Architecture (important for agents):**
The artifact is autonomous. It reads and writes `inbox/action-items.md` directly using `window.cowork.callMcpTool('mcp__workspace__bash', ...)` with a JS markdown parser/serializer. The agent is **not** in the loop for refresh, mark-complete, due date changes, notes, agent toggle, archive, rename, or add-item. The artifact's Refresh button just re-reads the file; every inline edit re-reads, mutates in memory, and writes the whole file back atomically.

This means:
- You should NOT respond to prompts like "Refresh the action items artifact" — those used to come from the artifact's old sendPrompt-based architecture, which was broken and is now removed.
- You can still freely edit `inbox/action-items.md` directly. The artifact will pick up your changes on the next Refresh.
- If the artifact is somehow lost (manifest cleared, etc.) and the user asks to recreate it, just call `mcp__cowork__create_artifact` with id `action-items`, html_path pointing at `templates/action-items-artifact.template.html`, and `mcp_tools: ["mcp__workspace__bash"]`. No template substitution is needed — the artifact discovers everything it needs at runtime.

**File path discovery:**
The artifact finds `inbox/action-items.md` at runtime by globbing `/sessions/*/mnt/lore/inbox/action-items.md`. This works regardless of which Cowork session the user is in, so the artifact survives session restarts.

---

## Instructions

1. Read the file `inbox/action-items.md`
2. Display **ALL** active action items in ONE table, sorted by priority:
   - OVERDUE items first (past due date)
   - URGENT / ASAP items second
   - All other items after (TBD, conditional triggers)
3. Show count of total active items in header
4. Show count of recently completed items at the end
5. If an item has `Agent = Y`, indicate it is agent-eligible (e.g., with a ⚡ marker or note)

## Output Format

IMPORTANT: Use a single consolidated table with a Priority column. Do NOT use multiple tables.

```
## Action Items (X active)

| Priority | Action | From | Due | Details |
|----------|--------|------|-----|---------|
| OVERDUE | Item name | Person | Date | Short description |
| URGENT | Item name | Person | - | Short description |
| ASAP | Item name | Person | - | Short description |
| TBD | Item name | Person | - | Short description |
| Before travel | Item name | Person | - | Short description |
| When X starts | Item name | Person | - | Short description |

---
Recently completed: X items
```

Priority column values:
- "OVERDUE" - for items past their due date
- "URGENT" - for items marked Urgent
- "ASAP" - for items marked ASAP
- "TBD" - for items with no specific due date
- Keep conditional triggers as-is (e.g., "Before travel", "When [name] starts")

Keep Details column concise - abbreviate long descriptions.

If the user says "show completed action items", also show the completed items table:

```
### Completed (Recent)

| Action | From | Resolution | Completed |
|--------|------|------------|-----------|
| Item name | Person | What was done | Date |
```
