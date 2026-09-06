# smart-review

A multi-lens code review skill. Six specialized review lenses run over a diff and their findings are merged into a single deduplicated, severity-ranked verdict. Built on the observation that no single reviewer catches everything: the differentiator here is the **merge**, not any individual lens.

It ships from one harness-neutral core (`skills/smart-review/`, under this plugin directory)
with a thin manifest per harness. Claude Code gets slash commands and native
parallel-subagent `max`; Cursor, Codex, Gemini CLI, and any AGENTS.md agent run the same
workflow with `max` as a sequential ensemble.

## Install

**Claude Code:**

```
/plugin marketplace add lchase/skills
/plugin install smart-review@lchase
```

**Other harnesses:** point the harness's plugin/extension mechanism at this repo — it reads
the matching manifest (`plugins/smart-review/.cursor-plugin/`,
`plugins/smart-review/.codex-plugin/`, root `gemini-extension.json`) or root `AGENTS.md`,
all of which resolve to the same `skills/smart-review/` core.

## Modes

On Claude Code, commands are namespaced by the plugin (`/smart-review:<mode>`); elsewhere
the skill loads via hook/AGENTS.md and you just ask for a review.

- **`/smart-review:review`** — auto: picks min or max by change size and sensitivity.
- **`/smart-review:min`** — one pass, one context, no subagents. Fast; for tight loops and small diffs.
- **`/smart-review:max`** — spec-gate, then the lens ensemble, merged into one verdict. For pre-merge and high-stakes changes. Isolated parallel subagents on Claude Code; a disciplined sequential lens walk on harnesses without subagents (`references/ensemble.md`).
- **`/smart-review:add-pr-review <PR number or URL>`** — fetches a GitHub PR's diff via `gh`, runs the same min/max review, then shows you the report and asks what to publish (all findings, P0/P1 only, a custom subset, or nothing) before posting a summary comment (and inline comments for confirmed P0/P1s). Never approves, requests changes, or merges.
- **`/smart-review:review-pr-comments <PR number or URL>`** — triages a PR's *existing* unresolved review comments (Copilot, human reviewers, etc.): fetches unresolved threads via GraphQL, classifies each as fix/docs/explain/disagree, gates on your approval before editing code, gates again before pushing, then replies to and resolves each addressed thread. Not a review pass — glue around comment threads, not the lenses.

The skill also triggers automatically when you ask Claude to review code, check a diff, or judge whether something is ready to merge — you don't have to run a command. The commands just force a specific mode.

## How it works

```
/smart-review:review ─► router (size + sensitivity) ─► min | max

min :  scope diff ─► all 6 lenses in ONE context ─► merge ─► verdict
max :  scope diff ─► SPEC-GATE ─► lens ensemble ─► merge ─► verdict
        ensemble = isolated parallel subagents (Claude Code, + optional cross-model)
                   OR sequential lens walk (harnesses without subagents)
```

Component layout:

- **The shared core** (`skills/smart-review/`) — harness-neutral. Every manifest points here.
  - **`SKILL.md`** — routing, the min/max workflows, the report format.
  - **`references/lenses/`** — the six review perspectives: spec-conformance, correctness, security, performance, design, tests. Fixed set.
  - **`references/domain/`** — database, TypeScript/Node, API, frontend/a11y. Injected into the relevant lens when the diff touches that domain (see `references/checklist-routing.md`). Add depth by adding a checklist + a routing row, not a new reviewer.
  - **`references/finding-schema.md`** — the one shape every lens emits, so findings can be merged mechanically.
  - **`references/merge-contract.md`** — dedup, agreement-weighting, conflict resolution, severity rollup, structure-over-nits, nit cap. This is the product.
  - **`references/ensemble.md`** — the max fan-out protocol and the harness capability check.
- **Reviewer subagents** (`agents/`, Claude Code only) — the isolated reviewers `max` fans out (`*-reviewer`), plus `merge-synthesizer`. Read-only (`tools: Read, Grep, Glob`); each runs in its own context, which keeps findings decorrelated. Each mirrors a `references/lenses/*.md` checklist — kept in sync, checked by `scripts/validate-adapters.sh`.
- **Commands** (`commands/`, Claude Code only) — the entry points above.
- **Hooks** (`hooks/`) — a session-start bootstrap that nudges harnesses without description-based skill triggering to load the skill on review requests.

## Key design choices

- **Context isolation** — in max, each reviewer sees only the diff, the spec, and its checklist; never the author's reasoning or the other reviewers. Running them as separate subagents gives that isolation by construction, and it's what makes the ensemble beat any single pass.
- **Spec-gate first** — don't spend quality-review budget on code that implements the wrong thing.
- **Bounded reviewers, unbounded coverage** — six lenses; domain depth rides in as checklists, so the reviewer count (and cost, latency, noise) stays fixed as coverage grows.

## Cross-model routing (optional, highest-leverage)

Same model reviewing alone repeats its own blind spots; different models miss different things, so routing lenses across models is the single biggest lever on "every reviewer finds something different". Because each lens is its own subagent, you can set a per-reviewer model in the agent's frontmatter — e.g. add a `model:` line to `agents/security-reviewer.md` and a different one to `agents/design-reviewer.md`. Confirm the accepted `model` values (and that per-subagent model selection is supported) for your Claude Code version before relying on it; if it isn't available, the default — one model, isolated contexts — still works and still decorrelates via isolation.

## Evals

The eval kit lives under `plugins/smart-review/evals/` (dev-only; it isn't part of the installed plugin). It measures the reviewer empirically — recall and precision per lens, and each lens's marginal contribution via ablation — so you can answer "is max worth its cost?" and "which lenses actually earn their place?" with numbers rather than vibes. See `evals/README.md`.
