# Action Items

All output follows VOICE.md.

Action items live in a single Cowork artifact (id: `the-quest-log`; titled **"The Quest Log"** in the UI, so that's what the user may call it). The artifact's IndexedDB is the sole source of truth, canonical in both storage modes (`CLAUDE.md` → Session start step 4). Agent-driven changes are pushed as delta operations on top of IDB; the agent never replaces IDB wholesale.

## Source-of-truth model (read this first)

**The artifact's IndexedDB is canonical.** All edits made in the artifact UI (mark complete, edit due date, delegate, quick-add, etc.) are instant and persist across Cowork restarts. The agent has no direct read access to IDB.

**The agent's only role is to push delta operations.** Each push is a JSON seed embedded in the artifact HTML containing an `operations` array. Each operation is one of: `add`, `propose`, `complete`, `delegate`, `delegateComplete`, `reopen`, `archive`, `update`. The artifact's bootstrap applies the operations on top of whatever's already in IDB. User edits made in the artifact between pushes are preserved.

**Triage lives in this same artifact.** `propose` lands a candidate item in a "To Triage" pile inside the artifact instead of the Active list. The user resolves each one with a single click (Do now / Schedule / Delegate / Delete), and that click is what actually creates the real active/delegated item (or discards it, for Delete). There is no separate triage artifact, no sync step, and nothing for the agent to read back, the old two-artifact `enqueue` → "Sync now" console-log payload → `ack` handoff is retired (see "Action item triage" below for the one-time history and why).

**The snapshot ritual.** Lore has no direct read access to the artifact's IndexedDB. To give Lore a current view, the user clicks **Download snapshot** in the artifact and saves the resulting file to `inbox/action-items.snapshot.md`. The agent reads that file when it needs state for dedup, "what's on my plate," 1:1 prep, roundtable prep, morning sync, etc. The user can also paste the snapshot content directly in chat instead of saving the file. This is the only manual step; everything else is automatic.

`inbox/action-items.md` is never agent input: `CLAUDE.md` → Action items hard rule.

## Reading current state

Three read paths, in order of preference:

1. **`inbox/action-items.snapshot.md`**, the user's downloaded snapshot, saved by them via the artifact's Download snapshot button. Markdown format with `## Active`, `## Completed`, `## Delegated`, `## Archived`, `## Triage` sections. Check first with `bash ls inbox/action-items.snapshot.md`; if present, parse it. Note the file's mtime in your response so the user knows how fresh the read is. Items in `## Triage` are NOT yet real, don't count them toward "what's on my plate," they're still awaiting the user's Do now/Schedule/Delegate/Delete decision.

2. **`inbox/action-items-state.json`**, written automatically by the artifact's auto-backup feature, IF the user enabled it. **Currently this won't exist** because Cowork's webview blocks the artifact from writing files programmatically. The plumbing remains in place in case a future Cowork build enables it. If the file ever exists, prefer it over the markdown snapshot (it's fresher and machine-readable). JSON shape:
   ```json
   {
     "writtenAt": "ISO timestamp (use to detect freshness)",
     "schemaVersion": 4,
     "active": [ {date, created, from, subject, due, lore, specialist, notes}, ... ],
     "completed": [ {date, created, from, subject, resolution, completed}, ... ],
     "delegated": [ {date, created, from, subject, delegatedTo, delegated, notes}, ... ],
     "archived": [ {date, created, from, subject, notes, archived}, ... ],
     "triage": [ {date, created, from, subject, due, lore, specialist, notes}, ... ]
   }
   ```

3. **A snapshot pasted directly in chat**, if no file is present and the user wants to give the agent a view right now without leaving chat. Same markdown format as #1.

4. **None**, the agent has no view of state. Push operations blindly (the artifact handles dedup). Tell the user honestly: "I don't have a view of your current list. If you want me to dedup or list items, click Download snapshot in your artifact and save it to `inbox/action-items.snapshot.md` (or paste it here)."

## Operations seed schema

When pushing changes, the agent builds a JSON of operations and runs the build script. The seed schema is:

```json
{
  "seedVersion": "2026-05-12T18:30:00.000Z",
  "schemaVersion": 3,
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
    "due": "TBD",
    "lore": "Y",
    "specialist": "",
    "notes": "Verify reuse of existing key and reply to Ryan"
  }
}
```

Field meanings: `date` is the source date (meeting / email / origin). `created` is today's date (when the row was added to the list); always populate. `due` is one of `ASAP`, `TBD`, `YYYY-MM-DD`, or free custom text (e.g. "Ongoing"). `notes` carries the item's full description/context beyond the subject line. `lore: "Y"` if Lore could plausibly do or substantially advance the item from inside the workspace; `specialist: "Y"` if a sibling specialist agent (e.g., Sigil) could pick it up autonomously. Both can be `Y` on the same row.

**Retired fields and values (schemaVersion 4, 2026-07-23):** the `actionNeeded` field is gone; its content lives in `notes`. The artifact still accepts `actionNeeded` on incoming ops and folds it into `notes`, and it migrates existing stored items on first load, but new ops should not emit it. The `Soon` and `This week` due presets are also retired; the artifact maps both (stored or incoming) to the date of the upcoming Friday.

**`propose`**, same item shape as `add`, but lands in the "To Triage" pile instead of Active. Use this instead of `add` whenever the user should actually decide whether/when/who, rather than the item just appearing as a done deal. The `due` field here is only a hint shown on the triage card (e.g. "Lore's read on timing: Soon"), the user's actual due date is whatever they pick when they resolve it. Same dedup rule as `add`: `subject + from`, checked against every list including the triage pile itself.

