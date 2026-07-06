# Templates

Canonical file templates used by Lore's onboarding workflow and ongoing operations.

## What lives here

| Template | Used by | Purpose |
|----------|---------|---------|
| `context.template.md` | onboarding | Master user profile (role, team, stakeholders, priorities, tools, working style) |
| `team-member.template.md` | onboarding + team workflows | Direct report profile structure. Written in Obsidian-note form (YAML frontmatter, Dataview block); filesystem mode copies it to `team/[firstname].md` as-is, Obsidian mode translates it into `People/<Full Name>.md` |
| `stakeholder.template.md` | onboarding + transcript processing | Stakeholder profile structure. Same Obsidian-note form as `team-member.template.md`, targeting `stakeholders/[firstname-lastname].md` (filesystem) or `People/<Full Name>.md` (Obsidian) |
| `meeting-note.template.md` | process-transcript workflow | Standardized meeting note format |
| `decision-log-entry.template.md` | process-transcript workflow | Single decision entry format for `decisions/log.md` |
| `project.template.md` | onboarding, ingest, ingest-notes, process-transcript | Project file structure for `projects/[slug].md` |
| `weekly-review.template.md` | weekly review ritual | Format for `weekly-reviews/YYYY-MM-DD.md` |
| `email-config.template.md` | triage workflow | First-run scaffold for `email-config.md` (sender tiers) |
| `triage-config.template.md` | triage workflow | First-run scaffold for `triage-config.md` (operational config) |
| `action-items-artifact.template.html` | onboarding, all action-item pushes | Canonical artifact HTML template. Used by `scripts/build-action-items-artifact.js` to substitute the operations seed. |

## Conventions

- Most placeholders are wrapped in square brackets: `[Name]`, `[Title]`, `[Company]`. The config templates (`email-config.template.md`, `triage-config.template.md`) use angle brackets instead: `<Name>`, `<e.g. U0XXXXXXX>`.
- Blockquote guidance (`> ...`) explains what a section is for; remove it once the section is filled in. A few templates also use `<!-- ... -->` comments for the same purpose (e.g. the Observations section in `team-member.template.md` and `stakeholder.template.md`).
- Tables include a single empty row to indicate structure; agents should add new rows as needed.

## When to edit

Edit a template only if you want to change the format for all future files of that type. Existing user files generated from these templates will not be retroactively updated.

## When NOT to edit

Don't edit these to add personal data. Personal data goes in the generated files (`context.md`, `team/*.md`, `stakeholders/*.md`, etc.), not in the templates.
