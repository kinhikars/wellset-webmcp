import test from "node:test";
import assert from "node:assert/strict";
import { INNER_WELLS } from "../src/domain.js";
import { plateStore } from "../src/store.js";

const REGISTRATION_KEY = Symbol.for("wellset.webmcp.registration");

function clearTestState() {
  plateStore.reset();
  delete global.document;
  delete globalThis[REGISTRATION_KEY];
}

test("registers exactly three static WebMCP tools with narrow schemas", async () => {
  const registrations = [];
  const registrationOptions = [];
  global.document = {
    modelContext: {
      async registerTool(definition, options) {
        registrations.push(definition);
        registrationOptions.push(options);
      },
    },
  };

  try {
    const { registerWebMCPTools } = await import(`../src/webmcp.js?test=${Date.now()}`);
    const status = await registerWebMCPTools();

    assert.equal(status.registered, true);
    assert.deepEqual(registrations.map((tool) => tool.name), [
      "wellset_inspect_plate",
      "wellset_generate_layout",
      "wellset_reflow_unlocked",
    ]);
    assert.ok(registrations.every((tool) => tool.inputSchema.additionalProperties === false));
    assert.ok(registrationOptions.every(({ signal }) => signal instanceof AbortSignal));
    assert.ok(registrationOptions.every(({ signal }) => signal === registrationOptions[0].signal));
    assert.equal(registrationOptions[0].signal.aborted, false);
    assert.equal(registrations[0].annotations.readOnlyHint, true);
    assert.equal(registrations[1].annotations?.readOnlyHint, undefined);
    assert.equal(registrations[2].annotations?.readOnlyHint, undefined);

    const generation = await registrations[1].execute({});
    assert.equal(generation.state.valid, true);
    assert.equal(generation.receipt.operation, "generate_layout");
    const inspection = await registrations[0].execute({});
    assert.equal(inspection.revision, generation.state.revision);
    await assert.rejects(() => registrations[2].execute({ unexpected: true }), TypeError);
  } finally {
    clearTestState();
  }
});

test("reflow returns a compact verifiable result for the supported hero flow", async () => {
  const registrations = [];
  global.document = {
    modelContext: {
      async registerTool(definition) {
        registrations.push(definition);
      },
    },
  };

  try {
    const { registerWebMCPTools } = await import(`../src/webmcp.js?test=${Date.now()}`);
    await registerWebMCPTools();

    const generate = registrations.find(({ name }) => name === "wellset_generate_layout");
    const reflow = registrations.find(({ name }) => name === "wellset_reflow_unlocked");
    await generate.execute({});
    plateStore.toggleLock("B2");
    plateStore.toggleLock("B3");
    plateStore.toggleBlock("B6");
    plateStore.toggleBlock("B7");

    const result = await reflow.execute({});
    assert.equal(result.status, "success");
    assert.deepEqual(result.revisions, { before: 5, after: 6 });
    assert.equal(result.moved.count, 24);
    assert.deepEqual(result.moved.wells[0], ["B6", "B8"]);
    assert.deepEqual(result.preservedLockedWells, ["B2", "B3"]);
    assert.deepEqual(result.violations, { before: 2, after: 0 });
    assert.equal(result.valid, true);
    assert.equal("state" in result, false);
    assert.ok(JSON.stringify(result).length < 1500);
  } finally {
    clearTestState();
  }
});

