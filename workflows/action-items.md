# Action Items

Display current action items from the inbox in a single consolidated table.

## File Schema

`inbox/action-items.md` has four sections: **Active**, **Delegated**, **Completed**, and **Archived**.

### Active table schema
```
| Date | Created | From | Subject | Action Needed | Due | Lore | Specialist | Notes |
|------|---------|------|---------|---------------|-----|------|------------|-------|
```

- **Date** — ISO date (YYYY-MM-DD) or blank. Source date, the meeting, email, or moment the item came from. Stays attached to the originating event even when the item lingers.
- **Created** — ISO date (YYYY-MM-DD). When the row was added to the list. Always populated for new rows; should equal the date the agent (or user) wrote the row, regardless of how old the originating Date is. Used to surface stale items in the artifact.
- **From** — source context (person, meeting, email thread)
- **Subject** — short title for the action item
- **Action Needed** — full description of what to do
- **Due** — one of: `ASAP`, `Soon`, `This week`, `TBD`, or `YYYY-MM-DD`
- **Lore** — `Y` if Lore (this agent) could plausibly do or substantially advance this item from inside the workspace; `N` or blank otherwise. See "The two delegation flags" below.
- **Specialist** — `Y` if a sibling specialist agent (e.g., Sigil) could pick this up autonomously; `N` or blank otherwise.
- **Notes** — free-text notes; blank by default

> **Why both Date and Created?** When a transcript from three weeks ago is processed today, the resulting action items have a `Date` of three weeks ago (the meeting) and a `Created` of today (when they entered the list). This separation lets the artifact show "added 0d ago" for genuinely fresh items while preserving the original meeting/source date for context. For items entered live ("Self" notes, in-meeting captures), Date and Created will typically be the same.

### The two delegation flags

The Active table has two independent boolean flags. They answer two different questions:

- **Lore (`Y`)**: "Could the Lore agent plausibly do this from inside the workspace, with the context it already has?" Use for things like drafting a doc, summarizing a thread, generating a prep brief, building a small artifact, querying a connector for data the user wants surfaced. The work happens in chat with Lore.
- **Specialist (`Y`)**: "Could a sibling specialist agent (e.g., Sigil) pick this up autonomously?" Use for engineering-flavored or domain-specific execution: writing Jira tickets, drafting PRDs, scoping engineering work, generating release notes, pulling structured data from production systems. The work happens outside the Lore session, with the specialist reading `inbox/action-items.md` directly.

The flags are **not mutually exclusive**. An item can be:
- `Lore: Y, Specialist: Y` — either could do it; whichever is sitting in front of the user wins.
- `Lore: Y, Specialist: blank` — Lore can do it now; no specialist hand-off needed.
- `Lore: blank, Specialist: Y` — better suited for the specialist; Lore should flag and route.
- both blank — needs human judgment, in-person conversation, or context only the user has.

Lore should set these flags reflectively when adding items: "Could I do this if asked? Could the specialist?"

### Adding a new action item

Append a new row to the Active table with all 9 columns:

```
| YYYY-MM-DD | YYYY-MM-DD | From | Subject | Action Needed | Due | Lore | Specialist | Notes |
```

- **Date** = source date. Use the meeting date, email date, or whenever the item originated. If unknown, use today.
- **Created** = today's date in YYYY-MM-DD. Always populated; never leave blank when adding a new row.
- **Lore** = `Y` if Lore could do or substantially advance the item from inside the workspace.
- **Specialist** = `Y` if a sibling specialist agent (e.g., Sigil) could autonomously pick it up.
- Notes should be blank unless the user provides them
- Always preserve the exact column order: Date, Created, From, Subject, Action Needed, Due, Lore, Specialist, Notes

### Delegated table schema
```
| Date | Created | From | Subject | Delegated To | Action Needed | Delegated | Notes |
|------|---------|------|---------|-------------|---------------|-----------|-------|
```

- **Date** — original source date (preserved from the Active row)
- **Created** — preserved from the Active row; never updated when delegating
- **From** — original source context (preserved)
- **Subject** — preserved from the Active row
- **Delegated To** — team member name: `Danelle`, `Hannah`, or `April`
- **Action Needed** — preserved from the Active row
- **Delegated** — ISO date (YYYY-MM-DD) when the item was delegated
- **Notes** — any context or instructions for the delegatee; preserved from the Active row

Delegated items are **in-flight work owned by a team member**. They stay visible (not buried in Completed) so the user can follow up. When the work is confirmed done, move to Completed with a resolution note. To re-open, move back to Active.

