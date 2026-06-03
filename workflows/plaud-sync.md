# Plaud Sync

Pull recordings from Plaud for a specified time period, diff against already-processed transcripts, let the user select which to process, and run each through the standard transcript workflow sequentially.

## Storage Mode

This workflow operates in both filesystem and Obsidian modes (see `CLAUDE.md` → Obsidian Detection). The two modes differ only in where the raw transcript file is saved and where duplicate-content checks are run:

- **Filesystem mode**: raw transcripts saved to `meetings/transcripts/`. Duplicate-content check `grep`s the same folder.
- **Obsidian mode**: raw transcripts saved to `Lore/Transcripts/` in the vault via `write_note`. Duplicate-content check uses `search_notes`. **Path resolution**: `Lore/` is the default subfolder; replace with the user's override from `context.md` → "Notes for Lore" → "Vault Configuration" if present (e.g., no prefix for this vault).

The tracking dotfiles (`meetings/transcripts/.plaud-processed`, `meetings/transcripts/.processed`) stay in the workspace repo in both modes. Step 6d (process the transcript) hands off to `workflows/process-transcript.md`, which has its own Obsidian-mode branch, so downstream behavior follows naturally.

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

**Do NOT use the `date_from`/`date_to` filter parameters.** The filtered endpoint returns a cached result set on Plaud's side and will miss recordings that were created recently. Always fetch without date filters.

Instead, call `mcp__plaud__list_files` without any filters (use `page_size: 20`, start at `page: 1`). Recordings are returned most-recent-first. Collect pages until either:
- You have seen at least one recording whose `created_at` date is strictly before `date_from`, OR
- You have fetched 5 pages (safety limit)

Then filter the collected results in memory: keep only recordings where the `created_at` date falls within `[date_from, date_to]` inclusive.

Each recording in the response includes at minimum:
- `id` (the Plaud file ID, canonical identifier)
- `name` (recording title)
- `created_at` (ISO timestamp, use this for date comparison)
- Duration if available

If no recordings remain after filtering, tell the user:
> "No Plaud recordings found for [date range]."
Then stop.

---

## Step 3, Diff Against Already-Processed

Read `meetings/transcripts/.plaud-processed` to get the list of already-processed Plaud file IDs (one ID per line). If the file doesn't exist yet, treat it as an empty list.

Filter the Plaud results: **keep only recordings whose `id` is NOT in `.plaud-processed`**.

If all recordings in the range have already been processed, tell the user:
> "All [N] recordings from [date range] have already been processed."
Then stop.

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

Parse the user's response into a list of selected indices:
- "all" → every item
- "1,3,4" → items 1, 3, and 4
- "1-3" → items 1 through 3 inclusive
- "none" / "cancel" → stop gracefully
- Single number → just that item

Confirm the selection if more than 3 transcripts were chosen:
> "Processing [N] transcripts. This may take a while, I'll work through them one at a time and check in with you after each. Ready?"

Wait for confirmation if N > 3.

---

## Step 6, Process Each Transcript Sequentially

Read `workflows/process-transcript.md` now (once) and hold its instructions in context for the entire loop.

For each selected recording, in order:

### 6a. Fetch the transcript and Plaud note

Call both in parallel:
- `mcp__plaud__get_transcript` with the recording's `id` — returns the full timestamped transcript with speaker labels.
- `mcp__plaud__get_note` with the recording's `id` — returns Plaud's AI-generated summary and action items.

**Plaud's note is the primary source for the meeting note body.** Use it directly rather than re-summarizing from the transcript. Lore's job on the meeting note is to add wikilinks, apply frontmatter/tags, and apply any terminology corrections from `context.md` — not to regenerate a summary Plaud already produced.

The raw transcript is still required for: identifying participants to resolve wikilinks, extracting observations for people profiles, catching action items the artifact needs in the right delta-ops format, and surfacing decisions. Scan it for those purposes.

### 6b. Content-based duplicate check

Take the first 500 characters of the fetched transcript and search existing transcripts for that string.

**Filesystem mode**: search `meetings/transcripts/`:

```bash
grep -rl "<first 500 chars, escaped for shell>" meetings/transcripts/
```

