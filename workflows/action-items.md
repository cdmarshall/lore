# Action Items

All output follows VOICE.md.

Action items live in a single Cowork artifact (id: `action-items`). The artifact's IndexedDB is the sole source of truth, canonical in both storage modes (`CLAUDE.md` → Session start step 4). Agent-driven changes are pushed as delta operations on top of IDB; the agent never replaces IDB wholesale.

## Source-of-truth model (read this first)

**The artifact's IndexedDB is canonical.** All edits made in the artifact UI (mark complete, edit due date, delegate, quick-add, etc.) are instant and persist across Cowork restarts. The agent has no direct read access to IDB.

**The agent's only role is to push delta operations.** Each push is a JSON seed embedded in the artifact HTML containing an `operations` array. Each operation is one of: `add`, `complete`, `delegate`, `delegateComplete`, `reopen`, `archive`, `update`. The artifact's bootstrap applies the operations on top of whatever's already in IDB. User edits made in the artifact between pushes are preserved.

**The snapshot ritual.** Lore has no direct read access to the artifact's IndexedDB. To give Lore a current view, the user clicks **Download snapshot** in the artifact and saves the resulting file to `inbox/action-items.snapshot.md`. The agent reads that file when it needs state for dedup, "what's on my plate," 1:1 prep, roundtable prep, morning sync, etc. The user can also paste the snapshot content directly in chat instead of saving the file. This is the only manual step; everything else is automatic.

`inbox/action-items.md` is never agent input: `CLAUDE.md` → Action items hard rule.

## Reading current state

Three read paths, in order of preference:

1. **`inbox/action-items.snapshot.md`**, the user's downloaded snapshot, saved by them via the artifact's Download snapshot button. Markdown format with `## Active`, `## Completed`, `## Delegated`, `## Archived` sections. Check first with `bash ls inbox/action-items.snapshot.md`; if present, parse it. Note the file's mtime in your response so the user knows how fresh the read is.

2. **`inbox/action-items-state.json`**, written automatically by the artifact's auto-backup feature, IF the user enabled it. **Currently this won't exist** because Cowork's webview blocks the artifact from writing files programmatically. The plumbing remains in place in case a future Cowork build enables it. If the file ever exists, prefer it over the markdown snapshot (it's fresher and machine-readable). JSON shape:
   ```json
   {
     "writtenAt": "ISO timestamp (use to detect freshness)",
     "schemaVersion": 2,
     "active": [ {date, created, from, subject, actionNeeded, due, lore, specialist, notes}, ... ],
     "completed": [ {date, created, from, subject, resolution, completed}, ... ],
     "delegated": [ {date, created, from, subject, delegatedTo, actionNeeded, delegated, notes}, ... ],
     "archived": [ {date, created, from, subject, actionNeeded, archived}, ... ]
   }
   ```

3. **A snapshot pasted directly in chat**, if no file is present and the user wants to give the agent a view right now without leaving chat. Same markdown format as #1.

4. **None**, the agent has no view of state. Push operations blindly (the artifact handles dedup). Tell the user honestly: "I don't have a view of your current list. If you want me to dedup or list items, click Download snapshot in your artifact and save it to `inbox/action-items.snapshot.md` (or paste it here)."

## Operations seed schema

When pushing changes, the agent builds a JSON of operations and runs the build script. The seed schema is:

```json
{
  "seedVersion": "2026-05-12T18:30:00.000Z",
  "schemaVersion": 2,
  "teamMembers": ["Danelle", "Hannah", "April"],
  "operations": [ ... ]
}
```

The build script (`scripts/build-action-items-artifact.js`) stamps `seedVersion` and `teamMembers` for you. You only construct the `operations` array.

### Operation types

**`add`**, adds a new item to the Active list. Dedup happens in the artifact on `subject + from` (normalized: trimmed, lowercased); if the same key already exists in any list, the op is a no-op.

