# Unified Triage (Email + Slack + Teams)

Multi-source, draft-and-hold triage. Each run sweeps email (Outlook directly, or through Front), Front shared inboxes, Slack, and Microsoft Teams for items needing the user's attention, drafts responses grounded in the knowledge base, and never sends. The user reviews and hits send. The single triage entry point for the workspace: it replaces the older Mac Mail `email-triage.md` and sources email from the Microsoft 365 connector.

Generic across users. User-specific data lives in `triage-config.md` (root, created on first run) and `context.md`. It defines its own email tier framework (below) and reads sender lists from `email-config.md` when present.

All output follows VOICE.md. Storage mode: see `_conventions.md` → Storage-mode branching. Vault tooling: `_conventions.md` → Vault access tooling.

## Design principles

- **Draft-and-hold.** Drafts only, never sends. Slack and email drafts are native: Slack lands in "Drafts & Sent", email lands in the Outlook Drafts folder via `outlook_create_reply_draft` / `outlook_create_reply_all_draft` / `outlook_create_draft`. Front drafts are native too: a private draft on the conversation via `create_draft`. Teams still stages as paste-ready files (its connector remains read-only for writes; revisit this once it gains a draft or send tool).
- **Vault is the brain.** Every draft is grounded in vault entities plus `context.md` initiatives.
- **Additive knowledge refresh only.** May append observations and log decisions after drafting; never overwrites (`_conventions.md` → Linking and deduplication). Every write is listed in the briefing.
- **Incremental.** Each run looks only at activity since the last run, using per-source processed trackers and a last-run timestamp. Stale threads are skipped.

## Connector dependencies

**Which sources run** comes from `context.md` → Tools & Integrations → Connectors (`workflows/connectors.md`): sweep the email and team-chat tools recorded there as `connected`, and use the recorded work-tracker and docs tools for link enrichment. A recorded tool with no adapter below (Gmail, Google Chat, for now) is listed once in the briefing as "not swept yet" and skipped. Never sweep a connector the user didn't name for that role. If the Connectors table is missing (an older install), run the detection steps of `workflows/connectors.md` first.

Adapters available today, with tool names as logical names; resolve each by its suffix (the MCP prefix differs per install).

| Source | Connector | Capability | Tools used |
|--------|-----------|------------|------------|
| Email | Microsoft 365 | Read + write (drafts) | `outlook_email_search`, `read_resource`, `outlook_create_reply_draft`, `outlook_create_reply_all_draft`, `outlook_create_draft`, `outlook_update_draft` |
| Email via Front, and shared inboxes | Front | Read + write (drafts) | `search_conversations`, `read_conversation`, `read_message`, `create_draft`, `list_drafts` |
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
4. Processed trackers in `inbox/`: `.slack-processed`, `.teams-processed`, `.email-processed`, `.front-processed` (append-only; one entry per line).
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

**Already-answered rule (all sources, hard rule):** before drafting anything, check who sent the most recent message in the thread, email conversation, or chat, not just the message that triggered the match. If the user is the last sender (they already replied, whether from Lore or straight from Outlook/Slack/Teams), the item is answered: do not draft again. Drop it, or if still worth a glance, list it under FYI/Teams discussions instead of Needs You. This applies to email threads, Slack threads and DMs, and Teams chats alike. See the drafting checks in each pass below and the verifier check in step 6.

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

Skip this pass for any mailbox that step 1b owns (a Front personal inbox carries it; see "One source per email" in 1b).

