# Unified Triage (Email + Slack + Teams)

Multi-source, draft-and-hold triage. Each run sweeps Outlook email, Slack, and Microsoft Teams for items needing the user's attention, drafts responses grounded in the knowledge base, and never sends. The user reviews and hits send. The single triage entry point for the workspace: it replaces the older Mac Mail `email-triage.md` and sources email from the Microsoft 365 connector.

Generic across users. User-specific data lives in `triage-config.md` (root, created on first run) and `context.md`. It defines its own email tier framework (below) and reads sender lists from `email-config.md` when present.

All output follows VOICE.md. Storage mode: see `_conventions.md` → Storage-mode branching. Vault tooling: `_conventions.md` → Vault access tooling.

## Design principles

- **Draft-and-hold.** Drafts only, never sends. Slack drafts are native (they land in "Drafts & Sent"); email and Teams stage as paste-ready files (read-only connectors).
- **Vault is the brain.** Every draft is grounded in vault entities plus `context.md` initiatives.
- **Additive knowledge refresh only.** May append observations and log decisions after drafting; never overwrites (`_conventions.md` → Linking and deduplication). Every write is listed in the briefing.
- **Incremental.** Each run looks only at activity since the last run, using per-source processed trackers and a last-run timestamp. Stale threads are skipped.

## Connector dependencies

Tool names below are logical; resolve each by its suffix (the MCP prefix differs per install).

| Source | Connector | Capability | Tools used |
|--------|-----------|------------|------------|
| Email | Microsoft 365 | Read-only | `outlook_email_search`, `read_resource` |
| Teams | Microsoft 365 | Read-only | `chat_message_search`, `read_resource` |
| Slack | Slack | Read + write (drafts) | `slack_search_users`, `slack_search_channels`, `slack_search_public_and_private`, `slack_read_channel`, `slack_read_thread`, `slack_read_user_profile`, `slack_send_message_draft` |
| Jira / Confluence | Atlassian | Read-only | `getJiraIssue`, `searchJiraIssuesUsingJql`, `getConfluencePage`, `searchConfluenceUsingCql` |
| Knowledge base | Vault (direct filesystem) | Read + write | Read, Edit, Write, Grep against the vault path in `context.md` → "Vault Configuration" |

If a connector is missing at run time, skip that source (or enrichment step), note it in the briefing, and continue. Do not fail the whole run for one unavailable source. Atlassian is additive: its absence degrades draft quality but does not block the sweep.

## When to invoke

- User says: "triage everything", "run my triage", "what needs me across email, Slack, and Teams", "catch me up", "any drafts waiting".
- Scheduled task fires (default: twice on weekdays, morning and mid-afternoon).
- After time away, in backlog mode (below).

## Fresh-install detection (first step every invocation)

Check whether `triage-config.md` exists at the workspace root.

- **Present:** load it, continue with normal triage.
- **Missing:** run "Fresh setup" (bottom of this file), then continue.

## Inputs read each run

1. `context.md`: team, boss, key stakeholders, active initiatives, terminology corrections, and **Email Writing Style** (the voice all drafts match).
2. `triage-config.md` (root): per-source scope. Slack project channels (name + ID), Teams key people, email tier overrides, the user's own Slack user ID, scope rules.
3. `email-config.md` (root), if present: reuse its sender lists and tier framework for the email pass.
4. Processed trackers in `inbox/`: `.slack-processed`, `.teams-processed`, `.email-processed` (append-only; one ID per line).
5. `inbox/.triage-last-run`: ISO 8601 timestamp of the previous run. If absent, default the window to the last 24 hours and note it in the briefing.
6. The vault under the configured subfolder (from `context.md` → "Vault Configuration"; default `Lore/`; substitute that value for any `Lore/<path>` references here).

## What counts as "needs attention"

Per the user's scope preference. Outlook always uses the Email tier framework below.

**Slack and Teams: items needing a response (draftable).**

- **Direct messages** (1:1 conversations).
- **@mentions** of the user, in any channel or chat.
- **Configured project channels** (Slack, from `triage-config.md`) with new messages in the window.
- **Active threads the user previously posted in** that have NEW replies since the last run.