**When delegating an item:**
1. Remove it from the `## Active` table
2. Append it to the `## Delegated` table, preserving `Date`, `Created`, `From`, `Subject`, `Action Needed`, and `Notes` from the Active row
3. Populate `Delegated To` with the team member's name
4. Populate `Delegated` with today's date

**When a delegated item is confirmed complete:**
1. Remove it from the `## Delegated` table
2. Append to `## Completed` with a `Resolution` of `Delegated to [Name] — [brief outcome]`

**When re-opening a delegated item:**
1. Remove it from the `## Delegated` table
2. Restore to `## Active` with the original fields intact; set `Due` to `TBD`

### Meeting prep integration

Delegated items surface automatically during prep for that team member. When running roundtable prep or a 1:1 prep (via `workflows/roundtable-prep.md`), Lore reads the `## Delegated` section and groups any items delegated to that person into a "Follow-up" block in the prep brief. This is the primary mechanism for the user to close the loop on delegated work.

### Completed table schema
```
| Date | Created | From | Subject | Resolution | Completed |
```

When moving a row from Active to Completed, preserve the original `Created` value. The `Completed` column captures the resolution date.

### Archived table schema
```
| Date | Created | From | Subject | Action Needed | Archived |
```

When archiving, preserve the original `Created` value. The `Archived` column captures the archive date.

---

## Live Artifact (Cowork Sidebar)

The action items are also available as a live Cowork artifact (id: `action-items`) that renders in the Cowork sidebar. It shows all active items with priority badges, filter pills, search, inline edits, due date picker, agent toggle, notes, quick-add row, and a Refresh button.

**Where it lives:** Cowork's artifact system (HTML stored at `~/Documents/Claude/Artifacts/action-items/index.html`). The canonical template ships at `templates/action-items-artifact.template.html`.

### Source-of-truth model (read this before doing anything)

The **artifact's IndexedDB is the live source of truth** for action items. The user makes edits in the artifact directly (mark complete, set due, etc.) — those are instant and persist across Cowork restarts. They do not write back to disk on their own (Cowork's webview blocks file writes from artifacts).

The **`inbox/action-items.md` file is the agent's window** and a recoverable backup. **The agent always writes the file and the artifact in lockstep** — every agent-driven change goes to both at the same time, so the file is always in sync with whatever the artifact had when the agent last operated.

User-only edits (mark complete in the artifact, edit a due date, etc.) drift the file out of sync until either:
- The user manually clicks **Download snapshot** and saves it over `inbox/action-items.md`, OR
- The agent next operates, at which point the agent's push replaces the artifact's IDB with the new state and writes the same state to the file.

