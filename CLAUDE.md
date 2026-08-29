# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A single skill — **smart-review** — packaged for multiple coding harnesses from one shared core.

The core is harness-neutral markdown under `skills/smart-review/`. Each harness gets a thin
manifest (`.claude-plugin/`, `.cursor-plugin/`, `.codex-plugin/`, `gemini-extension.json`)
that points at that same `skills/` directory — no skill content is copied or forked. Claude
Code additionally gets slash commands and native parallel-subagent `max`; other harnesses run
the same workflow with `max` degraded to a sequential ensemble.

There is no application build. The product is markdown plus a small TypeScript eval harness
that scores the reviewer empirically.

## Commands

Validate before pushing (no CI configured — do this manually):

```bash
claude plugin validate .            # Claude Code plugin + marketplace manifest
./scripts/validate-adapters.sh      # every manifest: valid JSON, matching version, resolvable paths, agent↔lens sync
```

Bump the version everywhere at once:

```bash
./scripts/bump-version.sh 0.5.0     # writes all manifests, then re-validates
```

Eval harness (`evals/smart-review/`, Node 18+, dev-only — excluded from the packaged plugin):

```bash
cd evals/smart-review && npm install
npm run list                        # print corpus manifest, no scoring
npm run score                       # recall/precision, overall + per-case + per-lens
npm run score -- --drop security    # ablation: recall with one lens removed
npm run score -- --window 8         # widen line-match tolerance (default 5)
```

There is no automated "run the reviewer" step — producing `corpus/<case>/actual.json` (the
input to `npm run score`) means actually invoking the `smart-review` skill on that case's
`after.ts`/`meta.json` inside a harness and saving its findings JSON. `score.ts` reads
`corpus/<case>/{meta,expected,actual}.json` and matches findings on `(category, file, line±window)`.

## Repo layout

```
skills/smart-review/                 # THE shared core — harness-neutral, one copy
  SKILL.md                           # routing + workflow + output format
  references/
    lenses/{spec-conformance,correctness,security,performance,design,tests}.md
    domain/{api,database,frontend-a11y,typescript-node}.md
    checklist-routing.md             # trigger -> domain checklist -> target lens
    finding-schema.md                # the one shape every lens emits
    merge-contract.md                # dedup / agreement-weighting / severity rollup / nit cap
    severity.md                      # P0-P3 definitions
    ensemble.md                      # the max fan-out protocol + harness capability check

hooks/
  session-start                      # bootstrap nudge for harnesses without description-triggering
  hooks.json                         # Claude Code SessionStart schema
  hooks-cursor.json                  # Cursor sessionStart schema

.claude-plugin/
  plugin.json                        # Claude Code manifest (skills/agents/commands/hooks auto-discovered at repo root)
  marketplace.json                   # marketplace "chase", one entry, source "."
.cursor-plugin/plugin.json           # Cursor manifest -> ./skills/, ./hooks/hooks-cursor.json
.codex-plugin/plugin.json            # Codex manifest -> ./skills/
gemini-extension.json + GEMINI.md    # Gemini CLI extension
AGENTS.md                            # AGENTS.md-convention pointer into the skill

agents/*-reviewer.md                 # Claude Code ONLY — the subagents max dispatches in the isolated variant
agents/merge-synthesizer.md          # Claude Code ONLY — the merge stage
commands/*.md                        # Claude Code ONLY — /smart-review:{min,max,review,pr,pr-comments}

scripts/
  validate-adapters.sh  bump-version.sh
evals/smart-review/                  # dev-only eval kit; excluded from what installers pull
SMART-REVIEW.md                      # the skill's design writeup (was the plugin README)
```

## Architecture: smart-review

The design principle: **the merge is the product, not the lenses.** Six reviewers each
checking one thing beats one reviewer checking six things (attention dilution), and one
model reviewing alone repeats its own blind spots. Everything here exists to get ensemble
recall without ensemble noise.

