# AGENTS.md

This repo is the **`lchase`** marketplace of Claude Code plugins. The one relevant to
non-Claude agents is **smart-review** (`plugins/smart-review/skills/smart-review/SKILL.md`).

Before any code-review-shaped task — reviewing a diff, PR, branch, or uncommitted
changes; a pre-merge or pre-commit check; hunting for bugs, security, performance, or
design problems in changed code — read `plugins/smart-review/skills/smart-review/SKILL.md`
and follow it.

The shared core is under `plugins/smart-review/skills/smart-review/references/`: the six
lens checklists, the domain checklists, the finding schema, the merge contract, and the
ensemble protocol. These behave identically on every harness. `max` mode uses native
parallel subagents only on Claude Code; elsewhere it runs the sequential ensemble in
`references/ensemble.md`.

(The other plugin, `plugins/tldraw/`, is a Claude-Code-only diagram generator and does not
apply here.)
