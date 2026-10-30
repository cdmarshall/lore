# Notion Meetings Sync

Pull Notion AI meeting notes for a time period, diff against meetings already processed, let the user pick which to process, and run each through the standard transcript workflow in turn. The Notion counterpart of `workflows/plaud-sync.md`, for users whose meeting-notes tool (`context.md` → Connectors) is Notion AI meeting notes.

Works in every storage mode. Notion AI meeting notes are the *source*; the Notion knowledge base (`workflows/notion-kb.md`) is one possible *destination*. A filesystem or Obsidian user can sync from Notion meeting notes too.

**Reference the meeting note, never copy it.** Notion keeps the transcript, the AI summary, and the user's typed notes. Lore reads them to extract what matters, then stores only its own meeting note (built from Notion's summary), the user's own notes verbatim, and a reference back to the Notion meeting note. Full rule: `_conventions.md` → Source references, not copies.

**Read-only on the source.** Never edit, move, rename, or comment on the Notion AI meeting note itself. It belongs to the meeting, and often to whoever started the recording.

## Storage Mode

Storage-mode branching: `_conventions.md` → Storage-mode branching. No mode saves the transcript; modes differ only in where the source reference lives:

- **Filesystem mode**: a `Source:` line at the top of the meeting note in `meetings/notes/`.
- **Obsidian mode**: `source: notion-ai`, `source_id`, `source_url` frontmatter on the meeting note.
- **Notion mode**: `Source` = `notion-ai`, `Source ID`, `Source URL` properties on the Lore Meetings page. The Lore page is separate from the Notion AI meeting note and links to it.

Tracking dotfiles stay in the repo in every mode (`CLAUDE.md` → Key behaviors, "Meeting sync tracking").

## Invocation

| What the user says | Example |
|---|---|
| "Sync my Notion meetings from the last week" | Pulls 7 days back from today |
| "Sync my meetings from today" (meeting-notes tool is Notion) | Pulls today only |
| "Sync Notion meeting notes from [date] to [date]" | Explicit date range |
| "Sync my meetings" (no period given) | Ask: "What time period? (e.g. today, last 7 days)" |

---

## Step 1, Resolve the date range

