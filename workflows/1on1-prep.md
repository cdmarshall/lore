# 1:1 Prep

Prepare for a one-on-one meeting with a team member or key stakeholder.

> **Trigger phrases**: "Help me prep for my 1:1 with [name]", "Prep for my 1:1", "What should I cover with [name]?"

---

## Instructions

### 1. Identify Who and When

From the user's request, determine:
- **Who** the 1:1 is with (match against `team/` files; use context.md if unclear)
- **When** it is (today or a specified date)

### 2. Read Source Files

Read in parallel:
- `team/[name].md` — their profile, active projects, recent observations, commitments
- `inbox/action-items.md` — check the `## Active` section for items sourced from or involving this person, and the `## Delegated` section for any items delegated to them

### 3. Pull Active Projects and Commitments

From `team/[name].md`:
- List every entry in their **Active Projects** section with status, last update, and next step. Flag any that haven't moved since the last 1:1.
- Note any commitments they made in the last 1:1 and whether they've been addressed.
- Note any commitments the user made that may need follow-up.

### 4. Surface Delegated Items (REQUIRED)

Scan `inbox/action-items.md` `## Delegated` for any rows where `Delegated To` matches this person's name. These are items the user handed off and needs to close the loop on.

If any exist, list them in the prep under **Follow up on delegated items** — show the subject, what the expected action was, and when it was delegated. This is the primary mechanism for following up on delegated work.

### 5. Identify Action Items to Discuss

From `inbox/action-items.md` `## Active`, surface:
- Any items sourced **From** this person that the user hasn't completed yet
- Any OVERDUE or ASAP items connected to their domain

### 6. Check for Feedback Signals

Scan `team/[name].md` Observations section for any recent patterns worth addressing:
- Development themes to reinforce or push on
- Concerns or blockers that have lingered
- Positive signals worth acknowledging

### 7. Generate Prep Brief

Output a structured prep note:

```markdown
# 1:1 Prep — [Name] — [Date]

## Active Projects
| Project | Status | Last Update | Next Step | Flag? |
|---------|--------|-------------|-----------|-------|
| [Project] | [Status] | [Date / note] | [What's next] | [Stale / On track] |

## Follow Up on Delegated Items
*(Items you handed off — close the loop)*
| Item | Delegated | Expected Action |
|------|-----------|----------------|
| [Subject] | [Date] | [Action Needed] |

*(Omit this section if nothing is delegated to this person)*

## Their Open Action Items (from your list)
- [Subject] — [brief note, source date]

## Suggested Agenda Topics
- [Topic based on project status, delegated items, or observations]
- [Development theme to check in on]
- [Feedback to give, if any]

## Observations to Update After Meeting
*(Remind yourself to update team/[name].md after this 1:1)*
```

---

## After the 1:1

Remind the user to:
- Update `team/[name].md` with key discussion points, new commitments, and observations
- Mark any delegated items as Done (if completed) or Re-open them (if back on the user's plate)
- Add any new action items to `inbox/action-items.md`

— 📜 Lore
