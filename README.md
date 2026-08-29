# smart-review

*An ensemble code review: several specialized lenses, one merged verdict — not another pile of comments.*

Most code review, human or AI, is one reviewer making a single pass and leaving a list of
comments. This runs six specialized lenses instead — spec-conformance, correctness,
security, performance, design, and tests — then merges the results into one verdict:
duplicates collapsed, findings that several lenses independently raise weighted up,
conflicting advice reconciled, severity rolled up, structural problems first, nits capped.
The merge is the point — an ensemble without it is just louder, and a longer checklist
handed to one reviewer only dilutes its attention and repeats its own misses.

Two modes: a fast single pass (`min`) for tight loops, and an orchestrated ensemble (`max`)
for pre-merge review. Auto-routing picks between them by change size and sensitivity.
Design and internals: [`SMART-REVIEW.md`](SMART-REVIEW.md).

## One core, many harnesses

The skill lives in [`skills/smart-review/`](skills/smart-review/) as harness-neutral
markdown. Each harness gets a thin manifest pointing at that same directory — no skill
content is copied or forked.

| Harness | Install | `min` | `max` | Slash commands / auto-trigger |
|---|---|---|---|---|
| Claude Code | `/plugin marketplace add lchase/skills` then `/plugin install smart-review@chase` | ✅ | ✅ isolated parallel subagents | ✅ |
| Cursor | point Cursor plugins at this repo (`.cursor-plugin/`) | ✅ | ✅ sequential ensemble | via session-start hook |
| Codex | `.codex-plugin/` manifest | ✅ | ✅ sequential ensemble | — |
| Gemini CLI | `gemini extensions install https://github.com/lchase/skills` | ✅ | ✅ sequential ensemble | via `GEMINI.md` |
| Any AGENTS.md agent | reads [`AGENTS.md`](AGENTS.md) | ✅ | ✅ sequential ensemble | — |

`max`'s isolated parallel subagents (and optional cross-model routing) are a Claude Code
capability. Elsewhere `max` runs the same spec-gate + six lenses + merge as a disciplined
sequential walk — see [`references/ensemble.md`](skills/smart-review/references/ensemble.md).

## Claude Code slash commands

- `/smart-review:review` — auto (routes to min or max by size + sensitivity)
- `/smart-review:min` — fast single-pass review
- `/smart-review:max` — orchestrated ensemble review
- `/smart-review:pr <PR number or URL>` — reviews a GitHub PR and, after you confirm what to publish, posts the findings as PR comments
- `/smart-review:pr-comments <PR number or URL>` — triages a PR's existing unresolved review comments, fixes or explains each after your approval, replies, and resolves the thread

The skill also triggers automatically when you ask Claude to review a diff, PR, or branch.

## Repo layout

```
skills/smart-review/       # the shared core (SKILL.md + references/)
hooks/                     # session-start bootstrap + per-harness wrappers
.claude-plugin/            # Claude Code manifest + marketplace + (auto-discovered) commands/agents/hooks
.cursor-plugin/ .codex-plugin/ gemini-extension.json   # thin per-harness manifests
agents/ commands/          # Claude Code only
scripts/                   # validate-adapters.sh, bump-version.sh
evals/smart-review/        # dev-only eval kit (not shipped to installers)
```

## Developing

```
claude plugin validate .
./scripts/validate-adapters.sh
```

Pull changes with `/plugin marketplace update`. Version is pinned in the manifests; bump
all of them at once with `./scripts/bump-version.sh <version>`.
