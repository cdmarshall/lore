# Roundtable Prep

Prepare for a recurring team roundtable / leadership meeting.

> Assumes a weekly meeting: user status update, round-robin from each direct report, blockers, action items. Adjust the agenda to the actual cadence.

All output follows VOICE.md.

## Default Agenda (for reference)

1. **North Star & Leadership Check-In** (5 min), strategic alignment, top-down updates
2. **Roadmap Review, Active Project Updates, & Milestone Celebrations** (15 min), Green/Yellow/Red health check, milestone celebrations, upcoming initiatives
3. **Team Round-Robin** (25 min), each team member: Recap / Focus / Blockers
4. **Parking Lot** (10 min), complex issues flagged during Round-Robin
5. **Action Items & Wrap-Up** (5 min), who unblocks whom, who schedules what

---

## Instructions

### 1. Read Source Files

Storage mode: see `_conventions.md` → Storage-mode branching.

Read in parallel:
- `context.md`: priorities, active initiatives, team list
- `strategy/roadmap.md` if it exists
- Each active project file in `projects/` (filesystem mode) or `Projects/` vault notes (Obsidian mode): query for `status: active` via the dataview MCP tool, falling back to Grep per `_conventions.md` → Vault access tooling.
- One file per direct report under `team/`, recent observations

For action items (completed-this-week, active blockers, delegated items), try in order:

1. `bash ls inbox/action-items.snapshot.md`. If present, parse once at the start and use for sections 2-4. Primary path.
2. `inbox/action-items-state.json` if it exists (future-proof, rarely present today). Same shape, JSON.
3. If neither exists, ask: *"Want roundtable prep to include this week's completed items, active blockers, and delegated follow-ups? If yes, click Download snapshot in your action items artifact and save the file to `inbox/action-items.snapshot.md` (or paste it here)."*
4. If declined, skip the dependent sections; leave placeholders.

Never read `inbox/action-items.md` (see CLAUDE.md → Key behaviors).

### 2. Identify This Week's Completed Items

If you have a view of state, scan `completed` items for entries where `completed` falls in this week (Mon-Fri). These feed **Milestone Celebrations** and the user's own **Recap**.

No view: placeholder, *"(Fill in from the action items artifact: items completed this week.)"*

### 3. Identify Active Blockers

If you have a view of state, scan `active` items for:
- OVERDUE items (due date in the past)
- Items explicitly waiting on another person or team (notes / actionNeeded)
- Items marked ASAP

Candidates for the **Parking Lot**. No view: placeholder.

### 4. Anticipate Team Round-Robin Updates

For each direct report (named in `context.md`), scan `team/[name].md` recent Observations to infer:
- **Recap**: what they probably finished or progressed this week
- **Focus**: what they're likely heads-down on next week
- **Blockers**: known dependencies or blockers in observations

If you have a view of state, also scan `delegated` items assigned to this person and surface as **Follow-up** prompts so the user can close the loop live. No view: placeholder line under Follow-up.

Hedge the inferred parts ("likely to mention", "may flag"): prompts for the user to listen for, not authoritative summaries.

### 5. Generate Prep Output

```markdown
# Roundtable Prep, [Date]

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
- [Completed item], [brief note on outcome]

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
- **Follow up on** *(delegated items)*: [List any items from `## Delegated` assigned to this person, with subject and when delegated, omit section if none]

### [Direct report 2]
- **Likely Recap**: [Inferred from observations]
- **Likely Focus**: [Inferred from current projects]
- **Watch for**: [Any blockers or dependencies to be ready to address]
- **Follow up on** *(delegated items)*: [List any items from `## Delegated` assigned to this person, omit section if none]

(Repeat for each direct report named in context.md)

---

## 4. Parking Lot, Items to Be Ready For

| Topic | Who | What's Needed |
|-------|-----|---------------|
| [Blocker or complex issue] | [Person] | [Decision / sync / unblock needed] |

---

## 5. Action Items & Wrap-Up

**Open items that may surface follow-up assignments:**
- [Overdue or escalated action items worth calling out]

**Suggested wrap-up framing:**
> [1-2 sentence suggestion for how to close the meeting, who's scheduling what, who's unblocking whom]
```

---

## Tips

- Round-Robin section is prep for listening and facilitating, not a script to read aloud.
- Parking Lot only for items that genuinely need >2 min to resolve.
- If `strategy/roadmap.md` isn't populated, note that and skip the roadmap framing.
- Project Health table: prefer status from individual `projects/` files over `context.md`'s Active Initiatives table, project files are authoritative on phase and blockers.
- Completed items with no resolution note: list with just the subject.
- Flag if any team member has a pattern of blockers that may need a dedicated sync.
