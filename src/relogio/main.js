import { element } from "../shared/dom.js";
import { delayToNextSecond, formatClock } from "./logic.js";

const time = element("tempo", HTMLElement);
const date = element("data", HTMLElement);

function tick() {
  const now = new Date();
  const display = formatClock(now);
  time.textContent = display.time;
  date.textContent = display.date;
  setTimeout(tick, delayToNextSecond(Date.now()));
}

tick();
