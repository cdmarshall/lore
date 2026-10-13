# Plaud Sync

Pull recordings from Plaud for a specified time period, diff against already-processed transcripts, let the user select which to process, and run each through the standard transcript workflow sequentially.

## Storage Mode

Storage-mode branching: `_conventions.md` → Storage-mode branching. This workflow is migrated (`CLAUDE.md` → Workflow routing). Modes differ only in where the raw transcript saves and where the duplicate-content check runs:

- **Filesystem mode**: transcripts to `meetings/transcripts/`; duplicate check `grep`s the same folder.
- **Obsidian mode**: transcripts to `Transcripts/` in the vault via Write; duplicate check runs a vault search (dataview/vault MCP tools first, falling back to Grep per `_conventions.md` → Vault access tooling). Subfolder override: `_conventions.md` → Path resolution.

Tracking dotfiles stay in the workspace repo in both modes (append-only semantics: `CLAUDE.md` → Key behaviors, "Plaud sync tracking"). Step 6d hands off to `workflows/process-transcript.md`, which has its own Obsidian-mode branch.

## Invocation

| What the user says | Example |
|---|---|
| "Sync Plaud from the last week" | Pulls 7 days back from today |
| "Pull Plaud transcripts from the last 3 days" | Pulls 3 days back from today |
| "Sync Plaud from [date] to [date]" | Pulls explicit date range |
| "Sync Plaud" (no period given) | Ask: "What time period? (e.g. last 7 days, last 3 days)" |

---

## Step 1, Resolve the Date Range

Parse the user's request into a concrete `date_from` and `date_to` (both YYYY-MM-DD, inclusive).

- "last week" / "the last 7 days" → `date_from` = today − 7, `date_to` = today
- "last 3 days" → `date_from` = today − 3, `date_to` = today
- "last 2 weeks" → `date_from` = today − 14, `date_to` = today
- Explicit dates → use as given
- No period given → ask before continuing

---

## Step 2, Fetch Recordings from Plaud

**Resolve the Plaud tools by suffix, never by the `mcp__plaud__` prefix.** This file names them `mcp__plaud__list_files` / `get_transcript` / `get_note` for readability, but the real server prefix is install-specific and is usually an opaque UUID (e.g. `mcp__bf443b57-8be3-49b9-86dd-563a94782a36__list_files`). They are also frequently deferred, so they will not appear in the tool list until fetched. Find them with a suffix search (`ToolSearch` for `list_files` / `get_transcript` / `get_note`, or keywords like "plaud recordings"), then call the resolved names. **A `select:mcp__plaud__list_files` lookup returning "no matching deferred tools" is not evidence Plaud is disconnected**, and neither is Plaud's absence from `list_connectors` output. Verified 2026-08-21: a sync was wrongly reported to the user as blocked on a missing connector when the tools were present the whole time under a UUID prefix. Check `get_current_user` if you genuinely need to confirm the connection.

**Do NOT use the `date_from`/`date_to` filter parameters.** The filtered endpoint returns a cached result set on Plaud's side and misses recently created recordings. Always fetch unfiltered.

Call `list_files` (`page_size: 20`, start at `page: 1`, no filters). Recordings return most-recent-first. Collect pages until either:
- You have seen at least one recording whose `created_at` date is strictly before `date_from`, OR
- You have fetched 5 pages (safety limit)

Filter the collected results in memory: keep only recordings where `created_at` falls within `[date_from, date_to]` inclusive. Each recording includes at minimum `id` (canonical Plaud file ID), `name`, `created_at` (ISO timestamp), duration if available.

If nothing remains, tell the user "No Plaud recordings found for [date range]." and stop.

---

## Step 3, Diff Against Already-Processed

