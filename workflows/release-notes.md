# Generate Release Notes from Jira

Generate user-facing release notes from Jira tickets, organized by category.

## Input

**Provide one of the following** when asking for release notes:
- A comma-separated list of Jira ticket IDs/keys (e.g., "PROJ-123, PROJ-456, OTHER-789")
- A JQL query (e.g., "fixVersion = '2025.02' AND project = PROJ")
- Natural language instructions (e.g., "all tickets in the current sprint", "tickets released last week")

## Instructions

1. **Parse the input** to determine if it's:
   - Specific ticket keys (contains patterns like `PROJ-123`)
   - A JQL query (contains JQL operators like `=`, `IN`, `AND`, `OR`)
   - Natural language instructions (convert to appropriate JQL)

2. **Fetch tickets from Jira** using an available MCP connector:
   - For specific keys: fetch each ticket individually
   - For JQL/instructions: run the JQL search
   - **Only search in the projects listed in `context.md`** under Tools & Integrations / Jira
   - Request fields: `summary`, `issuetype`, `status`, `description`, `labels`

3. **Categorize tickets** based on issue type:
   - **New Features**: Story, Feature, Epic, Initiative
   - **Bug Fixes**: Bug, Defect
   - **Enhancements**: Task, Improvement, Sub-task, Spike, or anything else

4. **Generate release notes** in this format:

```markdown
# Release Notes

## New Features

- **[PROJ-123](<jira-url>/browse/PROJ-123)**: User-friendly summary of the feature

## Bug Fixes

- **[PROJ-456](<jira-url>/browse/PROJ-456)**: Clear description of what was fixed

## Enhancements

- **[OTHER-789](<jira-url>/browse/OTHER-789)**: Description of the improvement
```

The `<jira-url>` should be the Jira instance URL from the user's tooling (typically captured during onboarding or visible in `context.md`). If unknown, use the project key alone or ask the user.

5. **Writing guidelines**:
   - Write for end users, not developers.
   - Use active voice and present tense ("Users can now..." not "Added ability to...").
   - Focus on the benefit/outcome, not implementation details.
   - Keep each item to 1-2 sentences.
   - Omit sections that have no items.
   - Include clickable Jira links if the instance URL is known.

6. **Output the release notes** directly — do not save to a file unless asked.

## Examples

**Input**: "PROJ-100, PROJ-101, PROJ-102"
**Action**: Fetch each ticket individually and categorize

**Input**: "fixVersion = '2025.02' AND project = PROJ AND status = Done"
**Action**: Run JQL search and categorize results

**Input**: "all completed tickets from the January sprint"
**Action**: Convert to JQL like `project IN (<projects from context.md>) AND sprint = 'January Sprint' AND status = Done`
