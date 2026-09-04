import { ALL_WELLS, COLUMNS, EXPERIMENT_BY_ID, ROWS } from "./domain.js";
import { plateStore } from "./store.js";
import { getWebMCPStatus, registerWebMCPTools } from "./webmcp.js";

const root = document.querySelector("#app");
let editMode = "lock";
let toolStatus = getWebMCPStatus();

function escape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function groupClass(experiment) {
  if (!experiment) return "";
  if (experiment.kind === "control") return "well--control";
  const index = ["Baseline", "Compound A", "Compound B", "Compound C"].indexOf(experiment.group);
  return `well--group-${index + 1}`;
}

function receiptText(receipt) {
  if (!receipt) return "No operation yet";
  if (receipt.operation === "generate_layout") return `${receipt.assignedCount} experiments placed · ${receipt.violationCount} violations`;
  if (receipt.operation === "reflow_unlocked") {
    if (receipt.noOp) return `No movement required · ${receipt.violationCount} violations`;
    return `${receipt.movedWells.length} wells moved · ${receipt.preservedLocks.length} locks preserved · ${receipt.violationCount} violations`;
  }
  if (receipt.operation === "lock_well") return `${receipt.wellId} protected · ${receipt.violationCount} violations`;
  if (receipt.operation === "unlock_well") return `${receipt.wellId} unlocked · ${receipt.violationCount} violations`;
  if (receipt.operation === "block_well") return `${receipt.wellId} blocked · ${receipt.violationCount} violations`;
  if (receipt.operation === "unblock_well") return `${receipt.wellId} reopened · ${receipt.violationCount} violations`;
  return receipt.operation.replaceAll("_", " ");
}