test("reflow returns compact structured no-op and failure results", async () => {
  const registrations = [];
  global.document = {
    modelContext: {
      async registerTool(definition) {
        registrations.push(definition);
      },
    },
  };

  try {
    const { registerWebMCPTools } = await import(`../src/webmcp.js?test=${Date.now()}`);
    await registerWebMCPTools();
    const generate = registrations.find(({ name }) => name === "wellset_generate_layout");
    const reflow = registrations.find(({ name }) => name === "wellset_reflow_unlocked");

    await generate.execute({});
    const noOp = await reflow.execute({});
    assert.equal(noOp.status, "no_op");
    assert.deepEqual(noOp.revisions, { before: 1, after: 1 });
    assert.deepEqual(noOp.violations, { before: 0, after: 0 });
    assert.equal(noOp.valid, true);

    for (let index = 0; index < INNER_WELLS.length - 1; index += 1) {
      plateStore.toggleBlock(INNER_WELLS[index]);
    }
    const failure = await reflow.execute({});
    assert.equal(failure.status, "failure");
    assert.equal(failure.moved.count, 0);
    assert.equal(failure.valid, false);
    assert.equal(failure.error.code, "insufficient_capacity");
    assert.ok(failure.error.violationCodes.includes("insufficient_capacity"));
    assert.ok(JSON.stringify(failure).length < 1500);
  } finally {
    clearTestState();
  }
});

test("malformed WebMCP inputs are rejected", async () => {
  const registrations = [];
  global.document = {
    modelContext: {
      async registerTool(definition) {
        registrations.push(definition);
      },
    },
  };

  try {
    const { registerWebMCPTools } = await import(`../src/webmcp.js?test=${Date.now()}`);
    await registerWebMCPTools();

    const inputs = [null, 42, "string", [1, 2], { a: 1 }];
    for (const input of inputs) {
      for (const tool of registrations) {
        await assert.rejects(() => tool.execute(input), TypeError);
      }
    }
  } finally {
    clearTestState();
  }
});

test("registration singleton prevents duplicates across calls and remounts", async () => {
  const registrations = [];
  global.document = {
    modelContext: {
      async registerTool(definition) {
        registrations.push(definition);
      },
    },
  };

  try {
    const { registerWebMCPTools } = await import(`../src/webmcp.js?test=${Date.now()}`);
    const remount = await import(`../src/webmcp.js?remount=${Date.now()}`);
    const [first, concurrent] = await Promise.all([registerWebMCPTools(), registerWebMCPTools()]);
    const second = await remount.registerWebMCPTools();
    assert.equal(first.registered, true);
    assert.equal(concurrent.registered, true);
    assert.equal(second.registered, true);
    assert.equal(registrations.length, 3);
  } finally {
    clearTestState();
  }
});

test("partial registration failure aborts the batch and permits a clean retry", async () => {
  const activeRegistrations = [];
  const attemptedSignals = [];
  let callCount = 0;
  global.document = {
    modelContext: {
      async registerTool(definition, { signal }) {
        callCount += 1;
        attemptedSignals.push(signal);
        if (callCount === 2) throw new Error("synthetic registration failure");
        const registration = { definition, signal };
        activeRegistrations.push(registration);
        signal.addEventListener("abort", () => {
          const index = activeRegistrations.indexOf(registration);
          if (index >= 0) activeRegistrations.splice(index, 1);
        }, { once: true });
      },
    },
  };

  try {
    const { registerWebMCPTools } = await import(`../src/webmcp.js?test=${Date.now()}`);
    await assert.rejects(registerWebMCPTools(), /synthetic registration failure/);
    assert.equal(attemptedSignals[0].aborted, true);
    assert.equal(activeRegistrations.length, 0);

    const retry = await registerWebMCPTools();
    assert.equal(retry.registered, true);
    assert.equal(activeRegistrations.length, 3);
    assert.deepEqual(activeRegistrations.map(({ definition }) => definition.name), [
      "wellset_inspect_plate",
      "wellset_generate_layout",
      "wellset_reflow_unlocked",
    ]);
    assert.ok(activeRegistrations.every(({ signal }) => signal === activeRegistrations[0].signal));
    assert.notEqual(activeRegistrations[0].signal, attemptedSignals[0]);

    await registerWebMCPTools();
    assert.equal(activeRegistrations.length, 3);
  } finally {
    clearTestState();
  }
});
