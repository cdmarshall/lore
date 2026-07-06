# Onboarding

The first-run interview. Runs when `context.md` does not exist at the workspace root. Interview the user, generate their personal files (`context.md`, `team/*.md`, `stakeholders/*.md`) from `templates/`, and create the live action items artifact in their Cowork sidebar.

All output follows VOICE.md. Session-start trigger: CLAUDE.md → Session start (if `context.md` is missing, greet and run this before anything else; handle no other requests until complete). Storage mode: `_conventions.md` → Storage-mode branching. Existence checks before writing gitignored paths: `_conventions.md` → Two-step existence check.

## Guiding principles

- **Conversational, not interrogative.** One phase at a time; react and follow up.
- **Don't over-ask.** Thin answers are fine; they can refine `context.md` later.
- **Pause-friendly.** Save what's captured before pausing; resume where you left off.
- **Skippable phases.** Skip cleanly if a phase doesn't apply; don't force answers.
- **Write as you go.** Write each phase's file before the next, so a partial install is still useful.

---

## Phase 0, Welcome

Open with the signet, then something like:

> "📜 Welcome to Lore. It looks like this is a fresh install. I'm your second brain and executive assistant, and I'll be most useful once I know who you are and what you're working on. I'd like to walk through a short interview, roughly 10 to 15 minutes, to set up your workspace. We can pause anytime, and you'll be able to edit anything I write. Ready to start?"

Wait for confirmation. If they defer, they can say "run onboarding" anytime.

---

## Phase 1, Identity

**Ask:**
- What should I call you?
- What's your role / title?
- What company do you work for?
- What industry or sector?
- Who do you report to (name and title), if anyone?

**Output:**
1. Copy `templates/context.template.md` to `context.md`.
2. Fill in the **Role** section.

---

## Phase 2, Primary duties and focus

**Ask:**
- In a couple of sentences, what do you actually do? What domains do you own?
- What does success look like for you in the next 6 to 12 months?

**Output:**
- Seed 3 to 5 lines under **Current Priorities** in `context.md` from the success answer. One or two is fine.
- Note primary duties in the **Notes for Lore** section.

---

## Phase 3, Team (direct reports)

**Ask first:**
- Do you have direct reports?

**If no:** acknowledge and skip the rest of this phase. Leave the **My Team** table empty.

**If yes:** for each direct report, ask:
- Name
- Role / title
- Key responsibilities (one or two sentences)
- Anything else useful (start date, location, current focus area)

Loop until done. Don't push for completeness per person.

**Output for each direct report:**
1. Add a row to the **My Team** table in `context.md`.
2. Copy `templates/team-member.template.md` to `team/[firstname-lowercase].md` (filesystem mode) or create `People/[Full Name].md` in the vault (Obsidian mode) and fill in:
   - Frontmatter: `job_title`, `role: direct-report`, `team`, `manager`, `location`, `start_date`, `last_1on1` (blank for now), `tags: [person/direct-report]`
   - Current Focus Areas if mentioned
3. Leave Strengths, Growth Areas, Career Goals, Working Style, Observations, and 1:1 Notes empty; these build over time.

If two team members share a first name, use `firstname-lastname.md`. Person-note structure and frontmatter schema: `_conventions.md`. Filesystem-mode installs: the template's frontmatter and Dataview block are vault-only and inert; mention once that they can be ignored or deleted.

---

## Phase 4, Key stakeholders

**Ask:**
- Who are the people outside your direct team you interact with regularly and need to track? Think managers, peers, executive sponsors, dotted-line partners, key vendors. Don't try to be exhaustive: focus on the people who really matter to your work.

For each named stakeholder, ask:
- Name
- Role / title
- Relationship (manager, peer, exec sponsor, dotted line, partner, vendor, other)
- One or two sentences on what they care about or why the relationship matters

If they list many, capture names first, then loop back for details.