**Important consequence**: if the user has been making changes in the artifact AND THEN asks the agent to add items via chat without first clicking Download snapshot, those user edits will be clobbered by the agent's push. To avoid this, the agent should ask the user to Download snapshot first when there's reason to suspect drift (e.g., the file timestamp is much older than the artifact was last updated, or the user mentions edits the file doesn't reflect).

### Procedure for agent-driven changes

Run this whenever you need to add or modify action items on the user's behalf (transcript processing, "Lore, add X to my list", "Mark X as complete", etc.):

1. **Read** `inbox/action-items.md` for the current state. This is your baseline.
2. **Duplicate check (REQUIRED before appending any new item)**.
   - For every candidate new item, scan the existing Active table for likely matches before writing anything.
   - Compare on **Subject + Action Needed + From + delegation flags (Lore / Specialist)**. Wording will differ; intent and ownership are what matter. Use fuzzy judgment:
     - Same person/topic + same delegation/ownership + same outcome = duplicate.
     - Examples that should match:
       - "Talk to Mike Tumpane about renewal ops filtering criteria" ≈ "Renewal ops: talk to Mike Tumpane about filtering criteria"
       - "Write Lead Source Differentiation tickets" ≈ "Lead Source Differentiation Tickets"
       - "Follow up with Danelle on billing carrier IDs" ≈ "Billing Carrier IDs — Ops Coordination" (delegated to Danelle)
   - Also scan the **Completed** and **Archived** tables. If a candidate matches a recently completed item, surface that to the user rather than re-adding it ("This looks like the item completed on YYYY-MM-DD — re-open it, or skip?").
   - **Decision rules**:
     - Clear duplicate → do NOT append. Optionally update the existing row's Notes or Action Needed if the new context adds something (new date, new sub-task, new due). Never create a parallel row for the same work.
     - Likely duplicate but uncertain → lean toward consolidation. Update the existing row and flag the decision for the user.
     - Genuinely new → proceed to step 3.
   - **Reporting (REQUIRED)**: in the response to the user, list every skipped or consolidated candidate explicitly. Format:
     ```
     Skipped (duplicate): "[Proposed item subject]"
       → Matches existing row: YYYY-MM-DD | [From] | [Existing Subject]
       → Reasoning: [why you believe it's the same item]
     ```
     If consolidating, say so: `Consolidated into existing row [Subject]; updated Notes to add [new context].`
3. **Apply** the change(s):
   - Adding new items → append rows to the `## Active` table. Always populate `Created` with today's date (YYYY-MM-DD).
   - Marking complete → move the row from Active to Completed, preserve the original `Created` value, fill in the Resolution and Completed columns.
   - Delegating → move the row from Active to Delegated, preserve original fields, set `Delegated To` and `Delegated` date. See "Delegated table schema" above.
   - Completing a delegated item → move from Delegated to Completed with resolution note.
   - Re-opening a delegated item → move from Delegated back to Active with `Due` reset to `TBD`.
   - Archiving → move the row from Active to Archived, preserve the original `Created` value, fill in the Archived date.
   - Editing existing items → update the relevant cells in place. Preserve the schema. Do not change `Created` on an existing row even when other fields are revised.
4. **Write** the updated content back to `inbox/action-items.md`.
5. **Run** the build script: `node scripts/build-action-items-artifact.js`. This reads the file, stamps a fresh `seedVersion` (ISO timestamp), and writes the substituted HTML to `outbox/action-items-artifact-built.html`.
6. **Push** to the artifact:
   ```
   mcp__cowork__update_artifact(
     id: "action-items",
     html_path: "<absolute path to outbox/action-items-artifact-built.html>",
     mcp_tools: [],
     update_summary: "<short description of what changed>"
   )
   ```

After step 6, the file and the artifact are in sync. The artifact's bootstrap detects the new `seedVersion` and adopts the seed, replacing its IDB.

### When the user clicks "Download snapshot"

The user is taking a manual snapshot. They'll typically save the result over `inbox/action-items.md` to bring the agent's view in sync with their current artifact state. The agent doesn't need to do anything special when this happens; just trust `inbox/action-items.md` next time you read it.

### Pre-flight check before agent operations

Before processing a transcript or adding items via chat, scan `inbox/action-items.md`. If you suspect it's out of date relative to what the user has been doing in the artifact (e.g., the file looks weeks old or doesn't contain items the user just mentioned), say something like: *"Before I add these, click Download snapshot in your action items artifact and save it over inbox/action-items.md so I have your latest state. Otherwise edits you've made in the artifact since the last sync will be overwritten."* Then wait for confirmation.

### Delegation contract: the `Lore` and `Specialist` flags

The Active table has two delegation flags, used independently. Each row can be claimed by Lore, by a specialist, by both, or by neither (in which case the user does it themselves).

**When Lore adds or updates an item, set both flags reflectively:**

- **Lore = `Y`** when Lore could plausibly do or substantially advance the item from inside the workspace. Examples: drafting a memo, summarizing a thread, generating a prep brief, building a small artifact, querying a connector and surfacing the result, writing a stakeholder talk track.
- **Specialist = `Y`** when a sibling specialist agent could pick it up autonomously. The canonical example is **Sigil**, a product-engineering specialist that reads `inbox/action-items.md` directly. Examples: writing Jira tickets, drafting PRDs, scoping engineering work, generating release notes, pulling structured data from production systems.
- Both blank when the item needs human judgment, in-person conversation, or context only the user has.

These are not mutually exclusive. Many items are doable by either; flag both `Y` and let context decide who does it.

**Lore is not the only writer of `inbox/action-items.md`.**
- Specialist agents may also append rows (when starting fresh work the user wants tracked) and modify rows (when completing items they were delegated).
- When a specialist agent completes an item, it moves the row from `## Active` to `## Completed` directly. Lore picks up that change next time it reads the file and pushes the artifact.
- Don't assume an item is still active just because it was active last time you read the file. Always re-read before acting.

**Pointing users at the right doer.**
- If the user asks Lore for something clearly in a specialist's wheelhouse (e.g., "write Jira tickets for these", "scope this engineering work"), Lore should suggest delegating: *"This looks like work for Sigil if you have it set up. I can flag this as Specialist: Y in your action items, then you can run Sigil and it'll pick it up."* Then add the item with `Specialist: Y` and a clear Action Needed description. Don't assume the user has Sigil; phrase the suggestion conditionally.
- If the user asks for something Lore can do directly, just do it. Optionally log it after the fact with `Lore: Y` if it was substantial work the user might want tracked.
- If both flags would apply, set both. The user can pick where to run it.


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
