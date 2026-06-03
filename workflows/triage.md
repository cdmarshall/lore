# Unified Triage (Email + Slack + Teams)

Multi-source, draft-and-hold triage. Each run sweeps Outlook email, Slack, and Microsoft Teams for items that need the user's attention, drafts responses grounded in the Obsidian knowledge base, and never sends anything to another person automatically. The user reviews drafts and hits send.

This workflow is generic across users. All user-specific data lives in `triage-config.md` at the workspace root (created on first run) and in `context.md`. It is the single triage entry point for the workspace: it replaces the older Mac Mail `email-triage.md` workflow and sources email directly from the Microsoft 365 connector. It defines its own email tier framework (see "Email tier framework" below) and reads sender lists from `email-config.md` when present.

## Design principles

- **Draft-and-hold.** The workflow produces drafts only. It never sends a message, email, or Teams reply on the user's behalf. Slack drafts are created natively (they land in the user's "Drafts & Sent"); email and Teams drafts are staged as paste-ready files because those connectors are read-only.
- **Vault is the brain.** Every draft is grounded in the Obsidian vault (people, projects, decisions) plus `context.md` initiatives, and matches the user's documented writing voice.
- **Additive knowledge refresh only.** After drafting, the workflow may append observations to vault notes and log clearly-stated decisions. It appends; it never overwrites. Every knowledge-base write is listed in the briefing.
- **Incremental.** Each run only looks at activity since the last run, using per-source processed trackers and a last-run timestamp. Threads with no new messages are skipped entirely.

## Connector dependencies

This workflow requires three connectors. Tool names below are the logical names; the actual MCP server prefix differs per install, so resolve each tool by its suffix.

| Source | Connector | Capability | Tools used |
|--------|-----------|------------|------------|
| Email | Microsoft 365 | Read-only | `outlook_email_search`, `read_resource` |
| Teams | Microsoft 365 | Read-only | `chat_message_search`, `read_resource` |
| Slack | Slack | Read + write (drafts) | `slack_search_users`, `slack_search_channels`, `slack_search_public_and_private`, `slack_read_channel`, `slack_read_thread`, `slack_read_user_profile`, `slack_send_message_draft` |
| Knowledge base | Obsidian | Read + write | `obsidian_search_notes` (mode: "text" or "jsonlogic"), `obsidian_get_note`, `obsidian_patch_note`, `obsidian_append_to_note`, `obsidian_manage_frontmatter` |

If a connector is missing at run time, skip that source, note it in the briefing, and continue with the others. Do not fail the whole run because one source is unavailable.

## When to invoke

- User says: "triage everything", "run my triage", "what needs me across email, Slack, and Teams", "catch me up", "any drafts waiting".
- Scheduled task fires (default: twice on weekdays, morning and mid-afternoon).
- After time away, in backlog mode (see below).

## Fresh-install detection (first step every invocation)

Before doing anything else, check whether `triage-config.md` exists at the workspace root.

- If **present**: load it, then continue with normal triage.
- If **missing**: this user has not set up unified triage yet. Run the "Fresh setup" procedure at the bottom of this file, then continue.

## Inputs read each run

1. `context.md`: team, boss, key stakeholders, active initiatives, terminology corrections, and the **Email Writing Style** section (the voice all drafts must match).
2. `triage-config.md` (root): per-source scope. Slack project channels (name + ID), Teams key people, email tier overrides, the user's own Slack user ID, and the scope rules.
3. `email-config.md` (root), if present: reuse its sender lists and tier framework for the email pass.
4. Processed trackers in `inbox/`: `.slack-processed`, `.teams-processed`, `.email-processed` (append-only; one ID per line).
5. `inbox/.triage-last-run`: ISO 8601 timestamp of the previous run. If absent, default the window to the last 24 hours and note it in the briefing.
6. The Obsidian vault under the configured subfolder (read from `context.md` → "Notes for Lore" → "Vault Configuration"; default is `Lore/` if no override is set. Substitute that value for any `Lore/<path>` references in this workflow).

## What counts as "needs attention"

Per the user's scope preference. Outlook always uses the Email tier framework defined below.

**Slack and Teams: items that need a response (draftable).**

- **Direct messages** to the user (1:1 conversations).
- **@mentions** of the user, in any channel or chat.
- **Configured project channels** (Slack, from `triage-config.md`), where there are new messages in the window.
- **Active threads the user has previously posted in** that have NEW replies since the last run.

**Teams group chats: summarize, do not draft.**

Multi-person Teams chats (3+ participants) where the user is NOT @mentioned are treated as discussion to be aware of, not items to answer. The user does not need to respond to every message in a busy group chat. For these, produce a short summary per chat instead of drafting replies, and extract knowledge-base candidates (see step 3b). The same applies to busy Slack channels that are informational rather than project-critical.