**Teams group chats: summarize, do not draft.**

Multi-person Teams chats (3+ participants) where the user is NOT @mentioned are discussion to be aware of, not items to answer. Produce a short summary per chat and extract knowledge-base candidates (step 3b). Same for busy Slack channels that are informational rather than project-critical.

**Distinguishing the two (Teams):** the search API returns no participant counts or @mention flags, and sender email is null, so classify by **chat ID pattern** plus a content scan:

- `19:...@unq.gbl.spaces` = 1:1 DM → draftable.
- `19:meeting_...@thread.v2` = meeting side-chat → group, summary-only unless the user is @mentioned.
- `19:<hex>@thread.v2` = group chat → summary-only unless the user is @mentioned.
- @mention detection: scan message content for the user's name/mention; a mention promotes any chat to draftable.
- Exclude messages authored by the user when deciding what needs a reply; use them only to mark threads the user has participated in.

**Skip rule:** a thread, channel, or chat with no new messages since the last processed marker is ignored. Do not draft or summarize stale conversations.

## Email tier framework

Applied to each new email. Stop at the first matching rule. Anchored on `context.md` (My Team, Reports to, Key Stakeholders, Active Initiatives) and `email-config.md` sender lists when present.

**Tier 1 (act, draft a reply):**

1. **Direct asks from team or boss.** Sender in `context.md` My Team or is the user's Reports to, or in `email-config.md` Tier 1 Direct Senders. User on To. Contains a question, request, or decision.
2. **Cross-functional asks and decisions.** Sender in `context.md` Key Stakeholders or `email-config.md` Tier 1 Cross-Functional Senders, with a direct ask. If a reply would run past a paragraph, suggest a short sync instead.
3. **Active project threads.** Sender or thread maps to a `context.md` Active Initiative (via `email-config.md` Tier 1 Project Partners). Reply if the user is the bottleneck; otherwise note who it waits on.

**Tier 2 (scan, no draft):**

4. **Internal FYI and leadership updates;** distribution-list traffic (`email-config.md` Distribution Lists).
5. **HR, surveys, admin.**

**Tier 3 (filtered, no draft):**

6. **Operations and case routing** (`email-config.md` Automated Sources, type `ops`).
7. **System alerts and incident notifications** (type `alert`).
8. **Calendar and vendor noise** (subjects starting `Accepted:` / `Declined:` / `Tentative:` / `Canceled:` / `Updated:`; type `noise`).

**Categorization logic (first match wins):** subject is a calendar reply prefix → 8; sender in Automated Sources → 6/7/8 per its type; sender in Tier 1 Direct (or a My Team / Reports to person) → 1 if on To, else 4; sender in Tier 1 Cross-Functional (or a Key Stakeholder) → 2 if on To, else 4; sender in Tier 1 Project Partners → 3; distribution-list match → 4; internal company domain not matched above → 1 if on To, else 4; external unmatched → 4 (flag as unclassified in the briefing so the user can promote or demote it).

## The procedure (per run)

### 0. Setup

1. Run fresh-install detection. Load `context.md`, `triage-config.md`, `email-config.md` (if present).
2. Read `inbox/.triage-last-run`. Set `window_start` to that timestamp (or now minus 24h if absent). Record `run_start = now`.
3. Detect available connectors. Mark any missing source "unavailable" and skip it.
4. Resolve the active vault subfolder from `context.md`.

### 1. Email pass (Outlook, via MS365 connector)

1. `outlook_email_search` with `afterDateTime = window_start`, `order = newest`, `folderName = Inbox`. Page through results.
2. Drop any email whose `Message-ID` is already in `inbox/.email-processed`.
3. For each new email, parse From, To, Cc, Subject, Date. Pull the body with `read_resource` on the returned URI when a draft is likely.
4. Categorize using the Email tier framework above.
5. For Tier 1 items that need a reply and where the user is the bottleneck: draft a reply (see "Drafting"). Stage it as a file.
6. Append processed Message-IDs to `inbox/.email-processed`.

### 2. Slack pass

