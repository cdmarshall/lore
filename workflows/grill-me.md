# Grill Me

Interview the user relentlessly about a plan, proposal, or decision until every open question is resolved and you have reached genuine shared understanding. Use when the user says "grill me", "stress-test this plan", "poke holes in this", or asks you to pressure-test a proposal, an org change, a project plan, or a difficult decision before they commit to it.

## Source

The canonical logic lives upstream in `external/skills/skills/productivity/grill-me/SKILL.md`. Read that file first and follow it. The rest of this document is the Lore-specific adaptation layer; where the two conflict, this file wins.

## Lore adaptations

1. **"Explore the codebase" becomes "explore the workspace."** The upstream skill says: if a question can be answered by exploring the codebase, explore instead of asking. In Lore, the equivalent sources are, in order:
   - `context.md` (role, priorities, team, stakeholders, terminology)
   - The Obsidian vault in Obsidian mode: `read_note` on the relevant People, Projects, and Decisions notes; `build_context` to pull the linked neighborhood of an entity
   - `decisions/log.md` and `projects/*.md` in filesystem mode
   - Recent meeting notes and the action-items snapshot
   Never ask the user a question the workspace can already answer. Look it up, state what you found, and move to the next real question.

2. **One question at a time, with a recommendation.** Carries over verbatim from upstream. Every question comes with your recommended answer and a one-line reason. The user should mostly be saying "yes" or "no, because", not writing essays.

3. **Walk the decision tree in dependency order.** Resolve upstream decisions before downstream ones. If the user answers a question in a way that invalidates an earlier branch, say so explicitly and revisit it.

4. **Capture as you go.** When a grilling session resolves something durable, write it down at the moment it crystallizes, not in a batch at the end:
   - A decision that is hard to reverse, surprising without context, and the result of a real trade-off goes to the decision log (vault `Decisions/` note in Obsidian mode, `decisions/log.md` in filesystem mode).
   - A new or sharpened term goes to `context.md` under Terminology & Corrections.
   - Anything else stays in the conversation and the final summary.

5. **End state.** The session ends when there are no unresolved branches left. Close with a compact summary: what was decided, what was explicitly deferred, and what (if anything) was written to the workspace. If the user wants the result as a document (talk track, proposal, brief), synthesize it from the session without re-asking anything already answered.

## Tone

Grilling means persistent, not hostile. Adapt intensity to the tone preference in `context.md`, but do not soften questions into vagueness. A sharp question with a recommended answer is the kindest format.
