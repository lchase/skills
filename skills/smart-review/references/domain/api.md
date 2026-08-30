# Domain: API / interface

Injected into **design** and **spec-conformance** when the diff changes a public surface: HTTP routes, controllers, RPC/GraphQL schemas, exported package entry points, or versioned endpoints. The governing idea is Hyrum's Law — every observable behavior of an interface will eventually be depended on, so a change to that surface is a change to a contract.

## → design

- **Backward compatibility.** Does the change remove or rename a field, tighten a type, change a default, alter status codes, or change error shapes that existing clients rely on? A breaking change on an unversioned public endpoint is high severity. Additive changes are safer than modifications.
- **Contract clarity.** Consistent resource naming, HTTP verbs matching semantics (no state change on GET), consistent pagination/filtering/error envelope across the surface.
- **Input validation at the boundary.** The API validates and rejects malformed input at the edge rather than trusting it inward (this also feeds security). Unbounded list parameters, missing size limits.
- **Idempotency.** State-changing operations that may be retried — are they idempotent, or is there an idempotency key? Double-submit safety.
- **Leaky internals.** Does the response expose internal identifiers, stack traces, or fields that should not cross the boundary?

## → spec-conformance

- **The contract matches the spec.** Field names, types, required/optional, status codes, and error cases match what the ticket/PRD/API-design doc specified — not just something reasonable.
- **Versioning.** If the spec calls for a new version or a deprecation, is the old behavior preserved and the new one added, rather than silently swapped (`silent-behavior-change`)?
- **Documented behavior.** If there is an OpenAPI/schema/doc of record, the change updates it and stays consistent with it.
