# Morning Sync

Start the day with a briefing on emails, calendar, and priorities.

> Operates on email/calendar content the user provides manually (paste, screenshot, summary). No live fetch by default. Use an MCP connector if available; otherwise work from what's provided.

## Input

**Optional modifiers**, specify one when asking for a morning sync:
- "emails only": just process emails
- "calendar only": just show calendar
- "week" / "full week": show calendar for the full week ahead
- (nothing specified): full sync, emails + today's calendar + priorities

## Instructions

### 1. Get email and calendar content

If they have an MCP connector for email or calendar, use it. Otherwise, ask the user to paste or describe unread emails (or an inbox summary) and today's calendar (or the full week, if requested).

### 2. Process emails

Extract per email:
- **Action items**: requests, deadlines, decisions needed
- **FYI items**: updates needing no action
- **Team mentions**: anything about direct reports in `context.md`
- **Stakeholder items**: messages from/about stakeholders in `context.md`

### 3. Process calendar

Note per meeting:
- Prep needed (1:1s, stakeholder meetings)
- Conflicts or back-to-back meetings
- Meetings with team members (cross-reference their Observations in `team/`)

OOO events: `CLAUDE.md` → Key behaviors. Note for awareness; don't include in prep.

### 4. Check tracked action items

Read path: `CLAUDE.md` → Session start, step 4. If `inbox/action-items.snapshot.md` is present, parse its `## Active` table and surface items due today or overdue; note the file's mtime for freshness. If no snapshot exists, point the user at the live action items artifact and remind them they can drop a fresh snapshot for tomorrow's briefing.

### 5. Check current priorities and project status

Read `context.md` for priorities and active initiatives. For each, check for a project file (storage mode: `_conventions.md` → Storage-mode branching): filesystem mode `projects/[slug].md`, Obsidian mode a matching note under `Projects/`. If found, pull `## Current Phase` for a one-liner status in the briefing's "Suggested Focus" block. Otherwise use the `context.md` notes column.

### 6. Generate briefing

```markdown
# Morning Sync - [Date]

## Today's Calendar
| Time | Meeting | Prep Needed |
|------|---------|-------------|
| 9:00 AM | 1:1 with [Name] | Review their recent observations |
| 10:30 AM | [Meeting] | [Prep, if any] |

## Tracked Action Items
[If a snapshot is present, list due-today and overdue items and note its age. Otherwise: "No fresh snapshot available. Click Download snapshot in your action items artifact and save to inbox/action-items.snapshot.md for tomorrow's briefing."]
- [ ] **[Sender]**: [Action needed] - due [date]

## New Action Items from Email
- [ ] **[Sender]**: Brief description of what's needed (deadline if any)

## FYI - No Action Needed
- **[Sender]**: Summary of the update
- **[Sender]**: Another FYI

## Team Updates
- **[Direct report 1]**: [Any emails from/about them]
- **[Direct report 2]**: [Any emails from/about them]

## Prep Notes
- **1:1 with [Name]**: Recent observations suggest [X], consider discussing [Y]
- **Stakeholder meeting**: [Any relevant context]

## Suggested Focus for Today
1. [Top priority item]
2. [Second priority]
3. [Third priority]
```

### 7. Update team observations (if relevant)

If emails contain notable information about team members, update `team/{name}.md` Observations and mention it in the briefing.

## Tips

- Run first thing in the morning.
- For 1:1 prep, cross-reference the person's Observations section.
- Flag anything urgent enough to change the day's priorities.
- Offer to summarize a complex email thread separately.

All output follows VOICE.md.
