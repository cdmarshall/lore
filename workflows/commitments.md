# Commitments

Tracks the softer ledger of promises: not action items, but the things that surround them. All output follows VOICE.md.

> **Trigger phrases**: "what am I waiting on", "show my commitments", "who owes me what", "track this promise".

---

## Concept and boundary with action items

The action-items artifact (`workflows/action-items.md`, its own untouchable source of truth) tracks the user's tasks and formal delegations: concrete, actionable, owned. Commitments tracks what sits around that: things **others** said they'd do for the user (waiting-on), things the **user** said they'd do that aren't task-shaped yet ("I'll get you numbers by Friday," "let's revisit in Q3"), and time-bombs ("check back after the pilot ships").

**The boundary, stated plainly:** if a commitment crystallizes into a real task (owner clear, action concrete, worth tracking to completion), it graduates to the action-items artifact via an `add` op and gets removed from the ledger here. Never track the same item in both places. When in doubt, ask: "is this something I'd put a due date and a checkbox on in the artifact?" If yes, it's an action item, not a commitment. Soft language ("should," "hoping to," "let's see") is a good signal it belongs here instead.

## Storage

One ledger note, three sections plus a trailing resolved log.

- **Obsidian mode:** `Commitments.md` at the vault root, alongside `Index.md`. Not in a subfolder.
- **Filesystem mode:** `commitments.md` at the repo root (gitignored; the harness wires `.gitignore`, not this workflow).

Section skeleton (create verbatim if the note doesn't exist):

```markdown
## Waiting on

## Promised

## Revisit

## Resolved (recent)
```

Entry format, one line each:

```markdown
- [ ] [[Person]]: <what> (due <date or TBD>; source: <meeting note wikilink / channel / email subject>, <captured date>)
```

Obsidian mode wikilinks the person (`[[Person]]`); filesystem mode uses a plain name. `due` is a date, a rough marker ("after the pilot," "Q3"), or `TBD`. `source` is a provenance pointer, a meeting note wikilink, a Slack channel, an email subject line, whatever grounds the entry, plus the date it was captured.

Two-step existence check (`_conventions.md`) before the first write of the session; create the note with the section skeleton above if missing. After that, append via Edit, never rewrite the whole file.

## Sections

- **Waiting on**: others owe the user something.
- **Promised**: the user owes others something, not yet task-shaped.
- **Revisit**: date-triggered check-backs with no owed action yet ("circle back after Q3 planning").
- **Resolved (recent)**: completed items get their checkbox ticked and move here. Prune past 10 entries, oldest first.

## Capture ("track this promise")

When the user says "track this promise" or a workflow hooks in mid-process (see Hooks below):

1. Determine the section: who owes whom decides Waiting on vs Promised; no owed action yet is Revisit.
2. Determine the person, due marker, and source. Ask only for whatever's missing and essential; don't re-interview for context already given.
3. Two-step existence check, then Edit to append the entry line under the right section heading.
4. Confirm the line as written, plainly, no signet (this is an in-chat confirmation, not an authored document).

## The view (on trigger)

1. Two-step existence check, then read the ledger.
2. Group by section as stored. Within each section, flag:
   - **Overdue**: `due` is a real date in the past.
   - **Stale**: captured date is more than 30 days ago with no movement (no edit, no resolution).
3. Render a compact list per section, overdue and stale entries called out inline (e.g. "OVERDUE" or "STALE" tag after the line).
4. Offer three things, don't act unasked:
   - **Nudge drafts** for overdue Waiting-on items: draft-and-hold per CLAUDE.md, a short check-in message following VOICE.md, staged, never sent.
   - **Graduation** for Promised items that have become task-shaped: propose the `add` op, and on confirmation push it (`workflows/action-items.md` procedure) and remove the line from the ledger.
   - **Resolution marking**: check off and move to Resolved (recent) on confirmation; prune past 10.

## Maintenance

- **Departed people**: if a Waiting-on or Promised entry involves someone whose person note carries `status: departed` (`_conventions.md` → Frontmatter schemas), flag it on next view: the commitment likely needs reassignment or closure. Don't auto-resolve, surface it.
- Entries never silently disappear. Every removal is either a graduation (logged, pushed to the artifact) or a resolution (moved to Resolved (recent)).

## Boundary reminders

- Never duplicate an item that already lives in the action-items artifact. If a transcript or sweep produces something clearly task-shaped, it goes straight to an `add` op, not here.
- Never write to `inbox/action-items.md`; this ledger is a separate file entirely and has no relationship to that legacy backup.

— 📜 Lore
