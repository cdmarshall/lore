# Templates

Canonical file templates used by Lore's onboarding workflow and ongoing operations.

## What lives here

| Template | Used by | Purpose |
|----------|---------|---------|
| `context.template.md` | onboarding | Master user profile (role, team, stakeholders, priorities, tools, working style) |
| `team-member.template.md` | onboarding + team workflows | Direct report profile structure |
| `stakeholder.template.md` | onboarding + transcript processing | Stakeholder profile structure |
| `meeting-note.template.md` | process-transcript workflow | Standardized meeting note format |
| `decision-log-entry.template.md` | process-transcript workflow | Single decision entry format for `decisions/log.md` |
| `weekly-review.template.md` | weekly review ritual | Format for `weekly-reviews/YYYY-MM-DD.md` |
| `action-items.template.md` | onboarding + email-triage | Format for `inbox/action-items.md` |

## Conventions

- Placeholders are wrapped in square brackets: `[Name]`, `[Title]`, `[Company]`.
- Comments wrapped in `<!-- ... -->` are guidance for the writer (Lore or the user); they should be removed when the file is generated.
- Tables include a single empty row to indicate structure; agents should add new rows as needed.

## When to edit

Edit a template only if you want to change the format for all future files of that type. Existing user files generated from these templates will not be retroactively updated.

## When NOT to edit

Don't edit these to add personal data. Personal data goes in the generated files (`context.md`, `team/*.md`, `stakeholders/*.md`, etc.), not in the templates.
