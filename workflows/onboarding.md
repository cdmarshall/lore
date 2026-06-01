# Onboarding

The first-run interview. Run this when `context.md` does not exist at the workspace root. Your job is to interview the user through a guided conversation, then generate their personal files (`context.md`, `team/*.md`, `stakeholders/*.md`) from the canonical templates in `templates/`, and create the live action items artifact in their Cowork sidebar.

## When to run this workflow

You (Lore) check for `context.md` at the start of every session. If it's missing, immediately greet the user and run this workflow before doing anything else. Do not attempt to handle other requests until onboarding is complete.

## Guiding principles

- **Conversational, not interrogative.** This is a guided interview, not a form. Ask one phase at a time, react to answers, follow up where useful.
- **Don't over-ask.** If the user gives a thin answer, that's fine. Capture what they share. They can refine `context.md` later.
- **Pause-friendly.** The user can pause at any phase. Save what's been captured so far before pausing. When they return, pick up where you left off.
- **Skippable phases.** If a phase doesn't apply (e.g., no direct reports), skip it cleanly. Don't force answers.
- **Write as you go.** After each phase that produces file content, write the file before moving to the next phase. This way a partial install is still useful.

---

## Phase 0, Welcome

Open with the signet, then something like:

> "📜 Welcome to Lore. It looks like this is a fresh install. I'm your second brain and executive assistant, and I'll be most useful once I know who you are and what you're working on. I'd like to walk through a short interview, roughly 10 to 15 minutes, to set up your workspace. We can pause anytime, and you'll be able to edit anything I write. Ready to start?"

Wait for confirmation. If the user wants to defer, tell them they can say "run onboarding" anytime to come back.

---

## Phase 1, Identity

**Ask:**
- What should I call you?
- What's your role / title?
- What company do you work for?
- What industry or sector?
- Who do you report to (name and title), if anyone?

**What you're capturing:** Top-level identity. Don't probe deeply, just collect the facts.

**Output:**
1. Copy `templates/context.template.md` to `context.md`.
2. Fill in the **Role** section with the answers above.

---

## Phase 2, Primary duties and focus

**Ask:**
- In a couple of sentences, what do you actually do? What domains do you own?
- What does success look like for you in the next 6 to 12 months?

**What you're capturing:** A high-level sense of what they're responsible for and where they're heading. This informs everything downstream.

**Output:**
- Take the success answer and seed 3 to 5 lines under **Current Priorities** in `context.md`. If they only gave one or two, that's fine.
- Note their primary duties in the **Notes for Lore** section.

---

## Phase 3, Team (direct reports)

**Ask first:**
- Do you have direct reports?

**If no:** acknowledge that and skip the rest of this phase. Leave the **My Team** table in `context.md` empty.

**If yes:** for each direct report, ask:
- Name
- Role / title
- Key responsibilities (one or two sentences)
- Anything else useful at this stage (start date, location, current focus area)

Loop until they're done. Don't push for completeness on each person; you can always learn more later.

**Output for each direct report:**
1. Add a row to the **My Team** table in `context.md`.
2. Copy `templates/team-member.template.md` to `team/[firstname-lowercase].md` and fill in:
   - The `# [Name] - [Role]` header
   - The Overview table (Role, Reports to: You, Start date, Location)
   - The Current Focus Areas section if mentioned
3. Leave Strengths, Growth Areas, Career Goals, Working Style, Observations, and 1:1 Notes empty for now. These build up over time through 1:1s and meeting processing.

If two team members share a first name, use `firstname-lastname.md`.

---

## Phase 4, Key stakeholders

**Ask:**
- Who are the people outside your direct team you interact with regularly and need to track? Think managers, peers, executive sponsors, dotted-line partners, key vendors. Don't try to be exhaustive: focus on the people who really matter to your work.

For each named stakeholder, ask:
- Name
- Role / title
- Relationship (manager, peer, exec sponsor, dotted line, partner, vendor, other)
- One or two sentences on what they care about or what makes the relationship important

If the user lists many, capture the names quickly first, then loop back for details on each.

**Output for each stakeholder:**
1. Add a row to the **Key Stakeholders** table in `context.md`.
2. Copy `templates/stakeholder.template.md` to `stakeholders/[firstname-lastname].md` (lowercase, hyphenated) and fill in:
   - The `# [Name]` header
   - The Role section (Title, Relationship, Focus)
   - The What They Care About section if they shared anything
3. Leave Background, Communication Preferences, Working Relationship, and Observations empty for now.

---

## Phase 5, Active initiatives and current challenges

**Ask:**
- What are your 3 to 5 active initiatives right now? For each: a name, who owns it, rough status (planning / in progress / blocked / done), and a sentence of context.
- What's keeping you up at night? What are your biggest current challenges?

