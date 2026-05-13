# Roundtable Prep

Prepare for a recurring team roundtable / leadership meeting.

> **Note**: This workflow assumes a weekly meeting where the user gives a status update, hears from each direct report, surfaces blockers, and assigns action items. Adjust the agenda to fit the actual meeting cadence and structure.

## Default Agenda (for reference)

1. **North Star & Leadership Check-In** (5 min) — Strategic alignment, top-down updates from leadership
2. **Roadmap Review, Active Project Updates, & Milestone Celebrations** (15 min) — Green/Yellow/Red health check, milestone celebrations, upcoming initiatives
3. **Team Round-Robin** (25 min) — Each team member: Recap / Focus / Blockers
4. **Parking Lot** (10 min) — Complex issues flagged during Round-Robin
5. **Action Items & Wrap-Up** (5 min) — Who unblocks whom, who schedules what

---

## Instructions

### 1. Read Source Files

Read the following files in parallel:
- `context.md` — current priorities, active initiatives, and the user's team list
- `strategy/roadmap.md` if it exists — current initiative statuses
- One file per direct report under `team/` — each team member's recent observations

For action items (completed-this-week, active blockers, delegated items), try the read paths in order:

1. **Check `inbox/action-items.snapshot.md`** (`bash ls inbox/action-items.snapshot.md`). If present, parse it once at the start of prep and use it for sections 2, 3, and 4. Primary path.
2. **Check `inbox/action-items-state.json`** (future-proof; rarely exists today). Same purpose, JSON shape.
3. **If neither file exists**, ask the user: *"Want roundtable prep to include this week's completed items, active blockers, and delegated follow-ups? If yes, click Download snapshot in your action items artifact and save the file to `inbox/action-items.snapshot.md` (or paste it here)."*
4. **If they decline**, skip sections that depend on action items state and leave placeholders.

Never read `inbox/action-items.md` (legacy backup, distinct from `action-items.snapshot.md`).

### 2. Identify This Week's Completed Items

If you have a view of state, scan the `completed` items for entries where `completed` falls in this week (current Mon-Fri). These form the **Milestone Celebrations** segment and the user's personal **Recap**.

If no view is available, leave the section as a placeholder: *"(Fill in from the action items artifact: items completed this week.)"*

### 3. Identify Active Blockers

If you have a view of state, scan the `active` items and surface:
- Any OVERDUE items (due date is in the past)
- Any items explicitly waiting on another person or team (notes / actionNeeded)
- Any items marked ASAP

These are candidates for the **Parking Lot**. If no view is available, add a placeholder.

### 4. Anticipate Team Round-Robin Updates

For each direct report (named in `context.md`), scan their `team/[name].md` file's recent Observations to infer likely:
- **Recap**: What they probably finished or progressed this week
- **Focus**: What they're likely heads-down on next week
- **Blockers**: Any known dependencies or blockers mentioned in observations

If you have a view of state, also scan the `delegated` items for any assigned to this person. Surface them as **Follow-up** prompts so the user can close the loop during the Round-Robin. If no view is available, add a placeholder line under each team member's Follow-up section.

Use hedged language (e.g., "likely to mention", "may flag") for the inferred parts — these are prompts to help the user listen and respond, not authoritative summaries.

### 5. Generate Prep Output

Output a structured prep brief:

```markdown
# Roundtable Prep — [Date]

## 1. North Star & Leadership Check-In
> Talking points for strategic framing:

- [Current priority 1 and relevant context]
- [Current priority 2 and relevant context]
- [Any top-down updates or org context worth flagging]

---

## 2. Roadmap Review & Project Health

| Initiative | Owner | Status | Notes |
|------------|-------|--------|-------|
| [Initiative] | [Owner] | Green / Yellow / Red | [Any scope or date shifts] |

**Milestone Celebrations this week:**
- [Completed item] — [brief note on outcome]

**Upcoming initiatives to introduce:**
- [Any new work entering the pipeline worth previewing]

---

## 3. Team Round-Robin

### You
- **Recap**: [Items completed this week, from the artifact snapshot if provided]
- **Focus**: [Top 1-2 active priorities for next week]
- **Blockers**: [Any items where you're waiting on someone]

### [Direct report 1]
- **Likely Recap**: [Inferred from observations]
- **Likely Focus**: [Inferred from current projects]
- **Watch for**: [Any blockers or dependencies to be ready to address]
- **Follow up on** *(delegated items)*: [List any items from `## Delegated` assigned to this person, with subject and when delegated — omit section if none]

### [Direct report 2]
- **Likely Recap**: [Inferred from observations]
- **Likely Focus**: [Inferred from current projects]
- **Watch for**: [Any blockers or dependencies to be ready to address]
- **Follow up on** *(delegated items)*: [List any items from `## Delegated` assigned to this person — omit section if none]

(Repeat for each direct report named in context.md)

---

## 4. Parking Lot — Items to Be Ready For

| Topic | Who | What's Needed |
|-------|-----|---------------|
| [Blocker or complex issue] | [Person] | [Decision / sync / unblock needed] |

---

## 5. Action Items & Wrap-Up

**Open items that may surface follow-up assignments:**
- [Overdue or escalated action items worth calling out]

**Suggested wrap-up framing:**
> [1-2 sentence suggestion for how to close the meeting — who's scheduling what, who's unblocking whom]
```

---

## Tips

- The Round-Robin section is for the user's prep — they're listening and facilitating, not reading these notes aloud.
- Parking Lot items should only go there if they genuinely need >2 min to resolve.
- If `strategy/roadmap.md` isn't populated, note that and skip the initiative table.
- Completed items with no resolution note can be listed with just the subject.
- Flag if any team member has a pattern of blockers that may need a dedicated sync.
