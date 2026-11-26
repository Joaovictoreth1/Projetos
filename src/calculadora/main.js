import { element } from "../shared/dom.js";
import { evaluate } from "./logic.js";

const display = element("display", HTMLInputElement);
const announcement = element("resultado", HTMLElement);
const buttons = element("botoes", HTMLElement);
let evaluated = false;

/** @param {string} key */
function press(key) {
  if (key === "Escape") {
    display.value = "";
    announcement.textContent = "";
    evaluated = false;
  } else if (key === "Backspace") {
    display.value = display.value === "Erro" ? "" : display.value.slice(0, -1);
    announcement.textContent = "";
    evaluated = false;
  } else if (key === "Enter" || key === "=") {
    display.value = evaluate(display.value);
    announcement.textContent =
      display.value === "Erro" ? "Erro" : `Resultado: ${display.value}`;
    evaluated = true;
  } else {
    if (display.value === "Erro" || (evaluated && /^[0-9.]$/.test(key)))
      display.value = "";
    display.value += key;
    announcement.textContent = "";
    evaluated = false;
  }
}

for (const button of buttons.querySelectorAll("button")) {
  button.addEventListener("click", () => press(button.value));
}

document.addEventListener("keydown", (event) => {
  if (
    event.defaultPrevented ||
    event.isComposing ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;
  if (event.key === "Enter" && event.target instanceof HTMLButtonElement)
    return;
  if (
    /^[0-9.+*/=-]$/.test(event.key) ||
    ["Enter", "Backspace", "Escape"].includes(event.key)
  ) {
    event.preventDefault();
    press(event.key);
  }
});
