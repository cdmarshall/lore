# Ingest Document

Process a document and extract relevant information to update the knowledge base.

## Usage

- "Ingest a document" or "Process inbox files": list files in `inbox/documents/` and ask which to process
- "Ingest [filename]": process a specific file from `inbox/documents/`
- "Ingest [full path]": process a file from anywhere in the workspace

## Instructions

1. **Locate the file.** No file specified: list `inbox/documents/`, ask which to process. Filename given: look in `inbox/documents/`. Full path given: read from that location.

2. **Read and analyze the file** (PDF, text, markdown, images, CSV, etc.)

3. **Ask the user what to do with it:**
   - Update a project file (SOW, spec, brief, other project artifact: suggest the matching file in `projects/` or offer to create one from `templates/project.template.md`)
   - Add observations to a team member's file
   - Add observations to a stakeholder's file
   - Extract action items
   - Create a summary/reference document
   - Generate an output file (report, matrix, export, etc.)
   - Other (let user specify)

   If the document is clearly scoped to an active project (vendor SOW, product spec, project brief), default the suggestion to "update project file" and name the likely match. Don't suggest project-status content for `strategy/`; that folder holds vision and roadmap only.

4. **Process accordingly and confirm what was updated.** Storage mode: `_conventions.md` → Storage-mode branching.
   - Obsidian mode: Edit the project note `Projects/<Name>.md`, inserting the new content after the last line of the `Current Phase` section (or the person note `People/<Name>.md`, inserting the new observation above the first existing `###` entry in `## Observations`). No heading yet: Edit to add the full section to the note. New note: Write it at the target vault path. Vault access tooling: `_conventions.md` → Vault access tooling.
   - Filesystem mode: edit `projects/[slug].md` or the `team/`/`stakeholders/` file directly. Two-step existence check first: `_conventions.md` → Two-step existence check.

## File Locations

**Input:** `inbox/documents/`, or any file path the user gives. Action items: push via operations to the artifact, never read a local file (`workflows/action-items.md`).

**Output:** `CLAUDE.md` → Creating outputs. Reference docs meant for re-reading go back to `inbox/documents/`.

## Output Format

```
## Document Processed

**File:** [filename]
**Type:** [PDF/text/image/etc.]

**Summary:** [2-3 sentence summary of contents]

**What would you like me to do with this?**
1. Update project file: [suggested project]
2. Add to team member: [suggested person]
3. Add to stakeholder: [suggested person]
4. Extract action items
5. Create reference summary
6. Generate output file
7. Other

[Or if user specified, just do it and confirm]
```

All output follows VOICE.md.

## Examples

**PRD:** read it, ask if it should update a project file or create one, extract action items, note any stakeholders or team members mentioned.

**Org chart or roster:** update team member files with reporting relationships, note new people to track.

**Vendor proposal:** summarize key points, add to the relevant stakeholder file, extract action items or decisions needed.