**Output:**
- Populate the **Active Initiatives** table in `context.md` (and `Context.md` in the vault if Obsidian mode is active, using wikilinks for project names).
- Populate the **Current Challenges** section as bullet points.
- For each initiative with more than a sentence of context, offer to create a project file: "Want me to create a dedicated project file for [Initiative Name]? It gives you a place to track phases, team, status updates, and integration notes as the work evolves." If yes, create `projects/[slug].md` from `templates/project.template.md` (filesystem mode) or a vault note in `Projects/` with proper frontmatter (Obsidian mode). A sparse project file is fine at this stage -- it will fill in over time as transcripts are processed.

---

## Phase 6, Tools and integrations

**Ask:**
- Do you use Jira, Confluence, Slack, Notion, Salesforce, Linear, Asana, or other tools regularly? For the ones where I might need to look something up on your behalf, can you tell me the relevant project or workspace names and IDs if you know them?

**What you're capturing:** Just enough so that when you later use an MCP connector to pull from these tools, you scope the search correctly. If they don't know the IDs, names alone are fine.

**Output:**
- Populate the **Tools & Integrations** section of `context.md`. Use a sub-section per tool.

---

## Phase 7, Working style and Lore's personality

This phase has two parts.

**Part A: Working style and preferences.**

Ask:
- Anything about how you like to work that I should know? Things like: communication style, calendar quirks (e.g., a shared OOO calendar), preferred output formats, or things you want me to avoid.

Capture as bullet points under **Communication preferences** and **Things to avoid** in the **Working Style & Preferences** section of `context.md`. This part captures only the user's *stated* preferences. The data-driven voice profile (how they actually write) is captured separately in Phase 7.6 from their sent messages, if a messaging connector is available.

**Part B: Lore's tone.**

Ask the user to pick a personality preset for how you (Lore) communicate. Use AskUserQuestion-style multiple choice. Present these five options plus an option to describe their own:

> "How would you like me to talk to you? Pick the style that fits you best, you can change it anytime by editing context.md or just telling me to switch."

**1. Concise & direct.** Brief, gets to the point fast. Minimal preamble. Good for someone who wants the answer first and the explanation only if asked.

**2. Warm & collaborative.** Conversational, friendly, asks clarifying questions, explains thinking out loud. Good for someone who wants Lore to feel like a thoughtful partner.

**3. Analytical & thorough.** Detailed, structured, lays out options and tradeoffs explicitly. Good for someone who wants reasoning made visible and decisions framed with their alternatives.

**4. Coach-style.** Reflective and Socratic. Asks questions back, helps the user think through problems rather than answering directly. Good for someone using Lore as a thinking partner more than a task executor.

**5. Executive briefing.** Lead with the bottom line, supporting detail follows. Decision-oriented. Good for someone who triages a lot of information quickly and needs the recommendation up front.

**6. Custom.** "Describe your own preferences in a sentence or two."

Capture the choice (and any custom description) under **Lore's tone** in the **Working Style & Preferences** section of `context.md`. From this point on, adapt your responses to match the chosen style.

---

## Phase 7.5, Obsidian setup (optional)

This phase only runs if the Obsidian MCP is connected. Otherwise, skip it entirely; the user can run `workflows/obsidian-setup.md` later if they connect Obsidian.

**Detect:**

Attempt `mcp__obsidian__obsidian_list_files_in_vault`. If the tool isn't available or errors, skip this phase, you're done. If it succeeds, continue.

**Ask:**

> "I noticed you have an Obsidian vault connected. I can use it as the canonical store for people, meetings, decisions, and projects, instead of (or alongside) the filesystem folders in this repo. The big advantage is Obsidian's wikilinks and backlinks, each fact lives in exactly one place, and you can see every meeting / decision a person appears in with one click. Want me to set that up?"

If the user says no, skip to Phase 8. If yes, continue.

**Ask for subfolder name:**

Use AskUserQuestion-style multiple choice:

> "What should I call Lore's subfolder inside your vault? It lives at the vault root so it doesn't collide with your existing notes. Most people use the default."

Present these options:
1. **`Lore/` (Recommended)**: the default; works for most users.
2. **`Lore - <YourOrg>/`**: useful if you plan to run separate Lore instances per org or context (e.g., `Lore - Acme/`, `Lore - Personal/`). Pick this if you want room to add more later.
3. **Other**: let the user type a custom name.

**Output:**