**Output for each stakeholder:**
1. Add a row to the **Key Stakeholders** table in `context.md`.
2. Copy `templates/stakeholder.template.md` to `stakeholders/[firstname-lastname].md` (lowercase, hyphenated; filesystem mode) or create `People/[Full Name].md` in the vault (Obsidian mode) and fill in:
   - Frontmatter: `job_title`, `role` (stakeholder/internal or stakeholder/external), `team`, `location`, `status: active`, appropriate tag
   - What They Care About if they shared anything
3. Leave Background, Communication Preferences, Working Relationship, and Observations empty.

Person-note structure and frontmatter schema: `_conventions.md`.

---

## Phase 5, Active initiatives and current challenges

**Ask:**
- What are your 3 to 5 active initiatives right now? For each: a name, who owns it, rough status (planning / in progress / blocked / done), and a sentence of context.
- What's keeping you up at night? What are your biggest current challenges?

**Output:**
- Populate the **Active Initiatives** table in `context.md` (and vault `Context.md` if Obsidian mode, wikilinking project names).
- Populate **Current Challenges** as bullets.
- For each initiative with more than a sentence of context, offer a project file: "Want me to create a dedicated project file for [Initiative Name]? It gives you a place to track phases, team, status updates, and integration notes as the work evolves." If yes, create `projects/[slug].md` from `templates/project.template.md` (filesystem mode) or a vault note in `Projects/` with proper frontmatter (Obsidian mode). Sparse is fine; it fills in over time.

---

## Phase 6, Tools and integrations

**Ask:**
- Do you use Jira, Confluence, Slack, Notion, Salesforce, Linear, Asana, or other tools regularly? For the ones where I might need to look something up on your behalf, can you tell me the relevant project or workspace names and IDs if you know them?

**Capturing:** Enough to scope later MCP-connector searches. Names alone are fine if they don't know IDs.

**Output:**
- Populate the **Tools & Integrations** section of `context.md`, a sub-section per tool.

---

## Phase 7, Working style and Lore's personality

Two parts.

**Part A: Working style and preferences.**

Ask:
- Anything about how you like to work that I should know? Things like: communication style, calendar quirks (e.g., a shared OOO calendar), preferred output formats, or things you want me to avoid.

Capture as bullets under **Communication preferences** and **Things to avoid** in the **Working Style & Preferences** section of `context.md`. This captures only *stated* preferences; the data-driven voice profile (how they actually write) comes from Phase 7.6, if a messaging connector is available.

**Part B: Lore's tone.**

Ask the user to pick a personality preset for how you (Lore) communicate. Use AskUserQuestion-style multiple choice. Present these five options plus an option to describe their own:

> "How would you like me to talk to you? Pick the style that fits you best, you can change it anytime by editing context.md or just telling me to switch."

**1. Concise & direct.** Brief, gets to the point fast. Minimal preamble. Good for someone who wants the answer first and the explanation only if asked.

**2. Warm & collaborative.** Conversational, friendly, asks clarifying questions, explains thinking out loud. Good for someone who wants Lore to feel like a thoughtful partner.

**3. Analytical & thorough.** Detailed, structured, lays out options and tradeoffs explicitly. Good for someone who wants reasoning made visible and decisions framed with their alternatives.

**4. Coach-style.** Reflective and Socratic. Asks questions back, helps the user think through problems rather than answering directly. Good for someone using Lore as a thinking partner more than a task executor.

**5. Executive briefing.** Lead with the bottom line, supporting detail follows. Decision-oriented. Good for someone who triages a lot of information quickly and needs the recommendation up front.

**6. Custom.** "Describe your own preferences in a sentence or two."

Capture the choice (and any custom description) under **Lore's tone** in the **Working Style & Preferences** section of `context.md`. From here on, match the chosen style.

---

## Phase 7.5, Obsidian setup (optional)

Runs only if the user has an Obsidian vault. Otherwise skip entirely; they can set up Obsidian later per `README.md` → "Obsidian integration" (Dataview and Semantic Notes Vault MCP plugin install steps).

