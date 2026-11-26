import { element } from "../shared/dom.js";
import { generatePassword } from "./logic.js";

const length = element("slider", HTMLInputElement);
const value = element("valor-tamanho", HTMLElement);
const options = element("tipos", HTMLFieldSetElement);
const display = element("senha", HTMLElement);
const status = element("status", HTMLElement);
const generate = element("gerar", HTMLButtonElement);
const copy = element("copiar", HTMLButtonElement);
let password = "";
let copyRequest = 0;

function selected() {
  return Array.from(
    options.querySelectorAll("input:checked"),
    (input) =>
      /** @type {import("./logic.js").CharacterClass} */ (
        /** @type {HTMLInputElement} */ (input).value
      ),
  );
}

function refreshOptions() {
  generate.disabled = !selected().length;
  status.textContent = generate.disabled
    ? "Escolha pelo menos um tipo de caractere."
    : "";
}

function refreshPassword() {
  copyRequest++;
  try {
    password = generatePassword(length.valueAsNumber, selected());
    display.textContent = password;
    status.textContent = "";
  } catch {
    password = "";
    display.textContent = "…";
    status.textContent = "Não foi possível gerar uma senha com segurança.";
  }
  copy.disabled = !password;
}

length.addEventListener("input", () => (value.textContent = length.value));
options.addEventListener("change", refreshOptions);
generate.addEventListener("click", refreshPassword);
copy.addEventListener("click", async () => {
  const request = ++copyRequest;
  try {
    await navigator.clipboard.writeText(password);
    if (request === copyRequest) status.textContent = "Senha copiada.";
  } catch {
    if (request === copyRequest)
      status.textContent =
        "Não foi possível copiar. Selecione a senha e copie manualmente.";
  }
});

refreshOptions();
if (!generate.disabled) refreshPassword();