**Distinguishing the two (Teams):** the search API does not return participant counts or @mention flags, and sender email is null, so classify by the **chat ID pattern** plus a content scan:

- `19:...@unq.gbl.spaces` = 1:1 DM → draftable.
- `19:meeting_...@thread.v2` = meeting side-chat → group, summary-only unless the user is @mentioned.
- `19:<hex>@thread.v2` = group chat → summary-only unless the user is @mentioned.
- @mention detection: scan message content for the user's name/mention; a mention promotes any chat to draftable.
- Exclude messages authored by the user when deciding what needs a reply; use them only to mark threads the user has participated in.

**Skip rule:** a thread, channel, or chat with no new messages since the last processed marker is ignored. Do not draft or summarize stale conversations.

## Email tier framework

Applied to each new email. Stop at the first matching categorization rule. Anchored on `context.md` (My Team, Reports to, Key Stakeholders, Active Initiatives) and `email-config.md` sender lists when present.

**Tier 1 (act, draft a reply):**

1. **Direct asks from team or boss.** Sender is in `context.md` My Team or is the user's Reports to, or in `email-config.md` Tier 1 Direct Senders. User on To. Contains a question, request, or decision.
2. **Cross-functional asks and decisions.** Sender is in `context.md` Key Stakeholders or `email-config.md` Tier 1 Cross-Functional Senders, with a direct ask. If a reply would run past a paragraph, suggest a short sync instead of long prose.
3. **Active project threads.** Sender or thread maps to a `context.md` Active Initiative (via `email-config.md` Tier 1 Project Partners). Reply if the user is the bottleneck; otherwise note who it is waiting on.

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

1. Run fresh-install detection. Load `context.md`, `triage-config.md`, and `email-config.md` (if present).
2. Read `inbox/.triage-last-run`. Set `window_start` to that timestamp (or now minus 24h if absent). Record `run_start = now`.
3. Detect available connectors. For any missing, mark its source "unavailable" and skip it.
4. Resolve the active vault subfolder from `context.md`.

### 1. Email pass (Outlook, via MS365 connector)

1. `outlook_email_search` with `afterDateTime = window_start`, `order = newest`, `folderName = Inbox`. Page through results.
2. Drop any email whose `Message-ID` is already in `inbox/.email-processed`.
3. For each new email, parse From, To, Cc, Subject, Date. Pull the body with `read_resource` on the returned URI when a draft is likely.
4. Categorize using the Email tier framework above (Tier 1 direct/cross-functional/project; Tier 2 scan; Tier 3 filtered).
5. For Tier 1 items that need a reply and where the user is the bottleneck: draft a reply (see "Drafting" below). Stage it as a file.
6. Append processed Message-IDs to `inbox/.email-processed`.

### 2. Slack pass

1. Resolve the user's own Slack user ID from `triage-config.md` (or `slack_read_user_profile` / the logged-in user on first run).
2. **DMs and mentions:** use `slack_search_public_and_private` to find activity since `window_start`. The reliable queries are `<user's name> after:<date>` (catches @mentions and channel activity involving the user) and `to:me after:<date>` (DMs). Do NOT rely on `slack_search_channels` for discovery; channel-name search is unreliable.
   - **Apply the ignore list** from `triage-config.md`: skip the Jira bot and its DM, the Outlook Calendar bot, the refinement story bot, and bot messages generally unless they @mention the user. These flood `to:me` and add no action.
3. **Project channels:** for each channel ID in `triage-config.md`, `slack_read_channel` for messages after `window_start`. Treat this list as a watch-list, not a boundary: it is a cache of known channels, not the limit of what gets triaged.
4. **Discover new channels every run (do not rely only on the seed):** the activity search in step 2 surfaces messages from any channel where the user is mentioned or active, including channels not in `triage-config.md`. Any such channel is in scope this run regardless of whether it is configured. After the sweep, compare the set of channels seen against the configured watch-list:
   - **New channel with a direct mention or DM** → triage it now, and append it to the `### Project channels to watch` table in `triage-config.md` (additive write, with a best-guess linked initiative), so the config stays current.
   - **New channel with only ambient activity** (no mention) → list it under "New channels detected" in the briefing for the user to confirm before adding. Do not add it silently.
   - Never remove channels from the config automatically; the user prunes that list.
