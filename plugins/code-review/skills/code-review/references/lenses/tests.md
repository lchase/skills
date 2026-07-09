# Lens: tests

**Owns:** do the tests actually protect this change. Tests are necessary but not sufficient — they do not catch architecture or security problems, and a passing suite full of mocks can be worthless. The question is not "are there tests" but "would these tests fail if the code were wrong".

## Check

- **Real behavior vs mocks.** A test that mocks the thing it claims to verify tests the mock, not the code (`mocked-behavior`). Assertions on "was this function called" instead of on the actual result are a warning sign. Prefer tests that exercise the real path; mock only true externals (network, clock, third parties).
- **Changed behavior is covered.** Every behavior this diff adds or changes needs a test that would fail without the change (`untested-change`). New code with no new test is a gap; a bug fix with no regression test will regress (`no-failure-test` — for a fix, there should be a test that fails before the fix and passes after).
- **Edge cases in the tests, not just the code.** The empty, null, boundary, and error cases the correctness lens worries about — are they asserted? (`missing-edge-case`).
- **The tests run and are deterministic.** Do they actually execute in CI? Any reliance on real time, ordering, network, or shared state that makes them flaky (`flaky-pattern`)? A skipped or `.only`-scoped test slipping through the diff.
- **Test readability.** Tests read as a specification of intended behavior. Some duplication in tests is fine and often better than a clever abstraction that hides what is being checked — do not over-DRY tests.
- **Level.** Is the behavior tested at the lowest level that captures it? A unit test for unit logic, an integration test where the risk is in the seams. Not everything needs an end-to-end test.

## Output

Canonical schema, `lens: tests`. Tie each finding to the specific behavior left unprotected: "the empty-cart branch added at charge.ts:40 has no test; it would ship broken and the suite would stay green."
