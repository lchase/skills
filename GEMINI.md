# smart-review

This repo's **smart-review** skill lives at
`plugins/smart-review/skills/smart-review/SKILL.md`. Before any code-review-shaped task —
reviewing a diff, PR, branch, or uncommitted changes; a pre-merge or pre-commit check;
hunting for bugs, security, performance, or design problems in changed code — read that
file and follow it.

`max` mode has no native parallel subagents on Gemini CLI; it runs the sequential
ensemble described in
`plugins/smart-review/skills/smart-review/references/ensemble.md`.
