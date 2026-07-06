# Relationship Cadence

Action view of who is overdue for real face time: direct reports and key stakeholders. Read-mostly. The only output is an in-chat report, plus optional staged drafts if the user picks a suggested opener.

> **Trigger phrases**: "cadence check", "who am I overdue to see", "relationship check". Intended as a Friday ritual alongside roundtable prep and vault lint, also runs on demand.

---

## Step 1, Scope and Mode

Storage-mode branching: `_conventions.md` → Storage-mode branching.

- **Obsidian mode**: read `People/` notes (frontmatter plus `## Observations`).
- **Filesystem mode**: read `team/` (direct reports) and `stakeholders/` files.

Both modes cover the same two populations: direct reports and stakeholders. People with `status: departed` are excluded from both.

---

## Step 2, Gather Recency Data

**Direct reports.** Read `last_1on1` frontmatter (or the equivalent note in filesystem-mode `team/` files, if tracked there). Compute days since. This is exact, not a proxy.

**Stakeholders** (no `last_1on1` field). Use a recency proxy, in order:

1. The most recent dated entry in the person's `## Observations` section (`### YYYY-MM-DD - ...`).
2. If no recent observation, the newest meeting note that wikilinks them: Obsidian mode, backlinks via the graph MCP tool or Grep for `[[Name]]` (`_conventions.md` → Vault access tooling); filesystem mode, Grep `meetings/notes/` for their name.

Whichever proxy is used, label it as such in the output. It approximates last real contact, it is not a guarantee. A person can be current without an entry if the user knows otherwise, so treat this as a prompt, not a fact.

---

## Step 3, Apply Thresholds

Committed defaults:

| Population | Threshold |
|---|---|
| Direct reports | 21 days |
| Key stakeholders (listed in `context.md` → Key Stakeholders) | 45 days |
| Other people (not a direct report, not in Key Stakeholders) | none, skip |

Check `context.md` → "Notes for Lore" for a "Cadence" line before applying the defaults above; if present, use its overrides instead. It is optional, never require it.

**Escalation.** Anyone overdue by more than 2x their threshold (direct reports past 42 days, key stakeholders past 90) gets listed first in their section with a stronger flag, e.g. "significantly overdue."

---

## Step 4, Build the Report

In-chat only, not a file, unless the user asks for one written to `outbox/`.

```markdown
## Cadence Check, [Date]

### Overdue Direct Reports
**[Name]** (significantly overdue), [N] days since last 1:1, last topic: [newest observation headline]
> Suggested opener: [one line grounded in the last real interaction]

**[Name]**, [N] days since last 1:1, last topic: [newest observation headline]
> Suggested opener: [one line grounded in the last real interaction]

### Drifting Stakeholders
**[Name]** (significantly overdue), ~[N] days since [proxy type], why they matter: [from context.md Key Stakeholders notes]
> Suggested opener: [one line grounded in the last real interaction]

(Proxy is approximate: based on [observation date / backlinked meeting], not a confirmed last-contact date.)
```

If everyone is current, say so in one line and stop: "Cadence check: everyone's current, no one overdue." Don't render empty section headers.

**Suggested openers** follow VOICE.md: one line, grounded in the last real thing discussed (a project, a concern, a follow-up), not a generic "let's catch up." These are suggestions surfaced in chat. Draft-and-hold applies: only stage one as an actual draft (Slack, email, Teams per `workflows/triage.md` conventions) if the user picks it; never draft all of them speculatively.

---

## Step 5, Cross-References

- **Vault-lint** (`workflows/vault-lint.md`) flags stale `last_1on1` as a hygiene finding, informational only. This workflow is the action view: it adds the recency proxy for stakeholders, thresholds, escalation, and suggested openers. When vault-lint surfaces staleness, point the user here for next steps.
- This workflow does not duplicate vault-lint's frontmatter or schema checks. If a person note is missing required fields entirely, that is vault-lint's job to catch, not this one's.

---

## Notes

- **Weekly cadence, callable anytime.** Intended for Friday alongside roundtable prep and vault lint; findings are idempotent between runs.
- **Approximate proxy, said out loud.** Never present a stakeholder's recency as exact when it is a proxy. If both an observation date and a backlinked meeting exist, use whichever is newer and say which one you used.
- **No auto-drafting.** Suggested openers are chat-only text until the user explicitly asks to draft one.
- **Cheap by design.** Read-only against existing notes; no writes except an optional staged draft the user requests.

All output follows VOICE.md.

— 📜 Lore
