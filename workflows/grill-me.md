# Grill Me

Interview the user relentlessly about a plan, proposal, or decision until every open question is resolved and you have reached genuine shared understanding. Trigger phrases: `CLAUDE.md` → Workflow routing.

## Source

Canonical logic lives upstream in `external/skills/skills/productivity/grill-me/SKILL.md`. Read it first and follow it. This file is the Lore-specific adaptation layer; where the two conflict, this file wins. Wrapper mechanics (submodule, fallback if empty): `CLAUDE.md` → Workflow routing, external skills bullet.

## Lore adaptations

1. **"Explore the codebase" becomes "explore the workspace."** Upstream: if a question can be answered by exploring the codebase, explore instead of asking. In Lore, the equivalent sources, in order:
   - `context.md` (role, priorities, team, stakeholders, terminology)
   - Obsidian vault in Obsidian mode: Read the relevant People, Projects, and Decisions notes directly; use the graph/backlink MCP tool (falling back to Grep for `[[Name]]`) to pull the linked neighborhood of an entity
   - `decisions/log.md` and `projects/*.md` in filesystem mode
   - Recent meeting notes and the action-items snapshot
   Never ask the user a question the workspace can already answer. Look it up, state what you found, move to the next real question. Storage mode and vault tooling: `_conventions.md` → Storage-mode branching, Vault access tooling.

2. **One question at a time, with a recommendation.** Carries over verbatim from upstream. Every question comes with your recommended answer and a one-line reason. The user should mostly be saying "yes" or "no, because", not writing essays.

3. **Walk the decision tree in dependency order.** Resolve upstream decisions before downstream ones. If an answer invalidates an earlier branch, say so and revisit it.

4. **Capture as you go.** Write down anything durable the moment it crystallizes, not in a batch at the end:
   - A decision meeting the decision-log test (`_conventions.md` → Decision-log discipline) goes to the decision log (vault `Decisions/` note in Obsidian mode, `decisions/log.md` in filesystem mode).
   - A new or sharpened term goes to `context.md` under Terminology & Corrections.
   - Anything else stays in the conversation and the final summary.

5. **End state.** The session ends when no unresolved branches remain. Close with a compact summary: what was decided, what was explicitly deferred, what (if anything) was written to the workspace. If the user wants the result as a document (talk track, proposal, brief), synthesize it from the session without re-asking anything already answered.

## Tone and output

Grilling means persistent, not hostile. Match the tone preference in `context.md` (`CLAUDE.md` → Session start, step 3) but do not soften questions into vagueness. A sharp question with a recommended answer is the kindest format. All output follows `VOICE.md`.