1. Write the choice to `context.md` under **Notes for Lore** → **Vault Configuration** (create the subsection if it doesn't already exist):
   ```markdown
   ### Vault Configuration

   - **Obsidian vault subfolder**: `<chosen name>/`
   - This is the active subfolder name. Whenever a workflow file references `Lore/<subfolder>/` as a vault path, substitute `<chosen name>/<subfolder>/`.
   - Active subfolders: `<chosen name>/People/`, `<chosen name>/Meetings/`, `<chosen name>/Transcripts/`, `<chosen name>/Decisions/`, `<chosen name>/Projects/`, `<chosen name>/Strategy/`. Periodic notes (Daily/Weekly) will land under the same prefix when configured.
   - `Projects/` holds one note per active project/initiative. `Strategy/` holds only vision and roadmap content.
   ```

2. **Seed the folder structure** in the vault with small placeholder READMEs so the folders are visible in Obsidian's file explorer from day one. For `Meetings/`, `Transcripts/`, and `Projects/`, write a `_README.md` via `mcp__obsidian__obsidian_append_content` that briefly states the naming convention for that folder. Keep them short (2-3 lines); the user can delete them whenever. Also write the vault `Context.md` file (a wikilink-enabled version of `context.md`) to the vault root -- use the same content as `context.md`, converting the My Team, Key Stakeholders, and Active Initiatives table entries to wikilinks.

3. **Do NOT migrate existing filesystem data here.** Onboarding is a fresh-install workflow; the user shouldn't have existing `team/` / `stakeholders/` / `decisions/log.md` content yet. If for some reason they do (e.g., they're re-running onboarding), point them at `workflows/obsidian-setup.md` for the migration path.

4. Confirm to the user what was set up:
   > "Your vault is configured. Lore will write people, meetings, decisions, and projects into `<chosen name>/` from here on. Filesystem fallback still works for any workflow that hasn't been migrated yet, no action needed from you."

---

## Phase 7.6, Writing voice capture (optional)

This phase runs only if at least one messaging connector is available: Microsoft 365 (email and Teams) or Slack. If none is connected, skip it; the user can run it later by saying "analyze my writing voice" once a connector is set up. The goal is to learn how the user actually writes so Lore can draft in their voice (emails, Slack and Teams replies, talk tracks) instead of guessing.

**Detect:**

Check which of these tools resolve: `outlook_email_search` (email), `chat_message_search` (Teams), `slack_search_public_and_private` (Slack). Skip silently for any that are missing.