Parse the request into `date_from` and `date_to` (YYYY-MM-DD, inclusive, in the user's timezone per `_conventions.md` → Timezone). "Today" = `date_from` = `date_to` = today; "last N days" = today − N to today; explicit dates as given; no period: ask.

---

## Step 2, List meeting notes from Notion

**Resolve the tools by suffix.** The Notion server prefix is install-specific and usually an opaque UUID, and the tools are often deferred. Find `notion-query-meeting-notes`, `notion-fetch`, and `notion-get-users` with a suffix search (`ToolSearch`). A failed `select:` on a guessed prefix is not evidence Notion is disconnected. If tool availability isn't known yet this session, call `notion-get-tool-access` once: meeting-notes querying depends on the workspace's Notion plan, and the access map says whether it's available.

Call `notion-query-meeting-notes` with one date filter on `created_time` (`date_is_within`, exact `daterange` from `date_from` to `date_to`). Widen each end by one day and filter in memory after converting `Created time` (UTC) to the user's timezone, so a late-evening meeting doesn't fall on the wrong side. Do not add a current-user filter: results already cover meetings the user attended or created.

The query returns at most 50 rows. If it returns 50, split the range in half and query each half until each returns fewer.

Each row carries `Title`, `Created time`, `Attendees` (`user://` ids), and `url`. The **meeting-note ID** is the 32-character hex id at the end of `url`, without dashes. Lowercase it.

If nothing remains, say "No Notion meeting notes found for [date range]." and stop.

---

## Step 3, Diff and screen

1. Read `meetings/transcripts/.notion-meetings-processed` (one ID per line; empty if missing). Keep only rows whose ID is not in it.
2. **Screen out empty notes.** Fetch each remaining row with `notion-fetch`, `include_transcript: false` (cheap: the transcript shows as a placeholder when one exists). A note with no AI summary, no transcript placeholder, and no typed notes is empty: someone opened a meeting note but never recorded. List empties separately; don't offer them for processing.

If nothing processable remains, say "All [N] meeting notes from [date range] have already been processed." (naming any empties) and stop.

---

## Step 4, Present and select

```
Found [N] unprocessed Notion meeting note(s) from [date range]:

  1. YYYY-MM-DD HH:MM, [Title] ([N] attendees)
  2. YYYY-MM-DD HH:MM, [Title] ([N] attendees)

Empty (no recording): [Title, date], [Title, date]. Mark these as handled? (yes/no)

Which would you like to process? (e.g. "all", "1,3", "1-3", or "none")
```

Wait for the selection. Parse "all", lists, ranges, single numbers, and "none"/"cancel" (stop). If more than 3 are selected, confirm: "Processing [N] meetings. I'll work through them one at a time and check in after each. Ready?" A yes on the empties appends their IDs to `.notion-meetings-processed` so they stop appearing.

---

## Step 5, Process each meeting in turn

Read `workflows/process-transcript.md` now (once) and hold it for the whole loop. For each selected meeting, in order:

### 5a. Fetch

`notion-fetch` the meeting-note `url` with `include_transcript: true`. That returns Notion's AI summary, the notes the user typed during the meeting, and the full transcript. Check `truncated` and `unknown_block_ids` in the result: if the transcript was cut, say so in the speaker note and work from what came back plus the summary rather than guessing at the rest. The transcript is working input only; it is never written anywhere.

Resolve the `Attendees` ids to names with `notion-get-users`. That list covers only Notion users; external guests appear only in the transcript.

Notion's AI summary is the primary source for the meeting note body: use it directly, don't re-summarize (`process-transcript.md` section 5, "Other sources with their own summary"). Scan the transcript for participants, observations, action items, and decisions.

**Speakers.** Notion transcripts can carry generic speaker labels or none. Resolve who said what from content and the attendee list. When it stays uncertain, put a one-line speaker note at the top of the meeting note instead of guessing.

### 5b. Duplicate check

Catches a meeting already processed another way (a transcript pasted in, or the same call also captured by another recorder):

- **Filesystem mode**: `grep -rl "<meeting-note id>" meetings/notes/`, then `ls meetings/notes/YYYY-MM-DD-*` for a same-date, same-subject note.
- **Obsidian mode**: query meeting notes for `source_id = "<id>"` (Grep fallback per `_conventions.md` → Vault access tooling), then list same-date notes in `Meetings/`.
- **Notion mode**: SQL on the Meetings data source for `"Source ID" = ?`, then for the same `Date`.

On a match, ask: "This meeting looks already processed as `[note]`. Skip it, or process it anyway?" Skip: append the ID to `.notion-meetings-processed` and move on.

### 5c. Name and date

Date: `Created time` in the user's timezone. Name: the meeting note's title. When the note is linked to a calendar event the title is usually the event name; an untitled or generic one ("Meeting notes", "Untitled") gets a name from the transcript's subject. Confirm the title's people and topic match what was actually discussed before using it. Naming per mode follows `plaud-sync.md` step 6c (filesystem `meetings/notes/YYYY-MM-DD-[name].md`; Obsidian and Notion `YYYY-MM-DD <kind> <Name>`).

### 5d. Record the source reference

- **Reference:** meeting-note ID, the `url`, date and start time in the user's timezone, and duration if the transcript's timestamps give one. The Notion URL is stable, so it is the link.
- **The user's own words, verbatim:** the notes they typed into the meeting note go under `## Your notes`. Not the AI summary, which Lore adapts, and never the transcript.
- **Filesystem mode**: first line `Source: Notion AI meeting notes <id>, <date> <start time>, <url>`.
- **Obsidian mode**: `source: notion-ai`, `source_id: <id>`, `source_url: <url>`.
- **Notion mode**: `Source` = `notion-ai`, `Source ID` = id, `Source URL` = url on the Meetings page when it is created.

### 5e. Process

Follow every step of `workflows/process-transcript.md` exactly as for any single transcript.

### 5f. Mark as processed

Immediately after each meeting:
1. Append the meeting-note ID to `meetings/transcripts/.notion-meetings-processed` (create it if missing).
2. Append the meeting note's location to `meetings/transcripts/.processed` (vault-relative path, workspace-relative path, or the Notion page name, per mode).

An interrupted batch then never reprocesses finished meetings.

### 5g. Checkpoint

After each meeting except the last, show the `process-transcript.md` output summary and say: "That's [N of M]. Moving on to [next title] when you're ready, or say 'stop' to end here." Wait for the go-ahead.

---

## Step 6, Batch complete

```
Notion meetings sync complete. Processed [N] meeting(s):

  ✓ YYYY-MM-DD, [Meeting Title], [N] action items, [N] files updated
```

---

## Notes

- **Same context, not subagents**, as in `plaud-sync.md`, including its exception for very long meetings (an all-day session): one extraction subagent per meeting, parent does every shared write.
- **`.notion-meetings-processed` is append-only:** `CLAUDE.md` → Key behaviors, "Meeting sync tracking". To reprocess, the user removes that ID.
- **Terminology corrections apply** (`_conventions.md` → Terminology and glossary). Notion's transcription mangles names too; the user's corrections table covers it.
- **Mode is decided once per session** and held for the batch.

All output follows VOICE.md.
