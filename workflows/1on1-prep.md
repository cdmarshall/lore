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
- `team/[name].md`, their profile, active projects, recent observations, commitments

For action items involving this person (sourced from them, delegated to them, etc.), try the read paths in order:

1. **Check `inbox/action-items.snapshot.md`** (`bash ls inbox/action-items.snapshot.md`). If present, parse its `## Active` and `## Delegated` sections and use them for sections 4 and 5. This is the primary path.
2. **Check `inbox/action-items-state.json`** (future-proof; rarely exists today). Same logic against its `active` and `delegated` arrays.
3. **If neither file exists, ask the user**: "Want me to pull active and delegated items involving [Name]? If yes, click Download snapshot in your action items artifact and save the file to `inbox/action-items.snapshot.md` (or paste it here)."
4. **If they decline**, produce a prep brief from `team/[name].md` only. Note the gap explicitly so the user can fill it in from the artifact themselves.

Never read `inbox/action-items.md` (legacy backup, distinct from `action-items.snapshot.md`).

### 3. Pull Active Projects and Commitments

From `team/[name].md`:
- List every entry in their **Active Projects** section with status, last update, and next step. Flag any that haven't moved since the last 1:1.
- Note any commitments they made in the last 1:1 and whether they've been addressed.
- Note any commitments the user made that may need follow-up.

### 4. Surface Delegated Items (REQUIRED)

If you have a view of state from step 2 (state file or snapshot), scan the delegated items for any where `delegatedTo` matches this person's name. These are items the user handed off and needs to close the loop on.

If any exist, list them in the prep under **Follow up on delegated items** with the subject, expected action, and delegation date. This is the primary mechanism for following up on delegated work.

If you don't have a view of state, add a placeholder: *"(Check the action items artifact for items delegated to [Name].)"*

### 5. Identify Action Items to Discuss

If you have a view of state, surface from the active items:
- Any items sourced **From** this person that the user hasn't completed yet
- Any OVERDUE or ASAP items connected to their domain

If you don't have a view of state, add a placeholder line in the prep brief.

### 6. Check for Feedback Signals

Scan `team/[name].md` Observations section for any recent patterns worth addressing:
- Development themes to reinforce or push on
- Concerns or blockers that have lingered
- Positive signals worth acknowledging

### 7. Generate Prep Brief

Output a structured prep note:

```markdown
# 1:1 Prep, [Name], [Date]

## Active Projects
| Project | Status | Last Update | Next Step | Flag? |
|---------|--------|-------------|-----------|-------|
| [Project] | [Status] | [Date / note] | [What's next] | [Stale / On track] |

## Follow Up on Delegated Items
*(Items you handed off, close the loop)*
| Item | Delegated | Expected Action |
|------|-----------|----------------|
| [Subject] | [Date] | [Action Needed] |

*(Omit this section if nothing is delegated to this person)*

## Their Open Action Items (from your list)
- [Subject], [brief note, source date]

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
- Mark any delegated items as Done (if completed) or Re-open them (if back on the user's plate) in the artifact
- Push any new action items to the artifact as `add` operations (see `workflows/action-items.md`)

— 📜 Lore
