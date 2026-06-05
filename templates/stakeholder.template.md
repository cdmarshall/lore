---
type: person
job_title: [Job Title]
role: stakeholder/internal   # use stakeholder/external for vendors, partners, customers, etc.
team: [Their Team / Org]
manager: "[[Their Manager]]"   # optional; remove if unknown
location: [City / Region]
start_date: YYYY-MM-DD   # optional; remove if unknown
status: active
tags: [person/stakeholder/internal]   # or person/stakeholder/external
---

## Background

> What you know about them: career history, how you came to work together, key context.

-

## What They Care About

> Their priorities, pressures, and goals as you understand them.

-

## Communication Preferences

> How they prefer to be communicated with, response time expectations, channels they prefer.

-

## Working Relationship

> How you collaborate, frequency of contact, dynamics that have worked or not worked.

-

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
