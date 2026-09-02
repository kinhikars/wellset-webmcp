import test from "node:test";
import assert from "node:assert/strict";

test("registers exactly three static WebMCP tools with narrow schemas", async () => {
  const registrations = [];
  global.document = {
    modelContext: {
      async registerTool(definition) {
        registrations.push(definition);
      },
    },
  };

  const { registerWebMCPTools } = await import(`../src/webmcp.js?test=${Date.now()}`);
  const status = await registerWebMCPTools();

  assert.equal(status.registered, true);
  assert.deepEqual(registrations.map((tool) => tool.name), [
    "wellset_inspect_plate",
    "wellset_generate_layout",
    "wellset_reflow_unlocked",
  ]);
  assert.ok(registrations.every((tool) => tool.inputSchema.additionalProperties === false));
  assert.equal(registrations[0].annotations.readOnlyHint, true);
  assert.equal(registrations[1].annotations?.readOnlyHint, undefined);
  assert.equal(registrations[2].annotations?.readOnlyHint, undefined);

  const generation = await registrations[1].execute({});
  assert.equal(generation.state.valid, true);
  assert.equal(generation.receipt.operation, "generate_layout");
  const inspection = await registrations[0].execute({});
  assert.equal(inspection.revision, generation.state.revision);
  await assert.rejects(() => registrations[2].execute({ unexpected: true }), TypeError);

  delete global.document;
  delete globalThis[Symbol.for("wellset.webmcp.registration")];
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

  const { registerWebMCPTools } = await import(`../src/webmcp.js?test=${Date.now()}`);
  await registerWebMCPTools();

  const inputs = [null, 42, "string", [1, 2], { a: 1 }];
  for (const input of inputs) {
    for (const tool of registrations) {
      await assert.rejects(() => tool.execute(input), TypeError);
    }
  }

  delete global.document;
  delete globalThis[Symbol.for("wellset.webmcp.registration")];
});

test("duplicate tool registration returns existing promise", async () => {
  const registrations = [];
  global.document = {
    modelContext: {
      async registerTool(definition) {
        registrations.push(definition);
      },
    },
  };

  const { registerWebMCPTools } = await import(`../src/webmcp.js?test=${Date.now()}`);
  const first = await registerWebMCPTools();
  const second = await registerWebMCPTools();
  assert.equal(first.registered, true);
  assert.equal(second.registered, true);
  assert.equal(registrations.length, 3);

  delete global.document;
});