Modes, routed by `SKILL.md`:
- **`min`** — one context, all six lenses walked in sequence, no fan-out. Fast path for
  small/low-risk diffs. The 90% case.
- **`max`** — spec-gate first (stop early if the diff implements the wrong thing), then the
  ensemble per `references/ensemble.md`: **isolated parallel subagents** where the harness
  supports them (Claude Code dispatches `agents/*-reviewer.md`), otherwise a disciplined
  **sequential lens walk**. Then the merge into one verdict.
- **auto** (plain `/smart-review` or the skill auto-triggering) — routes to min or max by
  diff size (>~150 lines or >~5 files), sensitive paths (auth, crypto, SQL, shell/file
  exec, payments, PII), or an explicit pre-merge/thorough ask.
- **`/smart-review:pr <PR>`** (Claude Code) — fetches a PR diff via `gh`, runs min/max, then
  gates on explicit user confirmation of what to publish before posting comments. Never
  approves/requests-changes/merges.
- **`/smart-review:pr-comments <PR>`** (Claude Code) — triages a PR's *existing* unresolved
  review comments via GraphQL, classifies each fix/docs/explain/disagree, gates on approval
  before editing and before pushing, then replies and resolves each thread. Not a review pass.

Key structural pieces, all under `skills/smart-review/references/`:
- **Lenses are fixed** — spec-conformance, correctness, security, performance, design, tests.
  Don't add a seventh lens for a new domain.
- **Domain depth rides in as checklists** (`domain/*.md`), injected into whichever lens
  applies per `checklist-routing.md`. Extending coverage means a new checklist + a routing
  row, not a new reviewer — this keeps `max`'s cost (5 parallel reviewers) fixed as coverage grows.
- **`finding-schema.md`** — the one shape every lens must emit
  (`{file, line_start, line_end, lens, category, severity, title, why, proposed_move, confidence}`).
  The merge operates mechanically on these fields.
- **`merge-contract.md`** — dedup by `(category, file, line-overlap-within-3)`,
  agreement-weighting (≥2 lenses agree → confidence + rank bump), conflict resolution
  (surface both sides), severity rollup to a verdict, hard nit cap (~5 P3s shown).
- **`ensemble.md`** — the max fan-out protocol and the harness capability check that picks
  isolated-parallel vs sequential.
- **`agents/*-reviewer.md`** (Claude Code) are the isolated-variant subagents, registered
  read-only. Each receives *only* the diff, spec, and its lens (+ routed domain) checklist —
  never the author's session or other reviewers' output; that isolation decorrelates their
  errors. `merge-synthesizer` is the only stage that sees everything. Cross-model routing
  (per-agent frontmatter `model:`) is the highest-leverage lever for catching more distinct
  issues. **Each reviewer agent is a Claude Code packaging of a `references/lenses/*.md`
  checklist — keep the two in sync;** `validate-adapters.sh` checks the reference link exists.

Because subagents cannot spawn subagents, the **top-level agent is always the orchestrator**
in `max` — there is no "lead reviewer" subagent doing the fan-out.

## Working on this repo

- A change to a lens checklist, the finding schema, the merge contract, or the ensemble
  protocol affects **every mode and every harness** (`min` and the sequential `max` inline
  the same references; the Claude Code reviewer agents mirror the lens files). After editing
  a shared reference, check `SKILL.md`'s workflow and the matching `agents/*-reviewer.md`
  both still make sense.
- Adding harness support = a new manifest pointing at `./skills/` + (if the harness lacks
  description-triggering) a hooks wrapper. Never fork skill content.
- Bump the version with `scripts/bump-version.sh` so all manifests stay in lockstep.
- Eval corpus cases (`evals/smart-review/corpus/<n>-<lens>-<defect>/`): the `category` in
  `expected.json` must match the vocabulary fixed by `finding-schema.md` — scoring matches
  on it exactly.
