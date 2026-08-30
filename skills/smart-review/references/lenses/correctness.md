# Lens: correctness

**Owns:** does the code do the right thing under all inputs it will actually see — including the ugly ones. This is where most real bugs live, and where AI-written code fails most often: it is confident and plausible on the happy path and quietly wrong at the edges. Give AI-generated diffs *more* scrutiny here, not less.

## Check

- **Edge cases.** Empty collections, single-element collections, zero, negative numbers, the maximum value, the first and last iteration. Off-by-one in bounds, ranges, and slicing (`off-by-one`, `boundary`).
- **Null / undefined / absent.** Every value that can be missing — is it handled before use? Optional chaining that silently produces `undefined` and defers the crash. `null-deref`.
- **Error handling.** Every failure path: is the error caught, or does it propagate to somewhere that handles it? A `catch` that logs and continues as if nothing failed is `swallowed-exception`. An error path that leaves state half-updated is worse than a crash.
- **Async and concurrency.** Missing `await` (a promise used as a value). Unhandled rejections. Shared state mutated by concurrent requests without guarding (`race-condition`). Operations assumed atomic that are not (read-modify-write on a counter, check-then-act on a resource).
- **Resource lifecycle.** Files, connections, locks, timers, subscriptions — opened and always closed, even on the error path (`resource-leak`).
- **Logic.** Inverted conditions (`logic-inversion`), `&&`/`||` mixups, wrong comparison operator, a loop that never advances or never terminates, integer/float and rounding assumptions (especially money — never float for currency).
- **Contracts.** Does the code uphold what its callers assume, and assume only what its callees guarantee? A function that now returns `null` where it never did before breaks every caller.

## How to find them, not just recognize them

Pick the two or three riskiest changed functions and trace a hostile input through them by hand: what does an empty string, a huge list, a concurrent second call, or a downstream timeout do here? Recognizing categories is easy; running the input is what surfaces the bug.

## Output

Canonical schema, `lens: correctness`. Always give the failing input in `why` ("crashes when `items` is empty because `items[0]` is read before the length check").
