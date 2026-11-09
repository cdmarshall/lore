# Talent Review

Assess one direct report, or calibrate the whole team, against the talent framework the user works by. Lore builds the evidence; the user makes the call.

> **Trigger phrases**: "Review [name]'s performance", "Prep [name]'s annual review", "Calibrate my team", "Where is [name] right now?", "Talent review"

Lore uses the framework the user records in `context.md` → "Notes for Lore" → Talent framework, and tells the user plainly when there isn't one. It ships one opt-in starter, `playbooks/starter-talent-framework.md`, and uses it only after the user adopts it. The rules every step follows live in `_conventions.md` → Talent framework; this file is the procedure.

---

## Instructions

### 1. Load the framework, or say there isn't one

Read `context.md` → "Notes for Lore" → Talent framework.

- **Recorded:** read the note or document it links in full (in Notion mode, `notion-fetch` the page; never work from memory of it). Write down what it actually defines: its dimensions or criteria, any scale or categories, any distinctions it draws, what it says about reviews or development, and any gaps the context file lists. Use only those parts in the steps below.
- **Not recorded, or the link can't be read:** tell the user before going further, in one or two plain sentences: "You don't have a talent framework recorded, so I'll build this from dated evidence only, with no ratings or categories. If you review people by a framework, point me at it and I'll use it from now on, or say 'use the starter framework' to adopt Lore's starter." On a run with no one present, put the same notice at the top of the deliverable. Then continue in evidence-only mode: never invent a framework, borrow one from `playbooks/`, or rate anyone.

To adopt the starter ("use the starter framework"): add the Talent framework section to `context.md` naming `playbooks/starter-talent-framework.md` as the framework, its four parts, and its known gaps (what it leaves to the company), then read the playbook as the framework note. Say it is now recorded and can be swapped for the company's own anytime.

To record a framework the user points at: summarize it into the knowledge base (a Notes reference page, or `playbooks/` in filesystem mode if the user wants it there), then add the Talent framework section to `context.md` with the name, source, link, its parts, and its known gaps.

### 2. Scope

From the request, settle:
- **Who:** one person, or every direct report in `context.md` → My Team for a calibration.
- **Kind:** a review (a period), a calibration (all reports side by side), or a current read (where someone is right now).
- **Window:** default for a review or calibration: since the person's start date or the last review, whichever is later. Default for a current read: the last 30 days. Say the window in the output.

### 3. Gather evidence

For each person, read what `workflows/1on1-prep.md` steps 2 to 6 read, over the window instead of since the last 1:1:
- Their person note: observations, working style, growth areas, career goals, 1:1 history.
- Meeting notes they attended, the commitments ledger, and The Quest Log items from or delegated to them.
- Team chat with them in the window, read rather than searched (`_conventions.md` → Recap sourcing → Read conversations, don't just search them).
- Their work in the recorded work tracker (shipped, stalled, reopened) when it's connected.

Every piece of evidence keeps its date and source. Name the coverage you actually had ("person note, 9 meeting notes, Slack DMs since 10/12; work tracker not checked").

### 4. Organize the evidence

**With a framework,** for each person:
1. **Evidence by the framework's parts.** Each dimension or criterion it defines gets its dated, sourced evidence, strengths and concerns both. Thin evidence is labeled "thin", not filled.
2. **Where it points, only if the framework defines a scale or categories.** A suggestion, labeled as one, with the one or two facts that drive it. Keep any distinctions the framework draws (for example between kinds of gap, or between a long-run and a current view) and say which one each section is.
3. **Next moves.** What the framework says to do for where this person is, turned into 2 or 3 concrete moves for the next month. If it gives no development guidance, say so and list moves the evidence supports.
4. **Framework gaps hit.** Any case it doesn't cover, stated plainly.
5. **Questions for the user.** What only they can judge.

**Evidence-only (no framework),** for each person: strengths with evidence, concerns with evidence, open questions, and 2 or 3 suggested next moves. No ratings, placements, or categories.

For a calibration, add a side-by-side table: person, then one column per framework part (or strengths and concerns in evidence-only mode), evidence depth (high, medium, low), and an empty "Your call" column.

Never write a rating, placement, or performance label anywhere outside this private document unless the user states it. Health and private matters are never evidence.

### 5. Deliver

**A styled HTML document** from `templates/document.template.html` (kicker "Talent review", title = the person's name or "Team calibration", meta = window, date, and the framework used or "No framework recorded"), written to `outbox/YYYY-MM-DD-<name-or-team>-talent-review.html`, branded and published as a **private** claude.ai artifact (`python3 scripts/apply-brand.py <file> --artifact <copy> --title "<title>"`, then the Artifact tool). Map: evidence → `table.doc`; a suggested placement → a card marked as a suggestion; next moves → `checklist`; framework gaps, or the no-framework notice → `callout` at the top; questions → a decisions table. Say in chat that the page is private and stays that way unless the user shares it.

Run a verifier pass before publishing: every claim traces to a dated source, no rating appears that the user didn't give, nothing uses a framework part the recorded framework doesn't define, the no-framework notice is present when it applies, and VOICE.md holds.

### 6. After the user decides

Write only what the user states:
- Their stated rating or placement, as a dated observation on the person's note ("<date> - Talent review: you placed <name> as ..."), only if they ask for it to be recorded.
- Development actions as `propose` ops to The Quest Log (`workflows/action-items.md`).
- Anything for the person's next 1:1 as an agenda note on their page.

All output follows VOICE.md.

📜 Lore
