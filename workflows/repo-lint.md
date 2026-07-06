# Repo Lint

Monthly health check for the instruction files themselves: `CLAUDE.md`, `workflows/`, `templates/`, `VOICE.md`. The committed layer, not the vault (vault-lint.md covers vault structure and content). Read-mostly. The only write it makes without asking is its own report; every fix is propose-first.

> **Trigger phrases**: "lint the workflows", "audit the instructions". Also a monthly run (`CLAUDE.md` → Ongoing rituals).

---

## Step 1, Run the Checks

**a. Redundancy.** Single-source rule: a behavioral rule lives in one committed file; every other mention is a one-line pointer. Grep known duplication magnets across all committed files: the action-items hard rule, the em-dash ban, the two-step existence check, storage-mode branching. A pointer is fine; a restated rule beyond one line is a finding. Report file, line, and which copy stays canonical.

**b. Dangling pointers.** Confirm every `` `_conventions.md` → <section> `` / `` `CLAUDE.md` → <section> `` reference resolves to a real heading (Grep the heading). Confirm every routing-table row in `CLAUDE.md` → Workflow routing points to a file that exists (`bash ls`). Confirm every workflow's own trigger phrases appear (verbatim or close paraphrase) as a routing-table row; a workflow with no routing row is a finding.

**c. Token creep.** `wc -w` every committed instruction file: `CLAUDE.md`, `VOICE.md`, each `workflows/*.md`. Compare against the Baseline Table below. Flag growth over 20% since the last baseline; name the likely cause (scope creep, duplicated rule, unpruned example) and propose a trim. Update the Baseline Table after review regardless of findings, that becomes the next comparison point.

**d. Behavior drift.** `bash ls outbox/`, read 2 to 3 recent files (briefs, sweeper changelogs, drafts). Check each against its generating workflow: right output path, verifier evidence where the workflow claims one, actual VOICE.md compliance. A mismatch means the workflow or the behavior is wrong; propose which.

**e. Committed-first violations.** Grep committed files for instance data (personal names, org email domains, channel IDs, ticket-project keys); committed files carry behavior only. Grep gitignored config files (`context.md`, `triage-config.md`, `email-config.md`) for policy-shaped rules, procedures or universal thresholds that read like instructions rather than instance data, and propose promoting them into the matching committed file. Read-only in both directions; never edit a user file without approval that session.

**f. STATE.md hygiene.** Read `STATE.md` if present. Flag: length over roughly 150 lines; resolved open-failures still listed (cross-check against recent verified facts or outputs); general rules broad enough to belong in `CLAUDE.md` or a workflow instead of session memory. Propose the promotion and the line to cut once promoted.

---

## Step 2, Write the Report

Write to `outbox/repo-lint-YYYY-MM.md` (this month). Two-step existence check first (`_conventions.md`); same-month re-runs overwrite, confirm with the user if the file already exists this month.

Structure:

```markdown
# Repo Lint, YYYY-MM

## Summary
[N] files scanned. [N] findings ([N] redundancy, [N] dangling pointers, [N] token-creep, [N] behavior drift, [N] committed-first, [N] STATE.md).

## Redundancy
- [rule]: stated in [file:line] and [file:line]. Canonical: [file]. Proposed diff: [what changes].

## Dangling Pointers
- [source file:line]: reference to [target] does not resolve.

## Token Creep
- [file]: [old] to [new] words ([+N]%). Likely cause: [reason]. Proposed trim: [what].

## Behavior Drift
- [outbox file] vs [workflow]: [mismatch]. Propose fixing: [workflow / behavior].

## Committed-First Violations
- [file:line]: instance data in committed file. Proposed move: [destination].
- [config file]: policy-shaped rule. Proposed promotion: [destination].

## STATE.md Hygiene
- [finding]: [line count / stale entry / promotion candidate].

## Baseline Table (updated this run)
| File | Words |
|---|---|
| CLAUDE.md | [N] |
| VOICE.md | [N] |
| workflows/*.md | [N] each |
```

Follow VOICE.md: bullets, no padding, lead with the finding. Redundancy and dangling pointers are grouped first, they cause the most silent drift.

End the report:

```
— 📜 Lore
```

---

## Step 3, Offer to Fix

Present every proposed diff as a description, not a patch, and wait for approval, per file or per batch. No committed file changes without explicit approval that session.

On approval: apply with Edit (surgical, not full rewrites), re-read each changed file to confirm the edit landed, update the Baseline Table entry for any file whose word count changed as a result.

---

## Notes

- **Cheap by design.** No writes except the report and the confirmed fix batch.
- **Monthly cadence, callable anytime.** Findings are idempotent; re-running regenerates the report and refreshes the baseline.
- **Complements vault-lint, doesn't overlap it.** Vault lint checks vault entity data and structure; repo lint checks the instructions that drive Lore's behavior. A broken vault-lint pointer inside a workflow is a repo-lint finding; a broken wikilink inside a vault note is vault-lint's.

All output follows VOICE.md.

---

## Baseline Table (initial, set 2026-07-06)

| File | Words |
|---|---|
| CLAUDE.md | 2109 |
| VOICE.md | 635 |
| workflows/1on1-prep.md | 826 |
| workflows/_conventions.md | 1877 |
| workflows/action-items.md | 2096 |
| workflows/grill-me.md | 429 |
| workflows/handoff.md | 424 |
| workflows/ingest-notes.md | 1256 |
| workflows/ingest.md | 479 |
| workflows/kb-sweeper.md | 1240 |
| workflows/morning-sync.md | 579 |
| workflows/onboarding.md | 3204 |
| workflows/plaud-sync.md | 1234 |
| workflows/process-transcript.md | 1755 |
| workflows/roundtable-prep.md | 902 |
| workflows/triage.md | 4261 |
| workflows/vault-lint.md | 999 |
