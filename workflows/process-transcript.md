# Process Meeting Transcript

Extract insights from meeting transcripts (especially Plaud AI exports) and update relevant files. All output follows VOICE.md.

The transcript is input, not output: Lore never writes a copy of it. It stores the meeting note, the extracted items, the user's own notes verbatim, and a reference back to the source (`_conventions.md` → Source references, not copies).

## Input

Invoke with one of:
- "Process any new transcripts", check `meetings/transcripts/` for unprocessed files.
- "Process [filename]", process a specific transcript file.
- "Process this transcript: [meeting context]" then paste the content, use when pasting directly.

## Storage mode

Sections 0–4 are mode-independent. Section 5 (Update Files) diverges by mode. Decide the mode once per session: see `_conventions.md` → Storage-mode branching. Action items push identically in both modes (section 5, Both Modes).

## Instructions

### 0. Identify the user in the transcript

The user is named in `context.md` under **Role**. When their name appears as a speaker, that's the user. Do not create observations about the user (CLAUDE.md hard rule).

### 1. Check for new transcripts

If no arguments given, find unprocessed files:

1. List `meetings/transcripts/` (`bash ls`, per CLAUDE.md folder rule).
2. Compare against `meetings/transcripts/.processed` (already-processed filenames).
3. If new files exist, report them and ask which to process (or process all).

File naming: recommended `YYYY-MM-DD - Meeting Title.md` or `.txt`. Extract date and meeting name from the filename when possible.

After processing each file, append the filename to `meetings/transcripts/.processed` (append-only, never rewrite). Optionally move to `meetings/transcripts/archive/` if the user prefers.

### 2. Identify participants

Match speakers to known people via `context.md`: user's name under **Role**; direct reports under **My Team** (profiles in `team/*.md`); key stakeholders under **Key Stakeholders** (profiles in `stakeholders/*.md`).

