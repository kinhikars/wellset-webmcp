export const ROWS = Object.freeze(["A", "B", "C", "D", "E", "F", "G", "H"]);
export const COLUMNS = Object.freeze(Array.from({ length: 12 }, (_, index) => index + 1));
export const ALL_WELLS = Object.freeze(ROWS.flatMap((row) => COLUMNS.map((column) => `${row}${column}`)));
export const INNER_WELLS = Object.freeze(
  ROWS.slice(1, -1).flatMap((row) => COLUMNS.slice(1, -1).map((column) => `${row}${column}`)),
);

const CONTROL_NAMES = ["Negative control 1", "Negative control 2", "Positive control 1", "Positive control 2"];
const SAMPLE_GROUPS = ["Baseline", "Compound A", "Compound B", "Compound C"];

export const EXPERIMENTS = Object.freeze([
  ...CONTROL_NAMES.map((label, index) => ({ id: `control-${index + 1}`, label, kind: "control", group: "Controls", replicate: index + 1 })),
  ...SAMPLE_GROUPS.flatMap((group, groupIndex) =>
    Array.from({ length: 6 }, (_, index) => ({
      id: `sample-${groupIndex + 1}-${index + 1}`,
      label: `${group} · R${index + 1}`,
      kind: "sample",
      group,
      replicate: index + 1,
    })),
  ),
]);

export const EXPERIMENT_BY_ID = new Map(EXPERIMENTS.map((experiment) => [experiment.id, experiment]));

export function isOuterWell(wellId) {
  const row = wellId[0];
  const column = Number(wellId.slice(1));
  return row === "A" || row === "H" || column === 1 || column === 12;
}

export function createEmptyState() {
  return {
    revision: 0,
    assignments: {},
    lockedWells: [],
    blockedWells: [],
    baselineLocks: {},
    validation: { valid: false, violations: [{ code: "layout_empty", message: "Generate a layout to begin." }] },
    lastReceipt: null,
    lastMovedWells: [],
  };
}

export function evaluateLayout(state) {
  const violations = [];
  const seenExperiments = new Map();

  for (const [wellId, experimentId] of Object.entries(state.assignments)) {
    if (!ALL_WELLS.includes(wellId)) {
      violations.push({ code: "unknown_well", wellId, message: `${wellId} is not part of this plate.` });
    }
    if (!EXPERIMENT_BY_ID.has(experimentId)) {
      violations.push({ code: "unknown_experiment", wellId, experimentId, message: `${experimentId} is not in the experiment brief.` });
    }
    if (state.blockedWells.includes(wellId)) {
      violations.push({ code: "blocked_occupied", wellId, experimentId, message: `${wellId} is blocked but still occupied.` });
    }
    if (isOuterWell(wellId)) {
      violations.push({ code: "edge_bias", wellId, experimentId, message: `${wellId} is on the bias-prone outer ring.` });
    }
    const previousWell = seenExperiments.get(experimentId);
    if (previousWell) {
      violations.push({ code: "duplicate_experiment", wellId, experimentId, message: `${experimentId} appears in ${previousWell} and ${wellId}.` });
    } else {
      seenExperiments.set(experimentId, wellId);
    }
  }

  for (const experiment of EXPERIMENTS) {
    if (!seenExperiments.has(experiment.id)) {
      violations.push({ code: "missing_experiment", experimentId: experiment.id, message: `${experiment.label} is missing.` });
    }
  }

  for (const wellId of state.lockedWells) {
    const expectedExperiment = state.baselineLocks[wellId];
    if (!expectedExperiment || state.assignments[wellId] !== expectedExperiment) {
      violations.push({ code: "lock_broken", wellId, experimentId: expectedExperiment, message: `The protected assignment at ${wellId} moved.` });
    }
  }

  const lockedExperimentIds = new Set(state.lockedWells.filter((wellId) => state.assignments[wellId]).map((wellId) => state.assignments[wellId]));
  const availableWells = INNER_WELLS.filter(
    (wellId) => !state.blockedWells.includes(wellId) && !state.lockedWells.includes(wellId),
  ).length;
  const unlockedExperiments = EXPERIMENTS.filter((experiment) => !lockedExperimentIds.has(experiment.id)).length;
  if (availableWells < unlockedExperiments) {
    violations.push({ code: "insufficient_capacity", message: `Insufficient capacity: ${availableWells} available wells cannot accommodate ${unlockedExperiments} unlocked experiments.` });
  }

  return { valid: violations.length === 0, violations };
}

function finalize(previous, changes, receipt) {
  const candidate = {
    ...previous,
    ...changes,
    revision: previous.revision + 1,
    lastReceipt: receipt,
  };
  candidate.validation = evaluateLayout(candidate);
  candidate.lastReceipt = {
    ...receipt,
    previousRevision: previous.revision,
    revision: candidate.revision,
    violationCount: candidate.validation.violations.length,
    valid: candidate.validation.valid,
  };
  return candidate;
}