1. Resolve the user's own Slack user ID from `triage-config.md` (or `slack_read_user_profile` / the logged-in user on first run).
2. **DMs and mentions:** use `slack_search_public_and_private` to find activity since `window_start`. Reliable queries: `<user's name> after:<date>` (catches @mentions and channel activity involving the user) and `to:me after:<date>` (DMs). Do NOT rely on `slack_search_channels` for discovery; channel-name search is unreliable.
   - **Apply the ignore list** from `triage-config.md`: skip the Jira bot and its DM, the Outlook Calendar bot, the refinement story bot, and bot messages generally unless they @mention the user. These flood `to:me` and add no action.
3. **Project channels:** for each channel ID in `triage-config.md`, `slack_read_channel` for messages after `window_start`. Treat this list as a watch-list, not a boundary: a cache of known channels, not the limit of what gets triaged.
4. **Discover new channels every run (do not rely only on the seed):** the activity search in step 2 surfaces messages from any channel where the user is mentioned or active, including channels not in `triage-config.md`. Any such channel is in scope this run. After the sweep, compare channels seen against the configured watch-list:
   - **New channel with a direct mention or DM** → triage it now, and append it to the `### Project channels to watch` table in `triage-config.md` (additive write, with a best-guess linked initiative).
   - **New channel with only ambient activity** (no mention) → list under "New channels detected" in the briefing for the user to confirm. Do not add it silently.
   - Never remove channels from the config automatically; the user prunes that list.
