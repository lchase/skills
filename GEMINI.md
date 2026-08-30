# smart-review

This project ships the **smart-review** skill. Before any code-review-shaped task —
reviewing a diff, PR, branch, or uncommitted changes; a pre-merge or pre-commit check;
hunting for bugs, security, performance, or design problems in changed code — read
`skills/smart-review/SKILL.md` and follow it.

`max` mode has no native parallel subagents on Gemini CLI; it runs the sequential
ensemble described in `skills/smart-review/references/ensemble.md`.
