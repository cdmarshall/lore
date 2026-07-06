# Handoff

Compact the current conversation into a handoff document so a fresh session (or another agent) can continue the work without re-deriving context. Use when the user says "write a handoff", "hand this off", "wrap up this session", or when a long session is about to be continued elsewhere.

## Source

The canonical logic lives upstream in `external/skills/skills/productivity/handoff/SKILL.md`. Read that file first and follow it. The rest of this document is the Lore-specific adaptation layer; where the two conflict, this file wins.

## Lore adaptations

1. **Save location.** Upstream says to save to the OS temp directory. In Lore, save to `outbox/handoffs/YYYY-MM-DD-<short-slug>.md` instead, so handoffs survive and are findable. Create `handoffs/` if it does not exist. Two-step existence check first: `_conventions.md` → Two-step existence check.

2. **Don't duplicate, reference.** Carries over verbatim from upstream; matches the one-fact-once rule (`_conventions.md` → Linking and deduplication). If something is already in the vault, decision log, a project file, an outbox deliverable, or the action-items artifact, link to it by path or note title instead of restating it. The handoff is a map, not a copy.

3. **Suggested workflows section.** Upstream asks for a "suggested skills" section. In Lore, list the workflow files the next session should read (e.g., `workflows/triage.md`, `workflows/process-transcript.md`) and the active storage mode: `_conventions.md` → Storage-mode branching.

4. **Redaction.** Carries over verbatim: no credentials, tokens, or sensitive personal data in the handoff. Names and roles are fine; compensation, health information, and anything the user marked confidential are not.

5. **Arguments.** If the user says what the next session will focus on ("hand off for the roundtable prep tomorrow"), tailor the document to that focus: lead with the state relevant to it, trim the rest to one-line pointers.

6. **Update STATE.md too.** A handoff is a substantive session end, so the state-file write rule applies (CLAUDE.md → Key behaviors → State file): new verified facts, open failures, and the last-session pointer land in `STATE.md`; the handoff document links there rather than restating it.

## Structure

Use this skeleton, trimming sections that are empty:

- **Goal**: what the overall piece of work is and why
- **State**: what has been done, with links to artifacts produced
- **In flight**: what was mid-stream when the session ended, with exact next steps
- **Open questions**: things only the user can answer
- **Suggested workflows**: files to read, storage mode, relevant entity notes
- **Watch out for**: gotchas discovered this session (failed approaches, naming traps, tool quirks)

Sign with the signet (`CLAUDE.md` → Key behaviors).

All output follows VOICE.md.
