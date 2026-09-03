# WellSet Product Requirements Document

**Version:** 1.1  
**Status:** Product and competition scope locked  
**Owner:** Ajinkya Kinhikar  
**Target:** OpenAI WebMCP Challenge 2026  
**Product type:** Competition vertical slice; open-source technical demonstration  
**Engineering companion:** [`ENGINEERING_STANDARD.md`](ENGINEERING_STANDARD.md)  

## 1. Product definition

WellSet is a mixed-initiative experiment-layout canvas in which a person and a browser agent work on the same live 96-well plate.

The person contributes contextual and spatial judgment by protecting important assignments and marking wells that cannot be used. The agent contributes precise, deterministic reflow and validation through structured WebMCP tools. Both participants operate on one authoritative application state, and every action is visibly reflected in the plate and in a verifiable operation receipt.

**Product thesis:** WebMCP is most valuable when it does more than help an agent operate a website. It lets a person and an agent contribute different kinds of intelligence to the same live artifact.

**One-line pitch:** A scientist edits the plate; their agent safely reflows the experiment around those decisions without moving protected controls.

### Constitutional product brief

**Internal mantra:** Trusted shared execution.

**Real struggle:** When a laboratory worker prepares a spatial experiment layout, they may need to preserve locally important placements and exclude physically unusable wells. Manual repair is tedious and automation may not know those contextual constraints. WellSet demonstrates how a person can express that judgment directly on the artifact while an agent performs the precise reflow.

**Better observable outcome:** A constrained plate moves from visible invalidity to a valid layout without moving human-protected assignments.

**First value:** Within one interaction, the user sees a generated layout, introduces a real constraint, and receives an immediately verifiable correction.

**User transformation:** This competition slice does not claim a three-month user transformation. Its narrower demonstrated transformation is from manually repairing a layout to confidently supervising a bounded agent operation.

**Risk classification:** The deployed synthetic demonstration is **Tier 1: personal workflow** and **AI autonomy level 3: reversible execution inside a bounded system**. Any future version used for real laboratory decisions would require reassessment as at least **Tier 2: sensitive assistance**, domain-expert validation, persistent audit, and production operational controls.

**Evidence status:**

- **[V]** Human judgment should remain operative in agent-assisted work.
- **[E]** Structured tools, deterministic validation, idempotency, visible state, and bounded permissions improve inspectability and reliability.
- **[H]** Laboratory workers would prefer this mixed-initiative interaction to current manual or automated plate-layout workflows; this has not been validated through user research.
- **[L]** The 96-well scenario, outer-ring policy, experiment counts, tool surface, and deterministic reflow are competition-specific choices.

### Affected parties and power boundaries

| Party | How they benefit | What must not happen |
|---|---|---|
| Human operator | Retains visual judgment and can constrain agent action | The agent silently overrides a lock or claims validity incorrectly |
| Downstream research team | Receives a legible, validated proposed layout | The demo is represented as scientifically or clinically validated |
| Browser agent | Receives narrow semantic capabilities and structured receipts | It receives arbitrary execution power or stale/misleading state |
| Maintainer/contributor | Can understand, test, and extend a small codebase | Cleverness obscures invariants, provenance, or failure behavior |

The human principal decides which assignments are protected and which wells are unavailable. The application—not the agent—decides whether invariants are satisfied. The project owner is accountable for claims made in the interface, repository, video, and submission.

## 2. Competition objective

The submission must make the interaction understandable within 30 seconds and demonstrate that WellSet becomes materially better when a person and an agent use it together.

The entry is designed to score strongly on:

- **WebMCP leverage:** semantic tools act on the same live state shown in the interface;
- **execution:** a narrow, deterministic, polished interaction that works repeatedly;
- **potential impact:** experimental layouts contain contextual constraints and errors can waste time, samples, and money;
- **creativity and ambition:** human edits become live constraints on the agent's next action rather than comments or approvals outside the task.

The project does **not** claim novelty in microplate optimization. Existing systems already address algorithmic plate arrangement. WellSet's novel claim is the mixed-initiative WebMCP interaction model.

## 3. Problem

Scientific layout tools usually force a choice between manual visual editing and automated generation. Manual editing preserves local human knowledge but is tedious and error-prone. Automation can be precise but may not know that a particular control must stay in place or that specific wells are unusable.

