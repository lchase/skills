---
name: code-review
description: Rigorous multi-lens code review of a diff. Use this whenever the user asks to review code, review a PR or branch, check a diff, do a pre-merge or pre-commit review, hunt for bugs, security issues, performance problems, or design smells in changed code, or asks whether something is ready to merge — even if they never say the words "code review". Runs six specialized review lenses (spec-conformance, correctness, security, performance, design, tests) and merges their findings into one deduplicated, severity-ranked verdict. Offers a fast single-pass mode (min) for tight loops and an orchestrated ensemble mode (max) that fans the lenses out as isolated parallel subagents for high-stakes or pre-merge review. Prefer this over an ad-hoc review any time correctness or shipping safety matters.
---

# Code Review

## Why this skill exists

No single reviewer catches everything. A reviewer asked to check six things in one pass does each one worse than six reviewers each checking one thing — attention gets diluted and the last items on the list get skimmed. And one model reviewing alone repeats its own blind spots on every run. So the goal here is not a bigger checklist. It is an **ensemble of decorrelated reviewers plus a strong merge step**.

The value lives in the merge. Running many reviewers without aggregation just produces a pile of overlapping, conflicting, nit-heavy findings and no verdict — and *more* reviewers raises the noise floor, so a naive ensemble is worse, not better. Everything below exists to keep the ensemble's recall while holding the line on precision.

There are three ways to run it:

- **`min`** — one pass, one context, no subagents. Fast and cheap. The 90% case: pre-commit, tight loops, small diffs.
- **`max`** — spec-gate, then the lenses fan out as isolated parallel subagents, findings merged into one verdict. For PRs, pre-merge, and anything touching sensitive paths.
- **auto** (plain `/code-review`) — pick `min` or `max` by change size and sensitivity (see Routing).

## Routing: choosing min vs max

When invoked as plain `/code-review` (no mode), decide the lane before doing anything else. Escalate to **max** if *any* of these hold; otherwise run **min**:

- The diff changes more than ~150 lines or touches more than ~5 files.
- The diff touches a **sensitive path**: authentication, authorization, session/token handling, cryptography, deserialization, raw SQL or query building, file-system or shell execution, payment or billing, or anything reading/writing PII.
- The user asks for a pre-merge / release / "is this safe to ship" review, or names a spec/PRD to check against.
- The user is unfamiliar with the code under review, or explicitly asks for thoroughness.

State the chosen lane in one line and why (e.g. "Running max — this touches auth and the migration path."). If the user asked for `min`/`max` explicitly, honor that and skip the heuristic.

## Step 1 — Scope the diff (all modes)

Reviews run against a **diff**, never the whole tree, and are **read-only**. Do not modify the working tree, the index, HEAD, or branch state at any point during a review.

1. Establish the base. Use whatever the user gave (a commit SHA, branch, tag, `main`, `HEAD~5`). If they gave nothing, ask for the base, or default to reviewing uncommitted changes (`git status -sb`, `git diff`).
2. Capture the diff against the merge-base with a three-dot range so you compare against where the branch actually diverged, not against a moving tip:
   ```bash
   git diff <base>...HEAD          # three-dot: against merge-base
   git log <base>..HEAD --oneline  # the commits in scope
   git diff --stat <base>...HEAD   # size + files, for routing
   ```
   (Use two-dot / `git diff` alone when reviewing uncommitted work.)
3. If you need a full-file view of a revision to understand context, check it out into a scratch worktree — never move HEAD on the user's checkout:
   ```bash
   git worktree add /tmp/review-<sha> <sha>
   ```
4. Confirm the base resolves and the diff is non-empty before continuing.

## Step 2 — Find the spec

The spec is what the change is *supposed* to do. Look, in order: an issue/PR reference in the commit messages; a path the user passed; a PRD/spec file under `docs/`, `specs/`, or similar matching the branch/feature. If you find nothing, ask. If the user says there is no spec, the spec-conformance lens reports "no spec available" and is skipped — do not invent requirements.

## The lenses

Six lenses, each defined by a checklist in `references/lenses/`. Read a lens file before applying it; do not review from memory of these categories.

| Lens | What it owns | Checklist |
|---|---|---|
| spec-conformance | Does it do what the spec asked? drift, missing scope, silent behavior changes | `references/lenses/spec-conformance.md` |
| correctness | Logic, edge cases, error handling, boundaries, concurrency/races | `references/lenses/correctness.md` |
| security | Injection, authz/authn, secrets, SSRF, unsafe deserialization, input trust | `references/lenses/security.md` |
| performance | N+1, hot paths, allocation, caching, algorithmic complexity | `references/lenses/performance.md` |
| design | SOLID, Fowler smells, cohesion/coupling, module boundaries, dead code | `references/lenses/design.md` |
| tests | Behavior vs mocks, edge coverage, test pyramid, do the tests actually run | `references/lenses/tests.md` |

