# Email Triage

Daily incremental inbox processing for inbox-zero discipline. Generic across users; all user-specific data lives in `email-config.md` at the workspace root.

## When to invoke

- User says: "triage my email", "process my inbox", "what's new in email", "inbox briefing", "anything urgent in email"
- Scheduled task runs (typically daily at noon)
- After a meeting block when the user asks for an inbox check

## Fresh-install detection (first step every invocation)

Before doing anything else, check whether `email-config.md` exists at the workspace root.

- If **present**: load it, then continue with normal triage.
- If **missing**: this user has not set up email triage yet. Run the "Fresh setup" procedure below.

## Inputs read each run

1. `context.md`: provides the user's team, boss, key stakeholders, and active initiatives. The agent uses these structural sections (`## My Team`, `## Key Stakeholders`, `Reports to`, `## Active Initiatives`) to anchor Tier 1 categorization.
2. `email-config.md` (root): operational filter data: sender lists, distribution lists, automated sources, partner mappings, Outlook folder names, mail folder path.
3. `inbox/.email-processed`: append-only flat file of Message-IDs already processed. One ID per line, brackets included.
4. The user's mail folder: path is recorded in `email-config.md` under `## Mail Folder Path`.

### Mail folder path resolution

The path stored in `email-config.md` is in user-space form (e.g., `~/Library/Mail/V10/<uuid>/Inbox.mbox/`). The agent runs in a sandbox where user folders are mounted under `/sessions/<session-id>/mnt/<mount-name>/`. To resolve a user-space path to a bash-accessible path:

1. Find the corresponding mount in the agent's system prompt under the "Shell access" section (each session lists its mounts and their sandbox paths).
2. Substitute the user-space prefix with the sandbox prefix.

For this to work, the user must have the folder containing their Mail data (typically `~/Library/Mail`) mounted in Cowork.

#### Resolution procedure

Each run, resolve the inbox path with this two-step logic:

**Step 1: Try the stored path.** Translate the `## Mail Folder Path` value from `email-config.md` to the sandbox path. If the resulting `Inbox.mbox/` directory exists and contains a `Messages` subtree with at least one `.emlx` file, use it. Done.

**Step 2: Fall back to auto-detect.** If step 1 fails (path missing, no `.emlx` files, or `## Mail Folder Path` is empty), auto-detect:

1. Translate `## Mail Mount Root` from `email-config.md` to a sandbox path (default: `~/Library/Mail/` translated to the Mail mount). If the mount root isn't reachable, abort and write "mail folder not reachable" to the briefing.
2. List `V*` directories under the mount root. Pick the one with the highest version number (e.g., `V11` over `V10`).
3. List UUID-shaped subdirectories (8-4-4-4-12 hex pattern). Skip `MailData`, anything starting with `OrphanedAccount`, and anything that doesn't match the UUID shape.
4. For each candidate, check whether `Inbox.mbox/` exists with `.emlx` files inside. Drop candidates that fail.
5. If `## Preferred Account Domain` is set in `email-config.md`, narrow candidates: read the To: header of the most recent `.emlx` in each candidate's Inbox and prefer those where the To: address ends in that domain.
6. From remaining candidates, pick the one whose most recent `.emlx` has the most recent mtime (the actively-syncing account).
7. Use the resolved path for this run, AND surface a note in the briefing: `Mail Folder Path in email-config.md is stale or empty. Auto-detected: <new path>. Update email-config.md to make this permanent.`

The workflow does NOT auto-write the new path to `email-config.md`. Always let the user confirm before changing config.

#### When auto-detect helps

- **Fresh install for a new user.** They mount `~/Library/Mail/` but haven't written a `## Mail Folder Path` yet. Auto-detect finds it on first run.
- **Account rebuild.** User removes and re-adds the Exchange account in Mac Mail; the account UUID changes. The stored path goes stale; auto-detect finds the new UUID.
- **macOS Mail version bump.** When Apple changes `V10` to `V11`, auto-detect picks up the new version directory.
- **Migration to a new Mac.** The Mail account UUID is regenerated on the new machine.

#### Limitations

- If the user has multiple Exchange/IMAP accounts mounted and `## Preferred Account Domain` is not set, the "most recently modified" heuristic might pick the wrong one. Setting the preferred domain disambiguates.
- Auto-detect requires the user-space Mail folder to be mounted in Cowork. If it isn't, neither the stored path nor auto-detect can work, and the workflow writes a graceful "mail folder not reachable" note to the briefing.

## The framework

Three tiers, eight categories. Each category has a default action rule. The tiers map to how much attention each email warrants.

### Tier 1: Active inbox (deserves real attention)

**1. Direct asks from team or boss.** Sender is in `context.md` `## My Team` or is the user's `Reports to`, OR is listed under `## Tier 1 Direct Senders` in `email-config.md`. The user is on the To: line. Email contains a question, request, decision, or "need your input" signal.
*Default rule: reply same day if under 2 minutes; otherwise queue for a reply block within 24h.*

