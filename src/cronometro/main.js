import { element } from "../shared/dom.js";
import { elapsed, formatElapsed, newStopwatch, pause, start } from "./logic.js";

const display = element("display", HTMLElement);
const startButton = element("iniciar", HTMLButtonElement);
const pauseButton = element("pausar", HTMLButtonElement);
const resetButton = element("zerar", HTMLButtonElement);
let state = newStopwatch();
let timer = 0;

function render() {
  const milliseconds = elapsed(state, performance.now());
  display.textContent = formatElapsed(milliseconds);
  if (state.startedAt !== null) {
    timer = window.setTimeout(render, 1000 - (milliseconds % 1000));
  }
}

function refresh() {
  window.clearTimeout(timer);
  startButton.disabled = state.startedAt !== null;
  pauseButton.disabled = state.startedAt === null;
  resetButton.disabled = state.startedAt === null && state.accumulated === 0;
  render();
}

startButton.addEventListener("click", () => {
  state = start(state, performance.now());
  refresh();
  pauseButton.focus();
});

pauseButton.addEventListener("click", () => {
  state = pause(state, performance.now());
  refresh();
  startButton.focus();
});

resetButton.addEventListener("click", () => {
  state = newStopwatch();
  refresh();
  startButton.focus();
});

refresh();
