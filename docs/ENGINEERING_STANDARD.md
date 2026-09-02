# WellSet Engineering Standard

**Status:** Required for the competition release  
**Purpose:** Translate WellSet's product requirements into a small, inspectable, world-class open-source engineering workflow.

## 1. Standard of craft

World-class does not mean maximum abstraction, dependency count, test count, or documentation volume. For WellSet it means:

- the important behavior is easy to find;
- invariants have one authoritative implementation;
- state transitions are deterministic and testable;
- failures are explicit, structured, and fail closed;
- agent permissions are narrower than the human principal's understood intent;
- every public claim is demonstrably true;
- a new contributor can run and understand the project quickly;
- the deployed interaction works in the actual judging environment.

Prefer code that is obvious after careful thought over code that merely looks clever. An impressive implementation makes difficult guarantees simple to inspect.

## 2. Sources of truth

| Concern | Authoritative location |
|---|---|
| Product behavior and release acceptance | `docs/PRD.md` |
| Contributor and coding-agent constraints | `AGENTS.md` |
| System boundaries and state flow | `docs/ARCHITECTURE.md` |
| Important decisions and rejected alternatives | `docs/DECISIONS.md` |
| Vulnerability reporting and security posture | `SECURITY.md` |
| Executable behavior | Domain code and automated tests |

Documentation and implementation must not silently disagree. If behavior changes intentionally, update the relevant source-of-truth document in the same pull request.

## 3. Architecture rules

- Domain behavior remains independent of the DOM and WebMCP runtime.
- `evaluateLayout()` is the sole producer of validation truth. Callers must not append or rewrite violations after evaluation.
- Store operations are the only mutation path used by both UI and WebMCP handlers.
- Tool handlers read current state at execution time.
- WebMCP registration is static, top-level, singleton, and feature-detected.
- All state snapshots and receipts are detached and JSON serializable.
- No hidden randomness, time dependence, network dependence, or model call exists in the hero path.
- A failed operation may produce a receipt, but it must not partially mutate protected domain state.

## 4. Change design

Before editing, state:

1. the invariant or user-visible outcome being changed;
2. the smallest coherent implementation;
3. the failure case;
4. the verification that proves the change;
5. documentation affected by the change.

Use the Ponytail order:

1. platform primitive;
2. existing project function;
3. small local implementation;
4. existing dependency;
5. new dependency only with written justification.

Security, validation, accessibility, recovery, and tests are never removed as simplification.

## 5. Testing pyramid

### Domain tests

Prove generation, validation, locking, blocking, reflow, idempotency, completeness, uniqueness, capacity, and fail-closed behavior. Prefer invariant assertions over snapshots of implementation details.

### Contract tests

Prove exact tool names, schemas, annotations, input rejection, registration idempotency, current-state reads, and JSON-serializable results.

### Browser tests

Prove the human interaction, accessible states, visible violation transition, and progressive enhancement in a real browser. The final Site Tools test must run manually in ChatGPT's built-in browser because a unit-test mock cannot prove discovery or invocation there.

### Regression rule

Every behavioral bug receives a test that fails before the fix and passes after it. Test counts are not a quality metric by themselves.

## 6. Required automated gates

Every pull request and push to `main` must run on GitHub Actions:

- clean dependency installation;
- syntax or static checks;
- complete automated test suite;
- production/static build verification where applicable;
- secret scanning and dependency/security alerts provided by GitHub.

Code coverage may reveal untested code, but no coverage percentage substitutes for invariant and browser testing. Add a threshold only after confirming it rewards meaningful behavior rather than line execution.

## 7. Review workflow

Until submission, use short-lived branches for non-emergency changes:

1. one bounded change per branch;
2. run `npm run verify` locally;
3. open a focused pull request with intent, risk, and verification;
4. wait for CI;
5. use automated review as a second opinion;
6. accept only findings supported by code and requirements;
7. merge after the hero path remains intact.

Automated review does not own product decisions and does not replace deterministic tests or human acceptance testing. Avoid spending deadline time satisfying stylistic noise.

## 8. Security and supply chain

- Keep the runtime dependency count at zero unless a requirement justifies a change.
- Pin GitHub Actions to immutable commit SHAs before the final release where practical.
- Grant workflow permissions explicitly and minimally, normally `contents: read`.
- Never place secrets in source, fixtures, screenshots, logs, or the demo recording.
- Treat third-party scripts as an expansion of the WebMCP trust boundary; do not add them to the application.
- Enable GitHub secret scanning, push protection where available, Dependabot alerts, and CodeQL/default code scanning for the public repository.
- Review every dependency addition for necessity, maintenance, license, provenance, and browser impact.

## 9. Open-source quality

The repository must include:

- a concise problem-first README;
- a verified quick start;
- license, contribution guide, security policy, PRD, architecture, and decision record;
- tool map and sample prompts;
- current screenshots or GIF;
- explicit limitations and scientific disclaimer;
- reproducible checks from a clean clone;
- consistent naming and no stale product names;
- no generated clutter, dead code, secrets, or unrelated proprietary material.

Commits and pull requests should explain intent rather than narrate file edits. Public discussion should be respectful, specific, and evidence-led.

## 10. Release gate

A release candidate is acceptable only when:

- local verification and CI both pass;
- no unresolved P0/P1 correctness or security finding remains;
- the WebMCP tools are discoverable on the public deployment;
- the complete hero flow passes ten consecutive application-state trials;
- keyboard and basic screen-reader semantics have been manually checked;
- the empty, constrained, resolved, unsupported, and failure states are legible;
- documentation matches the release commit;
- the recorded demo shows a real Site Tools invocation;
- the release commit and deployment URL are recorded in `docs/DECISIONS.md`.

## 11. Constitutional test

Before accepting a change, ask:

- Does it create trusted progress or only visible activity?
- Does it make state, consequence, and recovery clearer?
- Does it preserve human agency and bounded agent authority?
- Does it prevent, detect, or explain a plausible mistake?
- Is the claim narrower than the demonstrated capability?
- Is this the smallest responsible solution?
- Will a contributor understand why it exists?

If a change cannot answer one of those questions meaningfully, it probably does not belong before submission.