**Detect:** ask whether they use Obsidian (or check for Semantic Notes Vault MCP tools in the session, which imply they do). If no vault, skip this phase.

**Ask:**

> "Do you use Obsidian? I can use your vault as the canonical store for people, meetings, decisions, and projects, instead of (or alongside) the filesystem folders in this repo. The big advantage is Obsidian's wikilinks and backlinks, each fact lives in exactly one place, and you can see every meeting / decision a person appears in with one click. All I need is the vault's filesystem path. Want me to set that up?"

If no, skip to Phase 8. If yes, continue.

**Ask for subfolder name** (AskUserQuestion-style multiple choice):

> "What should I call Lore's subfolder inside your vault? It lives at the vault root so it doesn't collide with your existing notes. Most people use the default."

1. **`Lore/` (Recommended)**: the default; works for most users.
2. **`Lore - <YourOrg>/`**: useful if you plan to run separate Lore instances per org or context (e.g., `Lore - Acme/`, `Lore - Personal/`). Pick this for room to add more later.
3. **Other**: let the user type a custom name.

**Output:**

1. Ask for the vault's full filesystem path (on macOS with iCloud sync, typically `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/<VaultName>`). Verify with `bash ls`. Then write the configuration to `context.md` under **Notes for Lore** → **Vault Configuration** (create the subsection if absent):
   ```markdown
   ### Vault Configuration

   - **Vault path**: `<full filesystem path to the vault>`
   - **Obsidian vault subfolder**: `<chosen name>/`
   - This is the active subfolder name. Whenever a workflow file references `Lore/<subfolder>/` as a vault path, substitute `<chosen name>/<subfolder>/`.
   - Active subfolders: `<chosen name>/People/`, `<chosen name>/Meetings/`, `<chosen name>/Transcripts/`, `<chosen name>/Decisions/`, `<chosen name>/Projects/`, `<chosen name>/Strategy/`. Periodic notes (Daily/Weekly) will land under the same prefix when configured.
   - `Projects/` holds one note per active project/initiative. `Strategy/` holds only vision and roadmap content.
   ```

2. **Seed the folder structure** with placeholder READMEs so folders show in Obsidian's file explorer from day one. For `Meetings/`, `Transcripts/`, and `Projects/`, Write a `_README.md` (2-3 lines) stating that folder's naming convention; the user can delete them anytime. Also Write the vault `Context.md` to the vault root: same content as `context.md`, converting My Team, Key Stakeholders, and Active Initiatives table entries to wikilinks. Seed `Index.md` at the vault root from the people and projects created during onboarding (`_conventions.md` → Vault index).

3. **Do NOT migrate existing filesystem data here.** Onboarding is fresh-install; the user shouldn't have existing `team/` / `stakeholders/` / `decisions/log.md` content yet. If they do (re-running onboarding), offer a previewed migration into the vault afterward (say "migrate to Obsidian"; routing per CLAUDE.md).

4. Confirm what was set up:
   > "Your vault is configured. Lore will write people, meetings, decisions, and projects into `<chosen name>/` from here on. Filesystem fallback still works for any workflow that hasn't been migrated yet, no action needed from you."

Vault structure, path resolution, and access tooling: `_conventions.md`.

---

## Phase 7.6, Writing voice capture (optional)

Runs only if at least one messaging connector is available: Microsoft 365 (email and Teams) or Slack. If none, skip; the user can run it later by saying "analyze my writing voice." Goal: learn how the user actually writes so Lore drafts in their voice instead of guessing. This voice profile complements the committed VOICE.md contract: the contract is the universal ruleset, the profile is this user's specific voice.

**Detect:** which tools resolve: `outlook_email_search` (email), `chat_message_search` (Teams), `slack_search_public_and_private` (Slack). Skip silently for any missing.

