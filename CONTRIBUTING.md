# Contributing

WellSet is currently a narrow reference implementation of a mixed-initiative WebMCP interaction. Small, test-backed fixes that improve reliability, accessibility, documentation, or verifiability are welcome.

## Before opening a pull request

1. Search existing issues and pull requests.
2. Open an issue before proposing a feature, dependency, or architectural change.
3. Create a focused branch from `main`.
4. Preserve every constraint in [`AGENTS.md`](AGENTS.md).
5. Keep the page client-side and avoid introducing remote data or runtime dependencies.

## Local verification

Requirements: Node.js 20 or newer.

```bash
npm install
npm run verify
npm run serve
```

Then verify the affected human flow in a browser. WebMCP changes must also preserve exactly three static top-level imperative tools and the canonical lock/block/reflow interaction.

## Pull requests

Keep each pull request small. Explain:

- the problem and user-visible impact;
- the implementation and alternatives considered;
- tests and manual verification performed;
- any security, accessibility, or scientific-claim implications.

Do not include secrets, real experimental data, generated dependency churn, or unrelated formatting changes.

## Scope boundary

The deterministic layout engine is intentionally simple and is not represented as laboratory-grade optimization software. Real protocol support, persistence, authentication, laboratory-system integrations, or scientifically validated placement policies require evidence and design work before implementation.
