---
description: Review a diff with the code-review skill; auto-selects min or max by change size and sensitivity.
argument-hint: [base ref or PR/branch] [spec path]
---

Use the **code-review** skill in **auto** mode on the changes described by `$ARGUMENTS` (a base ref and/or a spec path; both optional — with no base, review uncommitted changes).

Follow the skill's Routing section to pick min vs max, state the chosen lane and why in one line, then run that lane. Output uses the skill's report format.
