import { createEmptyState, generateLayout, reflowUnlocked, toggleBlock, toggleLock } from "./domain.js";

let state = createEmptyState();
const listeners = new Set();

function publish(nextState) {
  state = nextState;
  for (const listener of listeners) listener(state);
  return state;
}

export const plateStore = Object.freeze({
  getState: () => state,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  generate: () => publish(generateLayout(state)),
  reflow: () => publish(reflowUnlocked(state)),
  toggleLock: (wellId) => publish(toggleLock(state, wellId)),
  toggleBlock: (wellId) => publish(toggleBlock(state, wellId)),
  reset: () => publish(createEmptyState()),
});
