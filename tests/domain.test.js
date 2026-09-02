import test from "node:test";
import assert from "node:assert/strict";
import {
  EXPERIMENTS,
  INNER_WELLS,
  createEmptyState,
  evaluateLayout,
  generateLayout,
  reflowUnlocked,
  snapshot,
  toggleBlock,
  toggleLock,
} from "../src/domain.js";

test("generation is deterministic and valid", () => {
  const first = generateLayout(createEmptyState());
  const second = generateLayout(createEmptyState());
  assert.deepEqual(first.assignments, second.assignments);
  assert.equal(first.validation.valid, true);
  assert.equal(Object.keys(first.assignments).length, EXPERIMENTS.length);
});

test("human edits are versioned and create visible violations", () => {
  let state = generateLayout(createEmptyState());
  const occupiedWell = INNER_WELLS[7];
  const revision = state.revision;
  state = toggleBlock(state, occupiedWell);
  assert.equal(state.revision, revision + 1);
  assert.equal(state.validation.valid, false);
  assert.ok(state.validation.violations.some((violation) => violation.code === "blocked_occupied" && violation.wellId === occupiedWell));
});

test("reflow is idempotent when the plate is already valid", () => {
  const valid = generateLayout(createEmptyState());
  const reflowed = reflowUnlocked(valid);
  assert.equal(reflowed.revision, valid.revision);
  assert.equal(reflowed.lastReceipt.noOp, true);
  assert.deepEqual(reflowed.assignments, valid.assignments);
});

test("120 deterministic lock/block/reflow scenarios preserve every invariant", async (suite) => {
  for (let index = 0; index < 120; index += 1) {
    await suite.test(`scenario ${String(index + 1).padStart(3, "0")}`, () => {
      let state = generateLayout(createEmptyState());
      const lockA = INNER_WELLS[index % 4];
      const lockB = INNER_WELLS[(index + 1) % 4];
      state = toggleLock(state, lockA);
      state = toggleLock(state, lockB);

      const blockA = INNER_WELLS[4 + (index % 18)];
      const blockB = INNER_WELLS[4 + ((index + 7) % 18)];
      state = toggleBlock(state, blockA);
      state = toggleBlock(state, blockB);
      assert.equal(state.validation.valid, false);

      const lockedBefore = Object.fromEntries(state.lockedWells.map((wellId) => [wellId, state.assignments[wellId]]));
      const reflowed = reflowUnlocked(state);
      const freshValidation = evaluateLayout(reflowed);
      const experimentIds = Object.values(reflowed.assignments);

      assert.equal(reflowed.validation.valid, true);
      assert.deepEqual(reflowed.validation, freshValidation);
      assert.equal(new Set(experimentIds).size, experimentIds.length);
      assert.equal(experimentIds.length, EXPERIMENTS.length);
      assert.ok(EXPERIMENTS.every((experiment) => experimentIds.includes(experiment.id)));
      assert.ok(reflowed.blockedWells.every((wellId) => reflowed.assignments[wellId] === undefined));
      assert.ok(Object.entries(lockedBefore).every(([wellId, experimentId]) => reflowed.assignments[wellId] === experimentId));

      const duplicateCall = reflowUnlocked(reflowed);
      assert.equal(duplicateCall.lastReceipt.noOp, true);
      assert.deepEqual(duplicateCall.assignments, reflowed.assignments);
    });
  }
});

test("snapshots are JSON serializable and detached", () => {
  const state = generateLayout(createEmptyState());
  const result = snapshot(state);
  assert.doesNotThrow(() => JSON.stringify(result));
  result.assignments.B2 = "tampered";
  assert.notEqual(state.assignments.B2, "tampered");
});