**Ask permission first (this reads the user's sent messages):**

> "If it's helpful, I can study how you actually write by reading a sample of your own sent messages (email, Slack, Teams) and build a voice profile, so anything I draft sounds like you. I only read your own sent items, I keep just short non-sensitive snippets as calibration examples, and you can edit or delete the profile anytime. Want me to do that?"

If no, skip to Phase 8. If yes, continue with whichever connectors are present.

**Resolve the user's own identity first** (email from `context.md`; Slack user ID via `slack_read_user_profile`) so samples are messages they sent, not received.

**Sample sent messages (the user's own):**

- **Email** (`outlook_email_search`, `folderName: "Sent Items"`, `order: newest`): pull the most recent ~100 to 200, paginating. Favor genuine prose replies and outbound notes; ignore one-line forwards and calendar noise.
- **Slack** (`slack_search_public_and_private`, query `from:<@SELF_USER_ID> after:<~90 days ago>`): pull ~50 to 100 of the user's own messages across DMs and channels.
- **Teams** (`chat_message_search`, `sender: <user's email>`): pull what's available.

**Analyze each medium separately** (email and chat are different registers). For each, characterize:

- Greetings and sign-offs, or their absence, including mid-thread behavior.
- Contractions, hedges ("I think", "should", "probably"), and how opinions versus facts are stated.
- Warmth markers, softeners on asks, and recurring vocabulary tells.
- Length norms, formatting habits (lists versus prose), and emoji usage (chat and email often differ).
- Hard rules worth enforcing (e.g. whether the user ever uses em dashes; quantify it, e.g. "zero across 200 sent emails").

**Output:**

1. Write a `## Email Writing Style` section into `context.md` (core voice, hard rules, hedges, warmth markers, softeners, vocabulary tells, length norms, formatting, one or two short verbatim calibration samples). Place it before **Notes for Lore**.
2. If Slack or Teams was sampled, write a `## Slack & Teams Writing Style` section as the chat counterpart: shorter, affirmation openers and emoji habits, what carries over from email, a few short samples. Teams uses the same register as Slack unless the data shows otherwise.
3. Optionally write the fuller long-form guide (with anti-examples) to `outbox/dictation-style-prompt.md` and reference it from the `context.md` sections.
4. Add a one-line pointer under **Notes for Lore**: drafting on the user's behalf conforms to these sections.

**Privacy and scope:**

- Read only the user's own sent messages. Never keep another person's content as a sample.
- Keep samples short and free of customer PII, secrets, partner data, or anything sensitive. Paraphrase or redact otherwise.
- Write only the applicable sections. If only email is connected, write only that section and note the chat profile can be added later once Slack or Teams is.

**If skipped or partial:** the user can say "analyze my writing voice" anytime to build or extend these profiles; they sharpen as more sent history accrues.

---

## Phase 8, Wrap up

**In order:**

1. Confirm `context.md` is fully written. Show a brief summary (3 to 5 lines).

1b. **Seed the state file.** Copy `templates/state.template.md` to `STATE.md` at the repo root and write the first Last session entry ("onboarding completed, workspace created"). CLAUDE.md → Key behaviors → State file explains its lifecycle.

1c. **Mention the evals harness** in one sentence: "When you correct my writing style, I save a before/after example to `evals/examples/` so it sticks; `evals/README.md` explains the format."

2. **Create the live action items artifact.** The user's canonical action items tracker (sidebar widget: add, complete, delegate, search). Rules and full procedure: `workflows/action-items.md` and CLAUDE.md → Key behaviors.

   Steps:
   - Run the build script with an empty operations array to produce a fresh artifact HTML:
     ```bash
     node scripts/build-action-items-artifact.js '[]'
     ```
     This writes `outbox/action-items-artifact-built.html` with no seeded items.
   - Call `mcp__cowork__create_artifact` with `id`: `action-items`, `html_path`: absolute path to `outbox/action-items-artifact-built.html`, `mcp_tools`: `[]`.
   - If the create call fails (e.g., the artifact tool isn't available), don't block onboarding. Note it wasn't created; the user can ask later by saying "create my action items artifact."

3. **Teach the snapshot ritual.** How Lore reads current state (the agent can't read the artifact's IDB directly):

   > "Whenever you want me to know what's currently on your plate (for prep, planning, dedup, or just 'what should I work on'), click **Download snapshot** in the action items artifact and save the file to `inbox/action-items.snapshot.md` in this Lore workspace. I'll read it. You only need to do this when you want me to have a fresh view; for adding new items or marking things complete, I push changes to the artifact directly and don't need to read first.
   >
   > If you'd rather not save the file, you can paste the snapshot content directly in chat and I'll use that."

   This is the only manual ritual in the system. Everything else is automatic.

4. Tell the user the workspace is ready. Suggest first actions based on what they shared:
   - "Open the action items artifact in your sidebar to start tracking work."
   - "When you have a meeting transcript, drop it in `meetings/transcripts/` or paste it here, and I'll process it (new items get pushed to the artifact)."
   - "Say 'morning sync' to start your day with a briefing (works best with a fresh `inbox/action-items.snapshot.md`)."
   - If they have direct reports: "Before your next 1:1, say 'help me prep for my 1:1 with [name]' and I'll pull their profile."
   - **Triage (email + Slack + Teams sweep):** Lore can run a unified triage across your messaging channels, draft replies, and surface what needs your attention, on a schedule or on demand. Out of the box it monitors **Outlook/Teams** (via the Microsoft 365 connector) and **Slack** (via the Slack connector). If you use Gmail or Google Chat instead of Outlook/Teams, you'll need a G Suite connector; other channels (e.g., Discord, Linear notifications) can be added the same way. To set up: first make sure the relevant connectors are installed in Cowork, then say "run my triage" or "triage everything" and I'll walk you through scoping which Slack channels, Teams chats, and email folders to watch. You can also ask me to run it on a schedule (default: weekday mornings and mid-afternoon). Any channels beyond the three defaults need to be explicitly added, either during that setup conversation or by telling me "add #channel-name to my triage watch list" anytime.

5. Remind them they can edit `context.md` anytime, and that workflows live in `workflows/`.

6. Ask if there's anything they want to handle now, or come back later.

---

## File generation summary

At minimum, the workspace should contain:

```
context.md                              ← fully populated (incl. writing-style sections if a connector was available)
team/[firstname].md                     ← one per direct report (if any)
stakeholders/[firstname-lastname].md    ← one per stakeholder
projects/[slug].md                      ← one per initiative the user wanted a project file for (if any, Phase 5)
outbox/dictation-style-prompt.md        ← optional long-form voice guide (Phase 7.6, if generated)
```

If Obsidian mode is active, the vault should additionally contain:

```
Context.md                              ← vault version of context.md with wikilinks (vault root)
People/[Full Name].md                   ← one per direct report and key stakeholder
Projects/[Project Name].md              ← one per initiative with a project file
Meetings/_README.md                     ← naming convention placeholder
Transcripts/_README.md                  ← naming convention placeholder
Projects/_README.md                     ← naming convention placeholder
```

Plus a live `action-items` artifact in the Cowork sidebar (Phase 8 step 2). That artifact, not any local file, is the source of truth for action items. All other folders (decisions/, meetings/notes/, meetings/transcripts/, weekly-reviews/, outbox/, inbox/documents/) stay empty until normal workflows populate them.

---

## Recovery cases

**Skip a whole phase:** acknowledge, skip, move on. They can re-run onboarding later, or edit `context.md` directly.

**Pause mid-onboarding:** save what's captured. When they return and `context.md` exists but is partial, ask which phase to resume from, or whether to keep what's there and move forward.

**`context.md` exists but is sparse / incomplete:** offer onboarding ("It looks like your profile is partially filled in. Want to walk through the rest?"), but don't force it.

**User explicitly re-runs onboarding when context.md is fully populated:** ask whether they want to start fresh (back up existing to `context.backup.md` first) or update specific sections.
