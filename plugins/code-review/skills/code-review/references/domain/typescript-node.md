# Domain: TypeScript / Node

Injected into **correctness** and **design** for `*.ts` / `*.tsx` / `*.mjs` and Node code. Adds language- and runtime-specific traps to those lenses.

## → correctness

- **Floating promises.** A promise-returning call without `await` or `.catch` — the operation may not finish, and rejections become unhandled. Includes `forEach` with an async callback (does not await). Use `for…of` with `await`, or `Promise.all`.
- **`any` and unsafe casts.** `as` casts and `any` that suppress the very type error that would have caught the bug. A cast that lies about a value's shape defers the crash to runtime. Treat `as unknown as T` as a red flag.
- **Null vs undefined.** Optional chaining that yields `undefined` and flows on silently; `??` vs `||` (the latter swallows `0`, `''`, `false`); non-null assertions (`!`) that assume presence the types do not guarantee.
- **Equality & coercion.** `==` vs `===`; truthiness checks that misfire on `0`/`''`; `NaN` comparisons.
- **Error typing.** `catch (e)` where `e` is `unknown` — is it narrowed before `.message` is read? Throwing non-Error values.
- **Array/object surprises.** `sort()` mutating in place and sorting lexicographically by default; shallow copies (`{...x}`, `slice`) treated as deep; `Object.keys` order assumptions.
- **Runtime shape.** Data crossing a boundary (JSON parse, request body, env) typed as a nice interface but never validated — the type is a lie until parsed/validated (e.g. with a schema validator).

## → design

- **Module boundaries & barrels.** Circular imports; a barrel `index.ts` re-exporting everything and creating cycles or import bloat.
- **`type` vs `interface`, discriminated unions.** Prefer a discriminated union over a bag of optional fields where states are mutually exclusive — it makes illegal states unrepresentable and kills downstream branching.
- **Dependency hygiene.** A new runtime dependency for something trivial; a heavy import pulled in for one helper; dev vs runtime dependency placement in `package.json`.
- **Async design.** Mixing callbacks and promises; not using `AbortController` where cancellation matters.
