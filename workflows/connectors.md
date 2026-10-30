# Connectors: what the user works in, and what Lore can reach

All output follows VOICE.md.

Lore does not assume a tool stack. It asks what the user works in, one **role** at a time, checks which of those tools this session can already reach, wires the reachable ones into `context.md`, and points the user at connecting the rest. Onboarding runs this as Phase 6; the user can rerun it anytime.

> **Trigger phrases**: "check my connectors", "what can you reach", "I connected <tool>", "I switched email / chat / tracker", "rescan my tools". Also run the detection steps (not the interview) whenever a workflow needs a role whose connector is recorded as connected but isn't in this session.

## Roles

Ask about roles, never about vendors. The examples are only prompts for the user's memory; any tool is a valid answer.

| Role | Question to ask | What it unlocks in Lore | Common answers |
|---|---|---|---|
| **Email** | "What do you use for email?" | Triage email pass and native reply drafts; Herald | Outlook (Microsoft 365), Gmail (Google Workspace) |
| **Team chat** | "Where does your team chat day to day?" | Triage chat pass and drafts; KB sweeper | Slack, Microsoft Teams, Google Chat |
| **Calendar** | "Which calendar should I read for your day?" | Morning sync, 1:1 and meeting prep timing | Outlook, Google Calendar |
| **Meeting notes and transcripts** | "How do your meetings get recorded or transcribed, if at all?" | Transcript processing, action-item proposals | A voice recorder app (Plaud and others), Notion AI meeting notes, Zoom, Teams or Meet transcripts, none |
| **Work tracker** | "Where does your team track work: tickets, issues, projects?" | Linked-issue context in triage drafts, recaps, specialist hand-offs | Linear, Jira, Asana, GitHub Issues |
| **Docs and wiki** | "Where do specs, docs and team pages live?" | Linked-doc context in drafts, document ingest | Notion, Confluence, Google Drive, SharePoint |
| **Service or shared inbox** | "Do you work a shared or customer-facing inbox?" | Triage source (Front today); a Front inbox that syncs the user's mailbox also serves the Email role | Front, Zendesk, Help Scout, Intercom |
| **Knowledge base** (Lore's own memory) | "Where do you want me to keep notes about people, projects and decisions?" | Storage mode | This folder (default), an Obsidian vault, Notion |
| **Anything else** | "Any other tool you live in that I should know about?" | Scoped lookups | CRM, analytics, design tools |

Skip roles the user says don't apply. One answer per role is normal; record several if they genuinely use several (email at work and a shared inbox, say).

## Procedure

### 1. Detect what this session can already reach

Do this before asking anything, so the questions can say "I can already see Slack and Linear."

1. **Inventory.** If the session has a connector-listing tool (for example `ListConnectors`), call it. Otherwise read the tool list and any deferred-tool list: MCP tools are named `mcp__<server>__<tool>`, and the `<server>` segment names the connector. In a cloud Cowork session linked to the user's computer, servers the user runs locally appear as `mcp__remote-devices__<server>__<tool>`. Some servers have an opaque id instead of a name (a UUID); identify those by their tool names (`list_files` + `get_transcript` + `get_note` is a recorder, for example).
2. **Map servers to roles** with the table above. A suite connector covers each of its products: Microsoft 365 covers Outlook email, Outlook calendar, Teams and SharePoint; Google Workspace covers Gmail, Calendar, Chat and Drive; Atlassian covers Jira and Confluence.
3. **Confirm it works** with one cheap read per connector you intend to wire up: who-am-I, a one-result search, or a list with a limit of 1. A connector that is listed but whose call fails is "needs reconnecting", not "connected". Never run a write to test a connector.
4. **Capture identity while you are there:** the user's own id on the platform (Slack user id, email address, Linear user), since triage and dedup need it.

### 2. Ask, role by role

Lead with what you found and ask about the rest. Use multiple-choice questions where the session supports them, always with an "other" answer:

> "I can already reach **Slack** and **Linear** from here. For email: are you on Outlook, Gmail, or something else?"

For each role the user answers:

- **Their tool is connected and the check passed:** say so in a few words and ask the scoping questions for that tool (below).
- **Their tool has a connector but it isn't connected here:** look it up in the connector registry if the session can search it (for example `SearchMcpRegistry`), and show the connect card if the session has one (`SuggestConnectors`). Otherwise tell them where to connect it: claude.ai → Settings → Connectors (works for both harnesses), or the connectors (+) menu in the Cowork chat box, or `/mcp` in Claude Code; tools that run on their own computer are added as local MCP servers in the desktop app (Cowork) or with `claude mcp add` (Claude Code). Record it as "not connected" and keep going. Never block onboarding on it.
- **Listed but the check failed:** "needs reconnecting", with the same pointer.
- **No connector exists for it:** record "no connector" and say plainly what that means ("I can't read Front directly yet; forward or paste anything you want me to see"). Move on.
- **The user names a different vendor than the one connected** (they use Gmail; only Microsoft 365 is connected): that connector does not count for the role. Record the user's actual tool.

### 3. Scope each connected tool

Only what the workflows need; names alone are fine when ids are unknown.

- **Email:** the address(es) to sweep; any shared mailboxes. Sender tiers come later from the triage setup.
- **Team chat:** the user's own id; the channels that matter (triage setup proposes these from channel names).
- **Work tracker:** team or project keys (e.g. `ENG`, `OPS`) so issue references like `ENG-142` are recognized and lookups stay in scope.
- **Docs and wiki:** the spaces, teamspaces or drives that hold work docs.
- **Meeting notes:** where transcripts end up (a recorder app, Notion AI meeting notes, a folder) and roughly how often. Plaud syncs through `workflows/plaud-sync.md` and Notion AI meeting notes through `workflows/notion-meetings-sync.md`; Notion needs no extra scoping, since its meeting-notes query covers meetings the user attended or created. Any other tool: the user drops or pastes transcripts.
- **Knowledge base:** this folder, Obsidian, or Notion; onboarding Phase 7.5 sets up whichever they pick (Notion: `workflows/notion-kb.md` → Setup).

### 4. Write it down

Write `context.md` → **Tools & Integrations** (template: `templates/context.template.md`):

- The **Connectors** table, one row per role the user answered: Role, Tool, Status (`connected`, `not connected`, `needs reconnecting`, `no connector`), Connector (the server name as it appears in tool names), and the date it was checked.
- A sub-section per connected tool with its scope from step 3.

Every workflow reads this table to decide which sources to use: triage sweeps the email and chat tools recorded there, transcript processing pulls from the recorded meeting-notes tool, and so on. A role with no connected tool is skipped with one line in the output, never an error.

### 5. Summarize

Three lines at most: what's wired up, what to connect for more (and where), and what that will unlock. For example: "Wired up: Slack, Linear, Notion. Connect Outlook (Settings → Connectors) and I can add email to your daily brief. Front has no connector yet, so forward anything you want me to see."

## Rerunning

"Check my connectors" reruns steps 1, 3 and 4 against the existing table without re-asking roles that already have an answer, flips statuses that changed (a newly connected tool becomes `connected`; one that disappeared becomes `needs reconnecting`), and reports only what changed. "I switched email to Gmail" reruns that one role. If a newly connected tool unlocks a scheduled workflow that was skipped (the daily brief needs email or chat), offer to set it up.

## Rules

- **Ask about roles, record tools.** Never assume a vendor because a connector exists or because an earlier install used it.
- **Only use scoped projects, spaces and channels** in lookups (`CLAUDE.md` → Key behaviors → Connectors).
- **Connector status is a fact with a date.** Re-check rather than trusting a months-old row when a workflow fails.
- **Detection is read-only.** No drafts, sends, or writes while testing a connector.