**Ask permission first (this reads the user's sent messages):**

> "If it's helpful, I can study how you actually write by reading a sample of your own sent messages (email, Slack, Teams) and build a voice profile, so anything I draft sounds like you. I only read your own sent items, I keep just short non-sensitive snippets as calibration examples, and you can edit or delete the profile anytime. Want me to do that?"

If no, skip to Phase 8. If yes, continue with whichever connectors are present.

**Resolve the user's own identity first** (their email from `context.md`; their Slack user ID via `slack_read_user_profile`) so the samples are messages they sent, not received.

**Sample sent messages (the user's own):**

- **Email** (`outlook_email_search`, `folderName: "Sent Items"`, `order: newest`): pull the most recent ~100 to 200, paginating. Favor genuine prose replies and outbound notes; ignore one-line forwards and calendar noise.
- **Slack** (`slack_search_public_and_private`, query `from:<@SELF_USER_ID> after:<~90 days ago>`): pull ~50 to 100 of the user's own messages across DMs and channels.
- **Teams** (`chat_message_search`, `sender: <user's email>`): pull what's available.

**Analyze each medium separately** (email and chat are different registers). For each, characterize:

- Greetings and sign-offs, or their absence, including mid-thread behavior.
- Contractions, hedges ("I think", "should", "probably"), and how opinions versus facts are stated.
- Warmth markers, softeners on asks, and recurring vocabulary tells.
- Length norms, formatting habits (lists versus prose), and emoji usage (chat and email often differ).
- Any hard rules worth enforcing (for example, whether the user ever uses em dashes; quantify it, e.g. "zero across 200 sent emails").

**Output:**

1. Write a `## Email Writing Style` section into `context.md` (core voice, hard rules, hedges, warmth markers, softeners, vocabulary tells, length norms, formatting, and one or two short verbatim calibration samples). Place it before the **Notes for Lore** section.
2. If Slack or Teams data was sampled, write a `## Slack & Teams Writing Style` section as the chat counterpart: shorter, the affirmation openers and emoji habits, what carries over from email, and a few short calibration samples. Note that Teams uses the same register as Slack unless the data shows otherwise.
3. Optionally write the fuller long-form guide (with anti-examples) to `outbox/dictation-style-prompt.md` and reference it from the `context.md` sections.
4. Add a one-line pointer under **Notes for Lore**: any drafting on the user's behalf should conform to these sections.

**Privacy and scope:**

- Read only the user's own sent messages. Never keep another person's content as a sample.
- Keep calibration samples short and free of customer PII, secrets, partner data, or anything sensitive. Paraphrase or redact if the cleanest example contains such content.
- Write only the applicable sections. If only email is connected, write only the email section and tell the user the chat profile can be added later once Slack or Teams is connected.

**If skipped or partial:** note that the user can say "analyze my writing voice" anytime to build or extend these profiles, and that they sharpen as more sent history accrues.

---

## Phase 8, Wrap up

**Do these in order:**

1. Confirm `context.md` is fully written. Show the user a brief summary of what was captured (3 to 5 lines).

2. **Create the live action items artifact.** This is the user's canonical action items tracker, a sidebar widget where they can add, complete, delegate, and search items. The artifact's IndexedDB is the sole source of truth (see `workflows/action-items.md`).

   Steps:
   - Run the build script with an empty operations array to produce a fresh artifact HTML:
     ```bash
     node scripts/build-action-items-artifact.js '[]'
     ```
     This writes `outbox/action-items-artifact-built.html` with no seeded items.
   - Call `mcp__cowork__create_artifact` with:
     - `id`: `action-items`
     - `html_path`: absolute path to `outbox/action-items-artifact-built.html`
     - `mcp_tools`: `[]`
   - If the create call fails (e.g., the artifact tool isn't available in the current environment), don't block onboarding. Note that the artifact wasn't created and the user can ask for it later by saying "create my action items artifact."

   Do NOT create or populate `inbox/action-items.md`. The artifact's IDB is canonical; the file is only a restore-only backup that the artifact's own Download snapshot button writes when the user wants one. See `workflows/action-items.md` for the full procedure.

3. **Teach the snapshot ritual.** Tell the user how Lore reads their current state (since the agent can't read the artifact's IDB directly):

   > "Whenever you want me to know what's currently on your plate (for prep, planning, dedup, or just 'what should I work on'), click **Download snapshot** in the action items artifact and save the file to `inbox/action-items.snapshot.md` in this Lore workspace. I'll read it. You only need to do this when you want me to have a fresh view; for adding new items or marking things complete, I push changes to the artifact directly and don't need to read first.
   >
   > If you'd rather not save the file, you can paste the snapshot content directly in chat and I'll use that."

   This is the only manual ritual in the system. Everything else is automatic.

4. Tell the user the workspace is ready. Suggest a few first actions based on what they shared:
   - "Open the action items artifact in your sidebar to start tracking work."
   - "When you have a meeting transcript, drop it in `meetings/transcripts/` or paste it here, and I'll process it (new items get pushed to the artifact)."
   - "Say 'morning sync' to start your day with a briefing (works best with a fresh `inbox/action-items.snapshot.md`)."
   - If they have direct reports: "Before your next 1:1, say 'help me prep for my 1:1 with [name]' and I'll pull their profile."
   - **Triage (email + Slack + Teams sweep):** Lore can run a unified triage across your messaging channels, draft replies, and surface what needs your attention, on a schedule or on demand. Out of the box it monitors **Outlook/Teams** (via the Microsoft 365 connector) and **Slack** (via the Slack connector). If you use Gmail or Google Chat instead of Outlook/Teams, you'll need a G Suite connector; other channels (e.g., Discord, Linear notifications) can be added the same way. To set any of this up: first make sure the relevant connectors are installed in Cowork, then say "run my triage" or "triage everything" and I'll walk you through scoping which Slack channels, Teams chats, and email folders to watch. You can also ask me to run it on a schedule (default: weekday mornings and mid-afternoon). Any channels beyond the three defaults need to be explicitly added, either during that setup conversation or by telling me "add #channel-name to my triage watch list" anytime.

5. Remind them they can edit `context.md` anytime, and that workflows live in `workflows/` if they want to see what Lore can do.

6. Ask if there's anything they want to handle right now, or if they'd like to come back later.

---

## File generation summary

By the end of onboarding, the workspace should contain (at minimum):

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

The user should also have a live `action-items` artifact in their Cowork sidebar (created in Phase 8 step 2). That artifact, not any local file, is the source of truth for action items.

All other folders (decisions/, meetings/notes/, meetings/transcripts/, weekly-reviews/, outbox/, inbox/documents/) remain empty until they're populated by normal workflows.

---

## Recovery cases

**If the user wants to skip a whole phase:** acknowledge, skip it, and move on. They can run onboarding again later, or just edit `context.md` directly.

**If the user pauses mid-onboarding:** save what's been captured so far. When they return and `context.md` exists but is partially filled, ask which phase they want to resume from, or whether they want to keep what's there and move forward.

**If `context.md` already exists but is sparse / clearly incomplete:** offer onboarding as an option ("It looks like your profile is partially filled in. Want to walk through the rest?"), but don't force it.

**If the user explicitly re-runs onboarding when context.md is fully populated:** ask whether they want to start fresh (back up the existing context.md to context.backup.md first) or just update specific sections.