**2. Cross-functional asks and decisions.** Sender is in `context.md` `## Key Stakeholders` or `## Tier 1 Cross-Functional Senders` in `email-config.md`. Direct ask of the user.
*Default rule: same as #1. If the reply would exceed a paragraph, schedule a 10-min sync instead of writing prose.*

**3. Active project threads.** Sender or thread relates to an entry in `context.md` `## Active Initiatives`, typically via a mapping in `email-config.md` `## Tier 1 Project Partners`.
*Default rule: read fully; reply if the user is the bottleneck; snooze if waiting on someone else; move to a project folder once the next step is queued.*

### Tier 2: Scan tier (read but don't react)

**4. Internal FYI and leadership updates.** Forwards from leadership, weekly-update emails, distribution-list traffic (matched against `email-config.md` `## Distribution Lists`).
*Default rule: 30-second scan, archive. If reading one of these took over 2 minutes, the user went too deep.*

**5. HR, surveys, and admin.** HR senders, survey platforms (Qualtrics et al.), CapEx cycles, performance feedback assessments, recognition platforms.
*Default rule: batch on a weekly 15-min block. Surveys: do once, archive the entire reminder chain.*

### Tier 3: Filter to folder (rules do the work)

**6. Operations and case routing.** Domain-specific routing (e.g., CRM case assignments routed to the user as backup, support-system Chatter mentions). Listed in `email-config.md` `## Automated Sources` with type `ops`.
*Default rule: Outlook rule to a dedicated ops folder; daily 30-second scan; reply only if backup is actually needed.*

**7. System alerts and incident notifications.** Monitoring alerts, status updates, support-ticket auto-replies. Listed in `email-config.md` `## Automated Sources` with type `alert`.
*Default rule: Outlook rule to an "Alerts" folder; weekly bulk-archive; check only during an active incident.*

**8. Calendar and vendor noise.** Calendar replies whose subject begins with "Accepted:" / "Declined:" / "Tentative:" / "Canceled:" / "Updated:"; vendor marketing, newsletters, demo follow-ups (listed in `email-config.md` `## Automated Sources` with type `noise`).
*Default rule: Outlook rule to a "Noise" folder or auto-delete; unsubscribe aggressively from vendor lists.*

## Categorization logic

For each email, apply these rules in order. Stop at the first match.

1. Subject begins with `Accepted:`, `Declined:`, `Tentative:`, `Canceled:`, `Cancelled:`, or `Updated:` → **Category 8** (calendar noise).
2. Sender email matches `## Automated Sources` in `email-config.md` → **Category 6, 7, or 8** per the `type` tag in config.
3. Sender email is in `## Tier 1 Direct Senders` of `email-config.md` (or matches inferred email for a person in `context.md` `## My Team` / `Reports to`):
   - User on To: → **Category 1**
   - User only on CC: → **Category 4**
4. Sender email is in `## Tier 1 Cross-Functional Senders` of `email-config.md` (or matches a person in `context.md` `## Key Stakeholders`):
   - User on To: → **Category 2**
   - User only on CC: → **Category 4**
5. Sender email is in `## Tier 1 Project Partners` of `email-config.md` → **Category 3**.
6. Distribution-list match in To: against `## Distribution Lists` of `email-config.md` → **Category 4**.
7. Sender domain matches the user's company domains (`## Company Domains` in `email-config.md`) and not matched above:
   - User on To: → **Category 1** (other internal direct ask)
   - Else → **Category 4**
8. External sender not matched anywhere → **Category 4** (conservative default; flag as "unclassified" in the briefing so the user can promote/demote on review).

## The procedure

### Daily incremental mode (scheduled or invoked)

1. Read `context.md` and `email-config.md`. Resolve the inbox path using the "Resolution procedure" above (stored path, then auto-detect fallback). If neither succeeds, write a brief "mail folder not reachable" note to the briefing and exit cleanly.
2. Walk the inbox folder; for each `.emlx` file, parse the `Message-ID` header.
3. Build the set of new Message-IDs = all IDs found minus the contents of `inbox/.email-processed`.
4. For each new email, parse `From`, `To`, `Cc`, `Subject`, `Date`. Optionally read the first ~500 chars of the plain-text body for short summarization.
5. Apply the categorization logic above.
6. Produce a briefing file: `outbox/email-triage-YYYY-MM-DD.md` (overwrite if multiple runs same day, append a HH-MM suffix if needed).
7. Append the new Message-IDs to `inbox/.email-processed`.
8. Print a one-paragraph summary to chat and link the briefing file.

### Backlog mode (one-time, user invokes manually)

User says: "process my email backlog" or "do a one-time inbox cleanup".

1. Same scan as daily mode, but ignore `.email-processed` (process every email currently in the inbox).
2. Output to: `outbox/email-backlog-triage-YYYY-MM-DD.md`.
3. Do **not** automatically add anything to `inbox/.email-processed`. After the user reviews the briefing, they decide whether to mark the backlog as "seen" (in which case the agent appends all those IDs to `.email-processed`).
4. Do **not** push to action items automatically; produce a list the user can selectively accept.