5. **Participated threads with new replies:** for threads surfaced above (or tracked from prior runs), `slack_read_thread` and keep only those with replies newer than the last processed `ts` for that thread. Skip threads with nothing new.
6. Drop any message whose `ts` is already in `inbox/.slack-processed`.
7. For each item that warrants a response, draft it grounded in vault context, then create a **native Slack draft** with `slack_send_message_draft` (set `thread_ts` for thread replies; use the user's ID as `channel_id` for DM drafts).
   - Constraint: only one attached draft is allowed per channel. If `slack_send_message_draft` returns `draft_already_exists`, do not overwrite. Stage that reply in the briefing file instead and flag it.
   - The native draft is created for the user to review and send from Slack. The workflow never sends; if the inline send fails, the draft still lives in the user's Slack "Drafts & Sent" to send manually.
8. Append processed `ts` values to `inbox/.slack-processed`.

### 3. Teams pass (via MS365 connector)

1. `chat_message_search` with `afterDateTime = window_start`. Page through results. Pull key people from `triage-config.md`.
2. Drop any message whose ID is already in `inbox/.teams-processed`.
3. Group the remaining messages by `chatId`. Classify each chat by the chat-ID pattern above:
   - **1:1 DM** (`...@unq.gbl.spaces`) → direct.
   - **@mention of the user** in any chat (content scan) → direct.
   - **New reply in a chat the user has posted in before** → direct.
   - **Group or meeting chat** (`...@thread.v2`, `meeting_...@thread.v2`) with no @mention → group discussion (summary-only).

#### 3a. Direct items (draftable)

4. For each direct item that warrants a response, draft it grounded in vault context and stage it as a file under `outbox/drafts/teams/` (Teams connector is read-only, so no native draft).

#### 3b. Group-chat discussions (summary + knowledge-base prompt)

5. For each group chat with new activity, write a 1 to 3 sentence summary of what is being discussed (topic, who is driving it, any conclusion or open question). Do NOT draft a reply. These go in the briefing's "Teams discussions" section.
6. From those summaries, extract **knowledge-base candidates**: decisions reached, status changes on an initiative, new commitments, risks, or facts about a person or project that the vault should capture. List each candidate with the chat it came from and the vault note it would land on.
7. **Do not auto-write group-chat candidates** (they are lower-confidence than direct-thread observations). Instead, prompt the user:
   - **Interactive run:** after presenting the summaries, ask directly, "Want me to update the knowledge base with any of these?" and apply only the ones the user confirms (additive, via `obsidian_patch_note`).
   - **Scheduled run:** list the candidates in the briefing under "Knowledge base candidates (your call)" with a note that the user can reply "update KB with #1, #3" to apply them. Hold until they do.
8. Append processed IDs to `inbox/.teams-processed` for both direct and summarized messages.

### 4. Drafting (all sources)

For every draft, before writing:

1. Identify the people and projects involved. Look them up in the vault: `obsidian_search_notes` (mode: "text") by name/topic, then `obsidian_get_note` for each relevant person/project note. Cross-reference `context.md` Active Initiatives.
2. Apply terminology corrections from `context.md` silently (e.g., normalize "Omsite" variants).
3. Match voice:
   - **Email** drafts follow the `## Email Writing Style` section of `context.md` exactly (and `outbox/dictation-style-prompt.md` for nuance). No greeting on mid-thread replies, no sign-off, contractions default, hedge opinions / commit on facts, 25 to 120 words for most replies.
   - **Slack and Teams** drafts follow the `## Slack & Teams Writing Style` section of `context.md` (short, warm, quick affirmation openers, light emoji, same hedging as email, zero em dashes). If that section is absent, fall back to: shorter and more casual than email, same warmth markers, no em dashes. Match the register of the incoming message.
4. **No em dashes anywhere.** Hard rule. Use commas, parentheses, or a sentence break.
5. If a draft would require a decision the user has not made, do not invent it. Draft a holding reply or flag the item in the briefing as "needs your call before I can draft."

### 5. Knowledge-base refresh (additive only)

After drafting, capture what the sweep revealed:

1. **Observations:** new, durable facts about a person or project (a status change, a commitment someone made, a risk surfaced). Write once, on the entity's own note, never elsewhere.
   - **Obsidian mode:** append to the relevant vault note with `obsidian_patch_note` using `target: {"type": "path", "path": "Lore/People/<Name>.md"}` and `section: {"type": "heading", "target": "Observations"}` (or `"Current Phase"` for projects), `operation: "append"`.
   - **Filesystem mode:** append to `team/[name].md` or `stakeholders/[name].md` for person observations; append a dated block to `projects/[slug].md` under `## Current Phase` for project updates. Run the standard two-step existence check before writing.
2. **Decisions:** if a thread contains a clearly-stated decision, log it. In Obsidian mode, create a note under `<vault>/Decisions/` using the decision frontmatter schema. In filesystem mode, append to `decisions/log.md` using `templates/decision-log-entry.template.md`.
3. **Never overwrite.** Only append. If an update would change an existing fact rather than add one, flag it in the briefing for the user to confirm instead of writing it.
4. List every knowledge-base write in the briefing so the user can see what changed.

### 6. Output

1. Write the briefing to `outbox/triage-YYYY-MM-DD.md` (append `-HHMM` if a second run lands the same day).
2. Save staged email drafts under `outbox/drafts/email/YYYY-MM-DD-<slug>.md` and Teams drafts under `outbox/drafts/teams/YYYY-MM-DD-<slug>.md`. Each staged draft file includes the recipient, subject (email), the thread/source link, and the ready-to-paste body.
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

## Knowledge base candidates (your call)
- #1 From <Teams group chat>: <candidate fact/decision> → would append to [[Project]]. Reply "update KB with #1" to apply.
- #2 ...

- 📜 Lore
```

## Backlog mode (one-time, user invokes)

User says: "triage my backlog" or "catch me up on everything I missed."

1. Same sweep, but widen the window (ask the user how far back, default 7 days) and ignore the processed trackers.
2. Output to `outbox/triage-backlog-YYYY-MM-DD.md`.
3. Do NOT append to the processed trackers automatically. After the user reviews, they decide whether to mark the backlog as seen.
4. Be conservative with drafting in backlog mode: produce drafts for clear Tier 1 items only; list the rest for the user to selectively request.

## Action items integration (opt-in)

The workflow does NOT auto-push to the action items artifact. The briefing flags candidates; the user can say "push these to action items" to trigger the standard add-operation flow in `workflows/action-items.md`. This avoids duplicating items already tracked elsewhere.

## Fresh setup (first invocation when `triage-config.md` is missing)

1. Greet with the signet (📜). Explain that unified triage is being set up for the first time.
2. **Slack discovery:** confirm the Slack connector is present. Resolve the user's own Slack user ID. Use `slack_search_channels` to list channels the user is in. Propose a starter set of project channels by matching channel names against `context.md` Active Initiatives (lead intelligence, Omsite, carrier integrations, voice agent, etc.). Let the user confirm or edit.
3. **Teams discovery:** confirm the MS365 connector is present. Propose key people to watch from `context.md` team and stakeholders. Note that DMs and @mentions will be drafted, while multi-person group chats will be summarized only.
4. **Email:** if `email-config.md` already exists, reuse it. If not, copy `templates/email-config.template.md` to `email-config.md` and populate it by sampling the inbox (`outlook_email_search`): classify senders into tiers using `context.md` as the anchor, and identify automated sources and distribution lists. The Email tier framework lives in this file, so no separate email workflow is needed.
5. Copy `templates/triage-config.template.md` to `triage-config.md` and populate it from the discovery above.
6. Initialize empty `inbox/.slack-processed` and `inbox/.teams-processed` (and reuse `inbox/.email-processed`). Write the current time to `inbox/.triage-last-run` so the first real run starts incremental.
7. Offer to run a one-time backlog sweep.
8. Offer to create the scheduled tasks (default: weekdays, morning and mid-afternoon).

## Outputs

- `outbox/triage-YYYY-MM-DD.md`: per-run briefings.
- `outbox/triage-backlog-YYYY-MM-DD.md`: one-time backlog briefing.
- `outbox/drafts/email/`, `outbox/drafts/teams/`: staged paste-ready drafts.
- Native Slack drafts in the user's "Drafts & Sent."
- Additive vault updates (observations, decisions), each listed in the briefing.
- `inbox/.slack-processed`, `inbox/.teams-processed`, `inbox/.email-processed`, `inbox/.triage-last-run`: state tracking.
- `triage-config.md` (root): created on first setup; edited by the user as scope evolves.

## A few non-obvious rules

- **Never send.** This workflow drafts and holds. No message, email, or Teams reply goes out without the user clicking send. Slack drafts use `slack_send_message_draft`, never `slack_send_message` or `slack_schedule_message`.
- **One Slack draft per channel.** The connector allows only one attached draft per channel. On `draft_already_exists`, stage the reply in the briefing rather than overwriting the user's existing draft.
- **Processed trackers are append-only.** Never rewrite or sort them. To reprocess an item, the user removes its specific line (or asks Lore to).
- **Skip stale threads.** A thread with no new messages since its last processed marker gets no draft and no briefing line.
- **Read-only on email and Teams.** The MS365 connector cannot create drafts or send. Email and Teams drafts are always staged as files.
- **Additive vault writes only.** Observations and decisions are appended. Changing an existing fact requires user confirmation, surfaced in the briefing.
- **No em dashes.** Per CLAUDE.md global rule, in every draft and in the briefing.
- **Scope creep check.** If the briefing's FYI section grows large run after run, the project-channel list or scope rules in `triage-config.md` need tightening.