Read `meetings/transcripts/.plaud-processed` (one ID per line; empty list if it doesn't exist). Keep only recordings whose `id` is NOT in it.

If nothing remains, tell the user "All [N] recordings from [date range] have already been processed." and stop.

---

## Step 4, Present Unprocessed Recordings

Display the unprocessed recordings as a numbered list, most recent first:

```
Found [N] unprocessed recording(s) from [date range]:

  1. YYYY-MM-DD, [Recording Title] ([duration, if available])
  2. YYYY-MM-DD, [Recording Title] ([duration, if available])
  ...

Which would you like to process? (e.g. "all", "1,3,4", "1-3", or "none" to cancel)
```

Wait for the user's selection before continuing.

---

## Step 5, Confirm Selection

Parse the response into selected indices: "all" = every item, "1,3,4" = those items, "1-3" = 1 through 3 inclusive, "none"/"cancel" = stop gracefully, single number = that item.

If N > 3, confirm before proceeding:
> "Processing [N] transcripts. This may take a while, I'll work through them one at a time and check in with you after each. Ready?"

---

## Step 6, Process Each Transcript Sequentially

Read `workflows/process-transcript.md` now (once) and hold its instructions in context for the entire loop.

For each selected recording, in order:

### 6a. Fetch the transcript and Plaud note

Call in parallel: `get_transcript` (timestamped transcript, speaker labels) and `get_note` (Plaud's AI summary and action items), both with the recording's `id`. Resolve both by suffix per Step 2.

`get_transcript` paginates; pass `limit` (max 500) and follow `next_cursor` until it is null. **A transcript over roughly 40 minutes will overflow the inline token cap** and spill to a temp file under `/var/folders/…`, which the native Read tool can reach but the shell sandbox cannot. Either page with `limit: 200` to stay inline, or read the overflow file with Read. A single 500 on either call is usually transient: retry once with identical params before treating the recording as unrecoverable. If `get_note` still fails, fall back to generating the summary from the transcript (`process-transcript.md` section 5).

Plaud's note is the primary source for the meeting note body: use it directly, don't re-summarize. Lore's job is wikilinks, frontmatter/tags, and terminology corrections from `context.md`. Scan the raw transcript for participant identification, observations, action items in delta-ops format, and decisions.

**Very long recordings (multi-hour offsites, all-day sessions).** A 4 to 7 hour recording runs to 250 to 350 KB of transcript and a Plaud note of 90 to 130K characters, which no single context should copy by hand. Delegating the raw-transcript copy and a structured extraction to one subagent per recording is the sanctioned exception to "same context, not subagents": subagents write only their own `Transcripts/` file and an extraction file in the working folder, and the parent does every shared write (meeting notes, person notes, projects, decisions, tracker). Two traps seen on a three-day offsite: Plaud's speaker labels on long multi-speaker recordings are routinely wrong (the user labelled as someone else, two voices merged into one), and one recording came back with no diarization at all ("Unknown Speaker" throughout). Have the extraction resolve speakers from content and put a speaker note at the top of the meeting note.

### 6b. Content-based duplicate check

Take the first 500 characters of the fetched transcript and search existing transcripts for that string. Catches transcripts the user pasted in directly from the Plaud website, which never got a `.plaud-processed` / `.processed` entry.

**Filesystem mode**: `grep -rl "<first 500 chars, escaped for shell>" meetings/transcripts/`

**Obsidian mode**: search for the first 100 characters via the vault search or dataview MCP tools, filter results to `Transcripts/` client-side, falling back to Grep per `_conventions.md` → Vault access tooling. Also run the filesystem grep as a fallback for transcripts saved before the Obsidian migration.

If a match is found, ask:
> "This transcript appears to already exist as `[filename]`. Skip it and move on, or process it anyway?"

Skip: mark the recording in `.plaud-processed` and move to the next item. Process anyway: continue.

### 6c. Derive the meeting name and date

Date: the recording's date field (YYYY-MM-DD). Name: the recording's `name` field, cleaned up if needed (e.g. remove auto-generated prefixes like "Plaud - "). Compose the transcript filename:
- **Filesystem mode**: `meetings/transcripts/YYYY-MM-DD - [Meeting Name].md`
- **Obsidian mode**: `Lore/Transcripts/YYYY-MM-DD <kind> <Meeting Name>.md` (`<kind>` if inferable, otherwise omit; subfolder substitution per `_conventions.md` → Path resolution)

**Sanity-check the Plaud title against the transcript before committing it to a filename.** Plaud's `name` is auto-generated and regularly names the wrong person: it latches onto whoever dominates the forward-looking half of the meeting rather than the actual subject. One recording titled as a strategy session for the next day's candidate was in fact the debrief for the previous candidate. Before saving, read enough of the transcript to confirm the title's named people and topic match its actual subject; when they don't, rewrite the name. When a meeting covers two people or two topics, name both explicitly (e.g. `2026-08-25 working Candidate A Debrief and Candidate B Interview Prep`) rather than letting one crowd out the other. The derived name goes on both the transcript and the meeting note, so a bad title propagates twice.

### 6d. Save the raw transcript

Before processing, save the raw transcript content (canonical raw archive in both modes).

- **Filesystem mode**: write to the filename from 6c using the file tools.
- **Obsidian mode**: Write the note at `Transcripts/<derived filename>.md`. Frontmatter: `type: transcript`, `source: plaud`, `plaud_id: <recording id>`, `date: YYYY-MM-DD`. Body is the raw transcript, original timestamps and speaker labels.

### 6e. Process the transcript

Follow every step in `workflows/process-transcript.md` exactly as for any single transcript: extraction, file updates, stakeholder questions, action item pushes, meeting notes, decisions. No abbreviated version here.

### 6f. Mark as processed

Immediately after completing a transcript, do both:
1. Append the recording's Plaud `id` to `meetings/transcripts/.plaud-processed` (create the file if it doesn't exist).
2. Append the saved transcript filename to `meetings/transcripts/.processed`: vault-relative path in Obsidian mode (e.g., `Lore/Transcripts/2026-05-28 1on1 Jane Doe.md`, with the user's subfolder substituted per `_conventions.md` → Path resolution), workspace-relative in filesystem mode (e.g., `meetings/transcripts/2026-05-28 - 1on1 Jane Doe.md`).

So an interrupted batch won't re-process already-completed transcripts.

### 6g. Checkpoint between transcripts

After each transcript except the last, pause, show the output summary from process-transcript.md, then say:
> "That's [N of M]. Moving on to [next recording title] when you're ready, or say 'stop' to end the batch here."

Wait for go-ahead. Gives the user a chance to answer stakeholder-file questions or review action items before the next transcript starts.

---

## Step 7, Batch Complete

After all selected transcripts are processed, show a brief summary:

```
Plaud sync complete. Processed [N] transcript(s):

  ✓ YYYY-MM-DD, [Meeting Title], [N] action items, [N] files updated
  ✓ YYYY-MM-DD, [Meeting Title], [N] action items, [N] files updated
  ...
```

---

## Notes

- **Same context, not subagents.** Preserves awareness of people and projects across the batch, avoids write contention on shared files, lets the user interject between transcripts.
- **`.plaud-processed` append-only:** `CLAUDE.md` → Key behaviors, "Plaud sync tracking".
- **Terminology corrections apply**, per `_conventions.md` → Terminology and glossary.
- **Mode is decided once per session, held for the whole batch.** Do not flip mid-batch.

All output follows VOICE.md.
