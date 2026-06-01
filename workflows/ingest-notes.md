# Ingest Notes

Process raw, unstructured notes, typed, pasted from OneNote, or photos of handwritten notes, and route them into the right files with the right structure.

## When to use this workflow

- "I have some notes to process"
- "Ingest these notes" / "Process my notes"
- User pastes or uploads raw, unstructured notes (not a formal transcript)
- User uploads a photo of handwritten notes or a whiteboard

---

## Step 0: Receive the input

Accept notes in any of these forms:
- **Pasted text**, user pastes content directly into the chat
- **Image/photo**, handwritten notes, whiteboard, sticky notes (read visually)
- **File reference**, user names a file; read it from `inbox/documents/` or any path they specify

If the user hasn't provided the notes yet, ask them to paste or share them before proceeding.

Once you have the notes, do a quick silent read to understand the content. Use what you learn to pre-fill your best guesses for the questions below, you'll present them as the recommended option.

---

## Step 1: Clarifying questions (one at a time, using AskUserQuestion)

Ask the following questions in sequence. Use the `AskUserQuestion` tool for each one, this renders clickable answer options with a custom-response fallback. Do **not** ask multiple questions at once.

**Skip a question** if the answer is already clear from the notes themselves (e.g., if the notes say "1:1 with Marcus" you don't need to ask who was involved). In that case, note your interpretation inline ("Looks like this is a 1:1 with Marcus, I'll use that") and move on.

---

### Question 1: What kind of notes are these?

Present the most likely type as the first option based on your read of the content.

Options (tailor order to what you observed):
- Meeting / 1:1 notes
- Action items / to-dos
- Brainstorm / ideas
- Personal reflection or journal entry
- Something else (I'll describe it)

---

### Question 2: When are these from?

Compute suggested dates dynamically from today's date. If the notes contain a date reference (e.g., "May 5th" or "yesterday's standup"), skip this question and note the date you're using.

Options:
- Today (YYYY-MM-DD)
- Yesterday (YYYY-MM-DD)
- [Two days ago] (YYYY-MM-DD)
- A different date (I'll type it)

---

### Question 3 (Meeting / 1:1 notes only): Who was involved?

Read `context.md` to get the user's team members and key stakeholders. List known people as clickable options. If the meeting involved multiple people, the user can select the primary person or choose "Multiple people."

Options (generate dynamically from `team/` and `stakeholders/` files):
- [Name from team/]
- [Name from stakeholders/]
- ... (all known people)
- Multiple people (I'll describe)
- Someone new (not in my files yet)
- Just me (solo notes)

---

### Question 4: What should I do with these?

Offer a recommended default based on the note type. Mark it clearly as the recommendation.

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

Once you have the answers, process accordingly. Follow the relevant conventions from the existing workflow files.

**Branch on storage mode** (see `CLAUDE.md` → Obsidian Detection):

**Filesystem mode:**
- **Meeting notes** → `meetings/notes/YYYY-MM-DD-[slug].md` using `templates/meeting-note.template.md`
- **Action items** → push as `add` operations to the live artifact (see `workflows/action-items.md`). **Never write to `inbox/action-items.md`**.
- **Profile updates** → the relevant `team/` or `stakeholders/` file (append, never overwrite)
- **Project updates** → if the notes reference an active project, append a dated status block to `projects/[slug].md` under `## Current Phase`. If no project file exists yet for a recognized initiative, offer to create one from `templates/project.template.md`.
- **Reference docs / ideas / brainstorms** → `outbox/YYYY-MM-DD-[slug].md`
- **Decisions** → `decisions/log.md` if any clear decision is captured

**Obsidian mode:**
- **Meeting notes** → vault note `Meetings/YYYY-MM-DD <kind> <subject>.md` with proper frontmatter (`type: meeting`, `attendees`, `related_projects`). Use `mcp__obsidian__obsidian_append_content`.
- **Action items** → same as filesystem mode (artifact is canonical in both modes).
- **Profile updates** → use `obsidian_patch_content` to append under `## Observations` on the person's vault note. Use `target: "<Note Title>::Observations"` (e.g., `"Jane Doe::Observations"`). Bare heading names fail. Do not overwrite.
- **Project updates** → use `obsidian_patch_content` to append under `## Current Phase` on the relevant `Projects/` note. Use `target: "<Note Title>::Current Phase"` (e.g., `"Rate Connect::Current Phase"`).
- **Reference docs / ideas / brainstorms** → `outbox/YYYY-MM-DD-[slug].md` (filesystem outbox, not vault).
- **Decisions** → vault note `Decisions/YYYY-MM-DD <Title>.md` with `type: decision` frontmatter.

The artifact dedupes `add` ops on `subject + from`; for cases where the new note adds real context to an existing item, emit an `update` op instead of a duplicate `add`.

### Handling unknown people

If the notes mention someone not in `team/` or `stakeholders/`, **pause and ask before creating anything** for them:

> "I see a reference to **[Name]**, I don't have a profile for them. What should I do?"
>
> Options:
> - Create a stakeholder profile for them
> - Just mention them in the meeting note (no profile)
> - They're not important, skip them
> - I'll tell you more about who they are

Do this for each unknown person, one at a time.

### Lightly opinionated defaults

Apply these without asking, unless the user's answers override them:

- If action items are found in any note type, offer to push them to the live artifact as `add` operations at the end (don't silently push, confirm once in the output summary)
- If a decision is clearly stated ("we decided to…"), flag it for `decisions/log.md`
- If the notes are clearly about a known team member or stakeholder, offer to add relevant observations to their profile
- Use today as the date if none was provided or inferred

### Terminology corrections

If `context.md` includes a `## Terminology & Corrections` section, silently apply those corrections to all output.

---

## Step 3: Output summary

After processing, provide a concise summary of what was done:

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

Sign off meeting notes and brainstorm docs with `— 📜 Lore` when you authored them. Do not sign action item rows or inline edits to the user's own files.

---

## Tips

- **Raw notes are messy, that's expected.** Don't require polish. If a note says "talk to Derek about the Q3 thing, maybe move it up?", that's enough to create an action item.
- **Abbreviations and shorthand are common.** Use context from `context.md` (team names, project names, terminology) to interpret them.
- **Ask about unknowns before writing.** It's better to pause and confirm than to create a file the user didn't want.
- **One question at a time.** The whole point of the AskUserQuestion flow is to avoid overwhelming the user. Keep it sequential.
- **If notes are an image**, use vision to read them. If handwriting is unclear, note the uncertain parts in the output summary and ask the user to clarify.
