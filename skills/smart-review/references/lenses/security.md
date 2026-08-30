# Lens: security

**Owns:** can this change be abused. Think in terms of untrusted input reaching a dangerous sink, and of trust boundaries the diff crosses. Report both **exploitability** (how reachable is it) and **impact** (what does an attacker get) — that pairing drives severity.

## Trace tainted input

The core move: identify every source of attacker-controlled data (request params/body/headers, query strings, uploaded files, external API responses, message payloads, env in some contexts) and follow it to every sink. A finding is strongest when you can name the source, the path, and the sink.

## Check

- **Injection.** Untrusted data concatenated into: SQL (`sql-injection` — use parameterized queries), shell commands (`command-injection`), HTML/DOM (`xss`), a filesystem path (`path-traversal`), an LDAP/NoSQL/template expression. The fix is almost always parameterization or context-correct escaping, never manual sanitization.
- **AuthZ.** Does every changed endpoint/action check that *this* user may act on *this* resource? Object-level authorization is the most common gap — the code checks you are logged in but not that the record is yours (`authz-gap`, IDOR).
- **AuthN / sessions.** Token validation, expiry, signature checks; session fixation; auth logic that fails open (`authn-gap`).
- **Secrets.** API keys, passwords, tokens, private keys committed to source or logged (`secret-in-code`). If one is present, the finding is P0 *and* the secret must be rotated, not just removed.
- **SSRF.** User-controlled URLs fetched server-side without allow-listing (`ssrf`) — especially dangerous in cloud metadata range.
- **Unsafe deserialization.** Untrusted input into a deserializer that can instantiate arbitrary types or run code (`unsafe-deserialization`).
- **Open redirect**, missing output encoding, missing CSRF protection on state-changing routes, over-permissive CORS, sensitive data in URLs or logs.
- **Crypto misuse.** Home-rolled crypto, ECB mode, static IVs, weak/absent hashing for passwords (use a slow KDF), `Math.random()` for tokens.

## Bias

When unsure whether something is exploitable, flag it with your uncertainty in `confidence` and the reachability in `why`, rather than staying silent — under-reporting security is costlier than a false positive here. Recommend established libraries over hand-rolled security primitives.

## Output

Canonical schema, `lens: security`. `why` must state exploitability + impact; `proposed_move` names the specific mitigation.
