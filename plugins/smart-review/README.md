# smart-review

A multi-lens code review plugin for Claude Code. Six specialized review lenses run over a diff and their findings are merged into a single deduplicated, severity-ranked verdict. Built on the observation that no single reviewer catches everything: the differentiator here is the **merge**, not any individual lens.

## Install

```
/plugin marketplace add lchase/skills
/plugin install smart-review@chase
```

## Modes

Commands are namespaced by the plugin:

- **`/smart-review:review`** — auto: picks min or max by change size and sensitivity.
- **`/smart-review:min`** — one pass, one context, no subagents. Fast; for tight loops and small diffs.
- **`/smart-review:max`** — spec-gate, then lenses fan out as isolated parallel subagents, merged into one verdict. For pre-merge and high-stakes changes.
- **`/smart-review:pr <PR number or URL>`** — fetches a GitHub PR's diff via `gh`, runs the same min/max review, then shows you the report and asks what to publish (all findings, P0/P1 only, a custom subset, or nothing) before posting a summary comment (and inline comments for confirmed P0/P1s). Never approves, requests changes, or merges.

The skill also triggers automatically when you ask Claude to review code, check a diff, or judge whether something is ready to merge — you don't have to run a command. The commands just force a specific mode.

## How it works

```
/smart-review:review ─► router (size + sensitivity) ─► min | max

min :  scope diff ─► all 6 lenses in ONE context ─► merge ─► verdict
max :  scope diff ─► SPEC-GATE ─► fan out 5 reviewer subagents,
        isolated + parallel (+ optional cross-model) ─► merge ─► verdict
```

Component layout inside this plugin:

- **The skill** (`skills/smart-review/SKILL.md`) — the brain: routing, the min/max workflows, and the report format. Auto-triggers and orchestrates.
- **Lenses** (`skills/smart-review/references/lenses/`) — the six review perspectives: spec-conformance, correctness, security, performance, design, tests. Fixed set.
- **Domain checklists** (`skills/smart-review/references/domain/`) — database, TypeScript/Node, API, frontend/a11y. Injected into the relevant lens when the diff touches that domain (see `references/checklist-routing.md`). Add depth by adding a checklist + a routing row, not a new reviewer.
- **Finding schema** (`skills/smart-review/references/finding-schema.md`) — the one shape every lens emits, so findings can be merged mechanically.
- **Merge contract** (`skills/smart-review/references/merge-contract.md`) — dedup, agreement-weighting, conflict resolution, severity rollup, structure-over-nits, nit cap. This is the product.
- **Reviewer subagents** (`agents/`) — the isolated reviewers `max` fans out (`*-reviewer`), plus `merge-synthesizer`. Registered as read-only subagents (`tools: Read, Grep, Glob`); each runs in its own context, which is what keeps their findings decorrelated.
- **Commands** (`commands/`) — the four entry points above.

## Key design choices

- **Context isolation** — in max, each reviewer sees only the diff, the spec, and its checklist; never the author's reasoning or the other reviewers. Running them as separate subagents gives that isolation by construction, and it's what makes the ensemble beat any single pass.
- **Spec-gate first** — don't spend quality-review budget on code that implements the wrong thing.
- **Bounded reviewers, unbounded coverage** — six lenses; domain depth rides in as checklists, so the reviewer count (and cost, latency, noise) stays fixed as coverage grows.

## Cross-model routing (optional, highest-leverage)

Same model reviewing alone repeats its own blind spots; different models miss different things, so routing lenses across models is the single biggest lever on "every reviewer finds something different". Because each lens is its own subagent, you can set a per-reviewer model in the agent's frontmatter — e.g. add a `model:` line to `agents/security-reviewer.md` and a different one to `agents/design-reviewer.md`. Confirm the accepted `model` values (and that per-subagent model selection is supported) for your Claude Code version before relying on it; if it isn't available, the default — one model, isolated contexts — still works and still decorrelates via isolation.

## Evals

The eval kit lives at the repo root under `evals/smart-review/` (dev-only; it isn't part of the installed plugin). It measures the reviewer empirically — recall and precision per lens, and each lens's marginal contribution via ablation — so you can answer "is max worth its cost?" and "which lenses actually earn their place?" with numbers rather than vibes. See `evals/smart-review/README.md`.
