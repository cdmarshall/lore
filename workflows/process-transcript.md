# Process Meeting Transcript

Extract insights from meeting transcripts (especially Plaud AI exports) and update relevant files.

## Input

**How to invoke**, tell the agent one of the following:
- "Process any new transcripts", check `meetings/transcripts/` for unprocessed files
- "Process [filename]", process a specific transcript file
- "Process this transcript: [Meeting context]" then paste the content, use when pasting a transcript directly

## Storage Mode

This workflow operates differently depending on whether Obsidian mode is active (see `CLAUDE.md` → Obsidian Detection). Both modes follow the same extraction logic in sections 1–4; the difference is in section 5 (Update Files), where the targets diverge:

- **Filesystem mode**: writes meeting notes to `meetings/notes/`, observations into `team/*.md` and `stakeholders/*.md`, decisions to `decisions/log.md`. See "Section 5, Filesystem Mode" below.
- **Obsidian mode**: writes meeting notes into the vault under `Lore/Meetings/`, observations into the person's vault note via `obsidian_patch_note`, decisions as one-note-per-decision under `Lore/Decisions/`. Cross-references use wikilinks. See "Section 5, Obsidian Mode" below.

Both modes push the user's action items to the live artifact identically. The action-items hard rule from `CLAUDE.md` applies in both modes.

## Instructions

### 0. Identify the User in the Transcript

