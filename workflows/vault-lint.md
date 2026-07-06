# Vault Lint

Weekly health check for the vault: broken links, drift from note conventions, staleness, and archive candidates. Read-mostly. The only write it makes without asking is its own report; every fix or archive action is propose-first.

> **Trigger phrases**: "lint the vault", "vault health check", "run vault lint". Also intended for a weekly scheduled run.

---

## Step 1, Scope and Mode

Storage-mode branching: `_conventions.md` → Storage-mode branching.

Vault lint checks Obsidian-only conventions (frontmatter schemas, wikilinks, dataview blocks). If the session is in **Filesystem mode**, tell the user: "Vault lint checks Obsidian-specific structure and doesn't apply in filesystem mode." Stop; don't attempt a filesystem-mode equivalent.

If Obsidian mode, confirm the vault path from `context.md` → Vault Configuration and proceed.

---

## Step 2, Run the Checks

Prefer the Semantic Notes Vault MCP query tools (`dataview`, `graph`, `vault`) for each check; fall back to Grep automatically if the MCP is unreachable, per `_conventions.md` → Vault access tooling. All checks are read-only; collect findings before proposing any change.

**a. Broken wikilinks.** Find every `[[target]]` (Grep `\[\[([^\]|#]+)` or the graph tool) and confirm each target resolves to a note. Report unresolved targets with source note and line.

**b. Orphan notes.** Entity notes (`type: person`, `project`, `decision`) with zero backlinks (graph tool, or Grep for `[[<title>]]` as fallback). Informational, not an error: new or standalone notes are legitimate.

**c. Frontmatter validity.** For every entity note: YAML parses; wikilink values are quoted (`_conventions.md` → Frontmatter hygiene); required fields for the note's `type` are present (`_conventions.md` → Frontmatter schemas); enum fields hold an allowed value (`status`, `role`, `kind`, etc). Report the note and the specific field that fails.

**d. Schema drift on person notes.** Check every `People/` note against `_conventions.md` → Person note structure: an `# Name` H1 (should have none); a `## Overview` table (identity data belongs in frontmatter only); thematic Observations subsections instead of one flat `## Observations` heading; a missing `## Active Projects` section, or one whose dataview block doesn't match the canonical query verbatim (hand-edited or stale).

**e. Staleness.** Direct reports (`role: direct-report`) whose `last_1on1` is over 21 days old or missing. Projects with `status: active` and no dated entry in `## Current Phase` in the last 14 days.

**f. Contradictions.** Best-effort, flag only, never auto-resolve. Compare recent person-note observations against project frontmatter for the same project (e.g. an observation says a project shipped, but `status:` is still `active`), and the reverse.

**g. Index freshness.** Every entity note (person, project, decision) appears in `Index.md` and vice versa. Compare counts per category between the vault listing and the index.

**h. Review queue.** Notes or `### YYYY-MM-DD` observation entries tagged `#inbox/needs-review` older than 7 days. Surface for the user to confirm or discard, don't act on them.

---

## Step 3, Archive Candidates (propose-first, never auto-move)

Identify, don't move: people with `status: departed`; projects with `status: done` where the most recent dated entry is more than 90 days old; meetings more than 12 months old.

For each candidate, draft a one-paragraph synthesis to write into the surviving entity note before archiving (summarize-before-archive: the departed person's tenure and impact, the finished project's outcome, etc). Present candidates with their draft synthesis and wait for approval.

**On approval only** (per-item or per-batch, always explicit, never assumed):

1. Write the synthesis into the entity note (Edit, append; don't overwrite existing content).
2. Move the note to `Archive/<original folder>/` (e.g. `People/Jane Doe.md` → `Archive/People/Jane Doe.md`).
3. Update `Index.md` to reflect the new location or mark the entry archived.
4. Leave wikilinks elsewhere as `[[Name]]`; Obsidian resolves moved notes by title automatically.

Never archive anything the user hasn't approved in that session, even if it was proposed in a prior run.

---

## Step 4, Write the Report

Write to `outbox/vault-lint-YYYY-MM-DD.md` (today's date). Two-step existence check first (`_conventions.md`), though same-day re-runs should overwrite rather than duplicate, confirm with the user if the file already exists today.

Structure:

```markdown
# Vault Lint, YYYY-MM-DD

## Summary
[N] notes scanned. [N] findings ([N] broken links, [N] invalid frontmatter, [N] schema drift, [N] stale, [N] contradictions, [N] orphans, [N] index mismatches, [N] review-queue items).

## Broken Links
- [source note]: [[target]] does not resolve

## Invalid Frontmatter
- [note]: [field] [missing / not quoted / invalid value]

## Schema Drift
- [note]: [violation]

## Staleness
- [note]: [what's stale, how long]

## Contradictions (flagged, not resolved)
- [note] vs [note]: [the conflict]

## Orphan Notes (informational)
- [note]

## Index Mismatches
- [note] missing from Index.md / [entry] in Index.md has no note

## Review Queue (#inbox/needs-review, >7 days)
- [note or entry], tagged [date]

## Archive Candidates
- [note]: [reason]. Draft synthesis: [one paragraph]. Awaiting approval.
```

Follow VOICE.md: bullets, no padding, lead with the finding. Findings are grouped broken-links-and-invalid-YAML-first because those break Dataview views silently.

End the report:

```
— 📜 Lore
```

---

## Step 5, Offer to Fix

After the report, offer a single batch fix for mechanical findings only: quoting an unquoted wikilink value; adding a missing required frontmatter field where the value is unambiguous (e.g. restore `type: person` if inferable from folder); restoring a hand-edited or missing `## Active Projects` dataview block to the canonical query (`_conventions.md` → Person note structure); adding a tag directly implied by existing frontmatter (e.g. `role: direct-report` but no `#person/direct-report` tag).

Present the proposed fixes, get one confirmation for the whole batch, then apply with Edit (surgical, not full rewrites) and re-read each changed note to confirm the edit landed.

Everything judgment-shaped stays flagged only, never auto-fixed: contradictions, staleness, orphans, archive candidates. These need the user's read on intent, not a mechanical patch.

---

## Notes

- **Cheap by design.** No writes except the report and the confirmed fix batch; everything else is a proposal the user can ignore.
- **Weekly cadence, callable anytime.** Findings are idempotent; re-running just regenerates the report.
- **Never skip the mode check.** Filesystem-mode folders have no frontmatter schema or wikilinks by design, so lint checks would just produce false positives.

All output follows VOICE.md.
