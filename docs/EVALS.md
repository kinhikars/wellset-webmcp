# WellSet evaluation report

**Evaluated release:** `d3d05d51c658c1eda5c5eff3c7373e16197317f8`  
**Production surface:** <https://wellset-webmcp.vercel.app/>  
**Evaluation date:** 3 September 2026  
**Client/model:** ChatGPT Work, GPT-5.6 Terra Light

## Executive summary

WellSet was evaluated at two complementary levels:

1. **Automated implementation verification:** GitHub Actions passed with **136/136 tests**, including domain invariants, closed tool contracts, compact JSON-serializable receipts, registration cleanup and retry behavior, and duplicate-registration safety. The largest measured serialized reflow receipt was **810 characters**.
2. **Real-agent acceptance evaluation:** five independent, fresh ChatGPT Site Tools sessions exercised the canonical human-to-agent workflow against the public deployment.

Across the five observed agent trials:

- all three WellSet tools were discovered in **5/5** sessions;
- ChatGPT selected `wellset_reflow_unlocked` from a natural-language request that did not name a tool in **5/5** sessions;
- locked controls B2 and B3 remained fixed in **5/5** executions;
- the valid scenario reached zero violations in **5/5** executions;
- the structured receipt agreed with the visible application state in **5/5** executions.

Median agent completion time was **38 seconds** (range: **26–46 seconds**).

These results describe the five trials actually performed. The project's original ten-trial target was not completed for this release evaluation, so this report does **not** claim that the ten-trial threshold passed. A separate diagnostic smoke test performed before the official evaluation is excluded from all results below.

## What this evaluation measures

WellSet deliberately separates two kinds of behavior:

- The **agent boundary is variable**: ChatGPT must discover the tools, interpret the request, select an operation, and decide whether inspection is useful.
- The **application boundary is deterministic**: given the same valid state, WellSet must preserve human locks, empty blocked wells, compute the same reflow, validate it, and emit a matching receipt.

Repeated canonical trials therefore test real agent discovery and orchestration while the automated suite tests the deterministic safety boundary more deeply.

## Canonical trial protocol

Every counted trial used a fresh ChatGPT conversation and the same public release.

### Setup

1. Open the production WellSet page in ChatGPT's built-in browser.
2. Reset the workspace.
3. Generate the deterministic 28-experiment layout.
4. Lock controls B2 and B3.
5. Block occupied sample wells B6 and B7.
6. Confirm exactly two visible `blocked_occupied` violations.
7. Submit the canonical request without naming a tool:

> Reflow this plate around my blocked wells without moving the locked controls.

### Recorded fields

Each trial recorded:

- model;
- whether all three tools were discovered;
- whether the correct mutation tool was selected autonomously;
- explicit Site Tools calls;
- preservation of B2 and B3;
- violations before and after;
- agreement between tool receipt and visible UI;
- completion time;
- unusual or failure behavior.

A “tool call” below counts explicit website-tool discovery operations and registered WellSet tool executions shown in ChatGPT's trace. Narration and passive page inspection are not counted.

## Trial results

| Trial | Model | All 3 discovered | Correct autonomous selection | Tool calls | Locks preserved | Violations | Receipt matched UI | Time | Failure or unusual behavior |
|---:|---|:---:|:---:|---|:---:|:---:|:---:|---:|---|
| 1 | GPT-5.6 Terra Light | Yes | Yes | 4: 2 discovery + 2 WellSet | Yes: B2, B3 | 2 → 0 | Yes | 38 s | Re-listed tools and inspected after reflow; no harmful effect |
| 2 | GPT-5.6 Terra Light | Yes | Yes | 4: 1 discovery + 3 WellSet | Yes: B2, B3 | 2 → 0 | Yes | 46 s | Inspected before and after reflow; no harmful effect |
| 3 | GPT-5.6 Terra Light | Yes | Yes | 3: 1 discovery + 2 WellSet | Yes: B2, B3 | 2 → 0 | Yes | 43 s | None |
| 4 | GPT-5.6 Terra Light | Yes | Yes | 2: 1 discovery + 1 WellSet | Yes: B2, B3 | 2 → 0 | Yes | 27 s | None |
| 5 | GPT-5.6 Terra Light | Yes | Yes | 2: 1 discovery + 1 WellSet | Yes: B2, B3 | 2 → 0 | Yes | 26 s | None |

## Aggregate results

| Metric | Observed result |
|---|---:|
| Tool discovery | 5/5 (100%) |
| Correct autonomous selection | 5/5 (100%) |
| Locked controls preserved | 5/5 executed trials (100%) |
| Valid scenarios reaching zero violations | 5/5 executed trials (100%) |
| Receipt matching visible UI | 5/5 executed trials (100%) |
| Median completion time | 38 s |
| Mean completion time | 36 s |
| Completion-time range | 26–46 s |
| Total explicit tool operations | 15 |
| Registered WellSet tool executions | 9 |
| Discovery operations | 6 |

The variation in call count is agent orchestration behavior, not application nondeterminism. Some runs inspected state before or after mutation; the two most direct runs discovered the tools and invoked reflow once.

## Receipt and state evidence

The canonical successful receipt reported:

