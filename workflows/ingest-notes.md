# Ingest Notes

Process raw, unstructured notes (typed, pasted from OneNote, or photos of handwritten notes) and route them into the right files.

## When to use this workflow

- "I have some notes to process"
- "Ingest these notes" / "Process my notes"
- User pastes or uploads raw, unstructured notes (not a formal transcript)
- User uploads a photo of handwritten notes or a whiteboard

---

## Step 0: Receive the input

Accept notes in any form:
- **Pasted text** directly in the chat
- **Image/photo**: handwritten notes, whiteboard, sticky notes (read visually)
- **File reference**: read from `inbox/documents/` or any path the user specifies

If the notes aren't provided yet, ask for them before proceeding.

Silently read the notes first. Use what you learn to pre-fill best guesses for the questions below and present them as the recommended option.

---

## Step 1: Clarifying questions (one at a time, using AskUserQuestion)

Ask each question in sequence with `AskUserQuestion` (clickable options, custom-response fallback). Never ask multiple questions at once.

**Skip a question** if the notes already answer it (e.g., "1:1 with Marcus" answers who was involved). State your interpretation inline ("Looks like this is a 1:1 with Marcus, I'll use that") and move on.

---

### Question 1: What kind of notes are these?

List the most likely type first, based on your read.

Options (tailor order to what you observed):
- Meeting / 1:1 notes
- Action items / to-dos
- Brainstorm / ideas
- Personal reflection or journal entry
- Something else (I'll describe it)

---

### Question 2: When are these from?

Compute suggested dates from today's date. Notes already reference a date ("May 5th," "yesterday's standup"): skip this question, note the date used.

Options:
- Today (YYYY-MM-DD)
- Yesterday (YYYY-MM-DD)
- [Two days ago] (YYYY-MM-DD)
- A different date (I'll type it)

---

### Question 3 (Meeting / 1:1 notes only): Who was involved?

Read `context.md` for team members and key stakeholders; list them as clickable options. For multiple attendees, the user picks the primary person or "Multiple people."

Options (generate dynamically from `team/` and `stakeholders/` files):
- [Name from team/]
- [Name from stakeholders/]
- ... (all known people)
- Multiple people (I'll describe)
- Someone new (not in my files yet)
- Just me (solo notes)

---

### Question 4: What should I do with these?

Offer a recommended default based on note type, marked clearly.

**If Meeting / 1:1:**
- Create a meeting note + extract my action items *(recommended)*
- Create a meeting note only
- Extract action items only
- Update the person's profile / stakeholder file only
- All of the above
- Let me describe what I want

**If Action items / to-dos:**
- Add to my action items tracker *(recommended)*
- Save as a reference doc in outbox/
- Both

**If Brainstorm / ideas:**
- Save to outbox/ as a reference doc *(recommended)*
- Add relevant items as action items
- Both

**If Personal reflection / journal:**
- Save to outbox/ as a reference doc *(recommended)*
- I'll describe what I want

---

## Step 2: Process the notes

**Storage mode:** `_conventions.md` → Storage-mode branching. Legacy vault tool names (`write_note`, `edit_note`, etc.) map to native tools per `_conventions.md` → Vault access tooling.

**Filesystem mode:**
- **Meeting notes** → `meetings/notes/YYYY-MM-DD-[slug].md` using `templates/meeting-note.template.md`
- **Action items** → push as `add` operations to the live artifact (`workflows/action-items.md`). Never write to `inbox/action-items.md`.
- **Profile updates** → the relevant `team/` or `stakeholders/` file (append, never overwrite)
- **Project updates** → if the notes reference an active project, append a dated status block to `projects/[slug].md` under `## Current Phase`. No file yet for a recognized initiative: offer to create one from `templates/project.template.md`.
- **Reference docs / ideas / brainstorms** → `outbox/YYYY-MM-DD-[slug].md`
- **Decisions** → `decisions/log.md` if a clear decision is captured

**Obsidian mode:**
- **Meeting notes** → vault note `Meetings/YYYY-MM-DD <kind> <subject>.md`, frontmatter per `_conventions.md` → Frontmatter schemas (Meeting). `write_note(title: "YYYY-MM-DD <kind> <subject>", directory: "Meetings/", content: "...", metadata: {type: "meeting", ...})`.
- **Action items** → same as filesystem mode (artifact is canonical in both modes).
- **Profile updates** → `edit_note(identifier: "People/<Full Name>", operation: "find_replace", find_text: "<last observation line>", content: "<last observation line>\n<new observation>")`. No `## Observations` heading yet: `edit_note(operation: "append")` to add it. Never overwrite.
- **Project updates** → `edit_note(identifier: "Projects/<Name>", operation: "find_replace", find_text: "<last line of Current Phase section>", content: "<last line>\n<new content>")`.
- **Reference docs / ideas / brainstorms** → `outbox/YYYY-MM-DD-[slug].md` (filesystem outbox, not vault).
- **Decisions** → vault note `Decisions/YYYY-MM-DD <Title>.md`, frontmatter per `_conventions.md` → Frontmatter schemas (Decision).

The artifact dedupes `add` ops on `subject + from`. If a new note adds real context to an existing item, emit an `update` op instead of a duplicate `add`.

### Handling unknown people

Notes mention someone not in `team/` or `stakeholders/`: pause and ask before creating anything for them.

> "I see a reference to **[Name]**, I don't have a profile for them. What should I do?"
>
> Options:
> - Create a stakeholder profile for them
> - Just mention them in the meeting note (no profile)
> - They're not important, skip them
> - I'll tell you more about who they are

Do this for each unknown person, one at a time.

### Lightly opinionated defaults

Apply without asking, unless the user's answers override:

- Action items found in any note type: offer to push as `add` operations at the end (confirm once in the output summary, don't push silently)
- A decision is clearly stated ("we decided to…"): flag for `decisions/log.md` only if it passes the decision-log test (`_conventions.md` → Decision-log discipline); otherwise it stays in the note. Capture options considered when stated
- Notes clearly about a known team member or stakeholder: offer to add observations to their profile
- No date provided or inferred: use today

### Terminology corrections

Apply `context.md` terminology corrections and glossary maintenance per `_conventions.md` → Terminology and glossary. Surface flagged conflicts and proposed new entries in the output summary.

---

## Step 3: Output summary

Summarize what was done:

```
## Notes Processed

**Type:** [Meeting notes / Action items / Brainstorm / etc.]
**Date:** YYYY-MM-DD

### Files Created or Updated
- meetings/notes/YYYY-MM-DD-[name].md, meeting summary created
- Action items artifact, pushed [N] operations
- stakeholders/[name].md, observations appended
- decisions/log.md, [N] decision(s) logged
- outbox/YYYY-MM-DD-[slug].md, reference doc saved

### Action Items Added
- [ ] [Action 1], Due: [date/TBD]
- [ ] [Action 2], Due: [date/TBD]

### Consolidated into existing items
[Only include if any were consolidated, e.g. "Consolidated: 'X' into existing item 'Y' with new notes about Z"]

### Questions for you
[List any items that are ambiguous and need your input before they can be filed]
```

All output follows VOICE.md. Sign off meeting notes and brainstorm docs with `— 📜 Lore` when you authored them (per CLAUDE.md signet rule). Do not sign action item rows or inline edits to the user's own files.

---

## Tips

- **Raw notes are messy.** Don't require polish. "Talk to Derek about the Q3 thing, maybe move it up?" is enough to create an action item.
- **Interpret shorthand** using `context.md` (team names, project names, terminology).
- **Ask about unknowns before writing.** Pausing to confirm beats creating a file the user didn't want.
- **One question at a time,** sequential, no exceptions.
- **Notes as an image:** use vision to read them. Flag unclear handwriting in the output summary and ask the user to clarify.