export function generateLayout(previous = createEmptyState()) {
  const assignments = Object.fromEntries(EXPERIMENTS.map((experiment, index) => [INNER_WELLS[index], experiment.id]));
  return finalize(previous, {
    assignments,
    lockedWells: [],
    blockedWells: [],
    baselineLocks: {},
    lastMovedWells: [],
  }, { operation: "generate_layout", assignedCount: EXPERIMENTS.length, movedWells: [], preservedLocks: [] });
}

export function toggleLock(previous, wellId) {
  if (!previous.assignments[wellId]) return previous;
  const isLocked = previous.lockedWells.includes(wellId);
  const lockedWells = isLocked
    ? previous.lockedWells.filter((id) => id !== wellId)
    : [...previous.lockedWells, wellId].sort();
  const baselineLocks = { ...previous.baselineLocks };
  if (isLocked) delete baselineLocks[wellId];
  else baselineLocks[wellId] = previous.assignments[wellId];
  return finalize(previous, { lockedWells, baselineLocks, lastMovedWells: [] }, {
    operation: isLocked ? "unlock_well" : "lock_well",
    wellId,
    movedWells: [],
    preservedLocks: lockedWells,
  });
}

export function toggleBlock(previous, wellId) {
  if (previous.lockedWells.includes(wellId)) return previous;
  const blockedWells = previous.blockedWells.includes(wellId)
    ? previous.blockedWells.filter((id) => id !== wellId)
    : [...previous.blockedWells, wellId].sort();
  return finalize(previous, { blockedWells, lastMovedWells: [] }, {
    operation: blockedWells.includes(wellId) ? "block_well" : "unblock_well",
    wellId,
    movedWells: [],
    preservedLocks: previous.lockedWells,
  });
}

export function reflowUnlocked(previous) {
  if (Object.keys(previous.assignments).length === 0) {
    return finalize(previous, { lastMovedWells: [] }, {
      operation: "reflow_unlocked",
      noOp: true,
      reason: "layout_empty",
      movedWells: [],
      preservedLocks: previous.lockedWells,
    });
  }

  const lockedAssignments = Object.fromEntries(
    previous.lockedWells
      .filter((wellId) => previous.assignments[wellId])
      .map((wellId) => [wellId, previous.assignments[wellId]]),
  );
  const lockedExperimentIds = new Set(Object.values(lockedAssignments));
  const availableWells = INNER_WELLS.filter(
    (wellId) => !previous.blockedWells.includes(wellId) && !previous.lockedWells.includes(wellId),
  );
  const unlockedExperiments = EXPERIMENTS.filter((experiment) => !lockedExperimentIds.has(experiment.id));

  if (availableWells.length < unlockedExperiments.length) {
    return finalize(previous, { lastMovedWells: [] }, {
      operation: "reflow_unlocked",
      noOp: true,
      reason: "insufficient_capacity",
      movedWells: [],
      preservedLocks: previous.lockedWells,
    });
  }

  const assignments = { ...lockedAssignments };
  unlockedExperiments.forEach((experiment, index) => {
    assignments[availableWells[index]] = experiment.id;
  });

  const previousLocation = new Map(Object.entries(previous.assignments).map(([wellId, experimentId]) => [experimentId, wellId]));
  const movedWells = Object.entries(assignments)
    .map(([to, experimentId]) => ({ experimentId, from: previousLocation.get(experimentId) ?? null, to }))
    .filter((move) => move.from !== move.to);

  if (movedWells.length === 0 && previous.validation.valid) {
    return {
      ...previous,
      lastMovedWells: [],
      lastReceipt: {
        operation: "reflow_unlocked",
        previousRevision: previous.revision,
        revision: previous.revision,
        movedWells: [],
        preservedLocks: previous.lockedWells,
        previousViolationCount: previous.validation.violations.length,
        violationCount: 0,
        valid: true,
        noOp: true,
      },
    };
  }

  return finalize(previous, { assignments, lastMovedWells: movedWells.map((move) => move.to) }, {
    operation: "reflow_unlocked",
    movedWells,
    preservedLocks: previous.lockedWells,
    previousViolationCount: previous.validation.violations.length,
    noOp: false,
  });
}

export function snapshot(state) {
  return structuredClone({
    revision: state.revision,
    brief: {
      format: "96-well plate",
      experiments: EXPERIMENTS.length,
      controls: CONTROL_NAMES.length,
      groups: SAMPLE_GROUPS,
      replicatesPerGroup: 6,
      policy: "Avoid the outer ring; preserve human-locked wells; leave blocked wells empty.",
    },
    assignments: state.assignments,
    lockedWells: state.lockedWells,
    blockedWells: state.blockedWells,
    violationCount: state.validation.violations.length,
    violations: state.validation.violations,
    valid: state.validation.valid,
  });
}