**Obsidian mode**: search the vault using `search_notes(query: "<first 100 chars>", search_type: "hybrid")`. Filter results to the `Transcripts/` folder client-side. Also run the filesystem grep above as a fallback to catch any transcripts that were saved in filesystem mode before the migration.

If a match is found in either mode, tell the user:
> "This transcript appears to already exist as `[filename]`. Skip it and move on, or process it anyway?"

Wait for their answer before continuing. If they say skip, mark the recording in `.plaud-processed` (so it won't surface again) and move to the next item. If they say process anyway, continue.

This catches transcripts the user previously pasted in directly from the Plaud website, which wouldn't appear in `.plaud-processed` or `.processed` because they were never associated with a Plaud file ID.

### 6c. Derive the meeting name and date

- Date: use the recording's date field (YYYY-MM-DD)
- Name: use the recording's `name` field. Clean it up if needed (e.g., remove auto-generated prefixes like "Plaud - ").
- Compose the transcript filename:
  - **Filesystem mode**: `meetings/transcripts/YYYY-MM-DD - [Meeting Name].md`
  - **Obsidian mode**: `Lore/Transcripts/YYYY-MM-DD <kind> <Meeting Name>.md` (use `<kind>` if you can infer it from the meeting name; otherwise omit and just use `YYYY-MM-DD <Meeting Name>.md`)

### 6d. Save the raw transcript

Before processing, save the raw transcript content.

- **Filesystem mode**: write to `meetings/transcripts/YYYY-MM-DD - [Meeting Name].md` using the file tools.
- **Obsidian mode**: write to `Transcripts/<derived filename>.md` via `write_note(title: "<derived filename>", directory: "Transcripts/", content: "...", metadata: {...})`. Frontmatter:
  ```yaml
  type: transcript
  source: plaud
  plaud_id: <recording id>
  date: YYYY-MM-DD
  ```
  Body is the raw transcript with original timestamps and speaker labels.

The transcript file is the canonical raw archive in both modes, consistent with the folder-dropped workflow.

### 6e. Process the transcript

Follow every step in `workflows/process-transcript.md` exactly as you would for any single transcript, extraction, file updates, stakeholder questions, action item pushes, meeting notes, decisions. There is no abbreviated version here.

### 6f. Mark as processed

After completing a transcript, **immediately** do both:
1. Append the recording's Plaud `id` to `meetings/transcripts/.plaud-processed` (create the file if it doesn't exist)
2. Append the saved transcript filename to `meetings/transcripts/.processed`. In Obsidian mode, record the vault-relative path (e.g., `Lore/Transcripts/2026-05-28 1on1 Jane Doe.md`); in filesystem mode, the workspace-relative path (e.g., `meetings/transcripts/2026-05-28 - 1on1 Jane Doe.md`).

Both tracking files stay in the workspace repo in both modes. Obsidian ignores dotfiles, so this keeps tracking semantics consistent across modes.

This ensures that even if the batch is interrupted mid-run, already-completed transcripts won't be re-processed.

### 6g. Checkpoint between transcripts

After finishing each transcript (except the last), pause and show the output summary from process-transcript.md, then say:
> "That's [N of M]. Moving on to [next recording title] when you're ready, or say 'stop' to end the batch here."

Wait for the user's go-ahead before starting the next one. This gives the user a chance to answer any "should I create a stakeholder file?" questions or review action items before the next transcript begins.

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

- **Process in the same context, not subagents.** Sequential same-context processing preserves awareness of people and projects seen earlier in the batch, avoids write contention on shared files (stakeholder profiles, decisions log), and lets the user interject between transcripts.
- **`.plaud-processed` is append-only.** Never delete or rewrite it. If the user wants to re-process a recording, they should remove the specific ID manually (or ask Lore to do it).
- **Plaud's note is the primary source for the meeting note body.** Use it directly; add wikilinks, frontmatter, and terminology corrections on top. The raw transcript is still needed for participant identification, observations, action items, and decisions — but don't regenerate a summary when Plaud already produced one.
- **Terminology corrections apply.** If `context.md` has a `## Terminology & Corrections` section, apply those corrections to all transcript text as you process it.
- **Mode is decided once per session.** If Obsidian mode is active when the batch starts, every transcript in the batch is saved to the vault; if filesystem mode, every transcript is saved to the repo. Do not flip mid-batch.