1. `outlook_email_search` with `afterDateTime = window_start`, `order = newest`, `folderName = Inbox`. Page through results.
2. Drop any email whose `Message-ID` is already in `inbox/.email-processed`.
3. For each new email, parse From, To, Cc, Subject, Date. Pull the body with `read_resource` on the returned URI when a draft is likely.
4. Categorize using the Email tier framework above.
5. For Tier 1 items that need a reply and where the user is the bottleneck: **first check the thread, not just this message, and re-check it again immediately before the draft call.** A newer message in the same conversation can arrive between the sweep and the write; on 2026-09-03 a sender shipped an annotated second version of his own message five minutes after the window closed and ten minutes before the draft was written, which falsified two of the draft's four points. If a superseding message is found **after** a draft already exists, create a fresh draft on the newer message and flag the stale one for deletion in both deliverables with its exact subject line: a scheduled run drafts and stages, it does not delete mail. Pull the conversation (`read_resource` on the conversation/thread, or the latest messages in it) and confirm the most recent message in it is not already from the user. **The Inbox sweep cannot see the user's own replies, so the thread check must query Sent Items explicitly**: `outlook_email_search` with `recipient = <the other party's address>` and `sender = <the user's address>` (no `folderName`, no `order`, which searches the whole mailbox including Sent Items), and compare the newest result's `sentDateTime` against the inbound message's. On 2026-10-02 this step was skipped and a draft was created for a message the user had answered three hours earlier, inside the same window; it was only caught by the verifier. If the user's own address sent the last message in the thread (a reply already went out, whether via Lore or straight from Outlook), this item is answered: skip drafting, do not list it under Needs You, and file it under FYI if still worth a mention. Otherwise, draft the reply text (see "Drafting"), then create a **native Outlook draft**: `outlook_create_reply_draft` (threaded reply, quotes the original, original sender pre-filled in To) for a normal reply, `outlook_create_reply_all_draft` when the group needs to stay on it, or `outlook_create_draft` for a fresh message. Body formatting is a hard rule, not a preference: `_conventions.md` → Outlook draft body formatting. In short, and non-negotiably: pass `body` + `bodyType`, never `comment`; and if `bodyType` is `"text"`, the body string must contain zero `<` characters. Check that before the call, on every draft in the batch (this has shipped broken twice, both times as a whole batch at once). Capture the returned `id` and `webLink`.
   - If draft creation fails for any reason (rate limit, validation, connector error), fall back to staging the reply as a file in `outbox/drafts/email/` as before, and note the fallback in the briefing so the user knows to paste it manually.
6. Capture the deep link for each item surfaced (for the HTML brief): **if a native draft was created in step 5, use the draft's own `webLink`**, but read it back from the Drafts folder, not from the create call. The `webLink` the `outlook_create_reply_draft` / `outlook_create_reply_all_draft` / `outlook_create_draft` response returns is built from an immutable-id form (`ItemID=AAkALgAAAAAAHYQDEapmEc2byACqAC...`) that does not resolve in this mailbox; three such links shipped in the 2026-10-02 brief before the verifier caught them. After creating the batch, run one `outlook_email_search` with `folderName = "Drafts"`, `order = "newest"`, match each draft by subject and recipients, and use the `webLink` from that result so "Open in Outlook" opens straight to the draft, not the original message. For items with no draft (Tier 2/3, FYI, or a fallback to a staged file): use the source message's `webLink`; if absent, build `https://outlook.office.com/mail/deeplink/read/<messageId>`. If neither can be constructed, leave the link empty and the brief shows the item without one. (Links only open from the brief if the anchor carries `target="_blank"`; the template handles this, see `templates/brief.template.html`.)
7. Append processed Message-IDs to `inbox/.email-processed`.

### 1b. Front pass (email through Front, and shared inboxes)

