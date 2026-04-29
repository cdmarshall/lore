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

**Where it lives:** Cowork's artifact system (not in the lore folder). The canonical HTML template ships at `templates/action-items-artifact.template.html`.

**Architecture (important for agents):**

The artifact does **not** read or write the file itself. (Cowork artifacts can't call `mcp__workspace__bash` — it returns HTTP 400 from the artifact context.) Instead, the agent embeds the current data into the HTML at create/update time, and button actions in the artifact send prompts back to chat to trigger updates.

The template has three placeholders the agent must substitute every time it creates or refreshes the artifact:

- `__TODAY__` — today's date in `YYYY-MM-DD` format (e.g., `2026-04-29`)
- `__RECENTLY_COMPLETED__` — count of rows in the Completed table whose Completed date is within the last 30 days (a plain integer like `14`)
- `__RAW__` — a JSON array of objects, one per row of the Active table, with this shape:
  ```json
  [
    { "from": "...", "subject": "...", "details": "...", "due": "TBD",
      "agentable": false, "notes": "" }
  ]
  ```
  Field mapping from the markdown columns:
  - `from` ← From column
  - `subject` ← Subject column
  - `details` ← Action Needed column (full text, escape quotes for JSON)
  - `due` ← Due column (`ASAP` / `Soon` / `This week` / `TBD` / `YYYY-MM-DD` / custom string)
  - `agentable` ← Agent column: `true` if `Y`, `false` otherwise
  - `notes` ← Notes column (string, may be empty)

**When to refresh / recreate the artifact:**

Whenever:
- The user clicks Refresh in the artifact (it sends a prompt: `Refresh the action items artifact with the latest data from inbox/action-items.md`)
- The user makes an inline edit in the artifact (the artifact sends an instruction prompt like `Update action item in inbox/action-items.md — Subject: "X" — set Due to "ASAP"`)
- You modify `inbox/action-items.md` for any other reason and the user has the artifact open
- The user explicitly asks to refresh, recreate, or rebuild the artifact

The procedure:

1. If the user's prompt contains an instruction (e.g., "set Due to ASAP", "Mark as complete", "Archive..."), apply that change to `inbox/action-items.md` first. Use the `Edit` or `Write` tool to update the markdown table. Be careful to preserve the file's table schema: `| Date | From | Subject | Action Needed | Due | Agent | Notes |`.
2. Read the (now updated) `inbox/action-items.md`.
3. Read `templates/action-items-artifact.template.html`.
4. Substitute `__TODAY__`, `__RECENTLY_COMPLETED__`, and `__RAW__` in the template.
5. Write the substituted HTML to a temporary file.
6. Call `mcp__cowork__update_artifact` with `id: "action-items"`, `html_path` pointing at your written file, `mcp_tools: []` (the artifact doesn't call any MCP tools), and a brief `update_summary`.

If the artifact doesn't exist yet, use `mcp__cowork__create_artifact` instead with the same arguments.

**Helper script:** `outbox/build-action-items-artifact.js` (if present) automates steps 2-5 with Node. Otherwise the agent does the substitution manually.

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
