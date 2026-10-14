# Notion knowledge base (Notion mode)

All output follows VOICE.md.

Notion mode keeps Lore's entity data (people, projects, meetings, decisions, transcripts, notes, context, commitments) in the user's Notion workspace instead of repo folders or an Obsidian vault. It is the third storage mode beside Filesystem and Obsidian (`_conventions.md` → Storage-mode branching). Workflows, templates, scripts and operational dotfiles stay in the repo; action items stay in The Quest Log in every mode.

> **Trigger phrases**: "use Notion for my knowledge base", "set up Notion", "migrate to Notion", "move my notes to Notion".

## How Obsidian concepts map to Notion

Every workflow's **Obsidian-mode branch applies in Notion mode**, translated through this table. A workflow never needs its own Notion branch unless this table can't express the step.

| Obsidian | Notion |
|---|---|
| Note in `People/`, `Projects/`, `Meetings/`, `Decisions/`, `Transcripts/` | A page in the **People**, **Projects**, **Meetings**, **Decisions**, **Transcripts** database |
| `Inbox/`, `Daily/`, `Weekly/`, `Strategy/` notes | A page in **Notes** with `Kind` = inbox, daily, weekly, strategy (or reference) |
| Note title | Page title (`Name`). Same naming rules: full name for people, `YYYY-MM-DD <kind> <subject>` for meetings |
| Frontmatter field | Database property (schema below). Lowercase snake_case keys become Title Case properties: `job_title` → `Job title`, `last_1on1` → `Last 1:1` |
| `role:` (relationship) | `Relationship` select. (The Obsidian key is `role`; the property says what it means.) |
| Wikilink in frontmatter (`lead: "[[Jane Doe]]"`) | Relation property (`Lead` → the Jane Doe page) |
| Wikilink in body (`[[Jane Doe]]`) | Page mention `<mention-page url="...">Jane Doe</mention-page>` |
| Backlinks | Two-way relations show on both pages (`Lead` on the project, `Leads` on the person), plus Notion's own backlinks for every mention |
| Tags (`#status/active`, `#person/peer`) | Typed properties carry them (`Status`, `Relationship`); `Tags` multi-select only for cross-cutting labels |
| Dataview query (`dataview` MCP tool) | `notion-query-data-sources` (SQL or rows mode) against the data source |
| Dataview block on a person note (Active Projects) | The page layout's related-database views (`Leads`, `Stakeholder on`, `Meetings`). Never hand-maintain a project list in the body |
| Graph / backlink traversal (`graph` tool) | Fetch the page and read its relation properties, or query the other database filtering on the relation |
| Ranked vault search (`vault` tool) | `notion-search` with `page_url` set to the Lore root page |
| `Archive/` folder | `Archived` checkbox = true (the page stays put; default views hide it) |
| `Context.md` at vault root | The **Context** page under the Lore root |
| `Commitments.md` | The **Commitments** page |
| `Index.md` | The Lore root page plus database views. There is nothing to keep in sync: databases are the index |
| `.processed` / `.plaud-processed` | Still the repo dotfiles. The **Transcripts** page also records `Source ID` and `Processed`, so reprocessing is checkable from Notion alone. It is a properties-only reference: the transcript stays in its source (`_conventions.md` → Source references, not copies) |
| Edit tool, surgical | `notion-update-page` with `update_content` (smallest exact `old_str`) or `insert_content`; never `replace_content` on an entity page |

## Structure

