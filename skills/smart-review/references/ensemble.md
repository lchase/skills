# The ensemble protocol

`max` runs the lenses as a **decorrelated ensemble** and then merges. How the fan-out
happens depends on what the running harness can do. The merge is identical either way.

## Capability check

**If this harness can dispatch isolated parallel subagents** (Claude Code Task tool, or
any harness with an equivalent), run the *isolated* variant below. This is the real
ensemble — its whole value is that the reviewers cannot see each other or the author's
session, so their errors don't line up.

**If it cannot** (Cursor, Codex, Gemini CLI, plain chat), run the *sequential* variant.
It keeps the spec-gate, the six lenses, and the merge; it loses the isolation and any
cross-model coverage. That is an acceptable degrade for `max`, not a broken mode.

## Isolated variant (parallel subagents)

1. **Spec-gate.** Dispatch the spec-conformance reviewer alone. If it reports the change
   implements the *wrong thing*, stop and report that — don't spend the other lenses on
   code that must be reshaped. Skip the gate only if there is no spec.
2. **Fan out the remaining five lenses in one parallel batch.** Each subagent receives
   **only**: the diff, the spec, its own lens checklist (`references/lenses/<lens>.md`),
   and any domain checklist the routing table sends to that lens. It must **not** receive
   the author's session history or any other reviewer's output. Each returns findings in
   `references/finding-schema.md` shape.
   - On Claude Code these subagents are the bundled `agents/*-reviewer.md`. On another
     harness with subagents, construct the equivalent prompt from the lens checklist.
3. **(Optional, highest-leverage) cross-model.** If subagents can be routed to different
   model providers, put different lenses on different models — same-model reviewers repeat
   the same blind spots; different models miss different things.
4. **Merge.** One stage sees everything. Apply `references/merge-contract.md` exactly:
   dedup, agreement-weighting, conflict resolution, severity rollup, structure-over-nits
   ordering, nit cap, one verdict.

## Sequential variant (one context)

1. **Spec-gate** inline: check the diff against the spec first. If it's the wrong thing,
   stop and report.
2. **Walk the six lenses in order**, resetting framing between each: re-read the lens
   checklist (plus routed domain checklist), review *only* against that lens, record
   findings, then deliberately drop that lens's conclusions before starting the next.
   Do not let "correctness looked fine" soften the security pass.
3. **Merge** yourself per `references/merge-contract.md` and emit the report.

This is what `min` also does — the difference is `min` skips the formal spec-gate and is
invoked for small, low-risk diffs by design.
