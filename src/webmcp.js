import { snapshot } from "./domain.js";
import { plateStore } from "./store.js";

const REGISTRATION_KEY = Symbol.for("wellset.webmcp.registration");
const emptySchema = Object.freeze({ type: "object", properties: {}, additionalProperties: false });

function receiptWithSnapshot(receipt) {
  return { receipt: structuredClone(receipt), state: snapshot(plateStore.getState()) };
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
    });

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
    });

    await document.modelContext.registerTool({
      name: "wellset_reflow_unlocked",
      description: "Reflow the current WellSet plate around human-blocked wells without moving human-locked assignments. The operation validates the result atomically and is an idempotent no-op when no movement is required.",
      inputSchema: emptySchema,
      execute: async (input = {}) => {
        if (input === null || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length > 0) {
          throw new TypeError("wellset_reflow_unlocked accepts an empty object only.");
        }
        const next = plateStore.reflow();
        return receiptWithSnapshot(next.lastReceipt);
      },
    });

    return { supported: true, registered: true, label: "3 site tools registered" };
  })().catch((error) => {
    delete globalThis[REGISTRATION_KEY];
    throw error;
  });

  return globalThis[REGISTRATION_KEY];
}
