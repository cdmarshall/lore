# Plaud Sync

Pull recordings from Plaud for a specified time period, diff against already-processed transcripts, let the user select which to process, and run each through the standard transcript workflow sequentially.

## Invocation

| What the user says | Example |
|---|---|
| "Sync Plaud from the last week" | Pulls 7 days back from today |
| "Pull Plaud transcripts from the last 3 days" | Pulls 3 days back from today |
| "Sync Plaud from [date] to [date]" | Pulls explicit date range |
| "Sync Plaud" (no period given) | Ask: "What time period? (e.g. last 7 days, last 3 days)" |

---

## Step 1 — Resolve the Date Range

Parse the user's request into a concrete `date_from` and `date_to` (both YYYY-MM-DD, inclusive).

- "last week" / "the last 7 days" → `date_from` = today − 7, `date_to` = today
- "last 3 days" → `date_from` = today − 3, `date_to` = today
- "last 2 weeks" → `date_from` = today − 14, `date_to` = today
- Explicit dates → use as given
- No period given → ask before continuing

---

## Step 2 — Fetch Recordings from Plaud

Call `mcp__plaud__list_files` with the resolved `date_from` and `date_to`.

The tool paginates automatically when date filters are set and returns all matches. Each recording in the response includes at minimum:
- `id` (the Plaud file ID — canonical identifier)
- `name` (recording title)
- `created_at` or date field (recording date)
- Duration if available

If the call returns zero recordings, tell the user:
> "No Plaud recordings found for [date range]."
Then stop.

---

## Step 3 — Diff Against Already-Processed

Read `meetings/transcripts/.plaud-processed` to get the list of already-processed Plaud file IDs (one ID per line). If the file doesn't exist yet, treat it as an empty list.

Filter the Plaud results: **keep only recordings whose `id` is NOT in `.plaud-processed`**.

If all recordings in the range have already been processed, tell the user:
> "All [N] recordings from [date range] have already been processed."
Then stop.

---

## Step 4 — Present Unprocessed Recordings

Display the unprocessed recordings as a numbered list, most recent first:

```
Found [N] unprocessed recording(s) from [date range]:

  1. YYYY-MM-DD — [Recording Title] ([duration, if available])
  2. YYYY-MM-DD — [Recording Title] ([duration, if available])
  ...

Which would you like to process? (e.g. "all", "1,3,4", "1-3", or "none" to cancel)
```

Wait for the user's selection before continuing.

---

## Step 5 — Confirm Selection

Parse the user's response into a list of selected indices:
- "all" → every item
- "1,3,4" → items 1, 3, and 4
- "1-3" → items 1 through 3 inclusive
- "none" / "cancel" → stop gracefully
- Single number → just that item

Confirm the selection if more than 3 transcripts were chosen:
> "Processing [N] transcripts. This may take a while — I'll work through them one at a time and check in with you after each. Ready?"

Wait for confirmation if N > 3.

---

## Step 6 — Process Each Transcript Sequentially

Read `workflows/process-transcript.md` now (once) and hold its instructions in context for the entire loop.

For each selected recording, in order:

### 6a. Fetch the transcript

Call `mcp__plaud__get_transcript` with the recording's `id`. This returns the full timestamped transcript with speaker labels — exactly the format the process-transcript workflow expects.

Optionally also call `mcp__plaud__get_note` to get Plaud's AI-generated summary and action items. Use this as supplementary context (e.g., to cross-check your own extracted action items), not as a replacement for reading the transcript yourself.

### 6b. Content-based duplicate check

Take the first 500 characters of the fetched transcript and search all existing files in `meetings/transcripts/` for that string:

```bash
grep -rl "<first 500 chars, escaped for shell>" meetings/transcripts/
```

If a match is found, tell the user:
> "This transcript appears to already exist locally as `[filename]`. Skip it and move on, or process it anyway?"

Wait for their answer before continuing. If they say skip, mark the recording in `.plaud-processed` (so it won't surface again) and move to the next item. If they say process anyway, continue.

This catches transcripts the user previously pasted in directly from the Plaud website, which wouldn't appear in `.plaud-processed` or `.processed` because they were never associated with a Plaud file ID.

### 6c. Derive the meeting name and date

- Date: use the recording's date field (YYYY-MM-DD)
- Name: use the recording's `name` field. Clean it up if needed (e.g., remove auto-generated prefixes like "Plaud - ").
- Use these to name the local transcript file: `meetings/transcripts/YYYY-MM-DD - [Meeting Name].md`

### 6c. Save the raw transcript locally

Before processing, save the raw transcript content to `meetings/transcripts/YYYY-MM-DD - [Meeting Name].md`. This makes the local archive the canonical copy, consistent with the folder-dropped workflow.

### 6d. Process the transcript

Follow every step in `workflows/process-transcript.md` exactly as you would for any single transcript — extraction, file updates, stakeholder questions, action item pushes, meeting notes, decisions. There is no abbreviated version here.

### 6e. Mark as processed

After completing a transcript, **immediately** do both:
1. Append the recording's Plaud `id` to `meetings/transcripts/.plaud-processed` (create the file if it doesn't exist)
2. Append the saved local filename to `meetings/transcripts/.processed`

This ensures that even if the batch is interrupted mid-run, already-completed transcripts won't be re-processed.

### 6f. Checkpoint between transcripts

After finishing each transcript (except the last), pause and show the output summary from process-transcript.md, then say:
> "That's [N of M]. Moving on to [next recording title] when you're ready — or say 'stop' to end the batch here."

Wait for the user's go-ahead before starting the next one. This gives the user a chance to answer any "should I create a stakeholder file?" questions or review action items before the next transcript begins.

---

## Step 7 — Batch Complete

After all selected transcripts are processed, show a brief summary:

```
Plaud sync complete. Processed [N] transcript(s):

  ✓ YYYY-MM-DD — [Meeting Title] — [N] action items, [N] files updated
  ✓ YYYY-MM-DD — [Meeting Title] — [N] action items, [N] files updated
  ...
```

---

## Notes

- **Process in the same context, not subagents.** Sequential same-context processing preserves awareness of people and projects seen earlier in the batch, avoids write contention on shared files (stakeholder profiles, decisions log), and lets the user interject between transcripts.
- **`.plaud-processed` is append-only.** Never delete or rewrite it. If the user wants to re-process a recording, they should remove the specific ID manually (or ask Lore to do it).
- **Plaud's AI notes are supplementary.** Always read and process the full transcript yourself. Plaud's notes can help cross-check extracted action items but should not be treated as the ground truth.
- **Terminology corrections apply.** If `context.md` has a `## Terminology & Corrections` section, apply those corrections to all transcript text as you process it.
