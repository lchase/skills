---
description: Orchestrated ensemble review — spec-gate, then lenses fan out as isolated parallel subagents, merged into one verdict. For pre-merge and high-stakes changes.
argument-hint: "[base ref] [spec path]"
---

Use the **smart-review** skill in **max** mode on `$ARGUMENTS`.

Run the skill's max workflow: spec-gate via the `spec-conformance-reviewer` subagent, then fan out the five lens reviewer subagents in parallel (each given only the diff, spec, and its checklist), then merge via the `merge-synthesizer` subagent. See the plugin README for optional per-lens cross-model routing.
