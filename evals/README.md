# Evals

This is Lore's output-quality eval harness. It calibrates the VOICE.md verifier against real examples of what good and bad look like, so the verifier has more to work with than the abstract rules in `VOICE.md` alone.

## Structure

`evals/examples/` holds this user's eval pairs. It is gitignored: the contents are real excerpts from this user's own artifacts, not generic training data. Each example is one markdown file, named `NN-<slug>.md`, with three sections:

- **`## Original`** - a real past artifact, quoted verbatim. Usually a representative excerpt, not the whole document.
- **`## Target`** - how that excerpt should have read per `VOICE.md`.
- **`## Lesson`** - one or two sentences naming the failure pattern, not just describing this one instance of it.

## Usage contract

**When a verifier grades an outward-facing artifact against `VOICE.md`**, it also reads 2-3 relevant examples from `evals/examples/` as calibration before passing or failing the draft. Pick examples whose failure pattern is plausibly present in the draft under review; skip the rest. The examples make the abstract rules concrete: they show what a violation actually looks like in this user's real writing, not just the rule that was broken.

**When the user corrects an output's style** (rewrites a sentence, flags a tone problem, pushes back on phrasing), that correction gets distilled into a new example file at that moment. Capture the original (what Lore produced), the target (what the user actually wanted), and the lesson (why, in general terms). Don't wait for a batch cleanup; write the file as part of closing out that correction.

## Why this exists

`VOICE.md` states the rules. The examples show the rules failing and succeeding in this user's actual context, which is what a verifier needs to catch violations that are technically subtle (a hedge stack that doesn't use the word "perhaps," a status line that's padded but not obviously so). Growing this set over time is how the verifier gets sharper without rewriting `VOICE.md` itself.