- operation: `reflow_unlocked`;
- status: `success`;
- 24 unlocked assignments moved;
- locked wells B2 and B3 preserved;
- violations reduced from 2 to 0;
- resulting state valid;
- revision advanced exactly once.

The UI independently showed B6 and B7 empty, B2 and B3 still locked, 24 wells moved, two locks preserved, zero violations, and all constraints satisfied.

## Interpretation and limitations

This is meaningful acceptance evidence for the exact challenge hero flow in the real ChatGPT Site Tools environment. It is not a claim of exhaustive agent reliability.

Limitations:

- sample size is five, not the originally planned ten;
- all runs used one model and one canonical prompt;
- all runs used one lock/block arrangement;
- completion time is client-observed wall-clock time;
- the evaluation does not establish laboratory, clinical, or scientific validity.

The strongest safety evidence remains the deterministic application boundary and its automated invariant and contract tests. The live trials establish that a real browser agent can discover and use that boundary successfully.

## Proposed maintainers' evaluation framework

The next evaluation system should preserve a small deterministic oracle while expanding agent and scenario coverage.

### 1. Evaluation layers

| Layer | Purpose | Execution |
|---|---|---|
| Domain invariants | Prove placement, lock, block, atomicity, validation, and idempotency behavior | Every pull request |
| WebMCP contracts | Prove closed schemas, compact receipts, current-state handlers, transactional registration, cleanup, and retry safety | Every pull request |
| Browser acceptance | Prove visible state transitions, accessibility, and progressive enhancement | Every release |
| Real-agent reliability | Measure discovery, tool selection, orchestration, latency, and end-state correctness | Release candidate and scheduled runs |
| Adversarial scenarios | Prove fail-closed behavior under invalid, conflicting, or unsatisfiable states | Every release |

### 2. Scenario matrix

Maintain versioned scenarios covering:

- canonical B2/B3 locks with B6/B7 blocks;
- alternative valid lock/block arrangements;
- already-valid reflow producing an idempotent no-op;
- unsatisfiable capacity producing structured failure and no partial mutation;
- conflicting human constraints;
- stale or repeated requests;
- malformed inputs and unexpected properties;
- registration partial failure, cleanup, retry, and remount;
- duplicate-registration attempts;
- receipt-size boundary cases.

### 3. Prompt suite

For each successful scenario, evaluate:

- the canonical prompt;
- concise paraphrases;
- colloquial requests;
- underspecified but recoverable requests;
- prompts that should cause inspection before mutation;
- prompts that should not cause any mutation.

Prompts, expected tool classes, and allowed call sequences should be version-controlled. Tool names must not appear in autonomous-selection prompts.

### 4. Model and client matrix

Report results separately for each supported model and client version. Never pool models into one success rate without also showing per-model results.

A future release evaluation should target at least:

- 20–30 fresh canonical trials per supported model;
- multiple prompt variants;
- multiple constraint arrangements;
- a fixed timeout and retry policy.

### 5. Deterministic grading

Use application state as the oracle. A run passes only when machine-readable evidence confirms:

- the expected tools were registered;
- the selected operation was allowed for the prompt;
- every locked assignment stayed in its original well;
- every blocked well was empty after successful reflow;
- `evaluateLayout()` returned the expected validity;
- receipt revisions and movement evidence matched before/after state;
- failure paths made no partial state change.

An LLM grader may classify qualitative explanations, but it must never decide domain validity or safety.

### 6. Machine-readable evidence

Store one JSON Lines record per run with:

- evaluation-suite version;
- release commit and deployment URL;
- UTC timestamp;
- model and client version;
- scenario and prompt identifiers;
- discovered tool names;
- ordered tool-call trace;
- detached before/after state hashes;
- receipt;
- deterministic assertion results;
- latency, retries, and failure classification;
- optional screenshot or trace reference.

Generate the Markdown summary from these records to prevent manual transcription drift.

### 7. Metrics and gates

Track:

- discovery rate;
- correct autonomous-selection rate;
- execution success rate;
- lock-preservation rate;
- constraint-resolution rate;
- receipt-integrity rate;
- unnecessary-call and retry rates;
- p50 and p95 completion latency;
- failure categories by model, prompt, and scenario.

Safety and receipt-integrity gates should remain **100%**. Agent-selection targets should be declared before testing and accompanied by sample size and confidence intervals.

### 8. Failure handling

Retain every failed run. Do not silently rerun or replace it. Classify failures as:

- discovery;
- selection;
- execution;
- stale state;
- invariant violation;
- receipt mismatch;
- timeout;
- client/platform failure;
- evaluator ambiguity.

Every product defect should become a deterministic regression test before release. Platform or model failures should remain visible in the agent-evaluation history.

## Reproducing the current evaluation

1. Deploy or open the exact evaluated release commit.
2. Use a supported ChatGPT client with Site Tools enabled.
3. Start a fresh conversation for every trial.
4. Follow the canonical setup and use the exact prompt above.
5. Preserve the expanded tool trace and before/after UI evidence.
6. Report all runs, including failures, with the release, model, date, and denominator.

---

WellSet is a challenge demonstration and is not validated for clinical or production laboratory use.