Conventional browser automation is also a poor interface for this task. An agent must infer assignments, locks, blocked cells, and validation errors from visual or DOM details. A remote MCP server could manipulate data, but it would not inherently share the live spatial artifact the person is inspecting.

WellSet gives each participant the interface suited to them:

- the person receives a visual plate for recognition, intervention, and judgment;
- the agent receives narrow semantic operations with structured state and receipts;
- the application owns validation, invariants, and synchronization.

## 4. Target users and audience

### Primary represented user

A scientist, laboratory operator, or research assistant preparing a plate layout and applying physical or protocol-specific constraints.

### Competition audience

Judges and developers who may have no wet-lab background. The interface and demo must therefore explain the domain without requiring prior knowledge.

### Required comprehension aid

The following idea must remain visible during the interaction:

> Each cell is one experiment. Position can bias results. Locked cells cannot move.

The viewer must be able to count the visible violations before the agent acts and verify that protected controls did not move afterward.

## 5. Hero interaction

### Before

The user needs a valid layout for a compound-response experiment containing four controls and twenty-four sample experiments. The layout should avoid the plate's outer ring.

### Human role

The user inspects the generated visual layout, locks two occupied control wells that must remain unchanged, and blocks two occupied inner sample wells that cannot be used. The two blocked-but-occupied wells immediately become visible violations.

### Agent role

The user asks:

> Reflow around my blocked wells without moving the locked controls.

The agent invokes `wellset_reflow_unlocked`. It reads the latest application state, preserves the protected assignments, deterministically repositions the unlocked experiments, and validates the result in one transaction.

### WebMCP role

The agent does not inspect or click dozens of cells. It discovers a semantic capability provided by the current page and receives structured confirmation of what moved, which locks were preserved, the resulting revision, and the remaining violations.

### Transformation and visual payoff

The plate changes from **2 violations to 0**. Moved wells are visibly highlighted, the locked controls stay in place, and the operation receipt reports the movement and validation outcome.

## 6. Product principles

1. **Complementarity over automation.** The human must make a meaningful intervention; the agent must do work that benefits from structured precision.
2. **One shared truth.** The UI and WebMCP tools must read and mutate the same authoritative state.
3. **Application-owned safety.** The page—not the model—enforces locks, blocks, uniqueness, completeness, and validation.
4. **Determinism over spectacle.** The hero path must behave identically across repeated demonstrations.
5. **Visible verification.** A viewer must be able to see both the transformation and proof of preserved constraints.
6. **Progressive enhancement.** The application remains usable through visible controls without WebMCP.
7. **Minimum coherent system.** Prefer platform primitives and small inspectable modules; do not trade away validation, security, accessibility, or error handling.

## 7. Scope

### In scope for the competition release

- one predefined 96-well compound-response scenario;
- 28 assignments: four controls and four sample groups with six replicates each;
- deterministic layout generation that avoids the outer ring;
- human lock/unlock interaction for occupied wells;
- human block/unblock interaction for wells;
- immediate validation and visible violation states;
- deterministic reflow that preserves locks and avoids blocked wells;
- exactly three static imperative WebMCP tools;
- compact, JSON-serializable tool results and operation receipts;
- responsive, accessible single-page interface;
- local use and public HTTPS deployment;
- automated domain and WebMCP registration tests;
- public documentation, security notes, and a sub-three-minute demo.

### Explicitly out of scope

- a general laboratory information management system;
- production or clinical laboratory use;
- real liquid-handler integrations;
- arbitrary experiment/protocol creation;
- scientific optimization claims;
- accounts, authentication, teams, or persistence;
- backend services, databases, uploads, or external APIs;
- embedded LLM or chat interface;
- multi-user or multi-agent collaboration;
- export as part of the hero flow;
- dynamic tool registration, dynamic schemas, declarative WebMCP, or iframe tools;
- additional WebMCP tools before the competition submission.

## 8. Functional requirements

### FR-1: Experiment brief

The page must present a fixed, understandable brief with plate format, experiment count, controls, groups, replicates, and policy. The scientific scenario is representative and must be labeled as a demonstration rather than validated laboratory guidance.

### FR-2: Layout generation

- Generation places every experiment exactly once in an inner well.
- It clears prior locks and blocks.
- Placement order and tie-breaking are deterministic.
- Generation and validation occur atomically.
- The resulting layout starts with zero violations.

