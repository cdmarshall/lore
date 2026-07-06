# Process Meeting Transcript

Extract insights from meeting transcripts (especially Plaud AI exports) and update relevant files. All output follows VOICE.md.

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

For the user: extract their action items and commitments. These push to the artifact as `add` ops (section 5, Both Modes). Never write `inbox/action-items.md`. Soft promises and check-backs that aren't task-shaped (waiting-on, "I'll get you X by Friday," "revisit in Q3") go to the commitments ledger instead, captured in section 5 alongside the other writes: `workflows/commitments.md`.

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

### 5. Update files

Branch on storage mode (`_conventions.md` → Storage-mode branching). Targets by mode:

| Artifact | Filesystem | Obsidian |
|----------|-----------|----------|
| Meeting note | `meetings/notes/{date}-{meeting-name}.md` | `Lore/Meetings/<YYYY-MM-DD> <kind> <subject>.md` |
| Raw transcript | `meetings/transcripts/{date}-{meeting-name}.md` | `Lore/Transcripts/<YYYY-MM-DD> <kind> <subject>.md` |
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

**Meeting note (both modes):**
- **Plaud note available** (fetched via `mcp__plaud__get_note` during plaud-sync): use its body as primary content. Apply terminology corrections; in Obsidian mode also resolve all participant/project names to `[[Name]]`. Save from `templates/meeting-note.template.md`. Do not regenerate a summary the Plaud note already covers.
- **No Plaud note** (manual drop or fetch failed): generate the summary from the transcript.
- The body summarizes the meeting; it does not restate any attendee's role, team, or history (Obsidian: wikilink instead, per `_conventions.md` → Linking and deduplication).

**Raw transcript:** save to the mode's transcript path, keeping original timestamps and speaker labels.

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

Push as `add` operations to the live artifact per the procedure in CLAUDE.md → Action items and `workflows/action-items.md`. Never write `inbox/action-items.md`.

Per `add` op:
- `item.date` = meeting/source date (when the item originated)
- `item.created` = today (`YYYY-MM-DD`)
- `item.from` = meeting name or context
- `item.subject` = short title
- `item.actionNeeded` = full description
- `item.due` = `ASAP`, `Soon`, `This week`, `TBD`, or `YYYY-MM-DD`
- `item.lore` = `"Y"` if Lore could plausibly do or advance it from inside the workspace, else `""`
- `item.specialist` = `"Y"` if a sibling specialist agent (e.g., Sigil) could pick it up autonomously, else `""`
- `item.notes` = blank unless the transcript gives notes-worthy context

Dedup is authoritative on `subject + from` (normalized): the artifact no-ops a duplicate `add`. When new context adds real value to an existing item, emit an `update` op instead of a duplicate `add` and report it:
  ```
  Consolidated: "[Proposed item]" → updated existing item "[Existing Subject]" with [new context].
  ```
After pushing, verify per `_conventions.md` → Verification loops (confirm the build succeeded, report the op count) and surface every operation in the Output Summary.

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
(Filesystem paths shown; in Obsidian mode substitute `Lore/Meetings/`, `Lore/Transcripts/`, `Lore/People/`, `Lore/Decisions/`.)
- meetings/notes/{date}-{meeting-name}.md - Meeting summary created
- meetings/transcripts/{date}-{meeting-name}.md - Raw transcript saved
- team/{person}.md - Added observations
- stakeholders/{person}.md - Added observations
- Action items artifact - Pushed [N] operations ([X] add, [Y] update, [Z] complete)
- decisions/log.md - Added decision on [topic]

### Your Action Items (pushed to the artifact)
- [ ] [Action 1] - Due: [date/TBD]
- [ ] [Action 2] - Due: [date/TBD]

**Consolidated into existing items** (only if any):
- Consolidated: "[Proposed item]" → updated existing item "[Existing Subject]" with [new context]

(The artifact dedupes `add` ops on subject + from, so exact duplicates are silently no-oped.)

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

Transcript processed and archived.
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