Runs when `context.md` → Connectors records Front as `connected`, either for the **Service or shared inbox** role or as the way the **Email** role is read (the user's mailbox is synced into a Front personal inbox). Scope comes from `context.md` → Front scope and `triage-config.md` → Front: the personal inbox id and any shared inbox ids. Front writes are attributed to the user, so this pass only reads and drafts.

**One source per email (dedup).** The same message can be visible in more than one place: the user's mailbox natively (step 1) and through a Front inbox that syncs it, or a shared inbox that also copies the user. Lore triages and drafts each email once.
- **Front wins when it carries the mailbox.** If a Front personal inbox carries the user's address (its channel `address` matches the Email role), this pass owns that mailbox and step 1 skips it entirely, even when Microsoft 365 is connected: Front adds assignment, comments and shared drafts that Outlook lacks. `triage-config.md` → Email can override this with `Email client: Outlook`.
- **Cross-source match.** Whenever two sources are both swept, drop the second sighting of the same message before drafting: match on the internet Message-ID when both sides expose it, otherwise on sender address + normalized subject + sent time within 2 minutes. Keep the Front copy; record the dropped one in its own tracker so it isn't reconsidered.
- **One draft per thread.** Before creating any email draft, check the other source for an existing draft on the same thread (Front: `drafts` on `read_conversation`; Outlook: the Drafts folder). If one exists, don't create a second; list it under Needs You with a link to the existing draft.

When Microsoft 365 is not connected, this pass owns the email sweep and the Email tier framework applies to it unchanged.

1. For each inbox in scope, `search_conversations` with `filters.inboxId`, `filters.status = "open"`, and `filters.after` = the calendar day **before** `window_start` (the filter takes a date, not a time), `scope = "all_inboxes"` for shared inboxes. Page with `cursor`. Keep conversations whose `updatedAt` is after `window_start`.
   - **Archived means handled.** Front archives a conversation when the user archives it (in Front, or in Outlook for a synced mailbox) and auto-archives it when the user replies. Skip `archived`, `trashed` and `spam` conversations; never reopen, archive, tag, assign, or comment on anything.
2. Drop any conversation whose newest message id is already in `inbox/.front-processed` (one `<conversation id> <message id>` pair per line).
3. `read_conversation` (limit 10) for each remaining one. The timeline is newest first; each entry's `kind` is `message_inbound` or `message_outbound`.
   - **Already-answered check:** if the newest message entry is `message_outbound`, the user (or a teammate, in a shared inbox) already replied: no draft, FYI at most.
   - If the first page lists `drafts`, a draft already exists on this conversation: do not add another; list it under Needs You as "draft already in Front."
4. Classify: personal-inbox mail uses the Email tier framework (pull sender and recipients with `read_message` on the newest inbound message). Shared-inbox conversations are draftable only when assigned to the user (`assigneeId` = the user's teammate id) or when the newest inbound message names or @mentions them; unassigned shared-inbox traffic is summarized under FYI by inbox, never drafted.
5. For each item that needs a reply, re-read the conversation immediately before the write (a newer message can arrive mid-run), then draft per step 4 and create a **native Front draft**: `create_draft` with `conversationId`, `bodyFormat = "plain"`, `shared = false` (a private draft only the user sees), and no `to` / `cc` / `bcc` so it replies to the original recipients. Never call `send_message`. If creation fails, stage the reply under `outbox/drafts/email/` and say so in the briefing.
6. Deep link for the HTML brief: `https://app.frontapp.com/open/<conversation id>`. It opens the conversation with the draft attached.
7. Append `<conversation id> <newest message id>` for every conversation looked at to `inbox/.front-processed`.

### 2. Slack pass

1. Resolve the user's own Slack user ID from `triage-config.md` (or `slack_read_user_profile` / the logged-in user on first run).
2. **DMs and mentions:** use `slack_search_public_and_private` to find activity since `window_start`, then filter by `ts` in code. Do NOT rely on `slack_search_channels` for discovery; channel-name search is unreliable.
   - **Two syntax traps, both verified 2026-09-03, and either one silently returns a completely empty Slack day.** First, Slack's `after:YYYY-MM-DD` modifier is **exclusive**, so `after:2026-09-03` means September 4 onward and finds nothing on the day you are sweeping. Always pass the **previous** calendar day and filter in code. Second, combining the tool's own `after:` epoch parameter with an `after:` modifier inside `query` over-constrains and returns zero results; use one or the other, not both.
   - **`to:me` does not work on this connector**, same as `from:me`. Use `to:<@U…>` and `from:<@U…>` with the literal user ID in angle brackets.
   - Working queries: `<user's name> after:<day before window_start>`, `<@Uxxxx> after:<day before window_start>`, `to:<@Uxxxx> after:<day before window_start>`, each with `sort="timestamp"`, then discard anything older than `window_start`.
   - **Apply the ignore list** from `triage-config.md`: skip the bots listed there (typically the work tracker's notification bot and the calendar bot) and bot messages generally unless they @mention the user. These flood `to:me` and add no action.
3. **Project channels:** for each channel ID in `triage-config.md`, `slack_read_channel` for messages after `window_start`. Treat this list as a watch-list, not a boundary: a cache of known channels, not the limit of what gets triaged.
4. **Discover new channels every run (do not rely only on the seed):** the activity search in step 2 surfaces messages from any channel where the user is mentioned or active, including channels not in `triage-config.md`. Any such channel is in scope this run. After the sweep, compare channels seen against the configured watch-list:
   - **New channel with a direct mention or DM** → triage it now, and append it to the `### Project channels to watch` table in `triage-config.md` (additive write, with a best-guess linked initiative).
   - **New channel with only ambient activity** (no mention) → list under "New channels detected" in the briefing for the user to confirm. Do not add it silently.
   - Never remove channels from the config automatically; the user prunes that list.
5. **Participated threads with new replies:** for threads surfaced above (or tracked from prior runs), `slack_read_thread` and keep only those with replies newer than the last processed `ts` for that thread. Skip threads with nothing new.
6. Drop any message whose `ts` is already in `inbox/.slack-processed`.
7. **Already-answered check:** before drafting, look at the last message in the thread (or DM) from `slack_read_thread` / `slack_read_channel`. If its `user` is the user's own Slack ID, they already replied there, whether via a sent Lore draft or directly in Slack, so skip drafting and don't list it under Needs You (move to FYI if still worth a mention). Only proceed to draft for items where someone else sent the last message.
8. For each item warranting a response, draft it grounded in vault context, then create a **native Slack draft** with `slack_send_message_draft` (set `thread_ts` for thread replies; use the user's ID as `channel_id` for DM drafts).
   - Constraint: only one attached draft per channel. If `slack_send_message_draft` returns `draft_already_exists`, do not overwrite. Stage that reply in the briefing file and flag it.
   - The native draft is for the user to review and send from Slack. The workflow never sends; if the inline send fails, the draft still lives in "Drafts & Sent" to send manually.
9. Capture the deep link for each item surfaced (for the HTML brief): **if a native draft was created in step 8, use the `channel_link` returned by `slack_send_message_draft`** so "Open in Slack" opens the channel where the draft lives (Slack has no direct per-draft permalink; the channel view is the closest thing and is where the user will find and send it). For items with no draft (Tier 2/FYI, or a `draft_already_exists` conflict that got staged in the briefing instead), use the source message's permalink. If neither can be resolved, leave the link empty and the brief shows the item without one.
10. Append processed `ts` values to `inbox/.slack-processed`.

### 2b. Link enrichment (Slack + Teams)

After the Slack pass (and Teams pass, once done), and before writing any draft, resolve external links in message and thread text. Runs once over all items queued for drafting or summarizing.

**What to extract:**

- **Jira ticket keys**: any `[A-Z]{2,10}-[0-9]+` in message text (e.g., `PROJ-123`, `CORE-567`). Also follow bare Jira URLs (e.g., `https://*.atlassian.net/browse/PROJ-123`).
- **Confluence page URLs**: any `https://*.atlassian.net/wiki/...` link. Extract the page ID or slug.
- **Deduplicate**: if the same key or URL appears in multiple messages, fetch it once and reuse across all items referencing it.

**How to fetch:**

1. For each unique Jira key: `getJiraIssue(issueIdOrKey: "PROJ-123")`. Extract summary (title), status, assignee, reporter, description (first 300 chars), and the most recent 1 to 2 comments. Discard boilerplate (attachment lists, changelog, etc.).
2. For each unique Confluence URL: `getConfluencePage` with the page ID or slug from the URL. Extract title, space, last-modified date, body (first 500 chars). If the page ID cannot be parsed, skip it and note "Confluence link unresolved" in the briefing.
3. If Atlassian is unavailable, skip this step. Note "Atlassian connector unavailable, links not resolved" once in the briefing. Do not fail the run.

**Attach context to items:** for each queued item, build a `linked_context` packet: a compact bulleted summary of all Jira tickets and Confluence pages referenced in that message or thread. Passed to drafting (step 4) as grounding material alongside the vault lookup.

Example compact format:
```
Linked: PROJ-123 "Webhook retry logic" [In Progress / assigned: Jane Doe], "Investigate why retries are firing twice on..."
Linked: Confluence "Webhook Runbook" [updated 2026-05-15], "Step 1: Validate the endpoint config in..."
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

4. **Already-answered check:** before drafting, confirm the most recent message in the chat (from the `chat_message_search` results or a fresh `read_resource` on the chat) is not from the user. If the user sent the last message in that chat, whether staged earlier by Lore or typed directly in Teams, it is answered: skip drafting, don't list it under Needs You, and drop it or move it to FYI if still worth a mention.
5. For each remaining direct item warranting a response, draft it grounded in vault context and stage it as a file under `outbox/drafts/teams/` (Teams connector is read-only, so no native draft).

#### 3b. Group-chat discussions (summary + knowledge-base prompt)

6. For each group chat with new activity, write a 1 to 3 sentence summary (topic, who is driving it, any conclusion or open question). Do NOT draft a reply. These go in the briefing's "Teams discussions" section.
7. From those summaries, extract **knowledge-base candidates**: decisions reached, status changes on an initiative, new commitments, risks, or facts about a person or project the vault should capture. List each with the chat it came from and the vault note it would land on.
8. **Do not auto-write group-chat candidates** (lower-confidence than direct-thread observations). Instead, prompt the user:
   - **Interactive run:** after presenting summaries, ask "Want me to update the knowledge base with any of these?" and apply only the ones confirmed (additive, via Edit on the entity note).
   - **Scheduled run:** list them in the briefing under "Knowledge base candidates (your call)" with a note that the user can reply "update KB with #1, #3" to apply. Hold until they do.
9. Capture the deep link for each item surfaced (for the HTML brief): build `https://teams.microsoft.com/l/message/<chatId>/<messageId>`. If `chatId` or `messageId` is missing, leave the link empty and the brief shows the item without one. (Teams has no draft-creation tool as of this writing, so this always points to the source message, never a draft; revisit once the connector gains one.)
10. Append processed IDs to `inbox/.teams-processed` for both direct and summarized messages.

### 4. Drafting (all sources)

For every draft, before writing:

1. Identify the people and projects involved. Look them up in the vault: search by name/topic via the vault search or dataview MCP tools, falling back to Grep per `_conventions.md` → Vault access tooling, then Read each relevant person/project note. Cross-reference `context.md` Active Initiatives. **Also include the `linked_context` packet from step 2b** (Jira/Confluence excerpts). Treat linked-resource context as grounding with the same weight as vault notes: it informs the reply but is never quoted verbatim or over-explained to the recipient.
2. Apply terminology corrections from `context.md` silently (see `_conventions.md` → Terminology and glossary).
3. Match voice per VOICE.md and the source-specific section of `context.md`:
   - **Email** drafts follow `## Email Writing Style` in `context.md` (and `outbox/dictation-style-prompt.md` for nuance). No greeting on mid-thread replies, no sign-off, contractions default, hedge opinions / commit on facts, 25 to 120 words for most replies.
   - **Slack and Teams** drafts follow `## Slack & Teams Writing Style` in `context.md` (short, warm, quick affirmation openers, light emoji, same hedging as email). If absent, fall back to: shorter and more casual than email, same warmth markers. Match the register of the incoming message.
4. If a draft would require a decision the user has not made, do not invent it. Draft a holding reply or flag the item in the briefing as "needs your call before I can draft."
5. **Capture the literal drafted text, every time, not just confirmation that a draft was created.** After calling `outlook_create_reply_draft` / `outlook_create_reply_all_draft` / `outlook_create_draft` or `slack_send_message_draft`, paste the exact composed body/message text into the item's report alongside the id/link. A report that says "draft created" or "webLink returned" without the literal string is not sufficient, the orchestrator (and the HTML brief's draft preview) has no way to show the user what was actually said without it. If a sweep is delegated to a sub-agent, this requirement is part of its return contract; a sub-agent report missing literal draft text for any item it says it drafted is incomplete. (Teams drafts already do this correctly, since they're composed as plain text for file staging rather than sent through a create-draft tool; the gap is specific to Outlook and Slack, where the tool call itself can succeed without the literal text ever being echoed back.) See STATE.md, 2026-08-14 afternoon run, for the incident this fixes: two Outlook drafts shipped in a brief with "open the link to review the exact text" instead of the real body, and by the time it was caught interactively, one of the two had already been reviewed and sent by the user, outside the loop, with substantially expanded content the sub-agent never saw.

### 5. Knowledge-base refresh (additive only)

After drafting, capture what the sweep revealed. **Never overwrite. Only append.** If an update would change an existing fact rather than add one, flag it in the briefing for the user to confirm instead of writing it. Decision-log test: `_conventions.md` → Decision-log discipline.

1. **Observations from linked resources (auto-apply when high-confidence):** for any Jira ticket or Confluence page fetched in step 2b, apply without waiting for confirmation (structured, authoritative sources):
   - **Jira status update**: if the ticket is linked to a vault project or person and its status changed, append a dated observation to the project note (e.g., "PROJ-123 moved to Done as of 2026-06-09"). Use Edit, anchored on (inserting after) the last line of the project's `Current Phase` section (Obsidian mode) or the `## Current Phase` block in `projects/[slug].md` (filesystem mode).
   - **New ticket assignee**: if the assignee is a person in the vault, append a brief observation to their person note (e.g., "Assigned PROJ-123 Webhook retry logic").
   - **Confluence page reference**: if relevant to an active project, append a reference line to the project note (e.g., "Confluence: Webhook Runbook, last updated 2026-05-15"). Do not dump the full page body.
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
1. **Voice.** Every draft and the briefing conform to VOICE.md (no em dashes, no banned constructions, length ceilings respected). If `evals/examples/` is present, pull 2 to 3 examples as calibration for the tone judgment.
2. **Traceability.** Every factual claim (name, status, date, number, commitment, decision) traces to a specific source message, linked Jira/Confluence resource, or vault note. Flag any claim with no source.
3. **Already-answered.** For every drafted item, re-check who sent the most recent message in its thread/chat. If it is the user, the draft should not exist: pull it from the briefing and drop the native draft (or flag it prominently if it was already created and can't be un-drafted, e.g. a Slack draft already staged) rather than presenting it as something needing a reply.
4. **HTML brief.** The filled `outbox/briefs/YYYY-MM-DD-HHMM.html` also passes: every claim in it traces to a source item or vault note (same standard as check 2); no `{{TOKEN}}` placeholders remain; every deep link is well-formed for its source type (email: the created draft's `webLink` when a draft exists, else the source message's `webLink` or `outlook.office.com/mail/deeplink/read/`; Slack: the draft's `channel_link` when a draft exists, else the source permalink; Teams: `teams.microsoft.com/l/message/`, always the source message since Teams has no draft) and every anchor carries `target="_blank"` so it opens from the rendered brief, with no invented IDs and no link shown where none was captured; and the tone passes VOICE.md (same 2 to 3 `evals/examples/` calibration). Then confirm the Herald was published as an artifact (step 7.3) after the revision, so the published page carries the final text.

On any fail, revise once addressing the specific gaps the verifier named, then present. Do not loop past one revision; if a gap survives, present with the gap flagged in the briefing for the user's call. Verification signal: `_conventions.md` → Verification loops.

### 7. Output

1. Write the markdown briefing to `outbox/triage/triage-YYYY-MM-DD.md` (append `-HHMM` if a second run lands the same day). Keep this exactly as specified in "Briefing format"; it is the grep-able fallback.
2. Build the HTML brief: read `templates/brief.template.html`, fill every `{{TOKEN}}` from this run (needs-you items in priority order with numbers `01`, `02`, ...; deep links captured during the sweep; drafts inline in the `<details>` block with a one-line grounding note; worth-knowing groups; applied and candidate knowledge-base rows), and write it to `outbox/briefs/YYYY-MM-DD-HHMM.html`, then brand it: `python3 scripts/apply-brand.py outbox/briefs/YYYY-MM-DD-HHMM.html` (no change without a brand pack; `workflows/brand.md`). Never leave a token in the output. Never fabricate a deep link: if an item has no captured link, drop its "Open in ..." anchor entirely. NO EM DASHES.
   - **Masthead title (`{{BRIEF_TITLE}}`):** the brief is titled **The Herald**. If `triage-config.md` records both a morning and an afternoon brief window, a scheduled run titles itself by its window, "The <Weekday> Morning Herald" or "The <Weekday> Afternoon Herald" (by which task fired; before/after noon local as the fallback). With one window or fewer, and for every on-demand run, it stays "The <Weekday> Herald".
3. **Publish the Herald as a claude.ai artifact, every run (hard rule, scheduled runs included).** Make the hosted copy with `python3 scripts/apply-brand.py outbox/briefs/YYYY-MM-DD-HHMM.html --artifact outbox/briefs/YYYY-MM-DD-HHMM.artifact.html --title "<the masthead title>"`, then publish that copy with the Artifact tool (in a cloud session linked to the user's computer, stage the copy first). Each run is its own artifact; never overwrite an earlier day's. The artifact link is the primary deliverable, with the file at `outbox/briefs/` as the local copy and the markdown at `outbox/triage/...` as the plain-text fallback. A file on disk alone is not delivery: on 2026-10-16 a scheduled run wrote only the file and the user could not find the brief. If publishing fails, say so in the summary and the notification, and name the file path instead.
4. Email drafts land natively in Outlook (step 5 of the Email pass); no file needed unless creation failed, in which case save the fallback under `outbox/drafts/email/YYYY-MM-DD-<slug>.md` (recipient, subject, thread link, ready-to-paste body). Save Teams drafts under `outbox/drafts/teams/YYYY-MM-DD-<slug>.md` (Teams connector is still read-only, so it always stages as a file): recipient, the thread/source link, and the ready-to-paste body.
5. Update `inbox/.triage-last-run` to `run_start`.
6. Print a one-paragraph summary to chat with the Herald artifact link (primary) and the markdown briefing path (fallback). On a scheduled run, the notification to the user carries the artifact link too.

## Briefing format

```markdown
# Triage: YYYY-MM-DD HH:MM

📜 *Window: <window_start> to <run_start>. Email: N new / D drafted. Front shared: N new / D drafted. Slack: N new / D drafted. Teams: N new / D drafted.*

## Needs you (drafts ready)

### Email
- **Sender**: "Subject" (HH:MM). What they need. *Native draft created in your Outlook Drafts folder.* [link] (Or, if native draft creation failed: *Draft staged: outbox/drafts/email/<file>.md*.) Through Front: *Private draft created on the Front conversation.* [link]

### Front shared inboxes
- **Inbox name / sender**: "Subject" (HH:MM). Assigned to you or names you. *Private draft created in Front.* [link]

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
- PROJ-123 "Webhook retry logic" [In Progress / Jane Doe], used to draft reply in #channel-name.
- Confluence "Webhook Runbook", used to draft reply in #other-channel.
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
2. **Chat discovery (Slack):** if Slack is the recorded team-chat tool, confirm the Slack connector is present. Resolve the user's own Slack user ID. Use `slack_search_channels` to list channels the user is in. Propose a starter set of project channels by matching channel names against `context.md` Active Initiatives. Let the user confirm or edit.
3. **Chat discovery (Teams):** if Teams is a recorded team-chat tool, confirm the MS365 connector is present. Propose key people to watch from `context.md` team and stakeholders. Note DMs and @mentions are drafted, group chats summarized only.
4. **Email (Outlook):** if Outlook is the recorded email tool: if `email-config.md` exists, reuse it. If not, copy `templates/email-config.template.md` to `email-config.md` and populate it by sampling the inbox (`outlook_email_search`): classify senders into tiers using `context.md` as anchor, identify automated sources and distribution lists. The Email tier framework lives here, so no separate email workflow is needed. If the mailbox is read through Front instead (Microsoft 365 not connected), sample it the same way with `search_conversations` on the personal inbox and `read_message`.
4b. **Front:** if Front is connected, `list_inboxes` and confirm with the user which inboxes to watch: the personal inbox when it carries their mailbox, and any shared inboxes they work. Record the ids under `### Front` in `triage-config.md`. Initialize an empty `inbox/.front-processed`.
5. Copy `templates/triage-config.template.md` to `triage-config.md` and populate it from the discovery above.
6. Initialize empty `inbox/.slack-processed` and `inbox/.teams-processed` (reuse `inbox/.email-processed`). Write the current time to `inbox/.triage-last-run` so the first real run starts incremental.
7. Offer a one-time backlog sweep.
8. Create the scheduled tasks per the Scheduling section below (ask the cadence question; don't just default silently).

## Scheduling (the daily brief cadence)

Every install should end up with at least 1 scheduled triage per weekday so a brief lands without being asked. Onboarding runs this (Phase 7.7); it can also run anytime the user says "schedule my triage" or "put my brief on a schedule."

1. Requires at least one messaging connector (Microsoft 365, Front, or Slack) and a populated `triage-config.md` (run Fresh setup first if missing).
2. Ask the cadence (multiple choice): **Morning brief (recommended)** at 9:00, **Afternoon brief** at 15:00, or **Both**. Offer to adjust the times; use the user's local timezone.
3. Create one scheduled task per chosen slot with the session's scheduled-task tool (Cowork on the desktop: `mcp__scheduled-tasks__create_scheduled_task`; a cloud session or Claude Code: whatever scheduling tool it lists, per `CLAUDE.md` → Harness-neutral by default), weekdays only (cron `0 9 * * 1-5` / `0 15 * * 1-5`), named `triage-morning` / `triage-afternoon`, with exactly this prompt (fill the placeholder):

   > Run Lore's unified triage (scheduled run). Working folder: the Lore workspace at `<absolute path to this repo>`. Read CLAUDE.md and run its session-start checks first, then execute workflows/triage.md end to end for the window since `inbox/.triage-last-run`. That workflow file is the complete spec and this prompt is only a pointer to it, not a summary: do not skip or abbreviate steps it requires, including the designed HTML brief (The Herald) written to outbox/briefs/ on every run and the independent verifier pass before delivery. Draft-and-hold, never send anything on the user's behalf.

   The wording matters: a past incident (2026-07-22, see STATE.md) showed that a schedule prompt which summarizes steps gets treated as permission to skip the ones it doesn't mention.
4. Record the chosen cadence in `triage-config.md` (e.g. `Brief windows scheduled: morning + afternoon`). The brief's masthead title depends on it: with both windows scheduled, briefs are titled "The <Weekday> Morning Herald" / "The <Weekday> Afternoon Herald"; with one, just "The <Weekday> Herald". Keep this line in sync whenever the schedule changes. (These must match step 7.2 exactly. They said "Brief" until 2026-09-22, which contradicted 7.2 and made the 2026-09-21 verifier flag a correct masthead as a CLAUDE.md violation.)
5. Confirm to the user what was scheduled and when the first brief will land. Mention "triage everything" works on demand anytime, and that they can say "change my brief schedule" later (edit with the same scheduling tool's update call, then update the config line). A scheduled run must be able to reach the Lore folder; if the only scheduler available runs somewhere that can't, say so and offer on-demand "triage everything" instead.

## Outputs

- `outbox/triage/triage-YYYY-MM-DD.md`: per-run markdown briefings (plain-text fallback).
- `outbox/briefs/YYYY-MM-DD-HHMM.html`: per-run designed HTML brief, titled The Herald, filled from `templates/brief.template.html`; its hosted copy is published as a claude.ai artifact every run (the primary deliverable, step 7.3).
- `outbox/triage/triage-backlog-YYYY-MM-DD.md`: one-time backlog briefing.
- `outbox/drafts/teams/`: staged paste-ready drafts (Teams only; email and Slack create native drafts directly, see below). `outbox/drafts/email/` is now a fallback path only, used when native Outlook draft creation fails.
- Native Outlook drafts in the user's Drafts folder.
- Native Slack drafts in the user's "Drafts & Sent."
- Private Front drafts on the conversations they answer.
- Additive vault updates (observations, decisions), each listed in the briefing.
- `inbox/.slack-processed`, `inbox/.teams-processed`, `inbox/.email-processed`, `inbox/.front-processed`, `inbox/.triage-last-run`: state tracking.
- `triage-config.md` (root): created on first setup; edited by the user as scope evolves.

## A few non-obvious rules

- **Never send.** Slack drafts use `slack_send_message_draft`, never `slack_send_message` or `slack_schedule_message`. Email drafts use `outlook_create_reply_draft` / `outlook_create_reply_all_draft` / `outlook_create_draft`, never `outlook_send_draft` or `outlook_send_mail`. Teams stays staged as files (its connector is still read-only for writes).
- **Front: drafts only, no side effects.** Front writes carry the user's name. Use `create_draft` (private, `shared = false`) and nothing else: never `send_message`, `update_conversation_status`, `assign_conversation`, `tag_conversation`, `move_conversation` or `add_comment`.
- **Never draft a reply to yourself.** If the most recent message in a thread, email conversation, or chat is already from the user, whether sent through a Lore draft or straight from the client, the item is answered. Check the actual last message in the thread before drafting, not just the message that matched the scan; a stale search result can point at a message the user has since replied to. See the Already-answered rule above and the per-pass checks in each source's procedure.
- **Processed trackers are append-only.** Never rewrite or sort. To reprocess an item, the user removes its specific line (or asks Lore to).
- **Link enrichment is best-effort.** Never block a draft waiting for a link; note the failure once and continue.
- **Scope creep check.** If the FYI section grows large run after run, tighten the project-channel list or scope rules in `triage-config.md`.