5. **Participated threads with new replies:** for threads surfaced above (or tracked from prior runs), `slack_read_thread` and keep only those with replies newer than the last processed `ts` for that thread. Skip threads with nothing new.
6. Drop any message whose `ts` is already in `inbox/.slack-processed`.
7. For each item warranting a response, draft it grounded in vault context, then create a **native Slack draft** with `slack_send_message_draft` (set `thread_ts` for thread replies; use the user's ID as `channel_id` for DM drafts).
   - Constraint: only one attached draft per channel. If `slack_send_message_draft` returns `draft_already_exists`, do not overwrite. Stage that reply in the briefing file and flag it.
   - The native draft is for the user to review and send from Slack. The workflow never sends; if the inline send fails, the draft still lives in "Drafts & Sent" to send manually.
8. Append processed `ts` values to `inbox/.slack-processed`.

### 2b. Link enrichment (Slack + Teams)

After the Slack pass (and Teams pass, once done), and before writing any draft, resolve external links in message and thread text. Runs once over all items queued for drafting or summarizing.

**What to extract:**

- **Jira ticket keys**: any `[A-Z]{2,10}-[0-9]+` in message text (e.g., `LI-1234`, `CORE-567`). Also follow bare Jira URLs (e.g., `https://*.atlassian.net/browse/PROJ-123`).
- **Confluence page URLs**: any `https://*.atlassian.net/wiki/...` link. Extract the page ID or slug.
- **Deduplicate**: if the same key or URL appears in multiple messages, fetch it once and reuse across all items referencing it.

**How to fetch:**

1. For each unique Jira key: `getJiraIssue(issueIdOrKey: "PROJ-123")`. Extract summary (title), status, assignee, reporter, description (first 300 chars), and the most recent 1 to 2 comments. Discard boilerplate (attachment lists, changelog, etc.).
2. For each unique Confluence URL: `getConfluencePage` with the page ID or slug from the URL. Extract title, space, last-modified date, body (first 500 chars). If the page ID cannot be parsed, skip it and note "Confluence link unresolved" in the briefing.
3. If Atlassian is unavailable, skip this step. Note "Atlassian connector unavailable, links not resolved" once in the briefing. Do not fail the run.

**Attach context to items:** for each queued item, build a `linked_context` packet: a compact bulleted summary of all Jira tickets and Confluence pages referenced in that message or thread. Passed to drafting (step 4) as grounding material alongside the vault lookup.

Example compact format:
```
Linked: LI-1234 "Carrier retry logic" [In Progress / assigned: Jane Doe], "Investigate why retries are firing twice on..."
Linked: Confluence "Carrier Integration Runbook" [updated 2026-05-15], "Step 1: Validate carrier config in..."
```

**Extract KB candidates from linked resources:** while building the packet, flag vault-worthy facts:
- A Jira status that changed (a ticket the vault shows "open" is now "Done").
- A ticket assignee or owner who is a person in the vault.
- A Confluence page documenting a decision, architecture choice, or project phase the vault's project note should reference.
- Any new risk, blocker, or commitment stated in a Jira comment.

Append these to the KB candidates pool alongside the Teams group-chat candidates (step 3b). Same confirmation rules (interactive: ask; scheduled: list in briefing under "Knowledge base candidates (your call)").

### 3. Teams pass (via MS365 connector)

1. `chat_message_search` with `afterDateTime = window_start`. Page through results. Pull key people from `triage-config.md`.
2. Drop any message whose ID is already in `inbox/.teams-processed`.
3. Group remaining messages by `chatId`. Classify each chat by the chat-ID pattern above:
   - **1:1 DM** (`...@unq.gbl.spaces`) → direct.
   - **@mention of the user** in any chat (content scan) → direct.
   - **New reply in a chat the user has posted in before** → direct.
   - **Group or meeting chat** (`...@thread.v2`, `meeting_...@thread.v2`) with no @mention → group discussion (summary-only).

#### 3a. Direct items (draftable)

4. For each direct item warranting a response, draft it grounded in vault context and stage it as a file under `outbox/drafts/teams/` (Teams connector is read-only, so no native draft).

#### 3b. Group-chat discussions (summary + knowledge-base prompt)

5. For each group chat with new activity, write a 1 to 3 sentence summary (topic, who is driving it, any conclusion or open question). Do NOT draft a reply. These go in the briefing's "Teams discussions" section.
6. From those summaries, extract **knowledge-base candidates**: decisions reached, status changes on an initiative, new commitments, risks, or facts about a person or project the vault should capture. List each with the chat it came from and the vault note it would land on.
7. **Do not auto-write group-chat candidates** (lower-confidence than direct-thread observations). Instead, prompt the user:
   - **Interactive run:** after presenting summaries, ask "Want me to update the knowledge base with any of these?" and apply only the ones confirmed (additive, via Edit on the entity note).
   - **Scheduled run:** list them in the briefing under "Knowledge base candidates (your call)" with a note that the user can reply "update KB with #1, #3" to apply. Hold until they do.
8. Append processed IDs to `inbox/.teams-processed` for both direct and summarized messages.

### 4. Drafting (all sources)

For every draft, before writing:

1. Identify the people and projects involved. Look them up in the vault: search by name/topic via the vault search or dataview MCP tools, falling back to Grep per `_conventions.md` → Vault access tooling, then Read each relevant person/project note. Cross-reference `context.md` Active Initiatives. **Also include the `linked_context` packet from step 2b** (Jira/Confluence excerpts). Treat linked-resource context as grounding with the same weight as vault notes: it informs the reply but is never quoted verbatim or over-explained to the recipient.
2. Apply terminology corrections from `context.md` silently (see `_conventions.md` → Terminology and glossary).
3. Match voice per VOICE.md and the source-specific section of `context.md`:
   - **Email** drafts follow `## Email Writing Style` in `context.md` (and `outbox/dictation-style-prompt.md` for nuance). No greeting on mid-thread replies, no sign-off, contractions default, hedge opinions / commit on facts, 25 to 120 words for most replies.
   - **Slack and Teams** drafts follow `## Slack & Teams Writing Style` in `context.md` (short, warm, quick affirmation openers, light emoji, same hedging as email). If absent, fall back to: shorter and more casual than email, same warmth markers. Match the register of the incoming message.
4. If a draft would require a decision the user has not made, do not invent it. Draft a holding reply or flag the item in the briefing as "needs your call before I can draft."

### 5. Knowledge-base refresh (additive only)

After drafting, capture what the sweep revealed. **Never overwrite. Only append.** If an update would change an existing fact rather than add one, flag it in the briefing for the user to confirm instead of writing it. Decision-log test: `_conventions.md` → Decision-log discipline.

1. **Observations from linked resources (auto-apply when high-confidence):** for any Jira ticket or Confluence page fetched in step 2b, apply without waiting for confirmation (structured, authoritative sources):
   - **Jira status update**: if the ticket is linked to a vault project or person and its status changed, append a dated observation to the project note (e.g., "LI-1234 moved to Done as of 2026-06-09"). Use Edit, anchored on (inserting after) the last line of the project's `Current Phase` section (Obsidian mode) or the `## Current Phase` block in `projects/[slug].md` (filesystem mode).
   - **New ticket assignee**: if the assignee is a person in the vault, append a brief observation to their person note (e.g., "Assigned LI-1234 Carrier retry logic").
   - **Confluence page reference**: if relevant to an active project, append a reference line to the project note (e.g., "Confluence: Carrier Integration Runbook, last updated 2026-05-15"). Do not dump the full page body.
   - List all auto-applied writes in the briefing under "Knowledge base updated (applied)".
   - If the link context is ambiguous (ticket not clearly tied to a vault entity), add it to "Knowledge base candidates (your call)" instead.
2. **Observations from message threads:** new, durable facts about a person or project (status change, commitment, risk). Write once, on the entity's own note.
   - **Obsidian mode:** append via Edit on the person's vault note (`People/<Name>.md`), inserting the new observation above the first existing `###` entry in `## Observations` (newest first, `_conventions.md` → Person note structure). For projects, Edit `Projects/<Name>.md`, inserting after the last line of the `Current Phase` section.
   - **Filesystem mode:** append to `team/[name].md` or `stakeholders/[name].md` for person observations; append a dated block to `projects/[slug].md` under `## Current Phase` for project updates. Run the two-step existence check first (`_conventions.md` → Two-step existence check).
3. **Decisions:** if a thread contains a clearly-stated decision, log it. Obsidian mode: a note under `<vault>/Decisions/` using the decision schema. Filesystem mode: append to `decisions/log.md` using `templates/decision-log-entry.template.md`.
4. List every knowledge-base write in the briefing. Any new entity note (e.g. a logged decision) also gets an `Index.md` line (`_conventions.md` → Vault index).

### 6. Verify drafts and briefing (independent grader)

Before presenting anything, spawn an independent verifier sub-agent over the assembled drafts and briefing. It does not know how the drafts were written; it grades fresh.

Checks:
1. **Voice.** Every draft and the briefing conform to VOICE.md (no em dashes, no banned constructions, length ceilings respected).
2. **Traceability.** Every factual claim (name, status, date, number, commitment, decision) traces to a specific source message, linked Jira/Confluence resource, or vault note. Flag any claim with no source.

On any fail, revise once addressing the specific gaps the verifier named, then present. Do not loop past one revision; if a gap survives, present with the gap flagged in the briefing for the user's call. Verification signal: `_conventions.md` → Verification loops.

### 7. Output

1. Write the briefing to `outbox/triage/triage-YYYY-MM-DD.md` (append `-HHMM` if a second run lands the same day).
2. Save staged email drafts under `outbox/drafts/email/YYYY-MM-DD-<slug>.md` and Teams drafts under `outbox/drafts/teams/YYYY-MM-DD-<slug>.md`. Each staged draft file includes recipient, subject (email), the thread/source link, and the ready-to-paste body.
3. Update `inbox/.triage-last-run` to `run_start`.
4. Print a one-paragraph summary to chat and link the briefing file.

## Briefing format

```markdown
# Triage: YYYY-MM-DD HH:MM

📜 *Window: <window_start> to <run_start>. Email: N new / D drafted. Slack: N new / D drafted. Teams: N new / D drafted.*

## Needs you (drafts ready)

### Email
- **Sender**: "Subject" (HH:MM). What they need. *Draft staged: outbox/drafts/email/<file>.md*

### Slack
- **Person** in #channel (HH:MM). What they need. *Native draft created in your Drafts & Sent.* [link]
- **Person** in #channel. *Draft already existed in this channel, so staged below instead.*

### Teams
- **Person** (HH:MM). What they need. *Draft staged: outbox/drafts/teams/<file>.md*

## Needs your call (could not draft)
- **Person / channel**: the decision required before a reply can be written.

## Teams discussions (summary, no reply needed)
- **Group chat name / participants**: 1 to 3 sentence summary of what is being discussed.

## FYI (no reply needed)
- Brief one-liners worth a glance, grouped loosely by source.

## Knowledge base updated (applied)
- Appended observation to [[Person]]: <one line>.
- Logged decision: <title> → decisions log.

## New Slack channels detected
- #channel-name (Cxxxx): seen via <mention/DM/ambient>. Auto-added to watch-list. (Or: "confirm to add" if ambient-only.)

## Linked resources resolved
- LI-1234 "Carrier retry logic" [In Progress / Jane Doe], used to draft reply in #channel-name.
- Confluence "Carrier Integration Runbook", used to draft reply in #other-channel.
- (Or: "Atlassian connector unavailable, links not resolved.")

## Knowledge base candidates (your call)
- #1 From <Teams group chat or linked Jira/Confluence>: <candidate fact/decision> → would append to [[Project]]. Reply "update KB with #1" to apply.
- #2 ...

- 📜 Lore
```

## Backlog mode (one-time, user invokes)

User says: "triage my backlog" or "catch me up on everything I missed."

1. Same sweep, but widen the window (ask how far back, default 7 days) and ignore the processed trackers.
2. Output to `outbox/triage/triage-backlog-YYYY-MM-DD.md`.
3. Do NOT append to the processed trackers automatically. After review, the user decides whether to mark the backlog as seen.
4. Be conservative: produce drafts for clear Tier 1 items only; list the rest for the user to selectively request.

## Action items integration (opt-in)

Does NOT auto-push to the action items artifact. The briefing flags candidates; the user can say "push these to action items" to trigger the standard add-operation flow in `workflows/action-items.md`. Avoids duplicating items tracked elsewhere.

## Fresh setup (first invocation when `triage-config.md` is missing)

1. Greet with the signet (📜). Explain unified triage is being set up for the first time.
2. **Slack discovery:** confirm the Slack connector is present. Resolve the user's own Slack user ID. Use `slack_search_channels` to list channels the user is in. Propose a starter set of project channels by matching channel names against `context.md` Active Initiatives. Let the user confirm or edit.
3. **Teams discovery:** confirm the MS365 connector is present. Propose key people to watch from `context.md` team and stakeholders. Note DMs and @mentions are drafted, group chats summarized only.
4. **Email:** if `email-config.md` exists, reuse it. If not, copy `templates/email-config.template.md` to `email-config.md` and populate it by sampling the inbox (`outlook_email_search`): classify senders into tiers using `context.md` as anchor, identify automated sources and distribution lists. The Email tier framework lives here, so no separate email workflow is needed.
5. Copy `templates/triage-config.template.md` to `triage-config.md` and populate it from the discovery above.
6. Initialize empty `inbox/.slack-processed` and `inbox/.teams-processed` (reuse `inbox/.email-processed`). Write the current time to `inbox/.triage-last-run` so the first real run starts incremental.
7. Offer a one-time backlog sweep.
8. Offer to create the scheduled tasks (default: weekdays, morning and mid-afternoon).

## Outputs

- `outbox/triage/triage-YYYY-MM-DD.md`: per-run briefings.
- `outbox/triage/triage-backlog-YYYY-MM-DD.md`: one-time backlog briefing.
- `outbox/drafts/email/`, `outbox/drafts/teams/`: staged paste-ready drafts.
- Native Slack drafts in the user's "Drafts & Sent."
- Additive vault updates (observations, decisions), each listed in the briefing.
- `inbox/.slack-processed`, `inbox/.teams-processed`, `inbox/.email-processed`, `inbox/.triage-last-run`: state tracking.
- `triage-config.md` (root): created on first setup; edited by the user as scope evolves.

## A few non-obvious rules

- **Never send.** Slack drafts use `slack_send_message_draft`, never `slack_send_message` or `slack_schedule_message`. Email and Teams stay staged as files (MS365 is read-only).
- **Processed trackers are append-only.** Never rewrite or sort. To reprocess an item, the user removes its specific line (or asks Lore to).
- **Link enrichment is best-effort.** Never block a draft waiting for a link; note the failure once and continue.
- **Scope creep check.** If the FYI section grows large run after run, tighten the project-channel list or scope rules in `triage-config.md`.