```json
{
  "op": "add",
  "item": {
    "date": "2026-05-12",
    "created": "2026-05-12",
    "from": "Ryan Mulvaney Sync",
    "subject": "Confirm White Coat API key config",
    "actionNeeded": "Verify reuse of existing key and reply to Ryan",
    "due": "TBD",
    "lore": "Y",
    "specialist": "",
    "notes": ""
  }
}
```

Field meanings: `date` is the source date (meeting / email / origin). `created` is today's date (when the row was added to the list); always populate. `due` is one of `ASAP`, `Soon`, `This week`, `TBD`, or `YYYY-MM-DD`. `lore: "Y"` if Lore could plausibly do or substantially advance the item from inside the workspace; `specialist: "Y"` if a sibling specialist agent (e.g., Sigil) could pick it up autonomously. Both can be `Y` on the same row.

**`complete`**, moves an active or delegated item to Completed.

```json
{ "op": "complete", "subject": "...", "from": "...", "resolution": "optional resolution text" }
```

`from` is part of the match key. `resolution` is optional; defaults to the item's existing `actionNeeded`. No-ops if the item is already completed or doesn't exist.

**`delegate`**, moves an active item to the Delegated list and assigns it.

```json
{ "op": "delegate", "subject": "...", "from": "...", "delegatedTo": "Danelle" }
```

**`reopen`**, moves an item from Delegated, Completed, or Archived back to Active (searched in that order). Resets `due` to `TBD`.

```json
{ "op": "reopen", "subject": "...", "from": "..." }
```

**`archive`**, moves an active item to the Archived list.

```json
{ "op": "archive", "subject": "...", "from": "..." }
```

**`update`**, edits fields of an existing active item in place. Allowed fields: `date`, `created`, `from`, `subject`, `actionNeeded`, `due`, `lore`, `specialist`, `notes`.

```json
{ "op": "update", "subject": "...", "from": "...", "fields": { "due": "2026-06-01", "notes": "..." } }
```

### Match-key normalization

For every op that references an existing item (everything except `add`), the artifact matches by `subject + from` after trimming whitespace and lowercasing. Wording must be precise, if the user previously marked an item complete with a slightly different subject, the match will fail and the op will no-op.

