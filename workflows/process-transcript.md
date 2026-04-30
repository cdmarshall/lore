# Process Meeting Transcript

Extract insights from meeting transcripts (especially Plaud AI exports) and update relevant files.

## Input

**How to invoke** — tell the agent one of the following:
- "Process any new transcripts" — check `meetings/transcripts/` for unprocessed files
- "Process [filename]" — process a specific transcript file
- "Process this transcript: [Meeting context]" then paste the content — use when pasting a transcript directly

## Instructions

### 0. Identify the User in the Transcript

**IMPORTANT**: The user (you, the agent's principal) is named in `context.md` under the **Role** section. When their name appears as a speaker in the transcript, that's the user. Anything they said or committed to belongs to them — don't create observations about the user themselves.

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
- These will be added to `inbox/action-items.md`

### 4. Identify Projects/Initiatives

**Look for mentions of projects, initiatives, or ongoing work** named in the transcript.

**Ask the user:**
"I identified these projects/initiatives in the transcript:
- [Project 1]
- [Project 2]

Should I:
1. Track these as new initiatives in `context.md`?
2. Update existing project files?
3. Just note them in the meeting summary?"

### 5. Update Files

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

**For the user's action items:**
- **Duplicate check first (REQUIRED).** Before appending anything, follow the duplicate-check procedure in `workflows/action-items.md` → "Procedure for agent-driven changes," step 2. Compare each candidate against existing Active rows (and recently Completed/Archived rows) on Subject + Action Needed + From + Agent. Wording will differ; intent and ownership are what matter.
- If a candidate is a duplicate, do NOT append. Either skip it or consolidate the new context into the existing row's Notes / Action Needed.
- If a candidate is genuinely new, add to `inbox/action-items.md` under Active section. Format:
  ```
  | [Source date YYYY-MM-DD] | [Today YYYY-MM-DD] | [From/Meeting] | [Subject] | [Action Needed] | [Due Date or TBD] | [Agent Y/N/blank] | [Notes] |
  ```
  - First column (`Date`) is the meeting/source date — the date the item originated. For transcript processing, use the meeting date.
  - Second column (`Created`) is today's date — when the row was added to the list. Always populate; never leave blank.
- **Report all skip / consolidate decisions in the Output Summary** under "Your Action Items." Use the format defined in `workflows/action-items.md`:
  ```
  Skipped (duplicate): "[Proposed item]"
    → Matches existing row: YYYY-MM-DD | [From] | [Existing Subject]
    → Reasoning: [why it's the same item]
  ```

**For meeting notes:**
- Save comprehensive summary to `meetings/notes/{date}-{meeting-name}.md`
- Use the format from `templates/meeting-note.template.md`

**Save raw transcript:**
- Save to `meetings/transcripts/{date}-{meeting-name}.md`
- Keep original format (timestamps and speaker labels)

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
- meetings/notes/{date}-{meeting-name}.md - Meeting summary created
- meetings/transcripts/{date}-{meeting-name}.md - Raw transcript saved
- team/{person}.md - Added observations
- stakeholders/{person}.md - Added observations
- inbox/action-items.md - Added [N] action items
- decisions/log.md - Added decision on [topic]

### Your Action Items (Added to inbox/action-items.md)
- [ ] [Action 1] - Due: [date/TBD]
- [ ] [Action 2] - Due: [date/TBD]

**Skipped as duplicates / consolidated** (only include if any):
- Skipped (duplicate): "[Proposed item]"
  → Matches existing row: YYYY-MM-DD | [From] | [Existing Subject]
  → Reasoning: [why it's the same item]
- Consolidated: "[Proposed item]" → updated existing row "[Existing Subject]" Notes with [new context].

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

- **The user is named in `context.md`** — don't create observations about them.
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
Say "Process any new transcripts" — the agent will check `meetings/transcripts/` for unprocessed files.

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
