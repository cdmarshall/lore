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
- Stale active projects from the most recent `outbox/vault-lint-*.md` report if one exists from the last 14 days (`bash ls outbox/vault-lint-*.md`, check the date in the filename); skip silently if none exists, so silent stalls surface in the Friday agenda.

**Sweep this week's agent sessions** per `_conventions.md` → Recap sourcing: Cowork sessions active Monday to Friday, and this week's rows of `inbox/cc-sessions/sessions.jsonl` for Claude Code. Much of the user's week happens in sessions rather than in Slack, Teams, or meeting notes, and a prep built without them undersells their own recap in section 3. If the digest is stale or missing, say so and offer the refresh command; do not let that half go silently uncounted. Feed what shipped into sections 2 and 3, and name the coverage in the prep's source line.

For action items (completed this week, active blockers, delegated items), query The Quest Log with ArtifactData (`workflows/action-items.md` → Reading current state) once at the start: `completed` items whose `completed` date falls Monday to Friday, `active` items that are overdue or ASAP, and every `delegated` item. Use them for sections 2-4. If the tracker can't be reached, say so in the prep's source line and leave placeholders.

Never read `inbox/action-items.md` (see CLAUDE.md → Key behaviors).

### 2. Identify This Week's Completed Items

From The Quest Log, scan `completed` items for entries where `completed` falls in this week (Mon-Fri). These feed **Milestone Celebrations** and the user's own **Recap**.

Tracker unreachable: placeholder, *"(Fill in from The Quest Log: items completed this week.)"*

### 3. Identify Active Blockers

From The Quest Log, scan `active` items for:
- OVERDUE items (due date in the past)
- Items explicitly waiting on another person or team (per notes)
- Items marked ASAP

Candidates for the **Parking Lot**. Tracker unreachable: placeholder.

### 4. Anticipate Team Round-Robin Updates

Check each direct report's profile note for a non-attendance flag (some people skip the roundtable) and leave anyone flagged out of the Team Round-Robin section entirely: no card, no placeholder. This is instance data and may change.

For each direct report (named in `context.md`) **who attends the roundtable**, scan `team/[name].md` recent Observations to infer:
- **Recap**: what they probably finished or progressed this week
- **Focus**: what they're likely heads-down on next week
- **Blockers**: known dependencies or blockers in observations

From The Quest Log, also scan `delegated` items assigned to this person and surface as **Follow-up** prompts so the user can close the loop live. Tracker unreachable: placeholder line under Follow-up.

Hedge the inferred parts ("likely to mention", "may flag"): prompts for the user to listen for, not authoritative summaries.

### 5. Generate Prep Output

**Deliverable: a styled HTML document** built from `templates/document.template.html` (kicker "Roundtable prep", title = the date or meeting name), written to `outbox/YYYY-MM-DD-roundtable-prep.html` and linked as the primary output. Compose the body from the template's block library; the markdown structure below defines content and order, not format. Map: talking points and agenda sections → sections with `checklist`s; project status → `table.doc`; parking-lot blockers → `callout`; framing lines to say out loud → `talk`. Only produce bare markdown if the user explicitly asks for it.

Content spec:

```markdown
# Roundtable Prep, [Date]

## 1. North Star & Leadership Check-In
> Talking points for strategic framing:

- [Current priority 1 and relevant context]
- [Current priority 2 and relevant context]
- [Any top-down updates or org context worth flagging]

> Leadership check-in points must be things the user would actually tell this team this week (launch timing, hiring status, priority shifts, who is out). Do not lift standing background from `context.md` (headcount against plan, org-wide context) into a talking point; it reads as filler and the user won't say it.

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
