/** @typedef {{ accumulated: number, startedAt: number | null }} Stopwatch */

/** @returns {Stopwatch} */
export function newStopwatch() {
  return { accumulated: 0, startedAt: null };
}

/** @param {Stopwatch} state @param {number} now */
export function elapsed(state, now) {
  return (
    state.accumulated + (state.startedAt === null ? 0 : now - state.startedAt)
  );
}

/** @param {Stopwatch} state @param {number} now @returns {Stopwatch} */
export function start(state, now) {
  return state.startedAt === null ? { ...state, startedAt: now } : state;
}

/** @param {Stopwatch} state @param {number} now @returns {Stopwatch} */
export function pause(state, now) {
  return state.startedAt === null
    ? state
    : { accumulated: elapsed(state, now), startedAt: null };
}

/** @param {number} milliseconds */
export function formatElapsed(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return [
    Math.floor(seconds / 3600),
    Math.floor(seconds / 60) % 60,
    seconds % 60,
  ]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}
