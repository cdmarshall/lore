# Email Triage

Process the user's inbox one email at a time with clear actions.

> **Note**: This workflow operates on email content the user provides manually (paste, summary, or screenshot). Live fetching, replying, archiving, and snoozing are not built in by default. If the user has an MCP connector for email, use it; otherwise, the agent describes the action and the user takes it in their email client.

## Input

**Optional modifiers** — specify one when asking for email triage:
- "unread" — only process unread emails (default)
- "all" — process all recent emails
- "flagged" — review flagged/action items
- (nothing specified) — process unread emails

## Instructions

### 1. Get Email Content

Ask the user to paste or summarize the emails they want to triage. If they have an MCP connector that exposes their inbox, use it.

### 2. Process Each Email

For each email, present a summary and ask what to do.

**Email Summary Format:**
```
**From:** [Sender]
**Subject:** [Subject]
**Received:** [Date/Time]
**Preview:** [First 2-3 sentences or key points]
```

**Action Options:**

| Action | Description |
|--------|-------------|
| **Archive** | Done with this — move out of inbox |
| **Respond** | Write a reply (the agent helps format it) |
| **Snooze** | Remind the user about this later |
| **Action Item** | Flag it and track for follow-up |
| **Delegate** | Forward to a direct report listed in `context.md` |
| **Quick Reply** | Send a brief acknowledgment |
| **Skip** | Leave in inbox, move to next email |

### 3. Handle Each Action

#### Archive
Confirm the user wants to archive. They can do this in their email client; if an MCP connector is available, the agent can do it directly.

#### Respond
1. Ask: "What would you like to say? (rough notes are fine)"
2. Take their rough input and format it professionally.
3. Show the formatted response and ask for approval.
4. The user sends it from their email client (or via an MCP connector if available).
5. After sending, ask if they want to archive it.

#### Snooze
Ask: "When should I remind you?" with options like:
- Tomorrow 9am
- Monday 9am
- In 2 hours
- Next week
- Custom (let them specify)

The user sets the reminder in their preferred system (Reminders app, calendar, task tracker). If a reminder MCP is available, the agent can create it.

#### Action Item
1. Ask: "What action is needed?" (brief description)
2. Ask: "When is this due?" (optional)
3. Add to `inbox/action-items.md`:
```markdown
| [Today's Date] | [Sender] | [Subject] | [Action needed] | [Due date] |
```

#### Delegate
1. Ask: "Who should handle this?" — show the direct reports listed in `context.md` as options, plus "Other (specify email)"
2. Ask: "Any context to add?" (optional message)
3. Help draft a forward message; the user sends it from their email client.

#### Quick Reply
Offer templates:
1. **Acknowledged**: "Thanks for sending this. I'll review and follow up."
2. **Following up**: "Following up on this — any updates?"
3. **Received**: "Got it, thanks!"
4. **Custom**: Ask what they want to say.

### 4. Progress Summary

After processing all emails (or the user says "done"), provide a summary:

```markdown
## Triage Complete

**Processed:** X emails

| Action | Count |
|--------|-------|
| Archived | X |
| Responded | X |
| Snoozed | X |
| Action Items | X |
| Delegated | X |
| Skipped | X |

### New Action Items
- [ ] [Action item 1]
- [ ] [Action item 2]

### Delegated Items
- Forwarded "[Subject]" to [direct report] for [reason]
```

## Tips

- Process in order of importance if you can identify urgent/VIP senders.
- Cross-reference senders against stakeholders in `context.md`.
- If an email thread is complex, offer to summarize it before asking for action.
- For responses, match the tone of the original email.
- If user seems overwhelmed, offer to batch archive FYI/newsletter emails.

## Quick Commands During Triage

The user can say:
- "archive all newsletters" — Batch archive matching emails.
- "skip the rest" — Stop processing, leave remaining in inbox.
- "show action items" — Display current action items list.
- "done" — End triage and show summary.
