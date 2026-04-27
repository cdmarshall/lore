# Morning Sync

Start your day with a briefing on emails, calendar, and priorities.

> **Note**: This workflow operates on email and calendar content the user provides manually (paste, screenshot, or summary). Live fetching is not built in; if the user wants automation, they can wire up an MCP connector and the workflow logic will adapt naturally.

## Input

**Optional modifiers** — specify one when asking for a morning sync:
- "emails only" — just process emails
- "calendar only" — just show calendar
- "week" / "full week" — show calendar for the full week ahead
- (nothing specified) — full sync: emails + today's calendar + priorities

## Instructions

### 1. Get Email and Calendar Content

Ask the user to paste or describe:
- Their unread emails (or a summary of their inbox).
- Today's calendar (or the full week, if requested).

If they have an MCP connector for email or calendar, use it. Otherwise, work from what they provide.

### 2. Process Emails

**For each email, extract:**
- **Action items**: Requests, deadlines, decisions needed
- **FYI items**: Updates that don't require action
- **Team mentions**: Anything about direct reports listed in `context.md`
- **Stakeholder items**: Messages from/about key stakeholders listed in `context.md`

### 3. Process Calendar

**For each meeting, note:**
- Prep needed (1:1s, stakeholder meetings)
- Conflicts or back-to-back meetings
- Meetings with team members (cross-reference with their Observations in `team/`)

**OOO events:** If `context.md` notes any shared team-OOO calendars, treat events with only those calendars as attendees as OOO markers, not actual meetings. Note them for awareness but don't include in prep.

### 4. Check Tracked Action Items

Read `inbox/action-items.md` and surface any items that are due today or overdue.

### 5. Check Current Priorities

Read `context.md` for current priorities and active initiatives.

### 6. Generate Briefing

Output a structured morning briefing:

```markdown
# Morning Sync - [Date]

## Today's Calendar
| Time | Meeting | Prep Needed |
|------|---------|-------------|
| 9:00 AM | 1:1 with [Name] | Review their recent observations |
| 10:30 AM | [Meeting] | [Prep, if any] |

## Tracked Action Items (from inbox/action-items.md)
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
Based on your priorities and what's come in:
1. [Top priority item]
2. [Second priority]
3. [Third priority]
```

### 7. Update Team Observations (if relevant)

If emails contain notable information about team members:
- Update their `team/{name}.md` Observations section.
- Mention this in the briefing output.

## Tips

- Run this first thing in the morning.
- For 1:1 prep, cross-reference the person's Observations section.
- Flag anything urgent that might change the day's priorities.
- If an email thread is complex, offer to summarize it separately.
