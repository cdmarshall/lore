# Triage Config

> Operational config for `workflows/triage.md`. Created on first run; edit as your scope evolves.
> This file is gitignored. The committed template lives at `templates/triage-config.template.md`.

## Scope rules

- **Email**: uses the Email tier framework defined in `workflows/triage.md` and sender lists in `email-config.md`.
- **Slack and Teams** "needs attention" = DMs + @mentions + configured project channels + active threads I have posted in that have new replies. Threads with no new messages are skipped.
- Default look-back window when `inbox/.triage-last-run` is missing: 24 hours.
- **Brief windows scheduled**: <none | morning | afternoon | morning + afternoon>  (set by `workflows/triage.md` → Scheduling; with both windows the brief masthead reads "The <Weekday> Morning/Afternoon Herald", otherwise "The <Weekday> Herald")

## Slack

- **My Slack user ID**: <e.g. U0XXXXXXX>  (used for DM drafts and mention detection)
- **My Slack handle(s)**: <@firstname.lastname or display name used in mentions>

### Project channels to watch

> Channels tied to active initiatives. New messages here are in scope even without a direct mention.
> This is a self-updating watch-list, not a boundary: each run the workflow discovers active channels via activity search, triages any channel where you are mentioned or active even if it is not listed, and appends new ones here automatically (ambient-only channels are surfaced for you to confirm first).

| Channel name | Channel ID | Linked initiative |
|--------------|------------|-------------------|
| #example-channel | C0XXXXXXX | <initiative from context.md> |

### Slack channels to ignore

> High-noise channels to exclude even if mentioned (optional).

- <#channel-name>

## Teams

### Key people to watch

> DMs and @mentions from these people are always in scope.

| Name | Email |
|------|-------|
| <Name> | <email> |

### Teams scope notes

- <Any chats/teams to prioritize or exclude>

## Email

- Reuses `email-config.md` (sender tiers, automated sources, distribution lists).
- **Email source for this workflow**: Microsoft 365 connector (`outlook_email_search`), Inbox folder.
- Override tiers here only if they should differ from `email-config.md`.
- **Email client** (only matters when the mailbox is reachable both natively and through Front): `Front` (default) or `Outlook`. Each email is triaged and drafted in one place only.

## Front

| Inbox | ID | Role |
|-------|----|------|
| <My Inbox> | <inb_xxx> | Personal inbox; carries my mailbox. When it does, Front is the email client and the Outlook pass skips that mailbox (triage step 1b) |
| <Shared inbox> | <inb_xxx> | Shared: draft only what's assigned to me or names me; summarize the rest |

## Draft delivery

- **Slack**: native drafts via `slack_send_message_draft` (land in Drafts & Sent). One per channel max.
- **Email**: native Outlook drafts (Drafts folder); staged files in `outbox/drafts/email/` only if draft creation fails.
- **Front**: private drafts on the conversation via `create_draft`; never sent, archived, tagged or assigned.
- **Teams**: staged files in `outbox/drafts/teams/` (connector is read-only).

## State files

- `inbox/.slack-processed`: Slack message `ts` values already triaged (append-only).
- `inbox/.teams-processed`: Teams message IDs already triaged (append-only).
- `inbox/.email-processed`: email Message-IDs already triaged (append-only).
- `inbox/.front-processed`: Front `<conversation id> <message id>` pairs already triaged (append-only).
- `inbox/.triage-last-run`: ISO 8601 timestamp of the last run.

## Knowledge base

- Vault subfolder: <from context.md Vault Configuration, e.g. `Lore/` or `Lore - <Company>/`>.
- Additive updates only: observations appended to People/Projects notes; decisions logged to Decisions.
