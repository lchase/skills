# Validation pass

A lens is confident, not correct. Before any finding ships, re-check it against the actual code with no loyalty to the original claim — this is what catches a misread guard, a pre-existing issue mislabeled as new, or a "bug" that's actually an intentional pattern.

Run this on every **P0/P1** finding, and on any P2/P3 that agreement-weighting promoted into the report's visible tiers. Nit-tier findings that stay collapsed under the cap don't need it — not worth the cost.

## Checks, in order

1. **Re-read the cited span.** Open `file:line_start-line_end` plus enough surrounding context (the whole function/block) fresh. Does the finding's claim still hold when you read it again, slower, without the lens's framing?
2. **Is it actually introduced by this diff?** `git blame <file> -L <line_start>,<line_end> <base>...HEAD` (or just `git log -1 --format=%H -- <file>` against the base if blame is noisy). A real defect that predates the diff is still worth knowing about, but label it `pre-existing` in the finding rather than implying the diff caused it — that changes whether it blocks this merge.
3. **Is it already handled somewhere the lens didn't look?** A caller-side guard, a middleware layer, a framework default, a type system guarantee. Grep for the function's other call sites and for the type/schema involved before trusting "unvalidated input."
4. **Is this an intentional pattern, not a bug?** A `catch` that logs and continues might be deliberate degraded-mode behavior; check for a comment, test, or sibling code doing the same thing on purpose before calling it a `swallowed-exception`.
5. **If the finding claims specific library/framework behavior**, confirm it against that dependency's actual installed version (check `node_modules`/lockfile-pinned source or its docs) rather than trusting the lens's memory of how the API works — library behavior is exactly the kind of thing training data gets stale or wrong on.

## Verdict per finding

- **Survives** — keep as-is.
- **Downgrade** — the claim is real but weaker than stated (e.g. pre-existing, partially guarded elsewhere, lower actual severity). Adjust severity/confidence and say why in `why`.
- **Discard** — the claim doesn't hold (misread code, already guarded, intentional). Drop it from the report, but keep one line in a `### Discarded` note at the end: `<file:line> — <one-line claim> — discarded: <reason>`. Silently dropping erases the audit trail; a reader who disagrees with the discard should be able to check your reasoning.

Do not let validation become a second full review pass — you are checking one specific claim against the code, not re-deriving the whole lens from scratch.
