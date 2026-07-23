# Lens: spec-conformance

**Owns:** whether the change does what it was supposed to do. This is the axis that catches "clean code that implements the wrong thing" — code can pass every other lens and still be wrong here. In `max` this lens runs first as a gate.

You need the spec (issue, PRD, ticket, or the user's stated intent). If there is none, report "no spec available" and skip — do not invent requirements to review against.

## Check

- **Every required behavior is present.** Walk the spec's acceptance criteria one by one against the diff. A criterion with no corresponding code is `missing-requirement`.
- **Nothing contradicts the spec.** Where the code does something the spec explicitly rules out, or the opposite of what it asks, that is `contradicts-spec` and usually P1+.
- **Scope drift.** Code that does things the spec never asked for is `scope-drift` — not always wrong, but flag it: unrequested behavior is unreviewed behavior and often the source of surprises.
- **Silent behavior changes.** A refactor or "small fix" that changes an observable behavior (an API response shape, a default, an error code, ordering) without the spec calling for it is `silent-behavior-change`. These are the ones that break callers quietly.
- **Deviations that are actually improvements.** If the code sensibly diverges from an underspecified or wrong spec, say so and call it justified rather than dinging it — but name the divergence so it is a decision, not an accident.

## Gate rule (max)

If the change misses major scope or contradicts the spec such that it must be substantially rewritten, report that and **stop the review there**. There is no point spending correctness/security/perf effort on code that is going to change shape. If the misses are localized, report them and let the other lenses proceed.

## Output

Findings in the canonical schema, `lens: spec-conformance`. Lead the gate decision with a one-line verdict: implements the spec / implements it with gaps / implements the wrong thing.
