import { snapshot } from "./domain.js";
import { plateStore } from "./store.js";

const REGISTRATION_KEY = Symbol.for("wellset.webmcp.registration");
const emptySchema = Object.freeze({ type: "object", properties: {}, additionalProperties: false });

function receiptWithSnapshot(receipt) {
  return { receipt: structuredClone(receipt), state: snapshot(plateStore.getState()) };
}

function compactReflowResult(previous, next) {
  const receipt = next.lastReceipt;
  const failed = !next.validation.valid;
  const status = failed ? "failure" : receipt.noOp ? "no_op" : "success";
  const result = {
    operation: receipt.operation,
    status,
    revisions: { before: previous.revision, after: next.revision },
    moved: {
      count: receipt.movedWells.length,
      wells: receipt.movedWells.map(({ from, to }) => [from, to]),
    },
    preservedLockedWells: [...receipt.preservedLocks],
    violations: {
      before: previous.validation.violations.length,
      after: next.validation.violations.length,
    },
    valid: next.validation.valid,
  };

  if (failed) {
    result.error = {
      code: receipt.reason ?? "validation_failed",
      violationCodes: [...new Set(next.validation.violations.map(({ code }) => code))],
    };
  }

  return result;
}

export function getWebMCPStatus() {
  if (typeof document === "undefined" || typeof document.modelContext?.registerTool !== "function") {
    return { supported: false, registered: false, label: "WebMCP unavailable" };
  }
  return {
    supported: true,
    registered: Boolean(globalThis[REGISTRATION_KEY]),
    label: globalThis[REGISTRATION_KEY] ? "3 site tools registered" : "WebMCP supported",
  };
}

export async function registerWebMCPTools() {
  if (typeof document === "undefined" || typeof document.modelContext?.registerTool !== "function") {
    return getWebMCPStatus();
  }
  if (globalThis[REGISTRATION_KEY]) return globalThis[REGISTRATION_KEY];

  const lifecycle = new AbortController();
  globalThis[REGISTRATION_KEY] = (async () => {
    await document.modelContext.registerTool({
      name: "wellset_inspect_plate",
      description: "Inspect the current WellSet experiment plate, including assignments, human locks, blocked wells, revision, and validation violations. This tool never changes the plate.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true },
      execute: async (input = {}) => {
        if (input === null || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length > 0) {
          throw new TypeError("wellset_inspect_plate accepts an empty object only.");
        }
        return snapshot(plateStore.getState());
      },
    }, { signal: lifecycle.signal });

    await document.modelContext.registerTool({
      name: "wellset_generate_layout",
      description: "Generate a deterministic, validated layout for the current WellSet experiment brief. This replaces the current layout and clears existing locks and blocks.",
      inputSchema: emptySchema,
      execute: async (input = {}) => {
        if (input === null || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length > 0) {
          throw new TypeError("wellset_generate_layout accepts an empty object only.");
        }
        const next = plateStore.generate();
        return receiptWithSnapshot(next.lastReceipt);
      },
    }, { signal: lifecycle.signal });

    await document.modelContext.registerTool({
      name: "wellset_reflow_unlocked",
      description: "Reflow the current WellSet plate around human-blocked wells without moving human-locked assignments. The operation validates the result atomically and is an idempotent no-op when no movement is required.",
      inputSchema: emptySchema,
      execute: async (input = {}) => {
        if (input === null || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length > 0) {
          throw new TypeError("wellset_reflow_unlocked accepts an empty object only.");
        }
        const previous = plateStore.getState();
        const next = plateStore.reflow();
        return compactReflowResult(previous, next);
      },
    }, { signal: lifecycle.signal });

    return { supported: true, registered: true, label: "3 site tools registered" };
  })().catch((error) => {
    lifecycle.abort();
    delete globalThis[REGISTRATION_KEY];
    throw error;
  });

  return globalThis[REGISTRATION_KEY];
}