**IMPORTANT**: The user (you, the agent's principal) is named in `context.md` under the **Role** section. When their name appears as a speaker in the transcript, that's the user. Anything they said or committed to belongs to them, don't create observations about the user themselves.

### 1. Check for New Transcripts

**If no arguments provided, check for unprocessed files:**

1. List files in `meetings/transcripts/` directory
2. Compare against `meetings/transcripts/.processed` (list of already-processed filenames)
3. If new files exist, report them and ask which to process (or process all)

**File naming convention:**
- Recommended format: `YYYY-MM-DD - Meeting Title.md` or `.txt`
- Extract date and meeting name from filename when possible

**After processing each file:**
1. Add filename to `meetings/transcripts/.processed`
2. Optionally move to `meetings/transcripts/archive/` if user prefers

### 2. Identify Participants

**Match speakers to known people using `context.md` and the existing files:**

- The user's name is in `context.md` under **Role**.
- Direct reports are listed in `context.md` under **My Team** and have profiles in `team/*.md`.
- Key stakeholders are listed in `context.md` under **Key Stakeholders** and have profiles in `stakeholders/*.md`.

**Unknown participants:**
- Note them in the summary
- Ask the user: "Should I create a stakeholder file for [Name]?"
- If yes, create `stakeholders/{firstname-lastname}.md` from `templates/stakeholder.template.md`

### 3. Extract Information

**For each identified person (except the user), extract:**

**Projects & Initiatives**
- What are they working on?
- What updates did they share?
- Any blockers or dependencies mentioned?
- Timeline or deadline references?

**Wins & Concerns**
- Positive updates, accomplishments, excitement
- Frustrations, concerns, stress indicators
- Things going well vs. struggling

**Communication Patterns**
- How did they engage? (dominant, quiet, collaborative)
- Any notable interactions or dynamics?

**Decisions Made**
- Any decisions reached in this meeting
- Context and rationale if discussed

**Action Items**
- Commitments THEY made (not the user)
- Requests made of them
- Follow-ups they need to handle

**For the user:**
- Extract their action items and commitments
- These will be pushed to the live action items artifact as `add` operations. **Do not** write to `inbox/action-items.md` (see `workflows/action-items.md`).

### 4. Identify and Update Projects

**Look for mentions of projects, initiatives, or ongoing work** named in the transcript. Cross-reference against the Active Initiatives table in `context.md`.

**For each project mentioned:**

- **If a project file exists** (`projects/[slug].md` in filesystem mode; `Projects/[Name].md` in Obsidian mode): append a dated status block under `## Current Phase` with any meaningful updates from the transcript (decisions reached, blockers surfaced, phase progress, next steps). Use `obsidian_patch_note` in Obsidian mode.
  ```markdown
  **YYYY-MM-DD:**
  - [Update from this meeting]
  ```
- **If no project file exists yet** for a recognized initiative: create one using `templates/project.template.md`, filling in what's known from the transcript and `context.md`. Ask the user to confirm before creating.
- **If the initiative is brand new** (not in `context.md`): note it in the meeting summary and ask the user whether to add it to `context.md` Active Initiatives and create a project file.

Do not create or update `context.md` Active Initiatives rows automatically; prompt the user for new entries.

### 5. Update Files

Branch on storage mode (see "Storage Mode" at the top of this file).

#### Section 5, Filesystem Mode

**For team members and stakeholders with existing files:**
- Add observations under the appropriate Observations subsection
- Prefix entries with the meeting date (YYYY-MM-DD)
- Append to existing content, don't overwrite
- Use this format:
  ```markdown
  **YYYY-MM-DD - [Meeting context]:**
  - [Observation 1]
  - [Observation 2]
  ```

**For decisions:**
- Add significant decisions to `decisions/log.md` using the format from `templates/decision-log-entry.template.md`

**For meeting notes:**
- **If a Plaud note is available** (fetched via `mcp__plaud__get_note` during plaud-sync): use its body as the primary content. Apply terminology corrections from `context.md`, then save to `meetings/notes/{date}-{meeting-name}.md` using the format from `templates/meeting-note.template.md`. Do not regenerate a summary the Plaud note already covers.
- **If no Plaud note is available** (transcript was dropped in manually or Plaud note fetch failed): generate the summary from the transcript as before.

**Save raw transcript:**
- Save to `meetings/transcripts/{date}-{meeting-name}.md`
- Keep original format (timestamps and speaker labels)

#### Section 5, Obsidian Mode

**Path resolution:** all vault paths are under the configured Lore subfolder (default `Lore/`). If the user has overridden the subfolder name in `context.md` under "Notes for Lore" → "Vault Configuration" (e.g., `Lore - Rate/`), substitute that everywhere `Lore/` appears below.

**For each identified person (existing vault note):**
- Use `obsidian_search_notes` to locate the person's note. Expected location: `Lore/People/<Full Name>.md`.
- If the note exists, append observations under the `## Observations` heading via `obsidian_patch_note` with `target: {"type": "path", "path": "Lore/People/Jane Doe.md"}, section: {"type": "heading", "target": "Observations"}, operation: "append"`. Use `patchOptions: {createTargetIfMissing: true}` if the heading may not yet exist. Format:
  ```markdown
  **YYYY-MM-DD, [[YYYY-MM-DD <kind> <subject>]]:**
  - [Observation 1]
  - [Observation 2]
  ```
  The wikilink in the entry header points back to the meeting note created below, so the observation timeline naturally backlinks to the meeting.
- If the note doesn't exist for someone who's a known direct report or stakeholder (per `context.md`), create it from `templates/team-member.template.md` or `templates/stakeholder.template.md` translated into the vault (frontmatter applied, tag set, body sections preserved). Save to `Lore/People/<Full Name>.md`.

**For unknown participants:**
- Same flow as filesystem mode (ask user before creating). On confirmation, create `Lore/People/<Full Name>.md` from the stakeholder template translated into the vault, with frontmatter `type: person, role: stakeholder/external` (or whatever the user specifies), plus tag `#person/stakeholder/external`.

**For decisions:**
- One note per decision under `Lore/Decisions/<YYYY-MM-DD> <Short Title>.md`, using `templates/decision-log-entry.template.md` translated into the vault. Frontmatter:
  ```yaml
  type: decision
  date: YYYY-MM-DD
  status: active
  owner: "[[Owner Name]]"
  projects: ["[[Project Name]]"]
  ```
  Tag `#decision/active`. Body wikilinks every person and project involved.
- Do **not** append to `decisions/log.md` in Obsidian mode. The vault is canonical for decisions. (The filesystem `decisions/log.md` remains untouched if it exists from prior sessions; it's not used as a source of truth in Obsidian mode.)

**For meeting notes:**
- **If a Plaud note is available** (fetched via `mcp__plaud__get_note` during plaud-sync): use its body as the primary content. Apply wikilinks (resolve all participant and project names to `[[Name]]` form), apply terminology corrections from `context.md`, then save to `Lore/Meetings/<YYYY-MM-DD> <kind> <subject>.md` with the frontmatter below. Do not regenerate a summary the Plaud note already covers.
- **If no Plaud note is available**: generate the summary from the transcript as before.
- Save to `Lore/Meetings/<YYYY-MM-DD> <kind> <subject>.md`, using `templates/meeting-note.template.md` translated into the vault. Frontmatter:
  ```yaml
  type: meeting
  kind: 1on1 | staff | roundtable | decision | external
  date: YYYY-MM-DD
  attendees: ["[[Name1]]", "[[Name2]]"]
  related_projects: ["[[Project Name]]"]
  ```
  Tag with the appropriate `#meeting/<kind>` tag.
- The body summarizes the meeting. It does **not** restate any attendee's role, team, or history. Use wikilinks. The reader can follow the link to the person's note for that context.
- Save the raw transcript to `Lore/Transcripts/<YYYY-MM-DD> <kind> <subject>.md` (keep original timestamps and speaker labels).

**Tracking files:**
- `meetings/transcripts/.processed` and `meetings/transcripts/.plaud-processed` still live in the workspace repo (not in the vault). Append to them as in filesystem mode. Obsidian ignores dotfiles; keeping them in the repo preserves the existing tracking semantics.

#### Section 5, Both Modes: For the user's action items
- **Push as `add` operations to the live artifact.** Build one `add` operation per new action item, then push via the procedure in `workflows/action-items.md` → "Procedure for agent-driven changes." Do NOT write to `inbox/action-items.md`.
- For each `add` op:
  - `item.date` = meeting/source date (the date the item originated)
  - `item.created` = today's date (`YYYY-MM-DD`)
  - `item.from` = meeting name or context
  - `item.subject` = short title
  - `item.actionNeeded` = full description of what needs to happen
  - `item.due` = `ASAP`, `Soon`, `This week`, `TBD`, or `YYYY-MM-DD`
  - `item.lore` = `"Y"` if Lore could plausibly do or substantially advance the item from inside the workspace, else `""`
  - `item.specialist` = `"Y"` if a sibling specialist agent (e.g., Sigil) could pick it up autonomously, else `""`
  - `item.notes` = blank unless the transcript provides notes-worthy context
- **Dedup is handled by the artifact** on `subject + from` (normalized). The artifact will no-op an `add` if the key already exists. For consolidation (the new context adds real value to an existing item), emit an `update` op on the existing item instead of a duplicate `add`, and report it in the summary:
  ```
  Consolidated: "[Proposed item]" → updated existing item "[Existing Subject]" with [new context].
  ```
- After pushing, surface every operation to the user in the Output Summary so they can verify (the artifact's bootstrap toast also confirms how many ops applied).

### 6. Output Summary

After processing, provide:

```markdown
## Meeting Processed: [Date] - [Meeting Name]

### Summary
[2-3 sentence overview of the meeting]

### Participants
- **You** (the user)
- [Other attendee 1] - [Known team member / Known stakeholder / New]
- [Other attendee 2]

### Files Updated
(Filesystem mode paths shown; in Obsidian mode substitute `Lore/Meetings/`, `Lore/Transcripts/`, `Lore/People/`, `Lore/Decisions/`.)
- meetings/notes/{date}-{meeting-name}.md - Meeting summary created
- meetings/transcripts/{date}-{meeting-name}.md - Raw transcript saved
- team/{person}.md - Added observations
- stakeholders/{person}.md - Added observations
- Action items artifact - Pushed [N] operations ([X] add, [Y] update, [Z] complete)
- decisions/log.md - Added decision on [topic]

### Your Action Items (pushed to the artifact)
- [ ] [Action 1] - Due: [date/TBD]
- [ ] [Action 2] - Due: [date/TBD]

**Consolidated into existing items** (only include if any):
- Consolidated: "[Proposed item]" → updated existing item "[Existing Subject]" with [new context]

(The artifact also dedupes `add` ops authoritatively on subject + from, so any exact duplicates are silently no-oped.)

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

- **The user is named in `context.md`**, don't create observations about them.
- When uncertain if something is noteworthy, err on the side of capturing it.
- Personal observations (mood, engagement level) go in Observations, not 1:1 Notes.
- Look for patterns across meetings over time.
- Flag anything that might indicate someone needs support.
- For Plaud transcripts: speaker labels are consistent, timestamps can be ignored for analysis.
- If the meeting involves external parties (customers, partners, vendors), note the business context.

## Adding Transcripts

**Option 1: Drop files in the folder**
```
meetings/transcripts/
```
Recommended filename format: `YYYY-MM-DD - Meeting Title.md`

**Option 2: Paste directly**
Tell the agent "Process this transcript: [Meeting context]" and paste the transcript content (with timestamps and speaker labels).

**Option 3: Let the agent check for new files**
Say "Process any new transcripts", the agent will check `meetings/transcripts/` for unprocessed files.

## Plaud AI Specifics

Plaud transcripts have this format:
```
00:00:01 Speaker Name
Transcript text here...

00:00:27 Other Speaker
More text...
```

When processing:
- Extract speaker names from label lines
- Timestamps help with context but aren't critical for analysis
- Speaker labels are consistent throughout
- Multiple lines can belong to the same speaker before the next timestamp
