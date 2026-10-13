# 1:1 Prep

Prepare for a one-on-one meeting with a team member or key stakeholder.

> **Trigger phrases**: "Help me prep for my 1:1 with [name]", "Prep for my 1:1", "What should I cover with [name]?"

---

## Instructions

### 1. Identify Who and When

From the user's request, determine:
- **Who** the 1:1 is with (match against `team/` files; use context.md if unclear)
- **When** it is (today or a specified date)

### 2. Read Source Files

Storage mode: see `_conventions.md` → Storage-mode branching.

Read in parallel:
- `team/[name].md`, their profile, active projects, recent observations, commitments
- Open Waiting on / Promised entries involving this person from the commitments ledger (`workflows/commitments.md`)
- Agent sessions since the last 1:1 that touch this person or their projects, per `_conventions.md` → Recap sourcing. This is how you catch a promise the user already delivered on in a session and would otherwise walk in still owing.

For action items involving this person (sourced from them, delegated to them, etc.), query The Quest Log with ArtifactData (`workflows/action-items.md` → Reading current state): `active` items whose `from` names them and `delegated` items whose `delegatedTo` does. Use them for sections 4 and 5. If the tracker can't be reached, build the prep from `team/[name].md` and say plainly that action items are missing.

Never read `inbox/action-items.md` or `inbox/action-items.snapshot.md`; both are retired.

### 3. Pull Active Projects and Commitments

Identify which active projects this person is involved in:

- **Obsidian mode**: active projects are not hand-maintained on the person's note (see `_conventions.md` → Person note structure). Query project notes in `Projects/` directly for `lead = [[Name]]` or `stakeholders` containing `[[Name]]`: prefer the dataview MCP tool for this frontmatter query first, falling back to Grep `Projects/` for `[[Name]]` and confirming the `lead`/`stakeholders` field in each hit's frontmatter block (list fields are multi-line YAML; key-line-only patterns miss them, `_conventions.md` → Vault access tooling), then verify with the raw project notes.
- **Filesystem mode**: check `team/[name].md` for any project context noted there, then cross-reference `projects/[slug].md` files as the authoritative source.

For each project surfaced:
- Pull the `## Current Phase` section for a status snapshot.
- Flag any that haven't had an update since the last 1:1 (compare the most recent dated entry in `## Current Phase` against the last 1:1 date established below).

**Establishing the last 1:1 date (do this before anything that depends on it).** Take the **later** of the `last_1on1` frontmatter value and the newest 1:1 meeting note found in `Meetings/`. Never use the frontmatter value alone: it is only as fresh as the last workflow run that wrote it, and a 2026-07-30 audit found it eight weeks stale on one direct report and missing entirely on two others. When the two disagree, trust the meeting notes, say so in the prep, and repair the frontmatter.

To find the newest 1:1 meeting note, do not filter on `kind` alone. A meeting counts as a 1:1 when any of these hold: `kind: 1on1`; or the title contains `1on1`, `1:1`, or `1-1`; or the attendee list is exactly the user plus this person. The same audit found 15 of 17 notes in one four-day window with `kind` blank, so a `kind`-only query silently reports stale dates and produces the "you haven't met in three weeks" error when you met last week.
- Note any commitments they made in the last 1:1 and whether they've been addressed.
- Note any commitments the user made that may need follow-up.

### 4. Surface Delegated Items (REQUIRED)

From The Quest Log (step 2), scan the delegated items for any where `delegatedTo` matches this person's name. These are items the user handed off and needs to close the loop on.

If any exist, list them in the prep under **Follow up on delegated items** with the subject, expected action, and delegation date. This is the primary mechanism for following up on delegated work.

If the tracker could not be reached, add a placeholder: *"(Check The Quest Log for items delegated to [Name].)"*

### 5. Identify Action Items to Discuss

From The Quest Log, surface from the active items:
- Any items sourced **From** this person that the user hasn't completed yet
- Any OVERDUE or ASAP items connected to their domain

If the tracker could not be reached, add a placeholder line in the prep brief.

### 6. Check for Feedback Signals

Scan `team/[name].md` Observations section for any recent patterns worth addressing:
- Development themes to reinforce or push on
- Concerns or blockers that have lingered
- Positive signals worth acknowledging

### 7. Generate Prep Brief

**Deliverable: a styled HTML document** built from `templates/document.template.html` (kicker "1:1 prep", title = the person's name, meta = date + meeting time/channel if known), written to `outbox/YYYY-MM-DD-<name>-1on1-prep.html` and linked as the primary output. Compose the body from the template's block library; the markdown structure below defines the content and section order, not the final format. Map: Active Projects and open items → `table.doc`; observations and growth notes → cards (use an `arcane` card for things Lore noticed rather than was told); the single most important thing → `callout`; suggested wording → `talk`; agenda → `checklist`. Only produce a bare markdown file instead if the user explicitly asks for markdown.

Content spec:

```markdown
# 1:1 Prep, [Name], [Date]

## Active Projects
| Project | Status | Last Update | Next Step | Flag? |
|---------|--------|-------------|-----------|-------|
| [Project] | [Status] | [Date / note] | [What's next] | [Stale / On track] |

## Follow Up on Delegated Items
*(Items you handed off, close the loop)*
| Item | Delegated | Expected Action |
|------|-----------|----------------|
| [Subject] | [Date] | [Expected action, from notes] |

*(Omit this section if nothing is delegated to this person)*

## Their Open Action Items (from your list)
- [Subject], [brief note, source date]

## Suggested Agenda Topics
- [Topic based on project status, delegated items, or observations]
- [Development theme to check in on]
- [Feedback to give, if any]

## Observations to Update After Meeting
*(Remind yourself to update team/[name].md after this 1:1)*
```

All output follows VOICE.md.

---

## After the 1:1

Remind the user to:
- Update `team/[name].md` with key discussion points, new commitments, and observations
- Mark any delegated items as Done (if completed) or Re-open them (if back on the user's plate) in the artifact
- Push any new action items to the artifact as `add` operations (see `workflows/action-items.md`)

— 📜 Lore
