# Domain: frontend / accessibility

Injected into **design** for user-facing components (JSX/TSX views, forms, anything rendered). Accessibility issues are correctness for a real slice of users, so treat them as findings, not nits, when they block use.

## → design

- **Semantic HTML.** Real `<button>`/`<a>`/`<label>`/heading structure rather than click-handling `<div>`s. A `div` with `onClick` and no role/keyboard handling is not operable by keyboard or screen reader.
- **Keyboard operability.** Everything interactive is reachable and usable by keyboard (focusable, Enter/Space activation), focus is visible, and focus is managed on route/modal changes (focus trap in dialogs, return focus on close).
- **Labels & names.** Every form control has an associated label; icon-only buttons have an accessible name (`aria-label`); images have meaningful `alt` (or empty `alt` when decorative).
- **ARIA sparingly and correctly.** Prefer native semantics; use ARIA only to fill gaps, and correctly (valid roles, required companion attributes). Wrong ARIA is worse than none.
- **Contrast & state.** Text meets contrast minimums; state is not conveyed by color alone; error messages are associated with their field (`aria-describedby`) and announced.

### React-specific

- **Keys.** Stable, unique list keys — never the array index for reorderable/dynamic lists (causes state/DOM mismatches).
- **Effect dependencies.** `useEffect` dependency arrays that are wrong (stale closures, missing deps) or effects that should not be effects at all (derivable during render). Cleanup on unmount for subscriptions/timers.
- **Unnecessary re-render / unstable props.** New object/array/function literals passed as props defeating memoization on hot component trees (this can also be a `performance` finding).
- **Controlled/uncontrolled.** An input flipping between controlled and uncontrolled; direct DOM mutation fighting React's model.
