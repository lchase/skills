# AGENTS.md

This project ships the **smart-review** skill (`skills/smart-review/SKILL.md`).

Before any code-review-shaped task — reviewing a diff, PR, branch, or uncommitted
changes; a pre-merge or pre-commit check; hunting for bugs, security, performance, or
design problems in changed code — read `skills/smart-review/SKILL.md` and follow it.

The shared core is under `skills/smart-review/references/`: the six lens checklists, the
domain checklists, the finding schema, the merge contract, and the ensemble protocol.
These behave identically on every harness. `max` mode uses native parallel subagents
only on Claude Code; elsewhere it runs the sequential ensemble in
`references/ensemble.md`.
