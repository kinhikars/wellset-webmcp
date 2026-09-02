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

test("insufficient capacity fails closed with formal violation", () => {
  let state = generateLayout(createEmptyState());
  const innerCount = INNER_WELLS.length;
  for (let i = 0; i < innerCount - 1; i += 1) {
    state = toggleBlock(state, INNER_WELLS[i]);
  }
  const reflowed = reflowUnlocked(state);
  assert.equal(reflowed.validation.valid, false);
  assert.ok(reflowed.validation.violations.some((v) => v.code === "insufficient_capacity"));
  assert.equal(reflowed.lastReceipt.noOp, true);
  assert.equal(reflowed.lastReceipt.reason, "insufficient_capacity");
  assert.deepEqual(reflowed.assignments, state.assignments);
});

test("evaluateLayout detects insufficient capacity directly", () => {
  let state = generateLayout(createEmptyState());
  const innerCount = INNER_WELLS.length;
  for (let i = 0; i < innerCount - 1; i += 1) {
    state = toggleBlock(state, INNER_WELLS[i]);
  }
  const validation = evaluateLayout(state);
  assert.equal(validation.valid, false);
  assert.ok(validation.violations.some((v) => v.code === "insufficient_capacity"));
});

test("insufficient_capacity violation survives state recomputation", () => {
  let state = generateLayout(createEmptyState());
  const innerCount = INNER_WELLS.length;
  for (let i = 0; i < innerCount - 1; i += 1) {
    state = toggleBlock(state, INNER_WELLS[i]);
  }
  const reflowed = reflowUnlocked(state);
  const recomputed = evaluateLayout(reflowed);
  assert.ok(recomputed.violations.some((v) => v.code === "insufficient_capacity"));
  assert.equal(recomputed.valid, false);
  assert.deepEqual(reflowed.validation, recomputed);
});

test("recovery continues from failed-reflow state", () => {
  let state = generateLayout(createEmptyState());
  const innerCount = INNER_WELLS.length;
  for (let i = 0; i < innerCount - 1; i += 1) {
    state = toggleBlock(state, INNER_WELLS[i]);
  }
  const blocked = reflowUnlocked(state);
  assert.equal(blocked.validation.valid, false);
  assert.ok(blocked.validation.violations.some((v) => v.code === "insufficient_capacity"));
  for (let i = 0; i < innerCount - 1; i += 1) {
    state = toggleBlock(state, INNER_WELLS[i]);
  }
  const recovered = reflowUnlocked(state);
  assert.equal(recovered.validation.valid, true);
  assert.ok(EXPERIMENTS.every((e) => Object.values(recovered.assignments).includes(e.id)));
});

test("locked wells never move during failed reflow", () => {
  let state = generateLayout(createEmptyState());
  const lockWell = INNER_WELLS[0];
  const lockedExperiment = state.assignments[lockWell];
  state = toggleLock(state, lockWell);
  for (let i = 0; i < INNER_WELLS.length - 1; i += 1) {
    if (INNER_WELLS[i] !== lockWell) state = toggleBlock(state, INNER_WELLS[i]);
  }
  const reflowed = reflowUnlocked(state);
  assert.equal(reflowed.validation.valid, false);
  assert.equal(reflowed.assignments[lockWell], lockedExperiment);
  assert.deepEqual(reflowed.lockedWells, state.lockedWells);
});

test("snapshots are JSON serializable and detached", () => {
  const state = generateLayout(createEmptyState());
  const result = snapshot(state);
  assert.doesNotThrow(() => JSON.stringify(result));
  result.assignments.B2 = "tampered";
  assert.notEqual(state.assignments.B2, "tampered");
});