The lenses are **fixed**. Domain depth (databases, a language/framework, APIs, frontend a11y) is *not* a separate lens — it is a checklist injected into whichever lens is relevant. See `references/checklist-routing.md` for the trigger → checklist → target-lens table, and consult it in Step 1 once you know what the diff touches.

## Every finding uses the same schema

All lenses, in every mode, emit findings in the one canonical shape defined in `references/finding-schema.md` — `{file, line_start, line_end, lens, category, severity, title, why, proposed_move, confidence}`. This is not decoration: the merge operates on these fields (dedup on `file`+line-overlap+`category`, agreement-weighting across lenses, severity rollup). A finding that only names a problem without a `proposed_move` is incomplete — reach for a specific, named restructuring, not "improve this".

Severity is **P0–P3**, defined in `references/severity.md`, with the rule that structure beats nits: one architectural problem outweighs ten style nits, and the review should lead with it.

## min workflow

One agent, one context, no fan-out.

1. Scope the diff (Step 1) and find the spec (Step 2).
2. From `references/checklist-routing.md`, note which domain checklists the diff triggers.
3. Walk all six lenses in sequence in this one context. For each, read its checklist file, plus any domain checklist routed to it, and record findings in the canonical schema. Give a quick spec-conformance check inline — full gating is a `max` feature.
4. Apply the merge rules from `references/merge-contract.md` yourself (dedup, severity rollup, structural-over-nits ordering, nit cap) and emit the report in the format at the bottom of this file.

`min` trades the ensemble's decorrelation for speed. That is the right trade for small, low-risk diffs; it is the wrong trade before a merge that touches something dangerous.

## max workflow

The orchestrated ensemble. **The top-level agent is the orchestrator.** Because Claude Code subagents cannot spawn subagents, you cannot delegate orchestration to a "lead reviewer" subagent — fan out from here, then collect.

1. Scope the diff and find the spec (Steps 1–2). Note triggered domain checklists.
2. **Spec-gate first.** Dispatch the `spec-conformance-reviewer` subagent (bundled with this plugin) alone. If it reports the change implements the *wrong thing* (major scope miss, contradicts the spec), **stop** and report that — do not spend the quality lenses reviewing code that has to be rewritten. This is the single cheapest way to save review budget. (Skip the gate only if there is no spec.)
3. **Fan out the five remaining lenses in parallel, in one batch.** Dispatch the `correctness-reviewer`, `security-reviewer`, `performance-reviewer`, `design-reviewer`, and `tests-reviewer` subagents (bundled with this plugin) as independent tasks. Read each lens's checklist from `references/lenses/` — plus any domain checklist the routing table routes to it — and pass that content into the reviewer's prompt along with the diff and spec. Each subagent receives **only**: the diff, the spec, its own lens checklist, and any routed domain checklist. It must **not** receive the author's session history or the other reviewers' output — that isolation is what keeps their errors decorrelated and what stops a reviewer from being talked into "looks fine". Each returns findings in the canonical schema.
4. **(Optional, highest-leverage) cross-model.** If your harness can route subagents to different model providers, put different lenses on different models. Same model reviewing alone repeats its own misses; different models have genuinely different blind spots, which is the biggest single lever on the "everyone finds something different" problem. Default (all one model, isolated contexts) still helps; cross-model helps more. See this plugin's README for how to wire per-lens model routing.
5. **Merge.** Hand all lens reports to the `merge-synthesizer` subagent (bundled with this plugin), or do it here. The synthesizer is the *only* stage that sees everything: it dedups, boosts confidence on findings ≥2 lenses agree on, resolves conflicting recommendations, normalizes and rolls up severity, orders structure-over-nits, caps nits, and emits one verdict. Follow `references/merge-contract.md` exactly.

## Guardrails

- **Read-only.** A review never edits code. If the user then asks you to fix findings, that is a separate action taken after they confirm — present findings first.
- **Be specific or say nothing.** `file:line`, a concrete failure, and a named fix. No "consider improving error handling".
- **Do not inflate.** A nit is not a P0. Give a real verdict; "looks good" without having read the diff is a failure.
- **Acknowledge what is solid.** A review that only lists problems is less useful and less trusted.

## Report format

Use this exact structure for the final output in every mode:

```
## Code Review — <mode> · <base>...HEAD
**Scope**: N files, +X/−Y lines · **Spec**: <found / none>
**Verdict**: APPROVE | APPROVE WITH NITS | REQUEST_CHANGES
<one-sentence why, leading with the most important finding>

### P0 — Blocking
1. **[file:line]** Title — why it matters. → proposed move. (lens; ✓N lenses agree)
### P1 — Fix before merge
### P2 — Should fix
### P3 — Nits (capped; collapse the tail: "…and 9 more style nits")

### Conflicts / judgement calls
<where lenses disagreed, both sides, and the call made>

### Strengths
<what is genuinely well done>
```

Verdict rollup: any unresolved P0 → REQUEST_CHANGES; P1 present → REQUEST_CHANGES (fix before merge); only P2/P3 → APPROVE / APPROVE WITH NITS. See `references/severity.md`.