Unknown participants:
- In Obsidian mode, always Read `<vault-path>/People/<Full Name>.md` before concluding a person has no profile. Applies to everyone named, not just speakers (new hires, people referenced in passing, anyone who didn't speak). If the exact path is missing, `bash ls` the `People/` folder for near-matches before concluding the note is new. A direct Read/ls miss is the only reliable absence signal; never infer absence from a vault search or dataview query, or from the person not being a known report/stakeholder.
- Only after confirming the note doesn't exist: note them in the summary and ask "Should I create a stakeholder file for [Name]?" If yes, create `stakeholders/{firstname-lastname}.md` from `templates/stakeholder.template.md`.

### 3. Extract information

**Glossary pass (whole transcript):** apply `context.md` → Terminology & Corrections and maintain the glossary per `_conventions.md` → Terminology and glossary. Flag conflicts and propose new recurring terms in the output summary.

For each identified person (except the user), extract:
- **Projects & initiatives**: what they're working on, updates, blockers/dependencies, timeline references.
- **Wins & concerns**: accomplishments and excitement; frustrations and stress indicators.
- **Communication patterns**: how they engaged (dominant, quiet, collaborative), notable dynamics.
- **Decisions made**: decisions reached, context/rationale, options considered and rejected. Before logging, apply the decision-log test (`_conventions.md` → Decision-log discipline). Failing decisions stay in the meeting note only; no log entry for routine calls ("we'll meet Tuesday," "Jane takes the ticket").
- **Action items**: commitments they made, requests made of them, follow-ups they own.

For the user: extract their action items and commitments. These go to The Quest Log as `propose` ops (section 5, Both Modes). Never write `inbox/action-items.md`. Soft promises and check-backs that aren't task-shaped (waiting-on, "I'll get you X by Friday," "revisit in Q3") go to the commitments ledger instead, captured in section 5 alongside the other writes: `workflows/commitments.md`.

### 4. Identify and update projects

Look for projects, initiatives, or ongoing work named in the transcript. Cross-reference the Active Initiatives table in `context.md`.

For each project mentioned:
- **Project file exists** (`projects/[slug].md` filesystem; `Projects/[Name].md` Obsidian): append a dated status block under `## Current Phase` with meaningful updates (decisions, blockers, phase progress, next steps). In Obsidian mode, Edit the project note, anchored on (inserting after) the last line of that section.
  ```markdown
  **YYYY-MM-DD:**
  - [Update from this meeting]
  ```
- **No project file for a recognized initiative:** create from `templates/project.template.md` with what's known; ask the user to confirm first.
- **Brand-new initiative** (not in `context.md`): note it in the summary and ask whether to add it to `context.md` Active Initiatives and create a project file.

Do not touch `context.md` Active Initiatives rows automatically; prompt the user.

### 4.5. Triage for the user's own action items

Extracted action items belonging to the user do **not** push straight to the Active list. They go in as `propose` ops to The Quest Log so they go to its "To Triage" pile, where the user resolves each one with a single click, Do now / Already done / Schedule / Delegate / Delete, before it becomes a real tracked commitment. Full procedure and rationale: section 5, "Both Modes: user's action items" below, and `workflows/action-items.md` → "Action item triage."

Other attendees' action items are unaffected: they stay in the meeting note only, per section 6's "Others' Action Items" output, same as always.

### 5. Update files

Branch on storage mode (`_conventions.md` → Storage-mode branching). Targets by mode:

| Artifact | Filesystem | Obsidian |
|----------|-----------|----------|
| Meeting note | `meetings/notes/{date}-{meeting-name}.md` | `Lore/Meetings/<YYYY-MM-DD> <kind> <subject>.md` |
| Source reference | `Source:` first line of the meeting note | `source` / `source_id` / `source_url` frontmatter on the meeting note (Notion: properties-only Transcripts page) |
| Observations | `team/*.md`, `stakeholders/*.md` | person's vault note via Edit |
| Decisions | `decisions/log.md` | one note per decision, `Lore/Decisions/` |

Obsidian path resolution and the `Lore/` subfolder override: `_conventions.md` → Path resolution. Templates translate into vault notes; don't fork templates into the vault (`_conventions.md`). Any new person, project, or decision note also gets an `Index.md` line (`_conventions.md` → Vault index).

**Observations (both modes):** append a dated entry to `## Observations`, newest first (insert before the first existing `###`). No thematic subsections. Append, never overwrite. Format:
  ```markdown
  ### YYYY-MM-DD - [Meeting context]

  - [Observation 1]
  - [Observation 2]
  ```
  In Obsidian mode the entry header wikilinks the meeting note: `### YYYY-MM-DD - [[YYYY-MM-DD <kind> <subject>]]`, so observations backlink to the meeting.

**Recency fields (both modes, REQUIRED, never skip):** for every attendee who has a person note, update their recency frontmatter in the same pass as the observation. This is the write half of the contract that `1on1-prep` and `cadence` read; skipping it is what silently breaks them.

- `last_met: 'YYYY-MM-DD'` on every attendee, set to the meeting date, whenever the meeting date is newer than the existing value. Applies to direct reports and stakeholders alike.
- `last_1on1: 'YYYY-MM-DD'` additionally, on direct reports only, when the meeting is genuinely a one-to-one with the user.
- Only ever move these dates forward. If the existing value is newer than the meeting being processed (backfilling an old transcript), leave it alone.
- Use the single-quoted `'YYYY-MM-DD'` string form so Dataview parses it as a date.

**Do not decide "is this a 1:1?" from the `kind` field alone.** Vault audit on 2026-07-30 found 15 of 17 meeting notes in one four-day window with a blank `kind`, plus notes named `1on1 ...` carrying other kinds and notes named otherwise carrying `kind: 1on1`. Treat a meeting as a 1:1 when any of these hold: `kind: 1on1`; or the title contains `1on1`, `1:1`, or `1-1`; or the attendee list is exactly the user plus one direct report. Then also set `kind: 1on1` on the meeting note if it was blank, so the data improves as it is touched.

**Meeting note (both modes):**
- **Plaud note available** (fetched via `mcp__plaud__get_note` during plaud-sync): use its body as primary content. Apply terminology corrections; in Obsidian mode also resolve all participant/project names to `[[Name]]`. Save from `templates/meeting-note.template.md`. Do not regenerate a summary the Plaud note already covers.
- **Other sources with their own summary** (Notion AI meeting notes, Teams/Zoom recaps): same treatment as a Plaud note; link the source page, don't duplicate it.
- **No source summary** (manual drop or fetch failed): generate the summary from the transcript.
- The body summarizes the meeting; it does not restate any attendee's role, team, or history (Obsidian: wikilink instead, per `_conventions.md` → Linking and deduplication).

**Source reference, not a copy:** record the source per `_conventions.md` → Source references, not copies. Never write the transcript into the meeting note, a `Transcripts/` note, or a Notion page. The user's own notes and flagged highlights go verbatim under `## Your notes`. A transcript the user dropped into `meetings/transcripts/` stays where it is; one pasted into chat with no other home: ask once whether to keep a copy.

#### Section 5, Obsidian-specific details

**Person notes:**
- **Existence check** via a direct Read of the exact expected path (done in section 2 for everyone named); if missing, `bash ls` the `People/` folder for near-matches before concluding the note is new. Never assert a note is missing from a vault search or dataview query miss.
- **Note exists:** add the observation inside `## Observations` via Edit. **Never append to the end of the file for observations on an existing note** (it dumps content outside the section). Read the note, find the anchor inside `## Observations` (the first existing `###` entry), and Edit to insert the new entry immediately above it. Only if `## Observations` does not exist, Edit to add the full section (heading plus entry) in the right place in the note.
- **Note missing for a known report/stakeholder:** create from `templates/team-member.template.md` or `templates/stakeholder.template.md` translated into the vault, saved to `Lore/People/<Full Name>.md`.
- **Unknown participants:** same ask-first flow as filesystem mode. On confirmation, create `Lore/People/<Full Name>.md` from the stakeholder template, frontmatter `type: person, role: stakeholder/external` (or as specified), tag `#person/stakeholder/external`.

**Decisions:** one note per decision, `Lore/Decisions/<YYYY-MM-DD> <Short Title>.md`, from `templates/decision-log-entry.template.md` translated into the vault. Frontmatter per `_conventions.md` → Frontmatter schemas (Decision), tag `#decision/active`, body wikilinks every person and project. Do **not** append to `decisions/log.md` in Obsidian mode; the vault is canonical.

**Meeting note frontmatter** per `_conventions.md` → Frontmatter schemas (Meeting); tag `#meeting/<kind>`.

**Tracking files:** `.processed` and `.plaud-processed` stay in the repo (not the vault); append as in filesystem mode.

#### Section 5, Both Modes: user's action items

Write `propose` operations to The Quest Log (the same tracker and procedure as everything else in `workflows/action-items.md`; there is no separate triage artifact). Full mechanics: `workflows/action-items.md` → "Action item triage." Never write `inbox/action-items.md`.

Per `propose` op, `item` carries the same fields as an `add` op:
- `item.date` = meeting/source date (when the item originated)
- `item.created` = today (`YYYY-MM-DD`)
- `item.from` = meeting name or context
- `item.subject` = short title
- `item.due` = `ASAP`, `TBD`, `YYYY-MM-DD`, or custom text (a hint shown on the triage card; the user picks the real due date when they resolve it)
- `item.lore` = `"Y"` if Lore could plausibly do or advance it from inside the workspace, else `""`
- `item.specialist` = `"Y"` if a sibling specialist agent (e.g., Sigil) could pick it up autonomously, else `""`
- `item.notes` = the full description plus any notes-worthy context (the retired `actionNeeded` field's content lives here now)

Dedup is authoritative on `subject + from` (normalized): a `propose` no-ops if that key already exists in any status, dismissed tombstones included, so reprocessing never re-proposes something already triaged, active, or thrown away.

Procedure: read the tracker, assemble `propose` ops, write them as an ArtifactData `batch` (by hand for a few, `scripts/quest-log-ops.js` for many), per `workflows/action-items.md` → Writing. Verify per `_conventions.md` → Verification loops (re-query `status == "triage"` and report how many were proposed and how many were skipped as duplicates) and surface the proposed count in the Output Summary. Don't claim items were "added to the tracker"; they're waiting in "To Triage" until the user resolves each card (`workflows/action-items.md` → "Action item triage").

### 6. Output summary

```markdown
## Meeting Processed: [Date] - [Meeting Name]

### Summary
[2-3 sentence overview]

### Participants
- **You** (the user)
- [Attendee 1] - [Known team member / Known stakeholder / New]
- [Attendee 2]

### Files Updated
(Filesystem paths shown; in Obsidian mode substitute `Lore/Meetings/`, `Lore/People/`, `Lore/Decisions/`.)
- meetings/notes/{date}-{meeting-name}.md - Meeting summary created
- Source reference recorded (no transcript copy)
- team/{person}.md - Added observations
- stakeholders/{person}.md - Added observations
- The Quest Log - Proposed [N] item(s) to your "To Triage" pile
- decisions/log.md - Added decision on [topic]

### Your Action Items (waiting in "To Triage")
- [ ] [Action 1]
- [ ] [Action 2]

Resolve them whenever in The Quest Log, one card at a time: Do now, Already done, Schedule, Delegate, or Delete. Each click is final; there's nothing further to sync.

(Dedup happens on subject + from across the whole tracker, so exact duplicates are skipped and won't reappear if this transcript is ever reprocessed.)

### Others' Action Items (Tracked in meeting notes)
- [ ] [Person]: [Action] - Due: [date]

### New Stakeholders?
I found these unknown participants:
- **[Name 1]** - [Role/context from transcript]

Should I create stakeholder files for them? (yes/no)

### Projects/Initiatives Mentioned
- [Project 1] - [Brief context]
- [Project 2] - [Brief context]

How should I track these?

### 1:1 Prep Insights
[Only if team members were present]
- **[Team member]**: [Notable observation for next 1:1]

---

Transcript processed; source referenced, not copied.
```

## Tips

- The user is named in `context.md`; don't create observations about them.
- When uncertain if something is noteworthy, capture it.
- Personal observations (mood, engagement) go in Observations, not 1:1 notes.
- Look for patterns across meetings over time.
- Flag anything that might indicate someone needs support.
- Plaud transcripts: speaker labels are consistent; timestamps can be ignored for analysis.
- External parties (customers, partners, vendors): note the business context.

## Adding transcripts

- **Drop files** in `meetings/transcripts/` (recommended `YYYY-MM-DD - Meeting Title.md`).
- **Paste directly:** "Process this transcript: [meeting context]" then paste (with timestamps and speaker labels).
- **Let the agent check:** "Process any new transcripts" scans `meetings/transcripts/` for unprocessed files.

## Plaud AI specifics

Plaud format:
```
00:00:01 Speaker Name
Transcript text here...

00:00:27 Other Speaker
More text...
```
Extract speaker names from label lines; timestamps aid context but aren't critical; speaker labels are consistent; multiple lines can belong to one speaker before the next timestamp.
