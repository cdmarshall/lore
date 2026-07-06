# KB Sweeper

Proactive knowledge-base updater. Reads recent Slack, Teams, and email activity and pulls durable facts into the vault. It is NOT triage: it never drafts a reply, never touches a draft, never prioritizes the user's day. Its only job is keeping the vault current.

> **Trigger phrases**: "sweep the knowledge base", "update the KB from my channels", "run the sweeper". Also intended for a twice-daily weekday scheduled run.

---

## Step 1, Scope and Mode

Storage-mode branching: `_conventions.md` → Storage-mode branching. The sweeper writes entity data, so it follows the active mode's target paths throughout: vault notes in Obsidian mode, `team/` / `stakeholders/` / `projects/` in filesystem mode.

## Step 2, Load Config and Resolve the Window

Read `triage-config.md` at the workspace root. If it's missing entirely, or present with no `## KB sweeper` subsection, ask the user once to name 3 to 5 Slack channels to watch and confirm Teams/email scope, then write (or append) the subsection (two-step existence check first; create the file from `templates/triage-config.template.md` if it doesn't exist). Otherwise load the existing subsection and continue.

The subsection holds: channels to watch (reuse or diverge from triage's `### Project channels to watch` table), optional extra keywords for topic mentions outside those channels, and sweeper-specific scope notes. Also read the rest of `triage-config.md` for Teams key people and Slack/Teams identifiers, shared with triage.

Read `inbox/.sweeper-last-run` (ISO 8601). If absent, default to the last 12 hours and note that in the changelog. Record `run_start = now`.

## Step 3, Sweep Each Source

Same connectors as triage; resolve tool names by suffix per `workflows/triage.md` → Connector dependencies. Skip any missing source and note it in the changelog. Cap 30 messages per source per run; process newest first and note any truncation.

1. **Slack:** for each watched channel, read messages since the window start; also search configured extra keywords. Drop messages already marked `swp:<ts>` in `inbox/.slack-processed`.
2. **Teams:** messages involving the user (DMs, @mentions, posted-in chats), same chat-ID classification as `workflows/triage.md` → What counts as "needs attention". Drop messages already marked `swp:<id>` in `inbox/.teams-processed`.
3. **Email:** same connector and window as triage's email pass. Drop messages already marked `swp:<id>` in `inbox/.email-processed`.

## Step 4, Tracker Semantics (read carefully, this differs from triage)

The sweeper shares triage's three dotfiles but uses a different line shape. Sweeper appends **marker-prefixed** lines, `swp:<id>`, and its skip-check matches only `swp:`-prefixed lines, ignoring triage's bare-ID lines. Triage appends bare IDs and matches only bare IDs, ignoring the sweeper's `swp:` lines. Both files stay append-only (CLAUDE.md hard rule, no exceptions either way).

The same message can therefore be processed once by each workflow, and that's intended, not a bug: triage drafts a reply, the sweeper separately extracts knowledge, neither waits on the other.

The sweeper's own last-run marker is a separate single-value file, `inbox/.sweeper-last-run` (ISO 8601, overwritten each run), the one exception to append-only here, same as `.triage-last-run`.

## Step 5, Extract (conservative rules)

Apply every rule below before writing anything. When in doubt, propose in the changelog instead of writing.

### 5a. Observations (people)

A new durable fact: a commitment made, a status shared, a risk raised. Not chatter, not a question, not something already on the note.

- Append to the person's note per `_conventions.md` → Person note structure: newest first, above the first existing `###` entry in `## Observations`.
- Every sweeper-written observation heading carries the tag `#inbox/needs-review` and a provenance line (source: Slack #channel / Teams chat / email subject, date). This tag gates unsupervised writes: the user confirms or discards through vault-lint's review queue (`workflows/vault-lint.md` → Review queue). Only user confirmation clears the tag.
- Filesystem mode: same shape appended to `team/[name].md` or `stakeholders/[name].md`. Two-step existence check first.

### 5b. Project updates

Only when a message clearly signals a phase or status change: "we shipped X," "blocked on Y." Ambiguous mentions don't count, skip them.

- Append a dated line under `## Current Phase` (Obsidian: `Projects/<Name>.md`; filesystem: `projects/[slug].md`).
- Never edit `status:` frontmatter without the user. If a message implies a status change, propose it in the changelog with the source quote instead.

### 5c. Decision candidates

Never auto-log a decision. Apply the test in `_conventions.md` → Decision-log discipline (hard to reverse, surprising, a real trade-off between genuine alternatives). Anything that passes goes in the changelog as a proposal with the source quote, not into `decisions/log.md` or `Decisions/`.

### 5d. Glossary and new entities

New recurring terms not already in `context.md` → Terminology & Corrections: propose adding per `_conventions.md` → Terminology and glossary. An unknown person or project appearing repeatedly (not a one-off mention): propose creating the note. Neither writes unsupervised; both go in the changelog.

### 5e. Index maintenance

Any note created or archived on later approval updates `Index.md` per `_conventions.md` → Vault index. A run that only appends observations or phase lines needs no Index.md touch.

## Step 6, Write the Changelog (every run, even an empty one)

Write `outbox/sweeper/YYYY-MM-DD-HHMM.md`. Two-step existence check first. Follow VOICE.md: bullets, lead with the finding, no padding.

```markdown
# KB Sweep: YYYY-MM-DD HH:MM

📜 *Window: <window_start> to <run_start>. Slack: N seen / W written. Teams: N seen / W written. Email: N seen / W written.*

## Written (applied)
- Appended observation to [[Person]] (#inbox/needs-review): <one line>. Source: Slack #channel, YYYY-MM-DD.
- Appended phase line to [[Project]]: <one line>. Source: Teams chat, YYYY-MM-DD.

## Proposed (your call)
- **Decision candidate**: <one line> → would log to Decisions. Quote: "<quote>" (Slack #channel, YYYY-MM-DD).
- **Status change**: [[Project]] active → blocked, implied by "<quote>". Not written; confirm to apply.
- **New entity**: <name> mentioned N times, no existing note. Propose creating [[Name]].
- **Glossary term**: "<term>" not in context.md. Propose adding.

## Skipped
- <Source> unavailable: <connector missing / error>.
- <N> messages truncated in <source>: window held more than 30.

## Counts
- Slack: N seen, W written. Teams: N seen, W written. Email: N seen, W written.

— 📜 Lore
```

The vault never mutates silently: writes under "Written," judgment calls under "Proposed," gaps under "Skipped." An empty run still produces this file with zero counts.

## Step 7, Update Trackers

1. Append `swp:<id>` lines to `inbox/.slack-processed`, `.teams-processed`, `.email-processed` for every message swept this run, written or not.
2. Overwrite `inbox/.sweeper-last-run` with `run_start`.
3. Print a one-paragraph summary to chat and link the changelog file.

---

## Schedule (document only, do not create it yet)

Intended cadence: **weekdays at 11:30 and 16:30 local time**, via the user's scheduler of choice, firing the prompt "run the sweeper." Do not create this task until the user has reviewed at least one supervised, manually-triggered run and is satisfied with what it writes; unsupervised vault writes, even conservative and tagged ones, earn a dry run first. Once approved, set it up the way triage's schedule is offered (`workflows/triage.md` → Fresh setup) and confirm the two run times.

---

## Notes

- **Not triage.** No drafts, no reply staging, no email tiering, no prioritizing the user's day; a reply request belongs to `workflows/triage.md`.
- **Conservative by design.** Every write carries `#inbox/needs-review` and a provenance line. Decisions and status-frontmatter changes never write automatically.
- **Shares files, not semantics.** Marker prefixes keep the two skip-checks from colliding on the shared dotfiles; processing a message once per workflow is expected, not a bug.
- **Review queue is the safety net.** Writes surface in vault-lint's review queue after 7 days if untouched; the sweeper never revisits its own writes.

All output follows VOICE.md.