function render(state) {
  const invalidWells = new Set(state.validation.violations.map((violation) => violation.wellId).filter(Boolean));
  const empty = Object.keys(state.assignments).length === 0;
  const webMCPClass = toolStatus.registered ? "status-dot--ok" : toolStatus.supported ? "status-dot--waiting" : "status-dot--off";

  root.innerHTML = `
    <header class="topbar">
      <div class="brand"><span class="brand-mark" aria-hidden="true">WS</span><span>WellSet</span></div>
      <p class="thesis">Human judgment. Agent precision. Better experiments.</p>
      <div class="webmcp-status" title="The page exposes three imperative WebMCP tools when the browser supports them.">
        <span class="status-dot ${webMCPClass}"></span>${escape(toolStatus.label)}
      </div>
    </header>

    <section class="explanation" aria-label="How to read the plate">
      <strong>Each cell is one experiment.</strong> Position can bias results. Locked cells cannot move.
      <div class="legend">
        <span><i class="legend-swatch legend-swatch--sample"></i>Experiment</span>
        <span><i class="legend-symbol">●</i>Control</span>
        <span><i class="legend-symbol">⌑</i>Locked</span>
        <span><i class="legend-swatch legend-swatch--blocked"></i>Blocked</span>
        <span><i class="legend-swatch legend-swatch--invalid"></i>Violation</span>
      </div>
    </section>

    <section class="workspace">
      <aside class="panel brief-panel">
        <p class="eyebrow">Experiment brief</p>
        <h1>Compound response study</h1>
        <p class="panel-copy">Compare a baseline with three compounds while keeping controls stable and avoiding edge bias.</p>
        <dl class="metrics">
          <div><dt>Format</dt><dd>96 wells</dd></div>
          <div><dt>Experiments</dt><dd>28</dd></div>
          <div><dt>Controls</dt><dd>4</dd></div>
          <div><dt>Replicates</dt><dd>6 × 4</dd></div>
        </dl>

        <div class="human-controls">
          <p class="eyebrow">Human edit mode</p>
          <div class="segmented" role="group" aria-label="Plate editing mode">
            <button data-mode="lock" class="${editMode === "lock" ? "active" : ""}" aria-pressed="${editMode === "lock"}">Lock</button>
            <button data-mode="block" class="${editMode === "block" ? "active" : ""}" aria-pressed="${editMode === "block"}">Block</button>
          </div>
          <p class="mode-help">${editMode === "lock" ? "Select occupied wells the agent must preserve." : "Select wells that cannot be used."}</p>
        </div>

        <div class="button-stack">
          <button class="button button--primary" data-action="generate">Generate deterministic layout</button>
          <button class="button" data-action="reflow" ${empty ? "disabled" : ""}>Reflow unlocked wells</button>
          <button class="button button--quiet" data-action="reset">Reset workspace</button>
        </div>
      </aside>

      <section class="plate-section" aria-label="96-well experiment plate">
        <div class="plate-header">
          <div>
            <p class="eyebrow">Live shared artifact</p>
            <h2>Plate A</h2>
          </div>
          <div class="validation ${empty ? "validation--waiting" : state.validation.valid ? "validation--valid" : "validation--invalid"}">
            <span class="validation-count">${empty ? "—" : state.validation.violations.length}</span>
            <span>${empty ? "awaiting layout" : state.validation.violations.length === 1 ? "violation" : "violations"}</span>
          </div>
        </div>

        <div class="plate-shell ${empty ? "plate-shell--empty" : ""}">
          <div class="plate-grid">
            <span class="axis-corner"></span>
            ${COLUMNS.map((column) => `<span class="axis-label">${column}</span>`).join("")}
            ${ROWS.map((row) => `
              <span class="axis-label">${row}</span>
              ${COLUMNS.map((column) => {
                const wellId = `${row}${column}`;
                const experiment = EXPERIMENT_BY_ID.get(state.assignments[wellId]);
                const locked = state.lockedWells.includes(wellId);
                const blocked = state.blockedWells.includes(wellId);
                const invalid = invalidWells.has(wellId);
                const moved = state.lastMovedWells.includes(wellId);
                const classes = ["well", groupClass(experiment), locked && "well--locked", blocked && "well--blocked", invalid && "well--invalid", moved && "well--moved"].filter(Boolean).join(" ");
                const label = `${wellId}${experiment ? `: ${experiment.label}` : ": empty"}${locked ? ", locked" : ""}${blocked ? ", blocked" : ""}${invalid ? ", invalid" : ""}`;
                return `<button class="${classes}" data-well="${wellId}" aria-label="${escape(label)}" title="${escape(label)}">
                  <span class="well-id">${wellId}</span>
                  ${experiment ? `<span class="well-code">${experiment.kind === "control" ? "C" : experiment.group.replace("Compound ", "").slice(0, 2)}</span>` : ""}
                  ${locked ? '<span class="well-lock" aria-hidden="true">⌑</span>' : ""}
                  ${blocked ? '<span class="well-block" aria-hidden="true">×</span>' : ""}
                </button>`;
              }).join("")}
            `).join("")}
          </div>
          ${empty ? '<div class="empty-state"><strong>Plate awaiting a layout</strong><span>Ask your agent to generate one, or use the button at left.</span></div>' : ""}
        </div>
      </section>

      <aside class="panel activity-panel">
        <div class="activity-heading">
          <div><p class="eyebrow">Verified activity</p><h2>Operation receipt</h2></div>
          <span class="revision">rev ${state.revision}</span>
        </div>
        <div class="receipt ${state.lastReceipt ? "receipt--active" : ""}">
          <span class="receipt-icon" aria-hidden="true">${state.lastReceipt ? (state.validation.valid ? "✓" : "!") : "·"}</span>
          <p>${escape(receiptText(state.lastReceipt))}</p>
        </div>
        <div class="constraint-list">
          <div><span>Locked assignments</span><strong>${state.lockedWells.length}</strong></div>
          <div><span>Blocked wells</span><strong>${state.blockedWells.length}</strong></div>
          <div><span>Occupied wells</span><strong>${Object.keys(state.assignments).length}</strong></div>
        </div>
        <div class="violations-list">
          <p class="eyebrow">Validation</p>
          ${state.validation.violations.length === 0
            ? '<p class="all-clear"><span>✓</span> All constraints satisfied</p>'
            : state.validation.violations.slice(0, 5).map((violation) => `<p class="violation-row"><span>${escape(violation.wellId ?? "—")}</span>${escape(violation.message)}</p>`).join("")}
        </div>
        <div class="agent-prompt">
          <p class="eyebrow">Try with your agent</p>
          <p>“Reflow around my blocked wells without moving the locked controls.”</p>
        </div>
      </aside>
    </section>
  `;
}

root.addEventListener("click", (event) => {
  const modeButton = event.target.closest("[data-mode]");
  if (modeButton) {
    editMode = modeButton.dataset.mode;
    render(plateStore.getState());
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    const action = actionButton.dataset.action;
    if (action === "generate") plateStore.generate();
    if (action === "reflow") plateStore.reflow();
    if (action === "reset") plateStore.reset();
    return;
  }

  const wellButton = event.target.closest("[data-well]");
  if (!wellButton) return;
  if (editMode === "lock") plateStore.toggleLock(wellButton.dataset.well);
  else plateStore.toggleBlock(wellButton.dataset.well);
});

plateStore.subscribe(render);
render(plateStore.getState());

registerWebMCPTools()
  .then((status) => {
    toolStatus = status;
    render(plateStore.getState());
  })
  .catch((error) => {
    console.error("WellSet could not register WebMCP tools.", error);
    toolStatus = { supported: true, registered: false, label: "Tool registration failed" };
    render(plateStore.getState());
  });
