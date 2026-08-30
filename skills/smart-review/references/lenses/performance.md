# Lens: performance

**Owns:** will this be fast enough where it matters. Do not chase micro-optimizations on cold paths — that is noise. Focus on the changes that affect a hot path, a loop over unbounded data, or a per-request cost. Performance findings should name the scale at which they bite.

## Check

- **N+1 queries.** A query inside a loop over rows, or an ORM lazy-load triggered per item (`n-plus-one`). The classic and most common real perf bug. Fix: batch/join/eager-load, or a single `WHERE id IN (…)`.
- **Algorithmic complexity.** A nested loop over the same collection turning an O(n) job into O(n²) (`quadratic-loop`); a linear scan where a map/set lookup belongs; repeated work that could be hoisted or memoized.
- **Database access.** A query with no supporting index on its filter/join columns (`missing-index`); `SELECT *` pulling wide rows to use one column; fetching all rows to count or filter in app code.
- **Blocking the event loop / thread.** Synchronous I/O, `readFileSync`, CPU-heavy work on the request path in a single-threaded runtime (`blocking-io`).
- **Allocation on hot paths.** Rebuilding a large object/array/regex every call instead of once; unbounded caches or arrays that grow forever (a slow leak); large payloads held in memory (`hot-path-allocation`).
- **Missing caching.** An expensive, repeated, cacheable computation or fetch with no memoization or cache layer (`missing-cache`) — but only where the access pattern actually repeats.
- **Chattiness.** Sequential awaits that could run in parallel (`Promise.all`); many round-trips where one batched call would do.

## Calibrate

Estimate the input size in production. "This is O(n²)" is only a P1 if `n` is large and on a hot path; on a bounded 10-element config list it is a non-issue — say so instead of flagging it. Tie every finding to a realistic scale in `why`.

## Output

Canonical schema, `lens: performance`. `why` states the cost and the scale at which it matters; `proposed_move` names the concrete fix (batch the query, add the index, hoist the allocation).