One private top-level page named **Lore** (the user's Private section, never a teamspace unless the user moves it), holding:

| Child | Type | Purpose |
|---|---|---|
| People | database | One page per person |
| Projects | database | One page per project or initiative |
| Meetings | database | One page per meeting |
| Decisions | database | One page per logged decision |
| Transcripts | database | Source references (recorder ID, Notion AI notes link), linked to their meeting; no transcript text |
| Notes | database | Inbox, daily, weekly, strategy, reference |
| Context | page | The knowledge-base copy of `context.md` |
| Commitments | page | The commitments ledger |

### Schemas (create with `notion-create-database`, DDL as written)

**People**
```
CREATE TABLE ("Name" TITLE, "Relationship" SELECT('direct-report':blue, 'peer':green, 'manager':purple, 'stakeholder/internal':orange, 'stakeholder/external':yellow, 'former':gray), "Job title" RICH_TEXT, "Team" SELECT(), "Location" RICH_TEXT, "Start date" DATE, "Status" SELECT('active':green, 'incoming':blue, 'departing':orange, 'departed':gray), "Aka" RICH_TEXT, "Last 1:1" DATE, "Departure date" DATE, "Departure reason" SELECT('resigned', 'terminated', 'retired', 'transferred'), "Email" EMAIL, "Tags" MULTI_SELECT(), "Archived" CHECKBOX, "Created" CREATED_TIME, "Updated" LAST_EDITED_TIME)
```
then `ADD COLUMN "Manager" RELATION('<people ds>', DUAL 'Reports' 'reports')`.

**Projects**: `"Name" TITLE, "Status" SELECT('active':green, 'blocked':red, 'backlog':gray, 'done':blue), "Lead" RELATION('<people ds>', DUAL 'Leads'), "Stakeholders" RELATION('<people ds>', DUAL 'Stakeholder on'), "Start date" DATE, "Phase" RICH_TEXT, "Tracker" URL, "Tags" MULTI_SELECT(), "Archived" CHECKBOX, "Created" CREATED_TIME, "Updated" LAST_EDITED_TIME`; then `ADD COLUMN "Blocked by" RELATION('<projects ds>', DUAL 'Blocks' 'blocks')`.

**Meetings**: `"Name" TITLE, "Kind" SELECT('1on1':blue, 'staff':green, 'roundtable':purple, 'decision':orange, 'external':yellow), "Date" DATE, "Attendees" RELATION('<people ds>', DUAL 'Meetings'), "Related projects" RELATION('<projects ds>', DUAL 'Meetings'), "Tags" MULTI_SELECT(), "Archived" CHECKBOX, "Created" CREATED_TIME, "Updated" LAST_EDITED_TIME`.

**Decisions**: `"Name" TITLE, "Date" DATE, "Status" SELECT('active':green, 'superseded':gray, 'proposed':yellow), "Owner" RELATION('<people ds>', DUAL 'Decisions owned'), "Projects" RELATION('<projects ds>', DUAL 'Decisions'), "Meeting" RELATION('<meetings ds>', DUAL 'Decisions'), "Tags" MULTI_SELECT(), "Archived" CHECKBOX, "Created" CREATED_TIME, "Updated" LAST_EDITED_TIME`; then `ADD COLUMN "Supersedes" RELATION('<decisions ds>', DUAL 'Superseded by' 'superseded_by')`.

**Transcripts**: `"Name" TITLE, "Date" DATE, "Source" SELECT('recorder':blue, 'notion-ai':purple, 'zoom':green, 'teams':orange, 'meet':yellow, 'file':gray, 'other':default), "Source ID" RICH_TEXT, "Meeting" RELATION('<meetings ds>', DUAL 'Transcript'), "Processed" CHECKBOX, "Created" CREATED_TIME`.

**Notes**: `"Name" TITLE, "Kind" SELECT('inbox':red, 'daily':blue, 'weekly':purple, 'strategy':green, 'reference':gray), "Date" DATE, "People" RELATION('<people ds>', DUAL 'Notes'), "Projects" RELATION('<projects ds>', DUAL 'Notes'), "Tags" MULTI_SELECT('inbox/unprocessed':red, 'inbox/needs-review':orange, 'playbook':blue, 'strategy':green), "Archived" CHECKBOX, "Created" CREATED_TIME, "Updated" LAST_EDITED_TIME`.

**Page layouts** (`notion-update-data-source` → `page_layout`): People pins Relationship, Job title, Team, Status and shows related views for `Leads`, `Stakeholder on`, `Meetings`, then backlinks. Projects pins Status, Lead, Phase and shows `Meetings`, `Decisions`, then backlinks. Properties go in the sidebar.

### Page bodies

Same section structure as the Obsidian notes, written in Notion Markdown (`notion://docs/enhanced-markdown-spec`; read it once per session before writing content):

- **Person:** no H1, no overview table (properties carry identity). `## Observations` with `### YYYY-MM-DD - <short context>` entries, newest first; insert new entries directly under the heading. Other sections per `templates/team-member.template.md` / `stakeholder.template.md`, minus the Active Projects block (the layout shows it).
- **Project:** `## Current Phase` with dated lines, newest first, then the rest of `templates/project.template.md`. Closing a project sets `Status` = done and appends a dated closing line, same as Obsidian.
- **Meeting:** summary per `templates/meeting-note.template.md`; people and projects as page mentions *and* in the `Attendees` / `Related projects` relations. The relation is what powers backlinks and queries; the mention is for reading.
- **Decision:** context, options considered, rationale (`templates/decision-log-entry.template.md`).
- **Transcript:** no body text from the transcript. Properties carry the reference; the body holds only the user's own notes and highlights, if any.

## Configuration (written to `context.md`)

```markdown
### Vault Configuration

- **Backend**: notion
- **Notion root page**: <URL of the Lore page>
- **People**: collection://<id>
- **Projects**: collection://<id>
- **Meetings**: collection://<id>
- **Decisions**: collection://<id>
- **Transcripts**: collection://<id>
- **Notes**: collection://<id>
- **Context page**: <URL>
- **Commitments page**: <URL>
```

Workflows read the data source ids from here; never search for a database by name when the id is recorded.

## Operations

| Step | How |
|---|---|
| **Find an entity by name** | SQL on its data source: `SELECT url, "Name" FROM "collection://<id>" WHERE lower("Name") = lower(?)`. Then check `Aka` for people. Zero rows: try `notion-search` with `page_url` = root before concluding it doesn't exist. |
| **Create** | Find first (one page per entity). Then `notion-create-pages` with `parent: {data_source_id}`, properties per the schema (dates as `date:<Prop>:start`, relations as page URL arrays, checkboxes `__YES__`), body per the section structure. |
| **Update a property** | `notion-update-page` `update_properties`. For relation properties, pass the full intended list (the call replaces it): fetch first and merge. |
| **Append an observation / dated line** | Fetch the page, then `update_content` replacing the heading line (`## Observations`) with the heading plus the new entry, so the newest entry sits on top. |
| **Link two entities** | Set the relation property on one side; the other side updates itself. |
| **What is X connected to** | Fetch X and read its relation properties, or query the related database `WHERE "<Relation>" LIKE '%<X page id>%'`. |
| **Query (Dataview equivalent)** | `notion-query-data-sources` SQL. Exclude archived rows: `AND ("Archived" IS NULL OR "Archived" = '__NO__')`. |
| **Archive** | Set `Archived` = `__YES__` after writing the synthesis to the surviving entity, as in Obsidian. Never trash a page. |
| **Context** | `context.md` in the repo stays canonical (it holds this configuration). The Context page is a linked copy: whenever `context.md` changes, update the Context page in the same step, with people and projects as page mentions. |

**Verification:** after any create or edit, fetch the page (or re-run the query) and confirm the change is there, per `_conventions.md` → Verification loops.

**Unreachable:** if the Notion connector is missing or a call fails, say so and stop writing entity data for this session. Do not fall back to the repo folders unless the user says to, because that splits the knowledge base.

## Setup (onboarding Phase 7.5, or "set up Notion")

1. **Confirm the connector** per `workflows/connectors.md` (one `notion-get-self`). Record the workspace name.
2. **Look for an existing Lore root first:** `notion-search` for "Lore" and check the results for a top-level private page with the six databases. If it exists (a previous install, or one built ahead of time), reuse it: fetch it, read each database's `collection://` id, and skip to step 5. Never create a second root.
3. **Create the root** with `notion-create-pages` and `creation_mode: "draft"` (a private top-level page), title "Lore", icon 📜, a one-paragraph callout saying what it is.
4. **Create the databases in order** (People, Projects, Meetings, Decisions, Transcripts, Notes) under the root with the DDL above, then the self-relations, then the page layouts, then the Context and Commitments pages. Each create returns the data source id the next one needs.
5. **Write the configuration** to `context.md` → Notes for Lore → Vault Configuration, and fill the Context page from `context.md`.
6. **Seed people and projects** gathered in onboarding (Phases 3 to 5) as pages, with relations (`Manager`, `Lead`, `Stakeholders`).
7. **Tell the user** in two lines: where it lives (private to them; workspace admins on some plans can still reach private pages), and that they can edit anything there.

## Migrating into Notion ("migrate to Notion")

From Filesystem or Obsidian mode, previewed and reversible:

1. Inventory the source: people, projects, meetings, decisions, transcripts, notes. Report counts.
2. Show a preview of three representative entities as they will look in Notion (properties and first body lines). Wait for a yes.
3. Create in dependency order: People (without relations), Projects, Meetings, Decisions, Transcripts, Notes; then a second pass sets every relation (`Manager`, `Lead`, `Stakeholders`, `Attendees`, ...) by resolving names to page URLs, and rewrites body wikilinks as page mentions.
4. Unresolvable wikilinks stay as plain text in brackets and are listed in the report.
5. Verify counts per database against the source, spot-check three pages, then switch `context.md` → Vault Configuration to `Backend: notion`. Leave the source files in place; the user removes them when satisfied.