### FR-3: Human edits

- In **Lock** mode, selecting an occupied well protects its current experiment assignment.
- Selecting a locked well again unlocks it.
- In **Block** mode, selecting a well marks it unavailable.
- A locked well cannot be blocked.
- Blocking an occupied well immediately creates a visible violation.
- Every accepted edit increments the state revision and reruns validation.

### FR-4: Validation

The validator must be pure and run after every mutation. It must detect:

- empty layout;
- unknown wells;
- unknown experiments;
- occupied blocked wells;
- assignments on the bias-prone outer ring;
- duplicate experiments;
- missing experiments;
- broken locked assignments;
- insufficient capacity to place every required experiment.

The UI and tool receipts must never describe a layout as valid when any invariant is violated.

### FR-5: Reflow

- Reflow reads the state that exists at execution time.
- Every valid locked assignment remains in its exact well.
- Blocked wells are empty after a successful reflow.
- Every required experiment appears exactly once.
- The result avoids the outer ring.
- Reflow and validation occur atomically.
- Repeating reflow on an already-valid plate is an idempotent no-op.
- If constraints are unsatisfiable, reflow fails closed: it preserves the existing assignments and locks, reports `insufficient_capacity`, and does not claim success.

### FR-6: WebMCP tool surface

The top-level page registers these tools once through `document.modelContext.registerTool()`:

| Tool | Mutation | Contract |
|---|---:|---|
| `wellset_inspect_plate` | No | Returns the current brief, assignments, locks, blocks, revision, and violations |
| `wellset_generate_layout` | Yes | Replaces the layout, clears human edits, validates, and returns a receipt plus snapshot |
| `wellset_reflow_unlocked` | Yes | Preserves locks, reflows unlocked experiments, validates, and returns a compact receipt; use inspect for the complete current snapshot |

All three tools use a closed empty-object input schema with `additionalProperties: false`. Handlers must also validate inputs at runtime. Only the inspect tool may carry `readOnlyHint: true`.

Tool names, descriptions, and schemas remain static for the page lifecycle. Current well IDs, locks, or state must never be embedded in a regenerated schema or description.

### FR-7: Operation receipts

A mutation receipt must contain enough information to verify the action without trusting descriptive prose. As applicable, it includes:

- operation;
- previous revision and resulting revision;
- moved experiments with source and destination wells;
- preserved locked wells;
- previous and resulting violation counts;
- validity;
- no-op status and reason.

Receipts and snapshots must be detached, compact, and JSON serializable.

### FR-8: WebMCP availability

- When supported and registered, the UI reports that three site tools are registered.
- When unsupported, the application reports WebMCP as unavailable without breaking human controls.
- Registration failure is visible and does not corrupt plate state.
- Repeated application initialization must not register duplicate tools.

## 9. Required interface states

| State | Required visible evidence |
|---|---|
| Empty | Plate awaiting layout; generation action; WebMCP status |
| Generated | 28 occupied wells; 0 violations; operation receipt |
| Human-constrained | lock markers; blocked cells; exactly countable red violations |
| Agent-resolved | 0 violations; locks preserved; moved-well highlight; reflow receipt |
| No-op | no movement required; unchanged revision or explicit idempotent receipt |
| Unsatisfiable | failure reason; unchanged assignments and locks; invalid state clearly reported |
| WebMCP unavailable | normal human functionality plus honest compatibility status |

## 10. UX and visual requirements

- The domain explanation must be understood without narration.
- Violations must use more than color alone where practical and remain countable.
- Locked, blocked, control, moved, and invalid states must be visually distinguishable.
- The plate, validation count, and operation receipt must fit comfortably in a desktop recording frame.
- Human controls must have labels, pressed states, focus states, and useful accessible names.
- Animation may clarify movement but must not introduce timing-dependent state or obscure validation.
- The interface should feel like a focused scientific instrument, not a generic AI dashboard.
- No chat panel should be embedded in the product; the browser agent is the agent interface.

## 11. Architecture requirements

- Browser-native single-page application using ES modules.
- One external store owns all live plate state and publishes updates.
- Pure domain functions own generation, validation, locking, blocking, and reflow.
- UI actions and tool handlers call the same store operations.
- Tool handlers retrieve current state when executed; they must not capture stale render state.
- Static singleton WebMCP registration guards against duplicate-name failures.
- No runtime dependencies unless an essential requirement cannot be met with platform APIs.
- No backend, remote content, iframe, navigation dependency, or embedded model call.