If a match fails, the operation is silently skipped (counted as "skipped" in the toast on the user's side). That's acceptable: the artifact dedupes adds, ignores re-completions, and any genuine mismatch shows up as a stale push the agent can correct on the next operation.

## Procedure for agent-driven changes

Whenever the user asks the agent to add, complete, delegate, reopen, archive, or update action items (directly, or as part of processing a transcript / ingesting notes), do this:

### 1. Build the operations JSON

In your head or in a scratch file, assemble the list of operations the user's request maps to. Examples:

- "Add this item from the Ryan sync" → one `add` op
- "Mark X and Y complete" → two `complete` ops
- "Delegate the renewal ops thing to Danelle" → one `delegate` op
- Processing a transcript that produces 4 new action items → four `add` ops
- "Move my due date for the engagement score explainer to next Friday" → one `update` op

### 2. Best-effort dedup and consolidation before adding

The artifact dedupes `add` ops authoritatively on `subject + from`. But for cases where the agent should consolidate rather than skip (e.g., the new context adds something useful to an existing item's notes), use an `update` op on the existing item instead of a redundant `add`.

Read current state via the preferred read path:

1. **Check `inbox/action-items.snapshot.md`** first (`bash ls inbox/action-items.snapshot.md`). If present, parse the `## Active` table for the candidates' `subject + from` collisions (normalize: trim + lowercase). If a near-match exists with the same intent but different wording, emit an `update` op on the existing item; otherwise the artifact will silently dedup the exact-match `add`.
2. **Check `inbox/action-items-state.json`** (future-proof; rarely exists today). Same logic against its `active` array.
3. **If neither file exists**, push the adds blindly. The artifact will dedup on the way in. Note to the user that you don't have a current view; if they want consolidation rather than raw dedup, suggest they Download snapshot to `inbox/action-items.snapshot.md` first.

If you decide a candidate is a likely duplicate that warrants consolidation rather than skipping, emit an `update` op on the existing item with new notes. Report the consolidation to the user explicitly:

```
Consolidated: "Proposed item subject"
  → Existing item updated: "Existing Subject" (Notes appended with new context)
```

If you decide to skip outright, report that too:

```
Skipped (likely duplicate): "Proposed item subject"
  → Reasoning: same subject and from as existing active item
```

### 3. Run the build script

Pass the operations JSON to `scripts/build-action-items-artifact.js`. Either inline JSON or a path to a JSON file works:

```bash
# Inline (small ops lists)
node scripts/build-action-items-artifact.js '[{"op":"add","item":{"subject":"...","from":"...","actionNeeded":"...","due":"TBD","created":"2026-05-12","date":"2026-05-12"}}]'

# Or write the ops to a temp JSON file first (cleaner for many ops)
node scripts/build-action-items-artifact.js /tmp/action-items-ops.json
```

The script writes the substituted HTML to `outbox/action-items-artifact-built.html` and stamps a fresh `seedVersion`.

### 4. Push to the artifact

```
mcp__cowork__update_artifact(
  id: "action-items",
  html_path: "<absolute path to outbox/action-items-artifact-built.html>",
  mcp_tools: [],
  update_summary: "<short description of what changed>"
)
```

After step 4, the artifact's bootstrap will detect the new `seedVersion`, apply each operation as a delta, and persist the resulting IDB state. User edits in IDB are preserved.

### 5. Report to the user

In your response, summarize what was pushed. If anything was skipped or consolidated, list those explicitly (format above). Don't claim "X was added" without confirmation; the artifact has the final word on dedup. If the user wants confirmation, they can check the artifact directly.

## What never happens

Full rule: `CLAUDE.md` → Action items hard rule. In this workflow specifically: the seed never contains an `active`, `completed`, `archived`, or `delegated` array of full state, only an `operations` array. If you find yourself wanting to push full state or touch `inbox/action-items.md`, stop.

## Action item triage queue

Transcript processing (`workflows/process-transcript.md` → section 5, "user's action items") does **not** push the user's extracted action items straight into this artifact anymore. They land first in a separate artifact, **Action Item Triage** (id: `action-item-triage`), so the user can approve each one individually before it becomes a real tracked commitment. This exists because a bulk backlog-processing run once surfaced hundreds of extracted items at once, most belonging to other people or already stale, and a flat checklist made it unclear that checking a box would promote that item into the canonical tracker. The triage artifact fixes this with a one-at-a-time card UI (Add to my list / Not mine) instead.

### How it works

1. **Enqueue.** After extracting a transcript's action items for the user, Lore builds `enqueue` operations (one per item, same field shape as an `add` op below) and pushes them via `scripts/build-action-item-triage.js` + `mcp__cowork__update_artifact(id="action-item-triage")`. Dedup on `subject + from` happens inside that artifact too, so reprocessing never re-queues something already triaged.
2. **User reviews at their own pace.** Each item is shown as a single card; the user clicks "Add to my list" or "Not mine" (keyboard: `A` / `N`). Decided items that were added but not yet synced show a "Sync now" button once the queue is empty.
3. **Sync.** Clicking "Sync now" in the artifact writes a tagged JSON payload to the browser console (`LORE_TRIAGE_SYNC:{...}`) listing every added-but-unsynced item. This is the handoff back to Lore, since the artifact has no way to call the real tracker directly.
4. **User tells Lore to push.** Trigger phrases: "sync my triage queue", "push my reviewed items", "what's ready in my triage queue". Lore then:
   - Calls `mcp__cowork__verify_artifact(id="action-item-triage")` and finds the most recent `LORE_TRIAGE_SYNC:` entry in the debug log.
   - If none is found, tell the user honestly: "I don't see anything synced yet — click 'Sync now' in the triage artifact first," and stop.
   - Otherwise, parse the JSON payload's `items` array. For each item, build an `add` op (same shape as the Operations seed schema above) and push via the normal procedure (`scripts/build-action-items-artifact.js` + `update_artifact(id="action-items")`).
   - Then build `ack` ops (`{"op": "ack", "subject": "...", "from": "..."}`, one per synced item) and push via `scripts/build-action-item-triage.js` + `update_artifact(id="action-item-triage")`, so those items stop showing as "ready to sync" in the triage view.
   - Report the count pushed, same reporting discipline as any other `add` batch (section 5 above).

### Reading the triage queue without syncing

If the user asks "what's in my triage queue" (as a status check, not a push request), call `verify_artifact(id="action-item-triage")` and describe what's in the debug log (last sync payload, if any) rather than pushing anything. If the log is empty or stale, say so and suggest opening the artifact directly for the live view (Lore has no direct IDB read access here either, same constraint as the main tracker).

### What never happens here

Same discipline as the main tracker: never push full state into the triage artifact, only `enqueue`/`ack` operations. Never treat an `enqueue` as equivalent to the item being on the user's real list, they aren't the same thing until synced and acked.

## Restore-from-backup (opt-in only)

`inbox/action-items.md` may exist as a historical artifact or a one-time snapshot the user saved over. It is not read under any circumstance except this explicit restore scenario: the user is asking for help recovering from a deleted/wiped artifact. Normally the user does this themselves via the artifact's own "Restore from backup" button.

If the user explicitly says "restore the artifact from the backup file at path X," read that file, parse it, convert it to a series of `add` operations, and push via the build script (steps 3 to 4 above). This is the only path where the file is consumed.

## Delegation contract: the `Lore` and `Specialist` flags

The Active list has two delegation flags per row. They answer two different questions:

- **`lore: "Y"`**, Lore (this agent) could plausibly do or substantially advance the item from inside the workspace. Examples: drafting a memo, summarizing a thread, generating a prep brief, building a small artifact, querying a connector and surfacing the result, writing a stakeholder talk track.
- **`specialist: "Y"`**, a sibling specialist agent (e.g., Sigil) could pick it up autonomously. Examples: writing Jira tickets, drafting PRDs, scoping engineering work, generating release notes, pulling structured data from production systems.

Both blank when the item needs human judgment, in-person conversation, or context only the user has.

Flags are not mutually exclusive. Many items are doable by either. When the agent emits `add` ops, set both flags reflectively based on the same questions.

**Specialist agents (e.g., Sigil) may also push operations to this artifact.** Sigil's path is the same: build operations, run the build script, push via `update_artifact`. The artifact dedupes regardless of which agent pushed.

## Pre-existing items: there is no "Active table to scan"

Older notes or commits may say "scan the Active table before appending." That applied to the old file-as-source-of-truth model and no longer applies. In the operations model, the artifact handles dedup. The agent only needs best-effort dedup for the consolidation case above.

If the user asks "what's currently active?", the canonical answer is: **open the artifact**. If they want a chat-rendered list, use the read paths above: prefer `inbox/action-items-state.json` if present; otherwise ask for a Downloaded snapshot.

## Display in chat (when user asks "what's on my plate?")

1. **Check for `inbox/action-items.snapshot.md`** (`bash ls inbox/action-items.snapshot.md`). If present, parse the `## Active` table and render sorted by priority. Note the file's mtime in the response so the user knows how fresh it is.
2. **Check for `inbox/action-items-state.json`** (future-proof; rarely present today). If it exists, parse the `active` array, use the `writtenAt` timestamp.
3. **If neither file exists**, tell the user: "Click Download snapshot in your action items artifact and save the file to `inbox/action-items.snapshot.md` (or paste the contents here), and I'll render the list."
4. **If they prefer**, suggest just opening the artifact directly, it's already the live view.

Priority sorting (when rendering): OVERDUE → URGENT/ASAP → UPCOMING → other due dates → TBD/conditional.

Always be honest about the source: "from your snapshot file (saved 12 min ago)" or "from the snapshot you just pasted" or "open the artifact for the live view, I don't have a read path right now."
