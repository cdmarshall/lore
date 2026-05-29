# Email Config

User-specific data for the email triage workflow. This file is gitignored.

The unified triage workflow (`workflows/triage.md`) reads this file alongside `context.md` to categorize incoming email during its email pass. The workflow is generic; everything here is yours.

If this is a fresh install, the agent can populate most of these sections automatically by scanning your inbox. You'll want to review and refine after that initial pass.

---

## Mail Folder Path

Where the agent reads email from. For Mac Mail with an Exchange account, this is typically `~/Library/Mail/V10/<account-uuid>/Inbox.mbox/`. If you have multiple email accounts, pick the one this workflow should monitor.

Leave this empty on first setup; the workflow's auto-detect will fill it in. If the path ever goes stale (account rebuild, new Mac, macOS Mail version bump), the workflow falls back to auto-detect and surfaces the new path in the briefing for you to confirm and update here.

```
<path-to-your-inbox.mbox>
```

---

## Mail Mount Root

Where auto-detect starts scanning when `## Mail Folder Path` is empty or stale. For Mac Mail, this is `~/Library/Mail/`. Must be a folder you've mounted in Cowork.

```
~/Library/Mail/
```

---

## Preferred Account Domain

If you have multiple email accounts mounted (e.g., personal + work), auto-detect uses this to disambiguate by inspecting the To: address of recent inbound emails. The account whose mail is addressed to a user@<this-domain> address wins. Leave blank if you only have one account.

```
example.com
```

---

## Company Domains

Email domains that are "internal" for the categorization fallback rule. List all variants your company uses.

- example.com
- subsidiary.com

---

## Tier 1 Direct Senders

Email addresses whose messages should be classified as direct asks from your team or boss. The workflow already includes anyone in `context.md` `## My Team` and the `Reports to` field by inference. Use this section to:
- Add anyone whose email address doesn't match the obvious `firstname.lastname` pattern.
- Add cross-team collaborators you want treated as Tier 1.
- Override anyone in `context.md ## My Team` you'd like demoted (rare).

```
firstname.lastname@example.com    # Role, why Tier 1
```

---

## Tier 1 Cross-Functional Senders

Email addresses for the key stakeholders / cross-functional peers whose direct asks should be Tier 1. The workflow includes anyone in `context.md` `## Key Stakeholders` by inference. Use this section for additions / overrides.

```
firstname.lastname@example.com    # Role, relationship
```

---

## Tier 1 Project Partners

External or internal email addresses tied to active initiatives. Format: `email # initiative name (from context.md ## Active Initiatives)`. The workflow uses this to recognize active project threads.

```
partner@vendor.com    # Initiative name
```

---

## Distribution Lists

Internal mailing lists you receive but are not personally addressed on. Email triage treats these as Tier 2 (FYI / scan) by default. If a list contains action-required content, promote individual senders to Tier 1 instead of the list itself.

```
list-name@example.com
```

---

## Automated Sources

System senders to filter to dedicated folders. Each entry has a type:
- `ops`: case/ticket routing for systems you administer
- `alert`: monitoring and incident notifications
- `noise`: calendar replies, vendor marketing, newsletters

Format: `email-or-pattern    type    suggested-folder`

```
noreply@service-now.com    ops      "Ops"
alerts@monitoring.io       alert    "Alerts"
announcements@vendor.com   noise    "Noise"
```

---

## Outlook Folders

Names of the folders you've set up (or plan to set up) in Outlook for the workflow's filtering recommendations. The briefing will use these names when suggesting rules.

```
- Alerts
- Ops
- Noise
- Read Later
```

---

## Notes for Lore

Anything else the agent should know about your email patterns: people you'd like flagged extra-urgently, threads you're currently waiting on (and from whom), correspondents you'd like the agent to suggest delegation for, etc.

- (none yet)
