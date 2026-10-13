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

Read path: `CLAUDE.md` → Session start, step 5. Query The Quest Log with ArtifactData (`workflows/action-items.md` → Reading current state) for `active` items due today, overdue, or ASAP, and count what is waiting in triage. If the tracker can't be reached, say so in the briefing in one line and keep rendering; a briefing that refuses to render is worse than one with a labeled gap.

### 4b. Pick up yesterday's agent sessions

Per `_conventions.md` → Recap sourcing: yesterday's Cowork sessions, and yesterday's rows in `inbox/cc-sessions/sessions.jsonl` for Claude Code. Surface unfinished threads: a session that ended mid-task, an artifact built but not delivered, a decision left open. This is where "what was I in the middle of" gets answered. The briefing does not nag about a stale digest; it just says which populations it covered.

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
[Due-today, overdue, and ASAP items from The Quest Log, plus "N waiting in triage" if any. If the tracker couldn't be reached: "Couldn't reach The Quest Log this morning; open it directly for today's list."]
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
