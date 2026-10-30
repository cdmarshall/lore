# Lore, Unrolled

The Wrapped-style recap: a designed, chart-heavy HTML page of the keeper's productivity over a period, built only from numbers Lore can actually count. Spotify wraps; a scroll unrolls.

> **Trigger phrases**: "unroll my scroll", "Lore unrolled", "my recap", "my wrapped", "unroll the quarter / the year / June". Default period: the trailing 90 days; honor any period the user names (a quarter, a month, a year, "since I started").

---

## Hard rules

- **Count, never invent.** Every number on the page comes from a source listed below. A stat whose source is missing or empty is dropped entirely; never render a zero for data that simply wasn't tracked. A young install produces a short scroll, and that's fine.
- **Show the window.** The masthead meta always states the exact period covered.
- **Estimates are labeled.** The time-reclaimed number is an estimate by construction; its math is printed on the page (see below). Everything else is a raw count.
- **Quest stats come straight from The Quest Log.** List every item with ArtifactData (`workflows/action-items.md` → Reading current state); the read is live, so there is no snapshot to request. If the tracker can't be reached, drop the quest sections and say why in one line.
- **Count the agent sessions too.** Per `_conventions.md` → Recap sourcing: Cowork sessions and the Claude Code digest at `inbox/cc-sessions/sessions.jsonl`. Sessions are where much of the quarter happened; a recap sourced only from notes and triage records undercounts it. Name the coverage in the footer.

## Data sources and how to count

Storage-mode branching per `_conventions.md` (vault paths in Obsidian mode, repo folders in filesystem mode). Everything is a read.

| Stat | Source | Method |
|------|--------|--------|
| Quests completed (+ per-week series) | Quest Log → `completed` items | rows with `completed` in window; bucket by ISO week |
| Quest velocity (added vs completed) | Quest Log → all items, `created` + `completed` | two series on one bar chart |
| Oldest quest slain | Quest Log → `completed` items | max(`completed` minus `created`), name it |
| Quest-giver leaderboard | Quest Log → `from` fields | top 5 by count, horizontal bar |
| Delegations per companion | Quest Log → `delegated` items → `delegatedTo` | tally |
| Sessions run (+ per-week series, per-project mix) | Cowork session history; `inbox/cc-sessions/sessions.jsonl` | count sessions active in the window (digest: any `activeDates` entry in window, never `start`); bucket by ISO week; `projectRoot` for the project mix |
| Days with session activity | Same digest | distinct `activeDates` in window. Never sum elapsed minutes into hours: wall-clock includes idle time |
| Meetings held (+ heaviest council day) | Meeting notes (`Meetings/` or `meetings/notes/`) | count notes dated in window; weekday histogram from dates |
| Most frequent companions | Meeting-note attendee/frontmatter fields | top names, excluding the user |
| Transcripts processed | `meetings/transcripts/.processed` + `.plaud-processed` + `.notion-meetings-processed` | line counts are all-time; for the window, count meeting notes dated in it that carry a source reference (transcripts are referenced, not copied) |
| The scroll grows | Vault (or `team/ stakeholders/ projects/ decisions/`) note `created` frontmatter or file dates | cumulative line chart; if creation dates are unavailable, show totals only, no growth curve |
| Decrees (decisions logged) | `Decisions/` notes or `decisions/log.md` entries | count dated entries in window |
| Sagas (projects started / completed) | Project notes' `status` + dated Current Phase lines | count transitions in window |
| Messages swept + channel mix | `outbox/triage/triage-*.md` stat lines ("Email: N new...") for runs in window | sum per source; doughnut |
| Drafts staged | Same triage stat lines ("D drafted") | sum |
| Heralds delivered | `outbox/briefs/*.html` filenames dated in window | count |
| Preps and reports produced | `outbox/*-prep.html`, `outbox/vault-lint-*.html` etc. dated in window | count |

## Time reclaimed (the estimate)

One hero number: hours Lore gave back. Computed as a sum of conservative per-artifact estimates, and the formula is always printed beneath the stat in an `aside` so it reads as the estimate it is:

| Artifact | Minutes credited |
|----------|-----------------|
| Transcript processed into notes + KB updates | 25 |
| Reply drafted by the Herald | 8 |
| Herald delivered (the sweep itself) | 10 |
| 1:1 / roundtable prep produced | 20 |
| KB write applied (observation, decision) | 4 |
| Vault lint / weekly review produced | 15 |

`Time reclaimed ≈ Σ (count × minutes) / 60`, rounded to the nearest hour. Footnote wording: "A conservative estimate: 25 min per processed transcript, 10 per sweep, 8 per drafted reply, 20 per prep, 4 per knowledge-base write, 15 per review. Your mileage is the fun part." Skip any term whose count was dropped.

## Composing the page

Build from `templates/document.template.html` (CLAUDE.md → Creating outputs), written to `outbox/unrolled-<period-slug>.html`, e.g. `unrolled-2026-q3.html`.

- **Masthead:** kicker "Lore, Unrolled", title = the period ("Q3 2026", "The year 2026"), meta left = exact date range, meta right = "<N> notes scanned" or similar. Dek = one playful, honest verdict ("A quarter of slain quests and one very patient vendor contract.").
- **Open with stat tiles** (`stat-row`): time reclaimed (gold), quests completed (ink), meetings (info), drafts staged (arcane), decisions (success). The time-reclaimed footnote `aside` goes directly under this row.
- **Charts follow `design-system/charts/README.md`**: inline `chart-theme.js`, embed the Chart.js engine block copied from `design-system/charts/demo.html` (never a CDN tag in outbox documents; Cowork's file preview blocks remote scripts), `LoreCharts.applyTheme(Chart)`, dither-fill every series, one `chartbox` block per chart.
- Suggested spread, skipping any without data: quests-per-week bars (dotted, with the added series hatched), heaviest-council-day weekday histogram, quest-giver leaderboard (horizontal bars), channel-mix doughnut, scroll-growth line.
- Between charts, one-line callouts for the superlatives: the oldest quest slain, the busiest week, the most frequent companion. `callout` for the single best stat of the period.
- Close with the signet footer (the template's) and `{{DOC_FOOT_RIGHT}}` naming the sources ("counted from The Quest Log, meeting notes, triage records, and Cowork plus Claude Code sessions through <date>").

## Tone

Playful and specific, celebratory without cheerleading (VOICE.md still applies: digits, no exclamation stacking, no em dashes). The scroll is proud of its keeper; it shows it with numbers, not confetti.
