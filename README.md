# <img src="assets/wellset-mark.svg" alt="WellSet mark" width="36" height="36" valign="middle" /> WellSet

**Human judgment. Agent precision. Better experiments.**

WellSet is a mixed-initiative experiment-layout canvas built for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/). A scientist edits the visual plate; a browser agent works through semantic WebMCP tools; both operate on the same live, validated state.

**[Live Application](https://wellset-webmcp.vercel.app/)** · **[Evaluation Report](docs/EVALS.md)** · **[PRD](docs/PRD.md)** · **[Architecture](docs/ARCHITECTURE.md)** · **[Security](SECURITY.md)** · **[Contributing](CONTRIBUTING.md)** · **[License](LICENSE)**

The demonstration uses a 96-well plate because spatial choices matter: edge positions can bias results, some wells become unavailable, and deliberate control placements should not move. The human supplies that contextual judgment. The agent performs a deterministic reflow around it—moving 24 placements and protecting two locked controls while reducing violations from two to zero.

> **Status:** competition vertical slice. WellSet is not validated for clinical or production laboratory use.

## Verified evidence

The evaluated application release ([`d3d05d51c658c1eda5c5eff3c7373e16197317f8`](https://github.com/kinhikars/wellset-webmcp/commit/d3d05d51c658c1eda5c5eff3c7373e16197317f8)) was verified across automated implementation tests and live browser-agent evaluation. Full details and methodology are documented in [docs/EVALS.md](docs/EVALS.md).

- **136/136 automated tests** passing in CI across domain invariants, schema bounds, and lifecycle safety.
- **5/5 fresh real ChatGPT Site Tools trials passed** in the live environment using GPT-5.6 Terra Light on the canonical scenario.
- **All three tools discovered in 5/5** sessions.
- **Correct autonomous operation selected in 5/5** sessions without naming tools in the prompt.
- **Locked controls preserved in 5/5** executions.
- **Violations reduced from 2 to 0 in 5/5** executions.
- **Receipt matched the UI in 5/5** executions.
- **Median completion time 38 seconds** across live agent trials.

*Note: This evaluation consists of five recorded trials using one model and one canonical scenario. The original ten-trial target was not completed for this release evaluation.*

## The 30-second interaction

1. Ask the agent to generate the experiment layout.
2. Lock two occupied controls in the visual interface.
3. Block two occupied sample wells. They become two visible violations.
4. Ask: **“Reflow around my blocked wells without moving the locked controls.”**
5. The agent invokes one tool. Unlocked samples move, the controls stay fixed, and the display changes from **2 violations → 0**.

This is the central WebMCP claim: human edits are not annotations outside the agent's task. They become operative constraints in the semantic state the next tool call reads.

## Why WebMCP

DOM automation could attempt to infer dozens of cells, visual states, locks, and validation messages. A remote MCP server could modify data, but it would not inherently share the live visual artifact the scientist is judging. WebMCP joins those two surfaces:

- people retain a spatial interface for judgment and intervention;
- agents receive narrow semantic operations rather than brittle click targets;
- both act on the same in-page state and can verify the same result.

WellSet progressively enhances a normal website. All human controls still work when WebMCP is unavailable.

## Site tools

The page statically registers three top-level imperative tools with [`document.modelContext.registerTool()`](https://learn.chatgpt.com/docs/webmcp):

| Tool | Side effect | Purpose |
|---|---:|---|
| `wellset_inspect_plate` | None | Read assignments, locks, blocks, revision and violations |
| `wellset_generate_layout` | Replaces layout | Generate and validate the deterministic scenario atomically |
| `wellset_reflow_unlocked` | Reflows layout | Preserve locks, avoid blocked wells, reflow and validate atomically |

Tool names, descriptions, and schemas remain static. Live state belongs in the store and tool results—not in the registry. Every mutation automatically runs the same pure validator used by the visual interface.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run verify
npm run serve
```

Open `http://localhost:4173`.

The application has zero runtime dependencies. `npm install` creates the lockfile used by CI; the server and test runner use Node platform modules.

## Test with WebMCP

### Chrome testing environment

1. Use a Chrome version that includes the WebMCP testing flag.
2. Open `chrome://flags/#enable-webmcp-testing`.
3. Enable **WebMCP for testing** and relaunch.
4. Open the locally served or HTTPS-deployed WellSet page.
5. Inspect the registered tools through the supported WebMCP developer surface.

### ChatGPT Site Tools

1. Use the latest ChatGPT desktop app with a supported account.
2. Enable **Settings → Browser → Permissions → Enable site tools**.
3. Use GPT-5.6 Sol or GPT-5.6 Terra.
4. Open the deployed page in ChatGPT's built-in browser.
5. Inspect **Available site tools** and invoke the hero prompt above.

ChatGPT currently discovers imperative tools registered in the top-level page. Declarative tools and tools inside iframes are not part of this implementation because they are not currently supported by ChatGPT Site Tools.

## Reliability properties

- deterministic placement and tie-breaking;
- one authoritative external store;
- tool handlers read current state at execution time;
- static singleton tool registration;
- atomic mutation plus validation;
- idempotent reflow on an already-valid plate;
- narrow closed input schemas;
- JSON-serializable verification receipts;
- more than 120 deterministic invariant scenarios in the test suite.

Run the complete verification suite:

```bash
npm run verify
```

## Repository map

```text
src/domain.js       plate model, validation, generation and reflow
src/store.js        authoritative live state
src/webmcp.js       static imperative Site Tools registration
src/app.js          human interface and shared-state rendering
tests/              domain invariants and registration contract
docs/EVALS.md       live Site Tools evaluation and benchmark methodology
docs/ARCHITECTURE.md architecture and transaction boundaries
docs/DECISIONS.md    competition decision record
AGENTS.md            constraints for coding agents and contributors
```

## Security and limitations

The public demo contains no authentication, backend, uploads, tracking, external data, or AI API calls. Tool inputs are validated by the page, and mutation results contain enough state to verify the outcome. Browser safety review and user-confirmation policies still apply.

The current layout policy is deliberately small and deterministic. It demonstrates trustworthy mixed-initiative execution; it does not replace laboratory protocol design, regulatory review, or validated liquid-handling software. See [SECURITY.md](SECURITY.md) and [the architecture notes](docs/ARCHITECTURE.md).

## License

[MIT](LICENSE) © 2026 Ajinkya Kinhikar
