# WellSet implementation contract

This repository is a time-critical OpenAI WebMCP Challenge submission. Preserve the hero interaction and reliability before adding scope.

## Non-negotiable architecture

- Keep one authoritative external plate store shared by the UI and tool handlers.
- Register exactly three static, top-level imperative tools through `document.modelContext.registerTool()`.
- Do not use `navigator.modelContext`, declarative tools, iframes, dynamic schemas, a backend, authentication, remote content, or an LLM API.
- Keep `evaluateLayout()` pure and internal. It is not an agent tool.
- All placement and tie-breaking must remain deterministic.
- Locked assignments must never move. Blocked wells must be empty after a successful reflow.
- Repeated reflow on a valid plate must be an idempotent no-op.
- Tool results must remain compact JSON-serializable receipts plus verifiable state.

## Ponytail engineering ladder

When modifying this codebase, prefer solutions in this order:

1. **Browser/platform primitives** — use what the platform already provides.
2. **Reuse existing domain functions** — extend `domain.js` internals before adding new code.
3. **No new dependency** unless the capability genuinely cannot be built with platform APIs.
4. **Minimum coherent solution** — the smallest change that satisfies the invariant.
5. **Never remove** validation, security, accessibility, error handling, or tests.

## Before committing

Run:

```bash
npm run verify
```

Do not weaken or delete invariants to make tests pass. Add a regression test for every behavioral fix. Avoid new dependencies unless the capability cannot reasonably be implemented with platform APIs.

## Scope order

1. Domain invariants
2. WebMCP discovery and execution
3. Hero flow reliability
4. Visual comprehension and accessibility
5. Documentation and demo polish

Export, accounts, persistence, collaboration, external scientific services, and additional tool surfaces are out of scope until the three-hour kill test passes.