## 12. Trust and security requirements

The competition build treats the browser agent and every tool input as untrusted.

- Validate tool payloads independently of the declared schema.
- Enforce all invariants inside domain logic.
- Mutation tools expose no arbitrary code, URL, selector, HTML, or free-text execution surface.
- Tool results contain data, not DOM objects or executable content.
- Do not load third-party scripts or remote data into the page.
- Do not collect, upload, or persist user or laboratory data.
- Do not request credentials or browser permissions.
- Mutation annotations must accurately reflect side effects.
- Browser-level safety review and confirmation remain outside the application's control and must not be misrepresented.
- Document that the project is not validated for clinical or production laboratory use.

## 13. Reliability and test requirements

The verification suite must cover:

- deterministic valid generation;
- human edits and revision behavior;
- at least 100 deterministic lock/block/reflow combinations;
- locked assignments never moving;
- blocked wells empty after successful reflow;
- unique and complete occupancy;
- validator and receipt agreement;
- idempotent valid reflow;
- insufficient-capacity fail-closed behavior and recovery;
- malformed tool inputs;
- exactly three static registrations;
- repeated registration and remount behavior;
- detached JSON-serializable snapshots and receipts;
- syntax/build verification.

No invariant may be weakened to make a test pass. Every behavioral defect requires a regression test.

## 14. Browser acceptance test

The competition release is not accepted until the following succeeds on the public HTTPS deployment:

1. Open WellSet in ChatGPT desktop's built-in browser with Site Tools enabled.
2. Confirm all three WellSet tools appear under available site tools.
3. Ask the agent to generate the plate and observe a real tool invocation.
4. Lock two occupied controls through the UI.
5. Block two occupied inner sample wells and confirm two visible violations.
6. Ask the hero prompt.
7. Confirm ChatGPT invokes `wellset_reflow_unlocked` once.
8. Confirm 0 violations, preserved control positions, moved samples, and a matching receipt.
9. Repeat the complete flow ten times from reset with no invariant breach.

Target reliability is at least 8/10 correct autonomous tool selections and 10/10 correct application-state transitions. If discovery or execution fails, fixing the supported WebMCP path takes priority over visual polish.

## 15. Demo contract

The final video must be under three minutes and primarily show the live product.

### Required narrative

1. **Problem:** automated layouts miss local constraints; manual repair is tedious.
2. **Shared artifact:** show the generated plate and the one-line domain explanation.
3. **Human judgment:** lock two controls and block two occupied wells.
4. **Visible tension:** pause briefly on the two red violations.
5. **Agent precision:** ask the hero prompt and visibly show the Site Tools call.
6. **Payoff:** show movement, unchanged controls, `2 → 0`, and the receipt.
7. **Meaning:** explain that the human's edits became operative constraints in the agent's next semantic action.

The core interaction should be legible within the first 30 seconds. Architecture explanation should follow the payoff, not delay it.

## 16. Definition of done

WellSet is competition-ready only when all of the following are true:

- the complete hero flow works on the public HTTPS deployment;
- the ChatGPT Site Tools invocation is visible and recordable;
- every required domain invariant is enforced and tested;
- the unsatisfiable case fails closed;
- the interface explains itself to a non-scientist;
- the layout is usable at the intended recording resolution;
- automated verification and repository checks pass from a clean clone;
- README, PRD, engineering standard, architecture, security, contribution, license, tool map, sample prompts, limitations, and setup instructions agree with the implementation;
- screenshots or a short GIF show the human intervention and resolved state;
- the repository contains no secrets, unrelated proprietary work, dead dependencies, or misleading claims;
- the demo video and submission copy use the same product thesis and terminology.

## 17. Change-control rule

This PRD freezes the product surface for the competition release. A proposed change is accepted only if it materially improves one of these priorities without risking a higher one:

1. actual WebMCP discovery and execution;
2. hero-flow reliability;
3. immediate comprehension;
4. visible payoff and polish;
5. repository and submission quality.

New scenarios, tools, integrations, persistence, accounts, and generalized laboratory functionality are rejected until after submission.
