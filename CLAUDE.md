# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A Claude Code **plugin marketplace** (`.claude-plugin/marketplace.json`, marketplace name `chase`). It ships one plugin today, `smart-review`, under `plugins/smart-review/`. There is no application build — the product is markdown (skills, agent prompts, slash commands) plus a small TypeScript eval harness that scores the reviewer empirically.

## Commands

Validate a plugin/marketplace before pushing (no CI configured — do this manually):

```bash
claude plugin validate .
claude plugin validate ./plugins/smart-review
```

Eval harness (`evals/smart-review/`, Node 18+, dev-only — excluded from the packaged plugin):

```bash
cd evals/smart-review && npm install
npm run list                        # print corpus manifest, no scoring
npm run score                       # recall/precision, overall + per-case + per-lens
npm run score -- --drop security    # ablation: recall with one lens removed
npm run score -- --window 8         # widen line-match tolerance (default 5)
```

There is no automated "run the reviewer" step — producing `corpus/<case>/actual.json` (the input to `npm run score`) means actually invoking the `smart-review` skill on that case's `after.ts`/`meta.json` inside Claude Code and saving its findings JSON. `score.ts` reads `corpus/<case>/{meta,expected,actual}.json` and matches findings on `(category, file, line±window)`.

## Repo layout

```
.claude-plugin/marketplace.json     # marketplace catalog — one entry per plugin, must stay in sync with plugin.json
plugins/<name>/
  .claude-plugin/plugin.json        # plugin manifest (name, version, description must match marketplace.json entry)
  skills/<name>/SKILL.md            # the skill's brain: routing + workflow + output format
  skills/<name>/references/         # checklists/contracts the SKILL.md workflow reads at runtime (not inlined, to keep SKILL.md small)
  agents/                           # subagents the skill dispatches in its orchestrated mode
  commands/                         # slash commands, namespaced as /<plugin>:<command>
evals/<name>/                       # dev-only eval kit for that plugin; excluded from what installers pull
```

Adding a new plugin means adding a directory under `plugins/` plus a matching entry in `.claude-plugin/marketplace.json` — the two must stay consistent (name, description). There's no version pinning by default: no `version` field means Claude Code resolves installs to the commit SHA, so every push is effectively a new release; set/bump `version` in a plugin's `plugin.json` to pin instead.

## Architecture: the `smart-review` plugin

The design principle behind this plugin: **the merge is the product, not the lenses.** Six reviewers each checking one thing beats one reviewer checking six things (attention dilution), and one model reviewing alone repeats its own blind spots. Everything here exists to get ensemble recall without ensemble noise.

Three ways to invoke it, routed by `SKILL.md`:
- `/smart-review:min` — one agent, one context, all six lenses walked in sequence, no subagents. Fast path for small/low-risk diffs.
- `/smart-review:max` — orchestrated ensemble: spec-gate first (stop early if the diff implements the wrong thing), then the five remaining lenses fan out as **isolated parallel subagents** (`agents/*-reviewer.md`), then a `merge-synthesizer` subagent combines everything into one verdict.
- `/smart-review:review` (or the skill auto-triggering on "review this diff/PR/branch") — routes to min or max based on diff size (>~150 lines or >~5 files), whether it touches a sensitive path (auth, crypto, SQL, shell/file exec, payments, PII), or an explicit ask for a pre-merge/thorough review.

Key structural pieces, all under `plugins/smart-review/skills/smart-review/`:
- **Lenses are fixed** (`references/lenses/{spec-conformance,correctness,security,performance,design,tests}.md`) — spec-conformance, correctness, security, performance, design, tests. Don't add a seventh lens for a new domain.
- **Domain depth rides in as checklists** (`references/domain/{api,database,frontend-a11y,typescript-node}.md`), injected into whichever lens applies per `references/checklist-routing.md`'s trigger table. Extending coverage for a new domain means adding a checklist + a routing row, not a new reviewer — this is what keeps `max`'s cost (5 subagents) fixed as coverage grows.
- **`references/finding-schema.md`** defines the one shape every lens must emit (`{file, line_start, line_end, lens, category, severity, title, why, proposed_move, confidence}`) — the merge step operates mechanically on these fields, so a lens can't free-text its way out of the schema.
- **`references/merge-contract.md`** is the aggregation logic: dedup by `(category, file, line-overlap-within-3)`, agreement-weighting (≥2 lenses agreeing bumps confidence and rank), conflict resolution (surface both sides, higher severity/security-correctness wins framing), severity rollup to a verdict (any P0 → REQUEST_CHANGES, any P1 → REQUEST_CHANGES, else APPROVE[_WITH_NITS]), and a hard nit cap (~5 P3s shown, rest collapsed to a count) so P0s don't drown in noise.
- **`agents/*-reviewer.md` and `agents/merge-synthesizer.md`** are the subagents `max` dispatches — registered read-only (`tools: Read, Grep, Glob`). Each reviewer subagent receives *only* the diff, the spec, and its lens (+ routed domain) checklist — never the author's session or other reviewers' output; that isolation is what decorrelates their errors. `merge-synthesizer` is the only stage that sees everything. Cross-model routing (different lenses on different model providers via each agent's frontmatter `model:` field) is optional but is called out in the plugin README as the highest-leverage lever for catching more distinct issues, since same-model reviewers repeat the same blind spots.

Because Claude Code subagents cannot spawn subagents, the **top-level agent is always the orchestrator** in `max` mode — there is no "lead reviewer" subagent doing the fan-out.

## Working on this repo

Changes to a lens checklist, the finding schema, or the merge contract affect every mode (`min` inlines the same references) — check `SKILL.md`'s min workflow and the `max` agent prompts both still make sense after editing a shared reference file. When adding eval corpus cases (`evals/smart-review/corpus/<n>-<lens>-<defect>/`), the `category` in `expected.json` must match the vocabulary fixed by `finding-schema.md`, since scoring matches on it exactly.