```json
{
  "op": "propose",
  "item": {
    "date": "2026-07-21",
    "created": "2026-07-22",
    "from": "Product Roundtable",
    "subject": "Close old Claude team seat and process prorated refund",
    "due": "TBD",
    "lore": "Y",
    "specialist": "",
    "notes": "Close out the old Claude team seat now that a new seat exists, confirm the prorated refund with Christian"
  }
}
```

**`complete`**, moves an active or delegated item to Completed.

```json
{ "op": "complete", "subject": "...", "from": "...", "resolution": "optional resolution text" }
```

`from` is part of the match key. `resolution` is optional; defaults to the item's existing `notes`. No-ops if the item is already completed or doesn't exist.

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

**`update`**, edits fields of an existing active item in place. Allowed fields: `date`, `created`, `from`, `subject`, `due`, `lore`, `specialist`, `notes`. (A legacy `actionNeeded` field is accepted and folded into `notes`.)

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
node scripts/build-action-items-artifact.js '[{"op":"add","item":{"subject":"...","from":"...","notes":"...","due":"TBD","created":"2026-05-12","date":"2026-05-12"}}]'

# Or write the ops to a temp JSON file first (cleaner for many ops)
node scripts/build-action-items-artifact.js /tmp/action-items-ops.json
```

The script writes the substituted HTML to `outbox/action-items-artifact-built.html` and stamps a fresh `seedVersion`.

### 4. Push to the artifact

```
mcp__cowork__update_artifact(
  id: "the-quest-log",
  html_path: "<absolute path to outbox/action-items-artifact-built.html>",
  mcp_tools: [],
  update_summary: "<short description of what changed>"
)
```

After step 4, the artifact's bootstrap will detect the new `seedVersion`, apply each operation as a delta, and persist the resulting IDB state. User edits in IDB are preserved.

### 5. Report to the user

In your response, summarize what was pushed. If anything was skipped or consolidated, list those explicitly (format above). Don't claim "X was added" without confirmation; the artifact has the final word on dedup. If the user wants confirmation, they can check the artifact directly.

## What never happens

Full rule: `CLAUDE.md` → Action items hard rule. In this workflow specifically: the seed never contains an `active`, `completed`, `archived`, `delegated`, or `triage` array of full state, only an `operations` array. If you find yourself wanting to push full state or touch `inbox/action-items.md`, stop.

## Action item triage

Transcript processing (`workflows/process-transcript.md` → section 5, "user's action items") does **not** push the user's extracted action items straight onto the Active list. They land first in the same artifact's "To Triage" pile via `propose` ops, so the user can decide what actually happens to each one before it becomes a real tracked commitment. This exists because a bulk backlog-processing run once surfaced hundreds of extracted items at once, most belonging to other people or already stale, and a flat checklist made it unclear that checking a box would promote that item into the canonical tracker.

**Retired design (history only, do not rebuild):** this used to be a *separate* artifact (`action-item-triage`) with its own `enqueue`/`ack` operations and a "Sync now" button that wrote a JSON payload to the browser console for Lore to read back via `verify_artifact`. That console-log payload got truncated by `verify_artifact`'s per-message size cap once a batch got past a handful of items (confirmed on the 2026-07-21 23-item Plaud sync batch), breaking the handoff. Rather than work around that (e.g. chunking batches, which the user explicitly rejected as not addressing the real problem), triage was merged directly into the Action Items artifact on 2026-07-22. There is nothing left to read back: the user's resolution click on the triage card is itself the write into Active/Delegated. `templates/action-item-triage.template.html` and `scripts/build-action-item-triage.js` are archived under `archive/action-item-triage-standalone/` for history; don't use them.

### How it works now

1. **Propose.** After extracting a transcript's action items for the user, Lore builds `propose` operations (one per item, same field shape as `add`, see above) and pushes them via the normal procedure, `scripts/build-action-items-artifact.js` + `mcp__cowork__update_artifact(id="the-quest-log")`. Dedup on `subject + from` happens against every list including the triage pile, so reprocessing never re-proposes something already triaged or already active.
2. **User resolves at their own pace.** The artifact shows one "To Triage" card at a time (oldest-proposed first) with four buttons:
   - **Do now**, for anything under about two minutes: one click, item becomes Active with `due: "ASAP"`.
   - **Schedule…**, opens the same due-date popover used elsewhere in the artifact (presets + date picker + custom text); picking a value moves it to Active with that due date.
   - **Delegate…**, opens the team-member picker; picking a name moves it straight to Delegated, it never touches Active.
   - **Delete**, discards it, it never becomes a real item. A brief "Undo" toast covers mis-clicks.
3. **That's the whole loop.** There is no sync step and no `ack` op. Once the user clicks a resolution, the item already exists (or doesn't) in the exact same IDB the main tracker reads from.

### Reading the triage queue

If the user asks "what's in triage" or "what's pending review," this is just another slice of the same artifact's state. Use the normal read paths (Download snapshot's `## Triage` section, or `inbox/action-items-state.json`'s `triage` array, once/if that ever exists). There's no separate artifact to check and no console-log payload to parse.

### What never happens here

Same discipline as the main tracker: never push full state, only `propose` ops (or `add`, if the agent is confident enough that the item shouldn't need a human triage decision at all). Never treat a `propose` as equivalent to the item being on the user's real list, it isn't real until they resolve the card.

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
