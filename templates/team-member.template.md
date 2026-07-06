---
type: person
job_title: [Job Title]
role: direct-report
team: [Team Name]
manager: "[[Your Name]]"
location: [City / Region]
start_date: YYYY-MM-DD
status: active
last_1on1: YYYY-MM-DD
tags: [person/direct-report]
---

> Obsidian-mode note: the frontmatter above and the Active Projects Dataview block below only function inside a vault. In filesystem mode they are inert; keep the frontmatter for later migration, but feel free to delete the Dataview block.

## Current Focus Areas

> What they're actively working on right now. Update after 1:1s and transcript processing.

-

## Strengths

> Captured over time through 1:1s and observation.

-

## Growth Areas

> What they're working on. Be specific and concrete.

-

## Career Goals

> Short-term and longer-term aspirations. Update as they share.

-

## Working Style

> How they engage, what motivates them, how they prefer to communicate.

-

## Current Goals/OKRs

| Goal | Progress | Due |
|------|----------|-----|
| | | |

## Active Projects

> Live view of the projects this person leads or is a stakeholder on, pulled from the `Projects/` notes via Dataview. Update the project note, not this table. Requires the Dataview community plugin.

```dataview
TABLE WITHOUT ID
  file.link AS Project,
  choice(lead = this.file.link, "Lead", "Stakeholder") AS Role,
  status AS Status,
  phase AS "Phase / latest"
FROM "Projects"
WHERE (lead = this.file.link OR contains(stakeholders, this.file.link)) AND status != "done"
SORT status ASC, file.name ASC
```

## Observations

<!-- Add dated entries as "### YYYY-MM-DD - context", newest first -->

---

## 1:1 Notes

### [Date]

**What we discussed:**
-

**Action items:**
- [ ]

**Follow-up needed:**
-

---

### Template for New Entry

```markdown
### [Date]

**What we discussed:**
-

**Action items:**
- [ ]

**Follow-up needed:**
-
```
