# Merge contract

This is the aggregation layer — the part that turns many overlapping reviews into one trustworthy verdict, and the part that determines whether `max` is better than `min` or just noisier. Apply these rules in order. The merge is the **only** stage that sees every lens's output; the reviewers themselves stay blind to each other so their errors stay decorrelated.

## Input

A flat list of findings (finding-schema.md) from all lenses that ran. In `max`, that is up to five quality lenses plus whatever the spec-gate emitted. Each finding already carries its `lens`, `category`, location, `severity`, and `confidence`.

## 1. Dedup

Two findings are the **same** finding when they share a `category` **and** their line spans overlap (or sit within 3 lines of each other) in the same `file`. Collapse each group into one:

- Keep the clearest `title` / `why` / `proposed_move` across the group.
- Record which lenses contributed (`agreed_by: [security, correctness]`).
- Take the **max** severity and the **max** confidence of the group as the starting point (agreement can only raise these, step 2).

Near-duplicates that describe the same root cause under *different* categories (e.g. `null-deref` and `unhandled-error` on the same line) are **not** auto-merged — surface both but note the relationship, since fixing one may or may not fix the other.

## 2. Agreement-weight

Independent agreement is the strongest signal you have that a finding is real, and it is free because the lenses ran independently.

- A finding raised by **≥2 lenses** gets its `confidence` bumped toward 1.0 and moves up within its severity tier.
- A **lone** finding with `confidence < 0.4` is demoted: keep it, but drop it to the bottom of its tier and mark it "single lens, low confidence" so the author can weigh it. Do not silently discard — a real bug is often found by only one lens.

## 3. Resolve conflicts

Lenses will sometimes prescribe opposite moves (design says "extract a helper", performance says "inline it to avoid the call"). Do **not** silently pick one.

- Merge them into a single finding that states both moves and the trade-off.
- If a call is needed, the higher-severity concern wins the framing (a P1 correctness/security concern outranks a P3 style preference). Security and correctness generally win ties over style and micro-perf.
- Put unresolved judgement calls in the report's "Conflicts / judgement calls" section, with both sides, so the author decides with eyes open.

## 3b. Validate before it ships

Agreement and dedup tell you findings are *consistent*; they don't tell you a finding is *true*. Before rolling up severity, run `references/validation.md` on every P0/P1 and on any P2/P3 that step 2 promoted into the visible tiers: re-read the cited code fresh, check whether it predates this diff, check whether it's already handled elsewhere, and check whether it's an intentional pattern rather than a bug. Findings that don't survive get downgraded or discarded per that file's rules — discarded findings still get one line in the report's `### Discarded` note, never a silent drop.

## 4. Normalize and roll up severity

Every finding is already P0–P3 (severity.md). Compute the verdict from the surviving set:

- any unresolved **P0** → `REQUEST_CHANGES` (blocking)
- any **P1** → `REQUEST_CHANGES` (fix before merge)
- only **P2/P3** → `APPROVE` (or `APPROVE WITH NITS` if there are P3s)
- nothing → `APPROVE`, and say so explicitly rather than staying silent.

## 5. Order: structure over nits, spec-conformance stays separate

Within the P0-P3 ladder, order by severity, then by structural weight, then by agreement count. The single most important finding leads — if there is one structural problem and ten nits, the structural problem *is* the review and goes first. A reader who fixes only the top three findings should be fixing the three that matter most.

`lens: spec-conformance` findings are the one exception: pull them out of the P0-P3 ladder into their own always-shown `### Spec conformance` section (report format in `SKILL.md`), instead of interleaving them by severity with everything else. Reason: code can pass every quality lens and still implement the wrong thing, and a P2 spec-drift finding sitting in the middle of a pile of correctness P2s is exactly the kind of signal this skill exists to stop from getting buried. They still count toward the overall verdict rollup (step 4) as if they were in the ladder — only their *display position* changes.

## 6. Cap the nits

This is the rule that keeps the ensemble honest. Left uncapped, five reviewers produce a wall of P3s that buries the P0.

- Show at most ~5 P3 nits; collapse the rest into one line: "…and 9 more style nits (naming, formatting) — available on request."
- If a single category produces many instances (e.g. 12 missing JSDoc comments), report it **once** as a pattern with a count, not 12 times.

## Output

Emit the report in the format at the bottom of `SKILL.md`. The merged finding shape gains two fields for the report:

```jsonc
{
  "...": "all finding-schema.md fields (max severity/confidence of the group)",
  "agreed_by": ["security", "correctness"],   // lenses that raised it
  "conflict_with": null                          // or a sibling finding id
}
```

## The failure mode this prevents

Running all your favorite review tools at once already gives you union coverage — and a mess. Without this merge you get duplicated findings (three tools flag the same N+1), contradictory advice, no severity normalization, and P0s lost in nit-noise. The merge is the actual product; the lenses are commodities.