### Daily run when invoked from a scheduled task

The scheduled task fires; the agent loop runs this workflow in daily incremental mode. The briefing is saved to `outbox/`. If `notifyOnCompletion` is true on the task, the user is notified that the briefing is ready.

## Briefing format

```markdown
# Email Triage: YYYY-MM-DD HH:MM

📜 *Since last run: N new emails. Inbox currently holds M total.*

## Tier 1: Action needed (N items)

### Direct asks from team or boss
- **Sender Name**: "Subject" (HH:MM). One-line summary of what they need. *Action: <verb>.*

### Cross-functional asks
- ...

### Active project threads
- ...

## Tier 2: Scan and archive (N items)
N items in this tier. Worth a 30-second glance:
- (optional 1-2 standouts)

## Tier 3: Filtered (N items)
- N system alerts → suggest filing to <folder name from config>
- N calendar replies → <folder>
- N ops/case routing → <folder>
- N vendor marketing → <folder>

## Unclassified (N items)
Senders not yet in `email-config.md`. Review and promote/demote:
- **sender@domain**: "Subject"

- 📜 Lore
```

## Action items integration (opt-in)

For Tier 1 items, the workflow does NOT auto-push to the action items artifact. Instead, the briefing flags candidates and the user can say "push the Tier 1 items to action items" to trigger the standard add-operation flow per `workflows/action-items.md`. This avoids duplication when a thread is already tracked elsewhere.

## Meeting-heavy day mode

When the user's calendar is packed (signaled by the user, or detected via context), the briefing should:
- Expand only Tier 1; collapse Tier 2 and Tier 3 to counts.
- Suggest a 2-minute mobile sweep between meetings: scan Tier 1 subjects only, pick the single most urgent.
- Suggest an end-of-day 15-min reply block for the rest.

## Fresh setup (first invocation when `email-config.md` is missing)

1. Greet the user with the signet (📜). Briefly explain: email triage is being set up for the first time; the agent needs to learn the user's email patterns.
2. **Auto-detect the inbox.** Check whether a Mail folder is mounted. Look for a mount whose user-space path is `~/Library/Mail/` (or sub-path). Run the auto-detect procedure (see "Mail folder path resolution" above) to find the active Inbox.mbox.
3. **If auto-detect succeeds:**
   - Sample the most recent ~200-300 emails (or all of inbox if smaller).
   - Classify senders into proposed categories using `context.md` as the anchor for team / stakeholders.
   - Identify automated sources (senders with `noreply`, `alerts`, `no-reply`, `notifications`, `support`, vendor-pattern locals).
   - Detect distribution lists (To: addresses that look like aliases, ending in `all`, `team`, `everyone`, `announce`, etc.).
   - Detect the user's primary email address by inspecting the To: header of recent inbound emails.
   - Write a populated `email-config.md` based on the scan. Include the auto-detected path under `## Mail Folder Path`, the mount root under `## Mail Mount Root`, and the user's primary email domain under `## Preferred Account Domain`.
4. **If auto-detect fails:**
   - If the Mail folder isn't mounted, ask the user to mount it (`~/Library/Mail/`) and re-invoke.
   - If the mount is present but no Inbox.mbox was found (e.g., they don't use Mac Mail), copy `templates/email-config.template.md` to `email-config.md` and ask the user to fill in the path manually.
5. Pre-populate `inbox/.email-processed` with the Message-IDs of all emails currently in the user's inbox, so the next run starts incremental from the current state.
6. Offer to generate a one-time backlog triage briefing (`outbox/email-backlog-triage-YYYY-MM-DD.md`) covering everything currently in the inbox.
7. Offer to create a scheduled task (`mcp__scheduled-tasks__create_scheduled_task`) for the user's preferred daily time. Default suggestion: noon local time.

## Outputs

- `outbox/email-triage-YYYY-MM-DD.md`: daily incremental briefings
- `outbox/email-backlog-triage-YYYY-MM-DD.md`: one-time backlog briefing
- `inbox/.email-processed`: Message-ID tracking, append-only
- `email-config.md` (root): created on first setup; updated by the user as patterns evolve

## A few non-obvious rules

- **Never delete emails** or move them programmatically. The agent has read-only access to the mail folder. All actions are taken by the user in their mail client based on the briefing.
- **The `.email-processed` file is append-only.** Never rewrite or sort it; just append new IDs. If the user wants to reprocess a specific email, they remove that specific line manually (or ask the agent to do so).
- **Unclassified senders are normal.** The first few weeks of using this workflow will produce a steady stream of "unclassified" entries as the user encounters new correspondents. Each one is a chance to update `email-config.md`.
- **Outlook rules do the heavy lifting for Tier 3.** The agent's job is to *recommend* the rules to set up; the user creates them in Outlook. Once rules are in place, Tier 3 emails are pre-filtered out of the inbox and the agent's briefing should report near-zero Tier 3 counts. If Tier 3 counts stay high week after week, the rules need updating.
- **No em dashes.** Per CLAUDE.md global rule.
