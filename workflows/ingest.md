# Ingest Document

Process a document and extract relevant information to update the knowledge base.

## Usage

- "Ingest a document" or "Process inbox files", list files in `inbox/documents/` and ask which to process
- "Ingest [filename]", process a specific file from `inbox/documents/`
- "Ingest [full path]", process a file from anywhere in the workspace

## Instructions

1. **Locate the file:**
   - If no file specified, list files in `inbox/documents/` and ask which to process
   - If a filename is given, look in `inbox/documents/`
   - If a full path is given, read from that location

2. **Read and analyze the file** (supports PDF, text, markdown, images, CSV, etc.)

3. **Ask the user what to do with it:**
   - Update a project file (if the document is a SOW, spec, brief, or other project artifact: suggest the matching file in `projects/` or offer to create one using `templates/project.template.md`)
   - Add observations to a team member's file
   - Add observations to a stakeholder's file
   - Extract action items
   - Create a summary/reference document
   - Generate an output file (report, matrix, export, etc.)
   - Other (let user specify)

   **Note on project files**: If the document is clearly scoped to an active project (e.g., a vendor SOW, a product spec, a project brief), default the suggestion to "update project file" and name the likely match. Do not suggest adding project-status content to `strategy/`; that folder holds only vision and roadmap docs.

4. **Process accordingly** and confirm what was updated

   **Storage mode note:** When updating a project or person file, branch on the active storage mode (see `CLAUDE.md` → Obsidian Detection):
   - **Obsidian mode:** use `obsidian_patch_note` with `target: {"type": "path", "path": "Lore/Projects/<Name>.md"}` (or `Lore/People/<Name>.md`) and `section: {"type": "heading", "target": "Current Phase"}` (or `"Observations"`), `operation: "append"`. Use `patchOptions: {createTargetIfMissing: true}` if the heading may not exist. Use `mcp__obsidian__obsidian_append_to_note` to create a new vault note if one doesn't exist.
   - **Filesystem mode:** edit `projects/[slug].md` or `team/`/`stakeholders/` files directly. Run the two-step existence check before writing.

## File Locations

### Input locations (where source documents live):
- `inbox/documents/` - Drop documents here for processing
- The action items artifact (Cowork sidebar) is the canonical action items tracker; the agent pushes to it via operations rather than reading any local file. See `workflows/action-items.md`.
- User can also provide any file path on their system

### Output locations (where generated files go):
- `outbox/` - Generated files, exports, reports, matrices, scorecards
- `meetings/notes/` - Meeting notes and summaries
- `team/` - Direct report profiles and 1:1 notes
- `stakeholders/` - Stakeholder profiles and observations
- `projects/` - Project documentation (create if needed)

### When creating output files:
- Reports, exports, CSVs, generated documents → `outbox/`
- Meeting summaries → `meetings/notes/`
- Team/stakeholder updates → respective folders
- Reference docs that will be re-read → `inbox/documents/`

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

## Examples

**Processing a PRD:**
- Read the document
- Ask if it should update a project file or create a new one
- Extract any action items
- Note any stakeholders or team members mentioned

**Processing org chart or roster:**
- Update team member files with reporting relationships
- Note any new people to track

**Processing vendor proposal:**
- Summarize key points
- Add to relevant stakeholder file
- Extract action items or decisions needed
